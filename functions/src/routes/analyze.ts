import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
const router = Router();
router.post('/analyze',verifyAuth,(_req,res) => {
  res.status(410).json({code:'DURABLE_WORKFLOW_REQUIRED',error:'Create an encounter, upload sources, review OCR, and submit an analysis job.'});
});
export default router;
