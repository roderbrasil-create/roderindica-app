import { openDB, IDBPDatabase } from 'idb';

const ENCRYPTION_KEY_NAME = 'roder-master-key';

export class CryptoService {
  private static async getMasterKey(): Promise<CryptoKey> {
    let keyData = localStorage.getItem(ENCRYPTION_KEY_NAME);
    
    if (!keyData) {
      // For demo/prototype, we generate a persistent key. 
      // In production, this would be derived from a master password or vault.
      const newKey = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      const exported = await window.crypto.subtle.exportKey('jwk', newKey);
      localStorage.setItem(ENCRYPTION_KEY_NAME, JSON.stringify(exported));
      return newKey;
    }

    return await window.crypto.subtle.importKey(
      'jwk',
      JSON.parse(keyData),
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  static async encrypt(data: any): Promise<string> {
    try {
      const key = await this.getMasterKey();
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(JSON.stringify(data));
      
      const ciphertext = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
      );

      const combined = new Uint8Array(iv.length + ciphertext.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(ciphertext), iv.length);
      
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      return JSON.stringify(data); // Fallback to plain if fails
    }
  }

  static async decrypt(encryptedData: string): Promise<any> {
    try {
      if (!encryptedData || encryptedData.startsWith('{')) return JSON.parse(encryptedData);
      
      const key = await this.getMasterKey();
      const combined = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map(c => c.charCodeAt(0))
      );
      
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);
      
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );
      
      return JSON.parse(new TextDecoder().decode(decrypted));
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }
}
