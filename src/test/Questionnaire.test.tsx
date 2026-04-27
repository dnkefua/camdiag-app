import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TranslationProvider } from '../hooks/useTranslation';
import Questionnaire from '../components/Questionnaire';

vi.mock('framer-motion', () => {
  return {
    motion: {
      div: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    },
  };
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../hooks/useTranslation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../hooks/useTranslation')>();
  return {
    ...actual,
    useTranslation: vi.fn(() => ({
      t: {
        questionnaire_title: 'Medication Questionnaire',
        quest_intro: 'Complete the questionnaire',
        quest_reward: 'Thank you',
        back: 'Back',
        quest_q1: 'Medication name',
        quest_q2: 'Source',
        quest_q3: 'Did it work?',
        quest_audio: 'Audio',
        quest_image: 'Image',
        quest_submit: 'Submit',
      },
    })),
  };
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('Questionnaire', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the form heading', () => {
    renderWithProviders(
      <TranslationProvider>
        <Questionnaire />
      </TranslationProvider>
    );
    expect(screen.getAllByRole('heading')[0]).toBeInTheDocument();
  });

  it('renders medication input field', () => {
    renderWithProviders(
      <TranslationProvider>
        <Questionnaire />
      </TranslationProvider>
    );
    expect(screen.getAllByRole('textbox')[0]).toBeInTheDocument();
  });

  it('renders source input field', () => {
    renderWithProviders(
      <TranslationProvider>
        <Questionnaire />
      </TranslationProvider>
    );
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });

  it('renders yes/no/maybe worked buttons', () => {
    renderWithProviders(
      <TranslationProvider>
        <Questionnaire />
      </TranslationProvider>
    );
    expect(screen.getByRole('button', { name: 'yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'no' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'maybe' })).toBeInTheDocument();
  });

  it('allows text input in medication field', () => {
    renderWithProviders(
      <TranslationProvider>
        <Questionnaire />
      </TranslationProvider>
    );
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Coartem' } });
    expect(inputs[0]).toHaveValue('Coartem');
  });

  it('shows validation error for empty submission', () => {
    renderWithProviders(
      <TranslationProvider>
        <Questionnaire />
      </TranslationProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    // Form should not advance to success screen on empty submit
    expect(screen.queryByText(/thank you/i)).not.toBeInTheDocument();
  });

  it('shows success screen after valid submission', () => {
    renderWithProviders(
      <TranslationProvider>
        <Questionnaire />
      </TranslationProvider>
    );
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Coartem' } });
    fireEvent.change(inputs[1], { target: { value: 'City Pharmacy' } });
    fireEvent.click(screen.getByRole('button', { name: 'yes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getAllByText(/thank you/i).length).toBeGreaterThan(0);
  });

  it('navigates to /analysis after submission via back button', () => {
    renderWithProviders(
      <TranslationProvider>
        <Questionnaire />
      </TranslationProvider>
    );
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Coartem' } });
    fireEvent.change(inputs[1], { target: { value: ' pharmacy' } });
    fireEvent.click(screen.getByRole('button', { name: 'yes' }));
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/analysis');
  });
});