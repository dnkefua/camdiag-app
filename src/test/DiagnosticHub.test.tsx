import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TranslationProvider } from '../hooks/useTranslation';
import { useAppStore } from '../store/useAppStore';
import DiagnosticHub from '../components/DiagnosticHub';

const serviceMocks = vi.hoisted(() => ({
  getScanResults: vi.fn(),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user-1' } }),
}));

vi.mock('../services/firestore', () => ({
  getScanResults: serviceMocks.getScanResults,
}));

vi.mock('framer-motion', async () => {
  const { createFramerMotionMock } = await vi.importActual<typeof import('./mocks')>('./mocks');
  return createFramerMotionMock();
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderWithProviders = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('DiagnosticHub', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    useAppStore.getState().resetAnalysis();
    serviceMocks.getScanResults.mockReset();
    serviceMocks.getScanResults.mockResolvedValue([{
      id: 'scan-1',
      userId: 'user-1',
      title: 'Anaemia pattern',
      date: '7/17/2026, 9:47:43 AM',
      match: 'Same-day review',
      type: 'lab_result',
      aiResponse: JSON.stringify({
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
      }),
    }]);
  });

  it('renders the hub heading and greeting', () => {
    renderWithProviders(<TranslationProvider><DiagnosticHub /></TranslationProvider>);
    expect(screen.getByRole('heading', { name: /clinical support hub/i })).toBeInTheDocument();
    expect(screen.getByText(/Hello, Dr\. Kamga/i)).toBeInTheDocument();
  });

  it('renders language switcher buttons', () => {
    renderWithProviders(<TranslationProvider><DiagnosticHub /></TranslationProvider>);
    expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'FR' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Local' })).toBeInTheDocument();
  });

  it('renders New Scan call-to-action button', () => {
    renderWithProviders(<TranslationProvider><DiagnosticHub /></TranslationProvider>);
    expect(screen.getByRole('button', { name: /new scan/i })).toBeInTheDocument();
  });

  it('navigates to /scanner when New Scan is clicked', () => {
    renderWithProviders(<TranslationProvider><DiagnosticHub /></TranslationProvider>);
    fireEvent.click(screen.getByRole('button', { name: /new scan/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/scanner');
  });

  it('renders Drugs and Facilities shortcut buttons', () => {
    renderWithProviders(<TranslationProvider><DiagnosticHub /></TranslationProvider>);
    expect(screen.getByRole('button', { name: /drug database/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /near facilities/i })).toBeInTheDocument();
  });

  it('renders the signed-in user\'s real recent results', async () => {
    renderWithProviders(<TranslationProvider><DiagnosticHub /></TranslationProvider>);
    expect(screen.getByText('Recent Results')).toBeInTheDocument();
    expect(await screen.findByText('Anaemia pattern')).toBeInTheDocument();
    expect(screen.queryByText(/dermatitis/i)).not.toBeInTheDocument();
  });

  it('reopens a saved interpretation from Recent Results', async () => {
    renderWithProviders(<TranslationProvider><DiagnosticHub /></TranslationProvider>);
    fireEvent.click(await screen.findByRole('button', { name: /Anaemia pattern/i }));
    expect(useAppStore.getState().possibleFindings[0]?.name).toBe('Anaemia pattern');
    expect(mockNavigate).toHaveBeenCalledWith('/analysis');
  });

  it('renders bottom navigation with Home, Patients, Settings', () => {
    renderWithProviders(<TranslationProvider><DiagnosticHub /></TranslationProvider>);
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toBeInTheDocument();
  });

  it('navigates to /app when Home nav button is clicked', () => {
    renderWithProviders(<TranslationProvider><DiagnosticHub /></TranslationProvider>);
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    const homeBtn = nav.querySelector('button');
    if (homeBtn) fireEvent.click(homeBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/app');
  });

  it('does not show offline banner when online', () => {
    renderWithProviders(<TranslationProvider><DiagnosticHub /></TranslationProvider>);
    expect(screen.queryByText(/offline mode active/i)).not.toBeInTheDocument();
  });
});
