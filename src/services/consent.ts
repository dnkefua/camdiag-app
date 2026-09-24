import { clinicalRequest } from './medgemma';
import { getSensitiveSessionSignal } from './session';
import { CONSENT_VERSION, CLINICAL_SCHEMA_VERSION, type ConsentRecord, type AccountExportPage } from '../../functions/src/contracts/clinical';

export { CONSENT_VERSION };
export const CONSENT_CHANGED_EVENT = 'camdiag:clinical-consent-changed';
const validateConsent = (data: { consent: ConsentRecord | null }): ConsentRecord | null => {
  if (data?.consent === null) return null;
  const record = data?.consent;
  if (!record || typeof record.version !== 'string' || typeof record.clinicalProcessing !== 'boolean' || typeof record.optionalAnalytics !== 'boolean' || typeof record.acceptedAt !== 'string' || (record.withdrawnAt !== undefined && typeof record.withdrawnAt !== 'string')) throw new Error('The consent service returned an invalid response. Please retry.');
  return record;
};
export const getClinicalConsent = async () => validateConsent(await clinicalRequest<{ consent: ConsentRecord | null }>('consent'));
export const saveClinicalConsent = async (clinicalProcessing: boolean, optionalAnalytics: boolean) => {
  const consent = validateConsent(await clinicalRequest<{ consent: ConsentRecord | null }>('consent', { version: CONSENT_VERSION, clinicalProcessing, optionalAnalytics }));
  if (!consent || consent.version !== CONSENT_VERSION || consent.clinicalProcessing !== clinicalProcessing || consent.optionalAnalytics !== optionalAnalytics) throw new Error('Consent was not saved. Please retry.');
  window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
  return consent;
};
const validateExportPage = (data: AccountExportPage, expectedCollection: string): AccountExportPage => {
  if (!data || data.schemaVersion !== CLINICAL_SCHEMA_VERSION || data.collection !== expectedCollection || typeof data.exportedAt !== 'string' || typeof data.scopeNotice !== 'string'
    || !Array.isArray(data.availableCollections) || !data.availableCollections.includes('profile')
    || data.availableCollections.some((name) => typeof name !== 'string' || !/^[a-z][a-z0-9_]{0,63}$/.test(name))
    || new Set(data.availableCollections).size !== data.availableCollections.length
    || !data.records || !Array.isArray(data.records.items) || data.records.items.some((record) => !record || typeof record !== 'object' || Array.isArray(record))
    || !(data.records.nextCursor === null || (typeof data.records.nextCursor === 'string' && data.records.nextCursor.length > 0))) throw new Error('Account export was incomplete. Please retry.');
  return data;
};
/** Fetch all account collections/pages before downloading; never return a partial estate. */
export const exportAccountData = async () => {
  const session = getSensitiveSessionSignal();
  const load = async (collection: string, cursor: string | null): Promise<AccountExportPage> => {
    session.throwIfAborted();
    const page = await clinicalRequest<AccountExportPage>(`account/export?collection=${encodeURIComponent(collection)}&limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
    session.throwIfAborted();
    return validateExportPage(page, collection);
  };
  const first = await load('profile', null);
  const collections: Record<string, Array<Record<string, unknown>>> = Object.create(null) as Record<string, Array<Record<string, unknown>>>;
  for (const collection of first.availableCollections) {
    const records: Array<Record<string, unknown>> = [];
    const seen = new Set<string>();
    let cursor: string | null = null;
    do {
      const page: AccountExportPage = collection === 'profile' && cursor === null ? first : await load(collection, cursor);
      if (page.availableCollections.length !== first.availableCollections.length || page.availableCollections.some((name: string) => !first.availableCollections.includes(name))) throw new Error('Account export scope changed. Please retry.');
      records.push(...page.records.items);
      cursor = page.records.nextCursor;
      if (cursor && seen.has(cursor)) throw new Error('Account export could not finish. Please retry.');
      if (cursor) seen.add(cursor);
    } while (cursor);
    collections[collection] = records;
  }
  session.throwIfAborted();
  return { schemaVersion: first.schemaVersion, exportedAt: first.exportedAt, completedAt: new Date().toISOString(), scopeNotice: first.scopeNotice, collections };
};
export const requestAccountDeletion = async () => {
  const result = await clinicalRequest<{ id: string; status: 'pending_human_review' }>('account/deletion-requests', {});
  if (typeof result?.id !== 'string' || result.status !== 'pending_human_review') throw new Error('The deletion request was not confirmed. Please retry.');
  return result;
};
