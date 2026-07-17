import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TranslationProvider } from '../hooks/useTranslation';
import TranscriptionReview from '../components/TranscriptionReview';

const mocks = vi.hoisted(() => ({
  analyze: vi.fn(),
  navigate: vi.fn(),
  setAnalysisResult: vi.fn(),
  setAnalysisError: vi.fn(),
  setAnalyzing: vi.fn(),
  setPendingPages: vi.fn(),
  setTranscription: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mocks.navigate };
});

vi.mock('../services/medgemma', () => ({
  analyzeMedicalImage: mocks.analyze,
}));

vi.mock('../store/useAppStore', () => ({
  useAppStore: () => ({
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
    setAnalysisResult: mocks.setAnalysisResult,
    setAnalysisError: mocks.setAnalysisError,
    setAnalyzing: mocks.setAnalyzing,
    setPendingPages: mocks.setPendingPages,
    setTranscription: mocks.setTranscription,
  }),
}));

const result = {
  urgency: 'same_day',
  possibleFindings: [{
    name: 'Anaemia pattern',
    likelihood: 'moderate',
    observedEvidence: ['Haemoglobin 8.2 g/dL'],
    markers: ['haemoglobin'],
    medicationSafetyNotes: ['Treatment depends on confirmation of the cause.'],
    traditionalRemedyWarnings: [],
    reasoning: 'The haemoglobin result is below the stated reference range.',
    recommendedNextSteps: ['Arrange clinician review.'],
    clinicianReviewRequired: true,
  }],
  markers: [{ id: 'haemoglobin', label: 'Haemoglobin', value: '8.2 g/dL', status: 'abnormal', color: 'orange' }],
  contraindications: [],
  limitations: ['Symptoms were not provided.'],
  disclaimer: 'This is not a diagnosis or prescription.',
};

const renderReview = () => render(
  <MemoryRouter>
    <TranslationProvider><TranscriptionReview /></TranslationProvider>
  </MemoryRouter>,
);

describe('TranscriptionReview', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockClear());
    mocks.analyze.mockResolvedValue(result);
  });

  it('keeps the interpretation action outside the long scrolling report', () => {
    renderReview();
    const button = screen.getByRole('button', { name: /interpret report now/i });
    expect(button.closest('footer')).toBeInTheDocument();
    expect(button).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox'));
    expect(button).toBeEnabled();
  });

  it('submits the confirmed transcription and opens the interpretation', async () => {
    renderReview();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /interpret report now/i }));

    await waitFor(() => expect(mocks.setAnalysisResult).toHaveBeenCalledWith(result));
    expect(mocks.analyze).toHaveBeenCalledWith(expect.objectContaining({
      documentType: 'lab_result',
      confirmedTranscription: expect.stringContaining('Haemoglobin 8.2 g/dL'),
    }));
    expect(mocks.navigate).toHaveBeenCalledWith('/analysis');
  });
});
