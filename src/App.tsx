import React, { Suspense, useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NegotiationProvider } from './contexts/NegotiationContext';
import { PWAProvider } from './contexts/PWAContext';
import NegotiationManager from './components/negotiation/NegotiationManager';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from './components/ui/tooltip';

import ErrorBoundary from './components/ErrorBoundary';

// Eager/static loading pages to prevent chunk load errors across hot restarts
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Indications from './pages/Indications';
import Catalog from './pages/Catalog';
import Commissions from './pages/Commissions';
import Admin from './pages/Admin';
import Finance from './pages/Finance';
import Triagem from './pages/Triagem';
import NewIndication from './pages/NewIndication';
import Profile from './pages/Profile';
import FinancialConsultation from './pages/FinancialConsultation';
import Accessories from './pages/Accessories';
import Stock from './pages/Stock';
import Contract from './pages/Contract';
import PublicStock from './pages/PublicStock';
import RegisteredProducts from './pages/RegisteredProducts';
import Reports from './pages/Reports';
import Fairs from './pages/Fairs';
import Trash from './pages/Trash';
import FairDetails from './pages/FairDetails';
import QuickRegister from './pages/QuickRegister';
import FairLeadsTriagem from './pages/FairLeadsTriagem';
import PublicBudgetRequest from './pages/PublicBudgetRequest';
import PublicEvaluation from './pages/PublicEvaluation';
import ComercialAvaliacoes from './pages/ComercialAvaliacoes';
import Clientes from './pages/Clientes';
import Endomarketing from './pages/Endomarketing';

function PrivateRoute({ children, roles }: { children: React.ReactNode, roles?: string[] }) {
  const { user, profile, loading, isImpersonating, isAdmin, isManager, isMarketing, isTriagem, isFinancial, isInternalSeller, isExternalSeller, isRegionalSeller } = useAuth();

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
      <p className="text-sm font-medium">Carregando Roder Indica V2...</p>
    </div>
  );
  
  if (!user && !profile) return <Navigate to="/login" />;

  // Force contract acceptance for external sellers (Skip if impersonating)
  if (!isImpersonating && profile?.role === 'external_seller' && profile.is_commissionable !== false && !profile.contract_accepted && window.location.pathname !== '/contrato') {
    return <Navigate to="/contrato" />;
  }
  
  if (roles) {
    const hasAccess = roles.some(role => {
      if (role === 'admin') return isAdmin;
      if (role === 'manager') return isManager;
      if (role === 'marketing') return isMarketing;
      if (role === 'triagem') return isTriagem;
      if (role === 'financial') return isFinancial;
      if (role === 'internal_seller') return isInternalSeller;
      if (role === 'external_seller') return isExternalSeller || isRegionalSeller;
      return profile?.role === role;
    });

    if (!hasAccess) {
      console.warn("Access denied for route. User roles/profile don't match.");
      return <Navigate to="/" />;
    }
  }

  return <>{children}</>;
}

import PWAInstallBanner from './components/system/PWAInstallBanner';

