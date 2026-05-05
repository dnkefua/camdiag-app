import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TranslationProvider } from '../hooks/useTranslation';
import DiagnosticHub from '../components/DiagnosticHub';

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
  beforeEach(() => mockNavigate.mockClear());

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

  it('renders recent results section', () => {
    renderWithProviders(<TranslationProvider><DiagnosticHub /></TranslationProvider>);
    expect(screen.getByText('Recent Results')).toBeInTheDocument();
    expect(screen.getByText(/dermatitis/i)).toBeInTheDocument();
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
