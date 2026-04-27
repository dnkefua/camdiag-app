import { describe, it, expect } from 'vitest';
import { useAppStore } from '../store/useAppStore';

describe('useAppStore', () => {
  it('has correct default diagnoses', () => {
    const state = useAppStore.getState();
    expect(state.diagnoses).toHaveLength(2);
    expect(state.diagnoses[0]?.name).toBe('Malaria (P. Falciparum)');
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

  it('has drug database', () => {
    const state = useAppStore.getState();
    expect(state.drugDatabase.length).toBeGreaterThan(0);
  });

  it('has patient records', () => {
    const state = useAppStore.getState();
    expect(state.patientRecords.length).toBeGreaterThan(0);
  });
});