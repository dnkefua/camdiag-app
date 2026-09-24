/** Versioned, dependency-free browser/server contract. No Firebase or provider code. */
export const CLINICAL_SCHEMA_VERSION = 'clinical-v1' as const;
export const CONSENT_VERSION = 'clinical-consent-v3' as const;
export const SUPPORTED_DOCUMENT_TYPES = ['lab_result', 'prescription', 'medical_document'] as const;
export type ClinicalDocumentType = typeof SUPPORTED_DOCUMENT_TYPES[number];
export type ClinicalLanguage = 'en' | 'fr';
export type ClinicalRole = 'doctor' | 'nurse';
export type TriageStatus = 'no_red_flags' | 'emergency';
export interface ClinicalClaims { verifiedClinician: true; clinicalRole: ClinicalRole; organizationId: string }
export interface PatientContext {
  ageRange?: string; sexAtBirth?: 'female' | 'male' | 'unknown';
  pregnancyStatus?: 'pregnant' | 'not_pregnant' | 'unknown';
  symptoms?: string[]; allergies?: string[]; currentMedications?: string[];
}
export interface ConsentRecord { version: string; clinicalProcessing: boolean; optionalAnalytics: boolean; acceptedAt: string; withdrawnAt?: string }
export interface ConsentInput { version: typeof CONSENT_VERSION; clinicalProcessing: boolean; optionalAnalytics: boolean }
export interface CreateEncounterInput { patientId: string; documentType: ClinicalDocumentType; language: ClinicalLanguage; patientContext: PatientContext; triage: TriageStatus }
export interface Encounter extends CreateEncounterInput {
  id: string; organizationId: string; ownerUid: string; createdAt: string; updatedAt: string;
  status: 'draft' | 'ocr_pending' | 'transcription_review' | 'analysis_pending' | 'review_required' | 'reviewed' | 'emergency';
  referralStatus: 'none' | 'recommended' | 'arranged' | 'completed' | 'declined';
  latestDocumentId?: string; latestTranscriptionId?: string; latestAnalysisId?: string;
}
export interface UploadPageInput { id: string; fileName: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp'; sizeBytes: number; sha256: string }
export interface CreateDocumentInput { pages: UploadPageInput[] }
export interface DocumentManifest { id: string; encounterId: string; organizationId: string; ownerUid: string; createdAt: string; expiresAt: string; pages: Array<UploadPageInput & { storagePath: string }> }
export interface OcrToken { text: string; confidence: number; pageNumber: number; handwritten: boolean; boundingBox: Array<{x: number; y: number}> }
export interface OcrPage { pageNumber: number; sourcePageId: string; text: string; confidence: number; qualityScore?: number; qualityReasons: string[]; tokens: OcrToken[] }
export interface OcrResult { documentId: string; detectedLanguage?: string; processorVersion: string; requiresReview: boolean; pages: OcrPage[] }
export interface CreateJobInput { encounterId: string; kind: 'ocr' | 'analysis'; idempotencyKey: string; documentId: string; transcriptionId?: string }
export interface ClinicalJob { id: string; encounterId: string; kind: 'ocr' | 'analysis'; documentId: string; status: 'queued' | 'running' | 'succeeded' | 'failed'; attempts: number; createdAt: string; updatedAt: string; errorCode?: string; resultId?: string; result?: OcrResult | ClinicalAnalysis }
export interface ConfirmTranscriptionInput { documentId: string; ocrJobId: string; text: string; reviewed: true }
export interface TranscriptionVersion { id: string; documentId: string; ocrJobId: string; text: string; reviewed: true; reviewerUid: string; reviewedAt: string; sourceHashes: string[] }
export interface ClinicalAnalysis {
  urgency: 'emergency' | 'same_day' | 'routine' | 'unknown';
  possibleFindings: Array<{ name: string; likelihood: 'low' | 'moderate' | 'high' | 'uncertain'; observedEvidence: string[]; markers: string[]; medicationSafetyNotes: string[]; traditionalRemedyWarnings: string[]; reasoning: string; recommendedNextSteps: string[]; clinicianReviewRequired: true }>;
  markers: Array<{ id: string; label: string; value: string; status: 'normal' | 'abnormal' | 'critical' | 'review_required' | 'unknown'; color: 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'gray' }>;
  contraindications: Array<{medications: string[]; risk: string; severity: 'low' | 'moderate' | 'high' | 'unknown'}>;
  limitations: string[]; disclaimer: string;
  provenance: { model: string; modelVersion: string; promptVersion: string; schemaVersion: string; analyzedAt: string; documentId: string; transcriptionId: string; sourceHashes: string[] };
  medicationAssessment: 'not_assessed';
}
export interface ReviewInput { analysisId: string; attested: true; disposition: 'accepted' | 'corrected' | 'rejected'; notes: string }
export interface ClinicalReview extends ReviewInput { id: string; reviewerUid: string; reviewedAt: string }
export interface EncounterDetail { encounter: Encounter; documents: DocumentManifest[]; transcriptions: TranscriptionVersion[]; analyses: Array<{id: string; result: ClinicalAnalysis}>; reviews: ClinicalReview[]; jobs: ClinicalJob[] }
export interface PageResult<T> { items: T[]; nextCursor: string | null }
export interface AccountExportPage { schemaVersion: typeof CLINICAL_SCHEMA_VERSION; exportedAt: string; collection: string; availableCollections: string[]; records: PageResult<Record<string,unknown>>; scopeNotice: string }
export interface MedicationAssessment { status: 'not_assessed' | 'evidence_available'; result: string; evidence: Array<{id: string; version: string; citation: string; reviewedAt: string; text: string}> }
/** API: all paths relative to VITE_API_URL; bearer ID token + App Check required.
 * GET /consent -> {consent: ConsentRecord|null}; POST /consent (ConsentInput) -> same.
 * POST /encounters (CreateEncounterInput) -> Encounter; GET /encounters?limit=20&cursor=... -> PageResult<Encounter>.
 * GET /patients?limit=20&cursor=... -> PageResult<{id:string,createdAt:string}>.
 * GET /encounters/:id -> EncounterDetail. GET /results?limit=20&cursor=... -> PageResult<{id,encounterId,result}>.
 * POST /encounters/:id/documents (CreateDocumentInput) -> DocumentManifest; upload each page with Firebase Storage uploadBytesResumable(storagePath,...).
 * Only JPEG/PNG/WebP pages accepted; PDF/TIFF are unsupported. Total <=15 pages, <=24MiB, <=6MiB/page.
 * POST /jobs (CreateJobInput) -> ClinicalJob (202); GET /jobs/:id -> ClinicalJob, result present when succeeded.
 * POST /encounters/:id/transcription (ConfirmTranscriptionInput) -> TranscriptionVersion.
 * POST /encounters/:id/reviews (ReviewInput) -> ClinicalReview.
 * PATCH /encounters/:id/referral {status: Encounter['referralStatus'],notes?:string} -> Encounter.
 * GET /account/export?collection=profile&limit=50&cursor=... -> AccountExportPage; iterate every availableCollections and cursor (requires auth_time <=5m).
 * POST /account/deletion-requests {reason?:string} -> {id,status:'pending_human_review'} (requires auth_time <=5m; does not delete).
 * POST /search-drug {medicationName,language}; POST /check-interactions {drugs,language} -> MedicationAssessment.
 * Errors: {error: safe message, code: stable_reason}; 401 identity/AppCheck,403 authorization/consent,409 state,429 quota.
 */
