import { z } from 'zod';

export const BackendLanguage = z.enum(['en', 'fr']);

export const DocumentType = z.enum([
  'lab_result',
  'xray',
  'rdt',
  'prescription',
  'medical_document',
  'other',
]);

export const PatientContext = z.object({
  ageRange: z.string().trim().max(40).optional(),
  sexAtBirth: z.enum(['female', 'male', 'unknown']).optional(),
  pregnancyStatus: z.enum(['pregnant', 'not_pregnant', 'unknown']).optional(),
  symptoms: z.array(z.string().trim().min(1).max(120)).max(12).optional(),
  allergies: z.array(z.string().trim().min(1).max(120)).max(12).optional(),
  currentMedications: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
}).strict();

export const AnalyzeRequestBody = z.object({
  imageBase64: z.string().min(1).max(9_000_000).optional(),
  pages: z.array(z.object({
    id: z.string().trim().min(1).max(80),
    fileName: z.string().trim().min(1).max(180),
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'image/tiff']),
    contentBase64: z.string().min(1).max(14_000_000),
  }).strict()).min(1).max(15).optional(),
  confirmedTranscription: z.string().trim().min(1).max(60_000).optional(),
  language: BackendLanguage.default('en'),
  documentType: DocumentType.default('medical_document'),
  patientContext: PatientContext.optional(),
}).strict().refine((value) => Boolean(value.imageBase64 || value.pages?.length), 'Document data is required');

export type AnalyzeRequestBody = z.infer<typeof AnalyzeRequestBody>;

export const TranscribeRequestBody = z.object({
  pages: z.array(z.object({
    id: z.string().trim().min(1).max(80),
    fileName: z.string().trim().min(1).max(180),
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'image/tiff']),
    contentBase64: z.string().min(1).max(14_000_000),
  }).strict()).min(1).max(15),
  language: BackendLanguage.default('en'),
  handwritingHint: z.boolean().default(true),
}).strict();

export type TranscribeRequestBody = z.infer<typeof TranscribeRequestBody>;

const PossibleFinding = z.object({
  name: z.string().trim().min(1).max(120),
  likelihood: z.enum(['low', 'moderate', 'high', 'uncertain']),
  observedEvidence: z.array(z.string().trim().min(1).max(180)).max(10),
  markers: z.array(z.string().trim().min(1).max(80)).max(12),
  medicationSafetyNotes: z.array(z.string().trim().min(1).max(220)).max(8),
  traditionalRemedyWarnings: z.array(z.string().trim().min(1).max(220)).max(8),
  reasoning: z.string().trim().min(1).max(1200),
  recommendedNextSteps: z.array(z.string().trim().min(1).max(220)).max(8),
  clinicianReviewRequired: z.literal(true),
}).strict();

const Marker = z.object({
  id: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(120),
  value: z.string().trim().min(1).max(160),
  status: z.enum(['normal', 'abnormal', 'critical', 'review_required', 'unknown']),
  color: z.enum(['green', 'yellow', 'orange', 'red', 'blue', 'gray']),
}).strict();

const Contraindication = z.object({
  medications: z.array(z.string().trim().min(1).max(120)).min(1).max(8),
  risk: z.string().trim().min(1).max(300),
  severity: z.enum(['low', 'moderate', 'high', 'unknown']),
}).strict();

export const AnalyzeResponse = z.object({
  urgency: z.enum(['emergency', 'same_day', 'routine', 'unknown']),
  possibleFindings: z.array(PossibleFinding).max(5),
  markers: z.array(Marker).max(30),
  contraindications: z.array(Contraindication).max(10),
  limitations: z.array(z.string().trim().min(1).max(250)).max(8),
  disclaimer: z.string().trim().min(1).max(600),
  provenance: z.object({
    model: z.string().max(120),
    modelVersion: z.string().max(120).optional(),
    promptVersion: z.string().max(80),
    ocrProcessorVersion: z.string().max(120).optional(),
    analyzedAt: z.string().datetime(),
  }).optional(),
}).strict();

export type AnalyzeResponse = z.infer<typeof AnalyzeResponse>;

export const SearchDrugRequestBody = z.object({
  medicationName: z.string().trim().min(1, 'Medication name is required').max(120),
  language: BackendLanguage.default('en'),
}).strict();

export type SearchDrugRequestBody = z.infer<typeof SearchDrugRequestBody>;

export const CheckInteractionsRequestBody = z.object({
  drugs: z.array(z.string().trim().min(1).max(120)).min(1, 'At least one drug is required').max(20),
  language: BackendLanguage.default('en'),
}).strict();

export type CheckInteractionsRequestBody = z.infer<typeof CheckInteractionsRequestBody>;
