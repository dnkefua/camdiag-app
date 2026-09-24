import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';
import { randomUUID } from 'node:crypto';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { CONSENT_VERSION, CLINICAL_SCHEMA_VERSION, type DocumentManifest, type ClinicalAnalysis, type ClinicalJob } from '../contracts/clinical.js';
import { isClinicalClaims } from '../middleware/auth.js';
import { ClinicalError, requireOwnership, requireAnalysisState, validateImageBytes } from './clinicalPolicy.js';
import { transcribeDocument } from './documentAi.js';
import { analyzeImage } from './gemini.js';
import { validateClinicalOutput } from './analysisValidation.js';
import { GEMINI_MODEL } from '../config.js';
import { writeAuditLog } from './audit.js';

const iso = () => new Date().toISOString();
interface StoredJob extends ClinicalJob { ownerUid:string;organizationId:string;deadlineAt:string;leaseToken?:string;leaseExpiresAt?:string;nextAttemptAt?:string;transcriptionId?:string }
export const JOB_MAX_ATTEMPTS = 3;
export const JOB_LEASE_MS = 330_000;
export function canClaimJob(job: Record<string, unknown>, timestamp = Date.now()) {
  return ['queued','running'].includes(String(job.status))
    && !(job.status === 'running' && Date.parse(String(job.leaseExpiresAt)) > timestamp)
    && !(job.nextAttemptAt && Date.parse(String(job.nextAttemptAt)) > timestamp);
}
export function isRetryableJobError(error: unknown): boolean {
  return (error instanceof ClinicalError && error.code === 'PROVIDER_TEMPORARY')
    || (error instanceof Error && ['AbortError','TimeoutError','TypeError'].includes(error.name));
}
async function readSource(page: DocumentManifest['pages'][number], signal: AbortSignal) {
  const stream = getStorage().bucket().file(page.storagePath).createReadStream({validation:'crc32c'});
  const abort = () => stream.destroy(new DOMException('Source deadline reached','TimeoutError'));
  signal.addEventListener('abort',abort,{once:true});
  if(signal.aborted) abort();
  const chunks: Buffer[] = []; let length = 0;
  try {
    for await(const chunk of stream) {
      length += (chunk as Buffer).length;
      if(length > page.sizeBytes || length > 6*1024*1024) {stream.destroy(); throw new ClinicalError('SOURCE_INTEGRITY_FAILED',409);}
      chunks.push(chunk as Buffer);
    }
  } finally {signal.removeEventListener('abort',abort);}
  const bytes = Buffer.concat(chunks); validateImageBytes(bytes,page.mimeType,page.sha256,page.sizeBytes);
  return {id:page.id,fileName:page.fileName,mimeType:page.mimeType,contentBase64:bytes.toString('base64')};
}

/** Firestore is the durable queue. A lease and transaction guard every side effect.
 * Provider calls are at-least-once after crashes; immutable persisted results are once per job.
 */
