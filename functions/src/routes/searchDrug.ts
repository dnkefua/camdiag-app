import { Router } from 'express';
import { searchMedication } from '../services/gemini.js';
import { writeAuditLog } from '../services/audit.js';
import { verifyAuth } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { RATE_LIMIT } from '../config.js';
import { SearchDrugRequestBody } from '../schemas/medgemma.js';

const router = Router();

router.post('/search-drug', verifyAuth, rateLimiter(RATE_LIMIT.SEARCH), async (req, res) => {
  try {
    const parsed = SearchDrugRequestBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
      return;
    }

    const { medicationName, language } = parsed.data;
    const result = await searchMedication(medicationName, language);

    await writeAuditLog({
      uid: req.uid!,
      action: 'search_drug',
      request: { medicationName, language },
      responsePreview: result.slice(0, 500),
      success: true,
    });

    res.json({ result });
  } catch (err) {
    if (req.uid) {
      await writeAuditLog({
        uid: req.uid,
        action: 'search_drug',
        request: { medicationName: req.body?.medicationName, language: req.body?.language },
        responsePreview: '',
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }

    res.status(500).json({ error: 'Failed to search medication information' });
  }
});

export default router;
