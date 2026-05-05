import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

let testEnv: RulesTestEnvironment;

const ownerUid = 'owner-user';
const otherUid = 'other-user';

const authedDb = (uid: string) => testEnv.authenticatedContext(uid).firestore();
const anonDb = () => testEnv.unauthenticatedContext().firestore();

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'camdiag-rules-test',
    firestore: {
      rules: readFileSync(resolve('firestore.rules'), 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

const seedDoc = async (path: string, data: Record<string, unknown>) => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
};

describe('Firestore security rules', () => {
  it('allows users to read and write only their own profile', async () => {
    await assertSucceeds(setDoc(doc(authedDb(ownerUid), `users/${ownerUid}`), { name: 'Owner' }));
    await assertSucceeds(getDoc(doc(authedDb(ownerUid), `users/${ownerUid}`)));

    await seedDoc(`users/${otherUid}`, { name: 'Other' });
    await assertFails(getDoc(doc(authedDb(ownerUid), `users/${otherUid}`)));
    await assertFails(setDoc(doc(anonDb(), `users/${ownerUid}`), { name: 'Anon' }));
  });

  it('enforces patient record ownership on create, read, update, and delete', async () => {
    const ownerPatient = doc(authedDb(ownerUid), 'patients/patient-1');
    await assertSucceeds(setDoc(ownerPatient, { userId: ownerUid, diagnosis: 'review', createdAt: 1 }));
    await assertSucceeds(getDoc(ownerPatient));

    await assertFails(setDoc(doc(authedDb(ownerUid), 'patients/bad-owner'), { userId: otherUid }));
    await assertFails(getDoc(doc(authedDb(otherUid), 'patients/patient-1')));
    await assertFails(updateDoc(ownerPatient, { userId: otherUid }));
    await assertSucceeds(updateDoc(ownerPatient, { status: 'reviewed' }));
    await assertFails(deleteDoc(doc(authedDb(otherUid), 'patients/patient-1')));
    await assertSucceeds(deleteDoc(ownerPatient));
  });

  it('enforces scan ownership on create, read, update, and delete', async () => {
    const ownerScan = doc(authedDb(ownerUid), 'scans/scan-1');
    await assertSucceeds(setDoc(ownerScan, { userId: ownerUid, title: 'Lab result', createdAt: 1 }));
    await assertSucceeds(getDoc(ownerScan));

    await assertFails(setDoc(doc(authedDb(ownerUid), 'scans/bad-owner'), { userId: otherUid }));
    await assertFails(getDoc(doc(authedDb(otherUid), 'scans/scan-1')));
    await assertFails(updateDoc(ownerScan, { userId: otherUid }));
    await assertSucceeds(updateDoc(ownerScan, { title: 'Reviewed lab result' }));
    await assertFails(deleteDoc(doc(authedDb(otherUid), 'scans/scan-1')));
  });

  it('allows authenticated reads but blocks client writes for reference collections', async () => {
    await seedDoc('drugs/drug-1', { name: 'Paracetamol' });
    await seedDoc('facilities/facility-1', { name: 'Clinic' });
    await seedDoc('blog/blog-1', { title: 'Health update' });

    await assertSucceeds(getDoc(doc(authedDb(ownerUid), 'drugs/drug-1')));
    await assertSucceeds(getDocs(collection(authedDb(ownerUid), 'facilities')));
    await assertSucceeds(getDoc(doc(authedDb(ownerUid), 'blog/blog-1')));

    await assertFails(getDoc(doc(anonDb(), 'drugs/drug-1')));
    await assertFails(setDoc(doc(authedDb(ownerUid), 'drugs/new'), { name: 'Client write' }));
    await assertFails(setDoc(doc(authedDb(ownerUid), 'facilities/new'), { name: 'Client write' }));
    await assertFails(setDoc(doc(authedDb(ownerUid), 'blog/new'), { title: 'Client write' }));
  });

  it('blocks all client access to backend-only collections', async () => {
    await seedDoc('audit_logs/log-1', { uid: ownerUid });
    await seedDoc('rate_limits/limit-1', { uid: ownerUid });

    await assertFails(getDoc(doc(authedDb(ownerUid), 'audit_logs/log-1')));
    await assertFails(setDoc(doc(authedDb(ownerUid), 'audit_logs/new'), { uid: ownerUid }));
    await assertFails(getDoc(doc(authedDb(ownerUid), 'rate_limits/limit-1')));
    await assertFails(setDoc(doc(authedDb(ownerUid), 'rate_limits/new'), { uid: ownerUid }));
  });

  it('keeps unauthenticated users out of private collections', async () => {
    await seedDoc('patients/private-patient', { userId: ownerUid });
    await seedDoc('scans/private-scan', { userId: ownerUid });

    await assertFails(getDoc(doc(anonDb(), 'patients/private-patient')));
    await assertFails(getDoc(doc(anonDb(), 'scans/private-scan')));
    await assertFails(setDoc(doc(anonDb(), 'patients/new'), { userId: ownerUid }));
    await assertFails(setDoc(doc(anonDb(), 'scans/new'), { userId: ownerUid }));

    expect(true).toBe(true);
  });
});
