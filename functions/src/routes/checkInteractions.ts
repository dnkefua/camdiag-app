import { Router } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { verifyAuth } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { RATE_LIMIT } from '../config.js';
import { medicationEvidence } from '../services/medicationEvidence.js';
import { identifier, requireOwnership } from '../services/clinicalPolicy.js';
const router = Router();
router.post('/check-interactions',verifyAuth,rateLimiter(RATE_LIMIT.INTERACTIONS,{failOpen:false}),async(req,res,next) => {
  const input = z.object({drugs:z.array(z.string().trim().min(1).max(120)).min(2).max(10),language:z.enum(['en','fr']).default('en'),encounterId:identifier}).strict().safeParse(req.body);
  if(!input.success) {res.status(400).json({code:'INVALID_REQUEST',error:'Choose an encounter and at least two medicines.'});return;}
  try {
    const encounter = (await getFirestore().collection('encounters').doc(input.data.encounterId).get()).data();
    requireOwnership(encounter,req.uid!,req.clinical!.organizationId);
    // Evidence supports clinician review, and never supplies a patient safety clearance.
    res.json(await medicationEvidence(input.data.drugs,'interaction'));
  } catch(error) {next(error);}
});
export default router;
