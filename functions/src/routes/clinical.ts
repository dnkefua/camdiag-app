import { Router, type Request, type Response, type NextFunction } from 'express';
import { getFirestore, type DocumentData, type Query } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { verifyAuth, verifyIdentity } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { CONSENT_VERSION, type EncounterDetail } from '../contracts/clinical.js';
import { DAILY_ORG_JOB_LIMIT, DAILY_USER_JOB_LIMIT } from '../config.js';
import { ClinicalError, consentInput, encounterInput, documentInput, jobInput, transcriptionInput, reviewInput, referralInput, requireOwnership, requireAnalysisState, stableId, identifier } from '../services/clinicalPolicy.js';
import { writeAuditLog } from '../services/audit.js';
import { exportAccountPage } from '../services/accountExport.js';

const router = Router();
const db = () => getFirestore();
const now = () => new Date().toISOString();
const body = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new ClinicalError('INVALID_REQUEST', 400, 'Check the required fields and supported document format.');
  return parsed.data;
};
const route = (handler: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => { handler(req, res).catch(next); };
const audit = (req: Request, action: Parameters<typeof writeAuditLog>[0]['action']) => writeAuditLog({uid: req.uid!, action, request: {}, responsePreview: '',success: true});
const owned = async (collection: string, id: string, req: Request): Promise<DocumentData & {id:string}> => {
  body(identifier, id);
  const snap = await db().collection(collection).doc(id).get();
  requireOwnership(snap.data(), req.uid!, req.clinical!.organizationId);
  return { ...snap.data()!, id: snap.id };
};
async function requireConsent(uid: string) {
  const consent = (await db().collection('consents').doc(uid).get()).data();
  if (!consent?.clinicalProcessing || consent.version !== CONSENT_VERSION) throw new ClinicalError('CONSENT_REQUIRED',403,'Current clinical processing consent is required.');
}
const recentLogin = (req: Request) => {
  if (!req.authTime || Date.now() / 1000 - req.authTime > 300) throw new ClinicalError('REAUTHENTICATION_REQUIRED',401,'Sign in again to perform this account action.');
};
const scope = (collection: string, req: Request): Query => db().collection(collection).where('ownerUid','==',req.uid).where('organizationId','==',req.clinical!.organizationId);
async function paginate(collection: string, query: Query, req: Request, max = 50) {
  const limit = Math.min(max, Math.max(1, Number(req.query.limit) || 20));
  let ordered = query.orderBy('createdAt','desc').orderBy('__name__','desc');
  if (typeof req.query.cursor === 'string') {
    body(identifier, req.query.cursor);
    const cursor = await db().collection(collection).doc(req.query.cursor).get();
    // Cursor data never broadens query scope. Invalid/foreign cursors are rejected.
    if (!cursor.exists || cursor.data()?.ownerUid !== req.uid || cursor.data()?.organizationId !== req.clinical!.organizationId) throw new ClinicalError('INVALID_CURSOR');
    ordered = ordered.startAfter(cursor);
  }
  const result = await ordered.limit(limit + 1).get();
  return { items: result.docs.slice(0,limit).map((doc) => ({...doc.data(),id:doc.id})), nextCursor: result.size > limit ? result.docs[limit-1]!.id : null };
}
async function detail(id: string, req: Request): Promise<EncounterDetail> {
  const encounter = await owned('encounters',id,req);
  const collections = ['documents','transcriptions','analyses','reviews','jobs'];
  const results = await Promise.all(collections.map(async (collection) => {
    const snapshot = await scope(collection,req).where('encounterId','==',id).orderBy('createdAt','desc').limit(20).get();
    return snapshot.docs.map((doc) => ({...doc.data(),id:doc.id}));
  }));
  return {encounter,documents:results[0],transcriptions:results[1],analyses:results[2],reviews:results[3],jobs:results[4]} as unknown as EncounterDetail;
}

router.get('/consent',verifyIdentity,route(async(req,res) => {
  res.json({consent:(await db().collection('consents').doc(req.uid!).get()).data() ?? null});
}));
router.post('/consent',verifyIdentity,route(async(req,res) => {
  const input = body(consentInput,req.body);
  const consent = {...input,acceptedAt:now(),...(!input.clinicalProcessing ? {withdrawnAt:now()} : {})};
  const batch = db().batch();
  batch.set(db().collection('consents').doc(req.uid!),consent);
  // Mirror only the consent flag, never grants; Storage rules have a two-document read limit.
  batch.set(db().collection('clinical_memberships').doc(req.uid!),{clinicalProcessing:input.clinicalProcessing},{merge:true});
  batch.create(db().collection('consent_events').doc(),{...consent,ownerUid:req.uid});
  await batch.commit(); await audit(req,'consent'); res.json({consent});
}));
router.get('/account/export',verifyIdentity,route(async(req,res) => {
  recentLogin(req);
  // Remains available after professional membership revocation. Collection and
  // byte pagination prevents both truncated estates and oversized HTTP responses.
  const page = await exportAccountPage(req.uid!,typeof req.query.collection === 'string' ? req.query.collection : 'profile',Number(req.query.limit)||50,typeof req.query.cursor === 'string' ? req.query.cursor : undefined);
  res.setHeader('Cache-Control','no-store'); await audit(req,'export');
  res.json(page);
}));
router.post('/account/deletion-requests',verifyIdentity,route(async(req,res) => {
  recentLogin(req);
  const input = body(z.object({reason:z.string().trim().max(1000).optional()}).strict(),req.body);
  const id = stableId(req.uid!,'deletion');
  await db().collection('deletion_requests').doc(id).set({ownerUid:req.uid,status:'pending_human_review',reason:input.reason ?? '',requestedAt:now()});
  await audit(req,'deletion_request'); res.status(202).json({id,status:'pending_human_review'});
}));

router.use(verifyAuth,rateLimiter({windowMs:60_000,max:120},{failOpen:false,key:'clinical'}));
router.post('/encounters',route(async(req,res) => {
  await requireConsent(req.uid!);
  const input = body(encounterInput,req.body); const id = randomUUID(); const timestamp = now();
  const encounter = {...input,id,ownerUid:req.uid!,organizationId:req.clinical!.organizationId,createdAt:timestamp,updatedAt:timestamp,status:input.triage === 'emergency' ? 'emergency' : 'draft',referralStatus:input.triage === 'emergency' ? 'recommended' : 'none'};
  const patient = db().collection('patients').doc(stableId(req.uid!,req.clinical!.organizationId,input.patientId));
  await db().runTransaction(async(tx) => {const prior = await tx.get(patient); if(!prior.exists) tx.create(patient,{patientId:input.patientId,ownerUid:req.uid,organizationId:req.clinical!.organizationId,createdAt:timestamp}); tx.create(db().collection('encounters').doc(id),encounter);});
  await audit(req,'clinical_transition'); res.status(201).json(encounter);
}));
router.get('/encounters',route(async(req,res) => {res.json(await paginate('encounters',scope('encounters',req),req));}));
router.get('/patients',route(async(req,res) => {const page = await paginate('patients',scope('patients',req),req);res.json({...page,items:page.items.map((item:DocumentData) => ({id:item.patientId,createdAt:item.createdAt}))});}));
router.get('/results',route(async(req,res) => {res.json(await paginate('analyses',scope('analyses',req),req));}));
router.get('/encounters/:id',route(async(req,res) => {res.json(await detail(String(req.params.id),req));}));
router.post('/encounters/:id/documents',route(async(req,res) => {
  await requireConsent(req.uid!);
  const encounter = await owned('encounters',String(req.params.id),req);
  if(encounter.triage !== 'no_red_flags') throw new ClinicalError('EMERGENCY_PATH_REQUIRED',409);
  if(encounter.status !== 'draft' || encounter.latestDocumentId) throw new ClinicalError('ENCOUNTER_LOCKED',409,'Create a new encounter for additional source documents.');
  const input = body(documentInput,req.body); const id = randomUUID(); const createdAt = now(); const expiresAt = new Date(Date.now()+86_400_000).toISOString();
  const manifest = {id,encounterId:encounter.id,organizationId:req.clinical!.organizationId,ownerUid:req.uid!,createdAt,expiresAt,sourceDeleted:false,pages:input.pages.map((page) => ({...page,storagePath:`organizations/${req.clinical!.organizationId}/users/${req.uid}/encounters/${encounter.id}/documents/${id}/pages/${page.id}`}))};
  await db().runTransaction(async(tx) => {
    const current = await tx.get(db().collection('encounters').doc(encounter.id));
    requireOwnership(current.data(),req.uid!,req.clinical!.organizationId);
    if(current.data()!.status !== 'draft' || current.data()!.latestDocumentId) throw new ClinicalError('ENCOUNTER_LOCKED',409,'Create a new encounter for additional source documents.');
    tx.create(db().collection('documents').doc(id),manifest);
    for(const page of manifest.pages) tx.create(db().collection('uploads').doc(`${id}_${page.id}`),{...page,ownerUid:req.uid,organizationId:req.clinical!.organizationId,encounterId:encounter.id,documentId:id,expiresAt,expiresAtMs:Date.parse(expiresAt)});
    tx.update(current.ref,{latestDocumentId:id,updatedAt:createdAt});
  }); res.status(201).json(manifest);
}));
router.post('/jobs',route(async(req,res) => {
  const input = body(jobInput,req.body); const id = stableId(req.uid!,input.idempotencyKey); const timestamp = now();
  const payloadHash = stableId(JSON.stringify(input)); const jobRef = db().collection('jobs').doc(id);
  const day = timestamp.slice(0,10); const uidBudget = db().collection('daily_budgets').doc(stableId('uid',req.uid!,day)); const orgBudget = db().collection('daily_budgets').doc(stableId('org',req.clinical!.organizationId,day));
  const job = await db().runTransaction(async(tx) => {
    const existing = await tx.get(jobRef);
    if(existing.exists) {requireOwnership(existing.data(),req.uid!,req.clinical!.organizationId); if(existing.data()!.payloadHash !== payloadHash) throw new ClinicalError('IDEMPOTENCY_CONFLICT',409); return existing.data()!;}
    const [enc,doc,consent,userUsage,orgUsage] = await Promise.all([tx.get(db().collection('encounters').doc(input.encounterId)),tx.get(db().collection('documents').doc(input.documentId)),tx.get(db().collection('consents').doc(req.uid!)),tx.get(uidBudget),tx.get(orgBudget)]);
    requireOwnership(enc.data(),req.uid!,req.clinical!.organizationId); requireOwnership(doc.data(),req.uid!,req.clinical!.organizationId);
    if(!consent.data()?.clinicalProcessing || consent.data()?.version !== CONSENT_VERSION) throw new ClinicalError('CONSENT_REQUIRED',403);
    if(doc.data()!.encounterId !== input.encounterId || doc.data()!.expiresAt <= timestamp) throw new ClinicalError('SOURCE_EXPIRED',409);
    if(enc.data()!.triage !== 'no_red_flags') throw new ClinicalError('EMERGENCY_PATH_REQUIRED',409);
    if(enc.data()!.latestDocumentId && enc.data()!.latestDocumentId !== input.documentId) throw new ClinicalError('STALE_SOURCE',409);
    if(enc.data()!.activeJobId) {
      const activeJob = await tx.get(db().collection('jobs').doc(enc.data()!.activeJobId));
      if(['queued','running'].includes(activeJob.data()?.status)) throw new ClinicalError('JOB_IN_PROGRESS',409,'An encounter job is already processing.');
    }
    if(input.kind === 'ocr' ? enc.data()!.status !== 'draft' : enc.data()!.status !== 'transcription_review') throw new ClinicalError('ENCOUNTER_LOCKED',409);
    if(input.kind === 'analysis') {const transcription = await tx.get(db().collection('transcriptions').doc(input.transcriptionId!)); requireAnalysisState(enc.data()!,transcription.data(),input.documentId,input.transcriptionId!);}
    const units = input.kind === 'ocr' ? doc.data()!.pages.length : 3;
    const userLimit = Math.max(1,Number(DAILY_USER_JOB_LIMIT.value()) || 40); const orgLimit = Math.max(1,Number(DAILY_ORG_JOB_LIMIT.value()) || 400);
    if((userUsage.data()?.used ?? 0)+units > userLimit || (orgUsage.data()?.used ?? 0)+units > orgLimit) throw new ClinicalError('DAILY_BUDGET_EXCEEDED',429,'Daily processing budget reached.');
    const record = {...input,id,payloadHash,ownerUid:req.uid!,organizationId:req.clinical!.organizationId,status:'queued',attempts:0,createdAt:timestamp,updatedAt:timestamp,deadlineAt:new Date(Date.now()+20*60_000).toISOString()};
    tx.set(uidBudget,{ownerUid:req.uid,used:(userUsage.data()?.used ?? 0)+units,day}); tx.set(orgBudget,{organizationId:req.clinical!.organizationId,used:(orgUsage.data()?.used ?? 0)+units,day});
    tx.create(jobRef,record); tx.update(enc.ref,{activeJobId:id,status:input.kind === 'ocr' ? 'ocr_pending' : 'analysis_pending',updatedAt:timestamp}); return record;
  });
  res.status(202).json(job);
}));
router.get('/jobs/:id',route(async(req,res) => {res.json(await owned('jobs',String(req.params.id),req));}));
router.post('/encounters/:id/transcription',route(async(req,res) => {
  await requireConsent(req.uid!);
  const input = body(transcriptionInput,req.body); const id = randomUUID(); const encounterId = String(req.params.id); const createdAt = now();
  const transcription = await db().runTransaction(async(tx) => {
    const [enc,job,doc] = await Promise.all([tx.get(db().collection('encounters').doc(encounterId)),tx.get(db().collection('jobs').doc(input.ocrJobId)),tx.get(db().collection('documents').doc(input.documentId))]);
    for(const snapshot of [enc,job,doc]) requireOwnership(snapshot.data(),req.uid!,req.clinical!.organizationId);
    if(job.data()!.kind !== 'ocr' || job.data()!.status !== 'succeeded' || job.data()!.encounterId !== encounterId || job.data()!.documentId !== input.documentId || doc.data()!.encounterId !== encounterId) throw new ClinicalError('OCR_REQUIRED',409);
    if(enc.data()!.status !== 'transcription_review' || (enc.data()!.latestDocumentId && enc.data()!.latestDocumentId !== input.documentId)) throw new ClinicalError('ENCOUNTER_LOCKED',409);
    const record = {...input,id,encounterId,ownerUid:req.uid!,organizationId:req.clinical!.organizationId,reviewerUid:req.uid!,reviewedAt:createdAt,createdAt,sourceHashes:doc.data()!.pages.map((page:{sha256:string}) => page.sha256)};
    tx.create(db().collection('transcriptions').doc(id),record); tx.update(enc.ref,{latestTranscriptionId:id,status:'transcription_review',updatedAt:createdAt}); return record;
  }); res.status(201).json(transcription);
}));
router.post('/encounters/:id/reviews',route(async(req,res) => {
  const input = body(reviewInput,req.body); const encounterId = String(req.params.id); const id = randomUUID(); const timestamp = now();
  const record = {...input,id,encounterId,ownerUid:req.uid!,organizationId:req.clinical!.organizationId,reviewerUid:req.uid!,reviewedAt:timestamp,createdAt:timestamp};
  await db().runTransaction(async(tx) => {const [enc,analysis] = await Promise.all([tx.get(db().collection('encounters').doc(encounterId)),tx.get(db().collection('analyses').doc(input.analysisId))]); requireOwnership(enc.data(),req.uid!,req.clinical!.organizationId); requireOwnership(analysis.data(),req.uid!,req.clinical!.organizationId); if(enc.data()!.status !== 'review_required' || analysis.data()!.encounterId !== encounterId || enc.data()!.latestAnalysisId !== input.analysisId || analysis.data()!.transcriptionId !== enc.data()!.latestTranscriptionId || (enc.data()!.latestDocumentId && analysis.data()!.documentId !== enc.data()!.latestDocumentId)) throw new ClinicalError('STALE_ANALYSIS',409); tx.create(db().collection('reviews').doc(id),record); tx.update(enc.ref,{status:'reviewed',latestReviewId:id,updatedAt:timestamp});});
  await audit(req,'clinical_transition'); res.status(201).json(record);
}));
router.patch('/encounters/:id/referral',route(async(req,res) => {
  const input = body(referralInput,req.body); const encounter = await owned('encounters',String(req.params.id),req);
  const update = {referralStatus:input.status,updatedAt:now()}; const batch = db().batch(); batch.update(db().collection('encounters').doc(encounter.id),update); batch.create(db().collection('referral_events').doc(),{encounterId:encounter.id,ownerUid:req.uid,organizationId:req.clinical!.organizationId,status:input.status,notes:input.notes ?? '',createdAt:now()}); await batch.commit(); await audit(req,'clinical_transition'); res.json({...encounter,...update});
}));
export default router;
