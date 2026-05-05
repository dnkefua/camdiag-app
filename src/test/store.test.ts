import { describe, it, expect } from 'vitest';
import { useAppStore } from '../store/useAppStore';

describe('useAppStore', () => {
  it('starts with empty possible findings', () => {
    const state = useAppStore.getState();
    expect(state.possibleFindings).toHaveLength(0);
  });

  it('sets selected finding', () => {
    useAppStore.getState().setSelectedFinding(1);
    expect(useAppStore.getState().selectedFinding).toBe(1);
    useAppStore.getState().setSelectedFinding(0);
  });

  it('increments scan count', () => {
    const initial = useAppStore.getState().scanCount;
    useAppStore.getState().incrementScanCount();
    expect(useAppStore.getState().scanCount).toBe(initial + 1);
  });

  it('resets scan count', () => {
    useAppStore.getState().incrementScanCount();
    useAppStore.getState().resetScanCount();
    expect(useAppStore.getState().scanCount).toBe(0);
  });

  it('starts with empty drug database', () => {
    const state = useAppStore.getState();
    expect(state.drugDatabase).toHaveLength(0);
  });

  it('starts with empty patient records', () => {
    const state = useAppStore.getState();
    expect(state.patientRecords).toHaveLength(0);
  });

  it('can set possible findings', () => {
    const mockFindings = [
      {
        name: 'Malaria (P. Falciparum)',
        likelihood: 'high' as const,
        observedEvidence: ['parasites'],
        markers: ['parasites'],
        medicationSafetyNotes: ['Coartem safety review'],
        traditionalRemedyWarnings: ['Artemisia Tea'],
        reasoning: 'Test',
        recommendedNextSteps: ['Clinician review'],
        clinicianReviewRequired: true as const,
      },
    ];
    useAppStore.getState().setPossibleFindings(mockFindings);
    expect(useAppStore.getState().possibleFindings).toHaveLength(1);
    expect(useAppStore.getState().possibleFindings[0]?.name).toBe('Malaria (P. Falciparum)');
    useAppStore.getState().setPossibleFindings([]);
  });
});
