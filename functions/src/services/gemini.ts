import { GEMINI_LOCATION, GEMINI_MODEL } from '../config.js';

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

interface VertexResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  error?: {
    message?: string;
    status?: string;
  };
}

type VertexGenerationConfig = {
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  responseSchema?: Record<string, unknown>;
};

const ANALYZE_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    diagnoses: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          probability: { type: 'STRING' },
          markers: { type: 'ARRAY', items: { type: 'STRING' } },
          drugs: { type: 'ARRAY', items: { type: 'STRING' } },
          contri: { type: 'ARRAY', items: { type: 'STRING' } },
          reasoning: { type: 'STRING' },
        },
        required: ['name', 'probability', 'markers', 'drugs', 'contri', 'reasoning'],
      },
    },
    markers: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          label: { type: 'STRING' },
          value: { type: 'STRING' },
          status: { type: 'STRING' },
          color: { type: 'STRING' },
        },
        required: ['id', 'label', 'value', 'status', 'color'],
      },
    },
    contraindications: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          drugs: { type: 'ARRAY', items: { type: 'STRING' } },
          risk: { type: 'STRING' },
        },
        required: ['drugs', 'risk'],
      },
    },
    disclaimer: { type: 'STRING' },
  },
  required: ['diagnoses', 'markers', 'contraindications', 'disclaimer'],
};

const getProjectId = (): string => {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  if (!projectId) throw new Error('Google Cloud project is not configured for Vertex AI.');
  return projectId;
};

const getAccessToken = async (): Promise<string> => {
  const response = await fetch(
    'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
    { headers: { 'Metadata-Flavor': 'Google' } },
  );

  if (!response.ok) {
    throw new Error(`Could not get service account token for Vertex AI (${response.status}).`);
  }

  const data = await response.json() as { access_token?: string };
  if (!data.access_token) throw new Error('Service account token response did not include an access token.');
  return data.access_token;
};

const getMimeType = (imageBase64: string): string => {
  const match = imageBase64.match(/^data:([^;]+);base64,/);
  return match?.[1] || 'image/jpeg';
};

const getBase64Data = (imageBase64: string): string => imageBase64.split(',')[1] || imageBase64;

const callVertex = async (
  parts: Array<Record<string, unknown>>,
  generationConfig: VertexGenerationConfig = {},
): Promise<string> => {
  const projectId = getProjectId();
  const location = GEMINI_LOCATION.value();
  const model = GEMINI_MODEL.value();
  const token = await getAccessToken();
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
        ...generationConfig,
      },
    }),
  });

  const data = await response.json() as VertexResponse;
  if (!response.ok) {
    throw new Error(data.error?.message || `Vertex AI returned ${response.status}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
  if (!text) {
    const finishReason = data.candidates?.[0]?.finishReason;
    throw new Error(`Vertex AI returned an empty response${finishReason ? ` (${finishReason})` : ''}.`);
  }
  return text;
};

export async function analyzeImage(imageBase64: string, prompt: string, language: string) {
  return callVertex([
    {
      inlineData: {
        mimeType: getMimeType(imageBase64),
        data: getBase64Data(imageBase64),
      },
    },
    {
      text: `${prompt}\n\nRespond in ${language === 'fr' ? 'French' : 'English'}. Return complete JSON only. Do not truncate strings.`,
    },
  ], {
    maxOutputTokens: 4096,
    responseMimeType: 'application/json',
    responseSchema: ANALYZE_RESPONSE_SCHEMA,
  });
}

export async function searchMedication(medicationName: string, language: string) {
  return callVertex([
    {
      text: `Provide information about the medication "${medicationName}" including: generic name, common dosages, availability in Cameroon, side effects, and any contraindications. Respond in ${language === 'fr' ? 'French' : 'English'}.`,
    },
  ]);
}

export async function checkDrugInteractions(drugs: string[], language: string) {
  return callVertex([
    {
      text: `Check for drug interactions between these medications: ${drugs.join(', ')}. Consider medications commonly available in Cameroon. Respond in ${language === 'fr' ? 'French' : 'English'}. Provide a brief, clear warning if any interactions exist, or state that no significant interactions were found.`,
    },
  ]);
}
