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

vi.mock('../hooks/useGoogleMaps', () => ({
  useGoogleMaps: () => ({ ready: false, error: 'Interactive map unavailable.' }),
}));

vi.mock('../store/useAppStore', () => ({
  useAppStore: () => ({
    possibleFindings: [{ name: 'Lab values requiring review' }],
    selectedFinding: 0,
    analysisUrgency: 'same_day',
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderWithProviders = (entry = '/next-steps') => render(
  <MemoryRouter initialEntries={[entry]}>
    <TranslationProvider><NextSteps /></TranslationProvider>
  </MemoryRouter>,
);

describe('NextSteps', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('renders the analysis follow-up heading', () => {
    renderWithProviders();
    expect(screen.getByRole('heading', { name: /lab values requiring review/i })).toBeInTheDocument();
  });

  it('navigates back to the analysis', () => {
    renderWithProviders();
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/analysis');
  });

  it('renders real nearby-care categories without fictional providers', () => {
    renderWithProviders();
    expect(screen.getByRole('tab', { name: /^clinics$/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^hospitals$/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^pharmacies$/i })).toBeInTheDocument();
    expect(screen.queryByText(/Yaound/i)).not.toBeInTheDocument();
  });

  it('honors a pharmacy deep link from the analysis page', () => {
    renderWithProviders('/next-steps?tab=pharmacies');
    expect(screen.getByRole('tab', { name: /^pharmacies$/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('link', { name: /search pharmacies in google maps/i })).toHaveAttribute('href', expect.stringContaining('pharmacies'));
  });

  it('switches care categories and keeps a Google Maps fallback', () => {
    renderWithProviders();
    fireEvent.click(screen.getByRole('tab', { name: /^hospitals$/i }));
    expect(screen.getByRole('link', { name: /search hospitals in google maps/i })).toHaveAttribute('target', '_blank');
  });

  it('offers a retryable location action', () => {
    renderWithProviders();
    expect(screen.getByRole('button', { name: /use my location/i })).toBeInTheDocument();
  });

  it('toggles the embedded map view', () => {
    renderWithProviders();
    fireEvent.click(screen.getByRole('button', { name: /view map/i }));
    expect(screen.getByTestId('facility-map')).toBeInTheDocument();
  });
});
