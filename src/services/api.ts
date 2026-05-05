import type { Contraindication, PossibleFinding } from '../types';
import { envFlags } from '../utils/env';

const LOCAL_CONTRAINDICATIONS: Contraindication[] = [
  { medications: ['Coartem', 'Quinine'], risk: 'Severe arrhythmia risk when combined.', severity: 'high' },
  { medications: ['Amoxicillin', 'Quinine'], risk: 'Increased risk of gastrointestinal distress.', severity: 'moderate' },
];

export const checkLocalContraindications = (possibleFindings: PossibleFinding[]): Contraindication | null => {
  const allMedicationNotes = possibleFindings
    .flatMap((finding) => finding.medicationSafetyNotes)
    .join(' ')
    .toLowerCase();

  for (const conflict of LOCAL_CONTRAINDICATIONS) {
    if (conflict.medications.every((medication) => allMedicationNotes.includes(medication.toLowerCase()))) {
      return conflict;
    }
  }
  return null;
};

export const isApiConfigured = (): boolean => envFlags.backend;
