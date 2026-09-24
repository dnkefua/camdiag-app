import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
const router = Router();
router.post('/transcribe',verifyAuth,(_req,res) => {
  res.status(410).json({code:'DURABLE_WORKFLOW_REQUIRED',error:'Create an encounter, upload private source pages, and submit an OCR job.'});
});
export default router;
