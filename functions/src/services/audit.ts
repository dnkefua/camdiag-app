import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { v4 as uuid } from 'uuid';
import { AUDIT_LOG_RETENTION_DAYS } from '../config.js';

let firestore: Firestore | null = null;

const getDb = (): Firestore => {
  firestore ??= getFirestore();
  return firestore;
};

export interface AuditEntry {
  uid: string;
  action: 'analyze' | 'transcribe' | 'search_drug' | 'check_interactions' | 'clinical_transition' | 'consent' | 'export' | 'deletion_request';
  request: unknown;
  responsePreview: string;
  success: boolean;
  error?: string;
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    const retentionDays = Math.max(1, Math.min(365, Number(AUDIT_LOG_RETENTION_DAYS.value()) || 90));
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + retentionDays * 86_400_000));
    await getDb().collection('audit_logs').add({
      uid: entry.uid,
      action: entry.action,
      // Never persist caller payloads, clinical excerpts, or provider errors.
      success: entry.success,
      reason: entry.success ? 'completed' : 'operation_failed',
      id: uuid(),
      timestamp: Timestamp.now(),
      expiresAt,
    });
  } catch {
    console.error(JSON.stringify({ event: 'audit_write_failed', action: entry.action }));
  }
}
