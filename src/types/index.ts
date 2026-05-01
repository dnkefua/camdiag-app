export type Language = 'en' | 'fr' | 'pcm';

export type ScreenRoute =
  | '/'
  | '/demo'
  | '/scanner'
  | '/analysis'
  | '/next-steps'
  | '/drugs'
  | '/patients'
  | '/settings'
  | '/questionnaire'
  | '/blog'
  | '/coming-up';

export interface Diagnosis {
  name: string;
  probability: string;
  markers: string[];
  drugs: string[];
  contri: string[];
  reasoning: string;
}

export interface ClinicalMarker {
  id: string;
  label: string;
  value: string;
  status: string;
  color: string;
}

export interface Contraindication {
  drugs: string[];
  risk: string;
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
}

export interface MedGemmaAnalysisRequest {
  imageBase64?: string;
  prompt: string;
  language: Language;
}

export interface MedGemmaAnalysisResponse {
  diagnoses: Diagnosis[];
  markers: ClinicalMarker[];
  contraindications: Contraindication[];
  disclaimer: string;
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
