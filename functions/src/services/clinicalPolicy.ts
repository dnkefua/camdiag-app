import { createHash } from 'node:crypto';
import { z } from 'zod';
import { CONSENT_VERSION, SUPPORTED_DOCUMENT_TYPES } from '../contracts/clinical.js';
import { PatientContext } from '../schemas/medgemma.js';

export class ClinicalError extends Error {
  constructor(public code: string, public status = 400, message = 'The request could not be completed safely.') { super(message); }
}
export const identifier = z.string().regex(/^[A-Za-z0-9_-]{1,80}$/);
export const consentInput = z.object({ version: z.literal(CONSENT_VERSION), clinicalProcessing: z.boolean(), optionalAnalytics: z.boolean() }).strict();
export const encounterInput = z.object({ patientId: identifier, documentType: z.enum(SUPPORTED_DOCUMENT_TYPES), language: z.enum(['en', 'fr']), patientContext: PatientContext, triage: z.enum(['no_red_flags', 'emergency']) }).strict();
export const pageInput = z.object({ id: identifier, fileName: z.string().trim().min(1).max(180), mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']), sizeBytes: z.number().int().positive().max(6 * 1024 * 1024), sha256: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export const documentInput = z.object({ pages: z.array(pageInput).min(1).max(15) }).strict().superRefine(({ pages }, ctx) => {
  if (pages.reduce((sum, page) => sum + page.sizeBytes, 0) > 24 * 1024 * 1024) ctx.addIssue({code: 'custom',message: 'Document exceeds 24 MiB.'});
  if (new Set(pages.map((page) => page.id)).size !== pages.length) ctx.addIssue({code: 'custom',message: 'Page identifiers must be unique.'});
});
export const jobInput = z.object({ encounterId: identifier, documentId: identifier, kind: z.enum(['ocr', 'analysis']), idempotencyKey: identifier, transcriptionId: identifier.optional() }).strict().refine((input) => input.kind !== 'analysis' || Boolean(input.transcriptionId), 'Reviewed transcription required.');
export const transcriptionInput = z.object({documentId: identifier, ocrJobId: identifier, text: z.string().trim().min(1).max(60_000), reviewed: z.literal(true)}).strict();
export const reviewInput = z.object({analysisId: identifier, attested: z.literal(true), disposition: z.enum(['accepted','corrected','rejected']), notes: z.string().trim().max(4000)}).strict().refine((input) => input.disposition === 'accepted' || input.notes.length > 0, 'Corrections and rejection require notes.');
export const referralInput = z.object({status: z.enum(['none','recommended','arranged','completed','declined']),notes: z.string().trim().max(2000).optional()}).strict();
export const stableId = (...parts: string[]) => createHash('sha256').update(JSON.stringify(parts)).digest('hex');
export const sha256 = (value: Uint8Array | string) => createHash('sha256').update(value).digest('hex');
export function requireOwnership(data: Record<string, unknown> | undefined, uid: string, organizationId: string) {
  if (!data || data.ownerUid !== uid || data.organizationId !== organizationId) throw new ClinicalError('NOT_FOUND', 404, 'Record not found.');
}
export function requireAnalysisState(encounter: Record<string, unknown>, transcription: Record<string, unknown> | undefined, documentId: string, transcriptionId: string) {
  if (encounter.triage !== 'no_red_flags') throw new ClinicalError('EMERGENCY_PATH_REQUIRED', 409, 'Emergency care must take priority over AI review.');
  if (!transcription || transcription.reviewed !== true || transcription.documentId !== documentId || encounter.latestTranscriptionId !== transcriptionId) throw new ClinicalError('TRANSCRIPTION_REVIEW_REQUIRED', 409, 'Review the current source transcription first.');
}
export function validateImageBytes(bytes: Buffer, mimeType: string, expectedHash: string, sizeBytes: number) {
  const validSignature = mimeType === 'image/jpeg' ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    : mimeType === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
      : mimeType === 'image/webp' && bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP';
  if (!validSignature || bytes.length !== sizeBytes || sha256(bytes) !== expectedHash) throw new ClinicalError('SOURCE_INTEGRITY_FAILED', 409, 'The uploaded source does not match its manifest.');
}
export const isTransientProviderStatus = (status: number) => status === 429 || status === 408 || status >= 500;
export function providerFailure(status: number) { return new ClinicalError(isTransientProviderStatus(status) ? 'PROVIDER_TEMPORARY' : 'PROVIDER_REJECTED', 502, 'The document service is temporarily unavailable.'); }
