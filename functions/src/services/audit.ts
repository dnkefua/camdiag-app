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
  action: 'analyze' | 'transcribe' | 'search_drug' | 'check_interactions';
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
      ...entry,
      id: uuid(),
      timestamp: Timestamp.now(),
      expiresAt,
    });
  } catch {
    // Fire-and-forget: audit log failure must not block the response
  }
}
