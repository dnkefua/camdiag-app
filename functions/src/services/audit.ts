import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { v4 as uuid } from 'uuid';

const db = getFirestore();

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
    await db.collection('audit_logs').add({
      ...entry,
      id: uuid(),
      timestamp: Timestamp.now(),
    });
  } catch {
    // Fire-and-forget: audit log failure must not block the response
  }
}
