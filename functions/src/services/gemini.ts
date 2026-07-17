import { GEMINI_LOCATION, GEMINI_MODEL } from '../config.js';
import type { AnalyzeRequestBody } from '../schemas/medgemma.js';

const SYSTEM_PROMPT = `You are the medical document interpretation assistant integrated into CamDiag, a clinical decision-support app.

IMPORTANT RULES:
- You are NOT providing a diagnosis. You provide possible findings for clinician review.
- All findings must be reviewed and confirmed by a qualified clinician before treatment decisions.
- Always include strong medical disclaimers.
- Use likelihood labels only: low, moderate, high, uncertain. Do not provide percentages.
- Interpret abnormal, critical, and review-required laboratory values in plain language. Do not stop at transcription or merely repeat the report.
- When the evidence supports a possible finding, include generic medication classes or medicines that a licensed clinician may consider, the indication, and the checks required before use. Never provide doses, schedules, or patient treatment instructions.
- Do not recommend antibiotics, antimalarials, anticoagulants, steroids, or other prescription treatment from a nonspecific abnormal value alone. State what diagnosis or confirmatory information is required first.
- If allergies, pregnancy status, kidney/liver function, age, or current medicines are missing, explicitly state that medication safety cannot be confirmed from the document alone.
- Check for drug interactions and contraindications across medication safety notes and patient-reported current medications.
- Whenever medicationSafetyNotes names a medicine or medicine class, add a matching top-level contraindications entry for important known or conditional risks. Use severity unknown when patient context is missing, and never invent a patient-specific contraindication.
- Respond in the language specified (en or fr).
- NEVER recommend traditional/herbal remedies as treatment alternatives.
- Never silently correct uncertain transcription. Preserve ambiguity and require clinician review for uncertain medication names, decimal doses, units, allergies, pregnancy, and pediatric instructions.
- Every extracted claim must identify its page in observedEvidence. If it cannot be grounded in the supplied document or confirmed transcription, omit it.
- If traditional remedies are visible or mentioned, warn that they must be discussed with a clinician/pharmacist because they may interact with prescription drugs.

When analyzing a medical image or document:
1. Identify possible findings and ground each one in page-labeled observational evidence.
2. List important normal and abnormal clinical markers, preserving values, units, and reference ranges where present.
3. Explain the clinical significance of abnormal values without claiming a confirmed diagnosis.
4. Include medication options and safety notes only for licensed-clinician review when clinically supportable.
5. Check for drug interactions, allergy risks, pregnancy risks, and kidney/liver contraindications using only the supplied context.
6. Flag traditional remedies and self-medication risks.
7. Provide concise reasoning, limitations, urgency, and actionable next steps.

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
            items: { type: 'STRING' },
          },
          markers: {
            type: 'ARRAY',
            items: { type: 'STRING' },
          },
          medicationSafetyNotes: {
            type: 'ARRAY',
            items: { type: 'STRING' },
          },
          traditionalRemedyWarnings: {
            type: 'ARRAY',
            items: { type: 'STRING' },
          },
          reasoning: { type: 'STRING' },
          recommendedNextSteps: {
            type: 'ARRAY',
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
      items: {
        type: 'OBJECT',
        properties: {
          medications: {
            type: 'ARRAY',
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

  return `Interpret this ${request.documentType.replace(/_/g, ' ')} for possible findings, clinical significance, medication considerations, contraindications, and next steps.

Language: ${languageName}
Patient context:
${summarizePatientContext(request.patientContext)}

Clinician-confirmed transcription:
${request.confirmedTranscription || 'Not provided. Treat uncertain document text as unresolved.'}

Return JSON with this exact top-level shape:
{
  "urgency": "emergency | same_day | routine | unknown",
  "possibleFindings": [],
  "markers": [],
  "contraindications": [],
  "limitations": [],
  "disclaimer": ""
}

Use only marker ids in each possibleFinding.markers that also appear in the top-level markers array. clinicianReviewRequired must always be true. If a medication option is named, include its important contraindications or required safety exclusions in the top-level contraindications array.`;
};

export async function analyzeImage(request: AnalyzeRequestBody) {
  const documentParts = [
    ...(request.pages?.map((page) => ({
      inlineData: { mimeType: page.mimeType, data: getBase64Data(page.contentBase64) },
    })) ?? []),
    ...(request.imageBase64
      ? [{ inlineData: { mimeType: getMimeType(request.imageBase64), data: getBase64Data(request.imageBase64) } }]
      : []),
  ];

  return callVertex([
    ...documentParts,
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
