import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clinicalRequest } from '../services/medgemma';
import { exportAccountData, getClinicalConsent, requestAccountDeletion, saveClinicalConsent } from '../services/consent';

const session = vi.hoisted(() => ({ controller: new AbortController() }));
vi.mock('../services/medgemma', () => ({ clinicalRequest: vi.fn() }));
vi.mock('../services/session', () => ({ getSensitiveSessionSignal: () => session.controller.signal }));
const exportPage = (collection: string, items: Array<Record<string, unknown>>, nextCursor: string | null = null) => ({ schemaVersion: 'clinical-v1', exportedAt: '2026-09-23', collection, availableCollections: ['profile', 'encounters'], records: { items, nextCursor }, scopeNotice: 'Own structured records; source binaries, provider logs and backups are excluded.' });
describe('Account consent and export client', () => {
  beforeEach(() => { vi.clearAllMocks(); session.controller = new AbortController(); });
  it('rejects invalid consent responses', async () => {
    vi.mocked(clinicalRequest).mockResolvedValue({ consent: { clinicalProcessing: true } });
    await expect(getClinicalConsent()).rejects.toThrow('invalid response');
  });
  it('does not report a consent write as saved unless the server confirms its version and choice', async () => {
    vi.mocked(clinicalRequest).mockResolvedValue({ consent: { version: 'old', clinicalProcessing: true, optionalAnalytics: false, acceptedAt: '2026-09-22' } });
    await expect(saveClinicalConsent(true, false)).rejects.toThrow('Consent was not saved');
  });
  it('downloads every available collection and every page, with the scope notice', async () => {
    vi.mocked(clinicalRequest)
      .mockResolvedValueOnce(exportPage('profile', [{ name: 'Synthetic' }]))
      .mockResolvedValueOnce(exportPage('encounters', [{ id: 'a' }], 'next'))
      .mockResolvedValueOnce(exportPage('encounters', [{ id: 'b' }]));
    const result = await exportAccountData();
    expect(result.collections.encounters).toHaveLength(2);
    expect(result.collections.profile).toEqual([{ name: 'Synthetic' }]);
    expect(result.scopeNotice).toContain('source binaries');
    expect(clinicalRequest).toHaveBeenLastCalledWith('account/export?collection=encounters&limit=50&cursor=next');
  });
  it('never returns a partial export after pagination fails or repeats', async () => {
    vi.mocked(clinicalRequest).mockResolvedValue(exportPage('profile', [], 'same'));
    await expect(exportAccountData()).rejects.toThrow('could not finish');
  });
  it('discards export data after the account session changes', async () => {
    vi.mocked(clinicalRequest).mockImplementation(async () => { session.controller.abort(); return exportPage('profile', []); });
    await expect(exportAccountData()).rejects.toThrow();
  });
  it('accepts only a server-confirmed pending deletion request', async () => {
    vi.mocked(clinicalRequest).mockResolvedValue({ id: 'request-1', status: 'deleted' });
    await expect(requestAccountDeletion()).rejects.toThrow('was not confirmed');
  });
  it('rejects changing or unexpected export collections without returning partial records', async () => {
    vi.mocked(clinicalRequest).mockResolvedValueOnce(exportPage('profile', [])).mockResolvedValueOnce(exportPage('another_user', []));
    await expect(exportAccountData()).rejects.toThrow('incomplete');
  });
});