export async function runClinicalJob(jobId: string) {
  const db = getFirestore(); const ref = db.collection('jobs').doc(jobId); const leaseToken = randomUUID();
  const job = await db.runTransaction(async(tx) => {
    const snapshot = await tx.get(ref); const data = snapshot.data() as StoredJob | undefined;
    if(!data || !canClaimJob(data as unknown as Record<string,unknown>)) return null;
    if(Date.parse(data.deadlineAt) <= Date.now() || data.attempts >= JOB_MAX_ATTEMPTS) {
      tx.update(ref,{status:'failed',errorCode:'JOB_DEADLINE_EXCEEDED',updatedAt:iso()}); return null;
    }
    const next: StoredJob = {...data,attempts:data.attempts+1,status:'running',leaseToken,leaseExpiresAt:new Date(Date.now()+JOB_LEASE_MS).toISOString(),updatedAt:iso()};
    tx.update(ref,{...next}); return next;
  });
  if(!job) return;
  const signal = AbortSignal.timeout(240_000);
  try {
    const [user,encSnap,docSnap,consentSnap,membershipSnap] = await Promise.all([
      getAuth().getUser(job.ownerUid),db.collection('encounters').doc(job.encounterId).get(),
      db.collection('documents').doc(job.documentId).get(),db.collection('consents').doc(job.ownerUid).get(),db.collection('clinical_memberships').doc(job.ownerUid).get(),
    ]);
    if(user.disabled || !isClinicalClaims(user.customClaims ?? {}) || user.customClaims!.organizationId !== job.organizationId
      || membershipSnap.data()?.active !== true || membershipSnap.data()?.organizationId !== job.organizationId || membershipSnap.data()?.clinicalRole !== user.customClaims!.clinicalRole
      || (user.tokensValidAfterTime && Date.parse(user.tokensValidAfterTime) > Date.parse(job.createdAt))) throw new ClinicalError('CLINICAL_ACCESS_REVOKED',403);
    const enc = encSnap.data(); const manifest = docSnap.data() as DocumentManifest | undefined;
    requireOwnership(enc,job.ownerUid,job.organizationId); requireOwnership(manifest as unknown as Record<string,unknown>,job.ownerUid,job.organizationId);
    if(!manifest || manifest.encounterId !== job.encounterId || manifest.expiresAt <= iso()) throw new ClinicalError('SOURCE_EXPIRED',409);
    if(enc!.latestDocumentId && enc!.latestDocumentId !== job.documentId) throw new ClinicalError('STALE_SOURCE',409);
    if(!consentSnap.data()?.clinicalProcessing || consentSnap.data()?.version !== CONSENT_VERSION) throw new ClinicalError('CONSENT_REQUIRED',403);
    if(enc!.triage !== 'no_red_flags') throw new ClinicalError('EMERGENCY_PATH_REQUIRED',409);
    const pages = await Promise.all(manifest.pages.map((page) => readSource(page,signal)));
    let result: unknown; let resultId = jobId;
    if(job.kind === 'ocr') {
      result = {...await transcribeDocument({pages,language:enc!.language,handwritingHint:true},signal),documentId:manifest.id};
    } else {
      const transcription = (await db.collection('transcriptions').doc(job.transcriptionId!).get()).data();
      requireAnalysisState(enc!,transcription,manifest.id,job.transcriptionId!);
      const raw = await analyzeImage({pages,confirmedTranscription:transcription!.text,documentType:enc!.documentType,language:enc!.language,patientContext:enc!.patientContext},signal);
      const validated = validateClinicalOutput(raw,transcription!.text,manifest.pages.map((page) => page.id));
      const analysis: ClinicalAnalysis = {...validated,medicationAssessment:'not_assessed',provenance:{model:'Vertex AI Gemini',modelVersion:GEMINI_MODEL.value(),promptVersion:'evidence-review-v1',schemaVersion:CLINICAL_SCHEMA_VERSION,analyzedAt:iso(),documentId:manifest.id,transcriptionId:job.transcriptionId!,sourceHashes:manifest.pages.map((page) => page.sha256)}};
      result = analysis;
    }
    if(signal.aborted) throw new DOMException('Deadline reached','TimeoutError');
    // Strip undefined optional fields (Firestore rejects undefined by default).
    const durableResult = JSON.parse(JSON.stringify(result));
    if(Buffer.byteLength(JSON.stringify(durableResult)) > 850_000) throw new ClinicalError('DOCUMENT_TOO_COMPLEX',422);
    await db.runTransaction(async(tx) => {
      const [current,encounter,consent,membership] = await Promise.all([tx.get(ref),tx.get(encSnap.ref),tx.get(consentSnap.ref),tx.get(membershipSnap.ref)]);
      if(current.data()?.leaseToken !== leaseToken || current.data()?.status !== 'running') return;
      if(!consent.data()?.clinicalProcessing || consent.data()?.version !== CONSENT_VERSION) throw new ClinicalError('CONSENT_REQUIRED',403);
      if(membership.data()?.active !== true || membership.data()?.organizationId !== job.organizationId || membership.data()?.clinicalRole !== user.customClaims!.clinicalRole) throw new ClinicalError('CLINICAL_ACCESS_REVOKED',403);
      if(encounter.data()?.activeJobId !== jobId || (encounter.data()?.latestDocumentId && encounter.data()?.latestDocumentId !== job.documentId) || (job.kind === 'analysis' && encounter.data()?.latestTranscriptionId !== job.transcriptionId)) throw new ClinicalError('STALE_TRANSCRIPTION',409);
      if(job.kind === 'analysis') tx.create(db.collection('analyses').doc(resultId),{id:resultId,encounterId:job.encounterId,documentId:job.documentId,transcriptionId:job.transcriptionId,ownerUid:job.ownerUid,organizationId:job.organizationId,createdAt:iso(),status:'review_required',result:durableResult});
      tx.update(ref,{status:'succeeded',resultId,result:durableResult,updatedAt:iso(),leaseToken:FieldValue.delete(),leaseExpiresAt:FieldValue.delete(),nextAttemptAt:FieldValue.delete(),errorCode:FieldValue.delete()});
      tx.update(encSnap.ref,{activeJobId:FieldValue.delete(),status:job.kind === 'ocr' ? 'transcription_review' : 'review_required',...(job.kind === 'analysis' ? {latestAnalysisId:resultId} : {}),updatedAt:iso()});
    });
    await writeAuditLog({uid:job.ownerUid,action:job.kind === 'ocr' ? 'transcribe' : 'analyze',request:{},responsePreview:'',success:true});
  } catch(error) {
    const retry = isRetryableJobError(error) && job.attempts < JOB_MAX_ATTEMPTS && Date.parse(job.deadlineAt) > Date.now()+60_000;
    const errorCode = error instanceof ClinicalError ? error.code : 'PROCESSING_UNAVAILABLE';
    await db.runTransaction(async(tx) => {
      const [current,encounter] = await Promise.all([tx.get(ref),tx.get(db.collection('encounters').doc(job.encounterId))]);
      if(current.data()?.leaseToken !== leaseToken || current.data()?.status !== 'running') return;
      tx.update(ref,{status:retry ? 'queued' : 'failed',errorCode,updatedAt:iso(),leaseToken:FieldValue.delete(),leaseExpiresAt:FieldValue.delete(),...(retry ? {nextAttemptAt:new Date(Date.now()+job.attempts*60_000).toISOString()} : {})});
      if(!retry && encounter.data()?.activeJobId === jobId) tx.update(encounter.ref,{activeJobId:FieldValue.delete(),status:job.kind === 'ocr' ? 'draft' : 'transcription_review',updatedAt:iso()});
    });
    console.warn(JSON.stringify({event:'clinical_job_attempt_failed',kind:job.kind,code:errorCode,retry}));
    await writeAuditLog({uid:job.ownerUid,action:job.kind === 'ocr' ? 'transcribe' : 'analyze',request:{},responsePreview:'',success:false});
  }
}

