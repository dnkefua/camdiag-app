import { getAuth } from 'firebase/auth';
import { getBlob, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { getAppCheckToken } from '../lib/firebase';
import { getSensitiveSessionSignal, resetSensitiveSession } from './session';
import type {
  Language,
  MedGemmaAnalysisRequest,
  MedGemmaAnalysisResponse,
  DocumentPageInput,
  DocumentTranscription,
} from '../types';
import type {
  ClinicalJob,
  CreateEncounterInput,
  Encounter,
  EncounterDetail,
  CreateJobInput,
  ConfirmTranscriptionInput,
  ReviewInput,
  ClinicalAnalysis,
  OcrResult,
  UploadPageInput,
} from '../../functions/src/contracts/clinical';
import { clinicalLanguage } from '../utils/clinicalLanguage';
import {
  isClinicalAnalysis,
  isClinicalJob,
  isDocumentManifest,
  isEncounter,
  isEncounterDetail,
  isEncounterPage,
  isMedicationAssessment,
  isOcrResult,
  isReview,
  isTranscription,
  validateClinicalResponse as validate,
} from '../utils/clinicalValidation';

export const isAnalysis = isClinicalAnalysis;
const testIdentity = () =>
  import.meta.env.DEV &&
  import.meta.env.VITE_E2E_AUTH_BYPASS === 'true' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname) &&
  window.localStorage.getItem('camdiag_e2e_auth') === 'true';

export const clinicalRequest = async <T>(
  path: string,
  body?: unknown,
  options: { signal?: AbortSignal; method?: string } = {}
): Promise<T> => {
  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
  if (!baseUrl) throw new Error('The secure clinical backend is not configured.');
  const auth = getAuth();
  const testing = testIdentity();
  if (testing && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/__test_api$/.test(baseUrl))
    throw new Error('Synthetic clinical tests require the local fixture API.');
  const user = testing
    ? { uid: 'e2e-user', getIdToken: async () => 'synthetic-test-token' }
    : auth.currentUser;
  if (!user) throw new Error('Sign in to use clinical tools.');
  const controller = new AbortController();
  const sessionSignal = getSensitiveSessionSignal();
  const abort = () => controller.abort();
  const signals = [sessionSignal, options.signal].filter((s): s is AbortSignal => Boolean(s));
  signals.forEach((s) => {
    s.addEventListener('abort', abort, { once: true });
    if (s.aborted) abort();
  });
  const timeout = window.setTimeout(abort, 30000);
  try {
    const [token, appCheck] = await Promise.all([
      user.getIdToken(),
      testing ? Promise.resolve(null) : getAppCheckToken(),
    ]);
    if ((!testing && auth.currentUser?.uid !== user.uid) || controller.signal.aborted)
      throw new DOMException('Session changed or request cancelled', 'AbortError');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    if (appCheck) headers['X-Firebase-AppCheck'] = appCheck;
    const response = await fetch(`${baseUrl}/${path}`, {
      method: options.method ?? (body === undefined ? 'GET' : 'POST'),
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal,
    });
    if ((!testing && auth.currentUser?.uid !== user.uid) || controller.signal.aborted)
      throw new DOMException('Session changed', 'AbortError');
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) resetSensitiveSession();
      throw new Error(
        response.status === 403
          ? 'Clinical access or current consent is required.'
          : response.status === 401
            ? 'Sign in again to restore your session.'
            : response.status === 429
              ? 'Processing quota reached. Try again later.'
              : `The request could not complete (${response.status}). Your saved work can be reopened.`
      );
    }
    const result = (await response.json()) as T;
    if ((!testing && auth.currentUser?.uid !== user.uid) || controller.signal.aborted)
      throw new DOMException('Session changed', 'AbortError');
    return result;
  } finally {
    window.clearTimeout(timeout);
    signals.forEach((s) => s.removeEventListener('abort', abort));
  }
};

export const createEncounter = async (input: CreateEncounterInput, signal?: AbortSignal) =>
  validate(await clinicalRequest('encounters', input, { signal }), isEncounter);
