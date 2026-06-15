import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  where,
  orderBy,
  getDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { Fair, FairExpense, FairAsset, FairLead, FairChecklistItem, FairChecklistTemplate } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '../components/ui/card';
import { 
  Plus, 
  Calendar, 
  MapPin, 
  Trash2, 
  FileText, 
  DollarSign, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Download,
  Share2,
  Users,
  Settings,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Receipt,
  FileCheck,
  CheckSquare,
  Phone,
  FileDown,
  BrainCircuit,
  Target,
  Calculator,
  Edit2,
  History as HistoryIcon
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import { toast } from 'sonner';
import { cn, formatCurrency, safeFormatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ReactMarkdown from 'react-markdown';
import { generateAIInsight, generateWhatsAppMessage } from '../services/geminiService';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../components/ui/dialog';

export default function FairDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, isAdmin, isManager, isFinancial, isMarketing, isTriagem, isInternalSeller, isExternalSeller } = useAuth();
  
  const [fair, setFair] = useState<Fair | null>(null);
  const [expenses, setExpenses] = useState<FairExpense[]>([]);
  const [assets, setAssets] = useState<FairAsset[]>([]);
  const [leads, setLeads] = useState<FairLead[]>([]);
  const [checklistItems, setChecklistItems] = useState<FairChecklistItem[]>([]);
  const [templateItems, setTemplateItems] = useState<FairChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingDefault, setIsAddingDefault] = useState(false);
  const [aiHealth, setAiHealth] = useState<{ status: string, timestamp: string, error?: string } | null>(null);
  const isInitializingChecklist = useRef(false);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [activeTab, setActiveTab] = useState('overview');
  const [leadSearch, setLeadSearch] = useState('');
  const [leadTypeFilter, setLeadTypeFilter] = useState('all');
  const [leadTempFilter, setLeadTempFilter] = useState('all');

  useEffect(() => {
    const checkAI = async () => {
        try {
            const res = await fetch('/api/health');
            const data = await res.json();
            if (data.aiHealth) {
                setAiHealth(data.aiHealth);
                if (data.aiHealth.status !== 'ok' && (isAdmin || isManager || isMarketing)) {
                    toast.error(`IA Roder está offline ou com erro: ${data.aiHealth.error || 'Erro no Servidor'}`);
                }
            }
        } catch (e) {
            console.error("Health check failed", e);
        }
    };
    checkAI();
  }, [isAdmin, isManager, isMarketing]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [aiInsightModalOpen, setAiInsightModalOpen] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [isAnalysing, setIsAnalysing] = useState(false);

  // WhatsApp Message Generator
  const [waMessageModalOpen, setWaMessageModalOpen] = useState(false);
  const [selectedLeadForMessage, setSelectedLeadForMessage] = useState<any>(null);
  const [suggestedMessage, setSuggestedMessage] = useState('');
  const [generatingMessage, setGeneratingMessage] = useState(false);

  const [editLeadModalOpen, setEditLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<FairLead | null>(null);
  const [editLeadForm, setEditLeadForm] = useState({
    name: '',
    company: '',
    city: '',
    state: '',
    observations: ''
  });

  const openEditLeadModal = (lead: FairLead) => {
    setEditingLead(lead);
    setEditLeadForm({
      name: lead.name || '',
      company: lead.company || '',
      city: lead.city || '',
      state: lead.state || '',
      observations: lead.observations || ''
    });
    setEditLeadModalOpen(true);
  };

  const handleUpdateLead = async () => {
    if (!editingLead) return;
    try {
      await updateDoc(doc(db, 'fair_leads', editingLead.id), {
        ...editLeadForm,
        updated_at: new Date().toISOString()
      });
      toast.success('Lead atualizado!');
      setEditLeadModalOpen(false);
    } catch (error) {
      toast.error('Erro ao atualizar lead.');
    }
  };

  const handleGenerateMessage = async (lead: any) => {
    setSelectedLeadForMessage(lead);
    setGeneratingMessage(true);
    setWaMessageModalOpen(true);
    setSuggestedMessage(''); // Clear previous
    try {
      const msg = await generateWhatsAppMessage(lead, fair?.name || 'nossa feira');
      setSuggestedMessage(msg);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar sugestão de mensagem.');
    } finally {
      setGeneratingMessage(false);
    }
  };

  const [expenseForm, setExpenseForm] = useState({
    id: '',
    category: '',
    amount: '',
    description: '',
    vendor_name: '',
    date: new Date().toISOString().split('T')[0],
    contract_url: '',
    payment_proof_url: '',
    contractFile: null as File | null,
    proofFile: null as File | null
  });

  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [expenseEditMode, setExpenseEditMode] = useState(false);

  const [assetForm, setAssetForm] = useState({
    name: '',
    url: '',
    type: 'image' as 'image' | 'document'
  });

  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const canManage = isAdmin || isManager || isFinancial || isMarketing;
  const canManageChecklist = isMarketing || isAdmin;
  const canShareQuickReg = isAdmin || isManager || isTriagem || isInternalSeller || isExternalSeller;

  useEffect(() => {
    if (!id) return;

    // Load Fair Details
    const unsubFair = onSnapshot(doc(db, 'fairs', id), (docSnap) => {
      if (docSnap.exists()) {
        setFair({ id: docSnap.id, ...docSnap.data() } as Fair);
      } else {
        toast.error('Feira não encontrada.');
        navigate('/feiras');
      }
      setLoading(false);
    });

    // Load Expenses
    const qExp = query(collection(db, 'fair_expenses'), where('fair_id', '==', id), orderBy('date', 'desc'));
    const unsubExp = onSnapshot(qExp, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FairExpense)));
    }, (error) => {
      console.error("Error syncing expenses:", error);
      toast.error("Erro ao sincronizar despesas. Verifique sua conexão.");
    });

    // Load Assets
    const qAssets = query(collection(db, 'fair_assets'), where('fair_id', '==', id), orderBy('created_at', 'desc'));
    const unsubAssets = onSnapshot(qAssets, (snapshot) => {
      setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FairAsset)));
    }, (error) => {
      console.error("Error syncing assets:", error);
    });

    // Load Leads for Stats
    const qLeads = query(
      collection(db, 'fair_leads'), 
      where('fair_id', '==', id),
      orderBy('created_at', 'desc')
    );
    const unsubLeads = onSnapshot(qLeads, (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FairLead)));
    }, (error) => {
      console.error("Error syncing leads:", error);
    });

    // Load Checklist Items
    const qChecklist = query(collection(db, 'fair_checklist'), where('fair_id', '==', id), orderBy('created_at', 'asc'));
    const unsubChecklist = onSnapshot(qChecklist, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FairChecklistItem));
      setChecklistItems(items);
      
      // Auto-load defaults if empty.
      if (items.length === 0 && !loading && !isInitializingChecklist.current) {
        console.log("Checklist empty, triggering auto-load...");
        loadDefaultChecklist(items);
      }
    }, (error) => {
      console.error("Error syncing checklist:", error);
    });

    // Load Template Items (only if needed or just to keep sync)
    const qTemplate = query(collection(db, 'fair_checklist_template'), orderBy('created_at', 'asc'));
    const unsubTemplate = onSnapshot(qTemplate, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FairChecklistTemplate));
      setTemplateItems(items);
    }, (error) => {
      console.error("Error syncing template:", error);
    });

    const unsubCategories = onSnapshot(collection(db, 'fair_expense_categories'), (snapshot) => {
      const cats = snapshot.docs.map(doc => doc.data().name);
      setExpenseCategories(cats);
      
      if (snapshot.empty && !loading) {
        seedDefaultCategories();
      }
    }, (error) => {
      console.error("Error syncing categories:", error);
    });

    return () => {
      unsubFair();
      unsubExp();
      unsubAssets();
      unsubLeads();
      unsubChecklist();
      unsubTemplate();
      unsubCategories();
    };
  }, [id, navigate, loading]);

  const handleSaveAsTemplate = async () => {
    if (!canManageChecklist) return;
    if (!window.confirm('Deseja salvar este checklist como o padrão para todas as futuras novas feiras?')) return;
    
    setIsSavingTemplate(true);
    try {
      // 1. Clear old template
      const templateSnap = await getDocs(collection(db, 'fair_checklist_template'));
      const delBatch = writeBatch(db);
      templateSnap.docs.forEach(d => delBatch.delete(d.ref));
      await delBatch.commit();

      // 2. Add current items to template
      const addBatch = writeBatch(db);
      checklistItems.forEach(item => {
        const newRef = doc(collection(db, 'fair_checklist_template'));
        addBatch.set(newRef, {
          label: item.label,
          created_at: new Date().toISOString()
        });
      });
      await addBatch.commit();
      
      toast.success('Checklist salvo como padrão para novas feiras!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar template.');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const seedDefaultCategories = async () => {
    const DEFAULT_CATEGORIES = [
      'Montagem de estande',
      'Limpeza e segurança',
      'Bebidas e café'
    ];
    try {
      const batch = writeBatch(db);
      for (const name of DEFAULT_CATEGORIES) {
        const newRef = doc(collection(db, 'fair_expense_categories'));
        batch.set(newRef, { name, created_at: new Date().toISOString() });
      }
      await batch.commit();
    } catch (e) {
      console.error('Error seeding categories:', e);
    }
  };

  const loadDefaultChecklist = async (currentItems?: FairChecklistItem[]) => {
    const itemsToVerify = currentItems || checklistItems;
    if (!id || itemsToVerify.length > 0 || isInitializingChecklist.current) {
        if (isAddingDefault) setIsAddingDefault(false);
        return;
    }
    
    isInitializingChecklist.current = true;
    setIsAddingDefault(true);
    
    try {
      // First, try to get items from template
      const templateSnap = await getDocs(query(collection(db, 'fair_checklist_template'), orderBy('created_at', 'asc')));
      let labelsToUse = templateSnap.docs.map(doc => doc.data().label);

      const HARDCODED_DEFAULTS = [
        'Assinatura do contrato de locação do espaço',
        'Pagamento das parcelas/taxas da feira',
        'Contratação de seguro obrigatório do estande',
        'Aprovação do projeto do estande (montadora)',
        'Solicitação de ponto de energia e internet',
        'Contratação de serviço de limpeza e recepcionista',
        'Definição das máquinas que serão expostas',
        'Agendamento de transporte/frete das máquinas',
        'Limpeza e polimento dos equipamentos no local',
        'Impressão de catálogos e folders atualizados',
        'Preparação de brindes (bonés, facas, etc.)',
        'Confecção de banners e bandeiras (visual)',
        'Configuração de QR Codes para captação de leads',
        'Reserva de hotel para a equipe de vendas',
        'Compra de passagens/estipêndio de viagem',
        'Kit de uniformes da Roder para a feira',
        'Providenciar coffee break/catering para o estande'
      ];

      // Fallback to hardcoded if template is empty
      if (labelsToUse.length === 0) {
        labelsToUse = HARDCODED_DEFAULTS;

        // Seed the template if it was empty as requested
        if (canManageChecklist) {
          try {
            const templateBatch = writeBatch(db);
            for (const label of labelsToUse) {
                const newDocRef = doc(collection(db, 'fair_checklist_template'));
                templateBatch.set(newDocRef, {
                label,
                created_at: new Date().toISOString()
                });
            }
            await templateBatch.commit();
          } catch (e) {
            console.warn('Failed to seed template:', e);
          }
        }
      }

      // Add to fair checklist using batch for atomicity and speed
      const checklistBatch = writeBatch(db);
      for (const label of labelsToUse) {
        const newDocRef = doc(collection(db, 'fair_checklist'));
        checklistBatch.set(newDocRef, {
          fair_id: id,
          label,
          completed: false,
          created_at: new Date().toISOString()
        });
      }
      await checklistBatch.commit();
      
      toast.success('Checklist inicializado!');
    } catch (error) {
      console.error('Error loading checklist:', error);
      toast.error('Erro ao carregar checklist padrão.');
    } finally {
      setIsAddingDefault(false);
      // Wait a bit before allowing re-init attempts
      setTimeout(() => {
        if (isInitializingChecklist.current) {
            isInitializingChecklist.current = false;
        }
      }, 5000);
    }
  };

  const [checklistForm, setChecklistForm] = useState({
    id: '',
    label: '',
    completed: false
  });

  const handleToggleChecklistItem = async (item: FairChecklistItem) => {
    if (!canManage) return;
    try {
      await updateDoc(doc(db, 'fair_checklist', item.id), {
        completed: !item.completed
      });
    } catch (error) {
      toast.error('Erro ao atualizar item.');
    }
  };

  const handleSaveChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      if (checklistForm.id) {
        try {
          await updateDoc(doc(db, 'fair_checklist', checklistForm.id), {
            label: checklistForm.label,
            completed: checklistForm.completed
          });
          toast.success('Item atualizado!');
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `fair_checklist/${checklistForm.id}`);
        }
      } else {
        try {
          await addDoc(collection(db, 'fair_checklist'), {
            fair_id: id,
            label: checklistForm.label,
            completed: false,
            created_at: new Date().toISOString()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'fair_checklist');
        }

        // Sync with template if Marketing - Wrap in separate try/catch to avoid blocking
        if (isMarketing) {
          try {
            await addDoc(collection(db, 'fair_checklist_template'), {
              label: checklistForm.label,
              created_at: new Date().toISOString()
            });
          } catch (templateError) {
            console.error('Error syncing with template:', templateError);
            // Don't toast error here, just log it. The main item was saved.
          }
        }
        toast.success('Item adicionado!');
      }
      setChecklistModalOpen(false);
      setChecklistForm({ id: '', label: '', completed: false });
    } catch (error: any) {
      console.error('Error saving checklist item:', error);
      let errorMessage = 'Erro ao salvar item';
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error && (parsed.error.includes('permissions') || parsed.error.includes('permission-denied'))) {
          errorMessage = 'Erro ao salvar: Sem permissão no Banco de Dados';
        }
      } catch (e) {
        if (error.code === 'permission-denied' || error.message?.includes('permission')) {
          errorMessage = 'Erro ao salvar: Sem permissão';
        }
      }
      toast.error(errorMessage);
    }
  };

  const handleDeleteChecklistItem = async (itemId: string, label: string) => {
    if (!canManageChecklist) return;
    if (!window.confirm('Excluir este item?')) return;

    try {
      await deleteDoc(doc(db, 'fair_checklist', itemId));

      // Sync with template if Marketing
      if (isMarketing) {
        const qTemplate = query(collection(db, 'fair_checklist_template'), where('label', '==', label));
        const snap = await getDocs(qTemplate);
        for (const d of snap.docs) {
          await deleteDoc(doc(db, 'fair_checklist_template', d.id));
        }
      }
      toast.success('Item excluído.');
    } catch (error) {
      toast.error('Erro ao excluir.');
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fair || !id) return;

    setIsSavingExpense(true);
    try {
      let finalCategory = expenseForm.category;

      // Handle new category creation
      if (expenseForm.category === 'NEW_CATEGORY' && newCategoryName.trim()) {
        finalCategory = newCategoryName.trim();
        if (!expenseCategories.includes(finalCategory)) {
          await addDoc(collection(db, 'fair_expense_categories'), {
            name: finalCategory,
            created_at: new Date().toISOString()
          });
        }
      }

      let contract_url = expenseForm.contract_url;
      let payment_proof_url = expenseForm.payment_proof_url;

      // Upload files if selected
      if (expenseForm.contractFile) {
        const fileRef = ref(storage, `fairs/${id}/expenses/contract_${Date.now()}_${expenseForm.contractFile.name}`);
        const snapshot = await uploadBytes(fileRef, expenseForm.contractFile);
        contract_url = await getDownloadURL(snapshot.ref);
      }

      if (expenseForm.proofFile) {
        const fileRef = ref(storage, `fairs/${id}/expenses/proof_${Date.now()}_${expenseForm.proofFile.name}`);
        const snapshot = await uploadBytes(fileRef, expenseForm.proofFile);
        payment_proof_url = await getDownloadURL(snapshot.ref);
      }

      const expenseData = {
        vendor_name: expenseForm.vendor_name,
        amount: Number(expenseForm.amount),
        category: finalCategory,
        date: expenseForm.date,
        description: expenseForm.description,
        contract_url,
        payment_proof_url,
        fair_id: id,
        updated_at: new Date().toISOString()
      };

      if (expenseForm.id) {
        await updateDoc(doc(db, 'fair_expenses', expenseForm.id), expenseData);
        toast.success('Despesa atualizada!');
      } else {
        await addDoc(collection(db, 'fair_expenses'), {
          ...expenseData,
          created_at: new Date().toISOString()
        });
        toast.success('Despesa registrada!');
      }

      setExpenseModalOpen(false);
      resetExpenseForm();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      handleFirestoreError(error, expenseForm.id ? OperationType.UPDATE : OperationType.CREATE, 'fair_expenses');
    } finally {
      setIsSavingExpense(false);
    }
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      id: '',
      category: '',
      amount: '',
      description: '',
      vendor_name: '',
      date: new Date().toISOString().split('T')[0],
      contract_url: '',
      payment_proof_url: '',
      contractFile: null,
      proofFile: null
    });
    setExpenseEditMode(false);
    setShowNewCategoryInput(false);
    setNewCategoryName('');
  };

  const handleEditExpense = (exp: FairExpense) => {
    setExpenseForm({
      id: exp.id,
      category: exp.category,
      amount: exp.amount.toString(),
      description: exp.description || '',
      vendor_name: exp.vendor_name,
      date: exp.date,
      contract_url: exp.contract_url || '',
      payment_proof_url: exp.payment_proof_url || '',
      contractFile: null,
      proofFile: null
    });
    setExpenseEditMode(true);
    setExpenseModalOpen(true);
    setShowNewCategoryInput(false);
    setNewCategoryName('');
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fair || !id) return;

    try {
      await addDoc(collection(db, 'fair_assets'), {
        ...assetForm,
        fair_id: id,
        created_at: new Date().toISOString()
      });
      toast.success('Material de marketing adicionado!');
      setAssetModalOpen(false);
      setAssetForm({ name: '', url: '', type: 'image' });
    } catch (error) {
      toast.error('Erro ao adicionar material.');
    }
  };

  const handleDeleteExpense = async (expId: string) => {
    if (!canManage) return;
    if (!window.confirm('Excluir esta despesa?')) return;
    try {
      await deleteDoc(doc(db, 'fair_expenses', expId));
      toast.success('Despesa excluída.');
    } catch (error) {
      toast.error('Erro ao excluir.');
    }
  };

  const generateDetailedPerformanceReport = () => {
    if (!fair || leads.length === 0) {
      toast.error('Não há dados de leads para gerar este desempenho.');
      return;
    }

    const doc = new jsPDF();
    const title = `Relatório de Desempenho - ${fair.name}`;
    doc.setFontSize(22);
    doc.setTextColor(34, 197, 94); // Roder Green
    doc.text(title, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período da Feira: ${safeFormatDate(fair.start_date)} até ${safeFormatDate(fair.end_date)}`, 14, 28);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 33);
    
    // 1. Executive Summary Table
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Resumo Executivo", 14, 45);
    
    const summaryData = [
      ['Total de Leads Captados', leads.length.toString()],
      ['Leads Qualificados (Hot)', leads.filter(l => l.ai_score === 'hot').length.toString()],
      ['Investimento Total', formatCurrency(totalExpenses)],
      ['Custo por Lead', formatCurrency(costPerLead)]
    ];
    
    autoTable(doc, {
      startY: 48,
      body: summaryData,
      theme: 'plain',
      styles: { fontSize: 11, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 80 } }
    });

    // 2. Breakdown by Salesperson / Attendee
    const salesStats: Record<string, { count: number, hot: number }> = {};
    leads.forEach(l => {
      const name = l.salesperson_name || 'Não identificado';
      if (!salesStats[name]) salesStats[name] = { count: 0, hot: 0 };
      salesStats[name].count++;
      if (l.ai_score === 'hot') salesStats[name].hot++;
    });

    const salesTableData = Object.entries(salesStats)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, stats]) => [
        name,
        stats.count.toString(),
        stats.hot.toString(),
        ((stats.hot / stats.count) * 100).toFixed(1) + '%'
      ]);

    doc.setFontSize(14);
    doc.text("Desempenho por Atendente / Vendedor", 14, (doc as any).lastAutoTable.finalY + 15);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Vendedor / Atendente', 'Total de Leads', 'Leads Hot', '% Qualificação']],
      body: salesTableData,
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94] }
    });

    // 3. Breakdown by Type (Indicator / Profile)
    const typeStats: Record<string, number> = {};
    leads.forEach(l => {
      const type = l.type === 'client' ? 'Cliente' : l.type === 'partner' ? 'Parceiro' : 'Fornecedor';
      typeStats[type] = (typeStats[type] || 0) + 1;
    });

    const typeTableData = Object.entries(typeStats).map(([type, count]) => [
      type,
      count.toString(),
      ((count / leads.length) * 100).toFixed(1) + '%'
    ]);

    doc.setFontSize(14);
    doc.text("Perfil dos Leads (Indicadores)", 14, (doc as any).lastAutoTable.finalY + 15);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Tipo / Perfil', 'Quantidade', 'Representatividade']],
      body: typeTableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] } // Blue
    });

    // 4. Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Roder Indica V2 - Relatório de Feira - Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(`desempenho_feira_${fair.name.toLowerCase().replace(/\s+/g, '_')}.pdf`);
    toast.success('Relatório de desempenho gerado!');
  };

  const generateLeadsReport = () => {
    if (!fair || leads.length === 0) {
      toast.error('Não há leads para gerar relatório.');
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFontSize(16);
    doc.setTextColor(34, 197, 94); // Primary color
    doc.text(`PLANILHA DE LEADS - ${fair.name.toUpperCase()}`, 14, 20);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 27);
    
    const customers = leads.filter(l => l.type === 'client' || !l.type);
    const partners = leads.filter(l => l.type === 'partner');
    const suppliers = leads.filter(l => l.type === 'supplier');

    doc.text(`Total de Clientes: ${customers.length} | Parceiros: ${partners.length} | Fornecedores: ${suppliers.length}`, 14, 32);

    let currentY = 38;

    const sections = [
      { title: '1. CLIENTES', data: customers, color: [34, 197, 94] as [number, number, number] },
      { title: '2. PARCEIROS', data: partners, color: [245, 158, 11] as [number, number, number] },
      { title: '3. FORNECEDORES', data: suppliers, color: [59, 130, 246] as [number, number, number] }
    ];

    sections.forEach((section) => {
      if (section.data.length > 0) {
        // Add Section Header
        doc.setFontSize(12);
        doc.setTextColor(section.color[0], section.color[1], section.color[2]);
        doc.text(section.title, 14, currentY);
        currentY += 5;

        const tableData = section.data.map(lead => [
          safeFormatDate(lead.created_at),
          `${lead.name}${lead.company ? '\n' + lead.company.toUpperCase() : ''}`,
          `${lead.phone || '-'}\n${lead.email || '-'}`,
          (lead.interest_products || []).join(', ') || 'Geral',
          lead.observations || '-',
          lead.salesperson_name || 'Anônimo',
          lead.ai_score === 'hot' ? 'QUENTE' : 'MORNO'
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['Data', 'Lead / Empresa', 'Contato', 'Produtos', 'Observações', 'Vendedor', 'Status']],
          body: tableData,
          theme: 'grid',
          headStyles: { 
            fillColor: section.color,
            fontSize: 8,
            halign: 'center',
            valign: 'middle'
          },
          styles: { 
            fontSize: 7,
            cellPadding: 1.5,
            overflow: 'linebreak'
          },
          columnStyles: {
            0: { cellWidth: 16 }, // Data
            1: { cellWidth: 32, fontStyle: 'bold' }, // Lead / Empresa
            2: { cellWidth: 26 }, // Contato
            3: { cellWidth: 22 }, // Produtos
            4: { cellWidth: 50 }, // Observações
            5: { cellWidth: 22 }, // Vendedor
            6: { cellWidth: 14, halign: 'center' }  // Status
          },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 6) {
              const val = data.cell.raw as string;
              if (val === 'QUENTE') {
                data.cell.styles.textColor = [220, 38, 38]; // Red-600
                data.cell.styles.fontStyle = 'bold';
              } else {
                data.cell.styles.textColor = [217, 119, 6]; // Amber-600
              }
            }
          }
        });

        // @ts-ignore - finalY is available in autoTable result
        currentY = doc.lastAutoTable.finalY + 10;

        // Check if we need a new page for the next section if space is tight
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
      }
    });

    doc.save(`leads_feira_${fair.name.toLowerCase().replace(/\s+/g, '_')}.pdf`);
    toast.success('Relatório de leads exportado com sucesso!');
  };

  const generateExpensesReport = () => {
    if (!fair || expenses.length === 0) {
      toast.error('Não há despesas para gerar relatório.');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Relatório Financeiro de Despesas - ${fair.name}`, 14, 22);
    doc.setFontSize(10);
    doc.text(`Custo Total: ${formatCurrency(totalExpenses)}`, 14, 30);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 35);

    const tableData = expenses.map(exp => [
      safeFormatDate(exp.date),
      exp.category,
      exp.vendor_name || '-',
      exp.description || '-',
      formatCurrency(exp.amount)
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Data', 'Categoria', 'Fornecedor', 'Descrição', 'Valor']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] }
    });

    doc.save(`despesas_${fair.name.toLowerCase().replace(/\s+/g, '_')}.pdf`);
    toast.success('Relatório financeiro gerado com sucesso!');
  };

  const copyQuickRegLink = () => {
    const url = `https://roder-indica-v2-142737915053.us-west1.run.app/cadastro-rapido?fairId=${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link de Cadastro Rápido copiado!');
  };

  const shareQuickRegWhatsApp = () => {
    if (!fair) return;
    const url = `https://roder-indica-v2-142737915053.us-west1.run.app/cadastro-rapido?fairId=${id}`;
    const message = `🚀 *RODER Indica - Cadastro Rápido de Leads*\n\nOlá equipe! Este é o link oficial para cadastro de novos clientes durante a feira *${fair.name}*.\n\n📲 *Link de Cadastro:* ${url}\n\n💡 *Passo a Passo:*\n1. *Apague o ícone antigo* da tela inicial se você já salvou algum de outra feira.\n2. Abra o link acima e escolha "Adicionar à Tela de Início".\n3. O nome do ícone será *${fair.name.toUpperCase()} LEADS*.\n4. Ao abrir pela 1ª vez, coloque seu nome para seus atendimentos ficarem salvos.\n\nBoas vendas! 💪🌲`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const leadsCount = leads.length;
  const costPerLead = leadsCount > 0 ? totalExpenses / leadsCount : 0;

  const filteredExpenses = useMemo(() => {
    if (categoryFilter === 'all') return expenses;
    return expenses.filter(exp => exp.category === categoryFilter);
  }, [expenses, categoryFilter]);

  const expensesByCategory = useMemo(() => {
    const groups: Record<string, number> = {};
    expenses.forEach(exp => {
      groups[exp.category] = (groups[exp.category] || 0) + exp.amount;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const CHART_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

  const handleGenerateAIInsight = async () => {
    if (!fair || leads.length === 0) {
      toast.error('Dados insuficientes para análise da IA.');
      return;
    }

    setIsAnalysing(true);
    setAiInsightModalOpen(true);
    try {
      const expensesSummary = expenses.map(e => `${e.category}: ${formatCurrency(e.amount)}`).join(', ');
      const leadsTypeCount = leads.reduce((acc: any, lead) => {
        acc[lead.type] = (acc[lead.type] || 0) + 1;
        return acc;
      }, {});
      const leadsScoreCount = leads.reduce((acc: any, lead) => {
        acc[lead.ai_score] = (acc[lead.ai_score] || 0) + 1;
        return acc;
      }, {});

      const context = {
        fairName: fair.name,
        investment: totalExpenses,
        expenses: expensesSummary,
        leadsCount: leadsCount,
        profiles: leadsTypeCount,
        quality: leadsScoreCount
      };

      const result = await generateAIInsight(context);
      setAiInsight(result);
    } catch (error) {
      console.error('AI Insight error:', error);
      toast.error('Erro ao gerar insight da IA.');
    } finally {
      setIsAnalysing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!fair) return null;

  return (
    <Layout>
      <div className="space-y-3 md:space-y-6 overflow-x-hidden w-full">
        {/* Header com Navegação */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-4 md:pb-6">
          <div className="flex items-center gap-2 md:gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)} 
              className="shrink-0 h-8 w-8 md:h-10 md:w-10"
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            {fair.logo_url ? (
               <div className="h-10 w-10 md:h-16 md:w-16 shrink-0 bg-white rounded-lg md:rounded-xl shadow-md border border-border overflow-hidden flex items-center justify-center p-1 md:p-2 group transition-transform hover:scale-105">
                 <img 
                   src={fair.logo_url} 
                   alt={fair.name} 
                   className="h-full w-full object-contain"
                   referrerPolicy="no-referrer"
                 />
               </div>
            ) : (
              <div className="h-10 w-10 md:h-16 md:w-16 shrink-0 bg-primary/10 rounded-lg md:rounded-xl flex items-center justify-center border border-primary/20 shadow-inner">
                <Target className="h-5 w-5 md:h-8 md:w-8 text-primary/40 animate-pulse" />
              </div>
            )}
            <div className="min-w-0 pr-2">
              <h1 className="text-sm md:text-2xl font-black uppercase tracking-tighter leading-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 truncate">{fair.name}</h1>
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-[9px] md:text-xs font-bold text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1 md:gap-1.5 truncate"><MapPin className="h-2.5 w-2.5 text-primary shrink-0" /> {fair.location}</span>
                <span className="flex items-center gap-1 md:gap-1.5"><Calendar className="h-2.5 w-2.5 text-primary shrink-0" /> {safeFormatDate(fair.start_date)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button 
                variant="outline" 
                size="sm"
                className="h-7 md:h-9 gap-1.5 border-primary/20 text-primary hover:bg-primary/5 font-black uppercase text-[8px] md:text-[10px] tracking-tight md:tracking-widest" 
                onClick={handleGenerateAIInsight}
              >
                <BrainCircuit className="h-3 w-3 md:h-4 md:w-4" /> Análise IA
            </Button>

            {canShareQuickReg && (
              <div className="flex bg-slate-100 dark:bg-white/5 p-0.5 md:p-1 rounded-lg md:rounded-xl gap-0.5 md:gap-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-7 md:h-9 px-2 md:px-3 gap-1 md:gap-2 text-[8px] md:text-[10px] font-black uppercase tracking-tighter" 
                  onClick={copyQuickRegLink}
                >
                  <Share2 className="h-3 w-3 md:h-3.5 md:w-3.5" /> Copiar
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="h-7 md:h-9 px-2 md:px-3 gap-1 md:gap-2 text-[8px] md:text-[10px] font-black uppercase tracking-tighter text-green-500 hover:text-green-600 hover:bg-green-50/10" 
                  onClick={shareQuickRegWhatsApp}
                >
                  <Phone className="h-3 w-3 md:h-3.5 md:w-3.5" /> Link de cadastro rápido feira
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="p-2 md:p-4 pb-0">
              <CardDescription className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Leads Totais</CardDescription>
            </CardHeader>
            <CardContent className="p-2 md:p-4 pt-0.5 md:pt-1">
              <div className="flex items-center justify-between">
                <span className="text-sm md:text-2xl font-black">{leadsCount}</span>
                <Users className="h-4 w-4 md:h-8 md:w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="p-2 md:p-4 pb-0">
              <CardDescription className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Custo Total</CardDescription>
            </CardHeader>
            <CardContent className="p-2 md:p-4 pt-0.5 md:pt-1">
              <div className="flex items-center justify-between">
                <span className="text-sm md:text-2xl font-black">{formatCurrency(totalExpenses)}</span>
                <DollarSign className="h-4 w-4 md:h-8 md:w-8 text-red-500/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="p-2 md:p-4 pb-0">
              <CardDescription className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Custo p/ Lead</CardDescription>
            </CardHeader>
            <CardContent className="p-2 md:p-4 pt-0.5 md:pt-1">
              <div className="flex items-center justify-between">
                <span className="text-sm md:text-2xl font-black">{formatCurrency(costPerLead)}</span>
                <TrendingUp className="h-4 w-4 md:h-8 md:w-8 text-green-500/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="p-2 md:p-4 pb-0">
              <CardDescription className="text-[8px] md:text-[10px] font-black uppercase tracking-widest leading-none">Status Atend.</CardDescription>
            </CardHeader>
            <CardContent className="p-2 md:p-4 pt-0.5 md:pt-1">
               <div className="flex items-center justify-between gap-1">
                 <div className="flex flex-col">
                   <span className="text-xs md:text-xl font-black text-green-500">{leads.filter(l => l.status === 'forwarded').length}</span>
                   <span className="text-[6px] md:text-[8px] font-bold uppercase text-muted-foreground">Em Atend.</span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-xs md:text-xl font-black text-amber-500">{leads.filter(l => l.status === 'pending').length}</span>
                   <span className="text-[6px] md:text-[8px] font-bold uppercase text-muted-foreground">Pendente</span>
                 </div>
               </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col gap-4 items-start">
          {/* Navigation Bar */}
          <TabsList className="w-full flex flex-row h-auto p-2 bg-slate-200/50 dark:bg-white/5 rounded-2xl md:rounded-3xl border border-border/50 overflow-x-auto no-scrollbar gap-2 z-40 shadow-sm">
            <TabsTrigger 
              value="overview" 
              className="flex-1 justify-center rounded-xl md:rounded-2xl py-3 md:py-4 px-3 md:px-8 gap-2 md:gap-4 flex flex-row items-center bg-white/40 dark:bg-white/5 border border-transparent data-[state=active]:bg-white dark:data-[state=active]:bg-sidebar text-muted-foreground data-[state=active]:text-primary data-[state=active]:border-border data-[state=active]:shadow-lg transition-all group hover:bg-white/60 dark:hover:bg-white/10"
            >
              <CheckSquare className="h-4 w-4 md:h-5 md:w-5 group-data-[state=active]:scale-110 transition-transform text-slate-500 group-data-[state=active]:text-primary" />
              <div className="flex flex-col items-center md:items-start leading-none gap-0.5">
                <span className="text-[10px] md:text-sm font-black uppercase tracking-tight">Checklist</span>
                <span className="text-[7px] md:text-[10px] font-bold text-muted-foreground hidden sm:block">Gestão Geral</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="finance" 
              className="flex-1 justify-center rounded-xl md:rounded-2xl py-3 md:py-4 px-3 md:px-8 gap-2 md:gap-4 flex flex-row items-center bg-white/40 dark:bg-white/5 border border-transparent data-[state=active]:bg-white dark:data-[state=active]:bg-sidebar text-muted-foreground data-[state=active]:text-primary data-[state=active]:border-border data-[state=active]:shadow-lg transition-all group hover:bg-white/60 dark:hover:bg-white/10"
            >
              <Calculator className="h-4 w-4 md:h-5 md:w-5 group-data-[state=active]:scale-110 transition-transform text-slate-500 group-data-[state=active]:text-primary" />
              <div className="flex flex-col items-center md:items-start leading-none gap-0.5">
                <span className="text-[10px] md:text-sm font-black uppercase tracking-tight">Financeiro</span>
                <span className="text-[7px] md:text-[10px] font-bold text-muted-foreground hidden sm:block">Despesas</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="marketing" 
              className="flex-1 justify-center rounded-xl md:rounded-2xl py-3 md:py-4 px-3 md:px-8 gap-2 md:gap-4 flex flex-row items-center bg-white/40 dark:bg-white/5 border border-transparent data-[state=active]:bg-white dark:data-[state=active]:bg-sidebar text-muted-foreground data-[state=active]:text-primary data-[state=active]:border-border data-[state=active]:shadow-lg transition-all group hover:bg-white/60 dark:hover:bg-white/10"
            >
              <ImageIcon className="h-4 w-4 md:h-5 md:w-5 group-data-[state=active]:scale-110 transition-transform text-slate-500 group-data-[state=active]:text-primary" />
              <div className="flex flex-col items-center md:items-start leading-none gap-0.5">
                <span className="text-[10px] md:text-sm font-black uppercase tracking-tight">Marketing</span>
                <span className="text-[7px] md:text-[10px] font-bold text-muted-foreground hidden sm:block">Docs & Foto</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="location" 
              className="flex-1 justify-center rounded-xl md:rounded-2xl py-3 md:py-4 px-3 md:px-8 gap-2 md:gap-4 flex flex-row items-center bg-white/40 dark:bg-white/5 border border-transparent data-[state=active]:bg-white dark:data-[state=active]:bg-sidebar text-muted-foreground data-[state=active]:text-primary data-[state=active]:border-border data-[state=active]:shadow-lg transition-all group hover:bg-white/60 dark:hover:bg-white/10"
            >
              <MapPin className="h-4 w-4 md:h-5 md:w-5 group-data-[state=active]:scale-110 transition-transform text-slate-500 group-data-[state=active]:text-primary" />
              <div className="flex flex-col items-center md:items-start leading-none gap-0.5">
                <span className="text-[12px] md:text-base font-black uppercase tracking-tight">Estande</span>
                <span className="text-[9px] md:text-[12px] font-bold text-muted-foreground hidden sm:block">Localização</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="leads" 
              className="flex-1 justify-center rounded-xl md:rounded-2xl py-3 md:py-4 px-3 md:px-8 gap-2 md:gap-4 flex flex-row items-center bg-white/40 dark:bg-white/5 border border-transparent data-[state=active]:bg-white dark:data-[state=active]:bg-sidebar text-muted-foreground data-[state=active]:text-primary data-[state=active]:border-border data-[state=active]:shadow-lg transition-all group hover:bg-white/60 dark:hover:bg-white/10"
            >
              <Users className="h-4 w-4 md:h-5 md:w-5 group-data-[state=active]:scale-110 transition-transform text-slate-500 group-data-[state=active]:text-primary" />
              <div className="flex flex-col items-center md:items-start leading-none gap-0.5">
                <span className="text-[12px] md:text-base font-black uppercase tracking-tight">Planilha</span>
                <span className="text-[9px] md:text-[12px] font-bold text-muted-foreground hidden sm:block">Leads Feira</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <div className="flex-grow w-full">
            <TabsContent value="overview" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Checklist Progress */}
              <Card className="bg-card border-border shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold">Checklist de Preparação</CardTitle>
                      <CardDescription>Acompanhe as etapas de montagem da feira</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {canManageChecklist && checklistItems.length === 0 && (
                          <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => loadDefaultChecklist([])}
                              disabled={isAddingDefault}
                              className="h-8 gap-2 text-[10px] font-black uppercase tracking-tight bg-orange-500/5 border-orange-500/20 text-orange-600 hover:bg-orange-50"
                          >
                              {isAddingDefault ? <Loader2 className="h-3 w-3 animate-spin" /> : <HistoryIcon className="h-3 w-3" />}
                              Carregar Itens
                          </Button>
                        )}
                        {canManageChecklist && (
                            <>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleSaveAsTemplate}
                                    disabled={isSavingTemplate || checklistItems.length === 0}
                                    className="h-8 gap-2 text-[10px] font-black uppercase tracking-tight hidden md:flex"
                                >
                                    {isSavingTemplate ? <Loader2 className="h-3 w-3 animate-spin" /> : <Settings className="h-3 w-3" />}
                                    Fixar como Padrão
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 bg-primary/10 text-primary" onClick={() => {
                                    setChecklistForm({ id: '', label: '', completed: false });
                                    setChecklistModalOpen(true);
                                }}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                          <CheckSquare className="h-6 w-6" />
                        </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {checklistItems.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "w-full flex items-center justify-between p-4 transition-colors hover:bg-muted/20"
                        )}
                      >
                        <div 
                            className="flex items-center gap-3 cursor-pointer flex-1"
                            onClick={() => handleToggleChecklistItem(item)}
                        >
                          <span className={cn(
                            "p-1 rounded-full",
                            item.completed ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                          )}>
                            <CheckCircle2 className="h-4 w-4" />
                          </span>
                          <span className={cn(
                            "text-sm font-bold uppercase tracking-wide",
                            item.completed ? "text-foreground line-through opacity-50" : "text-foreground"
                          )}>
                            {item.label}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {item.completed && <span className="text-[10px] font-black uppercase text-green-500 hidden sm:inline">Concluído</span>}
                            {canManageChecklist && (
                                <>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => {
                                        setChecklistForm({ id: item.id, label: item.label, completed: item.completed });
                                        setChecklistModalOpen(true);
                                    }}>
                                        <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500" onClick={() => handleDeleteChecklistItem(item.id, item.label)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </>
                            )}
                        </div>
                      </div>
                    ))}
                    {checklistItems.length === 0 && !isAddingDefault && (
                        <div className="p-12 text-center flex flex-col items-center gap-4">
                            <div className="space-y-1">
                                <p className="text-muted-foreground italic text-sm">Nenhum item no checklist.</p>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground/60">Franciele pode adicionar novos itens acima</p>
                            </div>
                        </div>
                    )}
                    {isAddingDefault && (
                        <div className="p-12 text-center flex flex-col items-center gap-4">
                            <div className="space-y-1">
                                <p className="text-muted-foreground italic text-sm">Carregando checklist padrão...</p>
                                <Loader2 className="h-6 w-6 animate-spin text-primary/30 mx-auto mt-4" />
                            </div>
                        </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity Mini */}
              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold">Últimos Leads Captados</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={generateDetailedPerformanceReport} className="gap-2 text-[10px] uppercase font-black border-primary text-primary">
                      <TrendingUp className="h-3.5 w-3.5" /> Desempenho
                    </Button>
                    <Button variant="outline" size="sm" onClick={generateLeadsReport} className="gap-2 text-[10px] uppercase font-black">
                      <FileDown className="h-3.5 w-3.5" /> PDF de Leads
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {leads.slice(0, 5).map(lead => (
                    <div key={lead.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          lead.ai_score === 'hot' ? 'bg-red-500' : 
                          lead.ai_score === 'warm' ? 'bg-amber-500' : 'bg-blue-500'
                        )} />
                        <div>
                          <p className="text-sm font-black uppercase">{lead.name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground">{lead.company}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-green-500 hover:bg-green-50"
                          onClick={() => handleGenerateMessage(lead)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <span className="text-[9px] font-bold uppercase text-muted-foreground whitespace-nowrap">{safeFormatDate(lead.created_at)}</span>
                      </div>
                    </div>
                  ))}
                  {leads.length > 5 && (
                    <div className="pt-2 text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">Histórico de leads captados nesta feira</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="finance" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
               <div>
                  <h2 className="text-xl font-bold">Controle Financeiro</h2>
                  <p className="text-sm text-muted-foreground">Registre contratos, pagamentos e custos reais da feira.</p>
               </div>
               <div className="flex flex-wrap gap-2">
                 <select
                   className="h-8 px-2 bg-background border border-primary/30 rounded-md text-[10px] font-black uppercase text-primary outline-none focus:ring-1 focus:ring-primary"
                   value={categoryFilter}
                   onChange={(e) => setCategoryFilter(e.target.value)}
                 >
                   <option value="all">Todas Categorias</option>
                   {expenseCategories.map(cat => (
                     <option key={cat} value={cat}>{cat}</option>
                   ))}
                 </select>
                 <Button variant="outline" onClick={generateExpensesReport} className="gap-2 border-primary/30 text-primary h-8 px-3 text-[10px] font-black uppercase">
                   <FileDown className="h-4 w-4" /> Exportar PDF
                 </Button>
                 {canManage && (
                   <Button onClick={() => setExpenseModalOpen(true)} className="gap-2 h-8 px-3 text-[10px] font-black uppercase shadow-lg shadow-primary/20">
                     <Plus className="h-4 w-4" /> Lançar Despesa
                   </Button>
                 )}
               </div>
            </div>

            {expenses.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                    <Card className="lg:col-span-4 bg-card border-border shadow-sm">
                        <CardHeader className="p-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest leading-none">Distribuição por Categoria</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={expensesByCategory}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {expensesByCategory.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip 
                                        formatter={(val: number) => formatCurrency(val)}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-8 bg-card border-border shadow-sm">
                        <CardHeader className="p-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest leading-none">Custo por Categoria</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 h-[250px]">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={expensesByCategory} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        width={100} 
                                        style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                                    />
                                    <RechartsTooltip 
                                        formatter={(val: number) => formatCurrency(val)}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {expensesByCategory.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                             </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {expenses.length === 0 ? (
                 <div className="col-span-full py-12 text-center bg-muted/20 border-2 border-dashed border-border rounded-2xl">
                    <p className="text-muted-foreground italic">Nenhuma despesa lançada.</p>
                 </div>
               ) : (
                 expenses.map(exp => (
                   <Card key={exp.id} className="bg-card border-border group overflow-hidden relative">
                     <CardHeader className="p-4 pb-2">
                       <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                           {exp.category}
                         </span>
                         <span className="text-[11px] font-bold text-muted-foreground">{safeFormatDate(exp.date)}</span>
                       </div>
                       <CardTitle className="text-lg font-bold mt-2">{exp.vendor_name}</CardTitle>
                       <CardDescription className="line-clamp-1">{exp.description}</CardDescription>
                     </CardHeader>
                     <CardContent className="p-4 pt-2">
                        <p className="text-2xl font-black text-foreground">{formatCurrency(exp.amount)}</p>
                         <div className="flex flex-wrap gap-3 mt-4">
                            {exp.contract_url && (
                              <div className="flex items-center gap-2">
                                <a 
                                  href={exp.contract_url} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 rounded-lg text-[10px] font-black text-blue-600 hover:bg-blue-500/20 transition-colors uppercase tracking-widest"
                                  title="Visualizar Contrato"
                                >
                                  <FileCheck className="h-4 w-4" /> Contrato
                                </a>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-blue-400 hover:text-blue-600"
                                  onClick={() => {
                                    navigator.clipboard.writeText(exp.contract_url || '');
                                    toast.success('Link do contrato copiado!');
                                  }}
                                  title="Copiar Link para compartilhar"
                                >
                                  <Share2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                            {exp.payment_proof_url && (
                              <div className="flex items-center gap-2">
                                <a 
                                  href={exp.payment_proof_url} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 rounded-lg text-[10px] font-black text-green-600 hover:bg-green-500/20 transition-colors uppercase tracking-widest"
                                  title="Visualizar Comprovante"
                                >
                                  <Receipt className="h-4 w-4" /> Recibo
                                </a>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-green-400 hover:text-green-600"
                                  onClick={() => {
                                    navigator.clipboard.writeText(exp.payment_proof_url || '');
                                    toast.success('Link do comprovante copiado!');
                                  }}
                                  title="Copiar Link para compartilhar"
                                >
                                  <Share2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                         </div>
                     </CardContent>
                     {canManage && (
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0 duration-300">
                            <Button 
                               variant="secondary" 
                               size="icon" 
                               className="h-8 w-8 bg-white/80 backdrop-blur shadow-sm border border-border" 
                               onClick={() => handleEditExpense(exp)}
                               title="Editar Despesa"
                            >
                               <Edit2 className="h-4 w-4 text-slate-600" />
                            </Button>
                            <Button 
                               variant="destructive" 
                               size="icon" 
                               className="h-8 w-8 shadow-sm" 
                               onClick={() => handleDeleteExpense(exp.id)}
                               title="Excluir Despesa"
                            >
                               <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                     )}
                   </Card>
                 ))
               )}
            </div>
          </TabsContent>

          <TabsContent value="marketing" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
               <div>
                 <h2 className="text-xl font-bold">Base de Marketing</h2>
                 <p className="text-sm text-muted-foreground">Artes, fotos do estante e documentos oficiais para compartilhamento.</p>
               </div>
               {canManage && (
                 <Button onClick={() => setAssetModalOpen(true)} className="gap-2">
                   <Plus className="h-4 w-4" /> Adicionar Arquivo
                 </Button>
               )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
               {assets.map(asset => (
                 <Card key={asset.id} className="bg-card border-border overflow-hidden group">
                   <div className="aspect-square bg-muted/30 flex items-center justify-center relative">
                      {asset.type === 'image' ? (
                        <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <FileText className="h-10 w-10 text-muted-foreground/40" />
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                         <a href={asset.url} target="_blank" rel="noreferrer" className="p-2 bg-white rounded-full text-slate-900">
                           <Download className="h-4 w-4" />
                         </a>
                         {canManage && (
                           <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full" onClick={async () => {
                             if(window.confirm('Excluir arquivo?')) {
                               await deleteDoc(doc(db, 'fair_assets', asset.id));
                               toast.success('Arquivo excluído.');
                             }
                           }}>
                             <Trash2 className="h-3.5 w-3.5" />
                           </Button>
                         )}
                      </div>
                   </div>
                   <div className="p-2">
                     <p className="text-[9px] font-black uppercase text-center truncate">{asset.name}</p>
                   </div>
                 </Card>
               ))}
            </div>
          </TabsContent>

          <TabsContent value="location" className="space-y-6">
            <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Mapa e Localização do Estande</CardTitle>
                    <CardDescription>Estes dados serão usados pelos vendedores para guiar os clientes no WhatsApp.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Informação de Localização (Texto)</Label>
                                <Textarea 
                                    className="min-h-[115px]"
                                    placeholder="Ex: Rua C, Esquina com Av. Central. Ao lado da entrada principal."
                                    value={fair.map_info || ''}
                                    onChange={async (e) => {
                                        await updateDoc(doc(db, 'fairs', fair.id), { map_info: e.target.value });
                                    }}
                                />
                                <p className="text-[12px] text-muted-foreground italic">Este texto será enviado automaticamente na mensagem de WhatsApp para os clientes.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Link da Imagem do Mapa (JPG/PNG)</Label>
                                <Input 
                                    placeholder="https://..."
                                    value={fair.map_image_url || ''}
                                    onChange={async (e) => {
                                        await updateDoc(doc(db, 'fairs', fair.id), { map_image_url: e.target.value });
                                    }}
                                />
                            </div>
                        </div>
                        <div className="aspect-square bg-muted rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                            {fair.map_image_url ? (
                                <img src={fair.map_image_url} alt="Mapa do Estande" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                                <div className="text-center p-6 opacity-30">
                                    <MapPin className="h-12 w-12 mx-auto mb-2" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Nenhum mapa configurado</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads" className="space-y-6">
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold">Planilha de Leads da Feira</CardTitle>
                  <CardDescription>Todos os contatos capturados no cadastro rápido.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                   <div className="relative w-full md:w-64">
                     <Input 
                       placeholder="Buscar lead..." 
                       className="h-9 pr-8" 
                       value={leadSearch}
                       onChange={e => setLeadSearch(e.target.value)}
                     />
                   </div>
                   <Button variant="outline" size="sm" onClick={generateLeadsReport} className="h-9 gap-2">
                     <FileDown className="h-4 w-4" /> Exportar PDF
                   </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted/50 border-y border-border">
                    <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Lead / Empresa</th>
                      <th className="px-4 py-3">Contato</th>
                      <th className="px-4 py-3">Produtos</th>
                      <th className="px-4 py-3">Observações</th>
                      <th className="px-4 py-3">Vendedor</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {leads
                      .filter(l => {
                        const search = leadSearch.toLowerCase();
                        return l.name.toLowerCase().includes(search) || 
                               (l.company || '').toLowerCase().includes(search) ||
                               (l.salesperson_name || '').toLowerCase().includes(search) ||
                               (l.observations || '').toLowerCase().includes(search);
                      })
                      .map(lead => (
                      <tr key={lead.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-[11px] font-bold text-muted-foreground">{safeFormatDate(lead.created_at)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black uppercase text-foreground">{lead.name}</span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">{lead.company || '-'}</span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1 mt-0.5">
                              <MapPin className="h-2.5 w-2.5" /> {lead.city || '-'}{lead.state ? `, ${lead.state}` : ''}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                           <div className="flex flex-col">
                             <span className="text-[11px] font-bold">{lead.phone || '-'}</span>
                             <span className="text-[9px] font-medium text-muted-foreground">{lead.email || '-'}</span>
                           </div>
                        </td>
                        <td className="px-4 py-3">
                           <div className="flex flex-wrap gap-1">
                             {(lead.interest_products || []).map(p => (
                               <span key={p} className="text-[8px] font-black px-1.5 py-0.5 bg-primary/10 text-primary rounded-full uppercase">{p}</span>
                             ))}
                             {(lead.interest_products || []).length === 0 && <span className="text-[9px] text-muted-foreground">Geral</span>}
                           </div>
                        </td>
                        <td className="px-4 py-3">
                           <p className="text-[10px] text-muted-foreground line-clamp-2 max-w-[200px]" title={lead.observations}>
                             {lead.observations || '-'}
                           </p>
                        </td>
                        <td className="px-4 py-3">
                           <span className="text-[11px] font-bold text-muted-foreground">{lead.salesperson_name || 'Anônimo'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              lead.ai_score === 'hot' ? 'bg-red-500' : 'bg-amber-500'
                            )} />
                            <span className={cn(
                              "text-[9px] font-black uppercase",
                              lead.ai_score === 'hot' ? 'text-red-500' : 'text-amber-500'
                            )}>
                              {lead.ai_score === 'hot' ? 'Quente' : 'Morno'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                           <div className="flex items-center justify-end gap-1">
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className="h-8 w-8 text-primary hover:bg-primary/5"
                               onClick={() => openEditLeadModal(lead)}
                             >
                               <Edit2 className="h-4 w-4" />
                             </Button>
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className="h-8 w-8 text-green-500 hover:bg-green-50"
                               onClick={() => handleGenerateMessage(lead)}
                             >
                               <Phone className="h-4 w-4" />
                             </Button>
                           </div>
                        </td>
                      </tr>
                    ))}
                    {leads.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground italic text-sm">
                          Nenhum lead captado nesta feira.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
          </div>
        </Tabs>

        {/* Expense Modal */}
        <Dialog open={expenseModalOpen} onOpenChange={(open) => {
            setExpenseModalOpen(open);
            if (!open) resetExpenseForm();
        }}>
           <DialogContent className="sm:max-w-[425px]">
             <DialogHeader>
               <DialogTitle>{expenseEditMode ? 'Editar Despesa' : 'Registrar Despesa'}</DialogTitle>
             </DialogHeader>
             <form onSubmit={handleSaveExpense} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Fornecedor*</Label>
                  <Input required value={expenseForm.vendor_name} onChange={e => setExpenseForm(p => ({...p, vendor_name: e.target.value}))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor (R$)*</Label>
                    <Input type="number" step="0.01" required value={expenseForm.amount} onChange={e => setExpenseForm(p => ({...p, amount: e.target.value}))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Data*</Label>
                    <Input type="date" required value={expenseForm.date} onChange={e => setExpenseForm(p => ({...p, date: e.target.value}))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Categoria*</Label>
                  <select 
                    className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm"
                    required
                    value={expenseForm.category}
                    onChange={e => {
                      const val = e.target.value;
                      setExpenseForm(p => ({...p, category: val}));
                      setShowNewCategoryInput(val === 'NEW_CATEGORY');
                    }}
                  >
                    <option value="">Selecione...</option>
                    {expenseCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="NEW_CATEGORY" className="font-bold text-primary">+ Criar nova categoria...</option>
                  </select>
                </div>
                {showNewCategoryInput && (
                   <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2 bg-primary/5 p-3 rounded-lg border border-primary/10"
                   >
                     <Label className="text-xs">Nome da Nova Categoria*</Label>
                     <Input 
                      required 
                      placeholder="Ex: Brindes de Luxo" 
                      value={newCategoryName} 
                      onChange={e => setNewCategoryName(e.target.value)} 
                     />
                   </motion.div>
                )}
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={expenseForm.description} onChange={e => setExpenseForm(p => ({...p, description: e.target.value}))} />
                </div>
                <div className="space-y-4 pt-2 border-t border-border/50">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center justify-between">
                      Anectar Contrato (PDF/Imagem)
                      {expenseForm.contract_url && <span className="text-[8px] text-green-500">Já possui anexo</span>}
                    </Label>
                    <div className="flex gap-2">
                      <Input 
                        type="file" 
                        accept="application/pdf,image/*" 
                        className="text-xs h-9 cursor-pointer"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) setExpenseForm(p => ({ ...p, contractFile: file }));
                        }}
                      />
                      {(expenseForm.contractFile || expenseForm.contract_url) && (
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-red-500" 
                            onClick={() => setExpenseForm(p => ({...p, contractFile: null, contract_url: ''}))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center justify-between">
                      Anectar Comprovante (PDF/Imagem)
                      {expenseForm.payment_proof_url && <span className="text-[8px] text-green-500">Já possui anexo</span>}
                    </Label>
                    <div className="flex gap-2">
                      <Input 
                        type="file" 
                        accept="application/pdf,image/*" 
                        className="text-xs h-9 cursor-pointer"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) setExpenseForm(p => ({ ...p, proofFile: file }));
                        }}
                      />
                      {(expenseForm.proofFile || expenseForm.payment_proof_url) && (
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-red-500" 
                            onClick={() => setExpenseForm(p => ({...p, proofFile: null, payment_proof_url: ''}))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full font-bold uppercase tracking-widest h-12" disabled={isSavingExpense}>
                  {isSavingExpense ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (expenseEditMode ? <Edit2 className="h-4 w-4 mr-2" /> : <Calculator className="h-4 w-4 mr-2" />)}
                  {isSavingExpense ? 'Salvando...' : (expenseEditMode ? 'Atualizar Despesa' : 'Salvar Despesa')}
                </Button>
             </form>
           </DialogContent>
        </Dialog>

        {/* Asset Modal */}
        <Dialog open={assetModalOpen} onOpenChange={setAssetModalOpen}>
           <DialogContent className="sm:max-w-[425px]">
             <DialogHeader>
               <DialogTitle>Adicionar Material</DialogTitle>
             </DialogHeader>
             <form onSubmit={handleAddAsset} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome do Material*</Label>
                  <Input required placeholder="Ex: Banner Oficial North Show" value={assetForm.name} onChange={e => setAssetForm(p => ({...p, name: e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo*</Label>
                  <select 
                    className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm"
                    required
                    value={assetForm.type}
                    onChange={e => setAssetForm(p => ( {...p, type: e.target.value as any} ))}
                  >
                    <option value="image">Imagem / Foto</option>
                    <option value="document">Documento / PDF</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Link do Arquivo (Público)*</Label>
                  <Input required placeholder="https://..." value={assetForm.url} onChange={e => setAssetForm(p => ({...p, url: e.target.value}))} />
                </div>
                <Button type="submit" className="w-full">Adicionar ao QG</Button>
             </form>
           </DialogContent>
        </Dialog>

        {/* Checklist Modal */}
        <Dialog open={checklistModalOpen} onOpenChange={setChecklistModalOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{checklistForm.id ? 'Editar Item' : 'Novo Item de Checklist'}</DialogTitle>
                <DialogDescription>Adicione ou modifique tarefas de preparação.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveChecklistItem} className="space-y-4 pt-4">
                 <div className="space-y-2">
                   <Label>Descrição da Tarefa*</Label>
                   <Input 
                    required 
                    placeholder="Ex: Contratar recepcionistas" 
                    value={checklistForm.label} 
                    onChange={e => setChecklistForm(p => ({...p, label: e.target.value}))} 
                   />
                 </div>
                 {checklistForm.id && (
                    <div className="flex items-center space-x-2">
                        <input 
                            type="checkbox" 
                            id="item-completed"
                            checked={checklistForm.completed}
                            onChange={e => setChecklistForm(p => ({...p, completed: e.target.checked}))}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="item-completed">Tarefa Concluída</Label>
                    </div>
                 )}
                 <Button type="submit" className="w-full">{checklistForm.id ? 'Atualizar Tarefa' : 'Criar Tarefa'}</Button>
              </form>
            </DialogContent>
        </Dialog>

        {/* AI Insight Modal */}
        <Dialog open={aiInsightModalOpen} onOpenChange={setAiInsightModalOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col overflow-hidden">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <BrainCircuit className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight">Análise Estratégica da Feira</DialogTitle>
                    <DialogDescription>Relatório gerado por Inteligência Artificial</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto px-1 py-4">
                {isAnalysing ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
                      Acelerando neurônios...
                    </p>
                    <p className="text-[10px] text-muted-foreground italic text-center max-w-[250px]">
                      A IA está cruzando dados de leads, custos e perfis para gerar seu relatório...
                    </p>
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="bg-muted/30 p-6 rounded-2xl border border-border">
                      <ReactMarkdown>{aiInsight}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border flex justify-between items-center">
                 <p className="text-[10px] text-muted-foreground italic">
                   *Esta análise é baseada em projeções estatísticas.
                 </p>
                 <Button onClick={() => setAiInsightModalOpen(false)}>Fechar Relatório</Button>
              </div>
            </DialogContent>
        </Dialog>

        {/* WhatsApp Message Modal */}
        <Dialog open={waMessageModalOpen} onOpenChange={setWaMessageModalOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-xl">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight">Copiloto WhatsApp</DialogTitle>
                    <DialogDescription>Mensagem personalizada sugerida pelo Jefe Roder</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="py-4 space-y-4">
                {generatingMessage ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-green-500" />
                    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Gerando sugestão...</p>
                  </div>
                 ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/30 border border-border rounded-xl">
                        <Textarea 
                            className="min-h-[200px] text-sm bg-transparent border-none focus-visible:ring-0 resize-none"
                            value={suggestedMessage}
                            onChange={(e) => setSuggestedMessage(e.target.value)}
                        />
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                        <p className="text-[10px] text-amber-800 dark:text-amber-400 font-bold uppercase tracking-widest flex items-center gap-2">
                           <AlertCircle className="h-3 w-3" /> Dica do Jefe:
                        </p>
                        <p className="text-[10px] text-amber-900/70 dark:text-amber-500 mt-1 leading-relaxed">
                           Personalize os placeholders como [NOME DO VENDEDOR] antes de enviar.
                        </p>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                 <Button variant="outline" onClick={() => setWaMessageModalOpen(false)}>Cancelar</Button>
                 <Button 
                    className="bg-green-600 hover:bg-green-700 text-white gap-2 font-bold uppercase tracking-widest text-xs"
                    onClick={() => {
                        const phone = selectedLeadForMessage?.phone?.replace(/\D/g, '');
                        if (!phone) {
                            toast.error('Lead sem telefone válido.');
                            return;
                        }
                        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(suggestedMessage)}`, '_blank');
                        setWaMessageModalOpen(false);
                    }}
                    disabled={generatingMessage}
                 >
                    Enviar via WhatsApp
                 </Button>
               </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Edit Lead Modal */}
        <Dialog open={editLeadModalOpen} onOpenChange={setEditLeadModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Lead da Feira</DialogTitle>
              <DialogDescription>Atualize as informações do contato captado.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="lead_name">Nome Completo</Label>
                <Input 
                  id="lead_name" 
                  value={editLeadForm.name} 
                  onChange={e => setEditLeadForm(p => ({ ...p, name: e.target.value }))} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lead_company">Empresa</Label>
                <Input 
                  id="lead_company" 
                  value={editLeadForm.company} 
                  onChange={e => setEditLeadForm(p => ({ ...p, company: e.target.value }))} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="lead_city">Cidade</Label>
                  <Input 
                    id="lead_city" 
                    value={editLeadForm.city} 
                    onChange={e => setEditLeadForm(p => ({ ...p, city: e.target.value }))} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lead_state">Estado</Label>
                  <select 
                    id="lead_state"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={editLeadForm.state}
                    onChange={e => setEditLeadForm(p => ({ ...p, state: e.target.value }))}
                  >
                    <option value="">Selecione</option>
                    {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lead_obs">Observações</Label>
                <Textarea 
                  id="lead_obs" 
                  value={editLeadForm.observations} 
                  onChange={e => setEditLeadForm(p => ({ ...p, observations: e.target.value }))} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditLeadModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpdateLead} className="font-bold">Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

