import { Router } from 'express';
import { analyzeImage } from '../services/gemini.js';
import { writeAuditLog } from '../services/audit.js';
import { verifyAuth } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { RATE_LIMIT } from '../config.js';
import { AnalyzeRequestBody, AnalyzeResponse } from '../schemas/medgemma.js';

const router = Router();

const parseAnalyzeResponse = (rawText: string, language: string): { data: AnalyzeResponse; recovered: boolean } => {
  let jsonStr = rawText;
  const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/) || rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1] || jsonMatch[0];
  }

  try {
    const parsedJson = JSON.parse(jsonStr);
    return { data: AnalyzeResponse.parse(parsedJson), recovered: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown parse error';
    console.warn('[CamDiag] Analyze JSON recovery used:', message, rawText.slice(0, 300));

    return {
      recovered: true,
      data: {
        diagnoses: [],
        markers: [
          {
            id: 'ai-output-review',
            label: language === 'fr' ? 'Analyse a revoir' : 'Analysis needs review',
            value: language === 'fr'
              ? 'La reponse IA etait incomplete. Reprenez une photo plus nette ou reessayez.'
              : 'The AI response was incomplete. Retake a clearer photo or try again.',
            status: 'review_required',
            color: 'yellow',
          },
        ],
        contraindications: [],
        disclaimer: language === 'fr'
          ? "Ceci n'est PAS un diagnostic. L'analyse IA doit etre revue par un professionnel de sante qualifie."
          : 'This is NOT a diagnosis. AI-assisted analysis must be reviewed by a qualified healthcare professional.',
      },
    };
  }
};

router.post('/analyze', verifyAuth, rateLimiter(RATE_LIMIT.ANALYZE), async (req, res) => {
  try {
    const parsed = AnalyzeRequestBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
      return;
    }

    const { imageBase64, prompt, language } = parsed.data;
    const rawText = await analyzeImage(imageBase64, prompt, language);
    const { data: validated, recovered } = parseAnalyzeResponse(rawText, language);

    await writeAuditLog({
      uid: req.uid!,
      action: 'analyze',
      request: { prompt, language },
      responsePreview: JSON.stringify(validated).slice(0, 500),
      success: !recovered,
      error: recovered ? 'AI returned incomplete structured JSON; recovery response served.' : undefined,
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
        request: { prompt: req.body?.prompt, language: req.body?.language },
        responsePreview: '',
        success: false,
        error: message,
      });
    }

    res.status(500).json({
      error: 'AI analysis could not be completed. Please try again shortly.',
      diagnoses: [],
      markers: [],
      contraindications: [],
      disclaimer: 'AI analysis could not be completed. Please consult a healthcare professional.',
    });
  }
});

export default router;
