import { z } from 'zod';

export const AnalyzeRequestBody = z.object({
  imageBase64: z.string().min(1, 'Image data is required'),
  prompt: z.string().min(1, 'Prompt is required'),
  language: z.enum(['en', 'fr']).default('en'),
});

export type AnalyzeRequestBody = z.infer<typeof AnalyzeRequestBody>;

const Diagnosis = z.object({
  name: z.string(),
  probability: z.string(),
  markers: z.array(z.string()),
  drugs: z.array(z.string()),
  contri: z.array(z.string()),
  reasoning: z.string(),
});

const Marker = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  status: z.string(),
  color: z.string(),
});

const Contraindication = z.object({
  drugs: z.array(z.string()),
  risk: z.string(),
});

export const AnalyzeResponse = z.object({
  diagnoses: z.array(Diagnosis),
  markers: z.array(Marker),
  contraindications: z.array(Contraindication),
  disclaimer: z.string(),
});

export type AnalyzeResponse = z.infer<typeof AnalyzeResponse>;

export const SearchDrugRequestBody = z.object({
  medicationName: z.string().min(1, 'Medication name is required'),
  language: z.enum(['en', 'fr']).default('en'),
});

export type SearchDrugRequestBody = z.infer<typeof SearchDrugRequestBody>;

export const CheckInteractionsRequestBody = z.object({
  drugs: z.array(z.string()).min(1, 'At least one drug is required'),
  language: z.enum(['en', 'fr']).default('en'),
});

export type CheckInteractionsRequestBody = z.infer<typeof CheckInteractionsRequestBody>;
