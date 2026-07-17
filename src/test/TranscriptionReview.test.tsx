import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TranslationProvider } from '../hooks/useTranslation';
import { useAppStore } from '../store/useAppStore';
import TranscriptionReview from '../components/TranscriptionReview';

const mocks = vi.hoisted(() => ({
  analyze: vi.fn(),
  saveScanResult: vi.fn(),
}));

vi.mock('../services/medgemma', () => ({
  analyzeMedicalImage: mocks.analyze,
}));

vi.mock('../services/firestore', () => ({
  saveScanResult: mocks.saveScanResult,
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user-1' } }),
}));

const result = {
  urgency: 'same_day' as const,
  possibleFindings: [{
    name: 'Anaemia pattern',
    likelihood: 'moderate' as const,
    observedEvidence: ['Haemoglobin 8.2 g/dL'],
    markers: ['haemoglobin'],
    medicationSafetyNotes: ['Treatment depends on confirmation of the cause.'],
    traditionalRemedyWarnings: [],
    reasoning: 'The haemoglobin result is below the stated reference range.',
    recommendedNextSteps: ['Arrange clinician review.'],
    clinicianReviewRequired: true as const,
  }],
  markers: [{
    id: 'haemoglobin',
    label: 'Haemoglobin',
    value: '8.2 g/dL',
    status: 'abnormal' as const,
    color: 'orange' as const,
  }],
  contraindications: [],
  limitations: ['Symptoms were not provided.'],
  disclaimer: 'This is not a diagnosis or prescription.',
  provenance: {
    model: 'Vertex AI Gemini',
    promptVersion: 'clinical-document-v3',
    analyzedAt: '2026-07-17T05:47:43.000Z',
  },
};

const setLongReport = () => {
  useAppStore.setState({
    transcription: {
      documentId: 'long-lab-report',
      processorVersion: 'ocr-v2.1',
      requiresReview: true,
      pages: [{
        pageNumber: 1,
        text: 'Haemoglobin 8.2 g/dL\n'.repeat(300),
        confidence: 0.82,
        qualityReasons: ['low confidence text'],
        tokens: [{ pageNumber: 1, text: '8.2', confidence: 0.72, handwritten: false }],
      }],
    },
    pendingPages: [{
      id: 'page-1',
      fileName: 'lab-report.pdf',
      mimeType: 'application/pdf',
      contentBase64: 'data:application/pdf;base64,AA==',
    }],
    pendingDocumentType: 'lab_result',
    analysisError: null,
  });
};

const renderReview = () => render(
  <MemoryRouter initialEntries={['/transcription-review']}>
    <TranslationProvider>
      <Routes>
        <Route path="/transcription-review" element={<TranscriptionReview />} />
        <Route path="/analysis" element={<div>Interpretation screen</div>} />
        <Route path="/scanner" element={<div>Scanner screen</div>} />
      </Routes>
    </TranslationProvider>
  </MemoryRouter>,
);

describe('TranscriptionReview', () => {
  beforeEach(() => {
    mocks.analyze.mockReset();
    mocks.saveScanResult.mockReset();
    mocks.analyze.mockResolvedValue(result);
    mocks.saveScanResult.mockResolvedValue('user-1_long-lab-report');
    useAppStore.getState().resetAnalysis();
    setLongReport();
  });

  it('keeps the interpretation action outside the long scrolling report', () => {
    renderReview();
    const button = screen.getByRole('button', { name: /interpret report now/i });
    expect(button.closest('footer')).toBeInTheDocument();
    expect(button).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox'));
    expect(button).toBeEnabled();
  });

  it('opens the interpretation without its guard redirecting back to Scanner', async () => {
    renderReview();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /interpret report now/i }));

    expect(await screen.findByText('Interpretation screen')).toBeInTheDocument();
    expect(screen.queryByText('Scanner screen')).not.toBeInTheDocument();
    expect(useAppStore.getState().possibleFindings[0]?.name).toBe('Anaemia pattern');
    expect(mocks.analyze).toHaveBeenCalledWith(expect.objectContaining({
      documentType: 'lab_result',
      confirmedTranscription: expect.stringContaining('Haemoglobin 8.2 g/dL'),
    }));
    await waitFor(() => expect(mocks.saveScanResult).toHaveBeenCalledWith(
      'user-1_long-lab-report',
      expect.objectContaining({
        title: 'Anaemia pattern',
        type: 'lab_result',
        aiResponse: expect.stringContaining('Anaemia pattern'),
      }),
    ));
  });
});
