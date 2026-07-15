export type Language = 'en' | 'fr' | 'pcm';

export type ScreenRoute =
  | '/'
  | '/demo'
  | '/scanner'
  | '/analysis'
  | '/transcription-review'
  | '/next-steps'
  | '/drugs'
  | '/patients'
  | '/settings'
  | '/questionnaire'
  | '/blog'
  | '/coming-up';

export type AnalyzeDocumentType = 'lab_result' | 'xray' | 'rdt' | 'prescription' | 'medical_document' | 'other';
export type FindingLikelihood = 'low' | 'moderate' | 'high' | 'uncertain';
export type AnalysisUrgency = 'emergency' | 'same_day' | 'routine' | 'unknown';

export interface PatientContext {
  ageRange?: string;
  sexAtBirth?: 'female' | 'male' | 'unknown';
  pregnancyStatus?: 'pregnant' | 'not_pregnant' | 'unknown';
  symptoms?: string[];
  allergies?: string[];
  currentMedications?: string[];
}

export interface PossibleFinding {
  name: string;
  likelihood: FindingLikelihood;
  observedEvidence: string[];
  markers: string[];
  medicationSafetyNotes: string[];
  traditionalRemedyWarnings: string[];
  reasoning: string;
  recommendedNextSteps: string[];
  clinicianReviewRequired: true;
}

export interface ClinicalMarker {
  id: string;
  label: string;
  value: string;
  status: 'normal' | 'abnormal' | 'critical' | 'review_required' | 'unknown';
  color: 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'gray';
}

export interface Contraindication {
  medications: string[];
  risk: string;
  severity: 'low' | 'moderate' | 'high' | 'unknown';
}

export interface Facility {
  name: string;
  distance: string;
  rating: number;
  type: string;
  color: string;
}

export interface Drug {
  name: string;
  type: string;
  dosage: string;
  availability: string;
  description: string;
}

export interface PatientRecord {
  date: string;
  diagnosis: string;
  id: string;
  status: string;
  result: string;
  category: string;
  bodyPart: string;
}

export interface ScanResult {
  id: string;
  title: string;
  date: string;
  match: string;
  type: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
}

export interface AppUser extends User {
  uid: string;
  role: string;
  createdAt: number;
  photoUrl?: string;
  about?: string;
  symptoms?: string;
  notificationPrefs?: {
    scanResults: boolean;
    medicationAlerts: boolean;
    productUpdates: boolean;
  };
}

export interface MedGemmaAnalysisRequest {
  imageBase64?: string;
  pages?: DocumentPageInput[];
  confirmedTranscription?: string;
  documentType: AnalyzeDocumentType;
  language: Language;
  patientContext?: PatientContext;
}

export interface DocumentPageInput {
  id: string;
  fileName: string;
  mimeType: string;
  contentBase64: string;
}

export interface OcrToken {
  text: string;
  confidence: number;
  pageNumber: number;
  handwritten: boolean;
  boundingBox?: Array<{ x: number; y: number }>;
}

export interface OcrPage {
  pageNumber: number;
  text: string;
  confidence: number;
  qualityScore?: number;
  qualityReasons: string[];
  tokens: OcrToken[];
}

export interface DocumentTranscription {
  documentId: string;
  detectedLanguage?: string;
  processorVersion: string;
  requiresReview: boolean;
  pages: OcrPage[];
}

export interface AnalysisProvenance {
  model: string;
  modelVersion?: string;
  promptVersion: string;
  ocrProcessorVersion?: string;
  analyzedAt: string;
}

export interface MedGemmaAnalysisResponse {
  urgency: AnalysisUrgency;
  possibleFindings: PossibleFinding[];
  markers: ClinicalMarker[];
  contraindications: Contraindication[];
  limitations: string[];
  disclaimer: string;
  provenance?: AnalysisProvenance;
}

export interface FormData {
  medication: string;
  source: string;
  worked: string;
  audioCaptured: boolean;
  imageCaptured: boolean;
}

export interface FormErrors {
  medication?: string;
  source?: string;
}
