import { GEMINI_LOCATION, GEMINI_MODEL } from '../config.js';
import type { AnalyzeRequestBody } from '../schemas/medgemma.js';

const SYSTEM_PROMPT = `You are MedGemma, a medical AI assistant integrated into CamDiag, a clinical decision-support app for Cameroon healthcare workers.

IMPORTANT RULES:
- You are NOT providing a diagnosis. You provide possible findings for clinician review.
- All findings must be reviewed and confirmed by a qualified clinician before treatment decisions.
- Always include strong medical disclaimers.
- Use likelihood labels only: low, moderate, high, uncertain. Do not provide percentages.
- Include medication safety notes for clinician review when relevant, limited to medicines commonly available in Cameroon. Do not present medication notes as patient instructions.
- Check for drug interactions and contraindications across medication safety notes and patient-reported current medications.
- Respond in the language specified (en or fr).
- NEVER recommend traditional/herbal remedies as treatment alternatives.
- If traditional remedies are visible or mentioned, warn that they must be discussed with a clinician/pharmacist because they may interact with prescription drugs.

When analyzing a medical image or document:
1. Identify possible findings with observational evidence.
2. List clinical markers detected in the document or image.
3. Include medication safety notes only for clinician review.
4. Check for drug interactions and contraindications.
5. Flag traditional remedies and self-medication risks.
6. Provide concise reasoning, limitations, urgency, and next steps.

Return complete JSON only.`;

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
    urgency: {
      type: 'STRING',
      enum: ['emergency', 'same_day', 'routine', 'unknown'],
    },
    possibleFindings: {
      type: 'ARRAY',
      maxItems: 5,
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          likelihood: {
            type: 'STRING',
            enum: ['low', 'moderate', 'high', 'uncertain'],
          },
          observedEvidence: {
            type: 'ARRAY',
            maxItems: 10,
            items: { type: 'STRING' },
          },
          markers: {
            type: 'ARRAY',
            maxItems: 12,
            items: { type: 'STRING' },
          },
          medicationSafetyNotes: {
            type: 'ARRAY',
            maxItems: 8,
            items: { type: 'STRING' },
          },
          traditionalRemedyWarnings: {
            type: 'ARRAY',
            maxItems: 8,
            items: { type: 'STRING' },
          },
          reasoning: { type: 'STRING' },
          recommendedNextSteps: {
            type: 'ARRAY',
            maxItems: 8,
            items: { type: 'STRING' },
          },
          clinicianReviewRequired: { type: 'BOOLEAN' },
        },
        required: [
          'name',
          'likelihood',
          'observedEvidence',
          'markers',
          'medicationSafetyNotes',
          'traditionalRemedyWarnings',
          'reasoning',
          'recommendedNextSteps',
          'clinicianReviewRequired',
        ],
      },
    },
    markers: {
      type: 'ARRAY',
      maxItems: 30,
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          label: { type: 'STRING' },
          value: { type: 'STRING' },
          status: {
            type: 'STRING',
            enum: ['normal', 'abnormal', 'critical', 'review_required', 'unknown'],
          },
          color: {
            type: 'STRING',
            enum: ['green', 'yellow', 'orange', 'red', 'blue', 'gray'],
          },
        },
        required: ['id', 'label', 'value', 'status', 'color'],
      },
    },
    contraindications: {
      type: 'ARRAY',
      maxItems: 10,
      items: {
        type: 'OBJECT',
        properties: {
          medications: {
            type: 'ARRAY',
            maxItems: 8,
            items: { type: 'STRING' },
          },
          risk: { type: 'STRING' },
          severity: {
            type: 'STRING',
            enum: ['low', 'moderate', 'high', 'unknown'],
          },
        },
        required: ['medications', 'risk', 'severity'],
      },
    },
    limitations: {
      type: 'ARRAY',
      maxItems: 8,
      items: { type: 'STRING' },
    },
    disclaimer: { type: 'STRING' },
  },
  required: ['urgency', 'possibleFindings', 'markers', 'contraindications', 'limitations', 'disclaimer'],
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

const summarizePatientContext = (context: AnalyzeRequestBody['patientContext']): string => {
  if (!context) return 'No additional patient context provided.';

  return [
    context.ageRange ? `Age range: ${context.ageRange}` : null,
    context.sexAtBirth ? `Sex at birth: ${context.sexAtBirth}` : null,
    context.pregnancyStatus ? `Pregnancy status: ${context.pregnancyStatus}` : null,
    context.symptoms?.length ? `Symptoms: ${context.symptoms.join(', ')}` : null,
    context.allergies?.length ? `Allergies: ${context.allergies.join(', ')}` : null,
    context.currentMedications?.length ? `Current medications: ${context.currentMedications.join(', ')}` : null,
  ].filter(Boolean).join('\n') || 'No additional patient context provided.';
};

const buildAnalyzeInstruction = (request: AnalyzeRequestBody): string => {
  const languageName = request.language === 'fr' ? 'French' : 'English';

  return `Analyze this ${request.documentType.replace(/_/g, ' ')} for possible findings and clinical markers.

Language: ${languageName}
Patient context:
${summarizePatientContext(request.patientContext)}

Return JSON with this exact top-level shape:
{
  "urgency": "emergency | same_day | routine | unknown",
  "possibleFindings": [],
  "markers": [],
  "contraindications": [],
  "limitations": [],
  "disclaimer": ""
}

Use only marker ids in each possibleFinding.markers that also appear in the top-level markers array. clinicianReviewRequired must always be true.`;
};

export async function analyzeImage(request: AnalyzeRequestBody) {
  return callVertex([
    {
      inlineData: {
        mimeType: getMimeType(request.imageBase64),
        data: getBase64Data(request.imageBase64),
      },
    },
    {
      text: buildAnalyzeInstruction(request),
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
