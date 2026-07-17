import { Router } from 'express';
import { analyzeImage } from '../services/gemini.js';
import { writeAuditLog } from '../services/audit.js';
import { verifyAuth } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { RATE_LIMIT } from '../config.js';
import { AnalyzeRequestBody, AnalyzeResponse } from '../schemas/medgemma.js';

const router = Router();

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as UnknownRecord
    : {}
);

const cleanText = (value: unknown, maxLength: number, fallback = ''): string => {
  if (typeof value !== 'string') return fallback;
  const text = value.trim();
  if (!text) return fallback;
  if (text.length <= maxLength) return text;

  const fragment = text.slice(0, Math.max(1, maxLength - 3));
  const wordBoundary = fragment.lastIndexOf(' ');
  const shortened = wordBoundary > fragment.length * 0.7 ? fragment.slice(0, wordBoundary) : fragment;
  return `${shortened}...`;
};

const cleanTextList = (value: unknown, maxItems: number, maxLength: number): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanText(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
};

const enumValue = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T => (
  typeof value === 'string' && (allowed as readonly string[]).includes(value) ? value as T : fallback
);

const fallbackAnalyzeResponse = (language: string): AnalyzeResponse => ({
  urgency: 'unknown',
  possibleFindings: [],
  markers: [
    {
      id: 'ai-output-review',
      label: language === 'fr' ? 'Analyse a revoir' : 'Analysis needs review',
      value: language === 'fr'
        ? 'La reponse IA etait incomplete. Reessayez ou consultez un professionnel de sante.'
        : 'The AI response was incomplete. Try again or consult a healthcare professional.',
      status: 'review_required',
      color: 'yellow',
    },
  ],
  contraindications: [],
  limitations: [
    language === 'fr'
      ? 'La reponse IA structuree etait incomplete.'
      : 'The structured AI response was incomplete.',
  ],
  disclaimer: language === 'fr'
    ? "Ceci n'est PAS un diagnostic. L'analyse IA doit etre revue par un professionnel de sante qualifie."
    : 'This is NOT a diagnosis. AI-assisted analysis must be reviewed by a qualified healthcare professional.',
});

const normalizeAnalyzeResponse = (value: unknown, language: string): AnalyzeResponse => {
  const source = asRecord(value);
  const seenMarkerIds = new Set<string>();
  const markers = (Array.isArray(source.markers) ? source.markers : []).slice(0, 30).map((entry, index) => {
    const marker = asRecord(entry);
    let id = cleanText(marker.id, 80, `marker-${index + 1}`);
    while (seenMarkerIds.has(id)) id = `${id.slice(0, 72)}-${index + 1}`;
    seenMarkerIds.add(id);

    const status = enumValue(
      marker.status,
      ['normal', 'abnormal', 'critical', 'review_required', 'unknown'] as const,
      'unknown',
    );
    const defaultColor = status === 'critical'
      ? 'red'
      : status === 'abnormal'
        ? 'orange'
        : status === 'normal'
          ? 'green'
          : status === 'review_required'
            ? 'yellow'
            : 'gray';

    return {
      id,
      label: cleanText(marker.label, 120, `Clinical marker ${index + 1}`),
      value: cleanText(marker.value, 160, 'Not stated'),
      status,
      color: enumValue(marker.color, ['green', 'yellow', 'orange', 'red', 'blue', 'gray'] as const, defaultColor),
    };
  });

  const possibleFindings = (Array.isArray(source.possibleFindings) ? source.possibleFindings : [])
    .slice(0, 5)
    .map((entry, index) => {
      const finding = asRecord(entry);
      return {
        name: cleanText(finding.name, 120, `Clinical finding ${index + 1}`),
        likelihood: enumValue(finding.likelihood, ['low', 'moderate', 'high', 'uncertain'] as const, 'uncertain'),
        observedEvidence: cleanTextList(finding.observedEvidence, 10, 180),
        markers: cleanTextList(finding.markers, 12, 80).filter((id) => seenMarkerIds.has(id)),
        medicationSafetyNotes: cleanTextList(finding.medicationSafetyNotes, 8, 220),
        traditionalRemedyWarnings: cleanTextList(finding.traditionalRemedyWarnings, 8, 220),
        reasoning: cleanText(
          finding.reasoning,
          1200,
          language === 'fr'
            ? 'Ce resultat necessite une correlation avec les symptomes et le contexte clinique.'
            : 'This result requires correlation with symptoms and the clinical context.',
        ),
        recommendedNextSteps: cleanTextList(finding.recommendedNextSteps, 8, 220),
        clinicianReviewRequired: true as const,
      };
    });

  if (possibleFindings.length === 0 && markers.length > 0) {
    const importantMarkers = markers.filter((marker) => marker.status !== 'normal').slice(0, 10);
    if (importantMarkers.length > 0) {
      possibleFindings.push({
        name: language === 'fr' ? 'Resultats cliniques a interpreter' : 'Clinical results requiring interpretation',
        likelihood: 'uncertain',
        observedEvidence: importantMarkers.map((marker) => `${marker.label}: ${marker.value}`.slice(0, 180)),
        markers: importantMarkers.map((marker) => marker.id),
        medicationSafetyNotes: [
          language === 'fr'
            ? 'Le choix du traitement necessite un diagnostic confirme et une verification des allergies, de la grossesse, des medicaments actuels et des fonctions renale et hepatique.'
            : 'Treatment selection requires a confirmed diagnosis plus checks for allergies, pregnancy, current medicines, and kidney and liver function.',
        ],
        traditionalRemedyWarnings: [],
        reasoning: language === 'fr'
          ? 'Le rapport contient des valeurs anormales ou a revoir qui doivent etre interpretees dans le contexte clinique du patient.'
          : "The report contains abnormal or review-required values that must be interpreted in the patient's clinical context.",
        recommendedNextSteps: [
          language === 'fr'
            ? 'Faire examiner le rapport complet par un professionnel de sante qualifie.'
            : 'Have a qualified healthcare professional review the complete report.',
        ],
        clinicianReviewRequired: true,
      });
    }
  }

  const contraindications = (Array.isArray(source.contraindications) ? source.contraindications : [])
    .slice(0, 10)
    .map((entry) => {
      const item = asRecord(entry);
      return {
        medications: cleanTextList(item.medications, 8, 120),
        risk: cleanText(item.risk, 300),
        severity: enumValue(item.severity, ['low', 'moderate', 'high', 'unknown'] as const, 'unknown'),
      };
    })
    .filter((item) => item.medications.length > 0 && item.risk.length > 0);

  const limitations = cleanTextList(source.limitations, 8, 250);
  if (limitations.length === 0) {
    limitations.push(language === 'fr'
      ? 'Les resultats doivent etre correles aux symptomes, antecedents et plages de reference du laboratoire.'
      : 'Results must be correlated with symptoms, medical history, and the laboratory reference ranges.');
  }

  const normalized = {
    urgency: enumValue(source.urgency, ['emergency', 'same_day', 'routine', 'unknown'] as const, 'unknown'),
    possibleFindings,
    markers,
    contraindications,
    limitations,
    disclaimer: cleanText(
      source.disclaimer,
      600,
      language === 'fr'
        ? "Ceci n'est pas un diagnostic ni une ordonnance. Consultez un professionnel de sante qualifie."
        : 'This is not a diagnosis or prescription. Consult a qualified healthcare professional.',
    ),
  };

  const validated = AnalyzeResponse.safeParse(normalized);
  return validated.success ? validated.data : fallbackAnalyzeResponse(language);
};

