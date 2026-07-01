import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { auth, db } from '../../lib/firebase';
import { updateDoc, doc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from 'next-themes';
import { usePWA } from '../../contexts/PWAContext';
import EdgeStatus from '../system/EdgeStatus';
import { 
  LayoutDashboard, 
  PlusCircle, 
  BookOpen, 
  DollarSign, 
  Users, 
  Filter, 
  Settings, 
  LogOut,
  Trash2,
  ChevronLeft,
  Sun,
  Moon,
  History,
  Package,
  User,
  BarChart3,
  Activity,
  BrainCircuit,
  Download,
  Wifi,
  WifiOff,
  Smartphone,
  RefreshCw,
  HeartHandshake,
  Briefcase,
  Star,
  FileText
} from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Progress } from '../ui/progress';
import { cn, getApiBaseUrl } from '../../lib/utils';
import { toast } from 'sonner';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

interface NavItem {
  id: string;
  name: string;
  path?: string;
  icon: any;
  roles: string[];
  isParent?: boolean;
  isOpenState?: boolean;
  setIsOpenState?: (open: boolean) => void;
  subItems?: { name: string; path: string; icon: any; alert?: boolean; roles?: string[] }[];
  alert?: boolean;
}

const NavItemComponent = React.memo(({ 
  item, 
  isMobile, 
  setIsOpen, 
  location, 
  profile,
  isAdmin,
  isManager,
  isTriagem,
  isInternalSeller,
  isExternalSeller,
  isRegionalSeller,
  isFinancial,
  isMarketing
}: { 
  item: NavItem, 
  isMobile: boolean, 
  setIsOpen: (o: boolean) => void,
  location: any,
  profile: any,
  isAdmin: boolean,
  isManager: boolean,
  isTriagem: boolean,
  isInternalSeller: boolean,
  isExternalSeller: boolean,
  isRegionalSeller: boolean,
  isFinancial: boolean,
  isMarketing: boolean
}) => {
  const glowClass = "animate-fluorescent shadow-[0_0_15px_rgba(234,179,8,0.3)]";
  const elementRef = React.useRef<HTMLDivElement>(null);

  const isChildActive = React.useMemo(() => {
    return item.subItems?.some(si => location.pathname === si.path) || false;
  }, [item.subItems, location.pathname]);

  const isActive = React.useMemo(() => {
    if (item.isParent) return isChildActive;
    return item.path ? (location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))) : false;
  }, [item.isParent, item.path, location.pathname, isChildActive]);

  React.useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        elementRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  React.useEffect(() => {
    if (item.isParent && item.isOpenState) {
      const timer = setTimeout(() => {
        elementRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [item.isParent, item.isOpenState]);

  if (item.isParent) {
    return (
      <div ref={elementRef} className="space-y-0.5 relative group/item scroll-mt-2">
        <button
            onClick={() => item.setIsOpenState ? item.setIsOpenState(!item.isOpenState) : null}
            className={cn(
            "w-full flex items-center justify-between px-2 py-1 rounded-md text-[11.5px] font-bold transition-all duration-200",
            (isChildActive || item.isOpenState)
                ? "bg-orange-600/10 text-orange-600 border border-orange-500/20 shadow-xs" 
                : item.alert 
                  ? cn("bg-yellow-500/20 text-yellow-600", glowClass)
                  : item.id === 'products_stock'
                    ? "bg-blue-100/80 text-blue-700 hover:bg-blue-200/80 border border-blue-200/50"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            )}
        >
            <div className="flex items-center gap-1.5">
            <item.icon className={cn("h-3.5 w-3.5 shrink-0", 
              (isChildActive || item.isOpenState) ? "text-orange-600" : 
              item.alert ? "text-yellow-600" : 
              item.id === 'products_stock' ? "text-blue-600" :
              "text-sidebar-foreground/50"
            )} />
            <span className="truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-1">
              {item.alert && (
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-fluorescent" />
              )}
              <motion.div
                animate={{ rotate: item.isOpenState ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronLeft className="h-3 w-3 rotate-180" />
              </motion.div>
            </div>
        </button>
        
        <AnimatePresence>
          {item.isOpenState && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden ml-2.5 pl-2.5 space-y-0.5 border-l border-orange-500/20 my-0.5 flex flex-col pt-0.5 pb-1"
            >
              {item.subItems?.filter(si => {
                if (!si.roles || si.roles.length === 0) return true;
                return si.roles.some(role => {
                  if (role === 'admin') return isAdmin;
                  if (role === 'manager') return isManager;
                  if (role === 'triagem') return isTriagem;
                  if (role === 'internal_seller') return isInternalSeller;
                  if (role === 'external_seller') return isExternalSeller;
                  if (role === 'financial' || role === 'finance') return isFinancial;
                  if (role === 'marketing') return isMarketing;
                  return profile?.role === role;
                });
              }).map((subItem) => (
                <Link
                  key={subItem.path}
                  to={subItem.path}
                  onClick={() => isMobile && setIsOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-2 py-1 rounded-md text-[10px] font-bold transition-all duration-200 relative group/subitem",
                    location.pathname === subItem.path 
                      ? "bg-orange-600 text-white shadow-md z-10" 
                      : subItem.alert 
                        ? cn("bg-yellow-500/10 text-yellow-600 font-bold", glowClass)
                        : "text-sidebar-foreground/60 hover:text-orange-600 hover:bg-orange-500/5"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <subItem.icon className={cn("h-3 w-3 transition-transform group-hover/subitem:scale-110", 
                      location.pathname === subItem.path ? "text-white" : 
                      subItem.alert ? "text-yellow-600" : "text-sidebar-foreground/40 group-hover/subitem:text-orange-500"
                    )} />
                    <span className="truncate">{subItem.name}</span>
                  </div>
                  {subItem.alert && (
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                  )}
                  {location.pathname === subItem.path && (
                    <motion.div 
                      layoutId="sidebar-active-indicator"
                      className="absolute -left-[14px] w-1.5 h-1.5 rounded-full bg-orange-600"
                    />
                  )}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div ref={elementRef} className="scroll-mt-2">
      <Link
        to={item.path || '#'}
        onClick={() => isMobile && setIsOpen(false)}
        className={cn(
          "flex items-center justify-between px-2 py-1 rounded-md text-[11.5px] font-bold transition-all duration-200",
          isActive 
            ? "bg-orange-600 text-white shadow-sm" 
            : item.alert 
              ? cn("bg-yellow-500/20 text-yellow-600 font-black", glowClass)
              : item.id === 'dashboard'
                ? "bg-yellow-100/80 text-yellow-700 hover:bg-yellow-200/80 border border-yellow-200/50"
              : item.id === 'new_indication'
                ? "bg-green-100/80 text-green-700 hover:bg-green-200/80 border border-green-200/50"
                : item.id === 'catalog'
                  ? "bg-yellow-100/80 text-yellow-700 hover:bg-yellow-200/80 border border-yellow-200/50"
                  : item.id === 'products_stock'
                    ? "bg-blue-100/80 text-blue-700 hover:bg-blue-200/80 border border-blue-200/50"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        )}
      >
        <div className="flex items-center gap-1.5">
          <item.icon className={cn("h-3.5 w-3.5 shrink-0", 
            isActive ? "text-white" : 
            item.alert ? "text-yellow-600" : 
            item.id === 'dashboard' ? "text-yellow-600" :
            item.id === 'new_indication' ? "text-green-600" :
            item.id === 'catalog' ? "text-yellow-600" :
            item.id === 'products_stock' ? "text-blue-600" :
            "text-sidebar-foreground/50"
          )} />
          <span className="truncate">{item.name}</span>
        </div>
        {item.alert && (
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
        )}
      </Link>
    </div>
  );
});

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { user, profile, isAdmin, isManager, isTriagem, isFinancial, isInternalSeller, isExternalSeller, isRegionalSeller, isMarketing } = useAuth();
  const { isOffline, canInstall, isDownloading, downloadProgress, pendingSyncCount, installApp, syncDataLocally, processSyncQueue } = usePWA();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = React.useState(false);

  // Local UI states - kept simple to avoid flickering
  const [fairsMenuOpen, setFairsMenuOpen] = React.useState(false);
  const [financialMenuOpen, setFinancialMenuOpen] = React.useState(false);
  const [comercialMenuOpen, setComercialMenuOpen] = React.useState(false);
  const [technicalMenuOpen, setTechnicalMenuOpen] = React.useState(false);

  // Exclusive toggle wrappers (Accordion style) so only one parent menu is open at a time
  const handleSetFairsMenuOpen = React.useCallback((open: boolean) => {
    setFairsMenuOpen(open);
    if (open) {
      setFinancialMenuOpen(false);
      setComercialMenuOpen(false);
      setTechnicalMenuOpen(false);
    }
  }, []);

  const handleSetFinancialMenuOpen = React.useCallback((open: boolean) => {
    setFinancialMenuOpen(open);
    if (open) {
      setFairsMenuOpen(false);
      setComercialMenuOpen(false);
      setTechnicalMenuOpen(false);
    }
  }, []);

  const handleSetComercialMenuOpen = React.useCallback((open: boolean) => {
    setComercialMenuOpen(open);
    if (open) {
      setFairsMenuOpen(false);
      setFinancialMenuOpen(false);
      setTechnicalMenuOpen(false);
    }
  }, []);

  const handleSetTechnicalMenuOpen = React.useCallback((open: boolean) => {
    setTechnicalMenuOpen(open);
    if (open) {
      setFairsMenuOpen(false);
      setFinancialMenuOpen(false);
      setComercialMenuOpen(false);
    }
  }, []);
  
  // Auto-expand menus based on current path and collapse inactive menus
  React.useEffect(() => {
    const path = location.pathname;
    const isFairsPath = path.startsWith('/feiras') || path === '/cadastro-rapido';
    const isFinancialPath = path === '/comissoes' || path === '/consulta-financeira' || path.startsWith('/financeiro');
    const isComercialPath = path.startsWith('/comercial');
    const isTechnicalPath = path === '/dossie' || path === '/relatorios-ia';

    if (isFairsPath) {
      setFairsMenuOpen(true);
      setFinancialMenuOpen(false);
      setComercialMenuOpen(false);
      setTechnicalMenuOpen(false);
    } else if (isFinancialPath) {
      setFinancialMenuOpen(true);
      setFairsMenuOpen(false);
      setComercialMenuOpen(false);
      setTechnicalMenuOpen(false);
    } else if (isComercialPath) {
      setComercialMenuOpen(true);
      setFairsMenuOpen(false);
      setFinancialMenuOpen(false);
      setTechnicalMenuOpen(false);
    } else if (isTechnicalPath) {
      setTechnicalMenuOpen(true);
      setFairsMenuOpen(false);
      setFinancialMenuOpen(false);
      setComercialMenuOpen(false);
    } else {
      // Direct paths (e.g., dashboard, stock, configs) collapse parent submenus
      setFairsMenuOpen(false);
      setFinancialMenuOpen(false);
      setComercialMenuOpen(false);
      setTechnicalMenuOpen(false);
    }
  }, [location.pathname]);
  
  const [pendingTriageCount, setPendingTriageCount] = React.useState(0);
  const [aiStatus, setAiStatus] = React.useState<{ status: string; timestamp: string; error?: string } | null>(null);

  React.useEffect(() => {
    const fetchHealth = async () => {
      try {
        const baseUrl = getApiBaseUrl();
        const res = await fetch(`${baseUrl}/api/health`);
        const data = await res.json();
        if (data.aiHealth) setAiStatus(data.aiHealth);
      } catch (e) {
        console.error("Sidebar health check failed", e);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 300000); // Check every 5 mins
    return () => clearInterval(interval);
  }, []);

  // Sync counts separately
  React.useEffect(() => {
    if (!profile?.uid || !(isAdmin || isManager || isTriagem)) {
      setPendingTriageCount(0);
      return;
    }

    const qTriage = query(collection(db, 'indications'), where('status', '==', 'pending'));
    const unsubTriage = onSnapshot(qTriage, (snapshot) => {
      setPendingTriageCount(snapshot.size);
    }, (error) => console.error("Sidebar triage count error:", error));

    return () => {
      unsubTriage();
    };
  }, [profile?.uid, profile?.role, isAdmin, isManager, isTriagem]);

  // navItems logic - now depends on counts but not on the toggle states themselves 
  // to avoid re-calculating the whole tree when a menu opens
  const navItems: NavItem[] = React.useMemo(() => [
    { id: 'dashboard', name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'internal_seller', 'triagem', 'external_seller', 'vendedor_padrao', 'financial', 'marketing'] },
    { id: 'new_indication', name: 'Nova Indicação', path: '/indicacoes/nova', icon: PlusCircle, roles: ['external_seller', 'vendedor_padrao', 'admin', 'manager', 'internal_seller'] },
    { id: 'catalog', name: 'Catálogo de Equipamentos', path: '/catalogo', icon: BookOpen, roles: ['admin', 'manager', 'internal_seller', 'triagem', 'external_seller', 'vendedor_padrao', 'marketing'] },
    { id: 'products_stock', name: 'Estoque Roder', path: '/estoque', icon: Package, roles: ['admin', 'manager', 'internal_seller', 'triagem', 'financial', 'marketing', 'external_seller', 'vendedor_padrao'] },
    { id: 'my_sales', name: 'Minhas Indicações', path: '/indicacoes', icon: Filter, roles: ['external_seller', 'vendedor_padrao'] },
    { 
      id: 'fairs',
      name: 'Eventos / Feiras', 
      icon: History, 
      roles: ['admin', 'manager', 'internal_seller', 'triagem', 'marketing'],
      isParent: true,
      isOpenState: fairsMenuOpen,
      setIsOpenState: handleSetFairsMenuOpen,
      subItems: [
        { name: 'Gestão de Feiras e Eventos', path: '/feiras', icon: Settings, roles: ['admin', 'manager', 'marketing'] },
        { name: 'Endomarketing', path: '/endomarketing', icon: HeartHandshake, roles: ['admin', 'manager', 'marketing'] },
      ]
    },
    { 
      id: 'comercial',
      name: 'Comercial', 
      icon: Briefcase, 
      roles: ['admin', 'manager', 'triagem', 'marketing', 'internal_seller'],
      isParent: true,
      isOpenState: comercialMenuOpen,
      setIsOpenState: handleSetComercialMenuOpen,
      alert: pendingTriageCount > 0,
      subItems: [
        { name: 'Triagem', path: '/triagem', icon: Filter, roles: ['admin', 'manager', 'triagem'], alert: pendingTriageCount > 0 },
        { name: 'Central de Negócios', path: '/indicacoes', icon: Filter, roles: ['admin', 'manager', 'triagem', 'marketing', 'internal_seller'] },
        { name: 'Qualidade e NPS', path: '/comercial/avaliacoes', icon: Star, roles: ['admin', 'manager', 'triagem'] },
        { name: 'Clientes', path: '/comercial/clientes', icon: Users, roles: ['admin', 'manager', 'triagem', 'internal_seller'] },
      ]
    },
    { id: 'products_registered', name: 'Produtos Cadastrados', path: '/produtos-cadastrados', icon: BookOpen, roles: ['admin', 'manager', 'internal_seller', 'triagem', 'financial', 'marketing'] },
    { id: 'accessories', name: 'Acessórios', path: '/acessorios', icon: Settings, roles: ['admin', 'manager', 'internal_seller', 'triagem', 'financial', 'marketing'] },
    { 
      id: 'technical_consultant_parent',
      name: 'Consultor Roder IA', 
      icon: BrainCircuit, 
      roles: ['admin', 'manager'],
      isParent: true,
      isOpenState: technicalMenuOpen,
      setIsOpenState: handleSetTechnicalMenuOpen,
      subItems: [
        { name: 'Dossiê Técnico', path: '/dossie', icon: FileText, roles: ['admin', 'manager'] },
        { name: 'Relatórios Roder IA', path: '/relatorios-ia', icon: BarChart3, roles: ['admin', 'manager'] },
      ]
    },
    { id: 'users', name: 'Usuários', path: '/usuarios', icon: Users, roles: ['admin', 'manager', 'triagem'] },
    { 
      id: 'finance',
      name: 'Financeiro / Fiscal', 
      icon: DollarSign, 
      roles: ['admin', 'manager', 'financial', 'fiscal', 'finance'],
      isParent: true,
      isOpenState: financialMenuOpen,
      setIsOpenState: handleSetFinancialMenuOpen,
      subItems: [
        { name: 'Relatório de Comissões', path: '/comissoes', icon: DollarSign },
        { name: 'Consulta Financeira', path: '/consulta-financeira', icon: History },
        { name: 'Faturamentos (Vendas)', path: '/indicacoes', icon: Filter },
        { name: 'Demonstrativo de KPIs', path: '/financeiro/kpis', icon: BarChart3 },
      ]
    },
    { id: 'configurations', name: 'Configurações', path: '/admin', icon: Settings, roles: ['admin', 'manager', 'triagem', 'marketing'] },
    { id: 'trash', name: 'Lixeira Segura', path: '/lixeira', icon: Trash2, roles: ['admin', 'manager'] },
    { id: 'comissoes_ext', name: 'Comissões', path: '/comissoes', icon: DollarSign, roles: ['external_seller'] },
    { id: 'reports', name: 'Relatórios', path: '/relatorios', icon: BarChart3, roles: ['admin', 'manager', 'financial'] },
    { id: 'profile', name: 'Minha Conta', path: '/perfil', icon: User, roles: ['admin', 'manager', 'internal_seller', 'triagem', 'external_seller', 'vendedor_padrao', 'financial', 'marketing'] },
  ], [pendingTriageCount, fairsMenuOpen, financialMenuOpen, comercialMenuOpen, technicalMenuOpen, isExternalSeller, isRegionalSeller]);

  const filteredItems = React.useMemo(() => {
    // If we have an auth user but no role yet, show basic items to prevent total flickering
    const isAuthenticated = !!user;
    
    if (!isAuthenticated) return [];
    
    return navItems.filter((item) => {
      // Strict filter for comercial tab: only visible to Admin, Gislene, and Luana
      if (item.id === 'comercial') {
        const lowercaseName = (profile?.name || '').toLowerCase();
        const lowercaseEmail = (profile?.email || (user && user.email) || '').toLowerCase();
        const allowed = isAdmin || 
                        isInternalSeller ||
                        lowercaseEmail.includes('gislene') || 
                        lowercaseEmail.includes('luana') || 
                        lowercaseName.includes('gislene') || 
                        lowercaseName.includes('luana');
        if (!allowed) {
          return false;
        }
      }

      // 1. Explicitly DISABLED in permissions (Admins bypass this restriction)
      if (!isAdmin && profile?.permissions?.sidebar?.[item.id] === false) {
        return false;
      }

      // 2. Explicitly ENABLED in permissions (overrides role)
      if (profile?.permissions?.sidebar?.[item.id] === true) {
        return true;
      }

      // 3. Fallback to role-based filtering
      if (!item.roles || item.roles.length === 0) return true;
      
      // Check against all flags from useAuth
      const hasAnyRole = item.roles.some(role => {
        if (role === 'admin') return isAdmin;
        if (role === 'manager') return isManager;
        if (role === 'triagem') return isTriagem;
        if (role === 'internal_seller') return isInternalSeller;
        if (role === 'external_seller') return isExternalSeller;
        if (role === 'vendedor_padrao') return isRegionalSeller;
        if (role === 'financial' || role === 'finance') return isFinancial;
        if (role === 'marketing') return isMarketing;
        return false;
      });

      if (hasAnyRole) return true;

      // Also check profile explicitly just in case
      if (profile?.role && item.roles.includes(profile.role)) return true;

      // Fallback for anyone authenticated but whose profile hasn't loaded yet
      // This prevents the sidebar from "flickering" or appearing empty for users 
      // before the Firestore profile loads.
      if (isAuthenticated) {
        const basicIds = ['dashboard', 'profile', 'catalog'];
        return basicIds.includes(item.id);
      }

      return false;
    });
  }, [navItems, isAdmin, isManager, isTriagem, isInternalSeller, isExternalSeller, isFinancial, isMarketing, profile?.role, profile?.permissions?.sidebar, user]);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  return (
    <AnimatePresence>
      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ x: isMobile ? (isOpen ? 0 : -224) : 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        drag={isMobile ? "x" : false}
        dragConstraints={{ left: -224, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (isMobile && info.offset.x < -50) setIsOpen(false);
        }}
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-56 bg-sidebar border-r border-sidebar-border transition-colors md:translate-x-0",
          !isOpen && "md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="py-2.5 px-3 flex items-center justify-between border-b border-sidebar-border/50">
            <Link to="/" className="flex items-center gap-1.5 hover:opacity-90 transition-opacity" onClick={() => isMobile && setIsOpen(false)}>
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center p-1 shadow-sm overflow-hidden shrink-0">
                <img 
                  src="https://roderbrasil.com.br/wp-content/uploads/2024/05/favicon.png" 
                  alt="Logo" 
                  referrerPolicy="no-referrer" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) parent.innerHTML = '<span class="text-[9px] font-black text-white tracking-tighter">RODER</span>';
                  }}
                />
              </div>
              <span className="text-sidebar-foreground font-extrabold text-[12.5px] tracking-tight shrink-0">RODER Indica V2</span>
            </Link>
            <Button 
                variant="ghost" 
                size="sm" 
                className="md:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground flex items-center gap-1 px-1.5" 
                onClick={() => setIsOpen(false)}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs font-medium">Fechar</span>
            </Button>
          </div>

          {(isAdmin || isManager || isMarketing) && aiStatus && (
            <div className={cn(
              "mx-4 my-2 p-2 rounded-lg border flex items-center justify-between transition-colors",
              aiStatus.status === 'ok' 
                ? "bg-green-500/5 border-green-500/10 text-green-600" 
                : "bg-red-500/5 border-red-500/10 text-red-600"
            )}>
              <div className="flex items-center gap-2">
                <BrainCircuit className={cn("h-3.5 w-3.5", aiStatus.status === 'ok' ? "animate-pulse" : "")} />
                <span className="text-[9px] font-black uppercase tracking-tighter">Motor de IA Roder</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={cn("w-1.5 h-1.5 rounded-full", aiStatus.status === 'ok' ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" : "bg-red-500")} />
                <span className="text-[8px] font-bold">{aiStatus.status === 'ok' ? 'ONLINE' : 'ERRO'}</span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4 overflow-y-auto">
            {profile && !profile.role && (
              <div className="mb-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1">Atenção</p>
                <p className="text-[10px] text-orange-700/70 leading-tight">Seu perfil ainda não possui uma função (role) definida. Algumas ferramentas podem estar ocultas. Contate o administrador.</p>
              </div>
            )}
            <nav className="space-y-1">
              {filteredItems.map((item) => (
                <NavItemComponent 
                  key={item.id} 
                  item={item} 
                  isMobile={isMobile} 
                  setIsOpen={setIsOpen} 
                  location={location} 
                  profile={profile}
                  isAdmin={isAdmin}
                  isManager={isManager}
                  isTriagem={isTriagem}
                  isInternalSeller={isInternalSeller}
                  isExternalSeller={isExternalSeller}
                  isRegionalSeller={isRegionalSeller}
                  isFinancial={isFinancial}
                  isMarketing={isMarketing}
                />
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-3 border-t border-sidebar-border/50 bg-sidebar-accent/30 text-xs">
            <div className="flex items-center gap-2 px-1.5 py-1 mb-2">
              <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-xs font-bold text-sidebar-primary-foreground shadow-inner uppercase shrink-0">
                {profile?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-semibold text-sidebar-foreground truncate">{profile?.name || user?.email?.split('@')[0] || 'Usuário'}</p>
                <p className="text-[9px] text-sidebar-foreground/50 truncate uppercase tracking-wider font-bold">
                  {isAdmin ? 'Administrador' : 
                   isManager ? 'Gerente' : 
                   isTriagem ? 'Triagem' : 
                   isInternalSeller ? 'Vendedor Interno' :
                   isExternalSeller ? 'Parceiro Indicador' :
                   isRegionalSeller ? 'Vendedor Regional' : 
                   isFinancial ? 'Financeiro' : 
                   (profile?.role as string || '').replace('_', ' ')}
                </p>
                {isAdmin && !profile && (
                  <p className="text-[8px] text-orange-500 font-bold animate-pulse">CRIANDO PERFIL ADMINISTRATIVO...</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 flex-1 justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent px-2 py-1 text-[11px]"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="h-3.5 w-3.5 mr-2" />
                    <span className="text-[11px] font-medium">Modo Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 mr-2" />
                    <span className="text-[11px] font-medium">Modo Escuro</span>
                  </>
                )}
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-full justify-start text-sidebar-foreground/60 hover:text-red-400 hover:bg-red-500/10 transition-colors px-2 py-1 text-[11px]"
              onClick={handleLogout}
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />
              <span className="text-[11px] font-medium">Sair da Conta</span>
            </Button>
          </div>
          <EdgeStatus />
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
