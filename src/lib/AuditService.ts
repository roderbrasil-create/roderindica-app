import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from './firebase';

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ADD_PRODUCT = 'ADD_PRODUCT',
  UPDATE_PRODUCT = 'UPDATE_PRODUCT',
  DELETE_PRODUCT = 'DELETE_PRODUCT',
  RESTORE_PRODUCT = 'RESTORE_PRODUCT',
  UPDATE_USER = 'UPDATE_USER',
  SYNC_PWA = 'SYNC_PWA',
  CLEAR_CACHE = 'CLEAR_CACHE',
  ENCRYPTION_KEY_CHANGE = 'ENCRYPTION_KEY_CHANGE'
}

export interface AuditLogEntry {
  id?: string;
  action: AuditAction;
  details: string;
  user_uid: string;
  user_email: string;
  user_name: string;
  timestamp: any;
  metadata?: any;
}

export class AuditService {
  static async log(action: AuditAction, details: string, metadata: any = {}) {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await addDoc(collection(db, 'audit_logs'), {
        action,
        details,
        user_uid: user.uid,
        user_email: user.email,
        user_name: user.displayName || '',
        timestamp: serverTimestamp(),
        metadata
      });
    } catch (e) {
      console.error('Failed to log audit event', e);
    }
  }

  static getRecentLogs(callback: (logs: AuditLogEntry[]) => void, logLimit = 50) {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(logLimit));
    return onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<AuditLogEntry, 'id'>)
      }));
      callback(logs);
    });
  }
}
