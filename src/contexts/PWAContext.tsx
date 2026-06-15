import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { db } from '../lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';

interface PWAContextType {
  isOffline: boolean;
  canInstall: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  pendingSyncCount: number;
  installApp: () => void;
  syncDataLocally: (isSilent?: boolean) => Promise<void>;
  processSyncQueue: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const updatePendingCount = useCallback(async () => {
    const { getSyncQueue } = await import('../lib/pwaUtils');
    const queue = await getSyncQueue();
    setPendingSyncCount(queue.filter(i => i.status !== 'completed').length);
  }, []);

  const processSyncQueue = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;
    
    const { getSyncQueue, updateSyncItem, removeSyncItem } = await import('../lib/pwaUtils');
    const { processSyncItem } = await import('../lib/syncExecutors');
    
    const queue = await getSyncQueue();
    const pending = queue.filter(item => item.status !== 'completed' && item.status !== 'syncing');
    
    if (pending.length === 0) {
      setPendingSyncCount(0);
      return;
    }

    setIsSyncing(true);
    let successCount = 0;

    for (const item of pending) {
      try {
        item.status = 'syncing';
        await updateSyncItem(item);
        
        const success = await processSyncItem(item);
        
        if (success) {
          await removeSyncItem(item.id);
          successCount++;
        } else {
          item.status = 'failed';
          item.retryCount += 1;
          item.error = 'Failed to process item';
          await updateSyncItem(item);
        }
      } catch (error) {
        console.error('Error during individual item sync:', error);
        item.status = 'failed';
        await updateSyncItem(item);
      }
      await updatePendingCount();
    }

    if (successCount > 0) {
      toast.success(`${successCount} itens sincronizados com sucesso!`);
    }

    setIsSyncing(false);
  }, [isSyncing, updatePendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast.success('Conexão restaurada!', {
        description: 'Sincronizando dados pendentes...',
        icon: '🌐'
      });
      processSyncQueue();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      toast.warning('Você está offline', {
        description: 'Dados serão salvos localmente e sincronizados depois.',
        duration: 5000,
        icon: '📴'
      });
    };

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setCanInstall(false);
      setDeferredPrompt(null);
      toast.success('Aplicativo instalado com sucesso!', {
        description: 'Agora você pode acessar a RODER Brasil diretamente da sua tela inicial.'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Initial check
    updatePendingCount();
    if (navigator.onLine) {
      processSyncQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [processSyncQueue, updatePendingCount]);

  const installApp = useCallback(() => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  }, [deferredPrompt]);

  const syncDataLocally = useCallback(async (isSilent = false) => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    setDownloadProgress(5);
    
    const isFirstTime = !localStorage.getItem('roder_last_offline_sync_time');
    
    let toastId: any;
    if (!isSilent) {
      if (isFirstTime) {
        toastId = toast.loading('Instalando conteúdo...', {
          description: 'Baixando todos os catálogos e dados para uso off-line no celular...'
        });
      } else {
        toastId = toast.loading('Sincronizando banco de dados...', {
          description: 'Buscando atualizações e novidades do estoque.'
        });
      }
    }

    try {
      // List of important collections to pre-cache
      const collectionsToSync = [
        { name: 'products', label: 'Catálogo' },
        { name: 'registered_products', label: 'Produtos' },
        { name: 'stock_items', label: 'Estoque' },
        { name: 'indications', label: 'Indicações' },
        { name: 'users', label: 'Usuários' }
      ];

      for (let i = 0; i < collectionsToSync.length; i++) {
        const col = collectionsToSync[i];
        // Fetching will automatically populate Firestore persistence cache
        await getDocs(query(collection(db, col.name), limit(500)));
        const progress = Math.round(((i + 1) / collectionsToSync.length) * 100);
        setDownloadProgress(progress);
      }

      // Store sync timestamp
      localStorage.setItem('roder_last_offline_sync_time', Date.now().toString());

      if (!isSilent) {
        toast.success(isFirstTime ? 'Conteúdo offline instalado!' : 'Sincronização concluída!', {
          id: toastId,
          description: 'Todos os catálogos, novidades e estoque estão salvos localmente.'
        });
      }
    } catch (error: any) {
      console.error('Download error:', error);
      
      const isQuotaExceeded = 
        error?.code === 'resource-exhausted' || 
        error?.message?.toLowerCase().includes('quota') || 
        String(error).toLowerCase().includes('quota') ||
        error?.message?.toLowerCase().includes('limit exceeded') ||
        String(error).toLowerCase().includes('limit exceeded');

      // Set last sync timestamp anyway to stop infinite automatic retry loops on subsequent mounts
      localStorage.setItem('roder_last_offline_sync_time', Date.now().toString());

      if (!isSilent) {
        if (isQuotaExceeded) {
          // Only show once per session to avoid annoying the user
          if (!sessionStorage.getItem('roder_quota_error_notified')) {
            sessionStorage.setItem('roder_quota_error_notified', 'true');
            toast.warning('Limite de sincronização atingido', {
              id: toastId,
              description: 'A cota diária gratuita de leitura do banco de dados (Firebase) foi excedida hoje. O aplicativo continuará funcionando normalmente com seus dados que já estão salvos localmente.'
            });
          } else if (toastId) {
            toast.dismiss(toastId);
          }
        } else {
          // Only show standard download errors once per session as well
          if (!sessionStorage.getItem('roder_download_error_notified')) {
            sessionStorage.setItem('roder_download_error_notified', 'true');
            toast.error('Erro ao baixar dados', {
              id: toastId,
              description: 'Tente novamente quando tiver uma conexão melhor.'
            });
          } else if (toastId) {
            toast.dismiss(toastId);
          }
        }
      }
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  }, [isDownloading]);

  // Automated first-time background downloader and periodic session delta synchronizer
  useEffect(() => {
    if (isOffline) return;

    // Do not sync background offline cache for public evaluation and public stock routes
    if (
      window.location.pathname.includes('/satisfacao') ||
      window.location.pathname.includes('/estoque-publico') ||
      window.location.pathname.includes('/stock_holder')
    ) {
      return;
    }

    // Use a session storage key to guarantee this check only runs ONCE per session lifetime
    if (sessionStorage.getItem('roder_pwa_launch_sync_attempted')) {
      return;
    }
    sessionStorage.setItem('roder_pwa_launch_sync_attempted', 'true');

    const lastSync = localStorage.getItem('roder_last_offline_sync_time');
    const now = Date.now();
    let timerId: any;

    if (!lastSync) {
      console.log('[PWA] Launching automatic first-time offline database sync...');
      timerId = setTimeout(() => {
        syncDataLocally(false);
      }, 3000);
    } else {
      const elapsedSinceLastSync = now - parseInt(lastSync, 10);
      if (elapsedSinceLastSync > 1000 * 60 * 60 * 4) {
        console.log('[PWA] Syncing updates silently in background (elapsed time since last sync exceeded 4h)...');
        timerId = setTimeout(() => {
          syncDataLocally(true);
        }, 4500);
      }
    }

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [isOffline]);

  return (
    <PWAContext.Provider value={{
      isOffline,
      canInstall,
      isDownloading,
      downloadProgress,
      pendingSyncCount,
      installApp,
      syncDataLocally,
      processSyncQueue
    }}>
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}
