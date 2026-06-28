import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Button } from '../ui/button';
import { Menu, ChevronLeft, X, Eye, EyeOff, WifiOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import { useAuth } from '../../contexts/AuthContext';
import { usePWA } from '../../contexts/PWAContext';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../../lib/utils';
import EngineerHelper from './EngineerHelper';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isImpersonating, profile, stopImpersonation, isQuotaExceeded } = useAuth();
  const { isOffline } = usePWA();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <AnimatePresence>
        {isQuotaExceeded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-600 text-white px-4 py-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-4 text-center sticky top-0 z-[80] shadow-md border-b border-amber-700 font-sans leading-relaxed"
          >
            <div className="flex items-center gap-2">
              <span className="bg-amber-900/60 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider animate-pulse">Cota Excedida</span>
              <span className="text-xs font-bold">
                Limite de leituras diárias do Firebase atingido (50.000/dia)!
              </span>
            </div>
            <span className="text-[10px] text-amber-100 sm:border-l sm:border-amber-500/50 sm:pl-3">
              Para liberar o acesso, o administrador do projeto precisa habilitar o plano <strong>Blaze (Pay-As-You-Go)</strong> no Console Firebase ou aguardar o reset automático à meia-noite (PST).
            </span>
          </motion.div>
        )}

        {isOffline && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-600 text-white px-4 py-1.5 flex items-center justify-center gap-2 sticky top-[45px] z-[70] shadow-md"
          >
            <WifiOff className="h-3.5 w-3.5 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Modo Offline Ativado - Usando Dados Locais</span>
          </motion.div>
        )}
      </AnimatePresence>

      {isImpersonating && (
        <div className={cn(
          "bg-orange-600 text-white px-4 py-2 flex items-center justify-between sticky z-[60] shadow-lg animate-in slide-in-from-top duration-300",
          isOffline ? "top-[31px]" : "top-0"
        )}>
          <div className="flex items-center gap-2 text-sm font-bold">
            <Eye className="h-4 w-4 animate-pulse" />
            <span className="hidden sm:inline">VOCÊ ESTÁ SIMULANDO A CONTA DE:</span>
            <span className="bg-white/20 px-2 py-0.5 rounded uppercase tracking-wider">{profile?.name}</span>
          </div>
          <Button 
            size="sm" 
            variant="secondary" 
            className="h-8 bg-white text-orange-600 hover:bg-white/90 font-black uppercase text-[10px] tracking-widest"
            onClick={stopImpersonation}
          >
            <EyeOff className="h-3 w-3 mr-1" /> Sair da Simulação
          </Button>
        </div>
      )}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="md:pl-56 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-1.5 px-3 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30 shadow-sm h-14">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              className="h-10 w-10 bg-primary text-white hover:bg-primary/90 border-none rounded-lg shadow-sm" 
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {!isHome && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground"
                onClick={() => navigate(-1)}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}
            
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center p-1 shadow-sm overflow-hidden">
                <img 
                  src="https://roderbrasil.com.br/wp-content/uploads/2024/05/favicon.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) parent.innerHTML = '<span class="text-[9px] font-black text-white tracking-tighter">RODER</span>';
                  }}
                />
              </div>
              <span className="font-extrabold text-sm tracking-tight text-slate-805">Roder Indica</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <NotificationBell />
          </div>
        </header>

        {/* Desktop Header (optional, but good for notifications) */}
        <header className="hidden md:flex items-center justify-between p-4 border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {!isHome && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => navigate(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Voltar</span>
              </Button>
            )}
          </div>
          <NotificationBell />
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-full">
          {children}
        </main>
      </div>
      <EngineerHelper />
    </div>
  );
}