export const parseAnalyzeResponse = (rawText: string, language: string): { data: AnalyzeResponse; recovered: boolean } => {
  let jsonStr = rawText;
  const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/) || rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1] || jsonMatch[0];
  }

  try {
    const parsedJson = JSON.parse(jsonStr);
    const validated = AnalyzeResponse.safeParse(parsedJson);
    if (validated.success) return { data: validated.data, recovered: false };

    console.warn('[CamDiag] Analyze JSON normalization used:', validated.error.issues.slice(0, 5));
    return { data: normalizeAnalyzeResponse(parsedJson, language), recovered: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown parse error';
    console.warn('[CamDiag] Analyze JSON recovery used:', message, rawText.slice(0, 300));
    return { recovered: true, data: fallbackAnalyzeResponse(language) };
  }
};

router.post('/analyze', verifyAuth, rateLimiter(RATE_LIMIT.ANALYZE, { failOpen: false }), async (req, res) => {
  try {
    const parsed = AnalyzeRequestBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
      return;
    }

    const { language } = parsed.data;
    const rawText = await analyzeImage(parsed.data);
    const { data: parsedResponse, recovered } = parseAnalyzeResponse(rawText, language);
    const validated = {
      ...parsedResponse,
      provenance: {
        model: 'Vertex AI Gemini',
        modelVersion: process.env.GEMINI_MODEL || 'configured-runtime-model',
        promptVersion: 'clinical-document-v3',
        analyzedAt: new Date().toISOString(),
      },
    };
    const hasInterpretation = validated.possibleFindings.length > 0 || validated.markers.length > 0;
    const medicationNoteCount = validated.possibleFindings.reduce(
      (total, finding) => total + finding.medicationSafetyNotes.length,
      0,
    );
    const nextStepCount = validated.possibleFindings.reduce(
      (total, finding) => total + finding.recommendedNextSteps.length,
      0,
    );

    await writeAuditLog({
      uid: req.uid!,
      action: 'analyze',
      request: {
        language,
        documentType: parsed.data.documentType,
        pageCount: parsed.data.pages?.length ?? 0,
        hasConfirmedTranscription: Boolean(parsed.data.confirmedTranscription),
        hasPatientContext: Boolean(parsed.data.patientContext),
      },
      responsePreview: JSON.stringify({
        urgency: validated.urgency,
        findingCount: validated.possibleFindings.length,
        markerCount: validated.markers.length,
        medicationNoteCount,
        contraindicationCount: validated.contraindications.length,
        nextStepCount,
        limitationCount: validated.limitations.length,
        normalized: recovered,
      }),
      success: hasInterpretation,
      error: hasInterpretation
        ? undefined
        : 'AI output could not be converted into a clinical interpretation.',
    });

    res.json(validated);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[CamDiag] Analyze failed:', message);

    // Log failure
    if (req.uid) {
      await writeAuditLog({
        uid: req.uid,
        action: 'analyze',
        request: {
          language: req.body?.language,
          documentType: req.body?.documentType,
          hasPatientContext: Boolean(req.body?.patientContext),
        },
        responsePreview: '',
        success: false,
        error: message,
      });
    }

    res.status(500).json({
      error: 'AI analysis could not be completed. Please try again shortly.',
      urgency: 'unknown',
      possibleFindings: [],
      markers: [],
      contraindications: [],
      limitations: ['AI analysis could not be completed.'],
      disclaimer: 'AI analysis could not be completed. Please consult a healthcare professional.',
    });
  }
});

export default router;
