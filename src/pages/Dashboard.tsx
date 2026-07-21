import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Layout from '../components/layout/Layout';
import FinanceDashboard from '../components/FinanceDashboard';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs, getDoc, getDocsFromCache, updateDoc, doc, serverTimestamp, or, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Indication, Commission, Product, Fair } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  PlusCircle, 
  BookOpen, 
  DollarSign,
  ArrowRight,
  Filter,
  Users,
  Calculator,
  Share2,
  FileDigit,
  PieChart as PieChartIcon,
  Timer,
  Zap,
  Target,
  ClipboardList,
  Building2,
  MapPin,
  Calendar,
  ShieldAlert,
  Star,
  Briefcase
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  Legend 
} from 'recharts';
import { Button } from '../components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { HelpTooltip } from '../components/base/HelpTooltip';

function DashboardBannerImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [resolvedSrc, setResolvedSrc] = useState('');

  useEffect(() => {
    if (!src) {
      setResolvedSrc('');
      return;
    }
    if (src.startsWith('db-file://')) {
      const fileId = src.replace('db-file://', '');
      getDoc(doc(db, 'app_files', fileId)).then(docSnap => {
        if (docSnap.exists()) {
          setResolvedSrc(docSnap.data().data || '');
        } else {
          setResolvedSrc('');
        }
      }).catch(() => {
        setResolvedSrc('');
      });
    } else {
      setResolvedSrc(src);
    }
  }, [src]);

  if (!resolvedSrc) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-full blur-2xl transform scale-75 animate-pulse" />
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
    />
  );
}