export const processClinicalJob = onDocumentCreated({document:'jobs/{jobId}',timeoutSeconds:300,memory:'1GiB',maxInstances:3,retry:true},async(event) => {await runClinicalJob(event.params.jobId);});
export const recoverClinicalJobs = onSchedule({schedule:'every 5 minutes',timeoutSeconds:540,memory:'1GiB',maxInstances:1},async() => {
  const db = getFirestore();
  // Bounded, oldest first. Active leases are skipped; stale leases are reclaimed.
  const candidates = await db.collection('jobs').where('status','in',['queued','running']).orderBy('createdAt','asc').limit(40).get();
  const eligible = candidates.docs.filter((doc) => canClaimJob(doc.data())).slice(0,2);
  await Promise.all(eligible.map((job) => runClinicalJob(job.id)));
});
export const purgeExpiredSources = onSchedule({schedule:'every 60 minutes',timeoutSeconds:300,memory:'512MiB',maxInstances:1},async() => {
  const db = getFirestore(); const expired = await db.collection('documents').where('sourceDeleted','==',false).where('expiresAt','<=',iso()).limit(50).get();
  for(const doc of expired.docs) {
    const manifest = doc.data() as DocumentManifest;
    try {
      for(const page of manifest.pages) {
        await getStorage().bucket().file(page.storagePath).delete({ignoreNotFound:true});
        await db.collection('uploads').doc(`${manifest.id}_${page.id}`).delete();
      }
      await doc.ref.update({sourceDeleted:true,sourceDeletedAt:iso()});
    } catch {console.error(JSON.stringify({event:'expired_source_purge_failed'}));}
  }
});
