// Administrative utility. Dry-run by default; never approves a clinician automatically.
import { createRequire } from 'node:module';
const options = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...value] = arg.replace(/^--/, '').split('='); return [key, value.join('=') || true];
}));
const { project, uid, action, organization, role, approver, reference } = options;
const validId = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
if (!validId(project) || !validId(uid) || !['grant', 'revoke'].includes(action)
  || typeof approver !== 'string' || typeof reference !== 'string'
  || (action === 'grant' && (!validId(organization) || organization.length > 80 || !['doctor', 'nurse'].includes(role)))) {
  console.error('Usage: node tools/clinical-access.mjs --project=PROJECT --uid=UID --action=grant|revoke --organization=ORG --role=doctor|nurse --approver=APPROVED_ACTOR --reference=APPROVAL_RECORD [--apply]');
  process.exit(2);
}
if (!options.apply) {
  console.info(JSON.stringify({ dryRun: true, project, uid, action, organization, role, approver, reference, next: 'Verify credentials and approval record, then rerun with --apply using authorized administrative credentials.' }));
  process.exit(0);
}
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
initializeApp({ credential: applicationDefault(), projectId: project });
try {
  const auth = getAuth();
  const db = getFirestore();
  const user = await auth.getUser(uid);
  if (user.disabled && action === 'grant') throw new Error('DISABLED_ACCOUNT');
  const membership = db.collection('clinical_memberships').doc(uid);
  // Deny first: a partial failure can never leave stale direct-storage access active.
  await membership.set({ active: false, updatedAt: FieldValue.serverTimestamp(), approvedBy: approver, approvalReference: reference }, { merge: true });
  const claims = { ...user.customClaims };
  delete claims.verifiedClinician; delete claims.clinicalRole; delete claims.organizationId;
  if (action === 'grant') Object.assign(claims, { verifiedClinician: true, clinicalRole: role, organizationId: organization });
  await auth.setCustomUserClaims(uid, claims);
  await auth.revokeRefreshTokens(uid);
  if (action === 'grant') await membership.set({ active: true, organizationId: organization, clinicalRole: role, updatedAt: FieldValue.serverTimestamp(), approvedBy: approver, approvalReference: reference }, { merge: true });
  await db.collection('administrative_audit').add({ event: `clinical_access_${action}`, uid, approvedBy: approver, approvalReference: reference, at: FieldValue.serverTimestamp() });
  console.info('Access updated. The user must sign in again.');
} catch {
  console.error('Access update did not complete. Inspect the membership state and administrative audit with authorized tooling; no automatic retry was attempted.');
  process.exitCode = 1;
}