export default function Dashboard() {
  const { 
    user, 
    profile, 
    isExternalSeller, 
    isInternalSeller, 
    isRegionalSeller, 
    isTriagem, 
    isManager, 
    isAdmin, 
    isMarketing,
    isPureExternalSeller 
  } = useAuth();
  const isFinancial = profile?.role === 'financial';
  const isFiscal = profile?.role === 'fiscal';
  const navigate = useNavigate();
  const [indications, setIndications] = useState<Indication[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [fairs, setFairs] = useState<Fair[]>([]);
  const [endoActions, setEndoActions] = useState<any[]>([]);
  const [highlightedProducts, setHighlightedProducts] = useState<Product[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [conversionRanking, setConversionRanking] = useState<any[]>([]);
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [coldLeadsCount, setColdLeadsCount] = useState(0);
  const [missingCommValueCount, setMissingCommValueCount] = useState(0);
  const [fairAnomaliesCount, setFairAnomaliesCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [goals, setGoals] = useState({ monthly_revenue: 3000000, monthly_indications: 50 });
  const [performanceData, setPerformanceData] = useState({
    monthly_sales: 0,
    monthly_leads: 0,
    avg_response_time: 0, // hours
    avg_closing_time: 0, // days
  });
  const [reservations, setReservations] = useState<any[]>([]);
  const [financialPeriod, setFinancialPeriod] = useState<'30days' | '12months' | 'all' | 'custom'>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [latestEvaluations, setLatestEvaluations] = useState<any[]>([]);
  const [showFinanceModal, setShowFinanceModal] = useState(false);

  // Filter for upcoming Endomarketing actions (Planned or In Progress, or planned date not older than today)
  const upcomingEndoActions = React.useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return endoActions.filter((act: any) => 
      act.status !== 'Cancelada' && 
      act.status !== 'Concluída' &&
      (act.date_planned >= todayStr || act.status === 'Em andamento')
    );
  }, [endoActions]);

  // Filter for upcoming fairs (Active or Planned, or end date not older than today)
  const upcomingFairs = React.useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return fairs.filter((fair: any) => 
      fair.status !== 'completed' && 
      fair.status !== 'cancelled' &&
      fair.end_date >= todayStr
    );
  }, [fairs]);

  const isRHUser = isTriagem || profile?.role === 'triagem' || profile?.name?.toLowerCase().includes('julia') || profile?.email?.toLowerCase().includes('rh');
  const isMarketingUser = isMarketing || profile?.role === 'marketing' || profile?.name?.toLowerCase().includes('franciele') || profile?.email?.toLowerCase().includes('marketing');
  const isFinanceiroUser = isFinancial || profile?.role === 'financial' || profile?.email?.toLowerCase().includes('finance');

  const shouldShowTargetCards = isRHUser || isMarketingUser || isFinanceiroUser || isAdmin || isManager;

  // Explicit overrides from profile permissions or defaults
  const showQuickActions = profile?.permissions?.dashboard_cards && 'quick_actions' in profile.permissions.dashboard_cards
    ? !!profile.permissions.dashboard_cards.quick_actions
    : !(isRHUser || isMarketingUser);

  const showRecentIndications = profile?.permissions?.dashboard_cards && 'recent_indications' in profile.permissions.dashboard_cards
    ? !!profile.permissions.dashboard_cards.recent_indications
    : !(isRHUser || isMarketingUser);

  const showGoals = profile?.permissions?.dashboard_cards && 'goals' in profile.permissions.dashboard_cards
    ? !!profile.permissions.dashboard_cards.goals
    : !(isRHUser || isMarketingUser);

  const showReservations = profile?.permissions?.dashboard_cards && ('active_reservations' in profile.permissions.dashboard_cards || 'reservations' in profile.permissions.dashboard_cards)
    ? (profile.permissions.dashboard_cards.active_reservations !== false && profile.permissions.dashboard_cards.reservations !== false)
    : !(isRHUser || isMarketingUser);

  const shouldShowOnlyFairsCard = !shouldShowTargetCards && (
    isInternalSeller || 
    isExternalSeller || 
    isRegionalSeller || 
    isPureExternalSeller ||
    profile?.role === 'vendedor_padrao' || 
    profile?.role === 'external_seller' || 
    profile?.role === 'internal_seller'
  );

  const filteredFinancialData = React.useMemo(() => {
    let filteredIndications = indications;
    let filteredCommissions = commissions;
    const startDate = new Date('2026-04-25'); // App creation date
    const now = new Date();

    if (financialPeriod === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      filteredIndications = indications.filter(i => new Date(i.created_at) >= thirtyDaysAgo);
      filteredCommissions = commissions.filter(c => new Date(c.created_at) >= thirtyDaysAgo);
    } else if (financialPeriod === '12months') {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(now.getMonth() - 12);
      filteredIndications = indications.filter(i => new Date(i.created_at) >= twelveMonthsAgo);
      filteredCommissions = commissions.filter(c => new Date(c.created_at) >= twelveMonthsAgo);
    } else if (financialPeriod === 'custom') {
      filteredIndications = indications.filter(i => {
        const d = new Date(i.created_at);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      });
      filteredCommissions = commissions.filter(c => {
        const d = new Date(c.created_at);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      });
    } else {
      // 'all' - since April 25, 2026
      filteredIndications = indications.filter(i => new Date(i.created_at) >= startDate);
      filteredCommissions = commissions.filter(c => new Date(c.created_at) >= startDate);
    }

    const negotiatingValue = filteredIndications
      .filter(i => i.status === 'negotiating')
      .reduce((acc, curr) => acc + (curr.base_commission_value || 0), 0);

    const soldValue = filteredIndications
      .filter(i => i.status === 'sold')
      .reduce((acc, curr) => acc + (curr.base_commission_value || 0), 0);

    const paidCommissions = filteredCommissions
      .filter(c => c.status === 'paid')
      .reduce((acc, curr) => acc + (curr.value || 0), 0);

    const pendingCommissions = filteredCommissions
      .filter(c => c.status === 'pending' || c.status === 'waiting_nf' || c.status === 'waiting_payment')
      .reduce((acc, curr) => acc + (curr.value || 0), 0);

    return { negotiatingValue, soldValue, paidCommissions, pendingCommissions };
  }, [indications, commissions, financialPeriod, selectedMonth, selectedYear]);

  // 1. Fetch highlighted products for banners
  useEffect(() => {
    if (!profile?.uid) return;
    const qProducts = query(collection(db, 'products'), where('show_banner', '==', true));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      setHighlightedProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => console.error("Snapshot error (products_banners):", error));
    return () => unsubscribeProducts();
  }, [profile?.uid]);

  // Fetch Roder IA Daily Summary for Admin/Manager Dashboard
  useEffect(() => {
    if (!profile?.uid) return;
    const fetchDailySummary = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const docRef = doc(db, 'roder_ai_daily_summaries', todayStr);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDailySummary(docSnap.data());
        }
      } catch (err) {
        console.warn("Could not fetch daily summary for dashboard:", err);
      }
    };
    fetchDailySummary();
  }, [profile?.uid]);

  // 2. Fetch Alerts and specific data
  useEffect(() => {
    if (!profile?.uid) return;
    if (!(isAdmin || isManager || isTriagem || isInternalSeller || isExternalSeller)) return;

    const fetchAlertData = async () => {
      try {
        let q;
        if (isAdmin || isManager || isTriagem) {
          q = query(collection(db, 'indications'));
        } else if (isInternalSeller) {
          q = query(
            collection(db, 'indications'), 
            or(
              where('internal_seller_uid', '==', profile?.uid),
              where('internal_seller_name', '==', profile?.name)
            )
          );
        } else {
          q = query(collection(db, 'indications'), where('external_seller_uid', '==', profile?.uid));
        }

        const snap = await getDocs(q);
        const indics = snap.docs
          .map(doc => doc.data() as Indication)
          .filter(ind => !ind.is_deleted);

        // Conversion Ranking (Only for Admin/Manager)
        if (isAdmin || isManager) {
          const sellers: Record<string, { name: string, total: number, sold: number }> = {};
          indics.forEach(ind => {
            if (!ind.external_seller_uid) return;
            if (!sellers[ind.external_seller_uid]) {
              sellers[ind.external_seller_uid] = { name: ind.external_seller_name || 'Vendedor', total: 0, sold: 0 };
            }
            sellers[ind.external_seller_uid].total++;
            if (ind.status === 'sold') sellers[ind.external_seller_uid].sold++;
          });

          const ranking = Object.values(sellers)
            .map(s => ({
              ...s,
              rate: s.total > 0 ? (s.sold / s.total) * 100 : 0
            }))
            .sort((a, b) => b.rate - a.rate)
            .slice(0, 5);
          setConversionRanking(ranking);
        }
        
        const now = new Date();
        const fiveDayAgo = new Date();
        fiveDayAgo.setDate(now.getDate() - 5);
        
        const cold = indics.filter(ind => {
          if (ind.status !== 'negotiating') return false;
          const updatedDate = new Date(ind.updated_at || ind.created_at);
          return updatedDate < fiveDayAgo;
        });
        setColdLeadsCount(cold.length);

        if (!isExternalSeller || isAdmin || isManager) {
          const missing = indics.filter(ind => 
            ind.status === 'negotiating' && (
              (!ind.base_commission_value || ind.base_commission_value <= 0) ||
              (ind.commissioned_products?.some(p => !p.base_value || p.base_value <= 0))
            )
          );
          setMissingCommValueCount(missing.length);
        } else {
          setMissingCommValueCount(0);
        }

        // Fair Status Consistency Check
        if (isAdmin || isManager || isTriagem) {
           const now = new Date();
           const anom = fairs.filter(fair => {
             const start = new Date(fair.start_date);
             const end = new Date(fair.end_date);
             
             const activeStart = new Date(start);
             activeStart.setDate(start.getDate() - 3);
             
             const activeEnd = new Date(end);
             activeEnd.setDate(end.getDate() + 3);

             const shouldBeActive = now >= activeStart && now <= activeEnd;
             const shouldBeCompleted = now > activeEnd;

             if (shouldBeActive && fair.status !== 'active') return true;
             if (shouldBeCompleted && fair.status !== 'completed') return true;
             return false;
           });
           setFairAnomaliesCount(anom.length);
        } else {
          setFairAnomaliesCount(0);
        }
      } catch (err) {
        console.error("Alert data fetch error:", err);
      }
    };
    
    fetchAlertData();
    const interval = setInterval(fetchAlertData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [profile?.uid, profile?.name, isAdmin, isManager, isTriagem, isInternalSeller, isExternalSeller]);

  // 3. Fetch Goals
  useEffect(() => {
    if (!profile?.uid) return;
    const unsubGoals = onSnapshot(doc(db, 'settings', 'goals'), (snap) => {
      if (snap.exists()) setGoals(snap.data() as any);
    }, (error) => {
      console.warn("Goals restricted or unavailable:", error.message);
    });
    return () => unsubGoals();
  }, [profile?.uid]);

  // 4. Fetch Stock Reservations
  useEffect(() => {
    if (!profile?.uid) return;
    const qRes = query(
      collection(db, 'stock_reservations'), 
      where('status', '==', 'active')
    );
    const unsubStock = onSnapshot(qRes, async (snapshot) => {
      const allReservations = snapshot.docs.map(doc => {
        const item = doc.data();
        return {
          ...item,
          id: doc.id,
          item_id: item.item_id || item.itemId,
          product_name: item.item_description || item.itemDescription || item.product_name,
          seller_name: item.seller_name || item.userName || item.client_name || 'Link Público',
          quantity: item.quantity_reserved || item.quantity
        };
      });

      if (isAdmin || isManager) {
        try {
          const stockSnap = await getDocs(collection(db, 'stock_items'));
          const stockIds = new Set(stockSnap.docs.map(d => d.id));
          const orphaned = allReservations.filter(res => res.item_id && !stockIds.has(res.item_id));
          if (orphaned.length > 0) {
            for (const res of orphaned) {
              await updateDoc(doc(db, 'stock_reservations', res.id), {
                status: 'cancelled',
                cancelled_reason: 'Automated cleanup: Item no longer in stock',
                updated_at: serverTimestamp()
              });
            }
          }
        } catch (err) { console.error("Maintenance cleanup error:", err); }
      }
      
      // Sort in-memory to prevent requiring Firestore index
      allReservations.sort((a, b) => {
        const timeVal = (item: any) => {
          if (!item.created_at) return 0;
          if (typeof item.created_at.toDate === 'function') return item.created_at.toDate().getTime();
          return new Date(item.created_at).getTime();
        };
        return timeVal(b) - timeVal(a);
      });
      
      setReservations(allReservations);
    }, (error) => {
      console.error("Snapshot error (stock_reservations):", error);
    });
    return () => unsubStock();
  }, [profile?.uid, isAdmin, isManager]);

  // 5. Indications and Performance
  useEffect(() => {
    if (!profile?.uid) return;
    
    const indicationsRef = collection(db, 'indications');
    let q;

    if (isAdmin || isManager) {
      q = query(indicationsRef, limit(1000));
    } else {
      const filters = [];
      if (isExternalSeller) filters.push(where('external_seller_uid', '==', profile.uid));
      if (isRegionalSeller) filters.push(where('standard_seller_uid', '==', profile.uid));
      if (isInternalSeller) {
        filters.push(where('internal_seller_uid', '==', profile.uid));
        if (profile.email) {
          filters.push(where('internal_seller_email', '==', profile.email.toLowerCase()));
        }
        if (profile.name) {
          filters.push(where('internal_seller_name', '==', profile.name));
        }
      }
      if (isTriagem) {
        filters.push(where('status', '==', 'pending'));
        filters.push(where('status', '==', 'triagem'));
      }

      if (filters.length > 0) {
        q = query(indicationsRef, or(...filters));
      } else {
        q = query(indicationsRef, limit(50));
      }
    }

    const processSnapshotData = async (snapshot: any) => {
      let data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Indication)).filter((ind: any) => !ind.is_deleted);
      
      // Filter leads to ensure the seller only sees theirs (extra security/resilience)
      if (isInternalSeller && !isPureExternalSeller && !isManager && !isAdmin) {
        data = data.filter(ind => {
          const isOwnerByUid = ind.internal_seller_uid === profile?.uid;
          const isOwnerByName = ind.internal_seller_name && profile?.name && 
                               ind.internal_seller_name.toLowerCase().trim() === profile.name.toLowerCase().trim();
          const isOwnerByEmail = ind.internal_seller_email && profile?.email &&
                                ind.internal_seller_email.toLowerCase().trim() === profile.email.toLowerCase().trim();
          return isOwnerByUid || isOwnerByName || isOwnerByEmail;
        });
      }

      // Additional fallback by email/name if not using OR query
      if ((isExternalSeller || isInternalSeller) && (profile?.email || profile?.name)) {
        try {
          const emailField = isExternalSeller ? 'external_seller_email' : 'internal_seller_email';
          const nameField = isExternalSeller ? 'external_seller_name' : 'internal_seller_name';
          let qF = [];
          if (profile.email) qF.push(where(emailField, '==', profile.email.toLowerCase()));
          if (profile.name) qF.push(where(nameField, '==', profile.name));
          
          if (qF.length > 0) {
            const extraSnap = await getDocs(query(indicationsRef, or(...qF)));
            const extra = extraSnap.docs.map(d => ({ id: d.id, ...d.data() } as Indication)).filter(i => !i.is_deleted);
            
            // Client-side case-insensitive match for the fallback
            const finalExtra = isInternalSeller ? extra.filter(i => {
              const isOwnerByUid = i.internal_seller_uid === profile?.uid;
              const isOwnerByName = i.internal_seller_name && profile?.name && 
                                   i.internal_seller_name.toLowerCase().trim() === profile.name.toLowerCase().trim();
              const isOwnerByEmail = i.internal_seller_email && profile?.email &&
                                    i.internal_seller_email.toLowerCase().trim() === profile.email.toLowerCase().trim();
              return isOwnerByUid || isOwnerByName || isOwnerByEmail;
            }) : extra;

            const existingIds = new Set(data.map(i => i.id));
            const distinct = finalExtra.filter(i => !existingIds.has(i.id));
            if (distinct.length > 0) data = [...data, ...distinct];
          }
        } catch (e) {
          console.warn("Fallback leads error:", e);
        }
      }

      data.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setIndications(data);
      
      // Stats calculation...
      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();
      const monthSold = data.filter(ind => {
        if (ind.status !== 'sold' || !ind.updated_at) return false;
        const d = new Date(ind.updated_at);
        return d.getMonth() === month && d.getFullYear() === year;
      });
      const totalSalesValue = monthSold.reduce((acc, curr) => acc + (curr.base_commission_value || 0), 0);
      
      let responseTimes: number[] = [];
      let closingTimes: number[] = [];
      data.forEach(ind => {
        const start = new Date(ind.created_at);
        if (ind.status === 'sold' && ind.updated_at) {
          closingTimes.push((new Date(ind.updated_at).getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        }
        if (ind.status !== 'pending' && ind.updated_at) {
          responseTimes.push(getBusinessHoursElapsed(start, new Date(ind.updated_at)));
        }
      });

      setPerformanceData({
        monthly_sales: totalSalesValue,
        monthly_leads: data.filter(i => new Date(i.created_at).getMonth() === month).length,
        avg_response_time: responseTimes.length > 0 ? responseTimes.reduce((a,b) => a+b,0)/responseTimes.length : 0,
        avg_closing_time: closingTimes.length > 0 ? closingTimes.reduce((a,b) => a+b,0)/closingTimes.length : 0,
      });
      setLoading(false);
    };

    // Proactive Local Loading: Try cache first (User decentralized vision)
    getDocsFromCache(q).then(snapshot => {
      if (!snapshot.empty) {
        processSnapshotData(snapshot);
      }
    }).catch(() => {});

    const unsubscribeIndications = onSnapshot(q, processSnapshotData, (error) => {
      console.error("Snapshot error (indications):", error);
      
      if (error.message.includes('quota') || error.message.includes('Quota')) {
        getDocsFromCache(q).then(processSnapshotData).catch(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribeIndications();
  }, [profile?.uid, profile?.role, isAdmin, isManager, isExternalSeller, isInternalSeller, isTriagem]);

  // 6. Commissions
  useEffect(() => {
    if (!profile?.uid) return;
    const qComm = (isAdmin || isManager || isTriagem) 
      ? query(collection(db, 'commissions'), orderBy('created_at', 'desc'), limit(200))
      : query(collection(db, 'commissions'), where('external_seller_uid', '==', profile.uid));
    const unsubscribe = onSnapshot(qComm, (snap) => {
      setCommissions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commission)));
    }, (err) => console.error("Commissions error:", err));
    return () => unsubscribe();
  }, [profile?.uid, isAdmin, isManager, isTriagem]);

  // 7. Fairs
  useEffect(() => {
    if (!profile?.uid) return;
    // Removido orderBy para evitar necessidade de índices compostos em produção
    const unsubscribe = onSnapshot(collection(db, 'fairs'), (snap) => {
      const fairsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fair));
      // Ordenar na memória
      fairsData.sort((a, b) => new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime());
      setFairs(fairsData);
    }, (err) => console.error("Fairs error:", err));
    return () => unsubscribe();
  }, [profile?.uid]);

  // 7.5. Endomarketing Actions
  useEffect(() => {
    if (!profile?.uid) return;
    const unsubscribe = onSnapshot(collection(db, 'endomarketing_actions'), (snap) => {
      const actionsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEndoActions(actionsData);
    }, (err) => console.error("Endomarketing actions error in Dashboard:", err));
    return () => unsubscribe();
  }, [profile?.uid]);

  // Fetch all users to map role to UID
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        setUsersList(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
      } catch (e) {
        console.error("Error fetching users inside dashboard mounts:", e);
      }
    };
    fetchUsers();
  }, []);

  // 8. Fetch latest 4 completed evaluations
  useEffect(() => {
    if (!profile?.uid) return;
    const canSeeEvaluations = isAdmin || isManager || isTriagem || profile?.email === 'rogerio@roderbrasil.com.br';
    if (!canSeeEvaluations) return;

    const qEval = query(
      collection(db, 'customer_evaluations'),
      orderBy('created_at', 'desc')
    );

    const unsubEval = onSnapshot(qEval, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          ...data,
          evaluated_at: data.evaluated_at?.toDate ? data.evaluated_at.toDate() : (data.evaluated_at ? new Date(data.evaluated_at) : null),
          created_at: data.created_at?.toDate ? data.created_at.toDate() : (data.created_at ? new Date(data.created_at) : null),
        });
      });

      // Filter for active completed ones, sort by evaluated_at descending
      const completed = list
        .filter(ev => ev.status === 'completed')
        .sort((a, b) => {
          const tA = a.evaluated_at ? a.evaluated_at.getTime() : (a.created_at ? a.created_at.getTime() : 0);
          const tB = b.evaluated_at ? b.evaluated_at.getTime() : (b.created_at ? b.created_at.getTime() : 0);
          return tB - tA;
        })
        .slice(0, 4);

      setLatestEvaluations(completed);
    }, (error) => {
      console.error("Error listening to customer_evaluations on dashboard:", error);
    });

    return () => unsubEval();
  }, [profile?.uid, isAdmin, isManager, isTriagem]);

  useEffect(() => {
    if (highlightedProducts.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % highlightedProducts.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [highlightedProducts]);

  // Helper to check if a date is within business hours
  // Mon-Fri, 07:00-17:00, excluding 12:00-13:00
  const isBusinessHour = (date: Date) => {
    const day = date.getDay();
    if (day === 0 || day === 6) return false; // Weekend
    
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const time = hours + minutes / 60;
    
    const isWorkingTime = time >= 7 && time < 17;
    const isLunchBreak = time >= 12 && time < 13;
    
    return isWorkingTime && !isLunchBreak;
  };

  // Helper to calculate business hours elapsed between two dates
  const getBusinessHoursElapsed = (start: Date, end: Date) => {
    let elapsedMs = 0;
    let current = new Date(start);
    
    // Step by 15-minute intervals for accuracy
    const step = 15 * 60 * 1000;
    
    while (current < end) {
      if (isBusinessHour(current)) {
        elapsedMs += step;
      }
      current = new Date(current.getTime() + step);
    }
    
    return elapsedMs / (1000 * 60 * 60); // Returns hours
  };

  // NEW: Lead Auto-Assignment Logic (4h business hours timeout)
  useEffect(() => {
    if (!isAdmin && !isManager && !isTriagem) return;
    
    const checkAndAutoAssign = async () => {
      try {
        const now = new Date();
        
        // Find indications pending triage
        const qStale = query(
          collection(db, 'indications'), 
          where('status', '==', 'pending')
        );
        
        const staleSnap = await getDocs(qStale);
        const staleDocs = staleSnap.docs.filter(doc => {
          const data = doc.data();
          const createdAt = new Date(data.created_at);
          const hoursElapsed = getBusinessHoursElapsed(createdAt, now);
          return hoursElapsed >= 4 && !data.internal_seller_uid;
        });

        // Find fair leads pending triage
        const qFairStale = query(
          collection(db, 'fair_leads'),
          where('status', '==', 'pending')
        );
        const fairStaleSnap = await getDocs(qFairStale);
        const fairStaleDocs = fairStaleSnap.docs.filter(doc => {
          const data = doc.data();
          // Excluir parceiros e fornecedores da auto-atribuição da triagem comercial
          if (data.type && data.type !== 'client') return false;
          const createdAt = new Date(data.created_at);
          const hoursElapsed = getBusinessHoursElapsed(createdAt, now);
          return hoursElapsed >= 4 && !data.assigned_seller_uid;
        });

        if (staleDocs.length === 0 && fairStaleDocs.length === 0) return;

        // Fetch eligible sellers
        const qSellers = query(
          collection(db, 'users'), 
          where('role', '==', 'internal_seller'), 
          where('is_lead_receiver', '==', true)
        );
        const sellersSnap = await getDocs(qSellers);
        
        // Helper to get local date in YYYY-MM-DD
        const getTodayDateString = () => {
          const d = new Date();
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        const todayStr = getTodayDateString();

        const sellers = sellersSnap.docs
          .map(d => {
            const data = d.data();
            return { 
              uid: d.id, 
              name: data.name,
              vacation_start: data.vacation_start,
              vacation_end: data.vacation_end
            };
          })
          .filter(s => {
            // Filter out sellers currently on vacation
            if (s.vacation_start && s.vacation_end) {
              return !(todayStr >= s.vacation_start && todayStr <= s.vacation_end);
            }
            return true;
          });

        if (sellers.length === 0) return;

        // Process Indications
        for (const leadDoc of staleDocs) {
          const leadData = leadDoc.data();
          let targetSeller = null;

          // Check if client is already served (by phone or name)
          const qExisting = query(
            collection(db, 'indications'),
            where('client_phone', '==', leadData.client_phone)
          );
          const existingSnap = await getDocs(qExisting);
          const existingSellers = existingSnap.docs
            .map(d => d.data().internal_seller_uid)
            .filter(Boolean);
          
          if (existingSellers.length > 0) {
            targetSeller = sellers.find(s => s.uid === existingSellers[0]);
          }

          if (!targetSeller) {
            targetSeller = sellers[Math.floor(Math.random() * sellers.length)];
          }

          if (targetSeller) {
            await updateDoc(doc(db, 'indications', leadDoc.id), {
              internal_seller_uid: targetSeller.uid,
              internal_seller_name: targetSeller.name,
              status: 'negotiating',
              updated_at: new Date().toISOString(),
              auto_assigned: true,
              assignment_method: 'automated_timeout'
            });

            // Notify the assigned internal seller
            await addDoc(collection(db, 'notifications'), {
              user_uid: targetSeller.uid,
              title: 'Novo Lead Atribuído (Automático)',
              message: `Você recebeu um novo lead por limite de tempo: ${leadData.client_name}`,
              type: 'info',
              read: false,
              link: '/indicacoes?filter=negotiating',
              created_at: new Date().toISOString()
            });

            // Notify the indicator (external seller) via in-app notification
            if (leadData.external_seller_uid) {
              await addDoc(collection(db, 'notifications'), {
                user_uid: leadData.external_seller_uid,
                title: 'Lead em Atendimento',
                message: `Sua indicação para ${leadData.client_name} foi encaminhada automaticamente para o setor comercial e já está em atendimento.`,
                type: 'success',
                read: false,
                link: '/indicacoes',
                created_at: new Date().toISOString()
              });
            }

            // Trigger bidirectional email notifications
            try {
              const sSnap = await getDoc(doc(db, 'users', targetSeller.uid));
              let sellerEmail = '';
              let sellerPhone = '';
              if (sSnap.exists()) {
                const sData = sSnap.data();
                sellerEmail = sData.email || '';
                sellerPhone = sData.phone || '';
              }

              let partnerName = 'Parceiro';
              let partnerEmail = '';
              let partnerPhone = '';
              if (leadData.external_seller_uid) {
                const pSnap = await getDoc(doc(db, 'users', leadData.external_seller_uid));
                if (pSnap.exists()) {
                  const pData = pSnap.data();
                  partnerName = pData.name || 'Parceiro';
                  partnerEmail = pData.email || '';
                  partnerPhone = pData.phone || '';
                }
              }

              if (sellerEmail) {
                const { notifyLeadAssignment } = await import('../services/emailService');
                await notifyLeadAssignment(
                  { id: leadDoc.id, ...leadData },
                  { name: targetSeller.name, email: sellerEmail, phone: sellerPhone },
                  { name: partnerName, email: partnerEmail, phone: partnerPhone }
                );
              }
            } catch (autoEmailErr) {
              console.error("Error triggering auto-assignment emails:", autoEmailErr);
            }
          }
        }

        // Process Fair Leads
        for (const fairDoc of fairStaleDocs) {
            let targetSeller = sellers[Math.floor(Math.random() * sellers.length)];
            
            if (targetSeller) {
                await updateDoc(doc(db, 'fair_leads', fairDoc.id), {
                    assigned_to_uid: targetSeller.uid,
                    assigned_to_name: targetSeller.name,
                    status: 'forwarded',
                    updated_at: new Date().toISOString(),
                    auto_assigned: true,
                    assignment_method: 'automated_timeout'
                });
            }
        }
      } catch (err) {
        console.error("Auto-assign error:", err);
      }
    };

    checkAndAutoAssign();
    const interval = setInterval(checkAndAutoAssign, 15 * 60 * 1000); // Check every 15 mins
    return () => clearInterval(interval);
  }, [isAdmin, isManager, isTriagem]);

  useEffect(() => {
    // Safety timeout to ensure loading always finishes
    const timer = setTimeout(() => {
      setLoading(false);
    }, 8000); // Increased to 8s for slower mobile connections

    setMounted(true);
    return () => clearTimeout(timer);
  }, []);

  const isCommissionableUserMap = React.useMemo(() => {
    const map: Record<string, boolean> = {};
    usersList.forEach(u => {
      map[u.uid] = u.role === 'external_seller';
    });
    return map;
  }, [usersList]);

  const missingBaseCommissionList = React.useMemo(() => {
    return indications.filter(i => {
      if (!i || i.status !== 'negotiating') return false;
      if (i.external_seller_uid && isCommissionableUserMap[i.external_seller_uid] === false) {
        return false;
      }
      return (!i.base_commission_value || i.base_commission_value <= 0);
    });
  }, [indications, isCommissionableUserMap]);

  // Optimize counts and basic info
  const paidTotal = React.useMemo(() => commissions.filter(c => c && c.status === 'paid').reduce((acc, curr) => acc + (curr.value || 0), 0), [commissions]);
  const pendingTotal = React.useMemo(() => commissions.filter(c => c && (c.status === 'pending' || c.status === 'waiting_nf')).reduce((acc, curr) => acc + (curr.value || 0), 0), [commissions]);
  const waitingPaymentTotal = React.useMemo(() => commissions.filter(c => c && c.status === 'waiting_payment').reduce((acc, curr) => acc + (curr.value || 0), 0), [commissions]);

  const negotiatingTotal = React.useMemo(() => {
    const defaultRate = profile?.commission_rate || 2;
    return indications
      .filter(i => {
        if (!i || i.status !== 'negotiating') return false;
        if (i.external_seller_uid && isCommissionableUserMap[i.external_seller_uid] === false) {
          return false;
        }
        return true;
      })
      .reduce((acc, curr) => {
        // If the indication has a specific rate applied, use it, otherwise use profile rate
        const rate = curr.commission_rate_applied || defaultRate;
        const baseValue = curr.base_commission_value || 0;
        
        // Apply discount if defined
        const discount = curr.discount_percentage ? (baseValue * (curr.discount_percentage / 100)) : 0;
        const commissionableValue = baseValue - discount;
        
        return acc + (commissionableValue * (rate / 100));
      }, 0);
  }, [indications, profile]);

  const activeFair = React.useMemo(() => {
    const now = new Date();
    const activeFairs = fairs.filter(fair => {
      const start = new Date(fair.start_date);
      const end = new Date(fair.end_date);
      
      // Active if now is between start-3 days and end+3 days
      const activeStart = new Date(start);
      activeStart.setDate(start.getDate() - 3);
      
      const activeEnd = new Date(end);
      activeEnd.setDate(end.getDate() + 3);
      
      return now >= activeStart && now <= activeEnd;
    });

    if (activeFairs.length === 0) return null;

    // Priority:
    // 1. Happening right now (between start and end)
    const happeningNow = activeFairs.find(f => {
      const s = new Date(f.start_date);
      const e = new Date(f.end_date);
      return now >= s && now <= e;
    });
    if (happeningNow) return happeningNow;

    // 2. Starting soon (upcoming)
    const upcoming = activeFairs
      .filter(f => now < new Date(f.start_date))
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0];
    if (upcoming) return upcoming;

    // 3. Just finished
    return activeFairs
      .filter(f => now > new Date(f.end_date))
      .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];
  }, [fairs]);

  const stats = React.useMemo(() => [
    { 
      title: 'Total de Indicações', 
      value: indications.length, 
      icon: TrendingUp, 
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      help: 'Total acumulado de todas as indicações enviadas para o sistema.'
    },
    { 
      title: 'Em Negociação', 
      value: indications.filter(i => i.status === 'negotiating').length, 
      icon: Clock, 
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      help: 'Indicações que já passaram pela triagem e estão sendo trabalhadas pelo comercial.'
    },
    { 
      title: 'Vendas Concluídas', 
      value: indications.filter(i => i.status === 'sold').length, 
      icon: CheckCircle2, 
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      help: 'Negociações finalizadas com sucesso e que gerarão comissão.'
    },
    { 
      title: 'Pendentes', 
      value: indications.filter(i => i.status === 'pending').length, 
      icon: AlertCircle, 
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      help: 'Novas indicações aguardando a primeira análise (triagem).'
    },
  ], [indications]);

  if (!mounted || (!profile && loading)) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Carregando Dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Olá, {(profile?.name || (user?.email === 'comercial@ff.ind.br' ? 'Fábio' : user?.displayName || 'Equipe Roder')).replace('Jefferson', 'Jeferson')}!
            </h1>
            <p className="text-lg text-muted-foreground">Bem-vindo à sua central de comando do RODER Indica V2.</p>
          </div>
        </div>



        {/* Product Banners */}
        {highlightedProducts.length > 0 && (isAdmin || isManager || isInternalSeller || isExternalSeller) && 
        (!profile?.permissions?.dashboard_cards || profile.permissions.dashboard_cards.equipment_banner !== false) && (
          <div className="relative overflow-hidden w-full h-[180px] sm:h-[220px] rounded-3xl shadow-xl border border-border group bg-slate-900">
            <AnimatePresence mode="wait">
              <motion.div
                key={highlightedProducts[currentBannerIndex].id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 flex"
              >
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-[40%] h-full bg-primary/20 blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[30%] h-full bg-blue-500/10 blur-[80px] pointer-events-none" />

                <div className="relative flex-1 flex items-center justify-between p-4 xs:p-6 sm:p-8 md:p-12 gap-3 xs:gap-6 md:gap-8">
                  <div className="flex-1 space-y-2 xs:space-y-3 z-10">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center gap-1.5 xs:gap-2"
                    >
                      <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-[8px] xs:text-[10px] font-bold uppercase tracking-widest text-primary/80">Equipamento em Destaque</span>
                    </motion.div>
                    
                    <motion.h2 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-base xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-tighter text-white leading-tight line-clamp-2"
                    >
                      {highlightedProducts[currentBannerIndex].name}
                    </motion.h2>
                    
                    {highlightedProducts[currentBannerIndex].banner_message && (
                      <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-slate-400 text-[10px] xs:text-xs sm:text-sm md:text-base font-medium max-w-lg line-clamp-1 xs:line-clamp-2"
                      >
                        {highlightedProducts[currentBannerIndex].banner_message}
                      </motion.p>
                    )}

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="pt-1.5 xs:pt-3 md:pt-4"
                    >
                      <Button 
                        onClick={() => navigate('/catalogo', { state: { openProductId: highlightedProducts[currentBannerIndex].id } })}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase text-[9px] xs:text-[10px] tracking-widest h-8 xs:h-9 md:h-10 px-3 xs:px-4 md:px-8 gap-1.5 xs:gap-2 group-hover:scale-105 transition-transform"
                      >
                        Ver no Catálogo
                        <ArrowRight className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                      </Button>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="relative w-[100px] h-[100px] xs:w-[120px] xs:h-[120px] sm:w-[140px] sm:h-[140px] md:w-[180px] md:h-[180px] shrink-0 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center p-2 overflow-hidden shadow-2xl backdrop-blur-sm"
                  >
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl transform scale-75 pointer-events-none" />
                    <DashboardBannerImage 
                      src={highlightedProducts[currentBannerIndex].image_url} 
                      alt={highlightedProducts[currentBannerIndex].name}
                      className="w-full h-full object-contain relative z-10 drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)] transition-transform duration-500 group-hover:scale-105"
                    />
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Dots */}
            {highlightedProducts.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {highlightedProducts.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentBannerIndex(i)}
                    className={cn(
                      "h-1 rounded-full transition-all duration-500",
                      currentBannerIndex === i ? "w-8 bg-primary" : "w-2 bg-slate-700 hover:bg-slate-600"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dashboard Content */}
        {profile && (isPureExternalSeller || isExternalSeller || isRegionalSeller || profile?.role === 'external_seller' || profile?.role === 'vendedor_padrao') ? (
          <div className="space-y-6">
            {/* Completion Alert */}
            {isExternalSeller && (!profile?.email || !profile?.pix_key) && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="p-1.5 rounded-full bg-amber-500 text-white shrink-0">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-amber-600 text-sm">Complete seu Cadastro!</p>
                    <p className="text-[10px] text-amber-700/70 leading-tight">
                      {!profile?.email || !profile?.pix_key 
                        ? 'Preencha seu e-mail e chave PIX para comissões.' 
                        : !profile?.email ? 'Seu e-mail é importante.' 
                        : 'Chave PIX obrigatória.'}
                    </p>
                  </div>
                </div>
                <Link to="/perfil" className="w-full sm:w-auto">
                  <Button size="sm" variant="outline" className="w-full border-amber-500 text-amber-600 hover:bg-amber-500/10 font-bold uppercase text-[9px] tracking-widest px-4 h-8">
                    Completar
                  </Button>
                </Link>
              </motion.div>
            )}

            {/* Quick Actions - Top Priority for External */}
            {showQuickActions && (
              <div className={cn("grid gap-1 md:gap-4 pb-2 overflow-hidden px-0.5", isRegionalSeller ? "grid-cols-4" : "grid-cols-5")}>
                <QuickActionCard 
                  title="Nova Indicação" 
                  icon={PlusCircle} 
                  color="bg-green-600" 
                  link="/indicacoes/nova" 
                  isExternal={true}
                />
                <QuickActionCard 
                  title="Estoque" 
                  icon={Share2} 
                  color="bg-orange-600" 
                  link="/estoque" 
                />
                <QuickActionCard 
                  title="Catálogo" 
                  icon={BookOpen} 
                  color="bg-blue-500" 
                  link="/catalogo" 
                />
                <QuickActionCard 
                  title={isExternalSeller ? "Minhas Indicações" : "Minhas Vendas"} 
                  icon={Filter} 
                  color="bg-orange-500" 
                  link="/indicacoes" 
                />
                {!isRegionalSeller && (
                  isInternalSeller ? (
                    <QuickActionCard 
                      title="Central de Negócios" 
                      icon={Briefcase} 
                      color="bg-yellow-500" 
                      link="/indicacoes" 
                    />
                  ) : (
                    <QuickActionCard 
                      title="Comissões" 
                      icon={DollarSign} 
                      color="bg-yellow-500" 
                      link="/comissoes" 
                    />
                  )
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Active Indications Card - Highly requested by users */}
              {showRecentIndications && (
                <Card className="bg-card border-border shadow-sm border-l-4 border-l-blue-500 overflow-hidden flex flex-col h-full">
                <CardHeader className="p-3 pb-1 bg-muted/20">
                  <CardTitle className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardList className="h-3.5 w-3.5 text-blue-500" /> Minhas Indicações
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto no-scrollbar max-h-[160px]">
                    {indications.length === 0 ? (
                      <div className="p-6 text-center text-[9px] text-muted-foreground italic">
                        Nenhuma indicação realizada.
                      </div>
                    ) : (
                      <div className="divide-y divide-border/10">
                        {indications.map((ind) => (
                           <div key={ind.id} className="p-2 hover:bg-muted/30 transition-colors">
                             <div className="flex justify-between items-center gap-2">
                               <p className="text-[10px] font-bold uppercase text-foreground truncate">{ind.client_name}</p>
                               <span className={cn(
                                 "text-[7px] font-black uppercase shrink-0 py-0.5 px-1.5 rounded",
                                 ind.status === 'sold' && "text-green-600 bg-green-500/10",
                                 ind.status === 'negotiating' && "text-orange-600 bg-orange-500/10",
                                 ind.status === 'pending' && "text-yellow-600 bg-yellow-500/10",
                                 ind.status === 'cancelled' && "text-red-600 bg-red-500/10"
                               )}>
                                 {ind.status === 'pending' ? 'Pendente' : 
                                  ind.status === 'negotiating' ? 'Andamento' :
                                  ind.status === 'sold' ? 'Vendido' : 'Cancelado'}
                               </span>
                             </div>
                             <p className="text-[8px] text-muted-foreground font-normal truncate opacity-70 mt-0.5">{ind.base_machine}</p>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
                <Link to="/indicacoes" className="block border-t border-border/30 bg-muted/10">
                  <Button variant="ghost" className="w-full h-8 text-[8px] font-normal uppercase text-muted-foreground hover:text-foreground">
                    Ver Histórico Completo
                  </Button>
                </Link>
              </Card>
              )}

              {/* Goals Card - Motivation */}
              {showGoals && !isRegionalSeller && (
                <Card className="bg-card border-border shadow-sm flex flex-col h-full overflow-hidden border-l-4 border-l-yellow-500">
                <CardHeader className="p-3 pb-1 border-b border-border/30 bg-muted/20">
                  <CardTitle className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-yellow-600" /> Comissões Previstas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex-1 flex flex-col justify-center gap-3">
                  <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10 shadow-sm">
                    <p className="text-[9px] text-orange-600 font-black uppercase flex items-center gap-1.5">
                      <Timer className="h-3 w-3" /> Comissões em Negociação
                    </p>
                    <h4 className="text-xl font-black text-orange-600 mt-1 italic">R$ {negotiatingTotal.toLocaleString('pt-BR')}</h4>
                    <p className="text-[7px] text-muted-foreground mt-1 uppercase font-bold">* Potencial de ganho estimado</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                      <p className="text-[8px] text-green-600 font-bold uppercase">Já Recebido</p>
                      <h4 className="text-sm font-bold text-green-600 mt-1 italic">R$ {paidTotal.toLocaleString('pt-BR')}</h4>
                    </div>
                    <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                      <p className="text-[8px] text-orange-600 font-bold uppercase">Pendente</p>
                      <h4 className="text-sm font-bold text-orange-600 mt-1 italic">R$ {pendingTotal.toLocaleString('pt-BR')}</h4>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <p className="text-[8px] text-blue-600 font-bold uppercase tracking-tight">Aguardando Pagamento</p>
                    <h4 className="text-sm font-bold text-blue-600 mt-1 italic">R$ {waitingPaymentTotal.toLocaleString('pt-BR')}</h4>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Recent Quality Surveys Card (Visible for Admin, Manager, Triagem or Rogerio) */}
              {(isAdmin || isManager || isTriagem || profile?.email === 'rogerio@roderbrasil.com.br') && (
                <Card className="bg-card border-border shadow-sm flex flex-col h-full overflow-hidden border-l-4 border-l-amber-500 animate-in fade-in duration-300">
                  <CardHeader className="p-3 pb-1 border-b border-border/10 bg-muted/20">
                    <CardTitle className="text-[10px] font-black uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> Pesquisas de Qualidade
                      </span>
                      <Link to="/comercial/avaliacoes">
                        <Button variant="ghost" className="h-6 text-[8px] font-normal uppercase text-primary p-0 px-2 hover:bg-transparent">Ver Todas</Button>
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 overflow-hidden">
                    <div className="h-full overflow-y-auto no-scrollbar max-h-[280px] divide-y divide-border/10">
                      {latestEvaluations.length === 0 ? (
                        <div className="p-8 text-center text-[9px] text-muted-foreground italic flex flex-col items-center justify-center gap-2 h-full">
                          <Star className="h-8 w-8 text-muted-foreground/20" />
                          <span>Nenhuma pesquisa respondida ainda.</span>
                        </div>
                      ) : (
                        latestEvaluations.map((ev) => {
                          const avgVal = ((ev.rating_product || 0) + (ev.rating_service || 0) + (ev.rating_delivery || 0) + (ev.rating_technical || 0)) / 4;
                          const isBad = avgVal < 3 || ev.rating_product < 3 || ev.rating_service < 3 || ev.rating_delivery < 3 || ev.rating_technical < 3;
                          return (
                            <div 
                              key={ev.id} 
                              className={`p-3 hover:bg-muted/30 transition-colors cursor-pointer ${isBad ? 'border-l-2 border-l-red-500 bg-red-500/5' : ''}`}
                              onClick={() => navigate(`/comercial/avaliacoes?id=${ev.id}`)}
                            >
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <p className="text-[10px] font-bold uppercase text-foreground truncate max-w-[65%]">{ev.client_name}</p>
                                <div className="flex gap-0.5 shrink-0 mt-0.5">
                                  {Array.from({ length: 5 }).map((_, sIdx) => {
                                    const starNum = sIdx + 1;
                                    return (
                                      <Star 
                                        key={starNum} 
                                        className={`h-2.5 w-2.5 ${starNum <= Math.round(avgVal) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-700'}`} 
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-[8px] text-muted-foreground">
                                <span className="font-semibold text-orange-500 truncate max-w-[130px]">Equip: {ev.equipment_name}</span>
                                <span className="font-mono">{ev.evaluated_at ? new Date(ev.evaluated_at).toLocaleDateString() : ''}</span>
                              </div>
                              {ev.comments && (
                                <p className="text-[8px] text-muted-foreground italic mt-1 line-clamp-1 opacity-80 leading-snug">&ldquo;{ev.comments}&rdquo;</p>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Fairs Section for External */}
              {shouldShowOnlyFairsCard && (
                <Card className="bg-card border-border shadow-sm border-t-4 border-t-primary flex flex-col h-full overflow-hidden">
                  <CardHeader className="p-4 pb-2 border-b border-border/30 bg-muted/20">
                    <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-primary">
                        <Building2 className="h-5 w-5" /> Próximas Feiras e Eventos
                      </div>
                      <Badge className="text-xs h-5 bg-primary/10 text-primary border-primary/20">
                        {upcomingFairs.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 overflow-hidden">
                    <div className="overflow-y-auto no-scrollbar max-h-[300px]">
                      {upcomingFairs.length === 0 ? (
                        <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-2">
                          <Building2 className="h-10 w-10 text-muted-foreground/30" />
                          <p className="text-sm text-slate-500 dark:text-slate-400 italic font-medium">Nenhuma feira planejada ou ativa.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border/10">
                          {upcomingFairs.slice(0, 5).map((fair) => {
                            const startStr = fair.start_date ? new Date(fair.start_date + "T12:00:00").toLocaleDateString('pt-BR') : '-';
                            const endStr = fair.end_date ? new Date(fair.end_date + "T12:00:00").toLocaleDateString('pt-BR') : '-';
                            return (
                              <div key={fair.id} className="p-4 hover:bg-muted/30 transition-colors flex items-start gap-4 justify-between">
                                <div className="space-y-1 min-w-0 flex-1">
                                  <h4 className="text-xs font-bold text-foreground uppercase truncate">{fair.name}</h4>
                                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 leading-normal">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" /> {fair.location}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground pt-0.5">
                                    Status: <span className={cn(
                                      "font-semibold uppercase text-xs",
                                      fair.status === 'active' ? "text-green-600 bg-green-500/10 px-1 rounded" : "text-amber-600 bg-amber-500/10 px-1 rounded"
                                    )}>{fair.status === 'active' ? 'Ativa' : 'Planejada'}</span>
                                  </p>
                                </div>
                                <div className="text-right shrink-0 flex flex-col gap-1 items-end">
                                  <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded font-bold whitespace-nowrap">{startStr} - {endStr}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <Link to="/feiras" className="block border-t border-border/30 bg-muted/10">
                    <Button variant="ghost" className="w-full h-11 text-[11px] font-bold uppercase text-primary hover:text-primary/95 tracking-wider">
                      Gerenciar Feiras
                    </Button>
                  </Link>
                </Card>
              )}
            </div>
          </div>
        ) : (!isAdmin && !isManager && (isInternalSeller || isTriagem || isFinancial || isMarketing || isFiscal || profile?.role === 'financial' || profile?.role === 'internal_seller' || profile?.role === 'triagem' || profile?.role === 'marketing' || profile?.role === 'fiscal')) ? (
          /* Dashboard for Internal/Management Roles */
          <>
            <div className="space-y-6">
            {/* Quick Actions for Internal/Management */}
            {showQuickActions && (
              <div className="grid grid-cols-4 gap-1 md:gap-4 pb-2 px-0.5">
                <QuickActionCard 
                  title="Nova Indicação" 
                  icon={PlusCircle} 
                  color="bg-green-600" 
                  link="/indicacoes/nova" 
                />
                <QuickActionCard 
                  title="Estoque Roder" 
                  icon={Share2} 
                  color="bg-orange-600" 
                  link="/estoque" 
                />
                <QuickActionCard 
                  title="Catálogo de Equipamentos" 
                  icon={BookOpen} 
                  color="bg-blue-500" 
                  link="/catalogo" 
                />
                <QuickActionCard 
                  title="Centro de Negócios" 
                  icon={Filter} 
                  color="bg-orange-500" 
                  link="/indicacoes" 
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card for leads waiting for quote (Internal Seller focus) */}
              {showRecentIndications && (
                <Card className="bg-card border-border shadow-sm border-l-4 border-l-orange-500 overflow-hidden flex flex-col h-full animate-pulse-subtle">
                <CardHeader className="p-4 pb-2 bg-muted/20">
                  <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-5 w-5 text-orange-500" /> Leads para Orçamentos
                    </div>
                    <Badge className="text-xs h-5 bg-orange-500/10 text-orange-600 border-orange-500/20">
                      {missingBaseCommissionList.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto no-scrollbar max-h-[280px]">
                    {missingBaseCommissionList.length === 0 ? (
                      <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                        <CheckCircle2 className="h-10 w-10 text-green-500/20" />
                        <p className="text-sm text-muted-foreground italic font-medium">Nenhum orçamento pendente!</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/10">
                        {missingBaseCommissionList
                          .map((ind) => (
                             <div key={ind.id} className="p-4 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/indicacoes?id=${ind.id}`)}>
                               <div className="flex justify-between items-start mb-1.5">
                                 <p className="text-xs font-normal uppercase text-foreground truncate max-w-[70%]">{ind.client_name}</p>
                                 <span className="text-[9px] font-normal text-orange-600 bg-orange-500/10 px-1.5 py-0.5 rounded uppercase">Aguardando Valor</span>
                               </div>
                               <div className="flex items-center justify-between">
                                 <p className="text-[11px] text-muted-foreground font-normal truncate leading-tight">{ind.base_machine}</p>
                                 <span className="text-[10px] text-muted-foreground font-mono font-normal">{new Date(ind.created_at).toLocaleDateString()}</span>
                               </div>
                             </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
                <Link to="/indicacoes?filter=missing_base" className="block border-t border-border/30 bg-muted/10">
                  <Button variant="ghost" className="w-full h-12 text-xs font-normal uppercase text-primary hover:text-primary/80">
                    Ir para Gestão de Vendas
                  </Button>
                </Link>
              </Card>
              )}

              {showGoals && (
                <Card className="bg-card border-border shadow-sm border-l-4 border-l-green-500 overflow-hidden flex flex-col h-full">
                <CardHeader className="p-3 pb-1 bg-muted/20">
                  <CardTitle className="text-sm lg:text-base font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="h-5 w-5 text-green-500" /> Minhas Metas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 flex-1 flex flex-col justify-center space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[12px] lg:text-[13px] text-muted-foreground font-normal uppercase tracking-widest leading-none">Progresso Financeiro</p>
                      <h4 className="text-3xl lg:text-4xl font-normal text-foreground tracking-tighter">
                        {Math.min(100, Math.round((performanceData.monthly_sales / (goals.monthly_revenue || 1)) * 100))}%
                      </h4>
                    </div>
                    <div className="p-2.5 rounded-xl bg-green-500/10 text-green-600 shadow-inner">
                      <TrendingUp className="h-6 w-6 lg:h-7 lg:w-7" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (performanceData.monthly_sales / (goals.monthly_revenue || 1)) * 100)}%` }}
                        className="h-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                      />
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm lg:text-base font-normal text-green-600">R$ {performanceData.monthly_sales.toLocaleString()}</span>
                      <span className="text-[10px] lg:text-[11px] text-muted-foreground uppercase font-normal tracking-wider">Meta: R$ {goals.monthly_revenue?.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
                </Card>
              )}

              {/* Reservations Card */}
              {profile && !(isFinancial || isFiscal) && showReservations && (
                <Card className="bg-card border-border shadow-sm flex flex-col h-full overflow-hidden">
                <CardHeader className="p-3 pb-1 border-b border-border/30 bg-muted/20">
                  <CardTitle className="text-[12px] lg:text-[13px] font-black uppercase tracking-wider flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-green-500" /> Reservas Ativas
                    </div>
                    <Badge className="text-[10px] lg:text-[11px] h-4.5 bg-green-500/10 text-green-600 border-green-500/20">{reservations.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto no-scrollbar max-h-[220px]">
                    {reservations.length === 0 ? (
                      <div className="p-10 text-center text-[10px] lg:text-[11px] text-muted-foreground italic font-normal">
                        Nenhuma reserva ativa no momento.
                      </div>
                    ) : (
                      <div className="divide-y divide-border/30">
                        {reservations.slice(0, 15).map((res, i) => {
                          const creationDate = res.created_at?.toDate ? res.created_at.toDate() : new Date(res.created_at || Date.now());
                          const diffTime = Math.abs(new Date().getTime() - creationDate.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          const daysRemaining = Math.max(0, 5 - (diffDays - 1));
                          const displayDays = isNaN(daysRemaining) ? 0 : daysRemaining;

                          return (
                            <div key={i} className="p-3 hover:bg-muted/30 transition-colors flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-[8px] lg:text-[9px] font-normal text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm truncate shrink-0">#{res.item_code || 'S/C'}</span>
                                  <p className="text-[10px] lg:text-[11px] font-normal uppercase truncate leading-none text-foreground">{res.product_name}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                  <p className="text-[8px] lg:text-[9px] text-muted-foreground truncate font-normal flex items-center gap-1.5">
                                    <Users className="h-3 w-3" /> 
                                    <span className="font-normal text-orange-500 uppercase">{res.seller_name || 'Externo'}</span>
                                  </p>
                                  <Badge className={cn(
                                    "text-[7px] lg:text-[9px] h-4 px-2 font-normal uppercase shadow-sm border-none",
                                    displayDays <= 1 ? "bg-red-500 text-white" : "bg-blue-500 text-white"
                                  )}>
                                    {displayDays} {displayDays === 1 ? 'dia' : 'dias'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
                <Link to="/estoque" className="block border-t border-border/30 bg-muted/10">
                  <Button variant="ghost" className="w-full h-10 text-[10px] lg:text-[11px] font-black uppercase text-muted-foreground hover:text-foreground tracking-widest">
                    Ver Estoque Completo
                  </Button>
                </Link>
                </Card>
              )}

              {/* Fairs Section for Internal */}
              {profile && !(isFinancial || isFiscal) && (
                <Card className="bg-card border-border shadow-sm flex flex-col h-full overflow-hidden border-l-4 border-l-primary animate-in fade-in zoom-in duration-500">
                  <CardHeader className="p-3 pb-1 border-b border-border/30 bg-muted/20">
                    <CardTitle className="text-[10px] font-black uppercase tracking-wider flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-primary" /> Eventos e Feiras
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 flex-1 flex flex-col justify-center gap-3">
                    {activeFair ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                            <Zap className="h-6 w-6 animate-pulse" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black uppercase truncate tracking-tight">{activeFair.name}</p>
                            <p className="text-[10px] text-muted-foreground font-normal truncate flex items-center gap-1">
                              <MapPin className="h-2.5 w-2.5" /> {activeFair.location}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                          <a 
                            href={`/cadastro-rapido?fairId=${activeFair.id}&sellerName=${encodeURIComponent(profile?.name || '')}&sellerEmail=${encodeURIComponent(profile?.email || '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full"
                          >
                            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-widest h-12 flex items-center justify-center gap-3 shadow-lg shadow-primary/20 group">
                              <PlusCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                              Cadastro Rápido
                            </Button>
                          </a>
                          <Link to={`/feiras/${activeFair.id}`}>
                            <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/5 font-black uppercase text-[10px] tracking-widest h-10">
                              Acessar Central do Evento
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                          <Calendar className="h-6 w-6 opacity-30" />
                        </div>
                        <p className="text-xs font-black uppercase text-muted-foreground mb-1 tracking-tight">Nenhuma feira ativa agora</p>
                        <p className="text-[10px] text-muted-foreground/60 max-w-[150px] mx-auto mb-4">O cadastro rápido abre 5 dias antes dos eventos.</p>
                        
                        {fairs.length > 0 ? (
                          <div className="w-full p-3 rounded-lg bg-muted/50 border border-border/50">
                            <p className="text-[9px] font-black uppercase text-primary/60 mb-1">Próxima: {fairs[0].name}</p>
                            <p className="text-[11px] font-bold text-foreground">{new Date(fairs[0].start_date).toLocaleDateString('pt-BR')}</p>
                          </div>
                        ) : (
                          <Link to="/feiras">
                            <Button variant="ghost" className="text-[10px] font-black uppercase text-primary">Ver Agenda Completa</Button>
                          </Link>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Evolutivo & Histórico Financeiro Card for Financial and Fiscal roles */}
              {(isFinancial || isFiscal) && (
                <Card 
                  onClick={() => setShowFinanceModal(true)}
                  className="bg-card border-border shadow-sm border-l-4 border-l-sky-500 overflow-hidden flex flex-col h-full cursor-pointer hover:border-sky-500/50 hover:bg-sky-500/[0.015] transition-all group duration-300 animate-in fade-in zoom-in duration-500"
                >
                  <CardHeader className="p-3 pb-1 bg-muted/20">
                    <CardTitle className="text-[10px] lg:text-[11px] font-black uppercase tracking-wider flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-sky-500" /> Evolutivo Financeiro
                      </div>
                      <Badge className="text-[8px] lg:text-[9px] h-4.5 bg-sky-500/10 text-sky-600 border-sky-500/20">KPIs</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <p className="text-[11px] text-muted-foreground leading-relaxed font-normal">
                        Acompanhe a saúde financeira da Roder com gráficos, análises de fechamentos, KPIs e margens.
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border uppercase font-semibold">Consolidado</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border uppercase font-semibold">Margens</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-[10px] lg:text-[11px] font-bold text-sky-500 uppercase tracking-wider group-hover:text-sky-400 gap-1.5">
                      Abrir Painel KPIs <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Seção de Próximos Eventos (Endomarketing e Feiras) para Júlia, Franciele e Financeiro */}
            {shouldShowTargetCards && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 animate-in fade-in duration-500">
                {/* Card de Endomarketing */}
                <Card className="bg-card border-border shadow-sm border-t-4 border-t-orange-600 flex flex-col h-full overflow-hidden">
                  <CardHeader className="p-4 pb-2 border-b border-border/30 bg-muted/20">
                    <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-orange-600">
                        <Zap className="h-5 w-5" /> Próximos Eventos de Endomarketing
                      </div>
                      <Badge className="text-xs h-5 bg-orange-600/10 text-orange-600 border-orange-500/20">
                        {upcomingEndoActions.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 overflow-hidden">
                    <div className="overflow-y-auto no-scrollbar max-h-[300px]">
                      {upcomingEndoActions.length === 0 ? (
                        <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-2">
                          <Calendar className="h-10 w-10 text-muted-foreground/30" />
                          <p className="text-sm text-slate-500 dark:text-slate-400 italic font-medium">Nenhum evento de Endomarketing planejado.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border/10">
                          {upcomingEndoActions.slice(0, 5).map((act) => {
                            const dateLabel = act.date_planned ? new Date(act.date_planned + "T12:00:00").toLocaleDateString('pt-BR') : '-';
                            return (
                              <div key={act.id} className="p-4 hover:bg-muted/30 transition-colors flex items-start gap-4 justify-between">
                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-xs font-bold text-foreground uppercase truncate max-w-[200px]">{act.name}</h4>
                                    <Badge className="text-[9px] px-1.5 py-0.5 bg-orange-50/10 text-orange-600 border-none shrink-0 font-bold uppercase">{act.category}</Badge>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground line-clamp-1">{act.objective || 'Sem objetivo descrito'}</p>
                                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-0.5 flex-wrap">
                                    <span className="font-semibold text-orange-600">Resp: {act.responsible_name || 'N/A'} ({act.responsible_area || 'N/A'})</span>
                                    <span>•</span>
                                    <span>Orçamento planejado: R$ {act.budget_planned?.toLocaleString('pt-BR') || '0,00'}</span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-[10px] font-mono bg-orange-500/10 dark:bg-orange-500/5 text-orange-600 dark:text-orange-400 px-2 py-1 rounded font-bold">{dateLabel}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <Link to="/endomarketing" className="block border-t border-border/30 bg-muted/10">
                    <Button variant="ghost" className="w-full h-11 text-[11px] font-bold uppercase text-orange-600 hover:text-orange-700 tracking-wider">
                      Gerenciar Endomarketing
                    </Button>
                  </Link>
                </Card>

                {/* Card de Feiras */}
                <Card className="bg-card border-border shadow-sm border-t-4 border-t-primary flex flex-col h-full overflow-hidden">
                  <CardHeader className="p-4 pb-2 border-b border-border/30 bg-muted/20">
                    <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-primary">
                        <Building2 className="h-5 w-5" /> Próximas Feiras e Eventos
                      </div>
                      <Badge className="text-xs h-5 bg-primary/10 text-primary border-primary/20">
                        {upcomingFairs.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 overflow-hidden">
                    <div className="overflow-y-auto no-scrollbar max-h-[300px]">
                      {upcomingFairs.length === 0 ? (
                        <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-2">
                          <Building2 className="h-10 w-10 text-muted-foreground/30" />
                          <p className="text-sm text-slate-500 dark:text-slate-400 italic font-medium">Nenhuma feira planejada ou ativa.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border/10">
                          {upcomingFairs.slice(0, 5).map((fair) => {
                            const startStr = fair.start_date ? new Date(fair.start_date + "T12:00:00").toLocaleDateString('pt-BR') : '-';
                            const endStr = fair.end_date ? new Date(fair.end_date + "T12:00:00").toLocaleDateString('pt-BR') : '-';
                            return (
                              <div key={fair.id} className="p-4 hover:bg-muted/30 transition-colors flex items-start gap-4 justify-between">
                                <div className="space-y-1 min-w-0 flex-1">
                                  <h4 className="text-xs font-bold text-foreground uppercase truncate">{fair.name}</h4>
                                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 leading-normal">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" /> {fair.location}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground pt-0.5">
                                    Status: <span className={cn(
                                      "font-semibold uppercase text-xs",
                                      fair.status === 'active' ? "text-green-600 bg-green-500/10 px-1 rounded" : "text-amber-600 bg-amber-500/10 px-1 rounded"
                                    )}>{fair.status === 'active' ? 'Ativa' : 'Planejada'}</span>
                                  </p>
                                </div>
                                <div className="text-right shrink-0 flex flex-col gap-1 items-end">
                                  <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded font-bold whitespace-nowrap">{startStr} - {endStr}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <Link to="/feiras" className="block border-t border-border/30 bg-muted/10">
                    <Button variant="ghost" className="w-full h-11 text-[11px] font-bold uppercase text-primary hover:text-primary/95 tracking-wider">
                      Gerenciar Feiras
                    </Button>
                  </Link>
                </Card>
              </div>
            )}

            {/* Seção de Próximas Feiras e Eventos para Vendedores Internos */}
            {shouldShowOnlyFairsCard && (
              <div className="grid grid-cols-1 gap-6 pt-2 animate-in fade-in duration-500">
                <Card className="bg-card border-border shadow-sm border-t-4 border-t-primary flex flex-col h-full overflow-hidden">
                  <CardHeader className="p-4 pb-2 border-b border-border/30 bg-muted/20">
                    <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-primary">
                        <Building2 className="h-5 w-5" /> Próximas Feiras e Eventos
                      </div>
                      <Badge className="text-xs h-5 bg-primary/10 text-primary border-primary/20">
                        {upcomingFairs.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 overflow-hidden">
                    <div className="overflow-y-auto no-scrollbar max-h-[300px]">
                      {upcomingFairs.length === 0 ? (
                        <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-2">
                          <Building2 className="h-10 w-10 text-muted-foreground/30" />
                          <p className="text-sm text-slate-500 dark:text-slate-400 italic font-medium">Nenhuma feira planejada ou ativa.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border/10">
                          {upcomingFairs.slice(0, 5).map((fair) => {
                            const startStr = fair.start_date ? new Date(fair.start_date + "T12:00:00").toLocaleDateString('pt-BR') : '-';
                            const endStr = fair.end_date ? new Date(fair.end_date + "T12:00:00").toLocaleDateString('pt-BR') : '-';
                            return (
                              <div key={fair.id} className="p-4 hover:bg-muted/30 transition-colors flex items-start gap-4 justify-between">
                                <div className="space-y-1 min-w-0 flex-1">
                                  <h4 className="text-xs font-bold text-foreground uppercase truncate">{fair.name}</h4>
                                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 leading-normal">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" /> {fair.location}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground pt-0.5">
                                    Status: <span className={cn(
                                      "font-semibold uppercase text-xs",
                                      fair.status === 'active' ? "text-green-600 bg-green-500/10 px-1 rounded" : "text-amber-600 bg-amber-500/10 px-1 rounded"
                                    )}>{fair.status === 'active' ? 'Ativa' : 'Planejada'}</span>
                                  </p>
                                </div>
                                <div className="text-right shrink-0 flex flex-col gap-1 items-end">
                                  <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded font-bold whitespace-nowrap">{startStr} - {endStr}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <Link to="/feiras" className="block border-t border-border/30 bg-muted/10">
                    <Button variant="ghost" className="w-full h-11 text-[11px] font-bold uppercase text-primary hover:text-primary/95 tracking-wider">
                      Gerenciar Feiras
                    </Button>
                  </Link>
                </Card>
              </div>
            )}

            {/* Split layout: Recent Sales & Recent Evaluations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity for Internal Sellers */}
              <Card className="bg-card border-border shadow-sm">
                  <CardHeader className="p-5 pb-3 border-b border-border/10 bg-muted/5">
                    <CardTitle className="text-base font-black uppercase tracking-widest flex items-center justify-between">
                      <span className="flex items-center gap-2">
                         <CheckCircle2 className="h-5 w-5 text-green-500" /> Vendas Recentes
                      </span>
                      <Link to="/indicacoes">
                        <Button variant="ghost" size="sm" className="h-8 text-[10px] font-normal uppercase text-primary">ver todas</Button>
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {indications.filter(i => i.status === 'sold').length === 0 ? (
                      <div className="text-center py-16 text-muted-foreground text-sm italic font-medium">
                        Nenhuma venda concluída ainda.
                      </div>
                    ) : (
                      <div className="divide-y divide-border/20">
                        {indications.filter(i => i.status === 'sold').slice(0, 5).map((ind) => (
                          <div key={ind.id} className="flex items-center justify-between p-5 hover:bg-muted/10 transition-colors">
                            <div className="min-w-0 pr-6">
                              <p className="font-normal text-sm text-foreground truncate uppercase tracking-tight">{ind.client_name}</p>
                              <div className="flex items-center gap-4 mt-1.5">
                                <span className="text-xs text-muted-foreground truncate font-normal">{ind.base_machine}</span>
                                <span className="text-xs text-green-600 font-normal">R$ {ind.base_commission_value?.toLocaleString()}</span>
                              </div>
                            </div>
                            <Badge className="bg-green-500 text-white text-[10px] font-normal tracking-widest uppercase px-2 py-1 shadow-sm">Vendido</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Evaluations */}
                {(isAdmin || isManager || isTriagem || profile?.email === 'rogerio@roderbrasil.com.br') && (
                  <Card className="bg-card border-border shadow-sm flex flex-col">
                    <CardHeader className="p-5 pb-3 border-b border-border/10 bg-muted/5">
                      <CardTitle className="text-base font-black uppercase tracking-widest flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-amber-500" /> Pesquisas de Qualidade Recentes
                        </span>
                        <Link to="/comercial/avaliacoes">
                          <Button variant="ghost" size="sm" className="h-8 text-[10px] font-normal uppercase text-primary">ver todas</Button>
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 flex flex-col">
                      {latestEvaluations.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground text-sm italic font-medium flex-1 flex items-center justify-center">
                          Nenhuma pesquisa respondida ainda.
                        </div>
                      ) : (
                        <div className="divide-y divide-border/20 flex-1">
                          {latestEvaluations.map((ev) => {
                            // Calculate simple average
                            const avgVal = ((ev.rating_product || 0) + (ev.rating_service || 0) + (ev.rating_delivery || 0) + (ev.rating_technical || 0)) / 4;
                            const isBad = avgVal < 3 || ev.rating_product < 3 || ev.rating_service < 3 || ev.rating_delivery < 3 || ev.rating_technical < 3;
                            
                            return (
                              <div 
                                key={ev.id} 
                                className={`flex items-center justify-between p-4 hover:bg-muted/10 transition-colors cursor-pointer ${isBad ? 'border-l-4 border-l-red-500 bg-red-500/5' : ''}`}
                                onClick={() => navigate(`/comercial/avaliacoes?id=${ev.id}`)}
                              >
                                <div className="min-w-0 pr-4 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-bold text-sm text-foreground truncate uppercase tracking-tight">{ev.client_name}</p>
                                    {isBad && (
                                      <span className="bg-red-500/10 text-red-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                                        Atenção
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 mt-0.5 text-xs text-muted-foreground">
                                    <span className="truncate max-w-[150px] font-semibold text-orange-500">Equip: {ev.equipment_name}</span>
                                    {ev.comments ? (
                                      <span className="truncate italic max-w-[200px]">&ldquo;{ev.comments}&rdquo;</span>
                                    ) : null}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0 gap-1">
                                  <div className="flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, sIdx) => {
                                      const starNum = sIdx + 1;
                                      return (
                                        <Star 
                                          key={starNum} 
                                          className={`h-3.5 w-3.5 ${starNum <= Math.round(avgVal) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-700'}`} 
                                        />
                                      );
                                    })}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {ev.evaluated_at ? new Date(ev.evaluated_at).toLocaleDateString() : ''}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
            </div>
          </div>
        </>
        ) : (isAdmin || isManager) ? (
          <div className="space-y-6">
            {/* Resumo Diário Roder IA (6 PM) - Oculto temporariamente para outros gerentes, visível apenas para o e-mail roderbrasil@gmail.com */}
            {dailySummary && profile?.email === 'roderbrasil@gmail.com' && (
              <div className="bg-slate-900 text-slate-100 rounded-xl p-5 shadow-md border border-slate-800">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500 text-white font-mono uppercase">Resumo Diário (18:00)</span>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-blue-400" />
                      Panorama Roder IA do Dia
                    </h3>
                  </div>
                  <button
                    onClick={() => navigate('/relatorios-ia')}
                    className="text-xs font-semibold text-slate-400 hover:text-white transition-colors underline"
                  >
                    Ver Relatório Completo
                  </button>
                </div>
                <div className="prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed max-h-36 overflow-y-auto pr-2">
                  <ReactMarkdown>{dailySummary.summary}</ReactMarkdown>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Conversion Funnel & Fast Access */}
              <Card className="bg-card border-border shadow-sm overflow-hidden flex flex-col">
                <CardHeader className="p-3 pb-1 border-b border-border/30 bg-muted/20">
                  <CardTitle className="text-[10px] lg:text-[13px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <PieChartIcon className="h-3.5 w-3.5 text-primary" /> Funil de Conversão
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-1 h-[180px] md:h-[220px] flex flex-col justify-between relative">
                  <div className="flex-1 min-h-0 relative">
                    <div className="absolute inset-y-0 left-2 flex flex-col justify-center gap-1.5 z-10">
                      {[
                        { label: 'Vendido', val: indications.filter(i => i.status === 'sold').length, color: 'bg-green-500' },
                        { label: 'Negociando', val: indications.filter(i => i.status === 'negotiating').length, color: 'bg-orange-500' },
                        { label: 'Pendente', val: indications.filter(i => i.status === 'pending').length, color: 'bg-yellow-500' },
                        { label: 'Cancelado', val: indications.filter(i => i.status === 'cancelled').length, color: 'bg-red-500' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[10px] lg:text-[13px] font-normal">
                          <div className={cn("w-2 h-2 rounded-full", item.color)} />
                          <span className="text-muted-foreground uppercase">{item.label}:</span>
                          <span className="text-foreground">{item.val}</span>
                        </div>
                      ))}
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Vendido', value: indications.filter(i => i.status === 'sold').length },
                            { name: 'Negociando', value: indications.filter(i => i.status === 'negotiating').length },
                            { name: 'Pendente', value: indications.filter(i => i.status === 'pending').length },
                            { name: 'Cancelado', value: indications.filter(i => i.status === 'cancelled').length || 0 },
                          ].filter(d => d.value > 0)}
                          cx="70%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          <Cell fill="#22c55e" /> {/* green-500 */}
                          <Cell fill="#f97316" /> {/* orange-500 */}
                          <Cell fill="#eab308" /> {/* yellow-500 */}
                          <Cell fill="#ef4444" /> {/* red-500 */}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '10px', padding: '5px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
                <Link to="/indicacoes" className="block border-t border-border/30 bg-muted/10 group">
                  <Button variant="ghost" className="w-full h-12 text-[14px] lg:text-[18px] font-extrabold uppercase text-primary hover:text-primary hover:bg-primary/5 flex items-center justify-center gap-3 tracking-widest transition-all">
                    Acessar Central de Negócios <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </Card>

              <Card className="bg-card border-border shadow-sm flex flex-col">
                <CardHeader className="p-3 pb-1 border-b border-border/30 bg-muted/20">
                  <CardTitle className="text-[10px] lg:text-[13px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Timer className="h-3.5 w-3.5 text-primary" /> Eficiência & Tempos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-5 flex-1 flex flex-col justify-center">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <p className="text-[10px] lg:text-[13px] text-muted-foreground font-normal uppercase">Média Resposta</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl lg:text-2xl font-normal text-foreground">{performanceData.avg_response_time.toFixed(1)}</span>
                        <span className="text-[10px] lg:text-[13px] font-normal text-muted-foreground uppercase tracking-widest">h</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${Math.min(100, (performanceData.avg_response_time / 4) * 100)}%` }} 
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[8px] lg:text-[11px] text-muted-foreground font-normal uppercase">Ciclo Venda</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl lg:text-2xl font-normal text-foreground">{performanceData.avg_closing_time.toFixed(0)}</span>
                        <span className="text-[8px] lg:text-[11px] font-normal text-muted-foreground uppercase tracking-widest">dias</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500" 
                          style={{ width: `${Math.min(100, (performanceData.avg_closing_time / 15) * 100)}%` }} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 md:p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] lg:text-[12px] font-normal uppercase text-primary tracking-tighter">Taxa de Conversão</span>
                      <Zap className="h-3 w-3 text-primary animate-pulse" />
                    </div>
                    <div className="flex items-baseline justify-between mb-1">
                       <span className="text-[10px] lg:text-[13px] font-normal text-muted-foreground uppercase">Real</span>
                       <span className="text-base lg:text-xl font-normal text-primary">
                         {indications.length > 0 ? ((indications.filter(i => i.status === 'sold').length / indications.length) * 100).toFixed(1) : 0}%
                       </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden shadow-inner">
                       <div 
                        className="h-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]" 
                        style={{ width: `${indications.length > 0 ? (indications.filter(i => i.status === 'sold').length / indications.length) * 100 : 0}%` }} 
                       />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {showReservations && (
                <Card className="bg-card border-border shadow-sm flex flex-col h-full overflow-hidden">
                 <CardHeader className="p-3 pb-1 border-b border-border/30 bg-muted/20">
                   <CardTitle className="text-[10px] lg:text-[11px] font-black uppercase tracking-wider flex items-center justify-between">
                     <div className="flex items-center gap-1.5">
                       <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Reservas Ativas
                     </div>
                     <Badge className="text-[8px] lg:text-[9px] h-4.5 bg-green-500/10 text-green-600 border-green-500/20">{reservations.length}</Badge>
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="p-0 flex-1 overflow-hidden">
                   <div className="h-full overflow-y-auto no-scrollbar max-h-[220px]">
                     {reservations.length === 0 ? (
                       <div className="p-6 text-center text-[10px] lg:text-[11px] text-muted-foreground italic font-normal">
                         Nenhuma reserva ativa.
                       </div>
                     ) : (
                       <div className="divide-y divide-border/30">
                         {reservations.slice(0, 15).map((res, i) => {
                            const creationDate = res.created_at?.toDate ? res.created_at.toDate() : new Date(res.created_at || Date.now());
                            const diffTime = Math.abs(new Date().getTime() - creationDate.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            const daysRemaining = Math.max(0, 5 - (diffDays - 1));
                            const displayDays = isNaN(daysRemaining) ? 0 : daysRemaining;

                            return (
                              <div key={i} className="p-2.5 hover:bg-muted/30 transition-colors flex items-center justify-between gap-2.5">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[8px] lg:text-[9px] font-normal text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm shrink-0">#{res.item_code || 'STK'}</span>
                                    <p className="text-[9px] lg:text-[10px] font-normal uppercase truncate leading-none text-foreground">{res.product_name}</p>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <p className="text-[7px] lg:text-[8px] text-muted-foreground truncate font-normal flex items-center gap-1">
                                      <Users className="h-2.5 w-2.5" /> 
                                      <span className="font-normal text-orange-500 uppercase">{res.seller_name || 'Externo'}</span>
                                    </p>
                                    <Badge className={cn(
                                      "text-[7px] lg:text-[8px] h-4 px-1.5 font-normal uppercase shadow-sm border-none",
                                      displayDays <= 1 ? "bg-red-500 text-white" : "bg-blue-500 text-white"
                                    )}>
                                      {displayDays} {displayDays === 1 ? 'dia' : 'dias'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            );
                         })}
                       </div>
                     )}
                   </div>
                 </CardContent>
                 <Link to="/estoque" className="block border-t border-border/30 bg-muted/10">
                   <Button variant="ghost" className="w-full h-8 lg:h-9 text-[9px] lg:text-[10px] font-black uppercase text-muted-foreground hover:text-foreground tracking-widest">
                     Ver Estoque Completo
                   </Button>
                 </Link>
                </Card>
              )}

              {showGoals && (
                <Card className="bg-card border-border shadow-sm border-l-4 border-l-green-500 overflow-hidden flex flex-col">
                <CardHeader className="p-3 pb-1 bg-muted/20">
                  <CardTitle className="text-[10px] lg:text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-green-500" /> Metas Mensais
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex-1 flex flex-col justify-center space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[8px] lg:text-[9px] text-muted-foreground font-normal uppercase tracking-widest leading-none">Progresso Faturamento</p>
                      <h4 className="text-xl lg:text-2xl font-normal text-foreground tracking-tighter">
                        {Math.min(100, Math.round((performanceData.monthly_sales / (goals.monthly_revenue || 1)) * 100))}%
                      </h4>
                    </div>
                    <div className="p-2.5 rounded-xl bg-green-500/10 text-green-600 shadow-inner">
                      <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (performanceData.monthly_sales / (goals.monthly_revenue || 1)) * 100)}%` }}
                        className="h-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.5)]"
                      />
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] lg:text-[11px] font-normal text-green-600 font-bold">R$ {performanceData.monthly_sales.toLocaleString()}</span>
                      <span className="text-[8px] lg:text-[9px] text-muted-foreground uppercase font-normal tracking-wider">Meta: R$ {goals.monthly_revenue?.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
                </Card>
              )}

              <Card 
                onClick={() => setShowFinanceModal(true)}
                className="bg-card border-border shadow-sm border-l-4 border-l-sky-500 overflow-hidden flex flex-col h-full cursor-pointer hover:border-sky-500/50 hover:bg-sky-500/[0.015] transition-all group duration-300 animate-in fade-in zoom-in duration-500"
              >
                <CardHeader className="p-3 pb-1 bg-muted/20">
                  <CardTitle className="text-[10px] lg:text-[11px] font-black uppercase tracking-wider flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-sky-500" /> Evolutivo Financeiro
                    </div>
                    <Badge className="text-[8px] lg:text-[9px] h-4.5 bg-sky-500/10 text-sky-600 border-sky-500/20">KPIs</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-normal">
                      Acompanhe a saúde financeira da Roder com gráficos, análises de fechamentos, KPIs e margens.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border uppercase font-semibold">Consolidado</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border uppercase font-semibold">Margens</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-[10px] lg:text-[11px] font-bold text-sky-500 uppercase tracking-wider group-hover:text-sky-400 gap-1.5">
                    Abrir Painel KPIs <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Manager/Admin Sharing Tools */}
            {(isAdmin || isManager) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Card className="bg-card border-border shadow-sm border-l-4 border-l-primary overflow-hidden w-full">
                    <CardContent className="p-3 flex items-center justify-between gap-4 h-full">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                          <Share2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[10px] font-black uppercase tracking-tighter truncate">Link Público</h4>
                          <p className="text-[8px] text-muted-foreground font-medium truncate">Acesso ao Estoque</p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 border-primary/30 text-primary hover:bg-primary/10 px-2 font-black uppercase text-[11px] tracking-widest"
                          onClick={() => {
                            const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://roder-indica-v2-142737915053.us-west1.run.app';
                            const url = `${currentOrigin}/estoque-publico`;
                            const text = `Olá! Segue o link para consulta em tempo real dos equipamentos e acessórios em estoque na Roder Brasil:\n\n${url}\n\n_Este link é atualizado automaticamente._`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                          }}
                        >
                          WhatsApp
                        </Button>
                        <Link to="/estoque-publico">
                          <Button size="sm" className="h-9 bg-primary text-white px-2 font-black uppercase text-[11px] tracking-widest shadow-sm">
                            Abrir
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                 </Card>

                 {missingCommValueCount > 0 && (
                   <Card className="bg-amber-500/5 border-amber-500/20 border-l-4 border-l-amber-500 overflow-hidden w-full">
                      <CardContent className="p-3 flex items-center justify-between gap-3 h-full">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileDigit className="h-4 w-4 text-amber-600 animate-pulse" />
                          <div className="min-w-0">
                            <h4 className="text-[13px] font-black uppercase tracking-tighter truncate">Atenção Valores</h4>
                            <p className="text-[11px] text-amber-700/70 font-medium truncate">{missingCommValueCount} sem valor base</p>
                          </div>
                        </div>
                        <Link to="/indicacoes?filter=missing_base">
                          <Button size="sm" variant="outline" className="h-9 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 px-2 font-black uppercase text-[11px] tracking-widest">
                            Corrigir
                          </Button>
                        </Link>
                      </CardContent>
                   </Card>
                 )}

                 {fairAnomaliesCount > 0 && (
                   <Card className="bg-blue-500/5 border-blue-500/20 border-l-4 border-l-blue-500 overflow-hidden w-full">
                      <CardContent className="p-3 flex items-center justify-between gap-3 h-full">
                        <div className="flex items-center gap-2 min-w-0">
                          <Calendar className="h-4 w-4 text-blue-600 animate-bounce" />
                          <div className="min-w-0">
                            <h4 className="text-[13px] font-black uppercase tracking-tighter truncate">Status de Feiras</h4>
                            <p className="text-[11px] text-blue-700/70 font-medium truncate">{fairAnomaliesCount} feiras requerem ajuste</p>
                          </div>
                        </div>
                        <Link to="/feiras">
                          <Button size="sm" variant="outline" className="h-9 border-blue-500/30 text-blue-600 hover:bg-blue-500/10 px-2 font-black uppercase text-[11px] tracking-widest">
                            Ver Feiras
                          </Button>
                        </Link>
                      </CardContent>
                   </Card>
                 )}
              </div>
            )}

            {/* Recent Activity & Ranking */}
            {!(isFinancial || isFiscal) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(!profile?.permissions?.dashboard_cards || profile.permissions.dashboard_cards.conversion_ranking !== false) && (
                <Card className="bg-card border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
                  <CardTitle className="text-lg font-bold">Ranking de Conversão (Top 5)</CardTitle>
                  <TrendingUp className="h-5 w-5 text-primary/40" />
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  {conversionRanking.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-xs italic">
                      Dados insuficientes para gerar ranking.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {conversionRanking.map((seller, i) => (
                        <div key={i} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-normal flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">{i+1}</span>
                              {seller.name}
                            </span>
                            <span className="font-mono text-muted-foreground">{seller.rate.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${seller.rate}%` }}
                              transition={{ duration: 1, delay: i * 0.1 }}
                              className="h-full bg-primary"
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-muted-foreground uppercase font-normal">
                            <span>{seller.sold} Vendas</span>
                            <span>{seller.total} Indicações</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              )}

              {showRecentIndications && (
                <Card className="bg-card border-border shadow-sm shrink-0">
                  <CardHeader className="p-4 md:p-6 pb-2">
                    <CardTitle className="text-lg font-bold">Indicações Recentes</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 pt-0">
                    {indications.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        Nenhuma indicação encontrada.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {indications.slice(0, 5).map((ind) => (
                          <div key={ind.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                            <div className="min-w-0 pr-2">
                              <p className="font-normal text-xs text-foreground truncate">{ind.client_name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{ind.base_machine}</p>
                            </div>
                            <Badge variant="outline" className={cn(
                              "capitalize text-[8px] h-4 px-1.5 shrink-0 font-normal",
                              ind.status === 'sold' && "border-green-500/50 text-green-400 bg-green-500/10",
                              ind.status === 'negotiating' && "border-orange-500/50 text-orange-400 bg-orange-500/10",
                              ind.status === 'pending' && "border-yellow-500/50 text-yellow-400 bg-yellow-500/10",
                              (ind.status === 'cancelled' || ind.status === 'archived') && "border-red-500/50 text-red-500 bg-red-500/10"
                            )}>
                              {ind.status === 'sold' ? 'Vendido' : 
                               ind.status === 'negotiating' ? 'Andamento' :
                               ind.status === 'pending' ? 'Novo' : 
                               ind.status === 'archived' ? 'Perdido' : 'Cancelado'}
                            </Badge>
                          </div>
                        ))}
                        <Link to="/indicacoes" className="block">
                          <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground mt-2">
                            Ver todas <ArrowRight className="ml-2 h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              </div>
            )}

            {/* Advanced Financial Summary for Managers/Admins/Finance/Fiscal */}
            {(isAdmin || isManager || isFinancial || isFiscal) && (!profile?.permissions?.dashboard_cards || profile.permissions.dashboard_cards.manager_financial !== false) && (
              <Card className="bg-card border-border shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                <CardHeader className="p-4 md:p-6 border-b border-border/10 bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-600 shadow-inner">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg lg:text-2xl font-black uppercase italic tracking-tighter">Resumo Financeiro Gerencial</CardTitle>
                      <p className="text-[10px] lg:text-[13px] text-muted-foreground font-normal uppercase tracking-widest">Base de dados consolidada • Desde 25/04/2026</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex bg-muted p-1 rounded-lg border border-border/50">
                      {[
                        { id: '30days', label: '30 Dias' },
                        { id: '12months', label: '12 Meses' },
                        { id: 'all', label: 'Todo Período' },
                        { id: 'custom', label: 'Personalizado' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setFinancialPeriod(p.id as any)}
                          className={cn(
                            "px-3 py-1.5 rounded-md text-[10px] font-normal uppercase transition-all tracking-tighter",
                            financialPeriod === p.id 
                              ? "bg-primary text-white shadow-sm" 
                              : "text-muted-foreground hover:bg-muted-foreground/10"
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    {financialPeriod === 'custom' && (
                      <div className="flex gap-2">
                        <select 
                          className="bg-card border border-border rounded p-1 text-[10px] font-normal uppercase"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        >
                          {Array.from({ length: 12 }).map((_, i) => (
                            <option key={i} value={i}>{new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}</option>
                          ))}
                        </select>
                        <select 
                          className="bg-card border border-border rounded p-1 text-[10px] font-normal uppercase"
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(Number(e.target.value))}
                        >
                          {[2026, 2027, 2028].map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 lg:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <div className="group p-5 rounded-2xl bg-orange-500/5 border-2 border-orange-500/10 hover:border-orange-500/30 transition-all hover:bg-orange-500/10">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] lg:text-[13px] text-orange-600 font-normal uppercase tracking-widest">Em Negociação</p>
                        <Clock className="h-5 w-5 text-orange-500 group-hover:scale-110 transition-transform" />
                      </div>
                      <h4 className="text-2xl lg:text-3xl font-normal text-orange-600 tracking-tighter">
                        R$ {filteredFinancialData.negotiatingValue.toLocaleString('pt-BR')}
                      </h4>
                      <p className="text-[9px] text-orange-700/60 font-normal mt-1 uppercase tracking-tighter">Valor Total Aberto</p>
                    </div>

                    <div className="group p-5 rounded-2xl bg-green-500/5 border-2 border-green-500/10 hover:border-green-500/30 transition-all hover:bg-green-500/10">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] lg:text-[13px] text-green-600 font-normal uppercase tracking-widest">Total Vendido</p>
                        <CheckCircle2 className="h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
                      </div>
                      <h4 className="text-2xl lg:text-3xl font-normal text-green-600 tracking-tighter">
                        R$ {filteredFinancialData.soldValue.toLocaleString('pt-BR')}
                      </h4>
                      <p className="text-[9px] text-green-700/60 font-normal mt-1 uppercase tracking-tighter">Receita do Período</p>
                    </div>

                    <div className="group p-5 rounded-2xl bg-blue-500/5 border-2 border-blue-500/10 hover:border-blue-500/30 transition-all hover:bg-blue-500/10">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] lg:text-[13px] text-blue-600 font-normal uppercase tracking-widest">Comissões Pagas</p>
                        <DollarSign className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                      </div>
                      <h4 className="text-2xl lg:text-3xl font-normal text-blue-600 tracking-tighter">
                        R$ {filteredFinancialData.paidCommissions.toLocaleString('pt-BR')}
                      </h4>
                      <p className="text-[9px] text-blue-700/60 font-normal mt-1 uppercase tracking-tighter">Pago aos Indicadores</p>
                    </div>

                    <div className="group p-5 rounded-2xl bg-purple-500/5 border-2 border-purple-500/10 hover:border-purple-500/30 transition-all hover:bg-purple-500/10">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] lg:text-[13px] text-purple-600 font-normal uppercase tracking-widest">A Pagar</p>
                        <Calculator className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
                      </div>
                      <h4 className="text-2xl lg:text-3xl font-normal text-purple-600 tracking-tighter">
                        R$ {filteredFinancialData.pendingCommissions.toLocaleString('pt-BR')}
                      </h4>
                      <p className="text-[9px] text-purple-700/60 font-normal mt-1 uppercase tracking-tighter">Comissões provisionadas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {(!profile?.permissions?.dashboard_cards || profile.permissions.dashboard_cards.commissions_summary !== false) && !isRegionalSeller && (
              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg font-bold">Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 p-4 md:p-6 pt-0">
                  <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                    <p className="text-[10px] text-green-600 font-normal uppercase tracking-wider">Total Pago</p>
                    <h4 className="text-xl md:text-2xl font-normal text-green-600 mt-1">R$ {paidTotal.toLocaleString('pt-BR')}</h4>
                  </div>
                  <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                    <p className="text-[10px] text-orange-600 font-normal uppercase tracking-wider">Pendente</p>
                    <h4 className="text-xl md:text-2xl font-normal text-orange-600 mt-1">R$ {pendingTotal.toLocaleString('pt-BR')}</h4>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <p className="text-[10px] text-blue-600 font-normal uppercase tracking-wider">Aguardando Pagamento</p>
                    <h4 className="text-xl md:text-2xl font-normal text-blue-600 mt-1">R$ {waitingPaymentTotal.toLocaleString('pt-BR')}</h4>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center shadow-inner">
              <ShieldAlert className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <div className="max-w-md px-4">
              <h3 className="text-xl font-bold uppercase italic tracking-tighter">Acesso em Processamento</h3>
              <p className="text-muted-foreground mt-2 font-medium text-sm">
                Seu perfil está sendo sincronizado. Caso seja sua primeira vez, aguarde um instante ou tente atualizar a página.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-[200px]">
              <Button 
                variant="outline"
                className="gap-2 font-bold uppercase tracking-widest text-[10px] h-10 shadow-sm"
                onClick={() => {
                  localStorage.removeItem('roder_profile_cache');
                  window.location.reload();
                }}
              >
                <Zap className="h-3.5 w-3.5" /> Sincronizar Agora
              </Button>
            </div>
          </div>
        )}
    </div>

    {/* Financial Evolution and KPIs Fullscreen Modal */}
    <AnimatePresence>
      {showFinanceModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex flex-col p-4 md:p-6"
        >
          <motion.div 
            initial={{ scale: 0.96, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 15 }}
            transition={{ type: "spring", damping: 28, stiffness: 380 }}
            className="w-full max-w-7xl mx-auto bg-background rounded-2xl border border-border/80 shadow-2xl flex flex-col overflow-hidden my-auto max-h-[92vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-border/80 bg-card shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500/10 text-sky-500 rounded-lg">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-black uppercase tracking-tighter text-foreground">
                    Evolutivo & Histórico Financeiro
                  </h2>
                  <p className="text-[10px] md:text-xs text-muted-foreground font-normal">
                    Selecione os KPIs desejados nas opções do painel secundário do dashboard para filtrar os dados históricos.
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowFinanceModal(false)}
                className="font-bold uppercase tracking-wider text-[10px] h-9 border-border hover:bg-muted text-foreground px-4 shrink-0"
              >
                Fechar
              </Button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
              <FinanceDashboard />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </Layout>
  );
}

function QuickActionCard({ title, icon: Icon, color, link, isExternal }: { title: string, icon: any, color: string, link: string, isExternal?: boolean }) {
  return (
    <Link to={link}>
      <Card className="bg-card border-border hover:border-primary/50 transition-all hover:shadow-md group cursor-pointer h-full overflow-hidden">
        <CardContent className="p-0.5 py-2 md:p-4 flex flex-col items-center justify-center text-center gap-1 md:gap-3">
          <div className={cn(
            "w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform", 
            color,
            isExternal && color === 'bg-green-600' && "shadow-[0_0_15px_rgba(22,163,74,0.3)] animate-fluorescent border-white/20 border-2"
          )}>
            <Icon className="h-4 w-4 md:h-6 md:w-6" />
          </div>
          <span className="text-[8px] leading-[1.1] md:text-xs font-bold text-muted-foreground uppercase tracking-tighter group-hover:text-primary transition-colors line-clamp-2 px-0.5">{title}</span>
        </CardContent>
      </Card>
    </Link>
  );
}

