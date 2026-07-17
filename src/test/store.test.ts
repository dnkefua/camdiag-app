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

  it('stores OCR transcription and pending document pages', () => {
    const transcription = { documentId: 'doc-1', processorVersion: 'ocr-v2.1', requiresReview: true, pages: [] };
    const pages = [{ id: 'page-1', fileName: 'rx.pdf', mimeType: 'application/pdf', contentBase64: 'data:application/pdf;base64,AA==' }];
    useAppStore.getState().setTranscription(transcription);
    useAppStore.getState().setPendingPages(pages);
    useAppStore.getState().setPendingDocumentType('prescription');
    expect(useAppStore.getState().transcription?.requiresReview).toBe(true);
    expect(useAppStore.getState().pendingPages).toHaveLength(1);
    expect(useAppStore.getState().pendingDocumentType).toBe('prescription');
    useAppStore.getState().setTranscription(null);
    useAppStore.getState().setPendingPages([]);
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

  it('stores the complete clinical analysis response', () => {
    useAppStore.getState().setAnalysisResult({
      urgency: 'same_day',
      possibleFindings: [{
        name: 'Anaemia pattern',
        likelihood: 'moderate',
        observedEvidence: ['[Page 1] Haemoglobin below reference range'],
        markers: ['haemoglobin'],
        medicationSafetyNotes: ['A clinician may consider iron only after confirming iron deficiency.'],
        traditionalRemedyWarnings: [],
        reasoning: 'Low haemoglobin can be consistent with anaemia but does not establish the cause.',
        recommendedNextSteps: ['Review ferritin and iron studies with a clinician.'],
        clinicianReviewRequired: true,
      }],
      markers: [{ id: 'haemoglobin', label: 'Haemoglobin', value: 'Low', status: 'abnormal', color: 'orange' }],
      contraindications: [{ medications: ['Iron'], risk: 'Avoid empiric use when iron overload is suspected.', severity: 'moderate' }],
      limitations: ['The report does not include symptoms.'],
      disclaimer: 'This is not a diagnosis or prescription.',
    });

    const state = useAppStore.getState();
    expect(state.analysisUrgency).toBe('same_day');
    expect(state.contraindications).toHaveLength(1);
    expect(state.analysisLimitations).toContain('The report does not include symptoms.');
    expect(state.analysisDisclaimer).toMatch(/not a diagnosis/i);
    expect(window.sessionStorage.getItem('camdiag_active_analysis_v1')).toContain('Anaemia pattern');
    state.resetAnalysis();
    expect(window.sessionStorage.getItem('camdiag_active_analysis_v1')).toBeNull();
  });
});
