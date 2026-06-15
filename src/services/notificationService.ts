import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface CreateNotificationParams {
  user_uid: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      user_uid: params.user_uid,
      title: params.title,
      message: params.message,
      type: params.type || 'info',
      link: params.link || null,
      read: false,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const notifyManagers = async (title: string, message: string, link?: string, type: NotificationType = 'info') => {
  try {
    const q = query(
      collection(db, 'users'), 
      where('profile', 'in', ['admin', 'manager', 'triagem'])
    );
    const snapshot = await getDocs(q);
    
    const promises = snapshot.docs.map(doc => 
      createNotification({
        user_uid: doc.id,
        title,
        message,
        link,
        type
      })
    );
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error notifying managers:', error);
  }
};

export const notifyInternalSeller = async (sellerUid: string, title: string, message: string, link?: string) => {
  await createNotification({
    user_uid: sellerUid,
    title,
    message,
    link,
    type: 'info'
  });
};

export const notifyExternalSeller = async (sellerUid: string, title: string, message: string, link?: string) => {
  await createNotification({
    user_uid: sellerUid,
    title,
    message,
    link,
    type: 'success'
  });
};
