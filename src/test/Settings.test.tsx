import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TranslationProvider } from '../hooks/useTranslation';
import Settings from '../components/Settings';

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
    user: { name: 'Dr. Kamga', email: 'kamga@camdiag.cm', initials: 'DK' },
    logout: mockLogout,
  })),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('Settings', () => {
  beforeEach(() => {
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
});