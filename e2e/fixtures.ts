import type { Page } from '@playwright/test';
import { CONSENT_VERSION, type Encounter, type ClinicalAnalysis, type EncounterDetail, type ClinicalJob, type OcrResult, type ConsentRecord } from '../functions/src/contracts/clinical';

const at = '2026-09-23T08:00:00.000Z';
const hash = 'a'.repeat(64);
export const encounter: Encounter = { id: 'enc-synthetic', patientId: 'DEMO-ONLY', ownerUid: 'e2e-user', organizationId: 'synthetic-e2e', documentType: 'lab_result', language: 'en', patientContext: { ageRange: 'unknown', currentMedications: [] }, triage: 'no_red_flags', status: 'transcription_review', referralStatus: 'none', createdAt: at, updatedAt: at };
export const ocr: OcrResult = { documentId: 'doc-synthetic', processorVersion: 'synthetic-ocr', requiresReview: true, pages: [{ sourcePageId: 'page-1', pageNumber: 1, text: 'SYNTHETIC SAMPLE\nReported value 125 demo units', confidence: 0.72, qualityReasons: ['Check decimal'], tokens: [{ text: '125', confidence: 0.6, pageNumber: 1, handwritten: false, boundingBox: [{ x: 0.1, y: 0.1 }, { x: 0.8, y: 0.1 }, { x: 0.8, y: 0.3 }] }] }] };
export const ocrJob: ClinicalJob = { id: 'ocr-synthetic', encounterId: encounter.id, documentId: ocr.documentId, kind: 'ocr', status: 'succeeded', attempts: 1, createdAt: at, updatedAt: at, resultId: 'ocr-result', result: ocr };
const analysis: ClinicalAnalysis = { urgency: 'unknown', possibleFindings: [{ name: 'Synthetic value requires source review', likelihood: 'uncertain', observedEvidence: ['[Source page-1, page 1] Reported value 12.5 demo units'], markers: [], medicationSafetyNotes: [], traditionalRemedyWarnings: [], reasoning: 'Synthetic example only; reference range not supplied.', recommendedNextSteps: ['Verify source and reference range.'], clinicianReviewRequired: true }], markers: [{ id: 'demo', label: 'Synthetic value', value: '12.5 demo units', status: 'review_required', color: 'gray' }], contraindications: [], limitations: ['Entirely synthetic test. Not clinical evidence.'], disclaimer: 'Not a diagnosis or prescription.', medicationAssessment: 'not_assessed', provenance: { model: 'synthetic', modelVersion: 'fixture-v1', promptVersion: 'fixture-v1', schemaVersion: 'clinical-v1', analyzedAt: at, documentId: ocr.documentId, transcriptionId: 'transcription-synthetic', sourceHashes: [hash] } };
export const sourcePage = { id: 'page-1', fileName: 'synthetic.svg', mimeType: 'image/svg+xml', contentBase64: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200"><rect width="600" height="200" fill="white"/><text x="20" y="60">SYNTHETIC SAMPLE: Reported value 12.5 demo units</text></svg>')}` };

export async function installClinicalFixtures(page: Page, options: { consent?: boolean; consentFailure?: boolean } = {}) {
  const detail: EncounterDetail = { encounter: structuredClone(encounter), documents: [{ id: ocr.documentId, encounterId: encounter.id, ownerUid: encounter.ownerUid, organizationId: encounter.organizationId, createdAt: at, expiresAt: '2099-01-01T00:00:00.000Z', pages: [{ id: 'page-1', fileName: 'synthetic.png', mimeType: 'image/png', sizeBytes: 100, sha256: hash, storagePath: `organizations/${encounter.organizationId}/users/${encounter.ownerUid}/encounters/${encounter.id}/documents/${ocr.documentId}/pages/page-1` }] }], transcriptions: [], analyses: [], reviews: [], jobs: [structuredClone(ocrJob)] };
  let consent: ConsentRecord | null = options.consent === false ? null : { version: CONSENT_VERSION, clinicalProcessing: true, optionalAnalytics: false, acceptedAt: at };
  const requests: string[] = [];
  await page.route('**/__test_api/**', async (route) => {
    const request = route.request(); const path = new URL(request.url()).pathname.replace('/__test_api/', '');
    const method = request.method(); requests.push(`${method} ${path}`);
    const input = method === 'GET' ? {} : request.postDataJSON() as Record<string, unknown>;
    let result: unknown; let status = 200;
    if (path === 'consent') {
      if (options.consentFailure) { status = 503; result = { error: 'Synthetic outage' }; }
      else { if (method === 'POST') consent = { version: CONSENT_VERSION, clinicalProcessing: input.clinicalProcessing === true, optionalAnalytics: input.optionalAnalytics === true, acceptedAt: at }; result = { consent }; }
    } else if (path === 'encounters' && method === 'GET') result = { items: [detail.encounter], nextCursor: null };
    else if (path === `encounters/${encounter.id}`) result = detail;
    else if (path.endsWith('/transcription')) {
      const transcription = { id: 'transcription-synthetic', documentId: ocr.documentId, ocrJobId: ocrJob.id, text: String(input.text), reviewed: true as const, reviewerUid: encounter.ownerUid, reviewedAt: at, sourceHashes: [hash] };
      detail.transcriptions = [transcription]; detail.encounter.latestTranscriptionId = transcription.id; result = transcription;
    } else if (path === 'jobs') {
      const job: ClinicalJob = { id: 'analysis-job', encounterId: encounter.id, documentId: ocr.documentId, kind: 'analysis', status: 'succeeded', attempts: 1, createdAt: at, updatedAt: at, resultId: 'analysis-synthetic', result: analysis };
      detail.analyses = [{ id: job.resultId!, result: analysis }]; detail.jobs.push(job); detail.encounter.latestAnalysisId = job.resultId; detail.encounter.status = 'review_required'; result = job;
    } else if (path.endsWith('/reviews')) {
      const review = { id: 'review-synthetic', analysisId: String(input.analysisId), attested: true as const, disposition: input.disposition as 'accepted', notes: String(input.notes), reviewerUid: encounter.ownerUid, reviewedAt: at };
      detail.reviews.unshift(review); detail.encounter.status = 'reviewed'; result = review;
    } else if (path.endsWith('/referral')) { detail.encounter.referralStatus = input.status as Encounter['referralStatus']; result = detail.encounter; }
    else if (['search-drug', 'check-interactions'].includes(path)) result = { status: 'not_assessed', result: 'No approved evidence in synthetic fixture.', evidence: [] };
    else { status = 404; result = { error: 'Unmocked synthetic API route' }; }
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(result) });
  });
  await page.addInitScript(() => {
    localStorage.setItem('camdiag_e2e_auth', 'true');
    window.print = () => { document.documentElement.dataset.printRequested = 'true'; };
  });
  return { detail, requests };
}

export async function openSyntheticTranscription(page: Page, withSource = true) {
  await page.goto('/app');
  await page.getByRole('button', { name: /new scan/i }).waitFor();
  await page.evaluate(async (data) => {
    const moduleUrl = '/src/store/useAppStore.ts';
    const { useAppStore } = await import(moduleUrl);
    useAppStore.setState({ activeEncounter: data.encounter, activeJob: data.ocrJob, transcription: data.ocr, pendingPages: data.withSource ? [data.sourcePage] : [], pendingDocumentType: 'lab_result' });
    history.pushState({}, '', '/transcription-review'); window.dispatchEvent(new PopStateEvent('popstate'));
  }, { encounter, ocr, ocrJob, sourcePage, withSource });
}
