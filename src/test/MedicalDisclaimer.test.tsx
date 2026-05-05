import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TranslationProvider } from '../hooks/useTranslation';
import { MedicalDisclaimer } from '../components/ui/MedicalDisclaimer';

vi.mock('framer-motion', async () => {
  const { createFramerMotionMock } = await vi.importActual<typeof import('./mocks')>('./mocks');
  return createFramerMotionMock();
});

describe('MedicalDisclaimer', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('requires all consent acknowledgements before continuing', () => {
    render(
      <TranslationProvider>
        <MedicalDisclaimer />
      </TranslationProvider>,
    );

    const accept = screen.getByRole('button', { name: /accept/i });
    expect(accept).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/does not diagnose/i));
    expect(accept).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/emergency warning signs/i));
    fireEvent.click(screen.getByLabelText(/health data use/i));

    expect(accept).toBeEnabled();
    fireEvent.click(accept);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(localStorage.getItem('camdiag_clinical_consent_v2')).toContain('clinical-consent-v2');
  });
});
