import { GoogleGenerativeAI } from '@google/generative-ai';
import type { MedGemmaAnalysisRequest, MedGemmaAnalysisResponse, Language } from '../types';
import { getActiveModel } from './model-config';
import { getAuth } from 'firebase/auth';

const API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY;
const BACKEND_URL = import.meta.env.VITE_API_URL;
const MODEL_ID = getActiveModel();

const SYSTEM_PROMPT = `You are MedGemma, a medical AI assistant integrated into CamDiag, a clinical decision-support app for Cameroon healthcare workers.

IMPORTANT RULES:
- You are NOT providing a diagnosis. You are providing AI-assisted clinical decision support to HELP a healthcare worker.
- All findings must be reviewed and confirmed by a qualified clinician before treatment decisions.
- Always include strong medical disclaimers.
- Recommend medications ONLY from those commonly available in Cameroon.
- Check for drug interactions and contraindications across all recommended medications.
- Respond in the language specified (en or fr).
- NEVER recommend traditional/herbal remedies as treatment alternatives.
- If traditional remedies are mentioned in clinical context, clearly state "Discuss with a clinician/pharmacist before use - may interact with prescription drugs."

When analyzing a medical image or document:
1. Identify potential conditions (not diagnoses) with observational findings
2. List relevant clinical markers detected
3. Recommend medications available in Cameroon ONLY after clinician confirmation
4. Check for drug interactions
5. Flag any cultural remedies found but warn against self-medication
6. Provide clinical reasoning for observations

Format your response as JSON matching this structure:
{
  "diagnoses": [{"name": "...", "probability": "...", "markers": ["..."], "drugs": ["..."], "contri": ["..."], "reasoning": "..."}],
  "markers": [{"id": "...", "label": "...", "value": "...", "status": "...", "color": "..."}],
  "contraindications": [{"drugs": ["...", "..."], "risk": "..."}],
  "disclaimer": "This is NOT a diagnosis. This is AI-assisted clinical decision support. All findings must be reviewed by a qualified clinician before any treatment decisions."
}`;

let genAI: GoogleGenerativeAI | null = null;

const getClient = (): GoogleGenerativeAI => {
  if (!genAI) {
    if (!API_KEY || API_KEY === 'your_google_ai_api_key_here') {
      throw new Error('Google AI API key not configured. Set VITE_GOOGLE_AI_API_KEY in your .env file.');
    }
    genAI = new GoogleGenerativeAI(API_KEY);
  }
  return genAI;
};

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

const callBackend = async <T>(endpoint: string, body: unknown): Promise<T | null> => {
  if (!BACKEND_URL) return null;
  try {
    const token = await getAuthToken();
    const response = await fetch(`${BACKEND_URL}/api/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Backend returned ${response.status}`);
    }
    return (await response.json()) as T;
  } catch {
    return null; // Fall back to direct Gemini
  }
};

export const analyzeMedicalImage = async (request: MedGemmaAnalysisRequest): Promise<MedGemmaAnalysisResponse> => {
  // Try backend first if configured
  if (BACKEND_URL) {
    const backendResult = await callBackend<MedGemmaAnalysisResponse>('analyze', {
      imageBase64: request.imageBase64,
      prompt: request.prompt,
      language: request.language || 'en',
    });
    if (backendResult) return backendResult;
  }

  // Fall back to direct Gemini
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODEL_ID });

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: SYSTEM_PROMPT },
  ];

  if (request.imageBase64) {
    const base64Data = request.imageBase64.split(',')[1] || request.imageBase64;
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Data,
      },
    });
  }

  parts.push({
    text: `${request.prompt}\n\nRespond in ${request.language === 'fr' ? 'French' : 'English'}. Format as JSON.`,
  });

  const result = await model.generateContent(parts);
  const response = result.response;
  const text = response.text();

  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
    return JSON.parse(jsonStr) as MedGemmaAnalysisResponse;
  } catch {
    return {
      diagnoses: [],
      markers: [],
      contraindications: [],
      disclaimer: 'AI analysis could not be parsed. Please consult a healthcare professional.',
    };
  }
};

export const checkDrugInteractions = async (drugs: string[], language: Language): Promise<string> => {
  // Try backend first if configured
  if (BACKEND_URL) {
    const backendResult = await callBackend<{ result: string }>('check-interactions', { drugs, language });
    if (backendResult?.result) return backendResult.result;
  }

  // Fall back to direct Gemini
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODEL_ID });

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    {
      text: `Check for drug interactions between these medications: ${drugs.join(', ')}. Consider medications commonly available in Cameroon. Respond in ${language === 'fr' ? 'French' : 'English'}. Provide a brief, clear warning if any interactions exist, or state that no significant interactions were found.`,
    },
  ]);

  return result.response.text();
};

export const searchMedicationInfo = async (medicationName: string, language: Language): Promise<string> => {
  // Try backend first if configured
  if (BACKEND_URL) {
    const backendResult = await callBackend<{ result: string }>('search-drug', { medicationName, language });
    if (backendResult?.result) return backendResult.result;
  }

  // Fall back to direct Gemini
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODEL_ID });

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    {
      text: `Provide information about the medication "${medicationName}" including: generic name, common dosages, availability in Cameroon, side effects, and any contraindications. Respond in ${language === 'fr' ? 'French' : 'English'}.`,
    },
  ]);

  return result.response.text();
};