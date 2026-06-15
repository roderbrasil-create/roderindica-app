import { db, storage, auth } from './firebase';
import { collection, addDoc, updateDoc, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { SyncItem, getMediaLocally, removeMediaLocally } from './pwaUtils';
import { toast } from 'sonner';

export async function processSyncItem(item: SyncItem): Promise<boolean> {
  try {
    switch (item.type) {
      case 'indication':
        return await syncIndication(item);
      case 'product':
        return await syncProduct(item);
      case 'profile_image':
        return await syncProfileImage(item);
      case 'stock_update':
        return await syncStockUpdate(item);
      default:
        console.warn('Unknown sync item type:', item.type);
        return true; // Mark as completed if unknown type to avoid loops
    }
  } catch (error) {
    console.error(`Error processing sync item ${item.id}:`, error);
    return false;
  }
}

async function syncIndication(item: SyncItem) {
  const { data, mediaIds } = item.data;
  
  // 1. Upload media first if any
  const uploadedMediaUrls: string[] = [];
  if (mediaIds && mediaIds.length > 0) {
    for (const mediaId of mediaIds) {
      const media = await getMediaLocally(mediaId);
      if (media) {
        const storageRef = ref(storage, `indications/${item.id}/${media.fileName}`);
        await uploadBytes(storageRef, media.blob);
        const url = await getDownloadURL(storageRef);
        uploadedMediaUrls.push(url);
        await removeMediaLocally(mediaId);
      }
    }
  }

  // 2. Adjust indication data with real URLs
  const finalIndication = {
    ...data,
    media: uploadedMediaUrls,
    synced: true,
    synced_at: new Date().toISOString()
  };

  // 3. Save to Firestore
  // If item.id was used as document ID, we use setDoc
  await setDoc(doc(db, 'indications', item.id), finalIndication);
  return true;
}

async function syncProduct(item: SyncItem) {
  const { formData, mediaId } = item.data;
  
  let imageUrl = formData.image_url;
  if (mediaId) {
    const media = await getMediaLocally(mediaId);
    if (media) {
      const storageRef = ref(storage, `products/${Date.now()}_${media.fileName}`);
      await uploadBytes(storageRef, media.blob);
      imageUrl = await getDownloadURL(storageRef);
      await removeMediaLocally(mediaId);
    }
  }

  const finalData = {
    ...formData,
    image_url: imageUrl,
    synced: true,
    updated_at: new Date().toISOString()
  };

  if (item.data.id) {
    await updateDoc(doc(db, 'registered_products', item.data.id), finalData);
  } else {
    await addDoc(collection(db, 'registered_products'), {
      ...finalData,
      created_at: new Date().toISOString()
    });
  }
  return true;
}

async function syncProfileImage(item: SyncItem) {
  const { userId, mediaId } = item.data;
  const media = await getMediaLocally(mediaId);
  
  if (media) {
    const storageRef = ref(storage, `profiles/${userId}`);
    await uploadBytes(storageRef, media.blob);
    const photoURL = await getDownloadURL(storageRef);
    
    // Update profile in users collection
    await updateDoc(doc(db, 'users', userId), { photoURL });
    await removeMediaLocally(mediaId);
  }
  return true;
}

async function syncStockUpdate(item: SyncItem) {
  const { code, quantity, description, source } = item.data;
  
  // Try to find if it exists
  const { getDocs, query, where } = await import('firebase/firestore');
  const q = query(collection(db, 'stock_items'), where('code', '==', code));
  const snap = await getDocs(q);
  
  if (!snap.empty) {
    await updateDoc(doc(db, 'stock_items', snap.docs[0].id), {
      quantity,
      updated_at: new Date().toISOString()
    });
  } else {
    await addDoc(collection(db, 'stock_items'), {
      code,
      description,
      quantity,
      source: source || 'roder',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  return true;
}
