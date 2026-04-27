import { describe, it, expect } from 'vitest';
import { checkLocalContraindications } from '../services/api';
import type { Diagnosis } from '../types';

describe('checkLocalContraindications', () => {
  it('detects Coartem + Quinine contraindication', () => {
    const diagnoses: Diagnosis[] = [
      {
        name: 'Malaria',
        probability: '94%',
        markers: ['parasites'],
        drugs: ['Coartem', 'Quinine'],
        contri: [],
        reasoning: 'test',
      },
    ];
    const result = checkLocalContraindications(diagnoses);
    expect(result).not.toBeNull();
    expect(result?.drugs).toContain('Coartem');
    expect(result?.drugs).toContain('Quinine');
  });

  it('returns null when no contraindication exists', () => {
    const diagnoses: Diagnosis[] = [
      {
        name: 'Dermatitis',
        probability: '12%',
        markers: [],
        drugs: ['Amoxicillin'],
        contri: [],
        reasoning: 'test',
      },
    ];
    const result = checkLocalContraindications(diagnoses);
    expect(result).toBeNull();
  });

  it('detects contraindication across multiple diagnoses', () => {
    const diagnoses: Diagnosis[] = [
      {
        name: 'Malaria',
        probability: '94%',
        markers: [],
        drugs: ['Coartem'],
        contri: [],
        reasoning: 'test',
      },
      {
        name: 'Dermatitis',
        probability: '12%',
        markers: [],
        drugs: ['Quinine'],
        contri: [],
        reasoning: 'test',
      },
    ];
    const result = checkLocalContraindications(diagnoses);
    expect(result).not.toBeNull();
    expect(result?.risk).toContain('arrhythmia');
  });
});