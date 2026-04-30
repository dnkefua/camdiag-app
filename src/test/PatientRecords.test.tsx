import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

// Mock auth context
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'test-uid' }, isAuthenticated: true, isLoading: false }),
}));

// Mock Firestore service
const mockRecords = [
  { id: 'P001', userId: 'test-uid', date: 'Mar 10, 2026', diagnosis: 'Dermatitis', status: 'Positive', result: 'Positive', category: 'Skin', bodyPart: 'Arm' },
];
vi.mock('../services/firestore', () => ({
  getPatientRecords: vi.fn(() => Promise.resolve(mockRecords)),
}));

// Reactive store mock
let storeRecords: typeof mockRecords = [];
const setPatientRecords = (records: typeof mockRecords) => { storeRecords = records; };

vi.mock('../store/useAppStore', () => ({
  useAppStore: vi.fn(() => ({
    patientRecords: storeRecords,
    setPatientRecords,
  })),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('PatientRecords', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    storeRecords = [];
  });

  it('renders page heading', async () => {
    renderWithProviders(
      <TranslationProvider>
        <PatientRecords />
      </TranslationProvider>
    );
    await waitFor(() => {
      expect(screen.getAllByRole('heading')[0]).toBeInTheDocument();
    });
  });

  it('renders back button', async () => {
    renderWithProviders(
      <TranslationProvider>
        <PatientRecords />
      </TranslationProvider>
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });
  });

  it('navigates to /app when back is clicked', async () => {
    renderWithProviders(
      <TranslationProvider>
        <PatientRecords />
      </TranslationProvider>
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/app');
  });

  it('renders active user count', async () => {
    renderWithProviders(
      <TranslationProvider>
        <PatientRecords />
      </TranslationProvider>
    );
    await waitFor(() => {
      expect(screen.getByText('12,842')).toBeInTheDocument();
    });
  });

  it('renders history section with records', async () => {
    renderWithProviders(
      <TranslationProvider>
        <PatientRecords />
      </TranslationProvider>
    );
    await waitFor(() => {
      expect(screen.getByText('Dermatitis')).toBeInTheDocument();
    });
  });

  it('renders bottom navigation buttons', async () => {
    renderWithProviders(
      <TranslationProvider>
        <PatientRecords />
      </TranslationProvider>
    );
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /home/i })).toHaveLength(1);
    });
    expect(screen.getAllByRole('button', { name: /patients/i })).toHaveLength(1);
  });
});
