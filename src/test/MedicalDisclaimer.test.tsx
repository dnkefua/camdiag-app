import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TranslationProvider } from '../hooks/useTranslation';
import { MedicalDisclaimer } from '../components/ui/MedicalDisclaimer';
import { getClinicalConsent, saveClinicalConsent } from '../services/consent';
import { setAnalyticsConsent } from '../services/privacy';

const identity = vi.hoisted(() => ({ user: { uid: 'user-a' }, isAuthenticated: true }));
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => identity }));
vi.mock('../services/consent', () => ({ CONSENT_VERSION: 'clinical-consent-v3', CONSENT_CHANGED_EVENT: 'consent-changed', getClinicalConsent: vi.fn(), saveClinicalConsent: vi.fn() }));
vi.mock('../services/privacy', () => ({ getAnalyticsConsent: () => false, setAnalyticsConsent: vi.fn() }));
const renderGate = (path = '/scanner') => render(<MemoryRouter initialEntries={[path]}><TranslationProvider><MedicalDisclaimer><p>Protected clinical screen</p></MedicalDisclaimer></TranslationProvider></MemoryRouter>);
describe('MedicalDisclaimer', () => {
  beforeEach(() => {
    vi.clearAllMocks(); identity.user = { uid: 'user-a' }; identity.isAuthenticated = true;
    vi.mocked(getClinicalConsent).mockResolvedValue(null);
    vi.mocked(saveClinicalConsent).mockResolvedValue({ version: 'clinical-consent-v3', clinicalProcessing: true, optionalAnalytics: false, acceptedAt: '2026-09-22' });
  });
  it.each(['/demo', '/', '/settings'])('does not ask for clinical consent at %s', (path) => {
    renderGate(path);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(getClinicalConsent).not.toHaveBeenCalled();
  });
  it('keeps protected children unmounted until consent is verified', async () => {
    renderGate();
    expect(screen.queryByText('Protected clinical screen')).not.toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /I Accept & Continue/i })).toBeDisabled();
    expect(screen.queryByText('Protected clinical screen')).not.toBeInTheDocument();
  });
  it('requires essential acknowledgements and persists consent without forcing analytics', async () => {
    renderGate();
    const accept = await screen.findByRole('button', { name: /I Accept & Continue/i });
    fireEvent.click(screen.getByLabelText(/does not diagnose/i));
    fireEvent.click(screen.getByLabelText(/emergency warning signs/i));
    expect(accept).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/health data use/i));
    expect(screen.getByLabelText(/Optional: allow usage analytics/i)).not.toBeChecked();
    fireEvent.click(accept);
    await waitFor(() => expect(saveClinicalConsent).toHaveBeenCalledWith(true, false));
    expect(await screen.findByText('Protected clinical screen')).toBeInTheDocument();
    expect(setAnalyticsConsent).toHaveBeenCalledWith(false);
  });
  it('fails closed if the server cannot confirm consent', async () => {
    vi.mocked(getClinicalConsent).mockRejectedValue(new Error('unavailable'));
    renderGate();
    expect(await screen.findByRole('alert')).toHaveTextContent('Consent could not be verified');
    expect(screen.queryByText('Protected clinical screen')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /I Accept & Continue/i })).not.toBeInTheDocument();
  });
  it('keeps the gate open if saving consent fails', async () => {
    vi.mocked(saveClinicalConsent).mockRejectedValue(new Error('unavailable'));
    renderGate();
    await screen.findByRole('button', { name: /I Accept & Continue/i });
    for (const checkbox of screen.getAllByRole('checkbox').slice(0, 3)) fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole('button', { name: /I Accept & Continue/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Consent was not saved');
    expect(screen.queryByText('Protected clinical screen')).not.toBeInTheDocument();
  });
  it('accepts only the current account and current consent version', async () => {
    vi.mocked(getClinicalConsent).mockResolvedValue({ version: 'clinical-consent-v2', clinicalProcessing: true, optionalAnalytics: false, acceptedAt: 'old' });
    renderGate();
    expect(await screen.findByRole('button', { name: /I Accept & Continue/i })).toBeDisabled();
    expect(screen.queryByText('Protected clinical screen')).not.toBeInTheDocument();
  });
  it('rechecks server consent on withdrawal events without mounting clinical children', async () => {
    vi.mocked(getClinicalConsent).mockResolvedValueOnce({ version: 'clinical-consent-v3', clinicalProcessing: true, optionalAnalytics: false, acceptedAt: 'now' }).mockResolvedValue(null);
    renderGate();
    expect(await screen.findByText('Protected clinical screen')).toBeInTheDocument();
    act(() => { window.dispatchEvent(new Event('consent-changed')); });
    expect(screen.queryByText('Protected clinical screen')).not.toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /I Accept & Continue/i })).toBeDisabled();
    expect(getClinicalConsent).toHaveBeenCalledTimes(2);
  });
});