// App Version: 2.1.3 - Sidebar Endomarketing Update Pending
export default function App() {
  const [mounted, setMounted] = useState(false);
  const APP_VERSION = "2.4.4"; // Security fix for permission leak and Yury access

  useEffect(() => {
    // Detect if we need to force update
    const lastVersion = localStorage.getItem('roder_app_version');
    
    if (lastVersion && lastVersion !== APP_VERSION) {
      console.log(`New version detected: ${APP_VERSION}. Synchronizing...`);
      
      // Clear key storage areas to force fresh data fetching
      const keysToClear = [
        'roder_app_version',
        'firebase-cache',
        'stock_cache',
        'last_sync_timestamp'
      ];
      
      keysToClear.forEach(k => localStorage.removeItem(k));
      localStorage.setItem('roder_app_version', APP_VERSION);
      
      // Force hard reload avoiding browser cache by using a unique timestamp
      window.location.replace(window.location.origin + window.location.pathname + '?refresh=' + Date.now());
      return;
    }
    
    if (!lastVersion) {
      localStorage.setItem('roder_app_version', APP_VERSION);
    }

    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <PWAProvider>
          <AuthProvider>
            <NegotiationProvider>
              <TooltipProvider delayDuration={200}>
                <Router>
                  <AppContent />
                </Router>
              </TooltipProvider>
            </NegotiationProvider>
          </AuthProvider>
        </PWAProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  
  // PWA & Fair Mode Hijack: ensure quick registration links don't conflict with main app flow
  const isStandalone = typeof window !== 'undefined' && 
                       (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone);
  const lastFairId = localStorage.getItem('roder_last_fair_id');
  const isPublicRoute = location.pathname.startsWith('/cadastro-rapido') || 
                        location.pathname.startsWith('/f') ||
                        location.pathname.startsWith('/expo') ||
                        location.pathname.startsWith('/estoque-publico') || 
                        location.pathname.startsWith('/pedido-orcamento') ||
                        location.pathname.startsWith('/satisfacao') ||
                        location.pathname.startsWith('/stock_holder');

  useEffect(() => {
    // If we are in standalone (added to home screen) and have a last fair, 
    // force redirect to the registration screen if at root or login.
    // This solves the issue of Chrome default to start_url="/" for icons.
    // We only force this if NOT logged in, or if it's the very first hit of the session
    if (isStandalone && lastFairId && (location.pathname === '/' || location.pathname === '/login')) {
      navigate(`/expo?fairId=${lastFairId}`, { replace: true });
    }
  }, [isStandalone, lastFairId, location.pathname, navigate]);

  return (
    <>
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-sm font-medium">Carregando...</p>
        </div>
      }>
        <Routes>
          <Route path="/cadastro-rapido" element={<QuickRegister />} />
          <Route path="/f" element={<QuickRegister />} />
          <Route path="/expo" element={<QuickRegister />} />
          <Route path="/login" element={
            /* Hijack login for PWA Fair mode if not logged in */
            isStandalone && lastFairId && !user && !loading ? (
              <Navigate to={`/expo?fairId=${lastFairId}`} replace />
            ) : (
              <Login />
            )
          } />
          
          <Route path="/contrato" element={
            <PrivateRoute>
              <Contract />
            </PrivateRoute>
          } />
          
          <Route path="/" element={
            /* Hijack root for PWA Fair mode if not logged in */
            isStandalone && lastFairId && !user && !loading ? (
              <Navigate to={`/expo?fairId=${lastFairId}`} replace />
            ) : (
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            )
          } />

                <Route path="/indicacoes" element={
                  <PrivateRoute>
                    <Indications />
                  </PrivateRoute>
                } />

                <Route path="/indicacoes/nova" element={
                  <PrivateRoute roles={['external_seller', 'admin', 'manager']}>
                    <NewIndication />
                  </PrivateRoute>
                } />

                <Route path="/perfil" element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                } />

                <Route path="/catalogo" element={
                  <PrivateRoute roles={['admin', 'manager', 'internal_seller', 'triagem', 'external_seller', 'marketing']}>
                    <Catalog />
                  </PrivateRoute>
                } />

                <Route path="/comissoes" element={
                  <PrivateRoute roles={['admin', 'manager', 'financial', 'triagem', 'external_seller', 'vendedor_padrao']}>
                    <Commissions />
                  </PrivateRoute>
                } />

                <Route path="/triagem" element={
                  <PrivateRoute roles={['admin', 'manager', 'triagem']}>
                    <Triagem />
                  </PrivateRoute>
                } />

                <Route path="/financeiro" element={
                  <PrivateRoute roles={['admin', 'manager', 'financial']}>
                    <Commissions />
                  </PrivateRoute>
                } />

                <Route path="/financeiro/kpis" element={
                  <PrivateRoute roles={['admin', 'manager', 'financial']}>
                    <Finance />
                  </PrivateRoute>
                } />

                <Route path="/consulta-financeira" element={
                  <PrivateRoute roles={['admin', 'manager', 'financial', 'internal_seller']}>
                    <FinancialConsultation />
                  </PrivateRoute>
                } />

                <Route path="/acessorios" element={
                  <PrivateRoute roles={['admin', 'manager', 'internal_seller', 'triagem', 'financial', 'marketing']}>
                    <Accessories />
                  </PrivateRoute>
                } />

                <Route path="/estoque" element={
                  <PrivateRoute roles={['admin', 'manager', 'internal_seller', 'triagem', 'financial', 'marketing']}>
                    <Stock />
                  </PrivateRoute>
                } />

                <Route path="/produtos-cadastrados" element={
                  <PrivateRoute roles={['admin', 'manager', 'internal_seller']}>
                    <RegisteredProducts />
                  </PrivateRoute>
                } />

                <Route path="/feiras" element={
                  <PrivateRoute roles={['admin', 'manager', 'financial', 'internal_seller', 'triagem', 'marketing']}>
                    <Fairs />
                  </PrivateRoute>
                } />

                <Route path="/feiras/:id" element={
                  <PrivateRoute roles={['admin', 'manager', 'financial', 'internal_seller', 'triagem', 'marketing']}>
                    <FairDetails />
                  </PrivateRoute>
                } />

                <Route path="/feiras/triagem" element={
                  <PrivateRoute roles={['admin', 'manager', 'triagem']}>
                    <FairLeadsTriagem />
                  </PrivateRoute>
                } />

                <Route path="/cadastro-rapido" element={<QuickRegister />} />
                <Route path="/f" element={<QuickRegister />} />
                <Route path="/expo" element={<QuickRegister />} />

                <Route path="/estoque-publico" element={<PublicStock />} />
                <Route path="/stock_holder" element={<PublicStock />} />
                <Route path="/pedido-orcamento" element={<PublicBudgetRequest />} />
                <Route path="/satisfacao" element={<PublicEvaluation />} />

                <Route path="/comercial/avaliacoes" element={
                  <PrivateRoute roles={['admin', 'manager', 'triagem', 'marketing', 'internal_seller']}>
                    <ComercialAvaliacoes />
                  </PrivateRoute>
                } />

                <Route path="/comercial/clientes" element={
                  <PrivateRoute roles={['admin', 'manager', 'triagem', 'internal_seller']}>
                    <Clientes />
                  </PrivateRoute>
                } />

                <Route path="/endomarketing" element={
                  <PrivateRoute roles={['admin', 'manager', 'marketing']}>
                    <Endomarketing />
                  </PrivateRoute>
                } />

                <Route path="/admin" element={
                  <PrivateRoute roles={['admin', 'manager', 'triagem', 'marketing']}>
                    <Admin isUsersView={false} defaultTab="settings" />
                  </PrivateRoute>
                } />

                <Route path="/usuarios" element={
                  <PrivateRoute roles={['admin', 'manager', 'triagem']}>
                    <Admin isUsersView={true} defaultTab="users" />
                  </PrivateRoute>
                } />

                <Route path="/lixeira" element={
                  <PrivateRoute roles={['admin', 'manager']}>
                    <Trash />
                  </PrivateRoute>
                } />
                
                <Route path="/relatorios" element={
                  <PrivateRoute roles={['admin', 'manager', 'financial']}>
                    <Reports />
                  </PrivateRoute>
                } />

                <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
      <Toaster position="top-right" richColors closeButton />
      {!isPublicRoute && <NegotiationManager />}
      {!isPublicRoute && <PWAInstallBanner />}
    </>
  );
}
