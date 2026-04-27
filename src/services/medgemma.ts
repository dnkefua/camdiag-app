import { GoogleGenerativeAI } from '@google/generative-ai';
import type { MedGemmaAnalysisRequest, MedGemmaAnalysisResponse, Language } from '../types';

const API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY;

const SYSTEM_PROMPT = `You are MedGemma, a medical AI assistant integrated into CamDiag, a diagnostic support app for Cameroon healthcare workers. 

IMPORTANT RULES:
- You are NOT providing a diagnosis. You are providing AI-assisted analysis to SUPPORT a healthcare worker.
- Always include medical disclaimers.
- Consider medications commonly available in Cameroon.
- Include traditional remedies ("contri-medicine") used in Cameroon where relevant.
- Check for drug interactions and contraindications across all recommended medications.
- Respond in the language specified (en or fr).

When analyzing a medical image or document:
1. Identify potential conditions with confidence percentages
2. List relevant clinical markers
3. Recommend medications available in Cameroon
4. Check for drug interactions
5. Include traditional remedies where applicable
6. Provide clinical reasoning

Format your response as JSON matching this structure:
{
  "diagnoses": [{"name": "...", "probability": "...", "markers": ["..."], "drugs": ["..."], "contri": ["..."], "reasoning": "..."}],
  "markers": [{"id": "...", "label": "...", "value": "...", "status": "...", "color": "..."}],
  "contraindications": [{"drugs": ["...", "..."], "risk": "..."}],
  "disclaimer": "This is NOT a real diagnosis. Consult a doctor immediately."
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

export const analyzeMedicalImage = async (request: MedGemmaAnalysisRequest): Promise<MedGemmaAnalysisResponse> => {
  const client = getClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
  const client = getClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    {
      text: `Check for drug interactions between these medications: ${drugs.join(', ')}. Consider medications commonly available in Cameroon. Respond in ${language === 'fr' ? 'French' : 'English'}. Provide a brief, clear warning if any interactions exist, or state that no significant interactions were found.`,
    },
  ]);

  return result.response.text();
};

export const searchMedicationInfo = async (medicationName: string, language: Language): Promise<string> => {
  const client = getClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    {
      text: `Provide information about the medication "${medicationName}" including: generic name, common dosages, availability in Cameroon, side effects, and any contraindications. Respond in ${language === 'fr' ? 'French' : 'English'}.`,
    },
  ]);

  return result.response.text();
};