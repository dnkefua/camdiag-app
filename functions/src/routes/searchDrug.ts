import { Router } from 'express';
import { z } from 'zod';
import { verifyAuth } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { RATE_LIMIT } from '../config.js';
import { medicationEvidence } from '../services/medicationEvidence.js';
import { identifier } from '../services/clinicalPolicy.js';
const router = Router();
router.post('/search-drug',verifyAuth,rateLimiter(RATE_LIMIT.SEARCH,{failOpen:false}),async(req,res,next) => {
  const input = z.object({medicationName:z.string().trim().min(1).max(120),language:z.enum(['en','fr']).default('en'),encounterId:identifier.optional()}).strict().safeParse(req.body);
  if(!input.success) {res.status(400).json({code:'INVALID_REQUEST',error:'Enter a medication name.'});return;}
  try {res.json(await medicationEvidence([input.data.medicationName],'drug'));} catch(error) {next(error);}
});
export default router;
