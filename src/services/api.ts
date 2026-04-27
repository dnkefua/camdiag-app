import type { Contraindication, Diagnosis } from '../types';
import { envFlags } from '../utils/env';

const LOCAL_CONTRAINDICATIONS: Contraindication[] = [
  { drugs: ['Coartem', 'Quinine'], risk: 'Severe arrhythmia risk when combined.' },
  { drugs: ['Amoxicillin', 'Quinine'], risk: 'Increased risk of gastrointestinal distress.' },
];

export const checkLocalContraindications = (diagnoses: Diagnosis[]): Contraindication | null => {
  const allDrugs = [...new Set(diagnoses.flatMap((d) => d.drugs))];

  for (const conflict of LOCAL_CONTRAINDICATIONS) {
    if (conflict.drugs.every((d) => allDrugs.includes(d))) {
      return conflict;
    }
  }
  return null;
};

export const isApiConfigured = (): boolean => envFlags.ai;
