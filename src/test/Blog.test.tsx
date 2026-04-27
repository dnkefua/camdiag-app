import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TranslationProvider } from '../hooks/useTranslation';
import Blog from '../components/Blog';

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

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('Blog', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders page heading', () => {
    renderWithProviders(
      <TranslationProvider>
        <Blog />
      </TranslationProvider>
    );
    expect(screen.getAllByRole('heading')[0]).toBeInTheDocument();
  });

  it('renders back button', () => {
    renderWithProviders(
      <TranslationProvider>
        <Blog />
      </TranslationProvider>
    );
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('navigates to /app when back is clicked', () => {
    renderWithProviders(
      <TranslationProvider>
        <Blog />
      </TranslationProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/app');
  });

  it('renders category tabs', () => {
    renderWithProviders(
      <TranslationProvider>
        <Blog />
      </TranslationProvider>
    );
    expect(screen.getByRole('button', { name: /stories/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /developments/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /innovations/i })).toBeInTheDocument();
  });

  it('renders articles for default stories tab', () => {
    renderWithProviders(
      <TranslationProvider>
        <Blog />
      </TranslationProvider>
    );
    expect(screen.getByText("Surviving Malaria: A Farmer's Tale")).toBeInTheDocument();
    expect(screen.getByText('Overcoming Dermatitis Locally')).toBeInTheDocument();
  });

  it('switches to developments tab', () => {
    renderWithProviders(
      <TranslationProvider>
        <Blog />
      </TranslationProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /developments/i }));
    expect(screen.getByText('New Rapid Tests for Typhoid')).toBeInTheDocument();
  });

  it('switches to innovations tab', () => {
    renderWithProviders(
      <TranslationProvider>
        <Blog />
      </TranslationProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /innovations/i }));
    expect(screen.getByText('Solar-Powered Smart Clinics')).toBeInTheDocument();
  });

  it('switches to reviews tab', () => {
    renderWithProviders(
      <TranslationProvider>
        <Blog />
      </TranslationProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /reviews/i }));
    expect(screen.getByText('Yaoundé Central Hospital Review')).toBeInTheDocument();
  });
});