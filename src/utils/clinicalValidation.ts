import type {
  ClinicalAnalysis,
  ClinicalJob,
  ClinicalReview,
  DocumentManifest,
  Encounter,
  EncounterDetail,
  MedicationAssessment,
  OcrResult,
  PageResult,
  TranscriptionVersion,
} from '../../functions/src/contracts/clinical';
import { CLINICAL_SCHEMA_VERSION } from '../../functions/src/contracts/clinical';

const obj = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown, max = 10000): v is string => typeof v === 'string' && v.length <= max;
const id = (v: unknown): v is string => str(v, 500) && /^[a-zA-Z0-9_-]+$/.test(v);
const date = (v: unknown): v is string => str(v, 40) && Number.isFinite(Date.parse(v));
const hash = (v: unknown): v is string => str(v, 64) && /^[a-f0-9]{64}$/.test(v);
const arr = <T>(v: unknown, guard: (item: unknown) => item is T, max = 100): v is T[] =>
  Array.isArray(v) && v.length <= max && v.every(guard);
const texts = (v: unknown): v is string[] => arr(v, (item): item is string => str(item), 100);
const choice = (v: unknown, options: readonly string[]) =>
  typeof v === 'string' && options.includes(v);
const unit = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
const int = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;

export const isClinicalAnalysis = (v: unknown): v is ClinicalAnalysis => {
  if (
    !obj(v) ||
    !choice(v.urgency, ['emergency', 'same_day', 'routine', 'unknown']) ||
    !texts(v.limitations) ||
    !str(v.disclaimer) ||
    v.medicationAssessment !== 'not_assessed' ||
    !obj(v.provenance)
  )
    return false;
  const p = v.provenance;
  if (
    !['model', 'modelVersion', 'promptVersion'].every((key) => str(p[key], 300) && p[key] !== '') ||
    p.schemaVersion !== CLINICAL_SCHEMA_VERSION ||
    !date(p.analyzedAt) ||
    !id(p.documentId) ||
    !id(p.transcriptionId) ||
    !arr(p.sourceHashes, hash, 15) ||
    p.sourceHashes.length === 0
  )
    return false;
  return (
    arr(
      v.possibleFindings,
      (f): f is ClinicalAnalysis['possibleFindings'][number] =>
        obj(f) &&
        str(f.name) &&
        str(f.reasoning) &&
        choice(f.likelihood, ['low', 'moderate', 'high', 'uncertain']) &&
        f.clinicianReviewRequired === true &&
        [
          'observedEvidence',
          'markers',
          'medicationSafetyNotes',
          'traditionalRemedyWarnings',
          'recommendedNextSteps',
        ].every((key) => texts(f[key])),
      20
    ) &&
    arr(
      v.markers,
      (m): m is ClinicalAnalysis['markers'][number] =>
        obj(m) &&
        ['id', 'label', 'value'].every((key) => str(m[key])) &&
        choice(m.status, ['normal', 'abnormal', 'critical', 'review_required', 'unknown']) &&
        choice(m.color, ['green', 'yellow', 'orange', 'red', 'blue', 'gray']),
      100
    ) &&
    arr(
      v.contraindications,
      (c): c is ClinicalAnalysis['contraindications'][number] =>
        obj(c) &&
        texts(c.medications) &&
        str(c.risk) &&
        choice(c.severity, ['low', 'moderate', 'high', 'unknown']),
      50
    )
  );
};
export const isOcrResult = (v: unknown): v is OcrResult =>
  obj(v) &&
  id(v.documentId) &&
  str(v.processorVersion, 300) &&
  typeof v.requiresReview === 'boolean' &&
  (v.detectedLanguage === undefined || str(v.detectedLanguage, 30)) &&
  arr(
    v.pages,
    (p): p is OcrResult['pages'][number] =>
      obj(p) &&
      id(p.sourcePageId) &&
      int(p.pageNumber) &&
      p.pageNumber > 0 &&
      p.pageNumber <= 15 &&
      str(p.text, 200000) &&
      unit(p.confidence) &&
      (p.qualityScore === undefined || unit(p.qualityScore)) &&
      texts(p.qualityReasons) &&
      arr(
        p.tokens,
        (t): t is OcrResult['pages'][number]['tokens'][number] =>
          obj(t) &&
          str(t.text, 10000) &&
          unit(t.confidence) &&
          int(t.pageNumber) &&
          typeof t.handwritten === 'boolean' &&
          arr(
            t.boundingBox,
            (b): b is { x: number; y: number } => obj(b) && unit(b.x) && unit(b.y),
            10
          ),
        30000
      ),
    15
  ) &&
  v.pages.length > 0;
