import { describe, it, expect } from 'vitest';
import { useAppStore } from '../store/useAppStore';

describe('useAppStore', () => {
  it('starts with empty diagnoses', () => {
    const state = useAppStore.getState();
    expect(state.diagnoses).toHaveLength(0);
  });

  it('sets selected diagnosis', () => {
    useAppStore.getState().setSelectedDiagnosis(1);
    expect(useAppStore.getState().selectedDiagnosis).toBe(1);
    useAppStore.getState().setSelectedDiagnosis(0);
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

  it('can set diagnoses', () => {
    const mockDiagnoses = [
      { name: 'Malaria (P. Falciparum)', probability: '94%', markers: ['parasites'], drugs: ['Coartem'], contri: ['Artemisia Tea'], reasoning: 'Test' },
    ];
    useAppStore.getState().setDiagnoses(mockDiagnoses);
    expect(useAppStore.getState().diagnoses).toHaveLength(1);
    expect(useAppStore.getState().diagnoses[0]?.name).toBe('Malaria (P. Falciparum)');
    useAppStore.getState().setDiagnoses([]);
  });
});