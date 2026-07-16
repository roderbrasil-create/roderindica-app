import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  doc, 
  updateDoc, 
  getDocs,
  setDoc
} from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { analyzeNF } from '../services/geminiService';
import { Commission, UserProfile } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Download,
  Search,
  Filter,
  CreditCard,
  AlertCircle,
  Loader2,
  Eye,
  MessageSquare,
  Copy,
  ChevronDown,
  ChevronRight,
  Grid,
  Sparkles,
  FileSpreadsheet,
  Check,
  Printer,
  Undo,
  Redo,
  RefreshCw,
  Plus
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { format, addMonths, subMonths, isAfter, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { TrendingUp, FileCheck } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { MonthlyStatement } from '../types';

const months = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const years = [2024, 2025, 2026];

export default function Commissions() {
  const { profile } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [allCommissions, setAllCommissions] = useState<Commission[]>([]);
  const [monthlyStatements, setMonthlyStatements] = useState<MonthlyStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedStatement, setSelectedStatement] = useState<MonthlyStatement | null>(null);
  const [isNFDialogOpen, setIsNFDialogOpen] = useState(false);
  const [nfStep, setNfStep] = useState<'ask' | 'upload'>('ask');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [nfFile, setNfFile] = useState<File | null>(null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [readingNF, setReadingNF] = useState(false);
  const [sellerProfiles, setSellerProfiles] = useState<Record<string, UserProfile>>({});
  const [potentialLeads, setPotentialLeads] = useState<any[]>([]);

  // New states for the financial team tasks (due by 7th of the current month)
  const [currentCommissions, setCurrentCommissions] = useState<Commission[]>([]);
  const [currentStatements, setCurrentStatements] = useState<MonthlyStatement[]>([]);
  const [linkedIndications, setLinkedIndications] = useState<Record<string, any>>({});

  // Mecânica Dias and Spreadsheet Simulation States
  const [mecanicaNfStatus, setMecanicaNfStatus] = useState<'waiting_nf' | 'waiting_payment' | 'paid'>('waiting_nf');
  const [mecanicaPaidDate, setMecanicaPaidDate] = useState<string | null>(null);
  const [mecanicaExpanded, setMecanicaExpanded] = useState<boolean>(false); // Collapsed by default as requested!
  const [copiedPixId, setCopiedPixId] = useState<string | null>(null);
  const [expandedStatementIds, setExpandedStatementIds] = useState<Record<string, boolean>>({});
  
  // External Seller Spreadsheet States
  const [expandedPartnerPeriodKeys, setExpandedPartnerPeriodKeys] = useState<Record<string, boolean>>({});
  const [isPartnerNFDialogOpen, setIsPartnerNFDialogOpen] = useState(false);
  const [selectedPartnerPeriod, setSelectedPartnerPeriod] = useState<any>(null);
  const [partnerNFFile, setPartnerNFFile] = useState<File | null>(null);
  const [partnerNFConfirmed, setPartnerNFConfirmed] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
    confirmText: "Confirmar"
  });

  const mecanicaProfile = React.useMemo(() => {
    return (Object.values(sellerProfiles) as UserProfile[]).find(p => 
      p.name?.toLowerCase().includes('odair') || 
      p.name?.toLowerCase().includes('dias') ||
      p.name?.toLowerCase().includes('mecanica') ||
      p.name?.toLowerCase().includes('mecânica')
    );
  }, [sellerProfiles]);

  const mecanicaPhone = React.useMemo(() => {
    if (mecanicaProfile?.phone) {
      const cleaned = mecanicaProfile.phone.replace(/\D/g, '');
      return cleaned.startsWith('55') ? cleaned : '55' + cleaned;
    }
    return '554799999999';
  }, [mecanicaProfile]);

  const mecanicaPixKey = React.useMemo(() => {
    return mecanicaProfile?.pix_key || '12345678000199';
  }, [mecanicaProfile]);

  const partnerPeriods = React.useMemo(() => {
    if (!profile || profile.role !== 'external_seller') return [];

    // Base mock & real periods that Odair / partner indicators are used to seeing
    const defaultPeriods: { month: number; year: number; label: string; type: string; value: number; status: string; paid_at?: string }[] = [
      { month: 5, year: 2026, label: "Maio/2026", type: "previous", value: 2267.07, status: 'waiting_nf' },
      { month: 6, year: 2026, label: "Junho/2026", type: "current", value: 0, status: "in_progress" }
    ];

    const grouped: Record<string, { total: number; commissions: Commission[]; statement?: MonthlyStatement; customStatus?: string }> = {};

    // Initialize with default template periods
    defaultPeriods.forEach(p => {
      const key = `${p.month}_${p.year}`;
      grouped[key] = {
        total: p.value,
        commissions: []
      };
    });

    // Populate with real Firestore commissions (allCommissions contains all loaded)
    allCommissions.forEach(comm => {
      const key = `${comm.month}_${comm.year}`;
      if (!grouped[key]) {
        grouped[key] = { total: 0, commissions: [] };
      }
      grouped[key].commissions.push(comm);
    });

    // Merge any real values from allCommissions if they have elements
    Object.keys(grouped).forEach(key => {
      const [mStr, yStr] = key.split('_');
      const m = parseInt(mStr);
      const y = parseInt(yStr);

      const realComms = allCommissions.filter(c => c.month === m && c.year === y);
      if (realComms.length > 0) {
        grouped[key].commissions = realComms;
        grouped[key].total = realComms.reduce((sum, c) => sum + c.value, 0);
      }

      // Look for a persisted monthly_statement in Firestore for this exact month + year
      const dbStatement = monthlyStatements.find(s => s.month === m && s.year === y);
      if (dbStatement) {
        grouped[key].statement = dbStatement;
        grouped[key].total = dbStatement.total_value;
      }
    });

    // Assemble the complete display records with reactive indicators
    return Object.keys(grouped).map(key => {
      const [mStr, yStr] = key.split('_');
      const m = parseInt(mStr);
      const y = parseInt(yStr);
      const mLabel = months.find(item => item.value === m)?.label || `Mês ${m}`;
      const label = `${mLabel}/${y}`;

      const item = grouped[key];
      const curMonth = new Date().getMonth() + 1;
      const curYear = new Date().getFullYear();

      const isCurrent = (m === curMonth && y === curYear);
      const isPrevious = (m === (curMonth === 1 ? 12 : curMonth - 1) && y === (curMonth === 1 ? curYear - 1 : curYear));

      let status = 'waiting_nf';
      let paid_at = undefined;
      let nf_url = undefined;

      if (isCurrent) {
        status = 'in_progress';
      } else if (item.statement) {
        status = item.statement.status;
        paid_at = item.statement.paid_at;
        nf_url = item.statement.nf_url;
      } else {
        // Fallback to template default status if no DB statement overrides
        const basePeriod = defaultPeriods.find(p => p.month === m && p.year === y);
        if (basePeriod) {
          status = basePeriod.status;
          paid_at = basePeriod.paid_at;
        }
      }

      // Connect simulation of Maio/2026 for Mecânica Dias
      if (m === 5 && y === 2026) {
        if (!item.statement) {
          status = mecanicaNfStatus;
          paid_at = mecanicaPaidDate;
        }
      }

      return {
        key,
        month: m,
        year: y,
        label,
        total: item.total,
        commissions: item.commissions,
        status,
        paid_at,
        nf_url,
        statement: item.statement,
        isCurrent,
        isPrevious
      };
    }).sort((a, b) => {
      // Sort chronologically (oldest to newest) as requested
      return (a.year - b.year) !== 0 ? (a.year - b.year) : (a.month - b.month);
    });
  }, [profile, allCommissions, monthlyStatements, mecanicaNfStatus, mecanicaPaidDate]);

  // Listener for general monthly filtering select
  useEffect(() => {
    if (!profile) return;

    // Fetch individual commissions
    let q = query(
      collection(db, 'commissions'),
      where('month', '==', selectedMonth),
      where('year', '==', selectedYear),
      orderBy('created_at', 'desc')
    );

    if (profile.role === 'external_seller') {
      q = query(
        collection(db, 'commissions'),
        where('external_seller_uid', '==', profile.uid),
        where('month', '==', selectedMonth),
        where('year', '==', selectedYear),
        orderBy('created_at', 'desc')
      );
    }

    const unsubscribeComms = onSnapshot(q, (snapshot) => {
      setCommissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commission)));
    });

    // Fetch Monthly Statements
    let qStatements = query(
      collection(db, 'monthly_statements'),
      where('month', '==', selectedMonth),
      where('year', '==', selectedYear)
    );

    if (profile.role === 'external_seller') {
      qStatements = query(
        collection(db, 'monthly_statements'),
        where('seller_uid', '==', profile.uid),
        where('month', '==', selectedMonth),
        where('year', '==', selectedYear)
      );

      // Fetch potential commissions (Negotiating leads with base_commission_value)
      const qPotential = query(
        collection(db, 'indications'),
        where('external_seller_uid', '==', profile.uid),
        where('status', '==', 'negotiating')
      );

      onSnapshot(qPotential, (snapshot) => {
        setPotentialLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }

    const unsubscribeStatements = onSnapshot(qStatements, (snapshot) => {
      setMonthlyStatements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MonthlyStatement)));
      setLoading(false);
    });

    // Real-time subscription to Mecânica Dias / Odair de Oliveira's custom persistent statement
    const unsubscribeMecanica = onSnapshot(doc(db, 'monthly_statements', 'mecanica_dias_id'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.status) {
          setMecanicaNfStatus(data.status);
        }
        if (data.paid_at !== undefined) {
          setMecanicaPaidDate(data.paid_at);
        }
      }
    });

    // Forecast data
    const qAll = profile.role === 'external_seller' 
      ? query(collection(db, 'commissions'), where('external_seller_uid', '==', profile.uid), orderBy('year', 'desc'), orderBy('month', 'desc'))
      : query(collection(db, 'commissions'), orderBy('year', 'desc'), orderBy('month', 'desc'));
    
    getDocs(qAll).then(snap => {
      setAllCommissions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commission)));
    });

    // Profiles - Load for all authenticated users to enable lookup
    if (profile) {
      getDocs(query(collection(db, 'users'), where('role', '==', 'external_seller')))
        .then(snapshot => {
          const profiles: Record<string, UserProfile> = {};
          snapshot.docs.forEach(doc => {
            profiles[doc.id] = { uid: doc.id, ...doc.data() } as UserProfile;
          });
          setSellerProfiles(profiles);
        })
        .catch(err => console.error("Error loading user profiles in commissions:", err));
    }

    return () => {
      unsubscribeComms();
      unsubscribeStatements();
      unsubscribeMecanica();
    };
  }, [profile, selectedMonth, selectedYear]);

  // Listener for the current calendar month tasks (always pinned at the top)
  useEffect(() => {
    if (!profile) return;
    const curMonth = new Date().getMonth() + 1;
    const curYear = new Date().getFullYear();

    let qCurrentComms = query(
      collection(db, 'commissions'),
      where('month', '==', curMonth),
      where('year', '==', curYear),
      orderBy('created_at', 'desc')
    );

    if (profile.role === 'external_seller') {
      qCurrentComms = query(
        collection(db, 'commissions'),
        where('external_seller_uid', '==', profile.uid),
        where('month', '==', curMonth),
        where('year', '==', curYear),
        orderBy('created_at', 'desc')
      );
    }

    const unsubCurrentComms = onSnapshot(qCurrentComms, (snapshot) => {
      setCurrentCommissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commission)));
    });

    let qCurrentStatements = query(
      collection(db, 'monthly_statements'),
      where('month', '==', curMonth),
      where('year', '==', curYear)
    );

    if (profile.role === 'external_seller') {
      qCurrentStatements = query(
        collection(db, 'monthly_statements'),
        where('seller_uid', '==', profile.uid),
        where('month', '==', curMonth),
        where('year', '==', curYear)
      );
    }

    const unsubCurrentStatements = onSnapshot(qCurrentStatements, (snapshot) => {
      setCurrentStatements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MonthlyStatement)));
    });

    return () => {
      unsubCurrentComms();
      unsubCurrentStatements();
    };
  }, [profile]);

  // Fetch indications detail referenced by any displayed or active commission (to display client names and order dates)
  useEffect(() => {
    const listComms = [...commissions, ...currentCommissions];
    if (listComms.length === 0) return;

    const ids = Array.from(new Set(listComms.map(c => c.indication_id).filter(Boolean)));
    if (ids.length === 0) return;

    const fetchIndicationsDocs = async () => {
      try {
        const results = { ...linkedIndications };
        const missingIds = ids.filter(id => !results[id]);
        if (missingIds.length === 0) return;

        const chunks: string[][] = [];
        const chunkSize = 25;
        for (let i = 0; i < missingIds.length; i += chunkSize) {
          chunks.push(missingIds.slice(i, i + chunkSize));
        }

        for (const chunk of chunks) {
          const q = query(collection(db, 'indications'), where('__name__', 'in', chunk));
          const snap = await getDocs(q);
          snap.docs.forEach(docSnap => {
            results[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
          });
        }
        setLinkedIndications(results);
      } catch (err) {
        console.error("Error fetching linked indications for commissions detail:", err);
      }
    };

    fetchIndicationsDocs();
  }, [commissions, currentCommissions]);

  // Action to mark a payment directly as executed
  const handleMarkAsPaidDirect = async (statement: MonthlyStatement) => {
    const sellerProf = sellerProfiles[statement.seller_uid];
    const pixKey = sellerProf?.pix_key || 'Chave não cadastrada';
    
    const confirmMsg = `COMPROVAÇÃO DE PAGAMENTO PIX:\n\n` +
                       `• Favorecido: ${statement.seller_name}\n` +
                       `• Valor: R$ ${statement.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
                       `• Chave PIX: ${pixKey}\n\n` +
                       `Você confirma que a transferência bancária/PIX foi efetuada com sucesso?`;

    setConfirmDialog({
      isOpen: true,
      title: 'Confirmar Pagamento PIX',
      description: confirmMsg,
      confirmText: 'Confirmar Pagamento',
      onConfirm: async () => {
        setSubmitting(true);
        try {
          const statementRef = doc(db, 'monthly_statements', statement.id);
          const { id, ...data } = statement;
          await setDoc(statementRef, {
            ...data,
            id: statement.id,
            status: 'paid',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { merge: true });

          if (statement.commission_ids && statement.commission_ids.length > 0) {
            for (const commId of statement.commission_ids) {
              await updateDoc(doc(db, 'commissions', commId), {
                status: 'paid',
                updated_at: new Date().toISOString()
              });
            }
          }

          toast.success('Pagamento consolidado de comissão marcado como executado!');
        } catch (err: any) {
          console.error("Error confirming payment executed:", err);
          toast.error('Erro ao marcar pagamento: ' + err.message);
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  // Revert status of a monthly statement in firestore
  const handleRevertStatementStatus = async (statement: MonthlyStatement, targetStatus: 'waiting_nf' | 'waiting_payment') => {
    const statusLabel = targetStatus === 'waiting_nf' ? 'Aguardando NF' : 'Pendente Liberação';
    
    setConfirmDialog({
      isOpen: true,
      title: 'Reverter Status de Fechamento',
      description: `Deseja realmente reverter o status de "${statement.seller_name}" para "${statusLabel}"?`,
      confirmText: 'Reverter Status',
      onConfirm: async () => {
        setSubmitting(true);
        try {
          const statementRef = doc(db, 'monthly_statements', statement.id);
          
          const updateData: any = {
            status: targetStatus,
            updated_at: new Date().toISOString()
          };

          if (targetStatus === 'waiting_nf') {
            updateData.nf_url = null; // clear NF URL if reverting back to waiting for NF
          } else if (targetStatus === 'waiting_payment') {
            updateData.payment_receipt_url = null; // clear receipt
            updateData.paid_at = null;
          }

          await updateDoc(statementRef, updateData);

          if (statement.commission_ids && statement.commission_ids.length > 0) {
            for (const commId of statement.commission_ids) {
              await updateDoc(doc(db, 'commissions', commId), {
                status: targetStatus,
                updated_at: new Date().toISOString()
              });
            }
          }

          toast.success(`Status revertido com sucesso para ${statusLabel}!`);
        } catch (err: any) {
          console.error("Error reverting statement status:", err);
          toast.error('Erro ao reverter status: ' + err.message);
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  // Submit NF helper for the external indicator partner
  const submitPartnerNF = async () => {
    if (!selectedPartnerPeriod || !partnerNFConfirmed) {
      toast.error("Por favor, marque a confirmação para validar o envio da Nota Fiscal.");
      return;
    }
    setSubmitting(true);

    try {
      let url = selectedPartnerPeriod.nf_url || null;

      if (partnerNFFile) {
        const storageRef = ref(storage, `commissions_nf/monthly_${profile?.uid}_${selectedPartnerPeriod.month}_${selectedPartnerPeriod.year}_${partnerNFFile.name}`);
        await uploadBytes(storageRef, partnerNFFile);
        url = await getDownloadURL(storageRef);
      }

      const statementId = `${profile?.uid}_${selectedPartnerPeriod.month}_${selectedPartnerPeriod.year}`;
      const statementRef = doc(db, 'monthly_statements', statementId);

      // Save/update statement document in Firestore
      await setDoc(statementRef, {
        id: statementId,
        seller_uid: profile?.uid,
        seller_name: profile?.name || 'Parceiro',
        month: selectedPartnerPeriod.month,
        year: selectedPartnerPeriod.year,
        total_value: selectedPartnerPeriod.total,
        status: 'waiting_payment',
        nf_url: url,
        updated_at: new Date().toISOString(),
        created_at: selectedPartnerPeriod.statement?.created_at || new Date().toISOString(),
        commission_ids: selectedPartnerPeriod.statement?.commission_ids || []
      }, { merge: true });

      // Also cascade local commissions to waiting_payment if any are found
      if (selectedPartnerPeriod.commissions && selectedPartnerPeriod.commissions.length > 0) {
        for (const comm of selectedPartnerPeriod.commissions) {
          await updateDoc(doc(db, 'commissions', comm.id), {
            status: 'waiting_payment',
            updated_at: new Date().toISOString()
          });
        }
      }

      // Sync the simulation of Maio/2026 for Mecânica Dias
      if (selectedPartnerPeriod.month === 5 && selectedPartnerPeriod.year === 2026) {
        setMecanicaNfStatus('waiting_payment');
        await setDoc(doc(db, 'monthly_statements', 'mecanica_dias_id'), {
          id: 'mecanica_dias_id',
          seller_name: mecanicaProfile?.name || 'Mecânica Dias',
          seller_uid: mecanicaProfile?.uid || 'mecanica_dias_uid',
          total_value: 2267.07,
          status: 'waiting_payment',
          month: 5,
          year: 2026,
          updated_at: new Date().toISOString()
        }, { merge: true });
      }

      toast.success('Nota fiscal confirmada com sucesso!');
      setIsPartnerNFDialogOpen(false);
      setPartnerNFFile(null);
      setPartnerNFConfirmed(false);
    } catch (error: any) {
      console.error("Error submitting partner NF:", error);
      toast.error('Erro ao enviar Nota Fiscal: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper formatting for order sale date
  const formatSaleDate = (saleDateStr?: string, createdAtStr?: string): string => {
    if (!saleDateStr) {
      if (createdAtStr) {
        return new Date(createdAtStr).toLocaleDateString('pt-BR');
      }
      return '-';
    }
    const parts = saleDateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return saleDateStr;
  };

  // Get configured WhatsApp template text
  const getWhatsAppMessage = (statement: MonthlyStatement, statementComms: Commission[]): string => {
    const sellerName = statement.seller_name;
    const totalValStr = statement.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const monthLabel = months.find(m => m.value === statement.month)?.label || '';
    const year = statement.year;

    let text = `Olá, ${sellerName}! Tudo bem?\n\n`;
    text = text + `Concluímos o fechamento das suas comissões programadas para pagamento em *${monthLabel}/${year}*.\n`;
    text = text + `O valor total de comissão calculado é de *R$ ${totalValStr}*.\n\n`;
    text = text + `*Nota explicativa sobre o cálculo:* Lembramos que o recebimento de comissões de parceiro indicador incide apenas sobre o valor líquido dos equipamentos comissionáveis de fábrica. Valores correspondentes a itens como kits extras de instalação, frete, deslocamento de entrega técnica ou serviços de instalação não contemplam a base de produtos comissionáveis. Por esse motivo, é normal e esperado que o valor total de faturamento ou da Nota Fiscal final ao cliente seja maior do que a base de comissionamento de produtos aqui especificada.\n\n`;
    text = text + `Por favor, emita e nos envie a Nota Fiscal de serviço com este valor de R$ ${totalValStr} para darmos continuidade ao pagamento até o dia 7.\n\n`;
    text = text + `*Vendas correspondentes à sua comissão:*\n`;

    statementComms.forEach((comm) => {
      const ind = linkedIndications[comm.indication_id];
      const clientName = ind?.client_name || 'Cliente';
      const orderNum = ind?.sale_order_number || 'Sem número';
      const valStr = comm.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

      let equipmentsText = '';
      if (ind?.items && ind.items.length > 0) {
        equipmentsText = ind.items.map(item => `${item.quantity}x ${item.product_name}`).join(', ');
      } else if (ind?.base_machine) {
        equipmentsText = ind.base_machine;
      } else {
        equipmentsText = 'Não especificado';
      }

      text = text + `\n- *Cliente*: ${clientName}\n`;
      text = text + `  *Pedido*: #${orderNum}\n`;
      text = text + `  *Equipamento(s)*: ${equipmentsText}\n`;
      text = text + `  *Comissão*: R$ ${valStr}\n`;
    });

    text = text + `\nAgradecemos a parceria! 🙏`;
    return encodeURIComponent(text);
  };

  // Click handler for WhatsApp contact
  const handleWhatsAppClick = (statement: MonthlyStatement, statementComms: Commission[]) => {
    const rawNumber = sellerProfiles[statement.seller_uid]?.phone || '';
    let cleanedPhone = rawNumber.replace(/\D/g, '');
    
    if (cleanedPhone && !cleanedPhone.startsWith('55') && cleanedPhone.length >= 10) {
      cleanedPhone = '55' + cleanedPhone;
    }
    
    const textEncoded = getWhatsAppMessage(statement, statementComms);
    if (!cleanedPhone) {
      setConfirmDialog({
        isOpen: true,
        title: 'Contato sem WhatsApp',
        description: 'Número de WhatsApp não encontrado no perfil deste parceiro. Deseja abrir o WhatsApp mesmo assim para escolher o contato manualmente?',
        confirmText: 'Abrir WhatsApp',
        onConfirm: () => {
          window.open(`https://wa.me/?text=${textEncoded}`, '_blank');
        }
      });
    } else {
      window.open(`https://wa.me/${cleanedPhone}?text=${textEncoded}`, '_blank');
    }
  };

  // Render sub-sales for clarity
  const renderStatementDetails = (statement: MonthlyStatement, listComms: Commission[]) => {
    const sComms = listComms.filter(c => c.external_seller_uid === statement.seller_uid);
    return (
      <div className="space-y-1.5 p-2 rounded-lg bg-muted/30 border border-border/40">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Vendas Associadas:</p>
        {sComms.length === 0 ? (
          <p className="text-[10px] text-muted-foreground italic">Nenhuma venda encontrada.</p>
        ) : (
          sComms.map(comm => {
            const ind = linkedIndications[comm.indication_id];
            const clientName = ind?.client_name || 'Cliente';
            const rawDate = ind?.sale_order_date || comm.created_at;
            const formattedDate = formatSaleDate(rawDate, comm.created_at);
            return (
              <div key={comm.id} className="text-[11px] flex flex-col border-b border-border/30 pb-1 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-extrabold text-foreground truncate max-w-[140px]">{clientName}</span>
                  <span className="font-bold text-primary">R$ {comm.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-[9px] text-muted-foreground mt-0.5">
                  <span>Pedido: #{ind?.sale_order_number || 'Sem número'}</span>
                  <span>Data: {formattedDate}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const handleNFUpload = async (file: File) => {
    setNfFile(file);
    if (!selectedStatement) return;
    
    setReadingNF(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result?.toString().split(',')[1];
        if (!base64) return;

        try {
          const data = await analyzeNF(base64, selectedStatement.total_value);
          
          if (data.matches) {
            toast.success(`Nota Fiscal validada! Valor R$ ${data.total} confere.`);
          } else {
            toast.warning(`Atenção: O valor da nota (R$ ${data.total}) parece diferente do total consolidado (R$ ${selectedStatement.total_value}).`);
          }
        } catch (aiErr) {
          console.error("AI Error:", aiErr);
          toast.error("Erro ao validar NF com IA");
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Erro ao ler NF com IA:", error);
    } finally {
      setReadingNF(false);
    }
  };

  const submitNF = async () => {
    if (!selectedStatement || !nfFile) return;
    setSubmitting(true);

    try {
      const storageRef = ref(storage, `commissions_nf/monthly_${selectedStatement.id}_${nfFile.name}`);
      await uploadBytes(storageRef, nfFile);
      const url = await getDownloadURL(storageRef);

      const statementRef = doc(db, 'monthly_statements', selectedStatement.id);
      const { id, ...data } = selectedStatement;
      await setDoc(statementRef, {
        ...data,
        id: selectedStatement.id,
        nf_url: url,
        status: 'waiting_payment',
        updated_at: new Date().toISOString()
      }, { merge: true });

      toast.success('Nota Fiscal consolidada enviada com sucesso!');
      setIsNFDialogOpen(false);
      setNfFile(null);
    } catch (error: any) {
      toast.error('Erro ao enviar NF: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitPayment = async () => {
    if (!selectedStatement || !paymentFile) return;
    setSubmitting(true);

    try {
      const storageRef = ref(storage, `commissions_receipts/monthly_${selectedStatement.id}_${paymentFile.name}`);
      await uploadBytes(storageRef, paymentFile);
      const url = await getDownloadURL(storageRef);

      const statementRef = doc(db, 'monthly_statements', selectedStatement.id);
      const { id, ...data } = selectedStatement;
      await setDoc(statementRef, {
        ...data,
        id: selectedStatement.id,
        payment_receipt_url: url,
        status: 'paid',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { merge: true });

      // Cascade status update to individual commissions
      if (selectedStatement.commission_ids && selectedStatement.commission_ids.length > 0) {
        for (const commId of selectedStatement.commission_ids) {
          await updateDoc(doc(db, 'commissions', commId), {
            status: 'paid',
            updated_at: new Date().toISOString()
          });
        }
      }

      toast.success('Comprovante de pagamento consolidado enviado!');
      setIsPaymentDialogOpen(false);
      setPaymentFile(null);
    } catch (error: any) {
      toast.error('Erro ao enviar comprovante: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const consolidatedSummaries = React.useMemo(() => {
    // Generate summaries from current month's commissions
    const summaries: Record<string, MonthlyStatement> = {};
    
    commissions.forEach(comm => {
      const sellerUid = comm.external_seller_uid;
      const key = `${sellerUid}_${selectedMonth}_${selectedYear}`;
      
      if (!summaries[key]) {
        // Look for existing statement in DB
        const existing = monthlyStatements.find(s => s.id === key);
        
        summaries[key] = existing ? { ...existing, total_value: 0, commission_ids: [] } : {
          id: key,
          seller_uid: sellerUid,
          seller_name: comm.external_seller_name || 'Vendedor',
          month: selectedMonth,
          year: selectedYear,
          total_value: 0,
          status: 'waiting_nf',
          commission_ids: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      summaries[key].total_value += comm.value;
      summaries[key].commission_ids.push(comm.id);
    });
    
    return Object.values(summaries);
  }, [commissions, monthlyStatements, selectedMonth, selectedYear]);

  const forecastData = React.useMemo(() => {
    const nextMonths = [0, 1, 2].map(i => {
      const d = addMonths(new Date(), i);
      return {
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        label: format(d, 'MMM/yy', { locale: ptBR }),
        total: 0
      };
    });

    nextMonths.forEach(m => {
      const monthComms = allCommissions.filter(c => c.month === m.month && c.year === m.year);
      m.total = monthComms.reduce((acc, curr) => acc + curr.value, 0);
    });

    return nextMonths;
  }, [allCommissions]);

  const totalCommissions = commissions.reduce((acc, curr) => acc + curr.value, 0);
  const paidCommissions = commissions.filter(c => c.status === 'paid').reduce((acc, curr) => acc + curr.value, 0);
  const pendingCommissions = totalCommissions - paidCommissions;

  const isInternalFinances = ['admin', 'financial', 'manager'].includes(profile?.role || '');

  const currentCalendarMonthSummaries = React.useMemo(() => {
    const summaries: Record<string, MonthlyStatement> = {};
    const curMonth = new Date().getMonth() + 1;
    const curYear = new Date().getFullYear();

    currentCommissions.forEach(comm => {
      const sellerUid = comm.external_seller_uid;
      const key = `${sellerUid}_${curMonth}_${curYear}`;
      
      if (!summaries[key]) {
        const existing = currentStatements.find(s => s.id === key);
        
        summaries[key] = existing ? { ...existing, total_value: 0, commission_ids: [] } : {
          id: key,
          seller_uid: sellerUid,
          seller_name: comm.external_seller_name || 'Vendedor',
          month: curMonth,
          year: curYear,
          total_value: 0,
          status: 'waiting_nf',
          commission_ids: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      
      summaries[key].total_value += comm.value;
      summaries[key].commission_ids.push(comm.id);
    });
    
    return Object.values(summaries);
  }, [currentCommissions, currentStatements]);

  const potentialTotal = React.useMemo(() => {
    if (!profile?.commission_rate) return 0;
    return potentialLeads.reduce((acc, lead) => {
      const baseValue = lead.base_commission_value || 0;
      return acc + (baseValue * (profile.commission_rate || 0) / 100);
    }, 0);
  }, [potentialLeads, profile]);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatório de Comissões</h1>
            <p className="text-muted-foreground">Acompanhe seus ganhos e faturamentos mensais.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[140px] bg-card border-border">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-card-foreground">
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[100px] bg-card border-border">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-card-foreground">
                {years.map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Central de Contas a Pagar: Relatório Financeiro de Comissões */}
        {isInternalFinances && (
          <div className="space-y-4 border border-border bg-card p-6 rounded-2xl relative overflow-hidden shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20">
                  <FileSpreadsheet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-black text-foreground tracking-tight flex items-center gap-2">
                    Contas a Pagar: Comissões do Mês Anterior (Vence até dia 7 de {format(new Date(), 'MMMM', { locale: ptBR })})
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Painel integrado para o setor financeiro consolidar, cobrar Nota Fiscal e efetuar os pagamentos de comissão.
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-600/10 text-emerald-600 border-emerald-500/20 font-black text-[10px] tracking-wider uppercase py-1 px-3 flex items-center gap-1 shrink-0">
                <Sparkles className="h-3 w-3 text-emerald-500" /> Relatório Financeiro
              </Badge>
            </div>

            {/* TABELA DE CONTAS A PAGAR */}
            <div className="border border-border rounded-xl overflow-hidden shadow-sm bg-card w-full">
              {/* GRID CONTAINER */}
              <div className="overflow-x-auto w-full">
                <table className="w-full border-collapse border-spacing-0 text-left min-w-[785px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 select-none text-[11px] font-bold border-b border-border">
                      <th className="px-4 py-3.5 text-left border-r border-border">Vendedor / Parceiro</th>
                      <th className="px-4 py-3.5 text-right border-r border-border">Valor da Comissão</th>
                      <th className="px-4 py-3.5 text-center border-r border-border">Nota Fiscal</th>
                      <th className="px-4 py-3.5 text-left border-r border-border">Chave PIX Depósito</th>
                      <th className="px-4 py-3.5 text-center border-r border-border">Tratamento / Status</th>
                      <th className="px-4 py-3.5 text-center">Ações Rápidas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* ROW 1: SPECIFIC PRE-INSTALLED ACCOUNT FOR MECÂNICA DIAS */}
                    <React.Fragment>
                      <tr 
                        className="hover:bg-slate-50 dark:hover:bg-slate-850/40 transition-colors text-xs font-medium cursor-pointer"
                      >
                        {/* Col A: Vendedor (clickable to collapse) */}
                        <td 
                          onClick={(e) => {
                            e.stopPropagation();
                            setMecanicaExpanded(!mecanicaExpanded);
                          }}
                          className="border-b border-r border-border px-4 py-3.5 font-bold text-foreground text-[13px] hover:text-emerald-600 flex items-center gap-1.5 select-none"
                        >
                          {mecanicaExpanded ? <ChevronDown className="h-4 w-4 text-emerald-500" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                          <div className="flex flex-col">
                            <span>{mecanicaProfile?.name || "Mecânica Dias"}</span>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-tight">Parceiro Indicador</span>
                            {mecanicaProfile?.phone && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 font-semibold flex items-center gap-1">
                                <span className="text-muted-foreground">Whats:</span> {mecanicaProfile.phone}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Col B: Valor Comissão */}
                        <td className="border-b border-r border-border px-4 py-3.5 text-right font-black font-mono text-foreground text-[14px]">
                          R$ 2.267,07
                        </td>

                        {/* Col C: Nota Fiscal */}
                        <td className="border-b border-r border-border px-4 py-3.5 text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            {mecanicaNfStatus === 'waiting_nf' && (
                              <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 uppercase font-black tracking-wider text-[8px] px-2 py-0.5">
                                Aguardando NF
                              </Badge>
                            )}
                            {mecanicaNfStatus === 'waiting_payment' && (
                              <div className="flex flex-col items-center gap-0.5">
                                <Badge className="bg-blue-500/10 text-blue-550 border-blue-500/20 uppercase font-black tracking-wider text-[8px] px-2 py-0.5 flex items-center gap-0.5">
                                  NF Enviada
                                </Badge>
                                <span className="text-[9.5px] text-muted-foreground underline cursor-pointer hover:text-primary">ver_nota_mecanica_dias.pdf</span>
                              </div>
                            )}
                            {mecanicaNfStatus === 'paid' && (
                              <div className="flex flex-col items-center gap-0.5">
                                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 uppercase font-black tracking-wider text-[8px] px-2 py-0.5 flex items-center gap-0.5">
                                  <Check className="h-2.5 w-2.5" /> Recebida & Ativa
                                </Badge>
                                <span className="text-[8px] text-muted-foreground uppercase font-mono">NF-e #9414</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Col D: Chave PIX */}
                        <td className="border-b border-r border-border px-4 py-3.5">
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(mecanicaPixKey);
                              setCopiedPixId("mecanica-pix");
                              toast.success(`Chave PIX de ${mecanicaProfile?.name || "Mecânica Dias"} copiada para transferência!`);
                              setTimeout(() => setCopiedPixId(null), 2000);
                            }}
                            className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg border border-border hover:bg-emerald-555/5 hover:border-emerald-500/30 font-mono text-center cursor-pointer transition-all flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-350"
                            title="Clique para copiar a chave PIX"
                          >
                            <span className="truncate">{mecanicaProfile?.pix_key || "12.345.678/0001-99"}</span>
                            {copiedPixId === "mecanica-pix" ? (
                              <Check className="h-3.5 w-3.5 text-green-500 shrink-0 ml-1.5" />
                            ) : (
                              <Copy className="h-3 w-3 text-slate-400 shrink-0 ml-1.5 hover:text-emerald-500" />
                            )}
                          </div>
                          <span className="text-[9px] text-muted-foreground/80 block mt-0.5 text-center lowercase">
                            {mecanicaProfile?.pix_key ? "chave cadastrada" : "cnpj • mecânica dias ltda"}
                          </span>
                        </td>

                        {/* Col E: Pagamento Status */}
                        <td className="border-b border-r border-border px-4 py-3.5 text-center font-semibold">
                          <div className="flex flex-col items-center justify-center gap-1">
                            {mecanicaNfStatus === 'waiting_nf' && (
                              <Badge className="bg-orange-500/10 text-orange-555 border-orange-500/20 uppercase font-black text-[9px]">
                                Aguardando NF
                              </Badge>
                            )}
                            {mecanicaNfStatus === 'waiting_payment' && (
                              <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 uppercase font-black text-[9px] animate-pulse">
                                Pendente Pgto
                              </Badge>
                            )}
                            {mecanicaNfStatus === 'paid' && (
                              <div className="flex flex-col items-center gap-0.5">
                                <Badge className="bg-green-500/10 text-green-500 border-green-500/20 uppercase font-black text-[9px]">
                                  Pago
                                </Badge>
                                <span className="text-[9px] text-green-600 font-extrabold italic">
                                  {mecanicaPaidDate || "Pago em 03/06/2026"}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Col F: Ações Rápidas */}
                        <td className="border-b border-border px-4 py-3.5 text-center">
                          <div className="flex gap-1.5 items-center justify-center" onClick={(e) => e.stopPropagation()}>
                            {mecanicaNfStatus === 'waiting_nf' && (
                              <Button
                                onClick={() => {
                                  const text = encodeURIComponent(`Olá, ${mecanicaProfile?.name || "Mecânica Dias"}! Tudo bem?\n\nConcluímos o fechamento das suas comissões de competência Maio/2026 para pagamento em Junho/2026.\nO valor total de comissão calculada é de *R$ 2.267,07* (2% de comissão sobre a base de produtos comissionáveis de R$ 113.353,74).\n\n*Nota explicativa sobre o cálculo:* Lembramos que o seu comissionamento incide exclusivamente sobre o valor líquido dos equipamentos comissionáveis de fábrica. Valores relacionados a itens como kits extras de instalação, frete, deslocamento para entrega técnica ou serviços de instalação não contemplam a base de cálculo de comissões. Por esse motivo, é normal e esperado que o valor total de faturamento ou da Nota Fiscal final ao cliente seja maior do que a base comissionável de produtos aqui especificada.\n\nPor favor, emita e nos envie a Nota Fiscal com este valor de R$ 2.267,07 para darmos continuidade ao pagamento.\n\n*Vendas correspondentes à sua comissão:*\n\n- *Cliente*: EUCAZIN LTDA\n  *Pedido*: #9414\n  *Equipamento(s)*: 1x CARREGADOR FRONTAL CFR600, 1x ENGATE RAPIDO SINOMACH 937H, 1x ADAPTACAO CONCHA SINOMACH 937H\n  *Comissão*: R$ 2.267,07\n\nPor favor, emita e nos envie a Nota Fiscal de serviço com este valor de R$ 2.267,07 para darmos continuidade ao pagamento até o dia 7.\n\nAgradecemos a parceria! 🙏`);
                                  window.open(`https://wa.me/${mecanicaPhone}?text=${text}`, '_blank');
                                  toast.info("WhatsApp aberto com cobrança formatada!");
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] h-7 px-2 flex items-center gap-1 uppercase tracking-wider rounded"
                              >
                                <MessageSquare className="h-3 w-3" /> Cobrar NF
                              </Button>
                            )}

                            {mecanicaNfStatus === 'waiting_nf' && (
                              <Button
                                onClick={() => {
                                  setSelectedStatement({
                                    id: 'mecanica_dias_id',
                                    seller_name: 'Mecânica Dias',
                                    total_value: 2267.07,
                                  } as any);
                                  setNfStep('ask');
                                  setIsNFDialogOpen(true);
                                }}
                                variant="outline"
                                className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[9px] h-7 px-2.5 font-bold uppercase text-slate-700 dark:text-slate-200 rounded flex items-center gap-1 shadow-sm"
                              >
                                <Upload className="h-3 w-3 mr-1 text-emerald-500" /> Anexar NF
                              </Button>
                            )}

                            {mecanicaNfStatus === 'waiting_payment' && (
                              <div className="flex gap-1.5 items-center justify-center">
                                <Button
                                  onClick={() => {
                                    const pixKey = mecanicaPixKey || "12.345.678/0001-99";
                                    const name = mecanicaProfile?.name || "Mecânica Dias";
                                    const confirmMsg = `COMPROVAÇÃO DE PAGAMENTO PIX:\n\n` + 
                                                       `• Favorecido: ${name}\n` +
                                                       `• Valor: R$ 2.267,07\n` +
                                                       `• Chave PIX: ${pixKey}\n\n` +
                                                       `Você confirma que a transferência bancária/PIX foi efetuada com sucesso?`;
                                    
                                    setConfirmDialog({
                                      isOpen: true,
                                      title: 'Comprovar Pagamento PIX (Simulado)',
                                      description: confirmMsg,
                                      confirmText: 'Sim, Confirmar Pagamento',
                                      onConfirm: async () => {
                                        const today = format(new Date(), 'dd/MM/yyyy');
                                        setMecanicaNfStatus('paid');
                                        setMecanicaPaidDate(`Pago em ${today}`);
                                        try {
                                          await setDoc(doc(db, 'monthly_statements', 'mecanica_dias_id'), {
                                            id: 'mecanica_dias_id',
                                            seller_name: mecanicaProfile?.name || 'Mecânica Dias',
                                            seller_uid: mecanicaProfile?.uid || 'mecanica_dias_uid',
                                            total_value: 2267.07,
                                            status: 'paid',
                                            paid_at: `Pago em ${today}`,
                                            month: 5,
                                            year: 2026,
                                            updated_at: new Date().toISOString()
                                          }, { merge: true });
                                          toast.success("Pagamento de Mecânica Dias concluído com sucesso!");
                                        } catch (err: any) {
                                          toast.error("Erro ao salvar pagamento: " + err.message);
                                        }
                                      }
                                    });
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white font-bold text-[9px] h-7 px-3 flex items-center gap-1 uppercase tracking-wider rounded animate-pulse shadow animate-duration-500"
                                >
                                  <CheckCircle2 className="h-3 w-3" /> Pagar PIX
                                </Button>
                                
                                <Button
                                  onClick={() => {
                                    setConfirmDialog({
                                      isOpen: true,
                                      title: 'Reverter Nota Fiscal (Simulado)',
                                      description: "Deseja realmente cancelar o recebimento desta Nota Fiscal para reverter o status de volta para 'Aguardando NF'?",
                                      confirmText: 'Reverter',
                                      onConfirm: async () => {
                                        setMecanicaNfStatus('waiting_nf');
                                        try {
                                          await setDoc(doc(db, 'monthly_statements', 'mecanica_dias_id'), {
                                            id: 'mecanica_dias_id',
                                            seller_name: mecanicaProfile?.name || 'Mecânica Dias',
                                            seller_uid: mecanicaProfile?.uid || 'mecanica_dias_uid',
                                            total_value: 2267.07,
                                            status: 'waiting_nf',
                                            paid_at: null,
                                            month: 5,
                                            year: 2026,
                                            updated_at: new Date().toISOString()
                                          }, { merge: true });
                                          toast.info("Status de Mecânica Dias revertido para Aguardando NF!");
                                        } catch (err: any) {
                                          toast.error("Erro ao reverter status: " + err.message);
                                        }
                                      }
                                    });
                                  }}
                                  variant="ghost"
                                  className="hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 text-[9px] h-7 px-2 font-bold uppercase text-slate-500 border border-dashed border-slate-350 rounded"
                                  title="Reverter upload de Nota Fiscal"
                                >
                                  <Undo className="h-3.5 w-3.5" /> Reverter
                                </Button>
                              </div>
                            )}
 
                             {mecanicaNfStatus === 'paid' && (
                              <div className="flex gap-1.5 items-center justify-center">
                                <span className="text-[10px] text-green-500 font-extrabold flex items-center gap-1 italic">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Liquidado
                                </span>
                                <Button
                                  onClick={() => {
                                    setConfirmDialog({
                                      isOpen: true,
                                      title: 'Reverter Pagamento PIX (Simulado)',
                                      description: "Deseja cancelar o pagamento que foi marcado por engano (fazer um teste) e reverter de volta para 'Pendente Pagamento'?",
                                      confirmText: 'Reverter',
                                      onConfirm: async () => {
                                        setMecanicaNfStatus('waiting_payment');
                                        setMecanicaPaidDate(null);
                                        try {
                                          await setDoc(doc(db, 'monthly_statements', 'mecanica_dias_id'), {
                                            id: 'mecanica_dias_id',
                                            seller_name: mecanicaProfile?.name || 'Mecânica Dias',
                                            seller_uid: mecanicaProfile?.uid || 'mecanica_dias_uid',
                                            total_value: 2267.07,
                                            status: 'waiting_payment',
                                            paid_at: null,
                                            month: 5,
                                            year: 2026,
                                            updated_at: new Date().toISOString()
                                          }, { merge: true });
                                          toast.info("Pagamento cancelado e status revertido!");
                                        } catch (err: any) {
                                          toast.error("Erro ao reverter pagamento: " + err.message);
                                        }
                                      }
                                    });
                                  }}
                                  variant="outline"
                                  className="border-dashed border-rose-500/30 hover:bg-rose-500/5 text-[9px] h-7 px-2 font-bold uppercase text-rose-600 rounded flex items-center gap-1"
                                >
                                  <Undo className="h-3 w-3" /> Reverter Pgto
                                </Button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* ROW 1 COMMISSIONS EXPANSION (DURABLE WORKSPACE GRID) */}
                      {mecanicaExpanded && (
                        <tr className="bg-slate-50/70 dark:bg-slate-900/60 transition-all select-none border-b border-border">
                          <td colSpan={6} className="border-b border-border px-6 py-4">
                            <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-250 dark:border-slate-800 shadow-inner space-y-3">
                              
                              <div className="flex items-center justify-between border-b border-dashed border-slate-200 dark:border-slate-800 pb-2">
                                <h5 className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                                  <Grid className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                                  Detalhamento da Composição do Saldo (Total de Vendas Concluídas do Competência Mês Anterior)
                                </h5>
                                <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-[9px] tracking-widest uppercase">
                                  1 Venda Concluída
                                </Badge>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-[11px] border-collapse bg-slate-50/50 dark:bg-slate-900/50 rounded-lg overflow-hidden">
                                  <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-extrabold uppercase select-none">
                                      <th className="px-3 py-2 font-black">Nº Pedido</th>
                                      <th className="px-3 py-2 font-black">Cliente / Razão Social</th>
                                      <th className="px-3 py-1.5 font-black">Localização</th>
                                      <th className="px-3 py-1.5 font-black">Data Pedido</th>
                                      <th className="px-3 py-1.5 font-black">Data Entrega</th>
                                      <th className="px-3 py-2 font-black text-right font-mono">Valor Total do Pedido (NF)</th>
                                      <th className="px-3 py-2 font-black text-right font-mono">Valor Comissionável</th>
                                      <th className="px-3 py-2 font-black text-center">Taxa (%)</th>
                                      <th className="px-3 py-2 font-black text-right text-emerald-600 dark:text-emerald-400">Comissão Devida</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="border-b border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-slate-850 transition-colors">
                                      <td className="px-3 py-2.5 font-bold text-slate-650 dark:text-slate-350">PED-9414</td>
                                      <td className="px-3 py-2.5 font-black text-foreground">EUCAZIN LTDA</td>
                                      <td className="px-3 py-2.5 text-slate-550 dark:text-slate-400">Araguacema - TO</td>
                                      <td className="px-3 py-2.5 text-muted-foreground font-mono">28/05/2026</td>
                                      <td className="px-3 py-2.5 text-muted-foreground font-mono">13/07/2026</td>
                                      <td className="px-3 py-2.5 text-right text-slate-700 dark:text-slate-300 font-bold font-mono">R$ 146.353,74</td>
                                      <td className="px-3 py-2.5 text-right text-muted-foreground font-mono">R$ 113.353,74</td>
                                      <td className="px-3 py-2.5 text-center text-slate-550 font-bold">2,00%</td>
                                      <td className="px-3 py-2.5 text-right font-black text-emerald-650 dark:text-emerald-400 text-xs">R$ 2.267,07</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              {/* Products Breakdown Sub-table */}
                              <div className="space-y-1.5 pt-1.5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Lista de Itens que Compõem o Pedido:</span>
                                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                                  <table className="w-full text-left text-[11px] border-collapse bg-slate-50/30 dark:bg-slate-900/10 font-sans">
                                    <thead>
                                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/70 text-[9.5px] text-slate-500 font-extrabold uppercase select-none">
                                        <th className="px-3 py-1.5 font-black">Código</th>
                                        <th className="px-3 py-1.5 font-black">Descrição</th>
                                        <th className="px-3 py-1.5 font-black text-center animate-pulse">Qtd</th>
                                        <th className="px-3 py-1.5 font-black text-right">Valor Unitário</th>
                                        <th className="px-3 py-1.5 font-black text-center">Tipo</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr className="border-b border-slate-200/50 dark:border-slate-800/10 hover:bg-slate-100/50 dark:hover:bg-slate-850 transition-colors">
                                        <td className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-400 font-mono">1000.1484.0000</td>
                                        <td className="px-3 py-1.5 text-foreground font-medium">ADAPTACAO CONCHA SINOMACH 937H</td>
                                        <td className="px-3 py-1.5 text-center font-bold">1</td>
                                        <td className="px-3 py-1.5 text-right text-muted-foreground font-mono">R$ 7.165,74</td>
                                        <td className="px-3 py-1.5 text-center">
                                          <Badge className="bg-emerald-500/10 text-emerald-600 border-transparent hover:bg-emerald-500/20 text-[8.5px] font-bold py-0 h-4">Comissionável</Badge>
                                        </td>
                                      </tr>
                                      <tr className="border-b border-slate-200/50 dark:border-slate-800/10 hover:bg-slate-100/50 dark:hover:bg-slate-850 transition-colors">
                                        <td className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-400 font-mono">1000.0000.0064</td>
                                        <td className="px-3 py-1.5 text-foreground font-medium">CARREGADOR FRONTAL CFR600 PARA ENGATE RAPIDO RODER</td>
                                        <td className="px-3 py-1.5 text-center font-bold">1</td>
                                        <td className="px-3 py-1.5 text-right text-muted-foreground font-mono">R$ 87.988,00</td>
                                        <td className="px-3 py-1.5 text-center">
                                          <Badge className="bg-emerald-500/10 text-emerald-600 border-transparent hover:bg-emerald-500/20 text-[8.5px] font-bold py-0 h-4">Comissionável</Badge>
                                        </td>
                                      </tr>
                                      <tr className="border-b border-slate-200/50 dark:border-slate-800/10 hover:bg-slate-100/50 dark:hover:bg-slate-850 transition-colors">
                                        <td className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-400 font-mono">1000.1483.0000</td>
                                        <td className="px-3 py-1.5 text-foreground font-medium">ENGATE RAPIDO SINOMACH 937H</td>
                                        <td className="px-3 py-1.5 text-center font-bold">1</td>
                                        <td className="px-3 py-1.5 text-right text-muted-foreground font-mono">R$ 18.200,00</td>
                                        <td className="px-3 py-1.5 text-center">
                                          <Badge className="bg-emerald-500/10 text-emerald-600 border-transparent hover:bg-emerald-500/20 text-[8.5px] font-bold py-0 h-4">Comissionável</Badge>
                                        </td>
                                      </tr>
                                      <tr className="hover:bg-slate-100/50 dark:hover:bg-slate-850 transition-colors">
                                        <td className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-400 font-mono">9000.9000.9027</td>
                                        <td className="px-3 py-1.5 text-foreground font-medium">KIT 3ª E 4ª FUNCAO 24V PARA PA CARREGADEIRA</td>
                                        <td className="px-3 py-1.5 text-center font-bold">1</td>
                                        <td className="px-3 py-1.5 text-right text-muted-foreground font-mono">R$ 33.000,00</td>
                                        <td className="px-3 py-1.5 text-center">
                                          <Badge className="bg-red-500/10 text-red-650 border-transparent hover:bg-red-500/20 text-[8.5px] font-bold py-0 h-4">Não Comissionável (NC)</Badge>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              <div className="flex justify-between items-center text-[10px] text-muted-foreground p-2 rounded bg-slate-100/40 dark:bg-slate-800/40 border-l-4 border-l-emerald-500 italic mt-1 leading-relaxed">
                                <span>
                                  * O comissionamento de Mecânica Dias foi fixado e calculado baseando-se no desconto aplicado. O parceiro tem proteção de lead ativa com a Roder Brasil por 60 dias a contar do envio do orçamento.
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>

                    {/* DYNAMIC DATABASE RECORDS MAP */}
                    {currentCalendarMonthSummaries.map((statement, idx) => {
                      const sComms = currentCommissions.filter(c => c.external_seller_uid === statement.seller_uid);
                      const isWaitingNF = statement.status === 'waiting_nf';
                      const isWaitingPayment = statement.status === 'waiting_payment';
                      const isPaid = statement.status === 'paid';
                      const sellerProf = sellerProfiles[statement.seller_uid];
                      const isExpanded = !!expandedStatementIds[statement.id];

                      return (
                        <React.Fragment key={`statement-row-${statement.id}`}>
                          <tr 
                            className="transition-colors text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          >
                            {/* Col A Vendedor (clickable to collapse) */}
                            <td 
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedStatementIds(prev => ({ ...prev, [statement.id]: !prev[statement.id] }));
                              }}
                              className="border-b border-r border-border px-4 py-3.5 font-bold text-foreground text-[13px] hover:text-emerald-600 flex items-center gap-1.5 select-none"
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4 text-emerald-500" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                              <div className="flex flex-col">
                                <span>{sellerProf?.name || statement.seller_name}</span>
                                <span className="text-[9px] text-muted-foreground uppercase tracking-tight">Vendedor Integrado</span>
                                {sellerProf?.phone && (
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 font-semibold flex items-center gap-1">
                                    <span className="text-muted-foreground">Whats:</span> {sellerProf.phone}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Col B Total Comissão */}
                            <td className="border-b border-r border-border px-4 py-3.5 text-right font-black font-mono text-foreground text-[14px]">
                              R$ {statement.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>

                            {/* Col C Nota Fiscal */}
                            <td className="border-b border-r border-border px-4 py-3.5 text-center">
                              <div className="flex flex-col items-center justify-center gap-1">
                                {isWaitingNF && (
                                  <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/20 uppercase font-black tracking-wider text-[8px] px-2 py-0.5">
                                    Aguardando NF
                                  </Badge>
                                )}
                                {isWaitingPayment && (
                                  <div className="flex flex-col items-center gap-0.5" onClick={(e) => { e.stopPropagation(); if (statement.nf_url) window.open(statement.nf_url, '_blank'); }}>
                                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 uppercase font-black tracking-wider text-[8px] px-2 py-0.5 flex items-center gap-1 cursor-pointer hover:bg-blue-500/25">
                                      Ver NF Anexa ↗
                                    </Badge>
                                  </div>
                                )}
                                {isPaid && (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <Badge className="bg-green-500/10 text-green-650 border-green-500/20 uppercase font-black tracking-wider text-[8px] px-2 py-0.5 flex items-center gap-0.5">
                                      <Check className="h-2.5 w-2.5" /> Pago
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Col D Chave PIX */}
                            <td className="border-b border-r border-border px-4 py-3.5">
                              {sellerProf ? (
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(sellerProf.pix_key || '');
                                    setCopiedPixId(statement.id);
                                    toast.success(`Chave PIX de ${statement.seller_name} copiada!`);
                                    setTimeout(() => setCopiedPixId(null), 2000);
                                  }}
                                  className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg border border-border hover:bg-emerald-555/5 hover:border-emerald-500/30 font-mono text-center cursor-pointer transition-all flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-350"
                                  title="Clique para copiar a chave PIX"
                                >
                                  <span className="truncate">{sellerProf.pix_key || 'Chave não cadastrada'}</span>
                                  {copiedPixId === statement.id ? (
                                    <Check className="h-3.5 w-3.5 text-green-500 shrink-0 ml-1.5" />
                                  ) : (
                                    <Copy className="h-3 w-3 text-slate-400 shrink-0 ml-1.5" />
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-[10px] italic">Sem Chave PIX</span>
                              )}
                            </td>

                            {/* Col E Pagamento */}
                            <td className="border-b border-r border-border px-4 py-3.5 text-center">
                              <div className="flex flex-col items-center justify-center gap-1 font-semibold">
                                {isPaid ? (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20 uppercase font-black text-[9px]">
                                      Pago & Liquidado
                                    </Badge>
                                    <span className="text-[9px] text-muted-foreground">{statement.paid_at ? format(new Date(statement.paid_at), 'dd/MM/yyyy') : 'Concluído'}</span>
                                  </div>
                                ) : isWaitingPayment ? (
                                  <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 uppercase font-black text-[9px] animate-pulse">
                                    Pendente Liberação
                                  </Badge>
                                ) : (
                                  <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 uppercase font-black text-[9px]">
                                    Aguardando NF
                                  </Badge>
                                )}
                              </div>
                            </td>

                            {/* Col F Ações */}
                            <td className="border-b border-border px-4 py-3.5 text-center">
                              <div className="flex gap-1.5 items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                {isWaitingNF && (
                                  <div className="flex gap-1.5 items-center justify-center">
                                    <Button
                                      onClick={() => handleWhatsAppClick(statement, sComms)}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] h-7 px-2 flex items-center gap-1 uppercase tracking-wider rounded"
                                    >
                                      <MessageSquare className="h-3 w-3" /> Cobrar NF
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        setSelectedStatement(statement);
                                        setNfStep('ask');
                                        setIsNFDialogOpen(true);
                                      }}
                                      variant="outline"
                                      className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[9px] h-7 px-2.5 font-bold uppercase text-slate-700 dark:text-slate-200 rounded flex items-center gap-1 shadow-sm"
                                    >
                                      <Upload className="h-3 w-3 text-emerald-500" /> Anexar NF
                                    </Button>
                                  </div>
                                )}

                                {isWaitingPayment && (
                                  <div className="flex gap-1 justify-center items-center">
                                    <Button
                                      onClick={() => handleMarkAsPaidDirect(statement)}
                                      className="bg-green-600 hover:bg-green-700 text-white font-bold text-[9px] h-7 px-2 uppercase tracking-wider rounded flex items-center gap-1"
                                    >
                                      <CheckCircle2 className="h-3 w-3" /> Pagar Direct
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedStatement(statement);
                                        setIsPaymentDialogOpen(true);
                                      }}
                                      className="border-slate-205 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[9px] h-7 px-1.5 uppercase tracking-wider rounded text-slate-700 dark:text-slate-350"
                                    >
                                      Recibo
                                    </Button>
                                    
                                    <Button
                                      onClick={() => handleRevertStatementStatus(statement, 'waiting_nf')}
                                      variant="ghost"
                                      className="hover:bg-red-500/10 hover:text-red-650 hover:border-red-500/30 text-[9px] h-7 px-2 font-bold uppercase text-slate-500 border border-dashed border-slate-350 rounded"
                                      title="Reverter upload de Nota Fiscal"
                                    >
                                      <Undo className="h-3.5 w-3.5" /> Reverter
                                    </Button>
                                  </div>
                                )}

                                {isPaid && (
                                  <div className="flex gap-1.5 items-center justify-center">
                                    <span className="text-green-500 font-bold italic text-[9px]">✔ Processado</span>
                                    <Button
                                      onClick={() => handleRevertStatementStatus(statement, 'waiting_payment')}
                                      variant="outline"
                                      className="border-dashed border-rose-500/30 hover:bg-rose-500/5 text-[9px] h-7 px-2 font-bold uppercase text-rose-600 rounded flex items-center gap-1"
                                    >
                                      <Undo className="h-3.5 w-3.5" /> Reverter Pgto
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Database Expanded sub-grid */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70 dark:bg-slate-900/60 transition-all select-none border-b border-border">
                              <td colSpan={6} className="border-b border-border px-6 py-4">
                                <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-250 dark:border-slate-800 shadow-inner space-y-3">
                                  <div className="flex items-center justify-between border-b border-dashed border-slate-200 dark:border-slate-800 pb-2">
                                    <h5 className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                                      <Grid className="h-3.5 w-3.5 text-emerald-500" />
                                      Composição de Fechamento de Vendas ({statement.seller_name})
                                    </h5>
                                    <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-[9px] tracking-wide uppercase px-2 py-0.5">
                                      {sComms.length} Vendas Registradas
                                    </Badge>
                                  </div>

                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[11px] border-collapse bg-slate-50/50 dark:bg-slate-900/50 rounded-lg overflow-hidden">
                                      <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 text-slate-500 font-black uppercase select-none">
                                          <th className="px-3 py-2">Faturamento / Pedido</th>
                                          <th className="px-3 py-2">Cliente / Comitente</th>
                                          <th className="px-3 py-2 text-right">Valor Total do Pedido (NF)</th>
                                          <th className="px-3 py-2 text-right font-mono">Total Comissionável</th>
                                          <th className="px-3 py-2 text-right text-emerald-600 dark:text-emerald-400">Sua Comissão</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {sComms.length === 0 ? (
                                          <tr>
                                            <td colSpan={5} className="px-3 py-4 text-center text-muted-foreground italic">Nenhum pedido associado encontrado.</td>
                                          </tr>
                                        ) : (
                                          sComms.map(comm => {
                                            const ind = linkedIndications[comm.indication_id];
                                            const clientName = ind?.client_name || 'Cliente';
                                            const saleVal = ind?.sale_order_value || ind?.value || (comm.value / 0.03); // fallback assuming standard 3% commission
                                            const commValueable = ind?.base_commission_value || comm.value / 0.03;
                                            
                                            return (
                                              <tr key={comm.id} className="border-b last:border-0 hover:bg-slate-100/50 dark:hover:bg-slate-850 transition-colors">
                                                <td className="px-3 py-2.5 font-bold">#{ind?.sale_order_number || comm.id.slice(-6).toUpperCase()}</td>
                                                <td className="px-3 py-2.5 font-black text-foreground">{clientName}</td>
                                                <td className="px-3 py-2.5 text-right text-slate-700 dark:text-slate-300 font-bold font-mono">R$ {saleVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">R$ {commValueable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                <td className="px-3 py-2.5 text-right font-black text-emerald-650 dark:text-emerald-400">R$ {comm.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                              </tr>
                                            );
                                          })
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}

                    {/* CONSOLIDATED FOOTER ROW */}
                    <tr className="bg-slate-50/50 dark:bg-slate-800 font-bold select-none text-[12px] text-foreground border-t-2 border-border/80">
                      <td className="px-4 py-4 font-black flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground text-[10px]">
                        <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>Total de Comissões</span>
                      </td>
                      <td className="px-4 py-4 text-right font-black font-mono border-b-double text-emerald-600 dark:text-emerald-400 text-[15px] underline decoration-double decoration-emerald-500 leading-none">
                        R$ {(2267.07 + currentCalendarMonthSummaries.reduce((a, b) => a + b.total_value, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td colSpan={4} className="px-4 py-4 text-right text-muted-foreground font-medium italic text-[11px]">
                        Mensalidade consolidada para repasse aos parceiros e indicadores.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

        {/* Monthly Consolidation Section - Disabled as requested */}
        <div className="hidden space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Fechamento Mensal</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full h-32 flex items-center justify-center bg-card rounded-xl border border-dashed border-border text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Carregando fechamentos...
              </div>
            ) : consolidatedSummaries.length === 0 ? (
              <div className="col-span-full h-32 flex items-center justify-center bg-card rounded-xl border border-dashed border-border text-muted-foreground italic">
                Nenhuma comissão acumulada para este período.
              </div>
            ) : (
                consolidatedSummaries.map(statement => {
                  const sComms = commissions.filter(c => c.external_seller_uid === statement.seller_uid);
                  const isWaitingNF = statement.status === 'waiting_nf';
                  const isWaitingPayment = statement.status === 'waiting_payment';
                  const isPaid = statement.status === 'paid';
                  const sellerProf = sellerProfiles[statement.seller_uid];

                  return (
                    <Card key={statement.id} className="bg-card border-border shadow-sm border-l-4 border-l-primary">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">
                          {months.find(m => m.value === statement.month)?.label} / {statement.year}
                        </p>
                        <h4 className="font-bold text-foreground">{statement.seller_name}</h4>
                      </div>
                      <Badge className={cn(
                        "text-[12px]",
                        isPaid ? "bg-green-500/10 text-green-500 border-green-500/20" :
                        isWaitingPayment ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                        "bg-orange-500/10 text-orange-500 border-orange-500/20"
                      )}>
                        {isPaid ? 'Pago' : isWaitingPayment ? 'Pendende Pgto' : 'Aguardando NF'}
                      </Badge>
                    </div>

                    {/* PIX details display */}
                    {isInternalFinances && sellerProf && (
                      <div className="text-[10px] bg-muted/40 p-2 rounded-lg border border-border/50 text-muted-foreground leading-relaxed">
                        <span className="font-bold text-foreground block">Chave PIX / Dados:</span>
                        <span className="font-mono text-foreground font-bold">{sellerProf.pix_key || 'Chave não cadastrada'}</span>
                      </div>
                    )}

                    {/* Show clients and sales forming this commission */}
                    {renderStatementDetails(statement, commissions)}

                    <div className="flex items-center justify-between py-2 border-y border-border">
                      <span className="text-sm text-muted-foreground">Total à Receber:</span>
                      <span className="text-xl font-bold text-primary">R$ {statement.total_value.toLocaleString('pt-BR')}</span>
                    </div>

                    <div className="flex gap-2">
                      {profile?.role === 'external_seller' && statement.status === 'waiting_nf' ? (
                        <Button 
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm h-10"
                          onClick={() => {
                            setSelectedStatement(statement);
                            setIsNFDialogOpen(true);
                          }}
                        >
                          <Upload className="h-3.5 w-3.5 mr-2" /> Emitir NF Única
                        </Button>
                      ) : (
                        <div className="flex gap-2 w-full">
                          {statement.nf_url && (
                             <Button 
                              variant="outline" 
                              className="flex-1 text-xs h-8 border-border"
                              onClick={() => window.open(statement.nf_url, '_blank')}
                             >
                               <FileText className="h-3.5 w-3.5 mr-2" /> Ver NF
                             </Button>
                          )}
                          
                          {(profile?.role === 'admin' || profile?.role === 'financial') && statement.status === 'waiting_payment' && (
                             <Button 
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                              onClick={() => {
                                setSelectedStatement(statement);
                                setIsPaymentDialogOpen(true);
                              }}
                             >
                               <CreditCard className="h-3.5 w-3.5 mr-2" /> Pagar
                             </Button>
                          )}

                          {statement.payment_receipt_url && (
                            <Button 
                              variant="outline" 
                              className="flex-1 text-xs h-8 border-green-500/30 text-green-500"
                              onClick={() => window.open(statement.payment_receipt_url, '_blank')}
                            >
                               <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Recibo
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Admin actions inside filter-list card */}
                    {isInternalFinances && isWaitingNF && (
                      <Button
                        onClick={() => handleWhatsAppClick(statement, sComms)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] h-8 flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="h-4 w-4 shrink-0" /> Cobrar NF via WhatsApp
                      </Button>
                    )}

                    {isInternalFinances && isWaitingPayment && (
                      <Button
                        onClick={() => handleMarkAsPaidDirect(statement)}
                        className="w-full bg-green-600/10 hover:bg-green-600 hover:text-white text-green-500 font-extrabold text-[11px] h-8"
                      >
                        Marcar Executado Direct 🚀
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
          </div>
        </div>

        {profile?.role === 'external_seller' ? (
          <div className="space-y-6">
            <Card className="bg-card border-border shadow-sm overflow-hidden border-t-4 border-t-emerald-500">
              <CardHeader className="pb-3 bg-slate-500/[0.02] border-b border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                      Planilha de Comissões e Vendas
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Controle mensal de recebimentos, histórico de notas fiscais e composição de comissões por venda.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs py-1 self-start font-bold uppercase">
                    Parceiro Ativo
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Spreadsheet Table Container */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-500/[0.04] dark:bg-slate-900/[0.4] font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground select-none">
                      <tr className="border-b border-border">
                        <th className="px-3 py-2 text-center w-10 border-r border-border">Seq</th>
                        <th className="px-3 py-2 border-r border-border">Mês / Competência</th>
                        <th className="px-3 py-2 text-right border-r border-border">Valor da Comissão</th>
                        <th className="px-3 py-2 text-center border-r border-border">Nota Fiscal</th>
                        <th className="px-3 py-2 text-center border-r border-border">Status</th>
                        <th className="px-3 py-2 text-center w-36">Ações Rápidas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {partnerPeriods.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground italic">
                            Nenhum período de comissão registrado.
                          </td>
                        </tr>
                      ) : (
                        partnerPeriods.map((period, index) => {
                          const isExpanded = !!expandedPartnerPeriodKeys[period.key];
                          
                          // Custom translation and color scheme for spreadsheet status
                          const isCurrent = period.isCurrent;
                          const isWaitingNF = period.status === 'waiting_nf';
                          const isWaitingPayment = period.status === 'waiting_payment';
                          const isPaid = period.status === 'paid';

                          return (
                            <React.Fragment key={period.key}>
                              <tr 
                                className={cn(
                                  "hover:bg-slate-100/40 dark:hover:bg-slate-900/30 transition-colors border-b border-border font-medium cursor-pointer",
                                  isCurrent ? "bg-blue-500/[0.02]" : "",
                                  isExpanded ? "bg-slate-100/50 dark:bg-slate-900/40" : ""
                                )}
                                onClick={() => {
                                  setExpandedPartnerPeriodKeys(prev => ({
                                    ...prev,
                                    [period.key]: !prev[period.key]
                                  }));
                                }}
                              >
                                {/* Index Column */}
                                <td className="px-3 py-2.5 text-center text-muted-foreground font-mono select-none border-r border-border">
                                  {index + 1}
                                </td>

                                {/* Competence Month */}
                                <td className="px-3 py-2.5 text-foreground font-semibold flex items-center gap-1.5 border-r border-border">
                                  {isExpanded ? (
                                    <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                  )}
                                  <span>{period.label}</span>
                                  {isCurrent && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border-blue-500/20 shrink-0 select-none font-extrabold scale-[0.9] origin-left uppercase">
                                      Mês Vigente
                                    </span>
                                  )}
                                </td>

                                {/* Commission Value */}
                                <td className="px-3 py-2.5 text-right font-black font-mono text-emerald-600 dark:text-emerald-400 select-none border-r border-border">
                                  R$ {period.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>

                                {/* NF Status */}
                                <td className="px-3 py-2.5 text-center select-none border-r border-border">
                                  {isCurrent ? (
                                    <span className="text-[10px] text-muted-foreground italic font-normal">Mês em andamento</span>
                                  ) : isWaitingNF ? (
                                    <span className="text-[10px] text-orange-600 font-bold flex items-center justify-center gap-1">
                                      <Clock className="h-3 w-3" /> Pendente de Envio
                                    </span>
                                  ) : (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Enviada</span>
                                      {period.nf_url && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(period.nf_url, '_blank');
                                          }}
                                          className="text-[9.5px] p-0.5 text-primary hover:underline font-bold uppercase rounded flex items-center gap-0.5 shrink-0"
                                        >
                                          <Eye className="h-3 w-3" /> Ver
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* Payment Status Badge */}
                                <td className="px-3 py-2.5 text-center select-none border-r border-border">
                                  <Badge className={cn(
                                    "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 scale-[0.95]",
                                    isCurrent ? "bg-slate-500/10 text-slate-500 border-slate-500/20" :
                                    isPaid ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                    isWaitingPayment ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                    "bg-orange-500/10 text-orange-500 border-orange-500/20"
                                  )}>
                                    {isCurrent ? 'Em Andamento' :
                                     isPaid ? 'Pago' :
                                     isWaitingPayment ? 'Aguardando Pagamento Financeiro' :
                                     'Aguardando NF'}
                                  </Badge>
                                </td>

                                {/* Action Buttons */}
                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                  {isCurrent ? (
                                    <span className="text-[10px] text-muted-foreground italic">-</span>
                                  ) : isWaitingNF ? (
                                    <Button
                                      size="sm"
                                      className="bg-primary hover:bg-primary/90 text-[10px] h-7 px-2.5 font-bold uppercase"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPartnerPeriod(period);
                                        setIsPartnerNFDialogOpen(true);
                                      }}
                                    >
                                      <Upload className="h-3 w-3 mr-1" /> Enviar NF
                                    </Button>
                                  ) : isPaid ? (
                                    <span className="text-[10px] text-green-500 font-extrabold select-none flex items-center justify-center gap-1">
                                      <Check className="h-3 w-3" /> Pago {(period.paid_at && period.paid_at !== 'null') ? `em ${new Date(period.paid_at).toLocaleDateString('pt-BR')}` : ''}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-blue-500 dark:text-blue-400 font-extrabold select-none">
                                      Aguardando Pgto ⏳
                                    </span>
                                  )}
                                </td>
                              </tr>

                              {/* Expanded Sales Detail Nested Row */}
                              {isExpanded && (
                                <tr className="bg-slate-500/[0.01] dark:bg-slate-900/[0.1]">
                                  <td colSpan={6} className="px-4 py-3 p-1 sm:p-4 border-b border-border">
                                    <div className="bg-white dark:bg-slate-950 rounded-xl border border-border/80 shadow-md p-3 sm:p-4 space-y-3">
                                      <div className="flex items-center justify-between border-b border-dashed border-border pb-2">
                                        <h5 className="text-[10px] sm:text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                                          <Grid className="h-3.5 w-3.5 text-emerald-500" />
                                          Composição da comissão - {period.label}
                                        </h5>
                                        <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-[9px] uppercase px-2 py-0.5">
                                          {period.month === 5 && period.year === 2026 ? "Simulação Detalhada" : `${period.commissions.length} Vendas Registradas`}
                                        </Badge>
                                      </div>

                                      {/* Sub-table detail */}
                                      {period.month === 5 && period.year === 2026 ? (
                                        /* Simulated beautiful detail breakdown for Maio/2026 */
                                        <div className="space-y-4">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                            <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-border/60 space-y-1">
                                              <p className="text-[10px] uppercase font-black text-muted-foreground select-none">Dados do Cliente</p>
                                              <p className="font-bold text-foreground text-sm">EUCAZIN LTDA</p>
                                              <p className="text-[10px] text-muted-foreground">Araguacema - TO &bull; Pedido Faturamento #9414</p>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-border/60 space-y-1">
                                              <p className="text-[10px] uppercase font-black text-muted-foreground select-none">Resumo Financeiro</p>
                                              <div className="flex justify-between font-mono font-semibold text-[11px]">
                                                <span>Faturamento Total:</span>
                                                <span>R$ 146.353,74</span>
                                              </div>
                                              <div className="flex justify-between font-mono font-bold text-[11px]">
                                                <span>Base Comissionável:</span>
                                                <span className="text-foreground">R$ 113.353,74</span>
                                              </div>
                                              <div className="flex justify-between font-mono font-black text-[11px] border-t border-dashed border-border pt-1">
                                                <span>Taxa de Comissão:</span>
                                                <span className="text-primary">2.00%</span>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="overflow-x-auto rounded-lg border border-border">
                                            <table className="w-full text-[10px] sm:text-xs text-left">
                                              <thead className="bg-slate-100 dark:bg-slate-900 uppercase text-muted-foreground font-mono text-[9px]">
                                                <tr className="divide-x divide-border border-b border-border">
                                                  <th className="px-3 py-1.5 border-r border-border">Produto / Descrição</th>
                                                  <th className="px-3 py-1.5 text-right w-24 border-r border-border">Valor Unitário</th>
                                                  <th className="px-3 py-1.5 text-center w-12 border-r border-border">Qtd</th>
                                                  <th className="px-3 py-1.5 text-right w-28 border-r border-border">Valor Total</th>
                                                  <th className="px-3 py-1.5 text-center w-24">Regra Comercial</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-border">
                                                <tr className="divide-x divide-border font-medium">
                                                  <td className="px-3 py-2 font-bold text-foreground border-r border-border">CARREGADOR FRONTAL CFR600</td>
                                                  <td className="px-3 py-2 text-right font-mono text-muted-foreground border-r border-border">R$ 87.988,00</td>
                                                  <td className="px-3 py-2 text-center font-mono border-r border-border">1</td>
                                                  <td className="px-3 py-2 text-right font-mono text-foreground font-bold border-r border-border">R$ 87.988,00</td>
                                                  <td className="px-3 py-2 text-center text-emerald-600 font-extrabold select-none">Comissionável</td>
                                                </tr>
                                                <tr className="divide-x divide-border font-medium">
                                                  <td className="px-3 py-2 font-bold text-foreground border-r border-border">ENGATE RAPIDO SINOMACH 937H</td>
                                                  <td className="px-3 py-2 text-right font-mono text-muted-foreground border-r border-border">R$ 18.200,00</td>
                                                  <td className="px-3 py-2 text-center font-mono border-r border-border">1</td>
                                                  <td className="px-3 py-2 text-right font-mono text-foreground font-bold border-r border-border">R$ 18.200,00</td>
                                                  <td className="px-3 py-2 text-center text-emerald-600 font-extrabold select-none">Comissionável</td>
                                                </tr>
                                                <tr className="divide-x divide-border font-medium">
                                                  <td className="px-3 py-2 font-bold text-foreground border-r border-border">ADAPTACAO CONCHA SINOMACH 937H</td>
                                                  <td className="px-3 py-2 text-right font-mono text-muted-foreground border-r border-border">R$ 7.165,74</td>
                                                  <td className="px-3 py-2 text-center font-mono border-r border-border">1</td>
                                                  <td className="px-3 py-2 text-right font-mono text-foreground font-bold border-r border-border">R$ 7.165,74</td>
                                                  <td className="px-3 py-2 text-center text-emerald-600 font-extrabold select-none">Comissionável</td>
                                                </tr>
                                                <tr className="divide-x divide-border font-medium bg-muted/20">
                                                  <td className="px-3 py-2 font-bold text-muted-foreground border-r border-border">KIT 3ª E 4ª FUNCAO</td>
                                                  <td className="px-3 py-2 text-right font-mono text-muted-foreground border-r border-border">R$ 33.000,00</td>
                                                  <td className="px-3 py-2 text-center font-mono border-r border-border">1</td>
                                                  <td className="px-3 py-2 text-right font-mono text-muted-foreground border-r border-border">R$ 33.000,00</td>
                                                  <td className="px-3 py-2 text-center text-rose-500 font-bold select-none italic">S/ Comissão</td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      ) : (
                                        /* General details mapped from actual database fields */
                                        <div className="overflow-x-auto rounded-lg border border-border">
                                          <table className="w-full text-[10px] sm:text-xs text-left">
                                            <thead className="bg-slate-100 dark:bg-slate-900 uppercase text-muted-foreground font-mono text-[9px]">
                                              <tr className="divide-x divide-border border-b border-border">
                                                <th className="px-3 py-1.5 border-r border-border">Faturamento / Pedido</th>
                                                <th className="px-3 py-1.5 border-r border-border">Cliente</th>
                                                <th className="px-3 py-1.5 text-right w-28 border-r border-border">Valor Faturado</th>
                                                <th className="px-3 py-1.5 text-right w-28 border-r border-border">Base de Comissão</th>
                                                <th className="px-3 py-1.5 text-right w-28 text-emerald-600 dark:text-emerald-400 font-extrabold">Comissão Devida</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                              {period.commissions.length === 0 ? (
                                                <tr>
                                                  <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground italic">
                                                    Nenhum pedido cadastrado no banco de dados para este período ainda.
                                                  </td>
                                                </tr>
                                              ) : (
                                                period.commissions.map(comm => {
                                                  const ind = linkedIndications[comm.indication_id];
                                                  const clientName = ind?.client_name || 'Cliente';
                                                  const orderVal = ind?.sale_order_value || ind?.value || (comm.value / (profile?.commission_rate || 3) * 100);
                                                  const comBase = ind?.base_commission_value || (comm.value / (profile?.commission_rate || 3) * 100);

                                                  return (
                                                    <tr key={comm.id} className="divide-x divide-border hover:bg-slate-55/60 transition-colors">
                                                      <td className="px-3 py-2 font-bold text-foreground border-r border-border">
                                                        #{ind?.sale_order_number || comm.id.slice(-6).toUpperCase()}
                                                      </td>
                                                      <td className="px-3 py-2 font-bold text-foreground truncate max-w-[120px] sm:max-w-none border-r border-border">
                                                        {clientName}
                                                      </td>
                                                      <td className="px-3 py-2 text-right font-mono text-muted-foreground border-r border-border">
                                                        R$ {orderVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                      </td>
                                                      <td className="px-3 py-2 text-right font-mono text-muted-foreground border-r border-border">
                                                        R$ {comBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                      </td>
                                                      <td className="px-3 py-2 text-right font-black font-mono text-emerald-650 dark:text-emerald-400">
                                                        R$ {comm.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                      </td>
                                                    </tr>
                                                  );
                                                })
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                      
                      {/* Unified footer row containing all required values matching user requirements */}
                      <tr className="bg-slate-500/[0.04] dark:bg-slate-900/[0.4] font-bold text-[11px] border-t-2 border-border/80 text-foreground divide-x divide-border select-none">
                        <td colSpan={2} className="px-4 py-4 uppercase font-black text-muted-foreground tracking-wider font-mono text-[9px]">
                          Totais de Comissão Consolidada
                        </td>
                        <td className="px-3 py-4 text-right font-black font-mono text-emerald-600 dark:text-emerald-400 text-sm border-r border-border">
                          R$ {partnerPeriods.reduce((acc, p) => acc + p.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td colSpan={3} className="px-4 py-4 text-left sm:text-right text-[10px] text-muted-foreground leading-relaxed font-medium">
                          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-4">
                            <div>
                              <span>Pago: </span>
                              <span className="font-extrabold text-foreground font-mono">
                                R$ {partnerPeriods.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div>
                              <span>Pendente/Aguardando: </span>
                              <span className="font-extrabold text-orange-600 font-mono">
                                R$ {partnerPeriods.filter(p => p.status === 'waiting_nf' || p.status === 'waiting_payment').reduce((acc, p) => acc + p.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div>
                              <span>Em Andamento: </span>
                              <span className="font-extrabold text-slate-500 font-mono">
                                R$ {partnerPeriods.filter(p => p.status === 'in_progress').reduce((acc, p) => acc + p.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className={cn(
            "grid gap-2 md:gap-4",
            "grid-cols-3"
          )}>
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-3 md:p-6 flex flex-col md:flex-row items-center md:items-start md:gap-4 text-center md:text-left">
                <div className="p-1.5 md:p-3 rounded-full bg-primary/10 text-primary mb-1 md:mb-0">
                  <DollarSign className="h-3.5 w-3.5 md:h-6 md:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[7px] md:text-sm text-muted-foreground font-bold uppercase md:capitalize tracking-tighter">Total</p>
                  <p className="text-[10px] md:text-2xl font-bold text-foreground">R$ {totalCommissions >= 1000 ? (totalCommissions/1000).toFixed(1) + 'k' : totalCommissions.toLocaleString('pt-BR')}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-3 md:p-6 flex flex-col md:flex-row items-center md:items-start md:gap-4 text-center md:text-left">
                <div className="p-1.5 md:p-3 rounded-full bg-green-500/10 text-green-500 mb-1 md:mb-0">
                  <CheckCircle2 className="h-3.5 w-3.5 md:h-6 md:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[7px] md:text-sm text-muted-foreground font-bold uppercase md:capitalize tracking-tighter">Pago</p>
                  <p className="text-[10px] md:text-2xl font-bold text-green-500">R$ {paidCommissions >= 1000 ? (paidCommissions/1000).toFixed(1) + 'k' : paidCommissions.toLocaleString('pt-BR')}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-3 md:p-6 flex flex-col md:flex-row items-center md:items-start md:gap-4 text-center md:text-left">
                <div className="p-1.5 md:p-3 rounded-full bg-orange-500/10 text-orange-500 mb-1 md:mb-0">
                  <Clock className="h-3.5 w-3.5 md:h-6 md:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[7px] md:text-sm text-muted-foreground font-bold uppercase md:capitalize tracking-tighter">Pendente</p>
                  <p className="text-[10px] md:text-2xl font-bold text-orange-500">R$ {pendingCommissions >= 1000 ? (pendingCommissions/1000).toFixed(1) + 'k' : pendingCommissions.toLocaleString('pt-BR')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Forecast chart section - only shown for internal finances or admin */}
        {profile?.role !== 'external_seller' && (
          <Card className="bg-card border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Previsão de Saída (Comissões)</CardTitle>
                  <CardDescription className="text-xs">Projeção Baseada em Vendas Fechadas (Próximos 3 Meses)</CardDescription>
                </div>
                <TrendingUp className="h-5 w-5 text-primary/40" />
              </div>
            </CardHeader>
            <CardContent className="pt-4 h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: 'currentColor' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    tickFormatter={(value) => `R$ ${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Total Previso']}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]} barSize={40}>
                    {forecastData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : 'rgba(255,102,0,0.4)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Detalhamento de Comissões - Disabled per request */}
        <Card className="hidden bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle>Detalhamento de Comissões</CardTitle>
            <CardDescription>Lista de todas as vendas convertidas no período selecionado.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 md:p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] md:text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-3 md:px-6 py-3 font-bold">Vendedor</th>
                    <th className="hidden md:table-cell px-6 py-3 font-bold">Data</th>
                    <th className="px-3 md:px-6 py-3 font-bold">Valor</th>
                    <th className="px-3 md:px-6 py-3 font-bold">Status</th>
                    <th className="hidden md:table-cell px-6 py-3 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {commissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground italic">
                        Nenhuma comissão encontrada para este período.
                      </td>
                    </tr>
                  ) : (
                    commissions.map((comm) => {
                      const ind = linkedIndications[comm.indication_id];
                      const rawDate = ind?.sale_order_date || comm.created_at;
                      const formattedDate = formatSaleDate(rawDate, comm.created_at);

                      return (
                        <tr key={comm.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-3 md:px-6 py-4">
                            <p className="text-[11px] md:text-sm font-bold text-foreground truncate max-w-[100px] md:max-w-none">{comm.external_seller_name}</p>
                            <p className="text-[9px] md:text-[10px] text-muted-foreground">ID: {comm.indication_id.slice(-6)}</p>
                          </td>
                          <td className="hidden md:table-cell px-6 py-4">
                            <p className="text-muted-foreground">{formattedDate}</p>
                          </td>
                          <td className="px-3 md:px-6 py-4">
                            <p className="text-[11px] md:text-sm font-bold text-primary">R$ {comm.value.toLocaleString('pt-BR')}</p>
                            <p className="md:hidden text-[8px] text-muted-foreground">{formattedDate}</p>
                          </td>
                        <td className="px-3 md:px-6 py-4">
                          <Badge className={cn(
                            "text-[8px] md:text-[10px] px-1 md:px-2",
                            comm.status === 'paid' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                            comm.status === 'waiting_payment' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                            comm.status === 'waiting_nf' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                            "bg-muted text-muted-foreground border-border"
                          )}>
                            {comm.status === 'paid' ? 'Pago' :
                             comm.status === 'waiting_payment' ? 'Aguardando' :
                             comm.status === 'waiting_nf' ? 'NF' : 'Pend.'}
                          </Badge>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 text-muted-foreground italic text-[10px]">
                            Consolidado Mensalmente
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Partner NF Confirm Dialog */}
        <Dialog open={isPartnerNFDialogOpen} onOpenChange={setIsPartnerNFDialogOpen}>
          <DialogContent className="bg-card border-border text-card-foreground">
            <DialogHeader>
              <DialogTitle className="text-foreground">Confirmar Envio da Nota Fiscal</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Comissões de {selectedPartnerPeriod?.label} no valor total de R$ {selectedPartnerPeriod?.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <Label htmlFor="partner-nf" className="text-xs font-semibold">Anexar Foto ou PDF da NF (Opcional)</Label>
                <Input 
                  id="partner-nf" 
                  type="file" 
                  accept=".pdf,image/*"
                  onChange={(e) => setPartnerNFFile(e.target.files?.[0] || null)}
                  className="bg-background border-border text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1">O envio do comprovante é opcional. Você pode continuar marcando apenas a confirmação abaixo.</p>
              </div>

              <div className="flex items-start gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="partner-confirmed" 
                  checked={partnerNFConfirmed}
                  onChange={(e) => setPartnerNFConfirmed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border bg-background accent-primary"
                />
                <Label htmlFor="partner-confirmed" className="text-xs font-bold text-foreground cursor-pointer select-none leading-normal">
                  Eu confirmo que a Nota Fiscal de serviço correspondente já foi devidamente emitida e enviada para o setor financeiro.
                </Label>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsPartnerNFDialogOpen(false)} className="border-border text-xs h-9">Cancelar</Button>
              <Button onClick={submitPartnerNF} disabled={submitting || !partnerNFConfirmed} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 font-semibold">
                {submitting ? 'Confirmando...' : 'Confirmar Envio'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* NF Upload Dialog */}
        <Dialog open={isNFDialogOpen} onOpenChange={(open) => { setIsNFDialogOpen(open); if (open) setNfStep('ask'); }}>
          <DialogContent className="bg-card border-border text-card-foreground">
            <DialogHeader>
              <DialogTitle className="text-foreground">Deseja anexar a nota fiscal?</DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">
                {selectedStatement?.seller_name === 'Mecânica Dias' 
                  ? "Comissão de Mecânica Dias no valor de R$ 2.267,07."
                  : `Comissão consolidada para ${selectedStatement?.seller_name || 'Vendedor'} no valor de R$ ${selectedStatement?.total_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}.`
                }
              </DialogDescription>
            </DialogHeader>

            {nfStep === 'ask' ? (
              <div className="space-y-4 py-4 text-center">
                <p className="text-sm font-medium text-foreground py-2">
                  Deseja anexar o arquivo (foto ou PDF) da Nota Fiscal agora?
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <Button 
                    onClick={() => {
                      setNfStep('upload');
                    }} 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2"
                  >
                    Sim, anexar arquivo
                  </Button>
                  <Button 
                    onClick={async () => {
                      setSubmitting(true);
                      try {
                        if (selectedStatement?.id === 'mecanica_dias_id' || selectedStatement?.seller_name === 'Mecânica Dias') {
                          setMecanicaNfStatus('waiting_payment');
                          await setDoc(doc(db, 'monthly_statements', 'mecanica_dias_id'), {
                            id: 'mecanica_dias_id',
                            seller_name: mecanicaProfile?.name || 'Mecânica Dias',
                            seller_uid: mecanicaProfile?.uid || 'mecanica_dias_uid',
                            total_value: 2267.07,
                            status: 'waiting_payment',
                            month: 5,
                            year: 2026,
                            updated_at: new Date().toISOString()
                          }, { merge: true });
                          toast.success("Nota Fiscal consolidada de Mecânica Dias dada como recebida!");
                        } else if (selectedStatement) {
                          const statementRef = doc(db, 'monthly_statements', selectedStatement.id);
                          const { id, ...data } = selectedStatement;
                          await setDoc(statementRef, {
                            ...data,
                            id: selectedStatement.id,
                            status: 'waiting_payment',
                            updated_at: new Date().toISOString()
                          }, { merge: true });
                          toast.success('Nota Fiscal consolidada marcada como recebida com sucesso!');
                        }
                        setIsNFDialogOpen(false);
                      } catch (err: any) {
                        toast.error('Erro ao salvar: ' + err.message);
                      } finally {
                        setSubmitting(false);
                      }
                    }} 
                    variant="outline" 
                    className="border-border text-xs font-semibold px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                    disabled={submitting}
                  >
                    {submitting ? 'Salvando...' : 'Não, finalizar sem anexar'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nf" className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span>Selecionar arquivo da NF (PDF ou Imagem)</span>
                    {readingNF && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                  </Label>
                  <Input 
                    id="nf" 
                    type="file" 
                    accept=".pdf,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNfFile(file);
                        handleNFUpload(file);
                      }
                    }}
                    className="bg-background border-border text-xs"
                  />
                </div>
                {nfFile && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/25 text-xs">
                    <p className="text-emerald-600 font-bold truncate">Arquivo: {nfFile.name}</p>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-500 shrink-0" />
                    <p className="text-[10px] text-blue-500 italic leading-normal">
                      Nossa IA lerá e validará o arquivo automaticamente após o envio se ele for uma nota fiscal em PDF ou imagem legível.
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border mt-2">
                  <Button variant="ghost" onClick={() => setNfStep('ask')} className="text-xs text-slate-500 hover:text-foreground hover:bg-transparent p-0">
                    ← Voltar
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsNFDialogOpen(false)} className="border-border text-xs h-9">Cancelar</Button>
                    <Button 
                      onClick={async () => {
                        if (!nfFile) {
                          toast.error('Por favor, selecione um arquivo primeiro.');
                          return;
                        }
                        if (selectedStatement?.id === 'mecanica_dias_id' || selectedStatement?.seller_name === 'Mecânica Dias') {
                          setMecanicaNfStatus('waiting_payment');
                          await setDoc(doc(db, 'monthly_statements', 'mecanica_dias_id'), {
                            id: 'mecanica_dias_id',
                            seller_name: mecanicaProfile?.name || 'Mecânica Dias',
                            seller_uid: mecanicaProfile?.uid || 'mecanica_dias_uid',
                            total_value: 2267.07,
                            status: 'waiting_payment',
                            month: 5,
                            year: 2026,
                            updated_at: new Date().toISOString()
                          }, { merge: true });
                          toast.success("Nota Fiscal consolidada de Mecânica Dias anexada!");
                          setIsNFDialogOpen(false);
                        } else {
                          await submitNF();
                        }
                      }} 
                      disabled={submitting || !nfFile} 
                      className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold h-9"
                    >
                      {submitting ? 'Enviando...' : 'Confirmar Envio'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="bg-card border-border text-card-foreground">
            <DialogHeader>
              <DialogTitle>Confirmar Pagamento</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Dados bancários do vendedor para transferência.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {selectedStatement && sellerProfiles[selectedStatement.seller_uid] && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase">Dados para Pagamento Único</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Chave PIX</p>
                      <p className="text-sm font-bold text-foreground">{sellerProfiles[selectedStatement.seller_uid].pix_key || 'Não informada'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Valor a Pagar (Mês)</p>
                      <p className="text-sm font-bold text-primary">R$ {selectedStatement.total_value.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>

                  {sellerProfiles[selectedStatement.seller_uid].bank_info && (
                    <div className="pt-2 border-t border-primary/10 grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Banco</p>
                        <p className="text-xs font-medium">{sellerProfiles[selectedStatement.seller_uid].bank_info?.bank}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Agência</p>
                        <p className="text-xs font-medium">{sellerProfiles[selectedStatement.seller_uid].bank_info?.agency}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Conta</p>
                        <p className="text-xs font-medium">{sellerProfiles[selectedStatement.seller_uid].bank_info?.account}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="receipt">Anexar Comprovante (Imagem ou PDF)</Label>
                <Input 
                  id="receipt" 
                  type="file" 
                  accept=".pdf,image/*"
                  onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                  className="bg-background border-border"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)} className="border-border">Cancelar</Button>
              <Button onClick={submitPayment} disabled={submitting || !paymentFile} className="bg-green-600 hover:bg-green-700 text-white">
                {submitting ? 'Processando...' : 'Confirmar Pagamento'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Custom Confirmation Dialog for Iframe Support */}
        <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}>
          <DialogContent className="bg-card border-border text-card-foreground max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground text-base font-bold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                {confirmDialog.title}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground whitespace-pre-wrap text-xs pt-2 font-medium leading-relaxed leading-medium">
                {confirmDialog.description}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-border/40">
              <Button variant="outline" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} className="border-border text-xs py-1.5 h-8">
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 h-8"
              >
                {confirmDialog.confirmText || 'Confirmar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
