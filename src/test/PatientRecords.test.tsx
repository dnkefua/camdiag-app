import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TranslationProvider } from '../hooks/useTranslation';
import PatientRecords from '../components/PatientRecords';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: React.PropsWithChildren) => <>{children}</>,
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../store/useAppStore', () => ({
  useAppStore: vi.fn(() => ({
    patientRecords: [
      { id: 'P001', diagnosis: 'Dermatitis', category: 'Skin', bodyPart: 'Arm', date: 'Mar 10, 2026', result: 'Positive', status: 'Positive' },
    ],
  })),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('PatientRecords', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders page heading', () => {
    renderWithProviders(
      <TranslationProvider>
        <PatientRecords />
      </TranslationProvider>
    );
    expect(screen.getAllByRole('heading')[0]).toBeInTheDocument();
  });

  it('renders back button', () => {
    renderWithProviders(
      <TranslationProvider>
        <PatientRecords />
      </TranslationProvider>
    );
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('navigates to /app when back is clicked', () => {
    renderWithProviders(
      <TranslationProvider>
        <PatientRecords />
      </TranslationProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/app');
  });

  it('renders active user count', () => {
    renderWithProviders(
      <TranslationProvider>
        <PatientRecords />
      </TranslationProvider>
    );
    expect(screen.getByText('12,842')).toBeInTheDocument();
  });

  it('renders history section with records', () => {
    renderWithProviders(
      <TranslationProvider>
        <PatientRecords />
      </TranslationProvider>
    );
    expect(screen.getByText('Dermatitis')).toBeInTheDocument();
  });

  it('renders bottom navigation buttons', () => {
    renderWithProviders(
      <TranslationProvider>
        <PatientRecords />
      </TranslationProvider>
    );
    // Nav has Home, Patients, Profile buttons
    expect(screen.getAllByRole('button', { name: /home/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /patients/i })).toHaveLength(1);
  });
});