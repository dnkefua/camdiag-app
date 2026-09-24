import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ observer: undefined as undefined | ((user: unknown) => void), getDoc: vi.fn(), setDoc: vi.fn(), bind: vi.fn(), reset: vi.fn() }));
vi.mock('../lib/firebase', () => ({ auth: {}, db: {} }));
vi.mock('../services/session', () => ({ bindSensitiveSession: mocks.bind, resetSensitiveSession: mocks.reset }));
vi.mock('firebase/auth', () => ({
  onIdTokenChanged: vi.fn((_auth, callback) => { mocks.observer = callback; return vi.fn(); }),
  GoogleAuthProvider: class { setCustomParameters() {} },
  RecaptchaVerifier: class {},
  signInWithEmailAndPassword: vi.fn(), createUserWithEmailAndPassword: vi.fn(), signOut: vi.fn(), signInWithPhoneNumber: vi.fn(), signInWithPopup: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({ doc: vi.fn(), getDoc: mocks.getDoc, setDoc: mocks.setDoc, serverTimestamp: () => 0 }));
import { getUserProfile, onAuthChange } from '../services/auth';
const user = (uid: string, claims: Record<string, unknown> = {}) => ({ uid, email: 'synthetic@example.invalid', displayName: 'Synthetic', photoURL: null, getIdTokenResult: vi.fn(async () => ({ claims })) });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDoc.mockResolvedValue({ exists: () => true, data: () => ({ uid: 'forged', id: 'forged', role: 'admin', canUseClinicalTools: true, organizationId: 'forged' }) });
});
describe('server-issued clinical identity', () => {
  it('ignores profile role, organization and UID escalation', async () => {
    const result = await getUserProfile(user('real-user') as never);
    expect(result).toMatchObject({ uid: 'real-user', id: 'real-user', role: 'patient', canUseClinicalTools: false });
    expect(result.organizationId).toBeUndefined();
  });
  it('requires all verified clinician claims', async () => {
    const incomplete = await getUserProfile(user('u', { verifiedClinician: true, clinicalRole: 'admin', organizationId: 'clinic' }) as never);
    expect(incomplete.canUseClinicalTools).toBe(false);
    const complete = await getUserProfile(user('u', { verifiedClinician: true, clinicalRole: 'nurse', organizationId: 'clinic' }) as never);
    expect(complete).toMatchObject({ canUseClinicalTools: true, role: 'nurse', clinicalRole: 'nurse', organizationId: 'clinic' });
  });
  it('drops late profile results after a UID change', async () => {
    let resolveFirst: (value: unknown) => void = () => {};
    mocks.getDoc.mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }));
    const callback = vi.fn(); const changing = vi.fn();
    const unsubscribe = onAuthChange(callback, changing);
    mocks.observer?.(user('A'));
    await vi.waitFor(() => expect(mocks.getDoc).toHaveBeenCalledTimes(1));
    mocks.observer?.(null);
    expect(mocks.bind).toHaveBeenLastCalledWith(null);
    resolveFirst({ exists: () => true, data: () => ({ name: 'A' }) });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(callback.mock.calls).toEqual([[null]]);
    expect(changing).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
  it('invalidates patient state when a refreshed token loses authority', async () => {
    const callback = vi.fn(); const unsubscribe = onAuthChange(callback);
    mocks.observer?.(user('A', { verifiedClinician: true, clinicalRole: 'doctor', organizationId: 'clinic' }));
    await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    mocks.observer?.(user('A'));
    await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(2));
    expect(mocks.reset).toHaveBeenCalled();
    expect(callback.mock.calls[1]?.[0].canUseClinicalTools).toBe(false);
    unsubscribe();
  });
});
