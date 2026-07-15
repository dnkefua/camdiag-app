import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { RATE_LIMIT } from '../config.js';
import { TranscribeRequestBody } from '../schemas/medgemma.js';
import { transcribeDocument } from '../services/documentAi.js';
import { writeAuditLog } from '../services/audit.js';

const router = Router();
router.post('/transcribe', verifyAuth, rateLimiter(RATE_LIMIT.TRANSCRIBE, { failOpen: false }), async (req, res) => {
  const parsed = TranscribeRequestBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid document', details: parsed.error.issues }); return; }
  try {
    const result = await transcribeDocument(parsed.data);
    await writeAuditLog({ uid: req.uid!, action: 'transcribe', request: { pageCount: parsed.data.pages.length, language: parsed.data.language }, responsePreview: JSON.stringify({ documentId: result.documentId, requiresReview: result.requiresReview }), success: true });
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OCR failed.';
    await writeAuditLog({ uid: req.uid!, action: 'transcribe', request: { pageCount: parsed.data.pages.length }, responsePreview: '', success: false, error: message });
    res.status(502).json({ error: message });
  }
});
export default router;
