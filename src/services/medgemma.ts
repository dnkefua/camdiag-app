import type { MedGemmaAnalysisRequest, MedGemmaAnalysisResponse, Language } from '../types';
import { getAuth } from 'firebase/auth';

const BACKEND_URL = import.meta.env.VITE_API_URL;

const getAuthToken = async (): Promise<string | null> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
  } catch {
    // Not signed in or no auth available
  }
  return null;
};

const requireBackendUrl = (): string => {
  if (!BACKEND_URL) {
    throw new Error('CamDiag AI backend is not configured. Set VITE_API_URL for production.');
  }
  return BACKEND_URL.replace(/\/$/, '');
};

const callBackend = async <T>(endpoint: string, body: unknown): Promise<T> => {
  const baseUrl = requireBackendUrl();
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Please sign in to use CamDiag AI features.');
  }

  const response = await fetch(`${baseUrl}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = typeof errorData.error === 'string'
      ? errorData.error
      : `CamDiag AI backend returned ${response.status}`;
    throw new Error(message);
  }

  return (await response.json()) as T;
};

export const analyzeMedicalImage = async (request: MedGemmaAnalysisRequest): Promise<MedGemmaAnalysisResponse> => {
  return callBackend<MedGemmaAnalysisResponse>('analyze', {
    imageBase64: request.imageBase64,
    prompt: request.prompt,
    language: request.language || 'en',
  });
};

export const checkDrugInteractions = async (drugs: string[], language: Language): Promise<string> => {
  const backendResult = await callBackend<{ result: string }>('check-interactions', { drugs, language });
  return backendResult.result;
};

export const searchMedicationInfo = async (medicationName: string, language: Language): Promise<string> => {
  const backendResult = await callBackend<{ result: string }>('search-drug', { medicationName, language });
  return backendResult.result;
};
