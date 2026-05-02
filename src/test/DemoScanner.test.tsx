import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DemoScanner from '../components/DemoScanner';
import { trackEvent } from '../services/analytics';

const navigate = vi.fn();

vi.mock('framer-motion', async () => {
  const { createFramerMotionMock } = await vi.importActual<typeof import('./mocks')>('./mocks');
  return createFramerMotionMock();
});

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('../hooks/useTranslation', () => ({
  useTranslation: () => ({
    language: 'en',
  }),
}));

vi.mock('../services/analytics', () => ({
  trackEvent: vi.fn(),
}));

describe('DemoScanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs the demo scan without requiring auth', () => {
    render(<MemoryRouter><DemoScanner /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', { name: /try demo scan/i }));

    expect(trackEvent).toHaveBeenCalledWith('demo_scan_preview');
  });

  it('returns users to sign in from the demo', () => {
    render(<MemoryRouter><DemoScanner /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', { name: /sign in for ai analysis/i }));

    expect(navigate).toHaveBeenCalledWith('/');
  });
});
