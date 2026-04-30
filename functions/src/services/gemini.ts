import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY, GEMINI_MODEL } from '../config.js';

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

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
  }
  return genAI;
}

function getModel() {
  return getClient().getGenerativeModel({ model: GEMINI_MODEL.value() });
}

export async function analyzeImage(imageBase64: string, prompt: string, language: string) {
  const model = getModel();
  const base64Data = imageBase64.split(',')[1] || imageBase64;

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Data,
      },
    },
    {
      text: `${prompt}\n\nRespond in ${language === 'fr' ? 'French' : 'English'}. Format as JSON.`,
    },
  ]);

  return result.response.text();
}

export async function searchMedication(medicationName: string, language: string) {
  const model = getModel();

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    {
      text: `Provide information about the medication "${medicationName}" including: generic name, common dosages, availability in Cameroon, side effects, and any contraindications. Respond in ${language === 'fr' ? 'French' : 'English'}.`,
    },
  ]);

  return result.response.text();
}

export async function checkDrugInteractions(drugs: string[], language: string) {
  const model = getModel();

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    {
      text: `Check for drug interactions between these medications: ${drugs.join(', ')}. Consider medications commonly available in Cameroon. Respond in ${language === 'fr' ? 'French' : 'English'}. Provide a brief, clear warning if any interactions exist, or state that no significant interactions were found.`,
    },
  ]);

  return result.response.text();
}