export const listEncounters = async (cursor?: string, signal?: AbortSignal) =>
  validate(
    await clinicalRequest(
      `encounters?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
      undefined,
      { signal }
    ),
    isEncounterPage
  );
export const getEncounter = async (id: string, signal?: AbortSignal): Promise<EncounterDetail> => {
  const detail = validate(
    await clinicalRequest(`encounters/${encodeURIComponent(id)}`, undefined, { signal }),
    isEncounterDetail
  );
  if (detail.encounter.id !== id)
    throw new Error('The saved encounter did not match the requested record.');
  return detail;
};
export const createDocument = async (
  encounterId: string,
  pages: UploadPageInput[],
  signal?: AbortSignal
) => {
  const document = validate(
    await clinicalRequest(
      `encounters/${encodeURIComponent(encounterId)}/documents`,
      { pages },
      { signal }
    ),
    isDocumentManifest
  );
  if (
    document.encounterId !== encounterId ||
    document.pages.length !== pages.length ||
    document.pages.some((p, i) => p.id !== pages[i]?.id || p.sha256 !== pages[i]?.sha256)
  )
    throw new Error('Source manifest did not match selected pages.');
  return document;
};
export const createJob = async (input: CreateJobInput, signal?: AbortSignal) => {
  const job = validate(await clinicalRequest('jobs', input, { signal }), isClinicalJob);
  if (
    job.encounterId !== input.encounterId ||
    job.documentId !== input.documentId ||
    job.kind !== input.kind
  )
    throw new Error('Processing job did not match the requested encounter.');
  return job;
};
export const getJob = async (id: string, signal?: AbortSignal) => {
  const job = validate(
    await clinicalRequest(`jobs/${encodeURIComponent(id)}`, undefined, { signal }),
    isClinicalJob
  );
  if (job.id !== id) throw new Error('Unexpected processing job.');
  return job;
};
export const confirmTranscription = async (
  id: string,
  input: ConfirmTranscriptionInput,
  signal?: AbortSignal
) => {
  const result = validate(
    await clinicalRequest(`encounters/${encodeURIComponent(id)}/transcription`, input, { signal }),
    isTranscription
  );
  if (
    result.documentId !== input.documentId ||
    result.ocrJobId !== input.ocrJobId ||
    result.text !== input.text
  )
    throw new Error('Saved transcription did not match the review.');
  return result;
};
export const signClinicalReview = async (id: string, input: ReviewInput, signal?: AbortSignal) => {
  const result = validate(
    await clinicalRequest(`encounters/${encodeURIComponent(id)}/reviews`, input, { signal }),
    isReview
  );
  if (
    result.analysisId !== input.analysisId ||
    result.disposition !== input.disposition ||
    result.notes !== input.notes
  )
    throw new Error('Saved review did not match the attestation.');
  return result;
};
export const updateReferral = async (
  id: string,
  status: Encounter['referralStatus'],
  notes: string,
  signal?: AbortSignal
) => {
  const result = validate(
    await clinicalRequest(
      `encounters/${encodeURIComponent(id)}/referral`,
      { status, notes },
      { method: 'PATCH', signal }
    ),
    isEncounter
  );
  if (result.id !== id || result.referralStatus !== status)
    throw new Error('Referral status was not confirmed.');
  return result;
};

export const waitForJob = async (
  initial: ClinicalJob,
  signal: AbortSignal,
  onProgress: (job: ClinicalJob) => void
): Promise<ClinicalJob> => {
  let job = initial;
  const deadline = Date.now() + 5 * 60000;
  const sessionSignal = getSensitiveSessionSignal();
  while (job.status === 'queued' || job.status === 'running') {
    if (signal.aborted || sessionSignal.aborted)
      throw new DOMException('Stopped waiting', 'AbortError');
    onProgress(job);
    if (Date.now() > deadline)
      throw new Error(
        'Processing is still pending. Reopen this encounter from records to check the saved job.'
      );
    await new Promise<void>((resolve, reject) => {
      const cancel = () => {
        clearTimeout(timer);
        signal.removeEventListener('abort', cancel);
        sessionSignal.removeEventListener('abort', cancel);
        reject(new DOMException('Stopped waiting', 'AbortError'));
      };
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', cancel);
        sessionSignal.removeEventListener('abort', cancel);
        resolve();
      }, 2000);
      signal.addEventListener('abort', cancel, { once: true });
      sessionSignal.addEventListener('abort', cancel, { once: true });
    });
    job = await getJob(job.id, signal);
  }
  if (signal.aborted || sessionSignal.aborted)
    throw new DOMException('Stopped waiting', 'AbortError');
  onProgress(job);
  if (job.status === 'failed')
    throw new Error(
      `Processing failed (${job.errorCode ?? 'processing_failed'}). Review the document and retry from its encounter.`
    );
  return job;
};

export const uploadClinicalPage = (
  storagePath: string,
  file: Blob,
  signal: AbortSignal,
  progress: (percent: number) => void
): Promise<void> =>
  new Promise((resolve, reject) => {
    const sessionSignal = getSensitiveSessionSignal();
    if (signal.aborted || sessionSignal.aborted) {
      reject(new DOMException('Upload cancelled', 'AbortError'));
      return;
    }
    const task = uploadBytesResumable(ref(getStorage(), storagePath), file, {
      contentType: file.type,
    });
    const cancel = () => task.cancel();
    const cleanup = () => {
      signal.removeEventListener('abort', cancel);
      sessionSignal.removeEventListener('abort', cancel);
    };
    signal.addEventListener('abort', cancel, { once: true });
    sessionSignal.addEventListener('abort', cancel, { once: true });
    task.on(
      'state_changed',
      (state) => {
        if (!signal.aborted && !sessionSignal.aborted)
          progress(Math.round((state.bytesTransferred / state.totalBytes) * 100));
      },
      () => {
        cleanup();
        reject(new Error('Upload did not finish. Reselect the same source pages to retry.'));
      },
      () => {
        cleanup();
        if (sessionSignal.aborted || signal.aborted)
          reject(new DOMException('Upload cancelled', 'AbortError'));
        else resolve();
      }
    );
  });
export const loadSourcePage = async (storagePath: string): Promise<Blob> => {
  const signal = getSensitiveSessionSignal();
  const blob = await getBlob(ref(getStorage(), storagePath), 6 * 1024 * 1024);
  if (signal.aborted) throw new DOMException('Session changed', 'AbortError');
  return blob;
};
export const sha256 = async (file: Blob): Promise<string> =>
  Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer())),
    (byte) => byte.toString(16).padStart(2, '0')
  ).join('');

export const checkDrugInteractions = async (
  drugs: string[],
  language: Language,
  encounterId?: string,
  signal?: AbortSignal
) =>
  validate(
    await clinicalRequest(
      'check-interactions',
      { drugs, language: clinicalLanguage(language), encounterId },
      { signal }
    ),
    isMedicationAssessment
  );
export const searchMedicationInfo = async (
  medicationName: string,
  language: Language,
  signal?: AbortSignal
) =>
  validate(
    await clinicalRequest(
      'search-drug',
      { medicationName, language: clinicalLanguage(language) },
      { signal }
    ),
    isMedicationAssessment
  );

// Legacy APIs fail closed: interpretation now needs saved sources and review.
export const analyzeMedicalImage = async (
  _request: MedGemmaAnalysisRequest
): Promise<MedGemmaAnalysisResponse> => {
  throw new Error('Use the encounter workflow to analyze a reviewed document.');
};
export const transcribeMedicalDocument = async (
  _pages: DocumentPageInput[],
  _language: Language
): Promise<DocumentTranscription> => {
  throw new Error('Use the encounter workflow to upload source documents.');
};
export const analysisFromJob = (job: ClinicalJob): ClinicalAnalysis => {
  if (job.kind !== 'analysis' || job.status !== 'succeeded' || !isClinicalAnalysis(job.result))
    throw new Error('Analysis is not ready.');
  return job.result;
};
export const transcriptionFromJob = (job: ClinicalJob): OcrResult => {
  if (job.kind !== 'ocr' || job.status !== 'succeeded' || !isOcrResult(job.result))
    throw new Error('Transcription is not ready.');
  return job.result;
};
