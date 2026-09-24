import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ auth: { currentUser: { uid: 'user-a' } as { uid: string } | null }, setDoc: vi.fn(), controller: new AbortController() }));
vi.mock('../lib/firebase', () => ({ auth: mocks.auth, db: {} }));
vi.mock('../services/session', () => ({ getSensitiveSessionSignal: () => mocks.controller.signal }));
vi.mock('firebase/firestore', () => ({ collection: vi.fn(), doc: vi.fn((_db, collection, id) => ({ collection, id })), getDocs: vi.fn(), setDoc: mocks.setDoc, query: vi.fn(), orderBy: vi.fn(), where: vi.fn() }));
import * as profileService from '../services/firestore';
beforeEach(() => { vi.clearAllMocks(); mocks.auth.currentUser = { uid: 'user-a' }; mocks.controller = new AbortController(); mocks.setDoc.mockResolvedValue(undefined); });
describe('browser profile boundary', () => {
  it('does not expose legacy clinical writes, account deletion or seeders', () => {
    for (const key of ['addPatientRecord', 'addScanResult', 'saveScanResult', 'seedDatabase', 'deleteUser']) expect(profileService).not.toHaveProperty(key);
  });
  it('permits a bounded profile update for the current user', async () => {
    await profileService.updateUserProfile('user-a', { name: 'Synthetic user', about: 'Reviewer' });
    expect(mocks.setDoc).toHaveBeenCalledWith({ collection: 'users', id: 'user-a' }, { name: 'Synthetic user', about: 'Reviewer' }, { merge: true });
  });
  it('rejects unauthorized targets and runtime role/patient fields before writing', async () => {
    await expect(profileService.updateUserProfile('user-b', { name: 'Another user' })).rejects.toThrow('sign in');
    await expect(profileService.updateUserProfile('user-a', { role: 'admin' } as never)).rejects.toThrow('Unsupported profile');
    await expect(profileService.updateUserProfile('user-a', { symptoms: 'Sensitive text' } as never)).rejects.toThrow('Unsupported profile');
    expect(mocks.setDoc).not.toHaveBeenCalled();
  });
  it('rejects base64 images, oversized descriptions and malformed preferences', async () => {
    await expect(profileService.updateUserProfile('user-a', { photoUrl: 'data:image/png;base64,test' })).rejects.toThrow('HTTPS');
    await expect(profileService.updateUserProfile('user-a', { about: 'a'.repeat(1001) })).rejects.toThrow('1000');
    await expect(profileService.updateUserProfile('user-a', { notificationPrefs: { scanResults: true } as never })).rejects.toThrow('preferences');
    expect(mocks.setDoc).not.toHaveBeenCalled();
  });
  it('does not confirm a write after the account session changes', async () => {
    mocks.setDoc.mockImplementation(async () => { mocks.controller.abort(); });
    await expect(profileService.updateUserProfile('user-a', { name: 'Synthetic' })).rejects.toThrow('Failed to update');
  });
});