export const isEncounter = (v: unknown): v is Encounter =>
  obj(v) &&
  id(v.id) &&
  str(v.patientId, 100) &&
  v.patientId.length > 0 &&
  id(v.ownerUid) &&
  id(v.organizationId) &&
  date(v.createdAt) &&
  date(v.updatedAt) &&
  choice(v.documentType, ['lab_result', 'prescription', 'medical_document']) &&
  choice(v.language, ['en', 'fr']) &&
  choice(v.triage, ['no_red_flags', 'emergency']) &&
  choice(v.status, [
    'draft',
    'ocr_pending',
    'transcription_review',
    'analysis_pending',
    'review_required',
    'reviewed',
    'emergency',
  ]) &&
  choice(v.referralStatus, ['none', 'recommended', 'arranged', 'completed', 'declined']) &&
  ['latestTranscriptionId', 'latestAnalysisId'].every(
    (key) => v[key] === undefined || id(v[key])
  ) &&
  obj(v.patientContext) &&
  (v.patientContext.ageRange === undefined || str(v.patientContext.ageRange, 100)) &&
  (v.patientContext.sexAtBirth === undefined ||
    choice(v.patientContext.sexAtBirth, ['female', 'male', 'unknown'])) &&
  (v.patientContext.pregnancyStatus === undefined ||
    choice(v.patientContext.pregnancyStatus, ['pregnant', 'not_pregnant', 'unknown'])) &&
  ['symptoms', 'allergies', 'currentMedications'].every(
    (key) =>
      v.patientContext &&
      obj(v.patientContext) &&
      (v.patientContext[key] === undefined || texts(v.patientContext[key]))
  );
export const isDocumentManifest = (v: unknown): v is DocumentManifest =>
  obj(v) &&
  ['id', 'encounterId', 'ownerUid', 'organizationId'].every((key) => id(v[key])) &&
  date(v.createdAt) &&
  date(v.expiresAt) &&
  arr(
    v.pages,
    (p): p is DocumentManifest['pages'][number] =>
      obj(p) &&
      id(p.id) &&
      str(p.fileName, 240) &&
      choice(p.mimeType, ['image/jpeg', 'image/png', 'image/webp']) &&
      int(p.sizeBytes) &&
      p.sizeBytes > 0 &&
      p.sizeBytes <= 6 * 1024 * 1024 &&
      hash(p.sha256) &&
      p.storagePath ===
        `organizations/${v.organizationId}/users/${v.ownerUid}/encounters/${v.encounterId}/documents/${v.id}/pages/${p.id}`,
    15
  ) &&
  v.pages.length > 0 &&
  new Set(v.pages.map((p) => p.id)).size === v.pages.length &&
  v.pages.reduce((sum, p) => sum + p.sizeBytes, 0) <= 24 * 1024 * 1024;
export const isTranscription = (v: unknown): v is TranscriptionVersion =>
  obj(v) &&
  ['id', 'documentId', 'ocrJobId', 'reviewerUid'].every((key) => id(v[key])) &&
  str(v.text, 200000) &&
  v.reviewed === true &&
  date(v.reviewedAt) &&
  arr(v.sourceHashes, hash, 15) &&
  v.sourceHashes.length > 0;
export const isReview = (v: unknown): v is ClinicalReview =>
  obj(v) &&
  ['id', 'analysisId', 'reviewerUid'].every((key) => id(v[key])) &&
  v.attested === true &&
  choice(v.disposition, ['accepted', 'corrected', 'rejected']) &&
  str(v.notes, 10000) &&
  date(v.reviewedAt);
export const isClinicalJob = (v: unknown): v is ClinicalJob =>
  obj(v) &&
  ['id', 'encounterId', 'documentId'].every((key) => id(v[key])) &&
  choice(v.kind, ['ocr', 'analysis']) &&
  choice(v.status, ['queued', 'running', 'succeeded', 'failed']) &&
  int(v.attempts) &&
  date(v.createdAt) &&
  date(v.updatedAt) &&
  (v.errorCode === undefined || str(v.errorCode, 200)) &&
  (v.resultId === undefined || id(v.resultId)) &&
  (v.status !== 'succeeded' ||
    (id(v.resultId) &&
      (v.kind === 'ocr'
        ? isOcrResult(v.result) && v.result.documentId === v.documentId
        : isClinicalAnalysis(v.result) && v.result.provenance.documentId === v.documentId)));
export const isEncounterDetail = (v: unknown): v is EncounterDetail => {
  if (
    !obj(v) ||
    !isEncounter(v.encounter) ||
    !arr(v.documents, isDocumentManifest) ||
    !arr(v.transcriptions, isTranscription) ||
    !arr(v.reviews, isReview) ||
    !arr(v.jobs, isClinicalJob) ||
    !arr(
      v.analyses,
      (a): a is EncounterDetail['analyses'][number] =>
        obj(a) && id(a.id) && isClinicalAnalysis(a.result)
    )
  )
    return false;
  const encounter = v.encounter;
  return (
    v.documents.every(
      (d) =>
        d.encounterId === encounter.id &&
        d.ownerUid === encounter.ownerUid &&
        d.organizationId === encounter.organizationId
    ) && v.jobs.every((j) => j.encounterId === encounter.id)
  );
};
export const isMedicationAssessment = (v: unknown): v is MedicationAssessment =>
  obj(v) &&
  choice(v.status, ['not_assessed', 'evidence_available']) &&
  str(v.result, 30000) &&
  arr(
    v.evidence,
    (e): e is MedicationAssessment['evidence'][number] =>
      obj(e) &&
      id(e.id) &&
      str(e.version, 300) &&
      str(e.citation, 2000) &&
      e.citation.length > 0 &&
      date(e.reviewedAt) &&
      str(e.text, 30000),
    100
  ) &&
  (v.status !== 'evidence_available' || v.evidence.length > 0);
export const isEncounterPage = (v: unknown): v is PageResult<Encounter> =>
  obj(v) && arr(v.items, isEncounter, 50) && (v.nextCursor === null || id(v.nextCursor));
export const validateClinicalResponse = <T>(value: unknown, guard: (v: unknown) => v is T): T => {
  if (!guard(value))
    throw new Error('The server response could not be verified. No clinical result was accepted.');
  return value;
};
