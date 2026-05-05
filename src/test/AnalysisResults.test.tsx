import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TranslationProvider } from '../hooks/useTranslation';
import AnalysisResults from '../components/AnalysisResults';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: React.PropsWithChildren) => <>{children}</>,
    section: ({ children }: React.PropsWithChildren) => <section>{children}</section>,
  },
}));

vi.mock('../hooks/useTranslation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../hooks/useTranslation')>();
  return {
    ...actual,
    useTranslation: vi.fn(() => ({
      t: {
        analysis_title: 'CamDiag Analysis',
        ai_active: 'AI Active',
        questionnaire_title: 'Questionnaire',
        quest_intro: 'Complete the questionnaire',
        possible_findings: 'Possible Findings',
        clinical_markers: 'Clinical Markers',
        remedies_title: 'Remedies',
        prescribed: 'Prescribed',
        contri_medicine: 'Contri-Medicine',
        cameroon_avail: 'Cameroon availability',
        back: 'Back',
      },
    })),
  };
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock store with some test data
vi.mock('../store/useAppStore', () => ({
  useAppStore: vi.fn(() => ({
    possibleFindings: [
      {
        name: 'Dermatitis',
        likelihood: 'high',
        observedEvidence: ['Itching'],
        reasoning: 'Inflammatory skin condition',
        markers: ['m1'],
        medicationSafetyNotes: ['Coartem safety review'],
        traditionalRemedyWarnings: ['Artemisia'],
        recommendedNextSteps: ['Clinician review'],
        clinicianReviewRequired: true,
      },
    ],
    markers: [
      { id: 'm1', label: 'Itching', value: 'Moderate', status: 'abnormal', color: 'orange' },
    ],
    selectedFinding: 0,
    setSelectedFinding: vi.fn(),
    analysisError: null,
    setAnalysisError: vi.fn(),
    isAnalyzing: false,
  })),
}));

// Mock api
vi.mock('../services/api', () => ({
  checkLocalContraindications: vi.fn(() => null),
  isApiConfigured: vi.fn(() => false),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('AnalysisResults', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders analysis heading', () => {
    renderWithProviders(
      <TranslationProvider>
        <AnalysisResults />
      </TranslationProvider>
    );
    expect(screen.getAllByRole('heading')[0]).toBeInTheDocument();
  });

  it('renders back button', () => {
    renderWithProviders(
      <TranslationProvider>
        <AnalysisResults />
      </TranslationProvider>
    );
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('navigates to /scanner when back button is clicked', () => {
    renderWithProviders(
      <TranslationProvider>
        <AnalysisResults />
      </TranslationProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/scanner');
  });

  it('renders questionnaire card', () => {
    renderWithProviders(
      <TranslationProvider>
        <AnalysisResults />
      </TranslationProvider>
    );
    expect(screen.getAllByText(/questionnaire/i).length).toBeGreaterThan(0);
  });

  it('navigates to /questionnaire when questionnaire card is clicked', () => {
    renderWithProviders(
      <TranslationProvider>
        <AnalysisResults />
      </TranslationProvider>
    );
    const allText = screen.getAllByText(/questionnaire/i);
    const questionnaireEl = allText.find(el => el.closest('section'));
    if (questionnaireEl) fireEvent.click(questionnaireEl.closest('section')!);
    expect(mockNavigate).toHaveBeenCalledWith('/questionnaire');
  });

  it('renders possible finding name', () => {
    renderWithProviders(
      <TranslationProvider>
        <AnalysisResults />
      </TranslationProvider>
    );
    expect(screen.getByText('Dermatitis')).toBeInTheDocument();
  });

  it('renders clinical marker', () => {
    renderWithProviders(
      <TranslationProvider>
        <AnalysisResults />
      </TranslationProvider>
    );
    expect(screen.getByText('Moderate')).toBeInTheDocument();
  });

  it('renders medication safety note', () => {
    renderWithProviders(
      <TranslationProvider>
        <AnalysisResults />
      </TranslationProvider>
    );
    expect(screen.getByText(/Coartem/i)).toBeInTheDocument();
  });

  it('renders traditional remedy', () => {
    renderWithProviders(
      <TranslationProvider>
        <AnalysisResults />
      </TranslationProvider>
    );
    expect(screen.getByText('Artemisia')).toBeInTheDocument();
  });
});
