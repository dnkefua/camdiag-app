import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
