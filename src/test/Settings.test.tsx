import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TranslationProvider } from '../hooks/useTranslation';
import Settings from '../components/Settings';
import { updateUserProfile } from '../services/firestore';
import { requestAccountDeletion, saveClinicalConsent } from '../services/consent';
import { resetSensitiveSession } from '../services/session';

vi.mock('../services/firestore', () => ({ updateUserProfile: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../services/consent', () => ({
  CONSENT_VERSION: 'clinical-consent-v3',
  getClinicalConsent: vi.fn().mockResolvedValue({ version: 'clinical-consent-v3', clinicalProcessing: true }),
  saveClinicalConsent: vi.fn().mockResolvedValue({ version: 'clinical-consent-v3', clinicalProcessing: false }),
  exportAccountData: vi.fn(),
  requestAccountDeletion: vi.fn().mockResolvedValue({ id: 'request-123', status: 'pending_human_review' }),
}));
vi.mock('../services/privacy', () => ({ getAnalyticsConsent: () => false, setAnalyticsConsent: vi.fn() }));
vi.mock('../services/session', () => ({ resetSensitiveSession: vi.fn() }));

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

const mockLogout = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { uid: 'user-a', name: 'Dr. Kamga', email: 'kamga@camdiag.cm', initials: 'DK', canUseClinicalTools: true, clinicalRole: 'doctor', organizationId: 'clinic-a' },
    logout: mockLogout,
  })),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockLogout.mockClear();
  });

  it('renders page heading', () => {
    renderWithProviders(
      <TranslationProvider>
        <Settings />
      </TranslationProvider>
    );
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
  });

  it('renders back button', () => {
    renderWithProviders(
      <TranslationProvider>
        <Settings />
      </TranslationProvider>
    );
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('navigates to /app when back is clicked', () => {
    renderWithProviders(
      <TranslationProvider>
        <Settings />
      </TranslationProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/app');
  });

  it('renders user profile name', () => {
    renderWithProviders(
      <TranslationProvider>
        <Settings />
      </TranslationProvider>
    );
    expect(screen.getByText('Dr. Kamga')).toBeInTheDocument();
  });

  it('renders user email', () => {
    renderWithProviders(
      <TranslationProvider>
        <Settings />
      </TranslationProvider>
    );
    expect(screen.getByText('kamga@camdiag.cm')).toBeInTheDocument();
  });

  it('renders logout button', () => {
    renderWithProviders(
      <TranslationProvider>
        <Settings />
      </TranslationProvider>
    );
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('calls logout when logout button is clicked', () => {
    renderWithProviders(
      <TranslationProvider>
        <Settings />
      </TranslationProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(mockLogout).toHaveBeenCalled();
  });

  it('displays server claims and never lets profile updates change roles or patient context', async () => {
    renderWithProviders(<TranslationProvider><Settings /></TranslationProvider>);
    expect(screen.getByText('doctor')).toBeInTheDocument();
    expect(screen.getByText('clinic-a')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'New name' } });
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }));
    await waitFor(() => expect(updateUserProfile).toHaveBeenCalled());
    const update = vi.mocked(updateUserProfile).mock.calls[0]![1];
    expect(update).not.toHaveProperty('role');
    expect(update).not.toHaveProperty('symptoms');
    expect(update.name).toBe('New name');
  });

  it('withdraws consent server-side and clears sensitive session data', async () => {
    renderWithProviders(<TranslationProvider><Settings /></TranslationProvider>);
    fireEvent.click(screen.getByRole('button', { name: /^security$/i }));
    fireEvent.click(screen.getByRole('button', { name: /withdraw clinical consent/i }));
    await waitFor(() => expect(saveClinicalConsent).toHaveBeenCalledWith(false, false));
    expect(resetSensitiveSession).toHaveBeenCalled();
    expect(await screen.findByRole('status')).toHaveTextContent('existing records have not been deleted');
  });

  it('describes deletion as a pending request instead of completed erasure', async () => {
    renderWithProviders(<TranslationProvider><Settings /></TranslationProvider>);
    fireEvent.click(screen.getByRole('button', { name: /^security$/i }));
    fireEvent.click(screen.getByRole('button', { name: /request account deletion/i }));
    expect(requestAccountDeletion).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /submit deletion request/i }));
    expect(await screen.findByText(/request-123.*pending human review/i)).toHaveTextContent('No data has been deleted yet');
  });
});
