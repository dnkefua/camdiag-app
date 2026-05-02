import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { v4 as uuid } from 'uuid';

let firestore: Firestore | null = null;

const getDb = (): Firestore => {
  firestore ??= getFirestore();
  return firestore;
};

export interface AuditEntry {
  uid: string;
  action: 'analyze' | 'search_drug' | 'check_interactions';
  request: unknown;
  responsePreview: string;
  success: boolean;
  error?: string;
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await getDb().collection('audit_logs').add({
      ...entry,
      id: uuid(),
      timestamp: Timestamp.now(),
    });
  } catch {
    // Fire-and-forget: audit log failure must not block the response
  }
}
