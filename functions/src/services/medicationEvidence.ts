import { getFirestore } from 'firebase-admin/firestore';
import type { MedicationAssessment } from '../contracts/clinical.js';
import { stableId } from './clinicalPolicy.js';
import { z } from 'zod';
const approvedEvidence = z.object({approved:z.literal(true),version:z.string().min(1).max(80),citation:z.string().url().max(1000),reviewedAt:z.string().datetime(),expiresAt:z.string().datetime(),reviewedBy:z.string().min(1),reviewerRole:z.enum(['pharmacist','doctor']),text:z.string().min(1).max(4000)});
export const normalizeMedication = (name: string) => name.trim().toLowerCase().replace(/\s+/g,' ');
export async function medicationEvidence(drugs: string[], kind: 'drug' | 'interaction'): Promise<MedicationAssessment> {
  const names = [...new Set(drugs.map(normalizeMedication))].sort();
  const keys = kind === 'drug' ? names.map((name) => [name]) : names.flatMap((name,index) => names.slice(index+1).map((other) => [name,other]));
  const result: MedicationAssessment = {status:'not_assessed',result:'Medication safety has not been assessed. Use a qualified pharmacist or clinician and an approved drug reference.',evidence:[]};
  // Avoid a quadratic, unbounded reference lookup if another route calls this service.
  if(!keys.length || names.length > 10) return result;
  const docs = await getFirestore().getAll(...keys.map((key) => getFirestore().collection('medication_evidence').doc(stableId(kind,...key))));
  for(const doc of docs) {
    const item = approvedEvidence.safeParse(doc.data());
    if(!item.success || item.data.expiresAt <= new Date().toISOString()) continue;
    result.evidence.push({id:doc.id,version:item.data.version,citation:item.data.citation,reviewedAt:item.data.reviewedAt,text:item.data.text});
  }
  if(result.evidence.length === keys.length) {
    result.status = 'evidence_available';
    result.result = 'Reviewed reference evidence is available below. This is not a patient-specific safety clearance; a clinician must assess allergies, dose, pregnancy, organ function, and the complete medication list.';
  }
  return result;
}
