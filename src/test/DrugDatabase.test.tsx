import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TranslationProvider } from '../hooks/useTranslation';
import DrugDatabase from '../components/DrugDatabase';

// Mock framer-motion to skip animation initial states
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: React.PropsWithChildren) => <>{children}</>,
  },
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAppStore — inject known drug data so tests don't depend on store state
const mockDrugDatabase = [
  { name: 'Coartem (Artemether/Lumefantrine)', type: 'Antimalarial', dosage: '20mg/120mg', availability: 'High', description: 'First-line treatment for uncomplicated malaria in Cameroon.' },
  { name: 'Paracetamol (Efferalgan)', type: 'Analgesic', dosage: '500mg/1g', availability: 'High', description: 'Used for fever and pain relief.' },
  { name: 'Amoxicillin', type: 'Antibiotic', dosage: '250mg/500mg', availability: 'High', description: 'Broad-spectrum antibiotic for bacterial infections.' },
];

vi.mock('../store/useAppStore', () => ({
  useAppStore: () => ({ drugDatabase: mockDrugDatabase }),
}));

// Mock api service (API not configured in tests)
vi.mock('../services/api', () => ({
  isApiConfigured: () => false,
}));

// Mock medgemma service
vi.mock('../services/medgemma', () => ({
  searchMedicationInfo: vi.fn(),
  checkDrugInteractions: vi.fn(),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('DrugDatabase', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the Drugs page heading', () => {
    renderWithProviders(
      <TranslationProvider>
        <DrugDatabase />
      </TranslationProvider>
    );
    // The h1 text is the t.drugs value from en.json — use exact h1 query
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders the search input', () => {
    renderWithProviders(
      <TranslationProvider>
        <DrugDatabase />
      </TranslationProvider>
    );
    expect(screen.getByPlaceholderText(/search medications/i)).toBeInTheDocument();
  });

  it('renders all drugs from the store', () => {
    renderWithProviders(
      <TranslationProvider>
        <DrugDatabase />
      </TranslationProvider>
    );
    expect(screen.getByText(/Coartem/i)).toBeInTheDocument();
    expect(screen.getByText(/Paracetamol/i)).toBeInTheDocument();
    expect(screen.getByText(/Amoxicillin/i)).toBeInTheDocument();
  });

  it('filters drugs by name when typing in search', () => {
    renderWithProviders(
      <TranslationProvider>
        <DrugDatabase />
      </TranslationProvider>
    );
    const searchInput = screen.getByPlaceholderText(/search medications/i);
    fireEvent.change(searchInput, { target: { value: 'Coartem' } });
    expect(screen.getByText(/Coartem/i)).toBeInTheDocument();
    expect(screen.queryByText(/Paracetamol/i)).not.toBeInTheDocument();
  });

  it('filters drugs by type when typing in search', () => {
    renderWithProviders(
      <TranslationProvider>
        <DrugDatabase />
      </TranslationProvider>
    );
    const searchInput = screen.getByPlaceholderText(/search medications/i);
    fireEvent.change(searchInput, { target: { value: 'Antibiotic' } });
    expect(screen.queryByText(/Coartem/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Amoxicillin/i)).toBeInTheDocument();
  });

  it('shows all drugs again when search is cleared', () => {
    renderWithProviders(
      <TranslationProvider>
        <DrugDatabase />
      </TranslationProvider>
    );
    const searchInput = screen.getByPlaceholderText(/search medications/i);
    fireEvent.change(searchInput, { target: { value: 'Coartem' } });
    expect(screen.getByText(/Coartem/i)).toBeInTheDocument();
    expect(screen.queryByText(/Paracetamol/i)).not.toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText(/Coartem/i)).toBeInTheDocument();
    expect(screen.getByText(/Paracetamol/i)).toBeInTheDocument();
  });

  it('renders bottom navigation', () => {
    renderWithProviders(
      <TranslationProvider>
        <DrugDatabase />
      </TranslationProvider>
    );
    expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /patients/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /scan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /profile/i })).toBeInTheDocument();
  });

  it('navigates back to /app when back button is clicked', () => {
    renderWithProviders(
      <TranslationProvider>
        <DrugDatabase />
      </TranslationProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/app');
  });
});
