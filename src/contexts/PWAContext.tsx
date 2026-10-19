import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, query, limit, where } from 'firebase/firestore';

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

      let produtos: any[] = [];
      for (let i = 0; i < collectionsToSync.length; i++) {
        const col = collectionsToSync[i];
        // Fetching will automatically populate Firestore persistence cache
        // cada coleção por conta própria: uma que o perfil não pode ler (ex.: usuários, para o
        // parceiro) não pode derrubar o download do catálogo inteiro
        try {
          let snap;
          try {
            snap = await getDocs(query(collection(db, col.name), limit(500)));
          } catch (e) {
            // O parceiro não pode mais baixar 500 indicações quaisquer (vinham as de OUTROS
            // parceiros para o celular dele). A regra recusa; baixa só as dele.
            const uid = auth.currentUser?.uid;
            if (col.name !== 'indications' || !uid) throw e;
            snap = await getDocs(query(collection(db, col.name), where('external_seller_uid', '==', uid), limit(500)));
          }
          if (col.name === 'products') produtos = snap.docs.map(d => d.data());
        } catch (e) {
          console.warn(`[OFFLINE] ${col.name} não baixado:`, e);
        }
        const progress = Math.round(((i + 1) / collectionsToSync.length) * 30);
        setDownloadProgress(progress);
      }

      // Fotos e fichas do catálogo também ficam no celular, para mostrar ao cliente sem internet.
      // As fotos passam pelo /roder-sw.js (que guarda tudo o que é baixado); as fichas pelo leitor.
      const valido = (u: any) => typeof u === 'string' && u && !u.startsWith('db-file://') && !/\.run\.app\//.test(u);
      const fotos = new Set<string>();
      const fichas = new Set<string>();
      produtos.filter(p => !p.is_blocked).forEach(p => {
        if (valido(p.image_url)) fotos.add(p.image_url);
        if (valido(p.pdf_url)) fichas.add(p.pdf_url);
        (p.models || []).forEach((m: any) => {
          (m.images || []).forEach((im: string) => valido(im) && fotos.add(im));
          if (valido(m.pdf_url)) fichas.add(m.pdf_url);
        });
      });
      const tarefas: (() => Promise<any>)[] = [
        // Grava direto na mesma gaveta que o /roder-sw.js lê ("roder-fotos"). Foto de outro site
        // vem pelo nosso servidor: baixada direto ela chega "opaca", e o Chrome conta cada uma
        // como 7 MB, estourando o espaço do celular com poucas dezenas de fotos.
        ...Array.from(fotos).map(u => async () => {
          try {
            if (typeof caches === 'undefined') return;
            const chave = new URL(u, location.origin).href;
            const c = await caches.open('roder-fotos');
            if (await c.match(chave, { ignoreVary: true })) return;
            const mesma = chave.startsWith(location.origin);
            const r = await fetch(mesma ? chave : `/api/documento?url=${encodeURIComponent(chave)}`);
            if (r.ok && (r.headers.get('content-type') || '').startsWith('image/')) await c.put(chave, r);
          } catch { /* sem espaço ou sem internet: segue */ }
        }),
        ...Array.from(fichas).map(u => async () => {
          const { guardarDocumentoOffline } = await import('../components/documento/LeitorDocumento');
          return guardarDocumentoOffline(u);
        }),
      ];
      let feitas = 0;
      const total = tarefas.length || 1;
      const trabalhador = async () => {
        while (tarefas.length) {
          const t = tarefas.shift()!;
          await t();
          feitas++;
          setDownloadProgress(30 + Math.round((feitas / total) * 70));
          if (toastId && feitas % 10 === 0) toast.loading('Baixando fotos e fichas...', { id: toastId, description: `${feitas} de ${total}` });
        }
      };
      await Promise.all([trabalhador(), trabalhador(), trabalhador(), trabalhador()]);

      // Store sync timestamp
      localStorage.setItem('roder_last_offline_sync_time', Date.now().toString());

      if (!isSilent) {
        toast.success(isFirstTime ? 'Conteúdo offline instalado!' : 'Sincronização concluída!', {
          id: toastId,
          description: 'Catálogo com fotos e fichas, estoque e indicações salvos no celular para usar sem internet.'
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
          // Quietly dismiss download toast and log standard errors to console
          if (toastId) {
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

    // Do not sync background offline cache for public evaluation, public stock, public budget request, and quick register routes
    if (
      window.location.pathname.includes('/satisfacao') ||
      window.location.pathname.includes('/estoque-publico') ||
      window.location.pathname.includes('/stock_holder') ||
      window.location.pathname.includes('/pedido-orcamento') ||
      window.location.pathname.includes('/cadastro-rapido') ||
      window.location.pathname.includes('/f') ||
      window.location.pathname.includes('/expo') ||
      window.location.pathname.startsWith('/o/') ||
      window.location.pathname.startsWith('/consultor')
    ) {
      // páginas que o CLIENTE abre (link do WhatsApp): nada de baixar catálogo no celular dele
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
        // o link curto (/o/...) vira /pedido-orcamento nesse meio tempo: confere de novo
        if (/^\/(o\/|pedido-orcamento)/.test(window.location.pathname)) return;
        syncDataLocally(false);
      }, 3000);
    } else {
      const elapsedSinceLastSync = now - parseInt(lastSync, 10);
      if (elapsedSinceLastSync > 1000 * 60 * 60 * 4) {
        console.log('[PWA] Syncing updates silently in background (elapsed time since last sync exceeded 4h)...');
        timerId = setTimeout(() => {
          if (/^\/(o\/|pedido-orcamento)/.test(window.location.pathname)) return;
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
