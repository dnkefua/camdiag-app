import { Router } from 'express';
import { analyzeImage } from '../services/gemini.js';
import { writeAuditLog } from '../services/audit.js';
import { verifyAuth } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { RATE_LIMIT } from '../config.js';
import { AnalyzeRequestBody, AnalyzeResponse } from '../schemas/medgemma.js';

const router = Router();

router.post('/analyze', verifyAuth, rateLimiter(RATE_LIMIT.ANALYZE), async (req, res) => {
  try {
    const parsed = AnalyzeRequestBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
      return;
    }

    const { imageBase64, prompt, language } = parsed.data;
    const rawText = await analyzeImage(imageBase64, prompt, language);

    // Try to extract JSON from the response (may be wrapped in markdown code blocks)
    let jsonStr = rawText;
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/) || rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1] || jsonMatch[0];
    }

    const parsedJson = JSON.parse(jsonStr);
    const validated = AnalyzeResponse.parse(parsedJson);

    await writeAuditLog({
      uid: req.uid!,
      action: 'analyze',
      request: { prompt, language },
      responsePreview: JSON.stringify(validated).slice(0, 500),
      success: true,
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
