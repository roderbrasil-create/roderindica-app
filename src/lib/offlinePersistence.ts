/**
 * Persistence utility to handle offline states and data recovery
 */

const DRAFT_KEY = 'roder_indication_draft';
const QUEUE_KEY = 'roder_sync_queue';

export interface SyncItem {
  id: string;
  type: 'indication';
  data: any;
  timestamp: number;
}

export function saveDraft(data: any) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error('Error saving draft:', e);
  }
}

export function getDraft() {
  try {
    const draft = localStorage.getItem(DRAFT_KEY);
    return draft ? JSON.parse(draft) : null;
  } catch (e) {
    return null;
  }
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export function addToSyncQueue(data: any) {
  try {
    const queueJson = localStorage.getItem(QUEUE_KEY);
    const queue: SyncItem[] = queueJson ? JSON.parse(queueJson) : [];
    
    const newItem: SyncItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'indication',
      data,
      timestamp: Date.now()
    };
    
    queue.push(newItem);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return newItem.id;
  } catch (e) {
    console.error('Error adding to sync queue:', e);
    return null;
  }
}

export function getSyncQueue(): SyncItem[] {
  try {
    const queueJson = localStorage.getItem(QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (e) {
    return [];
  }
}

export function removeFromSyncQueue(id: string) {
  try {
    const queueJson = localStorage.getItem(QUEUE_KEY);
    if (!queueJson) return;
    
    const queue: SyncItem[] = JSON.parse(queueJson);
    const filtered = queue.filter(item => item.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error removing from sync queue:', e);
  }
}

export function isOnline() {
  return navigator.onLine;
}
