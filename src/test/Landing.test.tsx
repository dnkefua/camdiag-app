import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Landing from '../components/Landing';

vi.mock('framer-motion', async () => {
  const { createFramerMotionMock } = await vi.importActual<typeof import('./mocks')>('./mocks');
  return createFramerMotionMock();
});

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: vi.fn() };
});

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: false,
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    register: vi.fn(),
    loginWithPhone: vi.fn(),
    confirmPhoneCode: vi.fn(),
    isLoading: false,
  })),
}));

vi.mock('../hooks/useTranslation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../hooks/useTranslation')>();
  return {
    ...actual,
    useTranslation: vi.fn(() => ({
      t: {
        welcome_back: 'Welcome back',
        login_subtitle: 'Sign in',
        login: 'Log in',
        continue_with_google: 'Continue with Gmail',
        email_placeholder: 'Email',
        password_placeholder: 'Password',
        otp_sent: 'Code sent',
        verify_otp: 'Verify',
        send_otp: 'Send code',
        enter_otp: 'Enter code',
        otp_placeholder: '6-digit code',
        phone_number: 'Phone',
        phone_placeholder: '+237',
        use_email_instead: 'Use email',
        use_phone_instead: 'Use phone',
        or_continue_with_phone: 'Or phone',
        or_continue_with_email: 'Or email',
      },
      language: 'en',
      setLanguage: vi.fn(),
    })),
  };
});

describe('Landing', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders without crashing', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getAllByText(/Cam/i).length).toBeGreaterThan(0);
  });

  it('keeps focus in the email input while typing', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);

    const loginButton = screen.getAllByRole('button', { name: /log in/i })[0];
    if (!loginButton) throw new Error('Login button not found');
    fireEvent.click(loginButton);
    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;

    emailInput.focus();
    fireEvent.change(emailInput, { target: { value: 'doctor@camdiag.cm' } });

    expect(emailInput).toHaveValue('doctor@camdiag.cm');
    expect(document.activeElement).toBe(emailInput);
  });

  it('opens the sign-in dialog from the demo query link', () => {
    render(<MemoryRouter initialEntries={['/?login=1']}><Landing /></MemoryRouter>);
    expect(screen.getByRole('dialog', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close sign-in/i })).toHaveFocus();
  });

  it('traps focus, closes on Escape and restores the opener', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    const opener = screen.getAllByRole('button', { name: /log in/i })[0]!;
    opener.focus(); fireEvent.click(opener);
    const close = screen.getByRole('button', { name: /close sign-in/i });
    const last = screen.getByRole('button', { name: /continue without account/i });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('does not advertise unsupported clinical claims or endorsements', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.queryByText(/medical-grade|offline fallback|trusted across|Artemisia Tea|Coartem recommended/i)).not.toBeInTheDocument();
    expect(screen.getByText(/clinical output is in English or French/i)).toBeInTheDocument();
  });
});
