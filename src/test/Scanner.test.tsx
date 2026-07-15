import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TranslationProvider } from '../hooks/useTranslation';
import Scanner from '../components/Scanner';

vi.mock('framer-motion', async () => {
  const { createFramerMotionMock } = await vi.importActual<typeof import('./mocks')>('./mocks');
  return createFramerMotionMock();
});

vi.mock('../hooks/useCamera', () => ({
  useCamera: () => ({
    videoRef: { current: null },
    stream: null,
    isReady: true,
    isStarting: false,
    error: null,
    facing: 'environment',
    hasFlashSupport: true,
    flashOn: false,
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    toggleFacing: vi.fn(),
    toggleFlash: vi.fn(),
    capture: vi.fn().mockResolvedValue(null),
  }),
}));

vi.mock('../services/analytics', () => ({
  trackEvent: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../store/useAppStore', () => ({
  useAppStore: vi.fn(() => ({
    setPossibleFindings: vi.fn(),
    setMarkers: vi.fn(),
    setAnalyzing: vi.fn(),
    setAnalysisError: vi.fn(),
    setTranscription: vi.fn(),
    setPendingPages: vi.fn(),
    setPendingDocumentType: vi.fn(),
    isAnalyzing: false,
  })),
}));

vi.mock('../services/api', () => ({
  isApiConfigured: vi.fn(() => false),
}));

const renderWithProviders = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('Scanner', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('renders scanner heading', () => {
    renderWithProviders(<TranslationProvider><Scanner /></TranslationProvider>);
    expect(screen.getByText('CamDiag Scan')).toBeInTheDocument();
  });

  it('renders close button', () => {
    renderWithProviders(<TranslationProvider><Scanner /></TranslationProvider>);
    expect(screen.getByRole('button', { name: /close scanner/i })).toBeInTheDocument();
  });

  it('navigates to /app when close button is clicked', () => {
    renderWithProviders(<TranslationProvider><Scanner /></TranslationProvider>);
    fireEvent.click(screen.getByRole('button', { name: /close scanner/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/app');
  });

  it('renders flash toggle button', () => {
    renderWithProviders(<TranslationProvider><Scanner /></TranslationProvider>);
    expect(screen.getByRole('button', { name: /toggle flash/i })).toBeInTheDocument();
  });

  it('renders mode toggle button', () => {
    renderWithProviders(<TranslationProvider><Scanner /></TranslationProvider>);
    expect(screen.getByRole('button', { name: /mode:/i })).toBeInTheDocument();
  });

  it('shows body mode error when body mode selected and capture clicked', () => {
    renderWithProviders(<TranslationProvider><Scanner /></TranslationProvider>);
    fireEvent.click(screen.getByRole('button', { name: /mode:/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Scan' }));
    expect(screen.getByText(/Invalid Subject Detected/i)).toBeInTheDocument();
  });

  it('renders gallery input', () => {
    renderWithProviders(<TranslationProvider><Scanner /></TranslationProvider>);
    // Gallery is now a <label> wrapping a hidden file input
    expect(screen.getByLabelText(/open gallery/i)).toBeInTheDocument();
    const input = document.querySelector('input[type="file"]');
    expect(input).toHaveAttribute('multiple');
    expect(input).toHaveAttribute('accept', expect.stringContaining('application/pdf'));
  });

  it('allows the clinician to classify a prescription before OCR', () => {
    renderWithProviders(<TranslationProvider><Scanner /></TranslationProvider>);
    expect(screen.getByRole('combobox', { name: /document type/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /prescription/i })).toBeInTheDocument();
  });
});
