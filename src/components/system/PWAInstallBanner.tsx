import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { usePWA } from '../../contexts/PWAContext';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function PWAInstallBanner() {
  const { canInstall, installApp, syncDataLocally } = usePWA();
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    
    if (isStandalone) {
      setShowInstallBanner(false);
      // Even if already installed, if we haven't synced this session, let's do it
      if (!sessionStorage.getItem('roder_pwa_init_sync')) {
        sessionStorage.setItem('roder_pwa_init_sync', 'true');
        syncDataLocally(true);
      }
      return;
    }

    // Check if it was already dismissed in this session
    if (sessionStorage.getItem('roder_install_dismissed')) {
      setDismissed(true);
      return;
    }

    // For better UX, check if standard canInstall is true OR if the customer is on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (canInstall || isIOS) {
      const timer = setTimeout(() => setShowInstallBanner(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [canInstall, dismissed]);

  const handleInstallClick = async () => {
    // Start background sync immediately
    syncDataLocally();
    
    if (canInstall) {
      // Direct install via browser API
      installApp();
      setShowInstallBanner(false);
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        toast.info('Instruções para iPhone/iPad:', {
          description: 'Toque no ícone de "Compartilhar" (quadrado com seta para cima no Safari) e escolha "Adicionar à Tela de Início".',
          duration: 15000,
          action: {
            label: 'Entendi',
            onClick: () => {}
          }
        });
      } else {
        toast.info('Instalação Disponível:', {
          description: 'Clique no ícone de instalação (⊕) no canto superior direito ou menu do seu celular.',
          duration: 10000
        });
      }
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    setDismissed(true);
    // Also save in session storage to not show again in this session
    sessionStorage.setItem('roder_install_dismissed', 'true');
  };

  useEffect(() => {
    if (sessionStorage.getItem('roder_install_dismissed')) {
      setDismissed(true);
    }
  }, []);

  const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  return (
    <AnimatePresence>
      {showInstallBanner && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-80 bg-slate-900 text-white p-5 rounded-xl shadow-2xl border-l-4 border-orange-500 z-[100] overflow-hidden"
        >
          {/* Decorative background element */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
          
          <div className="flex items-start gap-4 relative z-10">
            <div className="p-2.5 bg-orange-500 rounded-lg shadow-lg shadow-orange-500/20 shrink-0 animate-pulse">
              <Download className="w-5 h-5 text-white" />
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-400">RODER Brasil PWA</h4>
                <button onClick={handleDismiss} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-[11px] font-medium text-slate-300 mt-1 leading-relaxed">
                {isIOSDevice 
                  ? "Instale no seu iPhone para abrir em tela cheia e usar offline em campo com catálogos carregados."
                  : "Instale o app para salvar na home, abrir em tela cheia e baixar toda a base de produtos offline."}
              </p>
              
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={handleInstallClick}
                  className="flex-1 py-2.5 bg-white text-slate-900 text-[10px] font-black uppercase rounded-lg hover:bg-orange-500 hover:text-white transition-all shadow-xl active:scale-95 text-center font-bold"
                >
                  {isIOSDevice ? "Ver Como Instalar" : "Instalar no Celular"}
                </button>
                <button 
                  onClick={handleDismiss}
                  className="px-3 py-2.5 text-[9px] font-black uppercase text-slate-400 hover:text-white transition-colors"
                >
                  Depois
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
