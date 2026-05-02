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
});
