import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TranslationProvider } from '../hooks/useTranslation';
import ComingUp from '../components/ComingUp';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: React.PropsWithChildren) => <>{children}</>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('ComingUp', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders page heading', () => {
    renderWithProviders(
      <TranslationProvider>
        <ComingUp />
      </TranslationProvider>
    );
    expect(screen.getByText(/Coming Up/i)).toBeInTheDocument();
  });

  it('renders back button', () => {
    renderWithProviders(
      <TranslationProvider>
        <ComingUp />
      </TranslationProvider>
    );
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('navigates to /app when back is clicked', () => {
    renderWithProviders(
      <TranslationProvider>
        <ComingUp />
      </TranslationProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/app');
  });

  it('renders first slide title', () => {
    renderWithProviders(
      <TranslationProvider>
        <ComingUp />
      </TranslationProvider>
    );
    expect(screen.getByText('The CamDiag Vision')).toBeInTheDocument();
  });

  it('renders next button', () => {
    renderWithProviders(
      <TranslationProvider>
        <ComingUp />
      </TranslationProvider>
    );
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('advances to next slide', () => {
    renderWithProviders(
      <TranslationProvider>
        <ComingUp />
      </TranslationProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('Coming Next: IoT Integration')).toBeInTheDocument();
  });

  it('wraps around after last slide', () => {
    renderWithProviders(
      <TranslationProvider>
        <ComingUp />
      </TranslationProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('Blockchain Medical Records')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('The CamDiag Vision')).toBeInTheDocument();
  });
});