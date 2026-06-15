import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  doc, 
  setDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  getDoc,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  MessageCircle, 
  Plus, 
  Search, 
  Star, 
  Trash2, 
  Loader2, 
  Share2, 
  Pencil,
  TrendingUp, 
  AlertCircle,
  CheckCircle2, 
  User, 
  Sliders,
  Filter,
  RefreshCw,
  Send,
  Building,
  HeartHandshake,
  Settings,
  Smile,
  Frown,
  Meh,
  AlertTriangle,
  Mail,
  FileDown,
  FileBarChart2,
  Printer,
  Download,
  ChevronDown,
  Check
} from 'lucide-react';
import { differenceInDays, addDays, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EvaluationItem {
  id: string;
  indication_id: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  equipment_name: string;
  sale_value?: number;
  sale_date?: any; // Timestamp or ISO string
  days_offset: number;
  scheduled_date: any; // Computed send date
  status: 'pending' | 'sent' | 'completed';
  rating_product?: number;
  rating_service?: number;
  rating_delivery?: number;
  rating_technical?: number;
  comments?: string;
  sent_at?: any;
  evaluated_at?: any;
  created_at?: any;
}

export default function ComercialAvaliacoes() {
  const { profile, isAdmin, isManager, isTriagem, isMarketing, isInternalSeller } = useAuth();
  const [searchParams] = useSearchParams();
  const evaluationIdParam = searchParams.get('id');
  
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [soldIndications, setSoldIndications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(true);
  
  // Tabs: 'dashboard' | 'pending' | 'sent' | 'history'
  const [activeTab, setActiveTab ] = useState<'dashboard' | 'pending' | 'sent' | 'history'>('dashboard');

  useEffect(() => {
    if (evaluationIdParam) {
      setActiveTab('history');
      setExpandedCardId(evaluationIdParam);
      setTimeout(() => {
        const element = document.getElementById(`eval-card-${evaluationIdParam}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 600);
    }
  }, [evaluationIdParam]);
  
  // Filter indicators
  const [searchQuery, setSearchQuery] = useState('');
  
  // Default evaluation delay configuration
  const [daysOffsetConfig, setDaysOffsetConfig] = useState<number>(15);
  const [savingConfig, setSavingConfig] = useState(false);

  // Email Config States
  const [showConfigEmailsModal, setShowConfigEmailsModal] = useState(false);
  const [recipientEmails, setRecipientEmails] = useState<string[]>([
    'jeferson@roderbrasil.com.br',
    'gislene@roderbrasil.com.br',
    'contato@roderbrasil.com.br'
  ]);
  const [newRecipientEmail, setNewRecipientEmail] = useState('');

  // Manual evaluation scheduling modal & states
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEquipment, setManualEquipment] = useState('');
  const [manualCustomEquipment, setManualCustomEquipment] = useState('');
  const [manualDaysOffset, setManualDaysOffset] = useState<number>(15);
  const [manualSaleDate, setManualSaleDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [submittingManual, setSubmittingManual] = useState(false);

  // Edit evaluation modal & states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [editClientName, setEditClientName] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editEquipmentName, setEditEquipmentName] = useState('');
  const [editCustomEquipment, setEditCustomEquipment] = useState('');
  const [editDaysOffset, setEditDaysOffset] = useState<number>(15);
  const [editSaleDate, setEditSaleDate] = useState<string>('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Expanded card state for direct quick rating details click
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Monthly A4 report generator states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSelectedMonth, setReportSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // Ex: "2026-05"
  );
  const [exportingReport, setExportingReport] = useState(false);

  // Phone number typing auto mask formatter
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, ''); // keep only numbers
    if (digits.length <= 2) {
      return digits.length > 0 ? `(${digits}` : '';
    }
    if (digits.length <= 6) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  // Catalog parent products (main equipment families)
  const [catalogProducts, setCatalogProducts] = useState<any[]>([
    { id: '1', name: 'Cabeçote Multifuncional' },
    { id: '2', name: 'Garra Traçadora' },
    { id: '3', name: 'Feller Tesoura' },
    { id: '4', name: 'Mini Skidder' },
    { id: '5', name: 'Feller de Disco' },
    { id: '6', name: 'Destocador Tipo Broca' },
    { id: '7', name: 'Carregador frontal' }
  ]);

  // Load configuration and data
  useEffect(() => {
    // 0. Get catalog parent products from FireStore
    const fetchCatalogProducts = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'products'), orderBy('name', 'asc')));
        const list: any[] = [];
        snap.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        if (list.length > 0) {
          setCatalogProducts(list);
        }
      } catch (err) {
        console.error('Error fetching products for evaluation list:', err);
      }
    };
    fetchCatalogProducts();

    // 1. Get configuration
    const getConfig = async () => {
      try {
        const configRef = doc(db, 'settings', 'comercial_config');
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          const data = configSnap.data();
          setDaysOffsetConfig(data.days_offset || 15);
          if (data.recipient_emails && Array.isArray(data.recipient_emails)) {
            setRecipientEmails(data.recipient_emails);
          }
        }
      } catch (err) {
        console.error('Error fetching global commercial config:', err);
      } finally {
        setLoadingConfig(false);
      }
    };
    getConfig();

    // 2. Listen to customer_evaluations
    const evalQuery = query(collection(db, 'customer_evaluations'), orderBy('created_at', 'desc'));
    const unsubEval = onSnapshot(evalQuery, (snapshot) => {
      const list: EvaluationItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          ...data,
          // Guarantee safe parsed dates
          sale_date: data.sale_date?.toDate ? data.sale_date.toDate() : (data.sale_date ? new Date(data.sale_date) : null),
          scheduled_date: data.scheduled_date?.toDate ? data.scheduled_date.toDate() : (data.scheduled_date ? new Date(data.scheduled_date) : null),
          sent_at: data.sent_at?.toDate ? data.sent_at.toDate() : (data.sent_at ? new Date(data.sent_at) : null),
          evaluated_at: data.evaluated_at?.toDate ? data.evaluated_at.toDate() : (data.evaluated_at ? new Date(data.evaluated_at) : null),
        } as EvaluationItem);
      });
      setEvaluations(list);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to customer_evaluations:', error);
      setLoading(false);
    });

    // 3. Keep records of sold indications to map with evaluations
    const soldQuery = query(collection(db, 'indications'), where('status', '==', 'sold'));
    const unsubSold = onSnapshot(soldQuery, (snapshot) => {
      const soldList: any[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        soldList.push({
          id: docSnap.id,
          ...d,
          created_at: d.created_at?.toDate ? d.created_at.toDate() : (d.created_at ? new Date(d.created_at) : null),
          updated_at: d.updated_at?.toDate ? d.updated_at.toDate() : (d.updated_at ? new Date(d.updated_at) : null),
        });
      });
      setSoldIndications(soldList);
    });

    return () => {
      unsubEval();
      unsubSold();
    };
  }, []);

  // Listen to mouse down events globally to shrink expanded cards when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && !target.closest('.evaluation-card')) {
        setExpandedCardId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Save global configuration link delay & e-mails
  const handleSaveConfig = async (updatedEmails?: string[]) => {
    try {
      setSavingConfig(true);
      const configRef = doc(db, 'settings', 'comercial_config');
      const emailsList = updatedEmails !== undefined ? updatedEmails : recipientEmails;
      await setDoc(configRef, {
        days_offset: daysOffsetConfig,
        recipient_emails: emailsList,
        updated_at: serverTimestamp(),
        updated_by: profile?.name || 'Sistema'
      }, { merge: true });
      toast.success('Configurações salvas com sucesso!');
    } catch (err) {
      console.error('Error saving global config:', err);
      toast.error('Erro ao salvar configurações.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleAddEmail = () => {
    if (!newRecipientEmail) return;
    const emailLower = newRecipientEmail.trim().toLowerCase();
    
    // Check validation
    if (!emailLower.includes('@') || !emailLower.includes('.')) {
      toast.error('Por favor, digite um e-mail válido.');
      return;
    }
    
    if (recipientEmails.includes(emailLower)) {
      toast.error('Este e-mail já está na lista de destinatários.');
      return;
    }
    
    const updated = [...recipientEmails, emailLower];
    setRecipientEmails(updated);
    setNewRecipientEmail('');
    handleSaveConfig(updated);
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    if (recipientEmails.length <= 1) {
      toast.error('Você precisa manter pelo menos um e-mail cadastrado.');
      return;
    }
    const updated = recipientEmails.filter(e => e !== emailToRemove);
    setRecipientEmails(updated);
    handleSaveConfig(updated);
  };

  // Process indications and auto-suggest evaluations that haven't been created yet
  const autoSuggestedEvaluations = soldIndications.filter((sold) => {
    // Check if an manual or automated evaluation record matches this indication ID
    const alreadyRegistered = evaluations.some(ev => ev.indication_id === sold.id);
    return !alreadyRegistered;
  });

  // Maps complex input string to parent catalog family
  const getMappedEquipmentName = (rawName: string) => {
    if (!rawName) return 'Equipamento Roder';
    const cleanLower = rawName.toLowerCase();
    
    const matched = catalogProducts.find(p => 
      cleanLower.includes(p.name.toLowerCase()) || 
      p.name.toLowerCase().includes(cleanLower)
    );
    if (matched) {
      return matched.name;
    }
    
    if (cleanLower.includes('cabecote') || cleanLower.includes('cabeçote') || cleanLower.includes('feller')) {
      const parent = catalogProducts.find(p => p.name.toLowerCase().includes('cabeçote'));
      if (parent) return parent.name;
    }
    if (cleanLower.includes('garra')) {
      const parent = catalogProducts.find(p => p.name.toLowerCase().includes('garra'));
      if (parent) return parent.name;
    }
    if (cleanLower.includes('skidder')) {
      const parent = catalogProducts.find(p => p.name.toLowerCase().includes('skidder'));
      if (parent) return parent.name;
    }
    if (cleanLower.includes('carregador')) {
      const parent = catalogProducts.find(p => p.name.toLowerCase().includes('carregador'));
      if (parent) return parent.name;
    }
    if (cleanLower.includes('broca') || cleanLower.includes('destocador')) {
      const parent = catalogProducts.find(p => p.name.toLowerCase().includes('destocador'));
      if (parent) return parent.name;
    }
    
    return rawName;
  };

  // Action schedule/generate evaluation for a sold indication automatically
  const handleAutoSchedule = async (soldInd: any, customDays?: number) => {
    try {
      const days = customDays !== undefined ? customDays : daysOffsetConfig;
      
      // Determine the reference date (budget_sent_at or updated_at, fallback to current time)
      const refDate = soldInd.updated_at || soldInd.created_at || new Date();
      const schedDate = addDays(new Date(refDate), days);
      
      // Concat items names
      let equip = soldInd.base_machine || '';
      if (soldInd.items && soldInd.items.length > 0) {
        equip = soldInd.items.map((i: any) => i.product_name).join(', ');
      }

      const mappedEquip = getMappedEquipmentName(equip);

      const payload = {
        indication_id: soldInd.id,
        client_name: soldInd.client_name || 'Sem Nome',
        client_phone: soldInd.client_phone || '',
        client_email: soldInd.client_email || '',
        equipment_name: mappedEquip,
        sale_value: soldInd.sale_value || soldInd.gross_budget_value || 0,
        sale_date: refDate,
        days_offset: days,
        scheduled_date: schedDate,
        status: 'pending' as const,
        rating_product: 0,
        rating_service: 0,
        rating_delivery: 0,
        rating_technical: 0,
        comments: '',
        created_at: serverTimestamp()
      };

      await setDoc(doc(db, 'customer_evaluations', soldInd.id), payload);
      toast.success(`Avaliação programada para ${soldInd.client_name}!`);
    } catch (err) {
      console.error('Error scheduling auto evaluation:', err);
      toast.error('Erro ao agendar avaliação.');
    }
  };

  // Schedule evaluation manually
  const handleAddManualEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualPhone || !manualEquipment) {
      toast.error('Preencha os campos obrigatórios (*)');
      return;
    }

    const selectedEquip = manualEquipment === 'Outro' ? manualCustomEquipment : manualEquipment;
    if (!selectedEquip) {
      toast.error('O nome do equipamento é obrigatório (*)');
      return;
    }

    try {
      setSubmittingManual(true);
      const saleD = new Date(manualSaleDate + 'T12:00:00');
      const schedD = addDays(saleD, manualDaysOffset);

      const mappedEquip = getMappedEquipmentName(selectedEquip);

      const payload = {
        indication_id: 'manual',
        client_name: manualName,
        client_phone: manualPhone,
        client_email: '',
        equipment_name: mappedEquip,
        sale_value: 0,
        sale_date: saleD,
        days_offset: manualDaysOffset,
        scheduled_date: schedD,
        status: 'pending' as const,
        rating_product: 0,
        rating_service: 0,
        rating_delivery: 0,
        rating_technical: 0,
        comments: '',
        created_at: serverTimestamp()
      };

      await addDoc(collection(db, 'customer_evaluations'), payload);
      toast.success('Avaliação manual agendada com sucesso!');
      
      // Clear manual fields
      setManualName('');
      setManualPhone('');
      setManualEquipment('');
      setManualCustomEquipment('');
      setManualDaysOffset(15);
      setManualSaleDate(new Date().toISOString().substring(0, 10));
      setShowManualModal(false);
    } catch (err) {
      console.error('Error adding manual evaluation:', err);
      toast.error('Erro ao registrar avaliação manual.');
    } finally {
      setSubmittingManual(false);
    }
  };

  // Toggle feedback sent via WhatsApp
  const handleSendWhatsAppNotification = async (evItem: EvaluationItem) => {
    try {
      // 1. Mark as sent in firebase
      const evRef = doc(db, 'customer_evaluations', evItem.id);
      await setDoc(evRef, {
        status: 'sent',
        sent_at: serverTimestamp()
      }, { merge: true });

      // 2. Open WhatsApp in new tab
      const cleanPhone = evItem.client_phone.replace(/\D/g, '');
      const ddiPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      
      const surveyLink = `${window.location.origin}/satisfacao?id=${evItem.id}`;
      const message = `Olá! Agradecemos por escolher a Roder Máquinas. 😊\n\nSua opinião sobre seu novo equipamento (${evItem.equipment_name}) é fundamental para continuarmos sempre aprimorando!\n\nPor favor, reserve 1 minutinho para nos dar sua nota no link abaixo:\n👉 ${surveyLink}\n\nMuito obrigado!`;
      
      const whatsappUrl = `https://wa.me/${ddiPhone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      toast.success('Link do WhatsApp gerado e aberto.');
    } catch (err) {
      console.error('Error triggers whatsapp notification:', err);
      toast.error('Erro ao disparar WhatsApp.');
    }
  };

  // Delete evaluation from scheduling system
  const handleDeleteEvaluation = async (id: string) => {
    if (!window.confirm('Tem certeza de que deseja remover este agendamento de avaliação?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'customer_evaluations', id));
      toast.success('Agendamento removido.');
    } catch (err) {
      console.error('Error deleting evaluation:', err);
      toast.error('Erro ao excluir agendamento.');
    }
  };

  // Open edit modal for scheduled/sent evaluation
  const handleOpenEditModal = (ev: EvaluationItem) => {
    setEditingId(ev.id);
    setEditClientName(ev.client_name || '');
    setEditClientPhone(ev.client_phone || '');
    setEditDaysOffset(ev.days_offset || 15);
    
    // Check if the current equipment name occurs in catalogProducts
    const isInCatalog = catalogProducts.some(p => p.name === ev.equipment_name);
    if (isInCatalog) {
      setEditEquipmentName(ev.equipment_name || '');
      setEditCustomEquipment('');
    } else {
      setEditEquipmentName('Outro');
      setEditCustomEquipment(ev.equipment_name || '');
    }
    
    // Convert safety date
    if (ev.sale_date) {
      try {
        const d = new Date(ev.sale_date);
        setEditSaleDate(d.toISOString().substring(0, 10));
      } catch (err) {
        setEditSaleDate(new Date().toISOString().substring(0, 10));
      }
    } else {
      setEditSaleDate(new Date().toISOString().substring(0, 10));
    }
    
    setShowEditModal(true);
  };

  // Submit edit changes to Firestore
  const handleUpdateEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClientName || !editClientPhone || !editEquipmentName || !editSaleDate) {
      toast.error('Preencha os campos obrigatórios (*)');
      return;
    }

    const selectedEquip = editEquipmentName === 'Outro' ? editCustomEquipment : editEquipmentName;
    if (!selectedEquip) {
      toast.error('Especifique o nome do equipamento (*)');
      return;
    }

    try {
      setSubmittingEdit(true);
      const saleD = new Date(editSaleDate + 'T12:00:00');
      const schedD = addDays(saleD, editDaysOffset);

      const evRef = doc(db, 'customer_evaluations', editingId);
      await setDoc(evRef, {
        client_name: editClientName,
        client_phone: editClientPhone,
        equipment_name: selectedEquip,
        sale_date: saleD,
        days_offset: editDaysOffset,
        scheduled_date: schedD,
      }, { merge: true });

      toast.success('Agendamento de avaliação atualizado com sucesso!');
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating evaluation:', err);
      toast.error('Erro ao salvar alterações da avaliação.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Stats selectors
  const completedList = evaluations.filter(ev => ev.status === 'completed');
  const pendingNotificationList = evaluations.filter(ev => ev.status === 'pending');
  const sentNotificationList = evaluations.filter(ev => ev.status === 'sent');

  // Related report helper calculations
  const receivedLinkCount = sentNotificationList.length + completedList.length;
  const awaitingResponseCount = sentNotificationList.length;

  const bestEvaluations = completedList.filter(
    ev => (ev.rating_product || 0) >= 4 && 
          (ev.rating_service || 0) >= 4 &&
          (ev.rating_delivery !== undefined ? ev.rating_delivery >= 4 : true) &&
          (ev.rating_technical !== undefined ? ev.rating_technical >= 4 : true)
  );

  const badEvaluations = completedList.filter(
    ev => (ev.rating_product || 0) <= 3 || 
          (ev.rating_service || 0) <= 3 ||
          (ev.rating_delivery !== undefined && ev.rating_delivery <= 3) ||
          (ev.rating_technical !== undefined && ev.rating_technical <= 3)
  );

  const getAttentionLevel = (ev: EvaluationItem) => {
    const minRating = Math.min(
      ev.rating_product || 5, 
      ev.rating_service || 5,
      ev.rating_delivery !== undefined ? ev.rating_delivery : 5,
      ev.rating_technical !== undefined ? ev.rating_technical : 5
    );
    if (minRating <= 2) {
      return { label: 'CRÍTICO', color: 'bg-red-500/10 text-red-500 border-red-500/20' };
    } else {
      return { label: 'MÉDIO', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    }
  };

  // Compute NPS metrics
  const avgProductRating = completedList.length > 0 
    ? (completedList.reduce((acc, current) => acc + (current.rating_product || 0), 0) / completedList.length).toFixed(1)
    : '0';

  const avgServiceRating = completedList.length > 0
    ? (completedList.reduce((acc, current) => acc + (current.rating_service || 0), 0) / completedList.length).toFixed(1)
    : '0';

  const avgDeliveryRating = completedList.length > 0
    ? (completedList.reduce((acc, current) => acc + (current.rating_delivery || 0), 0) / completedList.length).toFixed(1)
    : '0';

  const avgTechnicalRating = completedList.length > 0
    ? (completedList.reduce((acc, current) => acc + (current.rating_technical || 0), 0) / completedList.length).toFixed(1)
    : '0';

  // Search filter apply
  const filteredEvaluations = evaluations.filter((ev) => {
    const term = searchQuery.toLowerCase();
    return (
      ev.client_name.toLowerCase().includes(term) ||
      ev.equipment_name.toLowerCase().includes(term) ||
      (ev.client_phone && ev.client_phone.includes(term))
    );
  });

  // Filter evaluations for the selected month in the report
  const getReportEvaluations = () => {
    if (!reportSelectedMonth) return [];
    const [yearStr, monthStr] = reportSelectedMonth.split('-');
    const targetYear = parseInt(yearStr);
    const targetMonth = parseInt(monthStr) - 1; // 0-based

    return completedList.filter((ev) => {
      const evaluationDate = ev.evaluated_at || ev.created_at || ev.sale_date;
      if (!evaluationDate) return false;
      const d = new Date(evaluationDate);
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    });
  };

  const reportEvaluations = getReportEvaluations();
  const reportTotal = reportEvaluations.length;
  
  const reportAvgProduct = reportTotal > 0
    ? (reportEvaluations.reduce((acc, current) => acc + (current.rating_product || 0), 0) / reportTotal).toFixed(1)
    : '0';

  const reportAvgService = reportTotal > 0
    ? (reportEvaluations.reduce((acc, current) => acc + (current.rating_service || 0), 0) / reportTotal).toFixed(1)
    : '0';

  const reportAvgDelivery = reportTotal > 0
    ? (reportEvaluations.reduce((acc, current) => acc + (current.rating_delivery || 0), 0) / reportTotal).toFixed(1)
    : '0';

  const reportAvgTechnical = reportTotal > 0
    ? (reportEvaluations.reduce((acc, current) => acc + (current.rating_technical || 0), 0) / reportTotal).toFixed(1)
    : '0';

  // Net Promoter Score (NPS) formula based on general satisfaction/average rating
  // promoters (4-5 avg), passives (3-4 avg), detractors (<3 avg)
  const promotersCount = reportEvaluations.filter(ev => {
    const avg = ((ev.rating_product || 5) + (ev.rating_service || 5)) / 2;
    return avg >= 4.0;
  }).length;

  const detractorsCount = reportEvaluations.filter(ev => {
    const avg = ((ev.rating_product || 5) + (ev.rating_service || 5)) / 2;
    return avg <= 2.5;
  }).length;

  const passivesCount = reportTotal - promotersCount - detractorsCount;

  const reportNPSScore = reportTotal > 0
    ? Math.round(((promotersCount - detractorsCount) / reportTotal) * 100)
    : 0;

  const getNPSZone = (score: number) => {
    if (score >= 75) return { label: 'ZONA DE EXCELÊNCIA', color: 'bg-green-100/85 text-green-800 border-green-200' };
    if (score >= 50) return { label: 'ZONA DE QUALIDADE', color: 'bg-blue-100/85 text-blue-800 border-blue-200' };
    if (score >= 0) return { label: 'ZONA DE APERFEIÇOAMENTO', color: 'bg-amber-100/85 text-amber-800 border-amber-200' };
    return { label: 'ZONA CRÍTICA', color: 'bg-red-100/85 text-red-800 border-red-200' };
  };

  const getMonthNamePortuguese = (yearMonthStr: string) => {
    if (!yearMonthStr) return '';
    const [year, month] = yearMonthStr.split('-');
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${months[parseInt(month) - 1]} de ${year}`;
  };

  const handleExportReportImage = async () => {
    const element = document.getElementById('a4-monthly-report');
    if (!element) {
      toast.error('Elemento do relatório não encontrado no preview.');
      return;
    }
    
    setExportingReport(true);
    const loadingToast = toast.loading('Gerando imagem de alta resolução da Folha A4...');
    try {
      const dataUrl = await toPng(element, { 
        quality: 0.95,
        pixelRatio: 2.5, // Crisp 2.5x pixel ratio for professional presentation print
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = `Relatorio_NPS_Roder_${reportSelectedMonth}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.dismiss(loadingToast);
      toast.success('Pronto! Imagem da Folha A4 gerada e baixada com sucesso (salva na sua galeria/downloads). Compartilhe no WhatsApp!');
    } catch (err) {
      console.error('Error rendering image:', err);
      toast.dismiss(loadingToast);
      toast.error('Erro ao gerar a imagem da Folha A4.');
    } finally {
      setExportingReport(false);
    }
  };

  const handleExportReportPDF = async () => {
    const element = document.getElementById('a4-monthly-report');
    if (!element) {
      toast.error('Elemento do relatório não encontrado.');
      return;
    }
    
    setExportingReport(true);
    const loadingToast = toast.loading('Calculando dimensões e estruturando PDF...');
    try {
      const dataUrl = await toPng(element, { 
        quality: 0.95, 
        pixelRatio: 2.0, 
        backgroundColor: '#ffffff' 
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 standard width in mm
      const imgHeight = 297; // A4 standard height in mm
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Relatorio_Qualidade_NPS_Roder_${reportSelectedMonth}.pdf`);
      
      toast.dismiss(loadingToast);
      toast.success('Visualização A4 exportada como arquivo PDF com sucesso!');
    } catch (err) {
      console.error('Error rendering PDF:', err);
      toast.dismiss(loadingToast);
      toast.error('Ocorreu um erro ao exportar o PDF de impressão.');
    } finally {
      setExportingReport(false);
    }
  };

  // Strict access security gate: only visible to Admin, Gislene, and Luana
  const lowercaseName = (profile?.name || '').toLowerCase();
  const lowercaseEmail = (profile?.email || '').toLowerCase();
  const allowed = isAdmin || 
                  lowercaseEmail.includes('gislene') || 
                  lowercaseEmail.includes('luana') || 
                  lowercaseName.includes('gislene') || 
                  lowercaseName.includes('luana');

  if (!allowed) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-12 text-center h-[70vh]">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4 animate-pulse" />
          <h2 className="text-xl font-bold mb-2 text-foreground">Acesso Restrito</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Apenas a Gerente Comercial (Gislene), Luana (Triagem) e Administradores possuem permissão de acesso a esta seção.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Banner header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <span className="text-xs bg-orange-500/10 text-orange-600 font-bold px-2 py-0.5 rounded uppercase tracking-widest">
              Setor Comercial
            </span>
            <h1 id="title_comercial" className="text-3xl font-black text-foreground tracking-tight mt-1 flex items-center gap-2">
              Pesquisas e Qualidade (NPS)
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Agende, envie e analise os feedbacks de satisfação dos clientes da Roder Máquinas.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-1.5 border-blue-500/20 text-blue-500 hover:text-blue-600 hover:bg-blue-500/5 font-bold"
            >
              <FileBarChart2 className="h-4 w-4" />
              <span>Relatório de Qualidade</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfigEmailsModal(true)}
              className="flex items-center gap-1.5 border-orange-500/20 text-orange-500 hover:text-orange-600 hover:bg-orange-500/5"
            >
              <Settings className="h-4 w-4" />
              <span>Configurar E-mails</span>
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1.5 font-bold shadow-sm"
              size="sm"
              onClick={() => {
                setActiveTab('pending');
                setTimeout(() => {
                  const el = document.getElementById('global_days') || document.querySelector('.flex.border-b.border-border');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 150);
                toast.info('Novas vendas e faturamentos aguardando envio!', {
                  description: 'Role para baixo para ver os faturamentos da Roder. Você pode agendar novos envios ou disparar os links diretamente no WhatsApp!',
                  duration: 6000
                });
              }}
            >
              <Send className="h-4 w-4" />
              <span>Enviar Avaliações</span>
            </Button>
          </div>
        </div>

        {/* Global Days Offset configuration widget */}
        <Card className="bg-card w-full border-muted-foreground/10 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-600" />
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center border border-orange-500/10 text-orange-600 shrink-0">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Programação de Envio (Notificação)</h4>
                <p className="text-xs text-muted-foreground max-w-xl">
                  Escolha quantos dias após a venda ou entrega o robô e o gestor comercial devem priorizar e sugerir o envio do link no WhatsApp da Luana ou gerente comercial de plantão.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 shrink-0">
              <Button
                onClick={() => setShowManualModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold h-9 mt-4 md:mt-0 flex items-center gap-1.5"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                <span>Agendar Nova Pesquisa</span>
              </Button>

              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <Label htmlFor="global_days" className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">Dias Padrão</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="global_days"
                      type="number"
                      min={1}
                      max={120}
                      value={daysOffsetConfig}
                      onChange={(e) => setDaysOffsetConfig(parseInt(e.target.value) || 15)}
                      className="w-16 h-9 font-bold text-center"
                    />
                    <span className="text-xs text-muted-foreground font-semibold">dias após</span>
                  </div>
                </div>
                <Button
                  disabled={savingConfig}
                  onClick={() => handleSaveConfig()}
                  className="bg-orange-600 hover:bg-orange-700 text-white h-9 mt-4 px-3"
                >
                  {savingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2.5 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'dashboard' 
                ? 'border-orange-600 text-orange-600' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Dashboard & NPS</span>
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2.5 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 relative ${
              activeTab === 'pending' 
                ? 'border-orange-600 text-orange-600' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Pendentes de Envio</span>
            {pendingNotificationList.length > 0 && (
              <span className="bg-orange-600 text-white text-[10px] font-black rounded-full px-1.5 py-0.5 ml-1 animate-pulse">
                {pendingNotificationList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-2.5 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 relative ${
              activeTab === 'sent' 
                ? 'border-orange-600 text-orange-600' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Aguardando Resposta</span>
            {sentNotificationList.length > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-black rounded px-1.5 py-0.5 ml-1">
                {sentNotificationList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'history' 
                ? 'border-orange-600 text-orange-600' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Histórico de Respostas</span>
            {completedList.length > 0 && (
              <span className="bg-green-600/10 text-green-600 text-[10px] font-bold rounded px-1.5">
                {completedList.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Dashboard & NPS */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <Card className="bg-card hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 p-4">
                  <CardDescription className="text-[10px] uppercase font-black tracking-wider text-muted-foreground whitespace-nowrap">Total de Links Enviados</CardDescription>
                  <CardTitle className="text-2xl font-black mt-1 text-foreground flex items-baseline gap-1">
                    {receivedLinkCount}
                    <span className="text-[10px] text-muted-foreground font-normal">clientes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-1 rounded-full transition-all" 
                      style={{ width: `${evaluations.length > 0 ? (receivedLinkCount / evaluations.length) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-2 truncate">Corresponde a {evaluations.length > 0 ? ((receivedLinkCount / evaluations.length) * 100).toFixed(0) : 0}%.</p>
                </CardContent>
              </Card>

              <Card className="bg-card hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 p-4">
                  <CardDescription className="text-[10px] uppercase font-black tracking-wider text-amber-500 font-bold whitespace-nowrap">Aguardando Resposta</CardDescription>
                  <CardTitle className="text-2xl font-black mt-1 text-amber-500 flex items-baseline gap-1">
                    {awaitingResponseCount}
                    <span className="text-[10px] text-muted-foreground font-normal">links</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-1 rounded-full transition-all" 
                      style={{ width: `${receivedLinkCount > 0 ? (awaitingResponseCount / receivedLinkCount) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-2 truncate">{receivedLinkCount > 0 ? ((awaitingResponseCount / receivedLinkCount) * 100).toFixed(0) : 0}% de envios.</p>
                </CardContent>
              </Card>

              <Card className="bg-card hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 p-4">
                  <CardDescription className="text-[10px] uppercase font-black tracking-wider text-green-500 font-bold whitespace-nowrap">Média Equipamentos</CardDescription>
                  <CardTitle className="text-2xl font-black mt-1 text-green-500 flex items-center gap-0.5">
                    {avgProductRating} <Star className="h-5 w-5 stroke-[3] fill-green-500 text-green-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-snug">Nota sobre durabilidade e engenharia.</p>
                </CardContent>
              </Card>

              <Card className="bg-card hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 p-4">
                  <CardDescription className="text-[10px] uppercase font-black tracking-wider text-indigo-500 font-bold whitespace-nowrap">Média Atendimento</CardDescription>
                  <CardTitle className="text-2xl font-black mt-1 text-indigo-500 flex items-center gap-0.5">
                    {avgServiceRating} <Star className="h-5 w-5 stroke-[3] fill-indigo-500 text-indigo-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-snug font-normal">Nota média sobre vendedores e comercial.</p>
                </CardContent>
              </Card>

              <Card className="bg-card hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 p-4">
                  <CardDescription className="text-[10px] uppercase font-black tracking-wider text-cyan-500 font-bold whitespace-nowrap font-bold">Média Prazos</CardDescription>
                  <CardTitle className="text-2xl font-black mt-1 text-cyan-500 flex items-center gap-0.5">
                    {avgDeliveryRating} <Star className="h-5 w-5 stroke-[3] fill-cyan-500 text-cyan-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-snug font-normal">cumprimento de data e prazos combinados.</p>
                </CardContent>
              </Card>

              <Card className="bg-card hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 p-4">
                  <CardDescription className="text-[10px] uppercase font-black tracking-wider text-emerald-500 font-bold whitespace-nowrap">Média Instalação</CardDescription>
                  <CardTitle className="text-2xl font-black mt-1 text-emerald-500 flex items-center gap-0.5">
                    {avgTechnicalRating} <Star className="h-5 w-5 stroke-[3] fill-emerald-500 text-emerald-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-snug font-normal">Entrega técnica e instruções de uso.</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick action: Register evaluations for recent sales */}
            {autoSuggestedEvaluations.length > 0 && (
              <Card className="border-dashed border-orange-500/30 bg-orange-600/5">
                <CardHeader className="p-4 border-b border-orange-500/10">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <HeartHandshake className="h-4.5 w-4.5 text-orange-500 animate-pulse" />
                    <span>Novas vendas registradas identificadas no sistema</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Identificamos {autoSuggestedEvaluations.length} vendas/propostas dadas como faturadas (concluídas). Deseja gerar o agendamento de NPS para elas?
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 overflow-x-auto">
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {autoSuggestedEvaluations.map((sold) => (
                      <div key={sold.id} className="flex items-center justify-between text-xs bg-neutral-900 px-3 py-2.5 rounded border border-neutral-800">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-foreground">{sold.client_name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            Máquina: {sold.base_machine || 'Equipamento'} | Vendedor: {sold.internal_seller_name || 'Roder'}
                          </span>
                        </div>
                        <Button
                          size="xs"
                          onClick={() => handleAutoSchedule(sold)}
                          className="bg-orange-600 hover:bg-orange-700 text-white text-[11px] px-2 h-7"
                        >
                          <Clock className="h-3 w-3 mr-1" /> Agendar
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Report Columns Layout: Best, Awaiting, Bad */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1: Awaiting response list ("Quais foram de fato enviado") */}
              <Card className="flex flex-col h-[480px]">
                <CardHeader className="pb-2 border-b border-border">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <Clock className="h-4.5 w-4.5 text-amber-500" />
                    <span>Aguardando Resposta ({sentNotificationList.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs">Clientes com NPS enviado que ainda não responderam.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                  {sentNotificationList.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-xs">
                      Nenhum cliente aguardando resposta no momento!
                    </div>
                  ) : (
                    sentNotificationList.map((ev) => {
                      const daysSinceSent = ev.sent_at ? differenceInDays(new Date(), ev.sent_at) : 0;
                      return (
                        <div key={ev.id} className="p-3 rounded-lg border bg-muted/15 text-xs flex flex-col gap-1.5 hover:bg-muted/20 transition-colors">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-neutral-900 dark:text-white font-black truncate max-w-[150px]">{ev.client_name}</span>
                            <span className="text-[10px] text-muted-foreground bg-muted-foreground/10 px-1.5 py-0.5 rounded">
                              {daysSinceSent === 0 ? 'Enviado hoje' : `Há ${daysSinceSent} dias`}
                            </span>
                          </div>
                          <span className="text-orange-500 text-[10px] font-semibold truncate">Equip: {ev.equipment_name}</span>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1 bg-background/50 p-1.5 rounded">
                            <span>📞 {ev.client_phone || 'Sem celular'}</span>
                            <Button
                              size="xs"
                              variant="outline"
                              className="h-6 text-[10px] bg-green-500/10 hover:bg-green-500/20 text-green-600 border-green-500/20 font-bold px-2"
                              onClick={() => handleSendWhatsAppNotification(ev)}
                            >
                              Cobrar NPS
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* Column 2: Promoters / Best Ratings */}
              <Card className="flex flex-col h-[480px]">
                <CardHeader className="pb-2 border-b border-border">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <Smile className="h-4.5 w-4.5 text-green-500" />
                    <span>Melhores Avaliações ({bestEvaluations.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs">Clientes satisfeitos com pontuação 4 ou 5 estrelas. Clique no card para ver as notas completas.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                  {bestEvaluations.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-xs">
                      Nenhuma avaliação excelente registrada ainda.
                    </div>
                  ) : (
                    bestEvaluations.map((ev) => {
                      const isExpanded = expandedCardId === ev.id;
                      return (
                        <div 
                          key={ev.id} 
                          className={`p-3 rounded-lg border border-green-500/15 bg-green-500/5 text-xs flex flex-col gap-1.5 evaluation-card cursor-pointer transition-all hover:bg-green-500/10 ${isExpanded ? 'ring-2 ring-green-500' : 'hover:ring-1 hover:ring-green-500/40'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCardId(isExpanded ? null : ev.id);
                          }}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-neutral-900 dark:text-white font-black truncate max-w-[160px]">{ev.client_name}</span>
                            <div className="flex gap-0.5 shrink-0">
                              {Array.from({ length: Math.round(((ev.rating_product || 5) + (ev.rating_service || 5)) / 2) }).map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-green-500 text-green-500" />
                              ))}
                            </div>
                          </div>
                          <span className="text-orange-500 text-[10px] font-semibold truncate">Equip: {ev.equipment_name}</span>
                          <div className="flex gap-2 text-[10px] text-muted-foreground font-medium">
                            <span>Prod: {ev.rating_product}★</span>
                            <span>Atend: {ev.rating_service}★</span>
                          </div>
                          
                          {isExpanded ? (
                            <div className="mt-2 pt-2 border-t border-green-500/20 text-[11px] space-y-2 animate-fadeIn">
                              <div className="grid grid-cols-2 gap-2 bg-background/50 p-2 rounded border border-border/40">
                                <div className="flex flex-col">
                                  <span className="text-[9px] uppercase font-bold text-muted-foreground">Produto:</span>
                                  <span className="font-extrabold text-foreground flex items-center gap-0.5">{ev.rating_product ?? 0}★</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] uppercase font-bold text-muted-foreground">Comercial:</span>
                                  <span className="font-extrabold text-foreground flex items-center gap-0.5">{ev.rating_service ?? 0}★</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] uppercase font-bold text-muted-foreground">Prazo/Entrega:</span>
                                  <span className="font-extrabold text-foreground flex items-center gap-0.5">
                                    {ev.rating_delivery !== undefined ? `${ev.rating_delivery}★` : '—'}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] uppercase font-bold text-muted-foreground">Entrega Tec:</span>
                                  <span className="font-extrabold text-foreground flex items-center gap-0.5">
                                    {ev.rating_technical !== undefined ? `${ev.rating_technical}★` : '—'}
                                  </span>
                                </div>
                              </div>
                              {ev.comments && (
                                <div className="bg-background/40 p-2 rounded border border-dashed text-foreground/80 italic font-mono leading-relaxed">
                                  "{ev.comments}"
                                </div>
                              )}
                              <div className="text-[9px] text-muted-foreground text-right font-medium">
                                Respondido: {ev.evaluated_at ? format(ev.evaluated_at, "dd/MM/yyyy") : '—'}
                              </div>
                            </div>
                          ) : (
                            ev.comments && <p className="text-[11px] text-muted-foreground italic bg-background/30 p-1.5 rounded border border-dashed mt-1 leading-relaxed truncate">"{ev.comments}"</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* Column 3: Attention Needed / Bad Ratings */}
              <Card className="flex flex-col h-[480px]">
                <CardHeader className="pb-2 border-b border-border">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <Frown className="h-4.5 w-4.5 text-red-500 animate-bounce" />
                    <span>Necessitam Atenção ({badEvaluations.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs">Clientes insatisfeitos ou com notas regulares (3★ ou menos). Clique no card para ver detalhes.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                  {badEvaluations.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-xs">
                      Tudo bem por aqui! Nenhuma avaliação ruim recebida.
                    </div>
                  ) : (
                    badEvaluations.map((ev) => {
                      const level = getAttentionLevel(ev);
                      const isExpanded = expandedCardId === ev.id;
                      return (
                        <div 
                          key={ev.id} 
                          className={`p-3 rounded-lg border border-red-500/15 bg-red-500/5 text-xs flex flex-col gap-1.5 evaluation-card cursor-pointer transition-all hover:bg-red-500/10 ${isExpanded ? 'ring-2 ring-red-500' : 'hover:ring-1 hover:ring-red-500/40'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCardId(isExpanded ? null : ev.id);
                          }}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-neutral-900 dark:text-white font-black truncate max-w-[150px]">{ev.client_name}</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border shrink-0 ${level.color}`}>
                              ATT: {level.label}
                            </span>
                          </div>
                          <span className="text-orange-500 text-[10px] font-semibold truncate">Equip: {ev.equipment_name}</span>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-semibold">
                            <span>Prod: {ev.rating_product}/5 ⭐</span>
                            <span>Atend: {ev.rating_service}/5 ⭐</span>
                          </div>
                          
                          {isExpanded ? (
                            <div className="mt-2 pt-2 border-t border-red-500/20 text-[11px] space-y-2 animate-fadeIn">
                              <div className="grid grid-cols-2 gap-2 bg-background/50 p-2 rounded border border-border/40">
                                <div className="flex flex-col">
                                  <span className="text-[9px] uppercase font-bold text-muted-foreground">Produto:</span>
                                  <span className="font-extrabold text-foreground flex items-center gap-0.5">{ev.rating_product ?? 0}★</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] uppercase font-bold text-muted-foreground">Comercial:</span>
                                  <span className="font-extrabold text-foreground flex items-center gap-0.5">{ev.rating_service ?? 0}★</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] uppercase font-bold text-muted-foreground">Prazo/Entrega:</span>
                                  <span className="font-extrabold text-foreground flex items-center gap-0.5">
                                    {ev.rating_delivery !== undefined ? `${ev.rating_delivery}★` : '—'}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] uppercase font-bold text-muted-foreground">Entrega Tec:</span>
                                  <span className="font-extrabold text-foreground flex items-center gap-0.5">
                                    {ev.rating_technical !== undefined ? `${ev.rating_technical}★` : '—'}
                                  </span>
                                </div>
                              </div>
                              {ev.comments && (
                                <div className="bg-background/40 p-2 rounded border border-dashed text-red-500/95 italic font-mono leading-relaxed p-1.5">
                                  "{ev.comments}"
                                </div>
                              )}
                              <div className="text-[9px] text-muted-foreground text-right font-medium">
                                Respondido: {ev.evaluated_at ? format(ev.evaluated_at, "dd/MM/yyyy") : '—'}
                              </div>
                            </div>
                          ) : (
                            ev.comments && <p className="text-[11px] text-muted-foreground italic bg-background/55 p-1.5 rounded border border-dashed text-red-500/90 leading-relaxed truncate">"{ev.comments}"</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 2: Pending Notification scheduling */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {/* Search Tool & Filtering */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar agendamento pendente por cliente ou máquina..."
                  className="pl-9 h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-medium text-muted-foreground">Filtrar:</span>
                <span className="text-xs bg-orange-600/10 text-orange-600 font-bold px-2 py-1 rounded">
                  {filteredEvaluations.filter(e => e.status === 'pending').length} de {evaluations.filter(e => e.status === 'pending').length} pendentes
                </span>
              </div>
            </div>

            {/* List of pending notifications */}
            <Card>
              <CardContent className="p-0">
                {filteredEvaluations.filter(ev => ev.status === 'pending').length === 0 ? (
                  <div className="text-center py-12 text-sm text-neutral-500">
                    Nenhum agendamento de avaliação pendente de envio encontrado.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredEvaluations.filter(ev => ev.status === 'pending').map((ev) => {
                      const daysLeft = ev.scheduled_date ? differenceInDays(ev.scheduled_date, new Date()) : 0;
                      const isPastDue = daysLeft <= 0;
                      
                      return (
                        <div key={ev.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-neutral-950/20">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-black text-sm text-neutral-900 dark:text-white">{ev.client_name}</h3>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                isPastDue 
                                  ? 'bg-red-500/10 text-red-500 animate-pulse' 
                                  : 'bg-green-500/10 text-green-500'
                              }`}>
                                {isPastDue ? 'PRAZO CONCLUÍDO / ENVIAR AGORA' : `AGENDADO (${Math.abs(daysLeft)} dias restantes)`}
                              </span>
                            </div>
                            <p className="text-xs text-orange-500 font-medium">Equipamento: {ev.equipment_name}</p>
                            
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                Venda: {ev.sale_date ? format(ev.sale_date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Não informada'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                Previsão de Envio: {ev.scheduled_date ? format(ev.scheduled_date, "dd/MM/yyyy") : ''} ({ev.days_offset} dias offset)
                              </span>
                              {ev.client_phone && (
                                <span className="flex items-center gap-1 font-mono text-foreground/75">
                                  📞 {ev.client_phone}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleSendWhatsAppNotification(ev)}
                              className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs flex items-center gap-2 h-9 px-3"
                            >
                              <div className="relative">
                                <MessageCircle className="h-4 w-4 text-white" />
                                <span className={`absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full ring-2 ring-green-600 ${
                                  isPastDue ? 'bg-red-500 ring-red-600 animate-pulse' : 'bg-green-400 ring-green-500'
                                }`} />
                              </div>
                              <span>Enviar por WhatsApp</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditModal(ev)}
                              className="border-amber-500/20 bg-amber-550/5 hover:bg-amber-550/15 text-amber-600 dark:text-amber-500 font-bold text-xs h-9 px-3 flex items-center gap-1.5"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              <span>Editar</span>
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteEvaluation(ev.id)}
                              className="text-muted-foreground hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 3: Sent / Awaiting Response */}
        {activeTab === 'sent' && (
          <div className="space-y-4">
            {/* Search Tool & Filtering */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar agendamento por cliente ou máquina..."
                  className="pl-9 h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-medium text-muted-foreground">Filtrar:</span>
                <span className="text-xs bg-blue-600/10 text-blue-600 font-bold px-2 py-1 rounded">
                  {filteredEvaluations.filter(e => e.status === 'sent').length} aguardando resposta
                </span>
              </div>
            </div>

            {/* List of sent notifications awaiting response */}
            <Card>
              <CardContent className="p-0">
                {filteredEvaluations.filter(ev => ev.status === 'sent').length === 0 ? (
                  <div className="text-center py-12 text-sm text-neutral-500">
                    Nenhum cliente aguardando resposta do NPS no momento.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredEvaluations.filter(ev => ev.status === 'sent').map((ev) => {
                      const daysLeft = ev.scheduled_date ? differenceInDays(ev.scheduled_date, new Date()) : 0;
                      const isPastDue = daysLeft <= 0;
                      
                      return (
                        <div key={ev.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-neutral-950/20">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-black text-sm text-neutral-900 dark:text-white">{ev.client_name}</h3>
                              <span className="text-[9px] font-black uppercase bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded">
                                AGUARDANDO RESPOSTA (NPS ENVIADO)
                              </span>
                            </div>
                            <p className="text-xs text-orange-500 font-medium">Equipamento: {ev.equipment_name}</p>
                            
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground mt-1">
                              {ev.sent_at && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  Enviado em: {format(ev.sent_at, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                Venda: {ev.sale_date ? format(ev.sale_date, "dd/MM/yyyy") : 'Não informada'}
                              </span>
                              {ev.client_phone && (
                                <span className="flex items-center gap-1 font-mono text-foreground/75">
                                  📞 {ev.client_phone}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleSendWhatsAppNotification(ev)}
                              className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs flex items-center gap-2 h-9 px-3"
                            >
                              <div className="relative">
                                <MessageCircle className="h-4 w-4 text-white" />
                                <span className={`absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full ring-2 ring-green-600 ${
                                  isPastDue ? 'bg-red-500 ring-red-600 animate-pulse' : 'bg-green-400 ring-green-500'
                                }`} />
                              </div>
                              <span>Reenviar WhatsApp</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditModal(ev)}
                              className="border-amber-500/20 bg-amber-550/5 hover:bg-amber-550/15 text-amber-600 dark:text-amber-500 font-bold text-xs h-9 px-3 flex items-center gap-1.5"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              <span>Editar</span>
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteEvaluation(ev.id)}
                              className="text-muted-foreground hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 3: Historical feedback list */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por resposta de cliente..."
                className="pl-9 h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* List */}
            <Card>
              <CardContent className="p-0">
                {filteredEvaluations.filter(ev => ev.status === 'completed').length === 0 ? (
                  <div className="text-center py-12 text-sm text-neutral-500">
                    Nenhuma resposta de satisfação cadastrada ou recebida ainda.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredEvaluations.filter(ev => ev.status === 'completed').map((ev) => (
                      <div 
                        key={ev.id} 
                        id={`eval-card-${ev.id}`}
                        className={`p-4 space-y-3 transition-all ${ev.id === evaluationIdParam ? 'bg-orange-500/15 border-l-4 border-l-orange-500 shadow-md ring-2 ring-orange-500/20' : 'hover:bg-neutral-950/20'}`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-black text-sm text-neutral-900 dark:text-white">{ev.client_name}</h3>
                              <span className="bg-green-600/10 text-green-500 text-[9px] font-black px-1.5 py-0.5 rounded">
                                RESPONDIDA
                              </span>
                            </div>
                            <p className="text-xs text-orange-500 mt-0.5 font-medium">Equipamento: {ev.equipment_name}</p>
                          </div>

                          <div className="text-left sm:text-right shrink-0">
                            <p className="text-[10px] text-muted-foreground">
                              Data da resposta: {ev.evaluated_at ? format(ev.evaluated_at, "dd/MM/yyyy HH:mm") : ''}
                            </p>
                          </div>
                        </div>

                        {/* Scores row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                          <div className="flex items-center justify-between gap-1.5 bg-neutral-950/10 dark:bg-neutral-950/45 border p-2 rounded-lg">
                            <span className="text-[11px] text-muted-foreground font-semibold">1. Equipamento:</span>
                            <div className="flex items-center gap-0.5 text-orange-600 dark:text-orange-500 font-bold text-xs">
                              {ev.rating_product}
                              <div className="flex gap-0.5 ml-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} className={`h-3 w-3 ${s <= (ev.rating_product || 0) ? 'fill-orange-500 text-orange-500' : 'text-neutral-300 dark:text-neutral-700'}`} />
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-1.5 bg-neutral-950/10 dark:bg-neutral-950/45 border p-2 rounded-lg">
                            <span className="text-[11px] text-muted-foreground font-semibold">2. Atendimento:</span>
                            <div className="flex items-center gap-0.5 text-amber-600 dark:text-amber-500 font-bold text-xs">
                              {ev.rating_service}
                              <div className="flex gap-0.5 ml-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} className={`h-3 w-3 ${s <= (ev.rating_service || 0) ? 'fill-amber-500 text-amber-500' : 'text-neutral-300 dark:text-neutral-700'}`} />
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-1.5 bg-neutral-950/10 dark:bg-neutral-950/45 border p-2 rounded-lg">
                            <span className="text-[11px] text-muted-foreground font-semibold">3. Prazo / Entrega:</span>
                            <div className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-500 font-bold text-xs">
                              {ev.rating_delivery || 0}
                              <div className="flex gap-0.5 ml-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} className={`h-3 w-3 ${s <= (ev.rating_delivery || 0) ? 'fill-cyan-500 text-cyan-500' : 'text-neutral-300 dark:text-neutral-700'}`} />
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-1.5 bg-neutral-950/10 dark:bg-neutral-950/45 border p-2 rounded-lg">
                            <span className="text-[11px] text-muted-foreground font-semibold">4. Técnico / Instrução:</span>
                            <div className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-500 font-bold text-xs">
                              {ev.rating_technical || 0}
                              <div className="flex gap-0.5 ml-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} className={`h-3 w-3 ${s <= (ev.rating_technical || 0) ? 'fill-emerald-500 text-emerald-500' : 'text-neutral-300 dark:text-neutral-700'}`} />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Written comments */}
                        {ev.comments && (
                          <div className="bg-neutral-900 border border-dashed rounded p-3 text-xs italic text-neutral-300 relative">
                            &ldquo;{ev.comments}&rdquo;
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-dotted border-border text-[10px] text-muted-foreground">
                          <span>Origem do Agendamento: {ev.indication_id === 'manual' ? 'Inserção Manual' : 'Cadastro Roder Indica'}</span>
                          {(isAdmin || isManager || isTriagem) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEvaluation(ev.id)}
                              className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 flex items-center gap-1 h-6 px-1.5"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Excluir Resposta</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal manual schedule */}
        <AnimatePresence>
          {showManualModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border w-full max-w-md rounded-xl overflow-hidden shadow-2xl relative"
              >
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-1" />
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-lg text-foreground">Agendar Envio de Avaliação</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowManualModal(false)}
                      className="text-muted-foreground hover:text-foreground px-2"
                    >
                      Fechar
                    </Button>
                  </div>

                  <form onSubmit={handleAddManualEvaluation} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="manual_name">Nome do Cliente *</Label>
                      <Input
                        id="manual_name"
                        placeholder="Nome do produtor / empresa"
                        required
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="manual_phone">WhatsApp do Cliente *</Label>
                      <Input
                        id="manual_phone"
                        placeholder="Ex: (43) 99999-9999"
                        required
                        value={manualPhone}
                        onChange={(e) => setManualPhone(formatPhone(e.target.value))}
                      />
                      <span className="text-[10px] text-muted-foreground block font-medium">Os traços, parênteses e espaços serão inseridos automaticamente ao digitar. Exemplo: (43) 99999-9999.</span>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="manual_equip">Equipamento Vendido *</Label>
                      <select
                        id="manual_equip"
                        required
                        value={manualEquipment}
                        onChange={(e) => setManualEquipment(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                      >
                        <option value="">Selecione o equipamento principal...</option>
                        {catalogProducts.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                        <option value="Outro">Outro Equipamento (Não Listado...)</option>
                      </select>
                    </div>

                    {manualEquipment === 'Outro' && (
                      <div className="space-y-1 animate-fadeIn">
                        <Label htmlFor="manual_custom_equip">Qual é o equipamento vendido? *</Label>
                        <Input
                          id="manual_custom_equip"
                          placeholder="Ex: Garra Florestal Especial, Nova Plainadeira"
                          required
                          value={manualCustomEquipment}
                          onChange={(e) => setManualCustomEquipment(e.target.value)}
                        />
                        <span className="text-[10px] text-muted-foreground block font-medium">Este nome personalizado será exibido no link e na mensagem enviada.</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="manual_sale_date">Data da Venda/Entrega</Label>
                        <Input
                          id="manual_sale_date"
                          type="date"
                          required
                          value={manualSaleDate}
                          onChange={(e) => setManualSaleDate(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="manual_offset">Dias para Envio</Label>
                        <Input
                          id="manual_offset"
                          type="number"
                          required
                          min={1}
                          value={manualDaysOffset}
                          onChange={(e) => setManualDaysOffset(parseInt(e.target.value) || 15)}
                        />
                      </div>
                    </div>

                    <div className="pt-3 flex justify-end gap-2 border-t mt-4">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowManualModal(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={submittingManual}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {submittingManual ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Agenda'}
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Editar Agendamento de Avaliação */}
        <AnimatePresence>
          {showEditModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border w-full max-w-md rounded-xl overflow-hidden shadow-2xl relative"
              >
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-1" />
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-lg text-foreground">Editar Agendamento</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowEditModal(false)}
                      className="text-muted-foreground hover:text-foreground px-2"
                    >
                      Fechar
                    </Button>
                  </div>

                  <form onSubmit={handleUpdateEvaluation} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="edit_name">Nome do Cliente *</Label>
                      <Input
                        id="edit_name"
                        placeholder="Nome do cliente"
                        required
                        value={editClientName}
                        onChange={(e) => setEditClientName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="edit_phone">WhatsApp do Cliente *</Label>
                      <Input
                        id="edit_phone"
                        placeholder="Ex: (43) 99999-9999"
                        required
                        value={editClientPhone}
                        onChange={(e) => setEditClientPhone(formatPhone(e.target.value))}
                      />
                      <span className="text-[10px] text-muted-foreground block font-medium">Os traços, parênteses e espaços serão inseridos automaticamente ao digitar. Exemplo: (43) 99999-9999.</span>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="edit_equip">Equipamento Vendido *</Label>
                      <select
                        id="edit_equip"
                        required
                        value={editEquipmentName}
                        onChange={(e) => setEditEquipmentName(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                      >
                        <option value="">Selecione o equipamento principal...</option>
                        {catalogProducts.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                        <option value="Outro">Outro Equipamento (Não Listado...)</option>
                      </select>
                    </div>

                    {editEquipmentName === 'Outro' && (
                      <div className="space-y-1 animate-fadeIn">
                        <Label htmlFor="edit_custom_equip">Qual é o equipamento vendido? *</Label>
                        <Input
                          id="edit_custom_equip"
                          placeholder="Ex: Garra Florestal Especial, Nova Plainadeira"
                          required
                          value={editCustomEquipment}
                          onChange={(e) => setEditCustomEquipment(e.target.value)}
                        />
                        <span className="text-[10px] text-muted-foreground block font-medium">Este nome personalizado será gravado e exibido no link e nas mensagens.</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="edit_sale_date">Data da Venda/Entrega</Label>
                        <Input
                          id="edit_sale_date"
                          type="date"
                          required
                          value={editSaleDate}
                          onChange={(e) => setEditSaleDate(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="edit_offset">Dias para Envio</Label>
                        <Input
                          id="edit_offset"
                          type="number"
                          required
                          min={1}
                          value={editDaysOffset}
                          onChange={(e) => setEditDaysOffset(parseInt(e.target.value) || 15)}
                        />
                      </div>
                    </div>

                    <div className="pt-3 flex justify-end gap-2 border-t mt-4">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowEditModal(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={submittingEdit}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {submittingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Alterações'}
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Configurar E-mails para Receber Avaliações */}
        <AnimatePresence>
          {showConfigEmailsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border w-full max-w-md rounded-xl overflow-hidden shadow-2xl relative"
              >
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-1" />
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <Settings className="h-5 w-5 text-orange-500 animate-spin-slow" />
                      <span>Destinatários de E-mail</span>
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowConfigEmailsModal(false)}
                      className="text-muted-foreground hover:text-foreground px-2 text-xs"
                    >
                      Fechar
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Quando o cliente finaliza e envia a resposta de satisfação, o sistema enviará uma notificação em tempo real para os e-mails cadastrados abaixo:
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="email"
                        placeholder="Adicionar novo e-mail..."
                        value={newRecipientEmail}
                        onChange={(e) => setNewRecipientEmail(e.target.value)}
                        className="flex-1 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddEmail();
                          }
                        }}
                      />
                      <Button 
                        size="sm"
                        onClick={handleAddEmail}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs px-3 shrink-0"
                      >
                        Adicionar
                      </Button>
                    </div>

                    <div className="border rounded-lg bg-neutral-950/20 max-h-48 overflow-y-auto divide-y">
                      {recipientEmails.length === 0 ? (
                        <div className="text-center py-6 text-xs text-muted-foreground">
                          Nenhum e-mail configurado. Padrões serão utilizados.
                        </div>
                      ) : (
                        recipientEmails.map((email) => (
                          <div key={email} className="p-2.5 flex items-center justify-between text-xs">
                            <span className="font-mono text-foreground/90 truncate mr-2">{email}</span>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => handleRemoveEmail(email)}
                              className="text-muted-foreground hover:text-red-500 px-1.5 h-6 hover:bg-red-500/10"
                            >
                              Remover
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end gap-2 border-t mt-4">
                    <Button
                      variant="secondary"
                      onClick={() => setShowConfigEmailsModal(false)}
                      className="text-xs"
                    >
                      Voltar ao Painel
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Relatório Mensal A4 de Qualidade e Satisfação */}
        <AnimatePresence>
          {showReportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card text-card-foreground border w-full max-w-6xl rounded-xl overflow-hidden shadow-2xl relative flex flex-col my-8"
              >
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1.5 shrink-0" />
                
                {/* Header */}
                <div className="p-5 border-b flex items-center justify-between shrink-0 bg-muted/20">
                  <div>
                    <h3 className="font-extrabold text-xl text-foreground flex items-center gap-2">
                      <FileBarChart2 className="h-5 w-5 text-blue-500" />
                      <span>Gerador de Relatório Mensal — Qualidade & NPS</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Gerencie o relatório em folha A4 para apresentações à diretoria ou compartilhamento no WhatsApp.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReportModal(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Fechar
                  </Button>
                </div>

                {/* Body Grid */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto max-h-[75vh]">
                  {/* Left column: controls & summary statistics */}
                  <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="p-4 border rounded-xl bg-background space-y-3 shadow-sm">
                        <Label htmlFor="report_month_select" className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
                          Escolher Mês do Relatório
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="report_month_select"
                            type="month"
                            value={reportSelectedMonth}
                            onChange={(e) => setReportSelectedMonth(e.target.value)}
                            className="h-10 text-sm font-bold"
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          O sistema filtrará todas as pesquisas concluídas (respondidas) que possuem data de conclusão ou registro dentro do mês selecionado.
                        </p>
                      </div>

                      {/* Monthly indicators overview */}
                      <div className="p-4 border border-blue-500/10 rounded-xl bg-blue-500/5 space-y-3">
                        <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          Resumo do Período
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-background/80 p-2.5 rounded border border-blue-500/10 text-center">
                            <span className="block text-[10px] text-muted-foreground uppercase font-semibold">Respostas</span>
                            <span className="text-lg font-black text-foreground">{reportTotal}</span>
                          </div>
                          <div className="bg-background/80 p-2.5 rounded border border-blue-500/10 text-center">
                            <span className="block text-[10px] text-muted-foreground uppercase font-semibold">NPS Geral</span>
                            <span className={`text-lg font-black ${reportNPSScore >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                              {reportNPSScore}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-muted-foreground mt-2 font-medium">
                          <div className="flex justify-between border-b border-dotted pb-1">
                            <span>Média Produto:</span>
                            <span className="font-bold text-foreground">{reportAvgProduct} ★</span>
                          </div>
                          <div className="flex justify-between border-b border-dotted pb-1">
                            <span>Média Comercial:</span>
                            <span className="font-bold text-foreground">{reportAvgService} ★</span>
                          </div>
                          <div className="flex justify-between border-b border-dotted pb-1">
                            <span>Média Prazo:</span>
                            <span className="font-bold text-foreground">{reportAvgDelivery} ★</span>
                          </div>
                          <div className="flex justify-between border-b border-dotted pb-1">
                            <span>Média Entrega Tec:</span>
                            <span className="font-bold text-foreground">{reportAvgTechnical} ★</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons with loading states */}
                    <div className="pt-4 border-t space-y-2 mt-auto">
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold flex items-center justify-center gap-2 h-11 border-0 shadow-sm shadow-blue-500/20"
                        disabled={reportTotal === 0 || exportingReport}
                        onClick={handleExportReportImage}
                      >
                        {exportingReport ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        <span>Baixar Imagem Folha A4</span>
                      </Button>
                      <Button
                        className="w-full bg-rose-700 hover:bg-rose-800 text-white font-extrabold flex items-center justify-center gap-2 h-11 border-0 shadow-sm shadow-rose-500/20"
                        disabled={reportTotal === 0 || exportingReport}
                        onClick={handleExportReportPDF}
                      >
                        {exportingReport ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileDown className="h-4 w-4" />
                        )}
                        <span>Baixar Relatório PDF</span>
                      </Button>
                      <Button
                        className="w-full text-foreground hover:bg-neutral-550 border border-neutral-300 font-bold"
                        variant="outline"
                        disabled={reportTotal === 0}
                        onClick={() => {
                          const el = document.getElementById('a4-monthly-report');
                          if (el) {
                            window.print();
                          }
                        }}
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimir Direto
                      </Button>
                      <span className="text-[10px] text-muted-foreground block text-center font-medium">
                        Ideal para Luana enviar no WhatsApp da diretoria ou em reuniões mensais.
                      </span>
                    </div>
                  </div>

                  {/* Right column: A4 sheet preview container */}
                  <div className="lg:col-span-8 flex flex-col bg-neutral-900/40 border rounded-xl p-4 max-h-[72vh] overflow-y-auto overflow-x-hidden min-h-[450px]">
                    <span className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-3 flex items-center gap-1.5 pb-2 border-b w-full shrink-0">
                      <Sliders className="h-3.5 w-3.5" /> Preview na Folha A4 Real
                    </span>
                    
                    {reportTotal === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-12 text-muted-foreground my-auto">
                        <Frown className="h-12 w-12 text-blue-500/50 mb-3 animate-pulse" />
                        <p className="text-sm font-semibold text-foreground">Nenhuma pesquisa respondida neste período</p>
                        <p className="text-xs max-w-sm mt-1">Selecione outro mês ou envie e conclua mais avaliações para popular este documento.</p>
                      </div>
                    ) : (
                      /* A4 Styled Container sheet with dynamic scaling and scroll */
                      <div className="p-2 border shadow-xl bg-neutral-950/25 max-w-full overflow-hidden flex justify-center rounded-lg select-none shrink-0 w-full">
                        <div className="flex justify-center w-full" style={{ zoom: 0.73 }}>
                          <div 
                            id="a4-monthly-report" 
                            className="bg-white text-neutral-950 p-8 font-sans w-[794px] min-h-[1123px] flex flex-col justify-between relative"
                          >
                            {/* Decorative Roder Theme bar */}
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-orange-600" />
                            
                            {/* PDF/A4 Inner Body Content */}
                            <div className="space-y-6 text-neutral-950">
                              {/* Title & Branding */}
                              <div className="flex items-center justify-between border-b pb-4 mt-2 border-neutral-200">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                                    Roder Quality Control
                                  </span>
                                  <h1 className="text-xl font-extrabold tracking-tight text-neutral-900">
                                    RODER DO BRASIL S/A
                                  </h1>
                                  <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                                    Relatório Mensal de Qualidade & Satisfação (NPS)
                                  </p>
                                </div>
                                {/* Brand Mock Logo */}
                                <div className="text-right flex flex-col items-end">
                                  <span className="text-2xl font-black text-orange-600 tracking-tighter">RODER</span>
                                  <span className="text-[9px] text-neutral-400 font-bold tracking-widest -mt-1.5">MÁQUINAS</span>
                                </div>
                              </div>

                              {/* Header Metadata block inside the page */}
                              <div className="grid grid-cols-3 gap-4 bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-xs text-neutral-600 font-medium">
                                <div>
                                  <span className="block text-[9px] uppercase text-neutral-400 font-bold">Mês de Referência:</span>
                                  <span className="font-extrabold text-neutral-800">{getMonthNamePortuguese(reportSelectedMonth)}</span>
                                </div>
                                <div>
                                  <span className="block text-[9px] uppercase text-neutral-400 font-bold">Responsável:</span>
                                  <span className="font-extrabold text-neutral-800">Luana / Gestão Comercial</span>
                                </div>
                                <div>
                                  <span className="block text-[9px] uppercase text-neutral-400 font-bold">Data de Emissão:</span>
                                  <span className="font-extrabold text-neutral-800">{format(new Date(), "dd/MM/yyyy HH:mm")}</span>
                                </div>
                              </div>

                              {/* NPS Header Score box */}
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border border-neutral-200 p-4 rounded-xl shadow-xs bg-neutral-50/50">
                                <div className="md:col-span-4 flex flex-col items-center justify-center p-3 border-r border-neutral-200 text-center">
                                  <span className="text-[10px] text-neutral-400 uppercase font-black tracking-wider block">Net Promoter Score</span>
                                  <span className={`text-4xl font-extrabold tracking-tighter my-1 block ${reportNPSScore >= 75 ? 'text-green-600' : reportNPSScore >= 50 ? 'text-blue-600' : reportNPSScore >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                                    {reportNPSScore}
                                  </span>
                                  <span className={`text-[9px] px-2 py-0.5 font-bold rounded border ${getNPSZone(reportNPSScore).color} font-black inline-block`}>
                                    {getNPSZone(reportNPSScore).label}
                                  </span>
                                </div>

                                <div className="md:col-span-8 space-y-3">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-neutral-800">
                                    <div className="p-2 border border-neutral-200 bg-white rounded-lg text-center font-sans">
                                      <span className="block text-[8px] uppercase text-neutral-400 font-bold">Respostas</span>
                                      <span className="text-sm font-extrabold">{reportTotal}</span>
                                    </div>
                                    <div className="p-2 border border-neutral-200 bg-white rounded-lg text-center font-sans">
                                      <span className="block text-[8px] uppercase text-neutral-400 font-bold">Promotores</span>
                                      <span className="text-sm font-extrabold text-green-600">{promotersCount}</span>
                                    </div>
                                    <div className="p-2 border border-neutral-200 bg-white rounded-lg text-center font-sans">
                                      <span className="block text-[8px] uppercase text-neutral-400 font-bold">Neutros</span>
                                      <span className="text-sm font-extrabold text-neutral-500">{passivesCount}</span>
                                    </div>
                                    <div className="p-2 border border-neutral-200 bg-white rounded-lg text-center font-sans">
                                      <span className="block text-[8px] uppercase text-neutral-400 font-bold">Detratores</span>
                                      <span className="text-sm font-extrabold text-red-500">{detractorsCount}</span>
                                    </div>
                                  </div>

                                  {/* Explanation of groups */}
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1.5 border-t border-neutral-200 text-[7px] leading-normal text-neutral-500 font-medium font-sans">
                                    <div className="space-y-0.5">
                                      <span className="font-black text-green-600 uppercase tracking-widest text-[6.5px]">● PROMOTORES:</span>
                                      <p className="font-normal">Clientes satisfeitos com alta propensão a indicar a empresa a outros e elogiar os produtos.</p>
                                    </div>
                                    <div className="space-y-0.5">
                                      <span className="font-black text-neutral-500 uppercase tracking-widest text-[6.5px]">● NEUTROS:</span>
                                      <p className="font-normal">Clientes neutros que compram o necessário, porém sem lealdade ou entusiasmo ativo pela marca.</p>
                                    </div>
                                    <div className="space-y-0.5">
                                      <span className="font-black text-red-500 uppercase tracking-widest text-[6.5px]">● DETRATORES:</span>
                                      <p className="font-normal">Clientes insatisfeitos que tiveram experiências negativas e têm potencial de registrar queixas públicas.</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Ratings averages dashboard bar */}
                              <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-b pb-1 border-neutral-150">
                                  Média de Satisfação por Categoria
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                                  {/* Quadradinhos info indicators */}
                                  <div className="md:col-span-4 grid grid-cols-2 gap-2 text-xs text-neutral-700">
                                    <div className="p-2 bg-neutral-50 border border-neutral-200 rounded-lg flex flex-col justify-between">
                                      <span className="block text-[8px] text-neutral-400 uppercase font-bold truncate">Equipamento</span>
                                      <div className="flex items-center justify-between text-neutral-900 font-black mt-1">
                                        <span className="text-sm">{reportAvgProduct}</span>
                                        <span className="text-amber-500 font-bold">★</span>
                                      </div>
                                    </div>
                                    <div className="p-2 bg-neutral-50 border border-neutral-200 rounded-lg flex flex-col justify-between">
                                      <span className="block text-[8px] text-neutral-400 uppercase font-bold truncate">Atendimento</span>
                                      <div className="flex items-center justify-between text-neutral-900 font-black mt-1">
                                        <span className="text-sm">{reportAvgService}</span>
                                        <span className="text-amber-500 font-bold">★</span>
                                      </div>
                                    </div>
                                    <div className="p-2 bg-neutral-50 border border-neutral-200 rounded-lg flex flex-col justify-between">
                                      <span className="block text-[8px] text-neutral-400 uppercase font-bold truncate">Prazo / Entrega</span>
                                      <div className="flex items-center justify-between text-neutral-900 font-black mt-1">
                                        <span className="text-sm">{reportAvgDelivery}</span>
                                        <span className="text-amber-500 font-bold">★</span>
                                      </div>
                                    </div>
                                    <div className="p-2 bg-neutral-50 border border-neutral-200 rounded-lg flex flex-col justify-between">
                                      <span className="block text-[8px] text-neutral-400 uppercase font-bold truncate">Entrega Técnica</span>
                                      <div className="flex items-center justify-between text-neutral-900 font-black mt-1">
                                        <span className="text-sm">{reportAvgTechnical}</span>
                                        <span className="text-amber-500 font-bold">★</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Beautiful Progress Bar Chart Representation */}
                                  <div className="md:col-span-8 p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-col justify-between">
                                    <div className="space-y-2">
                                      {[
                                        { label: 'Desempenho do Equipamento (Produto)', val: parseFloat(reportAvgProduct) || 0, color: 'bg-emerald-500' },
                                        { label: 'Atendimento Comercial / Vendas', val: parseFloat(reportAvgService) || 0, color: 'bg-blue-500' },
                                        { label: 'Prazo de Entrega e Logística', val: parseFloat(reportAvgDelivery) || 0, color: 'bg-indigo-500' },
                                        { label: 'Entrega Técnica e Instalação', val: parseFloat(reportAvgTechnical) || 0, color: 'bg-amber-500' }
                                      ].map((item, idx) => {
                                        const percentage = Math.min(100, Math.max(0, (item.val / 5) * 100));
                                        return (
                                          <div key={idx} className="space-y-0.5">
                                            <div className="flex justify-between items-center text-[8px] font-bold text-neutral-600">
                                              <span>{item.label}</span>
                                              <span className="font-mono text-neutral-700 bg-white border border-neutral-200 px-1 py-0.2 rounded shadow-xs text-[7.5px]">{item.val.toFixed(1)} / 5.0</span>
                                            </div>
                                            <div className="relative h-2 w-full bg-neutral-200/50 rounded-full overflow-hidden">
                                              {/* Tick marks representing 1, 2, 3, 4 */}
                                              <div className="absolute inset-0 flex justify-between pointer-events-none px-[20%]">
                                                <div className="w-[1px] h-full bg-neutral-400/20"></div>
                                                <div className="w-[1px] h-full bg-neutral-400/20"></div>
                                                <div className="w-[1px] h-full bg-neutral-400/20"></div>
                                                <div className="w-[1px] h-full bg-neutral-400/20"></div>
                                              </div>
                                              <div 
                                                className={`h-full ${item.color} rounded-full transition-all duration-550`}
                                                style={{ width: `${percentage}%` }}
                                              ></div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Score Scale Legend */}
                                    <div className="flex justify-between text-[6.5px] text-neutral-400 font-extrabold uppercase tracking-wide mt-2 pt-1 border-t border-dashed border-neutral-200">
                                      <span>0.0 (Crítico)</span>
                                      <span>1.0</span>
                                      <span>2.0</span>
                                      <span>3.0 (Regular)</span>
                                      <span>4.0 (Bom)</span>
                                      <span>5.0 (Excelente)</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Grid of evaluations cards - Printable! */}
                              <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-neutral-450 uppercase tracking-widest border-b pb-0.5 border-neutral-200">
                                  Pesquisas Realizadas no Período (Cards para Recorte/WhatsApp)
                                </h4>
                                <div className="grid grid-cols-2 gap-3 max-h-[580px] overflow-hidden p-0.5">
                                  {reportEvaluations.slice(0, 8).map((ev) => {
                                    const scoreAvg = ((ev.rating_product || 5) + (ev.rating_service || 5)) / 2;
                                    
                                    // Highlight if total rating average is 3.0 or less, or any distinct rating category is poor/critical (3★ or less)
                                    const hasBadScore = scoreAvg <= 3.0 || (ev.rating_product && ev.rating_product <= 3) || (ev.rating_service && ev.rating_service <= 3);

                                    const cardTheme = scoreAvg >= 4.0 
                                      ? 'border-green-250 bg-green-50/15 text-emerald-900' 
                                      : hasBadScore 
                                        ? 'border-neutral-200 bg-red-50/20 text-rose-950' 
                                        : 'border-neutral-200 bg-neutral-50/20 text-neutral-800';
                                        
                                    return (
                                      <div key={ev.id} className={`p-3 rounded-lg border ${cardTheme} text-[10px] flex flex-col gap-1.5 shadow-sm transition-all relative`}>
                                        {hasBadScore && (
                                          <div className="absolute top-0.5 right-0.5 bg-red-50 text-red-500 border border-red-200 font-bold text-[7px] uppercase tracking-wider px-1 rounded pointer-events-none">
                                            Atenção
                                          </div>
                                        )}
                                        <div className="flex items-center justify-between font-black border-b border-neutral-200 pb-1">
                                          <span className="text-neutral-900 font-black truncate max-w-[110px]">{ev.client_name}</span>
                                          <div className="flex gap-0.5 shrink-0">
                                            {Array.from({ length: Math.round(scoreAvg) }).map((_, i) => (
                                              <Star key={i} className={`h-2.5 w-2.5 ${hasBadScore ? 'fill-red-500 text-red-500' : 'fill-yellow-500 text-yellow-500'}`} />
                                            ))}
                                          </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-x-1.5 text-neutral-500 font-semibold text-[9px]">
                                          <div>
                                            Equip: <span className="font-extrabold text-neutral-800 truncate block w-full">{ev.equipment_name}</span>
                                          </div>
                                          <div className="text-right">
                                            Conclusão: <span className="font-extrabold text-neutral-800">{ev.evaluated_at ? format(ev.evaluated_at, "dd/MM/yyyy") : '—'}</span>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-1 border-t border-neutral-250 pt-1 text-[8px] text-neutral-600 font-bold text-center">
                                          <div className={`bg-white p-0.5 rounded border ${ev.rating_product && ev.rating_product <= 3 ? 'border-red-500 text-red-600 font-black' : 'border-neutral-250'}`}>P: {ev.rating_product}★</div>
                                          <div className={`bg-white p-0.5 rounded border ${ev.rating_service && ev.rating_service <= 3 ? 'border-red-500 text-red-600 font-black' : 'border-neutral-250'}`}>C: {ev.rating_service}★</div>
                                          <div className={`bg-white p-0.5 rounded border ${ev.rating_delivery !== undefined && ev.rating_delivery <= 3 ? 'border-red-500 text-red-600 font-black' : 'border-neutral-250'}`}>E: {ev.rating_delivery !== undefined ? `${ev.rating_delivery}★` : '—'}</div>
                                          <div className={`bg-white p-0.5 rounded border ${ev.rating_technical !== undefined && ev.rating_technical <= 3 ? 'border-red-500 text-red-600 font-black' : 'border-neutral-250'}`}>T: {ev.rating_technical !== undefined ? `${ev.rating_technical}★` : '—'}</div>
                                        </div>

                                        {ev.comments ? (
                                          <p className="text-[9px] text-neutral-600 bg-white/70 p-1.5 rounded border border-neutral-200 italic leading-relaxed mt-1 line-clamp-2">
                                            "{ev.comments}"
                                          </p>
                                        ) : (
                                          <p className="text-[9px] text-neutral-400 bg-white/75 p-1.5 rounded border border-neutral-200 italic leading-relaxed mt-1 text-center">
                                            Sem comentários fornecidos.
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                {reportEvaluations.length > 8 && (
                                  <p className="text-[9px] text-center text-neutral-400 font-black italic">
                                    * Exibindo as primeiras 8 pesquisas de {reportEvaluations.length} total encontradas no mês.
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* A4 Footer note */}
                            <div className="border-t border-neutral-200 pt-2 flex items-center justify-between text-[9px] text-neutral-400 font-semibold bg-white mt-auto shrink-0">
                              <span>© Roder do Brasil — Gestão da Qualidade</span>
                              <span>Página 1 de 1</span>
                              <span>Documento de Apoio Gerencial comercial</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
