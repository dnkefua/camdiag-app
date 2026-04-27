import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TranslationProvider } from '../hooks/useTranslation';
import NextSteps from '../components/NextSteps';

vi.mock('framer-motion', async () => {
  const { createFramerMotionMock } = await vi.importActual<typeof import('./mocks')>('./mocks');
  return createFramerMotionMock();
});

vi.mock('../components/ui/FacilityMap', () => ({
  FacilityMap: () => <div data-testid="facility-map">Map</div>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderWithProviders = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('NextSteps', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('renders page heading', () => {
    renderWithProviders(<TranslationProvider><NextSteps /></TranslationProvider>);
    expect(screen.getByRole('heading', { name: /next steps/i })).toBeInTheDocument();
  });

  it('renders back button', () => {
    renderWithProviders(<TranslationProvider><NextSteps /></TranslationProvider>);
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('navigates to /app when back is clicked', () => {
    renderWithProviders(<TranslationProvider><NextSteps /></TranslationProvider>);
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/app');
  });

  it('renders facility tabs (clinics, hospitals, pharmacies, telehealth)', () => {
    renderWithProviders(<TranslationProvider><NextSteps /></TranslationProvider>);
    expect(screen.getByRole('button', { name: /^clinics$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^hospitals$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^pharmacies$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^telehealth$/i })).toBeInTheDocument();
  });

  it('renders facility list for default tab', () => {
    renderWithProviders(<TranslationProvider><NextSteps /></TranslationProvider>);
    expect(screen.getByText('City General Dermatology')).toBeInTheDocument();
    expect(screen.getByText('Hope Skin & Laser Center')).toBeInTheDocument();
  });

  it('switches to hospitals tab and shows hospitals', () => {
    renderWithProviders(<TranslationProvider><NextSteps /></TranslationProvider>);
    fireEvent.click(screen.getByRole('button', { name: /^hospitals$/i }));
    expect(screen.getByText(/Yaound. Central Hospital/i)).toBeInTheDocument();
  });

  it('switches to pharmacies tab and shows pharmacies', () => {
    renderWithProviders(<TranslationProvider><NextSteps /></TranslationProvider>);
    fireEvent.click(screen.getByRole('button', { name: /^pharmacies$/i }));
    expect(screen.getByText('MedPlus Pharmacy')).toBeInTheDocument();
  });

  it('switches to telehealth tab and shows telehealth options', () => {
    renderWithProviders(<TranslationProvider><NextSteps /></TranslationProvider>);
    fireEvent.click(screen.getByRole('button', { name: /^telehealth$/i }));
    expect(screen.getByText('Waspito Virtual Care')).toBeInTheDocument();
  });

  it('renders map toggle button', () => {
    renderWithProviders(<TranslationProvider><NextSteps /></TranslationProvider>);
    expect(screen.getByRole('button', { name: /view map/i })).toBeInTheDocument();
  });

  it('toggles map view when map button is clicked', () => {
    renderWithProviders(<TranslationProvider><NextSteps /></TranslationProvider>);
    fireEvent.click(screen.getByRole('button', { name: /view map/i }));
    expect(screen.getByTestId('facility-map')).toBeInTheDocument();
  });
});
