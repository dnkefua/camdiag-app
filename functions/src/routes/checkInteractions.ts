import { Router } from 'express';
import { checkDrugInteractions } from '../services/gemini.js';
import { writeAuditLog } from '../services/audit.js';
import { verifyAuth } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { RATE_LIMIT } from '../config.js';
import { CheckInteractionsRequestBody } from '../schemas/medgemma.js';

const router = Router();

router.post('/check-interactions', verifyAuth, rateLimiter(RATE_LIMIT.INTERACTIONS), async (req, res) => {
  try {
    const parsed = CheckInteractionsRequestBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
      return;
    }

    const { drugs, language } = parsed.data;
    const result = await checkDrugInteractions(drugs, language);

    await writeAuditLog({
      uid: req.uid!,
      action: 'check_interactions',
      request: { drugs, language },
      responsePreview: result.slice(0, 500),
      success: true,
    });

    res.json({ result });
  } catch (err) {
    if (req.uid) {
      await writeAuditLog({
        uid: req.uid,
        action: 'check_interactions',
        request: { drugs: req.body?.drugs, language: req.body?.language },
        responsePreview: '',
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }

    res.status(500).json({ error: 'Failed to check drug interactions' });
  }
});

export default router;
