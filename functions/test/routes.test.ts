import { beforeEach,describe,it,expect,vi } from 'vitest';
import { FakeFirestore } from './fakeFirestore.js';
const state=vi.hoisted(()=>({db:null as any}));
vi.mock('firebase-admin/firestore',()=>({getFirestore:()=>state.db,Timestamp:{now:()=>new Date(),fromDate:(value:Date)=>value}}));
vi.mock('../src/config.js',()=>({DAILY_USER_JOB_LIMIT:{value:()=> '40'},DAILY_ORG_JOB_LIMIT:{value:()=> '400'},AUDIT_LOG_RETENTION_DAYS:{value:()=> '90'}}));
import router from '../src/routes/clinical.js';
import { exportAccountPage } from '../src/services/accountExport.js';
import { medicationEvidence } from '../src/services/medicationEvidence.js';
import { stableId } from '../src/services/clinicalPolicy.js';
import { CONSENT_VERSION } from '../src/contracts/clinical.js';
const db=new FakeFirestore();state.db=db;
const uid='user-1';const organizationId='org-1';
function invoke(method:string,path:string,body:unknown={},extra:Record<string,unknown>={}) {
  return new Promise<{status:number;body:any}>((resolve,reject)=>{
    const layer=(router as any).stack.find((item:any)=>item.route?.path===path&&item.route.methods[method]);
    if(!layer)return reject(new Error('Route not found '+path));
    let status=200;const res={status:(code:number)=>{status=code;return res;},json:(value:any)=>resolve({status,body:value}),setHeader:()=>undefined};
    const req={body,uid,clinical:{verifiedClinician:true,clinicalRole:'doctor',organizationId},authTime:Date.now()/1000,query:{},params:{id:'enc-1'},...extra};
    layer.route.stack.at(-1).handle(req,res,reject);
  });
}
beforeEach(()=>{db.clear();db.records.set('consents/'+uid,{version:CONSENT_VERSION,clinicalProcessing:true});db.records.set('encounters/enc-1',{id:'enc-1',ownerUid:uid,organizationId,triage:'no_red_flags',status:'draft',latestDocumentId:'doc-1',createdAt:new Date().toISOString()});db.records.set('documents/doc-1',{id:'doc-1',encounterId:'enc-1',ownerUid:uid,organizationId,expiresAt:new Date(Date.now()+60_000).toISOString(),pages:[{id:'page-1',sha256:'a'.repeat(64)}]});});
describe('durable API transitions',()=>{
  it('records immutable consent events and withdraws upload permission',async()=>{
    const result=await invoke('post','/consent',{version:CONSENT_VERSION,clinicalProcessing:false,optionalAnalytics:false});expect(result.body.consent.withdrawnAt).toBeTruthy();expect(db.records.get('clinical_memberships/'+uid)?.clinicalProcessing).toBe(false);expect([...db.records.keys()].some(key=>key.startsWith('consent_events/'))).toBe(true);
    await expect(invoke('post','/jobs',{encounterId:'enc-1',documentId:'doc-1',kind:'ocr',idempotencyKey:'one'})).rejects.toMatchObject({code:'CONSENT_REQUIRED'});
  });
  it('submits a durable job once for a retried idempotency key and charges quota once',async()=>{
    const request={encounterId:'enc-1',documentId:'doc-1',kind:'ocr',idempotencyKey:'one'};
    const first=await invoke('post','/jobs',request);const second=await invoke('post','/jobs',request);
    expect(first.status).toBe(202);expect(second.body.id).toBe(first.body.id);expect([...db.records.keys()].filter(key=>key.startsWith('jobs/'))).toHaveLength(1);
    expect([...db.records].filter(([key])=>key.startsWith('daily_budgets/')).map(([,data])=>data.used)).toEqual([1,1]);
    await expect(invoke('post','/jobs',{...request,kind:'analysis',transcriptionId:'t1'})).rejects.toMatchObject({code:'IDEMPOTENCY_CONFLICT'});
  });
  it('serializes encounter jobs and fails closed on either user or organization quota',async()=>{
    const request={encounterId:'enc-1',documentId:'doc-1',kind:'ocr',idempotencyKey:'one'};await invoke('post','/jobs',request);
    await expect(invoke('post','/jobs',{...request,idempotencyKey:'two'})).rejects.toMatchObject({code:'JOB_IN_PROGRESS'});
    db.records.get('encounters/enc-1')!.activeJobId=undefined;
    db.records.get('encounters/enc-1')!.status='draft';
    const day=new Date().toISOString().slice(0,10);db.records.set('daily_budgets/'+stableId('uid',uid,day),{used:40});
    await expect(invoke('post','/jobs',{...request,idempotencyKey:'three'})).rejects.toMatchObject({code:'DAILY_BUDGET_EXCEEDED'});
    db.records.set('daily_budgets/'+stableId('uid',uid,day),{used:0});db.records.set('daily_budgets/'+stableId('org',organizationId,day),{used:400});
    await expect(invoke('post','/jobs',{...request,idempotencyKey:'four'})).rejects.toMatchObject({code:'DAILY_BUDGET_EXCEEDED'});
  });
  it('rejects cross-owner sources and missing OCR confirmation',async()=>{
    db.records.get('documents/doc-1')!.ownerUid='someone-else';
    await expect(invoke('post','/jobs',{encounterId:'enc-1',documentId:'doc-1',kind:'ocr',idempotencyKey:'one'})).rejects.toMatchObject({code:'NOT_FOUND'});
    db.records.get('documents/doc-1')!.ownerUid=uid;
    db.records.get('encounters/enc-1')!.status='transcription_review';
    await expect(invoke('post','/jobs',{encounterId:'enc-1',documentId:'doc-1',kind:'analysis',transcriptionId:'unreviewed',idempotencyKey:'two'})).rejects.toMatchObject({code:'TRANSCRIPTION_REVIEW_REQUIRED'});
  });
  it('creates a review version only from a successful matching OCR job',async()=>{
    db.records.set('jobs/ocr-1',{ownerUid:uid,organizationId,encounterId:'enc-1',documentId:'doc-1',kind:'ocr',status:'succeeded'});
    db.records.get('encounters/enc-1')!.status='transcription_review';
    const result=await invoke('post','/encounters/:id/transcription',{documentId:'doc-1',ocrJobId:'ocr-1',text:'Synthetic corrected value',reviewed:true});expect(result.body.reviewerUid).toBe(uid);expect(result.body.sourceHashes).toEqual(['a'.repeat(64)]);expect(db.records.get('encounters/enc-1')?.latestTranscriptionId).toBe(result.body.id);
    const job=await invoke('post','/jobs',{encounterId:'enc-1',documentId:'doc-1',kind:'analysis',transcriptionId:result.body.id,idempotencyKey:'analysis-one'});expect(job.body.status).toBe('queued');
  });
  it('locks each encounter to one current source manifest',async()=>{
    const encounter=db.records.get('encounters/enc-1')!;
    encounter.latestDocumentId=undefined;
    const input={pages:[{id:'page-two',fileName:'synthetic.png',mimeType:'image/png',sizeBytes:100,sha256:'a'.repeat(64)}]};
    const first=await invoke('post','/encounters/:id/documents',input);
    expect(first.status).toBe(201);
    expect(encounter.latestDocumentId).toBeUndefined();
    expect(db.records.get('encounters/enc-1')?.latestDocumentId).toBe(first.body.id);
    await expect(invoke('post','/encounters/:id/documents',input)).rejects.toMatchObject({code:'ENCOUNTER_LOCKED'});
    await expect(invoke('post','/jobs',{encounterId:'enc-1',documentId:'doc-1',kind:'ocr',idempotencyKey:'stale-source'})).rejects.toMatchObject({code:'STALE_SOURCE'});
  });
  it('prevents signing stale analyses or signing the same analysis twice',async()=>{
    const encounter=db.records.get('encounters/enc-1')!;
    Object.assign(encounter,{status:'review_required',latestTranscriptionId:'trans-2',latestAnalysisId:'analysis-1'});
    db.records.set('analyses/analysis-1',{ownerUid:uid,organizationId,encounterId:'enc-1',documentId:'doc-1',transcriptionId:'trans-1'});
    const input={analysisId:'analysis-1',attested:true,disposition:'accepted',notes:''};
    await expect(invoke('post','/encounters/:id/reviews',input)).rejects.toMatchObject({code:'STALE_ANALYSIS'});
    db.records.get('analyses/analysis-1')!.transcriptionId='trans-2';
    const first=await invoke('post','/encounters/:id/reviews',input);
    expect(first.status).toBe(201);
    await expect(invoke('post','/encounters/:id/reviews',input)).rejects.toMatchObject({code:'STALE_ANALYSIS'});
    expect([...db.records.keys()].filter(key=>key.startsWith('reviews/'))).toHaveLength(1);
  });
  it('rejects a pagination cursor from another organization even for the same user',async()=>{
    db.records.set('encounters/foreign-org',{ownerUid:uid,organizationId:'other-org',createdAt:new Date().toISOString()});
    await expect(invoke('get','/encounters',{}, {query:{cursor:'foreign-org'}})).rejects.toMatchObject({code:'INVALID_CURSOR'});
  });
  it('requires recent login for export/deletion and queues a human request without deleting records',async()=>{
    await expect(invoke('post','/account/deletion-requests',{}, {authTime:Date.now()/1000-301})).rejects.toMatchObject({code:'REAUTHENTICATION_REQUIRED'});
    const result=await invoke('post','/account/deletion-requests',{});expect(result.body.status).toBe('pending_human_review');expect(db.records.has('encounters/enc-1')).toBe(true);expect(db.operations.some(op=>op.startsWith('delete '))).toBe(false);
  });
});
describe('account estate export and approved references',()=>{
  it('includes all retained categories, paginates legacy records, and never exports another account',async()=>{
    for(const id of ['old-1','old-2','old-3']) db.records.set('scans/'+id,{userId:uid,title:'Synthetic historical scan'});
    db.records.set('scans/other',{userId:'someone-else'});
    const first=await exportAccountPage(uid,'legacy_scans',2);expect(first.records.items).toHaveLength(2);expect(first.records.nextCursor).toBe('old-2');
    const second=await exportAccountPage(uid,'legacy_scans',2,first.records.nextCursor!);expect(second.records.items).toHaveLength(1);expect(second.records.nextCursor).toBeNull();expect(second.records.items[0]?.id).toBe('old-3');
    for(const category of ['legacy_patients','consent_events','referral_events','deletion_requests','audit_logs']) expect(first.availableCollections).toContain(category);
    await expect(exportAccountPage(uid,'organizations')).rejects.toMatchObject({code:'INVALID_EXPORT_CURSOR'});
  });
  it('defaults to not_assessed and exposes only approved unexpired cited reference content',async()=>{
    expect((await medicationEvidence(['A','B'],'interaction')).status).toBe('not_assessed');
    const key='medication_evidence/'+stableId('interaction','a','b');db.records.set(key,{approved:false,text:'Do not use'});expect((await medicationEvidence(['A','B'],'interaction')).evidence).toEqual([]);
    db.records.set(key,{approved:true,version:'v1',citation:'https://example.test/reference',reviewedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+60_000).toISOString(),reviewedBy:'pharmacist-1',reviewerRole:'pharmacist',text:'Synthetic reviewed evidence; not clinical advice.'});
    const result=await medicationEvidence(['A','B'],'interaction');expect(result.status).toBe('evidence_available');expect(result.result).toContain('not a patient-specific safety clearance');expect(result.evidence[0]?.version).toBe('v1');
  });
});
