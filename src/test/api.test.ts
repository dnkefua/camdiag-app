import { describe, it, expect } from 'vitest';
import { checkLocalContraindications } from '../services/api';
import type { PossibleFinding } from '../types';

describe('checkLocalContraindications', () => {
  it('detects Coartem + Quinine contraindication', () => {
    const possibleFindings: PossibleFinding[] = [
      {
        name: 'Malaria',
        likelihood: 'high',
        observedEvidence: ['parasites'],
        markers: ['parasites'],
        medicationSafetyNotes: ['Coartem and Quinine require interaction review'],
        traditionalRemedyWarnings: [],
        reasoning: 'test',
        recommendedNextSteps: ['Clinician review'],
        clinicianReviewRequired: true,
      },
    ];
    const result = checkLocalContraindications(possibleFindings);
    expect(result).not.toBeNull();
    expect(result?.medications).toContain('Coartem');
    expect(result?.medications).toContain('Quinine');
  });

  it('returns null when no contraindication exists', () => {
    const possibleFindings: PossibleFinding[] = [
      {
        name: 'Dermatitis',
        likelihood: 'low',
        observedEvidence: [],
        markers: [],
        medicationSafetyNotes: ['Amoxicillin safety review'],
        traditionalRemedyWarnings: [],
        reasoning: 'test',
        recommendedNextSteps: ['Clinician review'],
        clinicianReviewRequired: true,
      },
    ];
    const result = checkLocalContraindications(possibleFindings);
    expect(result).toBeNull();
  });

  it('detects contraindication across multiple possible findings', () => {
    const possibleFindings: PossibleFinding[] = [
      {
        name: 'Malaria',
        likelihood: 'high',
        observedEvidence: [],
        markers: [],
        medicationSafetyNotes: ['Coartem safety review'],
        traditionalRemedyWarnings: [],
        reasoning: 'test',
        recommendedNextSteps: ['Clinician review'],
        clinicianReviewRequired: true,
      },
      {
        name: 'Dermatitis',
        likelihood: 'low',
        observedEvidence: [],
        markers: [],
        medicationSafetyNotes: ['Quinine safety review'],
        traditionalRemedyWarnings: [],
        reasoning: 'test',
        recommendedNextSteps: ['Clinician review'],
        clinicianReviewRequired: true,
      },
    ];
    const result = checkLocalContraindications(possibleFindings);
    expect(result).not.toBeNull();
    expect(result?.risk).toContain('arrhythmia');
  });
});
