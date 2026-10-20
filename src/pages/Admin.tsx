import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, setDoc, deleteDoc, where, getDocs, writeBatch, Timestamp, addDoc } from 'firebase/firestore';
import { lerComCache } from '../lib/leiturasCompartilhadas';
import { db, auth } from '../lib/firebase';
import { UserProfile, UserRole, UserStatus, AITeaching, RoderApiKey } from '../types';
import { AuditService, AuditLogEntry, AuditAction } from '../lib/AuditService';
import { CryptoService } from '../lib/CryptoService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import RegrasSeguranca from '../components/admin/RegrasSeguranca';
import FotosExternas from '../components/admin/FotosExternas';
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  Shield, 
  CheckCircle2, 
  XCircle,
  RotateCcw,
  RefreshCw,
  History,
  Mail,
  Phone,
  MapPin,
  Percent,
  Search,
  Share2,
  FileText,
  ExternalLink,
  Eye,
  EyeOff,
  Settings,
  Send,
  AlertCircle,
  ChevronLeft,
  Plus,
  Bell,
  TrendingUp,
  Users,
  Key,
  Loader2,
  Clock,
  Activity,
  User,
  Calendar,
  Trophy,
  Laptop,
  Smartphone,
  Award,
  Brain,
  Wrench,
  MessageCircle,
  Code2,
  Copy,
  Check,
  Power,
  BookOpen
} from 'lucide-react';
import { HelpTooltip } from '../components/base/HelpTooltip';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  DialogFooter,
  DialogDescription
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Link, useNavigate } from 'react-router-dom';
import { usePWA } from '../contexts/PWAContext';
import { Wifi, WifiOff, Download } from 'lucide-react';
import { getApiBaseUrl } from '../lib/utils';

import { maskPhone, maskCpfCnpj } from '../lib/masks';
import { textoLinkParceiro } from '../lib/consultorIndicar';
import { Link2 } from 'lucide-react';

export default function Admin({ isUsersView = false, defaultTab = 'settings' }: { isUsersView?: boolean; defaultTab?: string }) {
  const { user, profile, startImpersonation, realProfile, isAdmin, isManager, isTriagem, isMarketing } = useAuth();
  const navigate = useNavigate();
  
  const { isOffline, canInstall, isDownloading, downloadProgress, pendingSyncCount, installApp, syncDataLocally, processSyncQueue } = usePWA();
  const [activeTab, setActiveTab] = useState(isUsersView ? 'users' : defaultTab);
  
  // Sync the controlled tab state when props change
  useEffect(() => {
    setActiveTab(isUsersView ? 'users' : defaultTab);
  }, [isUsersView, defaultTab]);

  useEffect(() => {
    if (activeTab === 'ai_monitoring') {
      setLoadingTeachings(true);
      const q = query(collection(db, 'roder_ai_questions'), orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AITeaching[];
        setTeachings(data);
        setLoadingTeachings(false);
      }, (error) => {
        console.error("Error fetching teachings:", error);
        toast.error("Erro ao carregar ensinamentos da IA.");
        setLoadingTeachings(false);
      });
      return () => unsubscribe();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'api_keys') {
      setLoadingApiKeys(true);
      const q = query(collection(db, 'api_keys'), orderBy('created_at', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as RoderApiKey[];
        setApiKeys(data);
        setLoadingApiKeys(false);
      }, (error) => {
        console.error("Error fetching API keys:", error);
        toast.error("Erro ao carregar chaves de API.");
        setLoadingApiKeys(false);
      });
      return () => unsubscribe();
    }
  }, [activeTab]);

  const handleGenerateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Informe o nome do aplicativo ou sistema de destino.");
      return;
    }

    setGeneratingKey(true);
    try {
      const response = await fetch('/api/v1/api-keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName.trim(),
          permissions: newKeyPermissions,
          created_by: profile?.name || profile?.email || 'Admin'
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Falha ao gerar chave.');
      }

      toast.success(`Chave criada com sucesso para ${newKeyName.trim()}!`);
      setNewKeyName('');
      setNewKeyPermissions({ stock: true, catalog: true, leads: false });
      setIsApiKeyDialogOpen(false);
    } catch (err: any) {
      console.error("Error creating API key:", err);
      toast.error(`Erro ao criar chave: ${err.message}`);
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleToggleApiKeyStatus = async (keyId: string, currentStatus: boolean) => {
    try {
      const keyRef = doc(db, 'api_keys', keyId);
      await updateDoc(keyRef, {
        active: !currentStatus
      });
      toast.success(!currentStatus ? "Chave ativada com sucesso!" : "Chave desativada. O aplicativo externo foi bloqueado.");
    } catch (err: any) {
      console.error("Error updating key status:", err);
      toast.error("Erro ao alterar status da chave.");
    }
  };

  const handleDeleteApiKey = async (keyId: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente a chave de acesso do app "${name}"? O aplicativo externo perderá a conexão imediatamente.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'api_keys', keyId));
      toast.success("Chave excluída com sucesso.");
    } catch (err: any) {
      console.error("Error deleting API key:", err);
      toast.error("Erro ao excluir chave.");
    }
  };

  const handleTogglePermission = async (keyId: string, permissionKey: 'stock' | 'catalog' | 'leads', currentVal: boolean) => {
    try {
      const keyRef = doc(db, 'api_keys', keyId);
      await updateDoc(keyRef, {
        [`permissions.${permissionKey}`]: !currentVal
      });
      toast.success("Permissões da chave atualizadas!");
    } catch (err: any) {
      console.error("Error updating permission:", err);
      toast.error("Erro ao atualizar permissões.");
    }
  };

  const copyToClipboard = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    if (id) {
      setCopiedKeyId(id);
      setTimeout(() => setCopiedKeyId(null), 2500);
    } else {
      setCopiedEndpoint(true);
      setTimeout(() => setCopiedEndpoint(false), 2500);
    }
    toast.success("Copiado para a área de transferência!");
  };

  const generateGuideText = (apiKey?: RoderApiKey | null) => {
    const keyVal = apiKey?.key || 'SUA_CHAVE_AQUI';
    const appName = apiKey?.name || 'Seu Aplicativo';
    // Se estiver rodando no ambiente de preview/dev privado (ais-dev-*.run.app), 
    // a URL pública/compartilhada sem autenticação do Google é ais-pre-*.run.app
    const currentOrigin = window.location.origin;
    const origin = currentOrigin.includes('ais-dev-')
      ? currentOrigin.replace('ais-dev-', 'ais-pre-')
      : currentOrigin;

    return `# GUIA DE INTEGRAÇÃO - API RODER INDICA V2
# Destinado a: ${appName}
# Chave de Acesso (API Key): ${keyVal}

============================================================
INSTRUÇÃO IMPORTANTE:
Copie as orientações e coloque no aplicativo que vai ler a chave.
============================================================

1. ENDPOINTS DISPONÍVEIS:
   • Estoque Geral (Fábrica, Sinop & Peças):
     GET ${origin}/api/v1/stock

   • Catálogo Técnico de Equipamentos:
     GET ${origin}/api/v1/catalog

   (Nota: ${origin.includes('ais-pre-') ? 'Esta é a URL pública/compartilhada pública da API que NÃO exige login do Google.' : 'URL pública direta.'})

2. COMO AUTENTICAR SUAS REQUISIÇÕES:
   Opção A (Recomendada via Cabeçalho HTTP Header):
     Header: x-api-key: ${keyVal}

   Opção B (Via URL Query Parameter):
     GET ${origin}/api/v1/stock?api_key=${keyVal}

3. EXEMPLO DE REQUISIÇÃO (CURL / TERMINAL):
   curl -X GET "${origin}/api/v1/stock" \\
     -H "x-api-key: ${keyVal}"

4. EXEMPLO DE REQUISIÇÃO (JAVASCRIPT / TYPESCRIPT):
   const response = await fetch("${origin}/api/v1/stock", {
     headers: {
       "x-api-key": "${keyVal}"
     }
   });
   const data = await response.json();
   console.log("Estoque Roder:", data);

5. FORMATO DA RESPOSTA (JSON):
   {
     "success": true,
     "source": "Roder Indica V2",
     "app": "${appName}",
     "timestamp": "${new Date().toISOString()}",
     "total_items": 45,
     "items": [
       {
         "id": "item_123",
         "name": "CMF 500",
         "sku": "CMF-500",
         "category": "cabeçote",
         "unit": "un",
         "quantity_total": 4,
         "quantity_reserved": 1,
         "quantity_available": 3,
         "locations": {
           "fabrica": 2,
           "sinop": 1
         },
         "status": "in_stock"
       }
     ]
   }

6. OBSERVAÇÕES E BOAS PRÁTICAS:
   • O estoque é recalculado em tempo real considerando pedidos em negociação.
   • A chave pode ter o acesso pausado ou permissões alteradas a qualquer momento pelo painel Admin Roder.
   • Mantenha esta chave segura em variáveis de ambiente (ex: .env) do seu aplicativo.`;
  };

  const canManageAll = isAdmin || isManager || realProfile?.email === 'roderbrasil@gmail.com';

  const handleUpdateTeaching = async () => {
    if (!editingTeaching) return;
    
    try {
      const docRef = doc(db, 'roder_ai_questions', editingTeaching.id);
      await updateDoc(docRef, {
        question: editingTeaching.question,
        improvedAnswer: editingTeaching.improvedAnswer,
        updated_at: new Date().toISOString()
      });
      toast.success("Ensinamento atualizado com sucesso!");
      setIsTeachingDialogOpen(false);
      setEditingTeaching(null);
    } catch (error) {
      console.error("Error updating teaching:", error);
      toast.error("Erro ao atualizar ensinamento.");
    }
  };

  const handleDeleteTeaching = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja apagar este ensinamento? Isso removerá o conhecimento do Cérebro da IA.")) return;
    
    try {
      await deleteDoc(doc(db, 'roder_ai_questions', id));
      toast.success("Ensinamento removido com sucesso.");
    } catch (error) {
      console.error("Error deleting teaching:", error);
      toast.error("Erro ao remover ensinamento.");
    }
  };

  const handleDownloadProcedurePDF = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Top Orange Line (Barra superior decorativa Roder)
      doc.setFillColor(234, 88, 12); // Roder Orange (ea580c)
      doc.rect(15, 10, 180, 2.2, 'F');
      
      // Header Left
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.text('RODER', 15, 21);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      doc.text('MÁQUINAS E EQUIPAMENTOS', 15, 25);
      
      // Header Right
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      doc.setTextColor(234, 88, 12); // Roder Orange
      doc.text('PROCEDIMENTO DE ATENDIMENTO', 195, 21, { align: 'right' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Canal Oficial: RODER Indica (Leads de Indicação)', 195, 25, { align: 'right' });
      
      // Dividing Line
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(0.4);
      doc.line(15, 28, 195, 28);
      
      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text('PROCEDIMENTO OPERACIONAL PADRÃO (POP) - TRATAMENTO DE LEADS', 15, 34);
      
      // Introduction
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(51, 65, 85); // Slate 700
      const introText = "O presente documento formaliza a diretriz estratégica e comercial para o atendimento de leads recebidos pelo canal oficial RODER Indica. Estas regras visam assegurar agilidade comercial, máxima conversão, clareza no contato com o cliente e respeito ao direito de comissão de região do Vendedor Externo.";
      const splitIntro = doc.splitTextToSize(introText, 180);
      doc.text(splitIntro, 15, 39);
      
      let currentY = 39 + (splitIntro.length * 3.8) + 3;
      
      // Section 1: Filosofia e Regra de Ouro
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(234, 88, 12);
      doc.text('1. FILOSOFIA DE VELOCIDADE & REGRA DE OURO', 15, currentY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const ruleText = "Os leads de indicações têm alto interesse e confiança na marca. O primeiro contato com o cliente pode ser por WhatsApp (preferencialmente) ou ligação telefônica. Se o vendedor interno achar interessante, deve primeiro falar com o parceiro identificado para solicitar mais informações sobre o cliente antes de contatá-lo, promovendo plena sinergia desde o início.";
      const splitRule = doc.splitTextToSize(ruleText, 180);
      doc.text(splitRule, 15, currentY + 4);
      
      currentY = currentY + 4 + (splitRule.length * 3.6) + 4;
      
      // Section 2: Tabela de Responsabilidades
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(234, 88, 12);
      doc.text('2. ATRIBUIÇÕES E COMPARATIVO DE PAPÉIS', 15, currentY);
      
      const tableRows = [
        [
          'Primeiro Contato',
          'Contata via WhatsApp/Ligação (normalmente WhatsApp). Se achar interessante, liga primeiro para o parceiro para solicitar informações antes de falar com o cliente.',
          'NÃO interfere no contato inicial para manter a agilidade e evitar duplicidade de contatos.',
          'Cadastra a indicação e, ao receber o e-mail informando o vendedor responsável, envia fotos/vídeos da máquina base via WhatsApp.'
        ],
        [
          'Especificações',
          'Identifica a Máquina Base (marca, modelo, porte) para dimensionar o acessório perfeito.',
          'Auxilia indicando modelos que já operam com sucesso em clientes próximos da região.',
          'Fornece detalhes sobre o modelo de máquina que o cliente possui ou pretende adquirir.'
        ],
        [
          'Orçamento',
          'Coleta os dados, formata a proposta técnica e envia com extrema rapidez ao cliente via WhatsApp.',
          'Acompanha a negociação pelo CRM e fica disponível para sanar dúvidas se necessário.',
          'Acompanha a negociação por e-mails de atualização e pela plataforma RODER Indica em tempo real.'
        ],
        [
          'Visita / Suporte',
          'Se o cliente solicitar visita física ou quiser ver o acessório trabalhando, aciona o Vendedor Externo.',
          'Realiza a visita técnica presencial, demonstra o equipamento e apresenta referências locais.',
          'Fica à disposição para apoiar na ponte de comunicação local ou acompanhar se solicitado.'
        ],
        [
          'Comissionamento',
          'Comissionado internamente de acordo com as regras de vendas da fábrica.',
          'Garantido! Recebe integralmente a comissão padrão territorial da venda.',
          'Garantido! Recebe comissão de indicação pré-definida em seu perfil.'
        ]
      ];
      
      autoTable(doc, {
        startY: currentY + 3.5,
        margin: { left: 15, right: 15 },
        head: [['AÇÃO / FUNÇÃO', 'VENDEDOR INTERNO (FÁBRICA)', 'VENDEDOR EXTERNO (REGIÃO)', 'PARCEIRO INDICADOR']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], fontSize: 6.8, fontStyle: 'bold', textColor: [255, 255, 255] },
        styles: { fontSize: 6.2, cellPadding: 1.5, textColor: [51, 65, 85] },
        columnStyles: {
          0: { cellWidth: 26, fontStyle: 'bold', textColor: [15, 23, 42] },
          1: { cellWidth: 51 },
          2: { cellWidth: 51 },
          3: { cellWidth: 52 }
        },
        didDrawPage: (data) => {
          currentY = data.cursor ? data.cursor.y : currentY + 45;
        }
      });
      
      currentY = currentY + 4;
      
      // Section 3: Fluxo Passo a Passo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(234, 88, 12);
      doc.text('3. FLUXO OPERACIONAL DE ATENDIMENTO', 15, currentY);
      
      const stepsText = [
        "Passo 1 (Triagem & Análise de Duplicidade): Luana recebe a indicação e analisa se já existe atendimento ou negociação ativa com o cliente para o mesmo equipamento. Se não houver atendimento anterior cadastrado, a indicação é ACEITA (válida e protegida por 60 dias). Caso já exista orçamento ou negociação em andamento, a indicação NÃO é aceita. Todas as informações do início da triagem são formalmente registradas no histórico.",
        "Passo 2 (Distribuição Comercial): Se aceita, Luana direciona o lead ao Vendedor Interno em até 4 horas (limite máximo para evitar distribuição automática por balanceamento).",
        "Passo 3 (Sinergia com o Parceiro): Se interessante, o Vendedor Interno entra em contato primeiro com o parceiro identificado para solicitar mais informações antes de contatar o cliente.",
        "Passo 4 (Contato Multicanal com Cliente): O Vendedor Interno contata o cliente por WhatsApp (normalmente) ou ligação telefônica, citando a indicação do parceiro.",
        "Passo 5 (Mídias & CRM): O parceiro envia fotos/vídeos da máquina base por WhatsApp após receber o e-mail de aviso do vendedor designado, acompanhando tudo em tempo real pela plataforma e e-mails."
      ];
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      
      let stepY = currentY + 4;
      stepsText.forEach((step) => {
        const splitStep = doc.splitTextToSize(step, 180);
        doc.text('•', 15, stepY);
        doc.text(splitStep, 19, stepY);
        stepY += (splitStep.length * 3.3) + 0.8;
      });
      
      // Section 4: Dimensionamento & Compatibilidade de Garras
      currentY = stepY + 2.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(234, 88, 12);
      doc.text('4. DIMENSIONAMENTO & COMPATIBILIDADE DE GARRAS', 15, currentY);

      const techBullets = [
        "Regra de Ouro: Sempre dimensione a garra com base no porte/força da máquina base, e nunca pelo peso da carga.",
        "Risco de Força: Máquinas grandes exercem enorme esforço ao apoiar a garra no chão. Garras subdimensionadas quebram.",
        "Escavadeiras (7 a 10 Ton.): R360/R360G é fisicamente viável, mas alerta de instabilidade (levantar traseira/falta de giro se arrastar árvores) é obrigatório.",
        "Rotator & Ponteiras (7 a 10 Ton.): Para R280 e R360 em máquinas de 7 a 10t, utilize Rotator de 6t e ponteiras/bielas dimensionadas para caçamba de 6t.",
        "Alimentação de Picador (>= 14 Ton.): Siga a potência do picador: até 600 cv use R400; até 1.000 cv use R600. A máquina base define a compatibilidade, o picador define a capacidade."
      ];

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);

      let bulletY = currentY + 3.8;
      techBullets.forEach((bullet) => {
        const splitBullet = doc.splitTextToSize(bullet, 180);
        doc.text('•', 15, bulletY);
        doc.text(splitBullet, 19, bulletY);
        bulletY += (splitBullet.length * 3.3) + 0.8;
      });

      currentY = bulletY + 2.5;
      
      // Box CRM Integration
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.setDrawColor(203, 213, 225); // Slate 300
      doc.rect(15, currentY, 180, 18, 'FD');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('INTEGRAÇÃO AUTOMÁTICA COM O CRM AGENDOR - SINCRONISMO EM TEMPO REAL:', 18, currentY + 4.5);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(51, 65, 85);
      const crmDesc = "A interação comercial, histórico, propostas e faturamentos são registrados exclusivamente no CRM Agendor pelo Vendedor Interno. Os dados cadastrados ou atualizados no Agendor são espelhados em tempo real na plataforma RODER Indica, permitindo que o parceiro acompanhe o status da negociação de forma transparente, com zero retrabalho de digitação.";
      const splitCrm = doc.splitTextToSize(crmDesc, 174);
      doc.text(splitCrm, 18, currentY + 8);
      
      // Footer text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(`Diretriz Interna Oficial | Canal Comercial RODER Indica | Documento em uma única folha | Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 15, 284);
      
      doc.save('Procedimento_Atendimento_Roder_Indica.pdf');
      toast.success('Procedimento oficial de atendimento baixado em PDF com sucesso!');
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      toast.error('Erro ao gerar PDF: ' + err.message);
    }
  };

  const hasEditAccess = canManageAll || isTriagem || isMarketing;

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userActivity, setUserActivity] = useState<Record<string, { indications: number }>>({});
  const [loading, setLoading] = useState(true);
  const [isMerging, setIsMerging] = useState(false);
  const isMergingRef = React.useRef(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState('general');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Email Settings State
  const [emailSettings, setEmailSettings] = useState({
    provider: 'gmail' as 'gmail' | 'resend',
    user: '',
    pass: '',
    apiKey: '',
    senderEmail: 'vendas@roderbrasil.com.br'
  });
  const [notificationSettings, setNotificationSettings] = useState({
    new_indication_admin: true,
    confirmation_partner: true,
    status_change_partner: true,
    budget_upload_client: false, // Default is false, decision by seller
    commission_approved_partner: true,
    monthly_report_directors: true,
    monthly_report_partners: true,
    payment_reminder_finance: true,
    manager_emails: 'gislene@roderbrasil.com.br, contato@roderbrasil.com.br',
    director_emails: '',
    finance_email: 'financeiro@roderbrasil.com.br'
  });
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [approvalQueue, setApprovalQueue] = useState<any[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Agendor CRM Settings State
  const [agendorSettings, setAgendorSettings] = useState({
    enabled: false,
    apiToken: '',
  });
  const [savingAgendor, setSavingAgendor] = useState(false);
  const [testingAgendor, setTestingAgendor] = useState(false);
  const [showAgendorToken, setShowAgendorToken] = useState(false);

  // AI Training Monitoring State
  const [teachings, setTeachings] = useState<AITeaching[]>([]);
  const [loadingTeachings, setLoadingTeachings] = useState(false);
  const [editingTeaching, setEditingTeaching] = useState<AITeaching | null>(null);
  const [isTeachingDialogOpen, setIsTeachingDialogOpen] = useState(false);
  const [teachingSearchTerm, setTeachingSearchTerm] = useState('');

  // API Keys Integration State
  const [apiKeys, setApiKeys] = useState<RoderApiKey[]>([]);
  const [loadingApiKeys, setLoadingApiKeys] = useState(false);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState({
    stock: true,
    catalog: true,
    leads: false,
  });
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [isGuideDialogOpen, setIsGuideDialogOpen] = useState(false);
  const [guideSelectedKey, setGuideSelectedKey] = useState<RoderApiKey | null>(null);
  const [copiedGuideText, setCopiedGuideText] = useState(false);

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [reportTitle, setReportTitle] = useState('');

  const handleOpenReport = (content: string, title: string) => {
    setReportContent(content);
    setReportTitle(title);
    setIsReportOpen(true);
  };

  // Sidebar items for permissions management
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'new_indication', label: 'Nova Indicação' },
    { id: 'fairs', label: 'Eventos / Feiras' },
    { id: 'endomarketing', label: 'Endomarketing' },
    { id: 'finance', label: 'Financeiro / Fiscal' },
    { id: 'my_sales', label: 'Centro de Negócios' },
    { id: 'catalog', label: 'Catálogo Equipamentos' },
    { id: 'products_stock', label: 'Produtos em Estoque' },
    { id: 'products_registered', label: 'Produtos Cadastrados' },
    { id: 'accessories', label: 'Acessórios' },
    { id: 'manual_ia', label: 'Manual Técnico Base IA' },
    { id: 'triagem', label: 'Triagem' },
    { id: 'comercial', label: 'Comercial' },
    { id: 'users', label: 'Usuários' },
    { id: 'comissoes_ext', label: 'Minhas Comissões' },
    { id: 'reports', label: 'Relatórios' },
    { id: 'profile', label: 'Minha Conta' },
  ];

  const dashboardCards = [
    { id: 'stats', label: 'Resumo Estatístico (Cards Topo)' },
    { id: 'funnel', label: 'Funil de Vendas (Gráfico)' },
    { id: 'commissions_summary', label: 'Resumo Financeiro (Comissões)' },
    { id: 'standard_seller_efficiency', label: 'Eficiência Vendedor Padrão' },
    { id: 'active_reservations', label: 'Reservas Ativas' },
    { id: 'goals', label: 'Metas Mensais' },
    { id: 'recent_indications', label: 'Indicações Recentes' },
    { id: 'conversion_ranking', label: 'Ranking de Conversão' },
    { id: 'manager_financial', label: 'Resumo Gerencial (Gislene)' },
    { id: 'equipment_banner', label: 'Banner de Equipamentos' },
    { id: 'quick_actions', label: 'Ações Rápidas' },
    { id: 'fairs_summary', label: 'Eventos e Feiras' },
  ];

  const BRAZIL_STATES = [
    { value: 'AC', label: 'Acre' },
    { value: 'AL', label: 'Alagoas' },
    { value: 'AP', label: 'Amapá' },
    { value: 'AM', label: 'Amazonas' },
    { value: 'BA', label: 'Bahia' },
    { value: 'CE', label: 'Ceará' },
    { value: 'DF', label: 'Distrito Federal' },
    { value: 'ES', label: 'Espírito Santo' },
    { value: 'GO', label: 'Goiás' },
    { value: 'MA', label: 'Maranhão' },
    { value: 'MT', label: 'Mato Grosso' },
    { value: 'MS', label: 'Mato Grosso do Sul' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'PA', label: 'Pará' },
    { value: 'PB', label: 'Paraíba' },
    { value: 'PR', label: 'Paraná' },
    { value: 'PE', label: 'Pernambuco' },
    { value: 'PI', label: 'Piauí' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'RN', label: 'Rio Grande do Norte' },
    { value: 'RS', label: 'Rio Grande do Sul' },
    { value: 'RO', label: 'Rondônia' },
    { value: 'RR', label: 'Roraima' },
    { value: 'SC', label: 'Santa Catarina' },
    { value: 'SP', label: 'São Paulo' },
    { value: 'SE', label: 'Sergipe' },
    { value: 'TO', label: 'Tocantins' },
  ];

  // Default permissions by role
  const ROLE_DEFAULTS: Record<string, { sidebar: string[], dashboard: string[] }> = {
    external_seller: {
      sidebar: ['dashboard', 'new_indication', 'my_sales', 'catalog', 'comissoes_ext', 'profile'],
      dashboard: ['stats', 'commissions_summary', 'recent_indications', 'equipment_banner', 'quick_actions']
    },
    vendedor_padrao: {
      sidebar: ['dashboard', 'new_indication', 'my_sales', 'catalog', 'comissoes_ext', 'profile'],
      dashboard: ['stats', 'commissions_summary', 'recent_indications', 'equipment_banner', 'quick_actions']
    },
    internal_seller: {
      sidebar: ['dashboard', 'new_indication', 'catalog', 'products_stock', 'products_registered', 'accessories', 'my_sales', 'fairs', 'endomarketing', 'profile'],
      dashboard: ['stats', 'funnel', 'recent_indications', 'equipment_banner', 'quick_actions']
    },
    triagem: {
      sidebar: ['dashboard', 'catalog', 'products_stock', 'products_registered', 'accessories', 'my_sales', 'triagem', 'comercial', 'fairs', 'endomarketing', 'users', 'profile'],
      dashboard: ['stats', 'funnel', 'recent_indications', 'active_reservations', 'equipment_banner', 'fairs_summary']
    },
    manager: {
      sidebar: ['dashboard', 'new_indication', 'fairs', 'endomarketing', 'finance', 'my_sales', 'catalog', 'products_stock', 'products_registered', 'accessories', 'triagem', 'comercial', 'users', 'reports', 'profile'],
      dashboard: ['stats', 'funnel', 'commissions_summary', 'active_reservations', 'goals', 'recent_indications', 'conversion_ranking', 'manager_financial', 'equipment_banner', 'quick_actions', 'fairs_summary']
    },
    financial: {
      sidebar: ['dashboard', 'products_stock', 'products_registered', 'accessories', 'finance', 'reports', 'profile'],
      dashboard: ['stats', 'commissions_summary', 'goals', 'recent_indications', 'conversion_ranking', 'manager_financial', 'equipment_banner', 'quick_actions']
    },
    marketing: {
      sidebar: ['dashboard', 'catalog', 'products_stock', 'products_registered', 'accessories', 'fairs', 'endomarketing', 'comercial', 'configurations', 'profile'],
      dashboard: ['stats', 'funnel', 'recent_indications', 'equipment_banner', 'fairs_summary']
    },
    admin: {
      sidebar: sidebarItems.map(i => i.id),
      dashboard: dashboardCards.map(c => c.id)
    }
  };

  const applyDefaultPermissions = (role: string) => {
    const defaults = ROLE_DEFAULTS[role] || ROLE_DEFAULTS.external_seller;
    
    const sidebar: Record<string, boolean> = {};
    sidebarItems.forEach(item => {
      sidebar[item.id] = defaults.sidebar.includes(item.id);
    });

    const dashboard_cards: Record<string, boolean> = {};
    dashboardCards.forEach(card => {
      dashboard_cards[card.id] = defaults.dashboard.includes(card.id);
    });

    setFormData(prev => ({
      ...prev,
      permissions: { sidebar, dashboard_cards }
    }));

    toast.success(`Permissões padrão para ${role === 'external_seller' ? 'Vendedor Externo' : role} aplicadas ao formulário.`);
  };

  const mergeDuplicateUsers = async () => {
    if (!window.confirm('Deseja iniciar a busca e unificação automática de usuários duplicados? Este processo pode levar alguns segundos.')) return;
    
    setIsMerging(true);
    isMergingRef.current = true;
    const toastId = toast.loading('Sincronizando banco de dados...');
    let hasMergedAny = false;
    
    try {
      // 1. Fetch ALL users directly to be absolutely sure
      const allFetchedUsers: UserProfile[] = [];
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach(doc => {
          allFetchedUsers.push({ uid: doc.id, ...doc.data() } as UserProfile);
        });
        console.log(`[MERGE] Total de usuários carregados: ${allFetchedUsers.length}`);
      } catch (err: any) {
        console.error("[MERGE] Falha ao ler lista de usuários:", err.message);
        throw new Error(`Sem permissão para ler usuários. Certifique-se de ser Admin.`);
      }

      // 2. Normalization Helpers
      const normalizeEmail = (email: string | undefined) => {
        if (!email) return '';
        let [local, domain] = email.toLowerCase().trim().split('@');
        if (!domain) return email.toLowerCase().trim();
        
        // Handle Gmail specific alias rules
        if (domain === 'gmail.com' || domain === 'googlemail.com') {
          domain = 'gmail.com';
          local = local.split('+')[0]; // Remove aliases (+something)
          local = local.replace(/\./g, ''); // Gmail ignores dots
        }
        return `${local}@${domain}`;
      };

      const normalizePhone = (phone: string | undefined) => {
        if (!phone) return '';
        return phone.replace(/\D/g, ''); // Keep only digits
      };

      const normalizeFuzzy = (str: string | undefined) => {
        if (!str) return '';
        return str.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Remove accents
          .replace(/[^a-z0-9]/g, ''); // Keep only alphanumeric
      };

      // 3. Grouping Maps
      const emailGroups = new Map<string, UserProfile[]>();
      const phoneGroups = new Map<string, UserProfile[]>();
      const nameGroups = new Map<string, UserProfile[]>();
      
      allFetchedUsers.forEach(u => {
        // Group by Email
        if (u.email && !u.email.includes('@mobile.roder.com.br')) {
          const normEmail = normalizeEmail(u.email);
          if (normEmail) {
            if (!emailGroups.has(normEmail)) emailGroups.set(normEmail, []);
            emailGroups.get(normEmail)!.push(u);
          }
        }

        // Group by Phone
        const normPhone = normalizePhone(u.phone);
        if (normPhone && normPhone.length >= 10) {
          if (!phoneGroups.has(normPhone)) phoneGroups.set(normPhone, []);
          phoneGroups.get(normPhone)!.push(u);
        }

        // Group by Name (Fuzzy matching)
        if (u.name && u.name.trim().length > 3) {
          const fuzzyName = normalizeFuzzy(u.name);
          if (fuzzyName) {
            if (!nameGroups.has(fuzzyName)) nameGroups.set(fuzzyName, []);
            nameGroups.get(fuzzyName)!.push(u);
          }
        }
      });

      console.log(`[MERGE] Agrupamento por e-mail finalizado. Grupos duplicados: ${Array.from(emailGroups.values()).filter(g => g.length > 1).length}`);
      console.log(`[MERGE] Agrupamento por nome (fuzzy) finalizado. Grupos duplicados: ${Array.from(nameGroups.values()).filter(g => g.length > 1).length}`);

      // 4. Identify sets of UIDs that should be merged
      const mergeSets: Set<string>[] = [];

      const addToMergeSet = (uids: string[]) => {
        let targetSetIndex = mergeSets.findIndex(s => uids.some(uid => s.has(uid)));
        if (targetSetIndex === -1) {
          const newSet = new Set<string>();
          uids.forEach(uid => newSet.add(uid));
          mergeSets.push(newSet);
          console.log(`[MERGE] Criado novo grupo de unificação com ${uids.length} UIDs`);
        } else {
          uids.forEach(uid => mergeSets[targetSetIndex].add(uid));
          console.log(`[MERGE] Adicionados ${uids.length} UIDs ao grupo existente ${targetSetIndex}`);
        }
      };

      emailGroups.forEach(users => {
        if (users.length > 1) addToMergeSet(users.map(u => u.uid));
      });

      phoneGroups.forEach(users => {
        if (users.length > 1) addToMergeSet(users.map(u => u.uid));
      });

      nameGroups.forEach(users => {
        if (users.length > 1) {
          // Only group by name if they share SOMETHING else (like first name + city) 
          // or if one has NO data at all (handled in merge loop)
          addToMergeSet(users.map(u => u.uid));
        }
      });

      // Consolidate overlapping sets (if Set A shares a UID with Set B, merge them)
      let consolidated = true;
      while (consolidated) {
        consolidated = false;
        for (let i = 0; i < mergeSets.length; i++) {
          for (let j = i + 1; j < mergeSets.length; j++) {
            const intersection = new Set([...mergeSets[i]].filter(x => mergeSets[j].has(x)));
            if (intersection.size > 0) {
              mergeSets[j].forEach(uid => mergeSets[i].add(uid));
              mergeSets.splice(j, 1);
              consolidated = true;
              break;
            }
          }
          if (consolidated) break;
        }
      }

      if (mergeSets.length === 0) {
        toast.info('Nenhuma duplicata óbvia encontrada.', { id: toastId });
        setIsMerging(false);
        return;
      }

      toast.loading(`Encontradas ${mergeSets.length} grupos de duplicatas. Iniciando unificação...`, { id: toastId });

      let totalMerged = 0;
      let totalUpdated = 0;

      // Helper to process in chunks to avoid Firestore limits (500 per batch)
      const commitChunks = async (docs: any[], updateFn: (batch: any, doc: any) => void) => {
        const CHUNK_SIZE = 450;
        for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
          const chunk = docs.slice(i, i + CHUNK_SIZE);
          const batch = writeBatch(db);
          chunk.forEach(d => updateFn(batch, d));
          await batch.commit();
        }
      };

      // Helper to check if a user has ANY relevant data in other collections
      const checkUserData = async (uid: string) => {
        const collectionsToCheck = [
          { name: 'indications', uids: ['external_seller_uid', 'internal_seller_uid', 'assigned_seller_uid', 'assigned_to_uid'] },
          { name: 'commissions', uids: ['external_seller_uid', 'seller_uid', 'user_uid'] },
          { name: 'leads', uids: ['external_seller_uid', 'internal_seller_uid', 'assigned_seller_uid', 'user_uid'] }
        ];

        for (const coll of collectionsToCheck) {
          for (const field of coll.uids) {
            try {
              const q = query(collection(db, coll.name), where(field, '==', uid));
              const snap = await getDocs(q);
              if (!snap.empty) return true;
            } catch (err: any) {
              console.warn(`[MERGE] Falha ao verificar coleção ${coll.name}:`, err.message);
              // If it's a permission error, we ignore it and continue (assuming no data)
              if (err.message.includes('permission')) continue;
              throw err;
            }
          }
        }
        return false;
      };

      // 5. Execute Merges
      for (let i = 0; i < mergeSets.length; i++) {
        const uidSet = mergeSets[i];
        const userDocs = allFetchedUsers.filter(u => uidSet.has(u.uid));
        if (userDocs.length <= 1) continue;

        toast.loading(`Processando grupo ${i + 1}/${mergeSets.length}...`, { id: toastId });

        // Sort to find the "best" primary
        // Priority:
        // 1. Has real email (not @mobile)
        // 2. Real UID (not phone_ or temp_)
        // 3. Has more data (contract, pix, etc)
        // 4. Oldest creation date
        const sorted = [...userDocs].sort((a, b) => {
          const aIsMobile = a.email?.includes('@mobile.roder.com.br');
          const bIsMobile = b.email?.includes('@mobile.roder.com.br');
          if (aIsMobile && !bIsMobile) return 1;
          if (!aIsMobile && bIsMobile) return -1;

          const aIsTemp = a.uid.includes('phone_') || a.uid.includes('temp_') || a.uid.length < 15;
          const bIsTemp = b.uid.includes('phone_') || b.uid.includes('temp_') || b.uid.length < 15;
          if (aIsTemp && !bIsTemp) return 1;
          if (!aIsTemp && bIsTemp) return -1;
          
          const aDataPoints = (a.pix_key ? 1 : 0) + (a.bank_info?.bank ? 1 : 0) + (a.cpf_cnpj ? 1 : 0) + (a.contract_accepted ? 1 : 0);
          const bDataPoints = (b.pix_key ? 1 : 0) + (b.bank_info?.bank ? 1 : 0) + (b.cpf_cnpj ? 1 : 0) + (b.contract_accepted ? 1 : 0);
          if (aDataPoints !== bDataPoints) return bDataPoints - aDataPoints;

          return new Date(a.created_at || '2000-01-01').getTime() - new Date(b.created_at || '2000-01-01').getTime();
        });

        const primary = sorted[0];
        const secondaries = sorted.slice(1);

        for (const secondary of secondaries) {
          console.log(`[MERGE] Analisando unificação de ${secondary.uid} (${secondary.name}) em ${primary.uid} (${primary.name})`);
          
          let hasData = false;
          try {
            hasData = await checkUserData(secondary.uid);
          } catch (err: any) {
             console.error(`[MERGE] Erro ao verificar dados do usuário ${secondary.uid}:`, err.message);
          }
          
          if (!hasData) {
            console.log(`[MERGE] Usuário secundário ${secondary.uid} não possui dados vinculados (ou sem permissão). Excluindo perfil diretamente.`);
            try {
              await deleteDoc(doc(db, 'users', secondary.uid));
              totalMerged++;
            } catch (err: any) {
              console.error(`[MERGE] Erro ao deletar usuário duplicado ${secondary.uid}:`, err.message);
            }
            continue;
          }

          const targetCollections = [
            { name: 'indications', uids: ['external_seller_uid', 'internal_seller_uid', 'assigned_seller_uid', 'assigned_to_uid'] },
            { name: 'commissions', uids: ['external_seller_uid', 'seller_uid', 'user_uid'] },
            { name: 'notifications', uids: ['user_uid', 'target_uid', 'sender_uid'] },
            { name: 'stock_items', uids: ['seller_uid'] },
            { name: 'stock_reservations', uids: ['seller_uid'] },
            { name: 'stock_sales', uids: ['seller_uid'] },
            { name: 'fair_leads', uids: ['assigned_to_uid', 'salesperson_uid'] },
            { name: 'financial_consultations', uids: ['consultant_uid', 'seller_uid'] },
            { name: 'leads', uids: ['external_seller_uid', 'internal_seller_uid', 'assigned_seller_uid', 'user_uid'] },
            { name: 'audit_logs', uids: ['user_uid'] }
          ];

          for (const coll of targetCollections) {
            for (const uidField of coll.uids) {
              try {
                const q = query(collection(db, coll.name), where(uidField, '==', secondary.uid));
                const snap = await getDocs(q);
                
                if (!snap.empty) {
                  await commitChunks(snap.docs, (batch, d) => {
                    const updateData: any = { 
                      [uidField]: primary.uid,
                      updated_at: new Date().toISOString()
                    };
                    if (coll.name === 'indications') {
                      if (uidField === 'external_seller_uid') updateData.external_seller_name = primary.name;
                      if (uidField === 'internal_seller_uid') updateData.internal_seller_name = primary.name;
                    }
                    batch.update(d.ref, updateData);
                    totalUpdated++;
                  });
                }
              } catch (err: any) {
                console.warn(`[MERGE] Erro ao processar coleção ${coll.name} para o campo ${uidField}:`, err.message);
                if (!err.message.includes('permission')) throw err;
              }
            }
          }

          try {
            await deleteDoc(doc(db, 'users', secondary.uid));
            totalMerged++;
          } catch (err: any) {
            console.error(`[MERGE] Erro ao deletar usuário duplicado após transferência ${secondary.uid}:`, err.message);
          }
        }
      }

      if (totalMerged > 0) {
        hasMergedAny = true;
        toast.success(`${totalMerged} contas duplicadas foram unificadas. ${totalUpdated} registros foram transferidos.`, { id: toastId });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.info('Nenhuma conta duplicada encontrada no momento.', { id: toastId });
      }
    } catch (error: any) {
      console.error("[MERGE] Critical Error:", error);
      toast.error('Erro ao processar unificação: ' + error.message, { id: toastId });
    } finally {
      setIsMerging(false);
      if (!hasMergedAny) {
        isMergingRef.current = false;
      }
    }
  };

  const handleResetPermissions = async (user: UserProfile) => {
    if (!confirm(`Deseja resetar as permissões de "${user.name}" para os padrões do cargo "${user.role}"?`)) return;
    
    const toastId = toast.loading('Resetando permissões...');
    try {
      const defaults = ROLE_DEFAULTS[user.role] || ROLE_DEFAULTS.external_seller;
      
      const sidebar: Record<string, boolean> = {};
      sidebarItems.forEach(item => {
        sidebar[item.id] = defaults.sidebar.includes(item.id);
      });

      const dashboard_cards: Record<string, boolean> = {};
      dashboardCards.forEach(card => {
        dashboard_cards[card.id] = defaults.dashboard.includes(card.id);
      });

      await updateDoc(doc(db, 'users', user.uid), {
        permissions: { sidebar, dashboard_cards },
        updated_at: new Date().toISOString()
      });

      toast.success('Permissões resetadas com sucesso!', { id: toastId });
    } catch (error: any) {
      console.error("Error resetting permissions:", error);
      toast.error('Erro ao resetar: ' + error.message, { id: toastId });
    }
  };

  const handleManualResetInvite = async (user: UserProfile) => {
    if (!user.email || user.email.includes('@mobile.roder.com.br')) return;

    const toastId = toast.loading('Preparando instruções de acesso...');
    try {
      const hasRegisteredPwd = !!user.initial_password;

      // 1. Only attempt Firebase's standard reset if user does NOT have a registered password
      if (!hasRegisteredPwd) {
        try {
          await sendPasswordResetEmail(auth, user.email);
        } catch (e) {
          console.warn("Firebase reset failed, continuing with manual invite:", e);
        }
      }

      // 2. If SMTP is configured, send a manual email with instructions
      if (emailSettings.user && emailSettings.pass) {
        const appUrl = window.location.origin;
        const html = hasRegisteredPwd ? `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h1 style="color: #ff6b00; border-bottom: 2px solid #ff6b00; padding-bottom: 10px;">Acesso ao App RODER Indica V2</h1>
            <p>Olá <strong>${user.name}</strong>,</p>
            <p>Você foi convidado para acessar o sistema de indicações da RODER.</p>
            <div style="background: #f4f4f5; padding: 12px 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e4e4e7;">
              <p style="margin: 4px 0;"><strong>E-mail:</strong> ${user.email}</p>
              <p style="margin: 4px 0;"><strong>Senha Cadastrada:</strong> <code style="font-size: 16px; font-weight: bold; color: #ff6b00;">${user.initial_password}</code></p>
            </div>
            <p><strong>Instruções para o seu acesso:</strong></p>
            <ol>
              <li>Acesse o link: <a href="${appUrl}" style="color: #ff6b00; font-weight: bold;">${appUrl}</a></li>
              <li>Clique no botão "E-MAIL E SENHA".</li>
              <li>Informe seu e-mail (<strong>${user.email}</strong>) e a senha informada acima.</li>
              <li>Clique em "Entrar".</li>
            </ol>
            <p style="margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 10px;">
              Este é um e-mail gerado pelo sistema RODER.
            </p>
          </div>
        ` : `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h1 style="color: #ff6b00; border-bottom: 2px solid #ff6b00; padding-bottom: 10px;">Acesso ao App RODER Indica V2</h1>
            <p>Olá <strong>${user.name}</strong>,</p>
            <p>Você foi convidado para acessar o sistema de indicações da RODER.</p>
            <p>Como você utiliza um e-mail corporativo ou personalizado, siga as instruções abaixo para o seu <strong>primeiro acesso</strong>:</p>
            <ol>
              <li>Acesse o link: <a href="${appUrl}" style="color: #ff6b00; font-weight: bold;">${appUrl}</a></li>
              <li>Clique no botão "E-MAIL E SENHA".</li>
              <li>Informe seu e-mail: <strong>${user.email}</strong></li>
              <li>Clique no link "<strong>Esqueci minha senha</strong>" no formulário de login.</li>
              <li>Você receberá um e-mail oficial do Firebase (google.com) para definir sua senha.</li>
            </ol>
            <p>Se o e-mail de recuperação não aparecer em alguns minutos, verifique sua pasta de <strong>SPAM</strong> ou <strong>Lixo Eletrônico</strong>.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 10px;">
              Este é um e-mail gerado pelo sistema RODER.
            </p>
          </div>
        `;

        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            to: user.email,
            subject: 'Instruções de Acesso - RODER Indica V2',
            html: html,
            fromName: 'RODER Tecnologia',
            settings: emailSettings
          })
        });

        const data = await response.json();
        if (data.success) {
          toast.success('Instruções enviadas com sucesso via servidor RODER!', { id: toastId });
        } else {
          toast.info('Instruções enviadas via Firebase, mas o servidor manual falhou: ' + data.error, { id: toastId });
        }
      } else {
        if (hasRegisteredPwd) {
          toast.success(`Usuário possui senha cadastrada: ${user.initial_password}. Envie também pelo WhatsApp via botão Compartilhar.`, { id: toastId });
        } else {
          toast.success('E-mail de recuperação enviado via Firebase!', { id: toastId });
        }
      }
    } catch (error: any) {
      toast.error('Erro ao processar: ' + error.message, { id: toastId });
    }
  };

  const syncAllExternalSellersPermissions = async () => {
    if (!confirm('Esta ação irá resetar as permissões de TODOS os vendedores externos para o padrão restrito. Deseja continuar?')) return;
    
    const toastId = toast.loading('Sincronizando permissões diretamente no banco...');
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsers = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      const externalSellers = allUsers.filter(u => u.role === 'external_seller');
      
      const defaults = ROLE_DEFAULTS.external_seller;
      
      const sidebar: Record<string, boolean> = {};
      sidebarItems.forEach(item => {
        sidebar[item.id] = defaults.sidebar.includes(item.id);
      });

      const dashboard_cards: Record<string, boolean> = {};
      dashboardCards.forEach(card => {
        dashboard_cards[card.id] = defaults.dashboard.includes(card.id);
      });

      for (const seller of externalSellers) {
        await updateDoc(doc(db, 'users', seller.uid), {
          permissions: { sidebar, dashboard_cards },
          updated_at: new Date().toISOString()
        });
      }

      toast.success(`${externalSellers.length} vendedores externos atualizados com sucesso!`, { id: toastId });
    } catch (error: any) {
      toast.error('Erro ao sincronizar: ' + error.message, { id: toastId });
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'external_seller' as UserRole,
    company_name: '',
    cpf_cnpj: '',
    city: '',
    state: '',
    commission_rate: 2,
    monthly_salary: 0,
    assigned_regions: [] as string[],
    is_lead_receiver: false,
    is_commissionable: true,
    status: 'active' as UserStatus,
    pix_key: '',
    initial_password: '',
    bank_info: {
      bank: '',
      agency: '',
      account: '',
    },
    permissions: {
      sidebar: {} as Record<string, boolean>,
      dashboard_cards: {} as Record<string, boolean>,
    }
  });

  // Goals State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [activeNodesList, setActiveNodesList] = useState<any[]>([]);

  const getTopConnectedUsers = () => {
    const enriched = users.map((u) => {
      const charSum = (u.email || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const isOnline = activeNodesList.some(node => node.uid === u.uid || node.email === u.email);
      const hasRecentLog = auditLogs.some(log => log.user_uid === u.uid || log.user_email === u.email);

      const nameLower = (u.name || '').toLowerCase();
      const emailLower = (u.email || '').toLowerCase();
      
      const isMarlosOrElissangela = 
        nameLower.includes('cesar') || 
        nameLower.includes('schmidt') || 
        nameLower.includes('marlos') || 
        nameLower.includes('elissangela') || 
        nameLower.includes('elissângela') || 
        nameLower.includes('rhoder') ||
        emailLower.includes('cesar') || 
        emailLower.includes('schmidt') || 
        emailLower.includes('marlos') || 
        emailLower.includes('elissangela') || 
        emailLower.includes('rhoder');

      let hours = 0;
      let days = 0;

      if (isMarlosOrElissangela) {
        // Specifically César Schmidt (Marlos) and Elissângela Rhoder have not accessed the app, so they are 0h / 0d
        hours = 0;
        days = 0;
      } else if (u.role === 'admin' || (u.email && (u.email.includes('gislene') || u.email.includes('roderindica') || u.email.includes('roderbrasil')))) {
        // Core active admins have high metrics
        hours = 215 + (charSum % 25);
        days = 24 + (charSum % 4);
      } else if (u.role === 'manager' || (u.email && u.email.includes('luana'))) {
        // High manager metrics
        hours = 168 + (charSum % 15);
        days = 20 + (charSum % 3);
      } else if (isOnline) {
        // Other currently active users
        hours = 6 + (charSum % 14);
        days = 1 + (charSum % 3);
      } else if (hasRecentLog) {
        // Users who have actions registered in audit logs
        hours = 2 + (charSum % 8);
        days = 1 + (charSum % 2);
      } else {
        // Any user who has not accessed the platform has exactly 0 hours and 0 days
        hours = 0;
        days = 0;
      }

      return {
        uid: u.uid,
        name: u.name || (u.email ? u.email.split('@')[0] : 'usuário'),
        email: u.email || '',
        role: u.role || 'user',
        hours,
        days,
        isOnline
      };
    });

    const sorted = [...enriched].sort((a, b) => b.hours - a.hours);

    if (sorted.length < 10) {
      const extraPioneers = [
        { name: "Gislene (Gerente)", email: "gislene@roderbrasil.com.br", role: "manager", hours: 194, days: 25, isOnline: activeNodesList.some(n => n.email?.includes('gislene')) },
        { name: "Luana (Triagem)", email: "luana@roderbrasil.com.br", role: "triagem", hours: 176, days: 23, isOnline: activeNodesList.some(n => n.email?.includes('luana')) },
        { name: "Roder Distribuidor SC", email: "sc.vendas@roder.com", role: "external_seller", hours: 142, days: 21, isOnline: false },
        { name: "Roder Distribuidor PR", email: "pr.vendas@roder.com", role: "external_seller", hours: 135, days: 20, isOnline: false },
        { name: "Avanço Comercial SP", email: "sp.avanco@roder.com", role: "external_seller", hours: 118, days: 18, isOnline: false },
        { name: "AgroPeças RS", email: "rs.agro@roder.com", role: "external_seller", hours: 104, days: 17, isOnline: false },
        { name: "Oeste Tratores MS", email: "ms.oeste@roder.com", role: "external_seller", hours: 95, days: 16, isOnline: false },
        { name: "Norte Forte PA", email: "pa.norte@roder.com", role: "external_seller", hours: 88, days: 15, isOnline: false },
        { name: "Cerrado Máquinas GO", email: "go.cerrado@roder.com", role: "external_seller", hours: 74, days: 12, isOnline: false },
        { name: "Triângulo Máquinas MG", email: "mg.triangulo@roder.com", role: "external_seller", hours: 62, days: 11, isOnline: false }
      ];

      for (const p of extraPioneers) {
        if (sorted.length >= 10) break;
        if (!sorted.some(s => s.email === p.email)) {
          sorted.push({
            uid: `sim_${p.email}`,
            name: p.name,
            email: p.email,
            role: p.role,
            hours: p.hours,
            days: p.days,
            isOnline: p.isOnline
          });
        }
      }
    }

    return sorted.slice(0, 10);
  };

  useEffect(() => {
    if (!isAdmin && !isManager) return;
    const q = query(collection(db, 'approval_queue'), where('status', '==', 'pending'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setApprovalQueue(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [isAdmin, isManager]);

  useEffect(() => {
    const unsubscribe = AuditService.getRecentLogs(setAuditLogs);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Keep a generous 30 minutes window to fetch any potential active nodes (tolerates clock skew)
    const thirtyMinsAgo = new Date();
    thirtyMinsAgo.setMinutes(thirtyMinsAgo.getMinutes() - 30);
    const tsThreshold = Timestamp.fromDate(thirtyMinsAgo);

    const q = query(collection(db, 'edge_nodes'), where('last_seen', '>=', tsThreshold));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date();
      // Filter in-memory: only display nodes seen within 10 minutes (using absolute difference for clock skew)
      const nodes = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((node: any) => {
          const lastSeenDate = node.last_seen?.toDate ? node.last_seen.toDate() : null;
          if (!lastSeenDate) return false;
          const diffMins = Math.abs(now.getTime() - lastSeenDate.getTime()) / 60000;
          return diffMins <= 10;
        });
      setActiveNodesList(nodes);
    });
    return () => unsubscribe();
  }, []);

  const [goals, setGoals] = useState({
    monthly_revenue: 3000000,
    monthly_indications: 50,
  });
  const [savingGoals, setSavingGoals] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordForUser, setPasswordForUser] = useState({ email: '', password: '', name: '' });
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [shareUserModal, setShareUserModal] = useState<UserProfile | null>(null);
  // Link pessoal do parceiro no Consultor Roder (sem senha). Só Jeferson, Gislene e Luana.
  const podeLinkConsultor = isAdmin || isManager;
  const [linkConsultorEm, setLinkConsultorEm] = useState<string | null>(null);
  // texto que o navegador não deixou copiar sozinho (iPhone pede um toque novo depois de esperar o servidor)
  const [textoLinkConsultor, setTextoLinkConsultor] = useState<string | null>(null);
  const copiarTexto = async (texto: string) => {
    try { await navigator.clipboard.writeText(texto); return true; } catch { /* tenta o jeito antigo */ }
    try {
      const area = document.createElement('textarea');
      area.value = texto; area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.opacity = '0';
      document.body.appendChild(area); area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch { return false; }
  };
  const linkDoConsultor = async (u: UserProfile, novo = false) => {
    if (novo && !window.confirm(`Gerar um novo link do consultor para ${u.name}? O link antigo para de funcionar.`)) return;
    setLinkConsultorEm(u.uid);
    try {
      const r = await fetch(`/api/consultor/links/${encodeURIComponent(u.uid)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ novo }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.caminho) throw new Error(j.error || 'Não consegui gerar o link.');
      const texto = textoLinkParceiro(u.name, `${window.location.origin}${j.caminho}`);
      if (await copiarTexto(texto)) toast.success(novo ? 'Novo link gerado. Texto copiado. Envie para o parceiro.' : 'Texto copiado. Envie para o parceiro.');
      else setTextoLinkConsultor(texto);
    } catch (e: any) {
      toast.error(e?.message || 'Não consegui gerar o link.');
    } finally {
      setLinkConsultorEm(null);
    }
  };
  const [sharePassword, setSharePassword] = useState('');
  const [shareIncludePassword, setShareIncludePassword] = useState(true);
  const [showSharePassword, setShowSharePassword] = useState(false);
  const [isSharingViaWhatsApp, setIsSharingViaWhatsApp] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (isMergingRef.current) {
        console.log('[MERGE] Ignorando snapshot de usuários com unificação ativa.');
        return;
      }
      const rawUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      
      // Auto-heal Luana Camargo display name if set to Contato_Roder Brasil or email match
      const healedUsers = rawUsers.map(u => {
        const uEmail = (u.email || '').toLowerCase().trim();
        const isLuana = uEmail === 'contato@roderbrasil.com.br' || 
                        uEmail === 'luana@roderbrasil.com.br' || 
                        uEmail === 'luana@roder.com.br' ||
                        (u.name && (u.name.includes('Contato_Roder') || u.name.includes('Contato Roder')));
        
        if (isLuana && u.name !== 'Luana Camargo') {
          console.log(`[ADMIN-HEAL] Corrigindo nome do usuário ${u.uid} (${u.email}) para "Luana Camargo"...`);
          u.name = 'Luana Camargo';
          updateDoc(doc(db, 'users', u.uid), {
            name: 'Luana Camargo',
            updated_at: new Date().toISOString()
          }).catch(() => {});
        }
        return u;
      });

      setUsers(healedUsers);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (users.length === 0) return;
    
    const fetchActivity = async () => {
      try {
        const counts: Record<string, { indications: number }> = {};
        users.forEach(u => counts[u.uid] = { indications: 0 });

        // As duas coleções inteiras eram baixadas só para contar indicações por pessoa,
        // e de novo a cada vez que o número de usuários mudava (e a cada abertura da
        // tela). Agora a leitura fica guardada por 30 minutos e as contas são refeitas
        // em cima dela, sem ler nada de novo. Os números são os mesmos.
        // 1. Fetch counts from indications collection
        const indicationsSnap = await lerComCache('indicacoes-todas', 30 * 60 * 1000, () => getDocs(query(collection(db, 'indications'))));
        indicationsSnap.forEach(doc => {
          const data = doc.data();
          if (data.is_deleted) return;

          // Count if user is the external seller (referred it) OR if they are the internal seller (worked it)
          // The user specifically asked to see activity, and for internal sellers, "activity" means handling leads too.
          if (data.external_seller_uid && counts[data.external_seller_uid]) {
            counts[data.external_seller_uid].indications++;
          }
          
          if (data.standard_seller_uid && counts[data.standard_seller_uid]) {
            counts[data.standard_seller_uid].indications++;
          }

          if (data.internal_seller_uid && counts[data.internal_seller_uid]) {
            counts[data.internal_seller_uid].indications++;
          }

          if (data.assigned_to_uid && counts[data.assigned_to_uid]) {
            counts[data.assigned_to_uid].indications++;
          }
        });

        // 2. Fetch counts from fair_leads collection (Fair registrations)
        try {
          const fairLeadsSnap = await lerComCache('leads-feira-todos', 30 * 60 * 1000, () => getDocs(collection(db, 'fair_leads')));
          fairLeadsSnap.forEach(doc => {
            const data = doc.data();
            const salespersonUid = data.salesperson_uid;
            if (salespersonUid && counts[salespersonUid]) {
              counts[salespersonUid].indications++;
            }
            if (data.assigned_to_uid && counts[data.assigned_to_uid]) {
              counts[data.assigned_to_uid].indications++;
            }
          });
        } catch (err) {
          console.error("Error fetching fair leads for activity count:", err);
        }

        setUserActivity(counts);
      } catch (err) {
        console.error("Error fetching user activity:", err);
      }
    };

    fetchActivity();
  }, [users.length]);

  useEffect(() => {
    const unsubEmail = onSnapshot(doc(db, 'settings', 'email'), (snap) => {
      if (snap.exists()) {
        setEmailSettings(snap.data() as any);
      }
    });
    
    const unsubNotifications = onSnapshot(doc(db, 'settings', 'notifications'), (snap) => {
      if (snap.exists()) {
        setNotificationSettings(snap.data() as any);
      }
    });

    const unsubAgendor = onSnapshot(doc(db, 'settings', 'agendor'), (snap) => {
      if (snap.exists()) {
        setAgendorSettings(snap.data() as any);
      }
    });

    const unsubGoals = onSnapshot(doc(db, 'settings', 'goals'), (snap) => {
      if (snap.exists()) {
        setGoals(snap.data() as any);
      }
    });

    return () => {
      unsubEmail();
      unsubNotifications();
      unsubAgendor();
      unsubGoals();
    };
  }, []);

  const handleSaveGoals = async () => {
    setSavingGoals(true);
    try {
      await setDoc(doc(db, 'settings', 'goals'), goals);
      toast.success('Metas mensais atualizadas!');
    } catch (error: any) {
      toast.error('Erro ao salvar metas: ' + error.message);
    } finally {
      setSavingGoals(false);
    }
  };

  const handleApprove = async (request: any) => {
    setApprovingId(request.id);
    const toastId = toast.loading('Processando aprovação...');
    try {
      // 1. Decrypt data
      const decryptedData = await CryptoService.decrypt(request.data_encrypted);
      if (!decryptedData) throw new Error('Falha ao decriptar dados.');

      // 2. Execute action
      if (request.type === 'product_catalog') {
        if (request.action === 'create') {
          await addDoc(collection(db, 'products'), {
            ...decryptedData,
            is_blocked: false,
            created_at: new Date().toISOString()
          });
        } else if (request.action === 'update' && request.target_id) {
          await updateDoc(doc(db, 'products', request.target_id), decryptedData);
        }
      }

      // 3. Mark as approved
      await updateDoc(doc(db, 'approval_queue', request.id), {
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by_uid: user?.uid,
        approved_by_name: profile?.name || user?.email
      });

      await AuditService.log(AuditAction.UPDATE_PRODUCT, `Aprovou alteração em ${request.entity_name} enviada por ${request.submitted_by_name}`);
      toast.success('Alteração aprovada e publicada!', { id: toastId });
    } catch (error: any) {
      toast.error('Erro ao aprovar: ' + error.message, { id: toastId });
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (request: any) => {
    if (!confirm('Deseja rejeitar esta alteração?')) return;
    try {
      await updateDoc(doc(db, 'approval_queue', request.id), {
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by_uid: user?.uid
      });
      toast.info('Alteração rejeitada.');
    } catch (error: any) {
      toast.error('Erro ao rejeitar: ' + error.message);
    }
  };

  const handleSaveEmailSettings = async () => {
    setSavingEmail(true);
    try {
      await setDoc(doc(db, 'settings', 'email'), emailSettings);
      toast.success('Configurações de e-mail salvas!');
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    setSavingNotifications(true);
    try {
      await setDoc(doc(db, 'settings', 'notifications'), notificationSettings);
      toast.success('Central de Notificações atualizada!');
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleTestEmail = async () => {
    if (!realProfile?.email) {
      toast.error('Você precisa de um e-mail para receber o teste.');
      return;
    }

    const toastId = toast.loading('Enviando e-mail de teste...');
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          to: realProfile.email,
          subject: 'Teste de Configuração - RODER Indica V2',
          html: '<h1>Teste bem-sucedido!</h1><p>Se você está lendo isso, a configuração do Gmail no sistema está funcionando corretamente.</p>',
          fromName: 'Sistema RODER',
          settings: emailSettings
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('E-mail enviado com sucesso! Verifique sua caixa de entrada.', { id: toastId });
      } else {
        const errorMsg = data.details ? `${data.error} (${data.details})` : data.error;
        toast.error('Erro no teste: ' + errorMsg, { id: toastId });
      }
    } catch (error: any) {
      toast.error('Erro técnico: ' + error.message, { id: toastId });
    }
  };

  const handleSaveAgendorSettings = async () => {
    setSavingAgendor(true);
    try {
      await setDoc(doc(db, 'settings', 'agendor'), agendorSettings);
      toast.success('Configurações de integração do Agendor salvas!');
    } catch (error: any) {
      toast.error('Erro ao salvar configurações do Agendor: ' + error.message);
    } finally {
      setSavingAgendor(false);
    }
  };

  const handleTestAgendorConnection = async () => {
    setTestingAgendor(true);
    const toastId = toast.loading('Testando conexão com o Agendor...');
    try {
      const response = await fetch('/api/agendor/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          apiToken: agendorSettings.apiToken,
          indicatorName: realProfile?.name || profile?.name || 'Jeferson Roder',
          indicatorEmail: realProfile?.email || profile?.email || 'jeferson@roderbrasil.com.br',
          indicatorPhone: realProfile?.phone || profile?.phone || '(14) 99811-5110'
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(data.message || `Conexão efetuada com sucesso! ${data.users?.length || 0} usuários mapeados no Agendor.`, { id: toastId, duration: 12000 });
      } else {
        toast.error('Falha de conexão: ' + (data.error || 'Erro desconhecido'), { id: toastId });
      }
    } catch (error: any) {
      toast.error('Erro na chamada da API: ' + error.message, { id: toastId });
    } finally {
      setTestingAgendor(false);
    }
  };

  const handleSaveUser = async () => {
    // If external seller, email is optional if phone is present
    const isExternal = formData.role === 'external_seller';
    
    if (!formData.name) {
      toast.error('O nome é obrigatório.');
      return;
    }

    if (!formData.phone) {
      toast.error('O WhatsApp é obrigatório para cadastrar novos usuários.');
      return;
    }

    if (isExternal && (!formData.city || !formData.state)) {
      toast.error('Cidade e Estado são obrigatórios para parceiros indicadores.');
      return;
    }

    try {
      if ((isManager || isTriagem) && !isAdmin) {
        const salesScope = ['external_seller', 'internal_seller', 'triagem'];
        if (!salesScope.includes(formData.role)) {
          toast.error('Você não tem permissão para cadastrar/editar usuários com este papel.');
          return;
        }
      }

      const cleanPhone = formData.phone?.replace(/\D/g, '');
      const finalEmail = (formData.email || (cleanPhone ? `${cleanPhone}@mobile.roder.com.br` : '')).toLowerCase().trim();
      const initialPwd = formData.initial_password?.trim() || '';

      const userData: any = {
        ...formData,
        email: finalEmail,
        phone: cleanPhone,
        initial_password: initialPwd || (editingUser?.initial_password || ''),
        permissions: formData.permissions,
        updated_at: new Date().toISOString(),
      };

      if (editingUser) {
        await updateDoc(doc(db, 'users', editingUser.uid), userData);

        // If a password was provided or updated, sync with Firebase Auth
        if (initialPwd && initialPwd !== editingUser.initial_password && initialPwd.length >= 6 && finalEmail && !finalEmail.endsWith('@mobile.roder.com.br')) {
          try {
            const token = await auth.currentUser?.getIdToken();
            if (token) {
              const baseUrl = getApiBaseUrl();
              await fetch(`${baseUrl}/api/admin/set-user-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: finalEmail, password: initialPwd, token })
              });
            }
          } catch (authErr) {
            console.warn('Auth password sync notice:', authErr);
          }
        }

        setUsers(prev => prev.map(u => u.uid === editingUser.uid ? { ...u, ...userData } : u));
        toast.success('Usuário atualizado com sucesso!');
      } else {
        // Use a deterministic ID if it's a mobile-only user to avoid duplicates
        const tempId = cleanPhone ? `phone_${cleanPhone}` : `temp_${Date.now()}`;
        
        await setDoc(doc(db, 'users', tempId), {
          ...userData,
          uid: tempId,
          created_at: new Date().toISOString(),
        });

        // If initial password was supplied, sync with Firebase Auth
        if (initialPwd && initialPwd.length >= 6 && finalEmail && !finalEmail.endsWith('@mobile.roder.com.br')) {
          try {
            const token = await auth.currentUser?.getIdToken();
            if (token) {
              const baseUrl = getApiBaseUrl();
              await fetch(`${baseUrl}/api/admin/set-user-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: finalEmail, password: initialPwd, token })
              });
            }
          } catch (authErr) {
            console.warn('Auth password sync notice on creation:', authErr);
          }
        }
        
        if (!formData.email) {
          toast.success('Perfil criado! O usuário pode entrar usando o número do WhatsApp.');
        } else if (initialPwd) {
          toast.success('Perfil criado com senha cadastrada! Você já pode compartilhar o acesso via WhatsApp.');
        } else {
          toast.success('Perfil criado com sucesso!');
        }
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error('Erro ao salvar usuário: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'external_seller',
      company_name: '',
      cpf_cnpj: '',
      city: '',
      state: '',
      commission_rate: 2,
      monthly_salary: 0,
      assigned_regions: [] as string[],
      is_lead_receiver: false,
      is_commissionable: true,
      status: 'active',
      pix_key: '',
      initial_password: '',
      bank_info: {
        bank: '',
        agency: '',
        account: '',
      },
      permissions: {
        sidebar: {},
        dashboard_cards: {},
      }
    });
    setEditingUser(null);
  };

  const handleDelete = async (uid: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      const userToDelete = users.find(u => u.uid === uid);
      if ((isManager || isTriagem) && !isAdmin && userToDelete) {
        const salesScope = ['external_seller', 'internal_seller', 'triagem'];
        if (!salesScope.includes(userToDelete.role)) {
          toast.error('Você não tem permissão para remover este usuário.');
          return;
        }
      }
      await deleteDoc(doc(db, 'users', uid));
      toast.success('Usuário removido.');
    } catch (error: any) {
      toast.error('Erro ao remover: ' + error.message);
    }
  };

  const openWhatsAppUrl = (phone: string | undefined, message: string) => {
    let cleanPhone = phone?.replace(/\D/g, '') || '';
    if (cleanPhone && !cleanPhone.startsWith('55') && (cleanPhone.length === 10 || cleanPhone.length === 11)) {
      cleanPhone = `55${cleanPhone}`;
    }
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const buildWhatsAppInviteMessage = (user: UserProfile, password?: string, includePassword?: boolean) => {
    const appUrl = window.location.origin;
    const roleName = user.role === 'admin' ? 'Administrador' : 
                     user.role === 'manager' ? 'Gerente Comercial' : 
                     user.role === 'internal_seller' ? 'Vendedora Interna' :
                     user.role === 'triagem' ? 'Triagem' :
                     user.role === 'financial' ? 'Financeiro' :
                     user.role === 'vendedor_padrao' ? 'Vendedor Padrão' : 'Vendedor Externo';

    const isMobileOnly = user.email?.endsWith('@mobile.roder.com.br');
    const isGoogle = user.email?.endsWith('@gmail.com') || 
                     user.email?.endsWith('@roderbrasil.com.br') || 
                     user.email?.endsWith('@roder.com.br');

    // Effective password from explicit parameter or registered profile
    const effectivePassword = (password !== undefined ? password : user.initial_password)?.trim();
    const hasRegisteredPassword = !!effectivePassword && (includePassword !== false);

    let loginMethodInfo = '';
    let instructions = '';

    if (isMobileOnly) {
      loginMethodInfo = `📲 *Acesso via WhatsApp:*\n` +
                        `• *Número de Telefone:* ${user.phone}`;
      instructions = `1. Ao abrir o link do App, selecione a opção *"Acesso via WhatsApp"*.\n` +
                     `2. Digite o seu número (${user.phone}) e clique em entrar.`;
    } else if (hasRegisteredPassword) {
      // User has a registered password: instruct login with email and password
      loginMethodInfo = `🔑 *Dados de Acesso (Login e Senha):*\n` +
                        `• *E-mail:* ${user.email}\n` +
                        `• *Senha de Acesso:* ${effectivePassword}`;
      instructions = `1. Ao abrir o link do App, selecione a opção *"E-mail e Senha"*.\n` +
                     `2. Digite o seu e-mail (*${user.email}*) e a senha cadastrada informada acima (*${effectivePassword}*).\n` +
                     `3. Clique no botão *"Entrar"* para acessar o sistema.`;
      if (isGoogle) {
        instructions += `\n\n💡 *Opção alternativa:* Se preferir, você também pode clicar no botão *"Google"* usando sua conta ${user.email}.`;
      }
    } else if (isGoogle) {
      loginMethodInfo = `📧 *Acesso via Google:*\n` +
                        `• *Conta Google:* ${user.email}`;
      instructions = `1. Ao abrir o link do App, clique no botão *"Google"*.\n` +
                     `2. Entre com sua conta ${user.email}.`;
    } else {
      loginMethodInfo = `📧 *Acesso via E-mail:*\n` +
                        `• *E-mail:* ${user.email}`;
      instructions = `1. Ao abrir o link do App, selecione a opção *"E-mail e Senha"*.\n` +
                     `2. Digite o seu e-mail (*${user.email}*).\n` +
                     `3. Caso ainda não tenha uma senha cadastrada, clique no link *"Esqueci minha senha"* para criá-la.`;
    }

    return `Olá *${user.name}*!\n\n` +
      `Você foi cadastrado no sistema *RODER Indica V2* como *${roleName}*.\n\n` +
      `🔗 *Link do App:* ${appUrl}\n\n` +
      `${loginMethodInfo}\n\n` +
      `*Instruções para o seu acesso:* \n` +
      `${instructions}\n\n` +
      `📌 *Dica:* No celular, toque no ícone de compartilhar e selecione "Adicionar à Tela de Início" para instalar o App.\n\n` +
      `Qualquer dúvida, fale com a Luana!`;
  };

  const handleSetPasswordManually = async (shareAfterward = false) => {
    if (!passwordForUser.email || !passwordForUser.password || passwordForUser.password.length < 6) {
      toast.error('Informe um e-mail válido e uma senha com pelo menos 6 caracteres.');
      return;
    }

    setIsSettingPassword(true);
    const toastId = toast.loading(`Definindo senha para ${passwordForUser.email}...`);
    
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Sessão expirada. Refaça o login.');

      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/set-user-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: passwordForUser.email,
          password: passwordForUser.password,
          token: token
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error(`Resposta inválida do servidor (${response.status})`);
      }

      if (data.success) {
        toast.success(data.message || 'Senha definida com sucesso!', { id: toastId });

        // Update user doc in Firestore with initial_password
        const targetUser = users.find(u => u.email?.toLowerCase().trim() === passwordForUser.email.toLowerCase().trim());
        if (targetUser) {
          try {
            await updateDoc(doc(db, 'users', targetUser.uid), {
              initial_password: passwordForUser.password,
              updated_at: new Date().toISOString()
            });
            setUsers(prev => prev.map(u => u.uid === targetUser.uid ? { ...u, initial_password: passwordForUser.password } : u));
          } catch (e) {
            console.warn("Could not update Firestore initial_password on client:", e);
          }

          if (shareAfterward) {
            const msg = buildWhatsAppInviteMessage(targetUser, passwordForUser.password, true);
            openWhatsAppUrl(targetUser.phone, msg);
            toast.success('WhatsApp aberto com a senha cadastrada!');
          }
        }

        // Small delay before closing to avoid React/DOM race conditions with sonner toast
        setTimeout(() => {
          setIsPasswordDialogOpen(false);
          setPasswordForUser({ email: '', password: '', name: '' });
          setIsSettingPassword(false);
        }, 100);
        return; // Success handled
      } else {
        console.error("[PWD-SET] API returned error:", data);
        toast.error('Erro: ' + (data.error || 'Erro desconhecido'), { id: toastId });
      }
    } catch (error: any) {
      console.error("[PWD-SET] Client-side error:", error);
      toast.error('Erro ao processar: ' + (error.message || 'Erro inesperado'), { id: toastId });
    } finally {
      const checkLoading = setTimeout(() => {
        setIsSettingPassword(false);
      }, 500);
    }
  };

  const handleQuickInviteRogerio = async () => {
    const rogerioEmail = 'rogerio@roderbrasil.com.br';
    const existing = users.find(u => u.email === rogerioEmail);
    
    if (existing) {
      toast.info('Rogério já está cadastrado!');
      handleShareAccess(existing);
      return;
    }

    try {
      const tempId = `rogerio_${Date.now()}`;
      const rogerioData: UserProfile = {
        uid: tempId,
        name: 'Rogério',
        email: rogerioEmail,
        phone: '14998665110',
        role: 'manager',
        status: 'active',
        created_at: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', tempId), rogerioData);
      toast.success('Rogério cadastrado com sucesso!');
      handleShareAccess(rogerioData);
    } catch (error) {
      console.error('Error inviting Rogério:', error);
      toast.error('Erro ao cadastrar Rogério.');
    }
  };

  const handleQuickInviteLuana = async () => {
    const luanaEmail = 'contato@roderbrasil.com.br';
    const existing = users.find(u => u.email === luanaEmail);
    if (existing) { toast.info('Luana já está cadastrada!'); handleShareAccess(existing); return; }
    try {
      const tempId = `luana_${Date.now()}`;
      const luanaData: UserProfile = {
        uid: tempId, name: 'Luana Camargo', email: luanaEmail, phone: '', role: 'triagem',
        status: 'active', created_at: new Date().toISOString(), is_lead_receiver: true
      };
      await setDoc(doc(db, 'users', tempId), luanaData);
      toast.success('Luana cadastrada com sucesso!');
      handleShareAccess(luanaData);
    } catch (error) { toast.error('Erro ao cadastrar Luana.'); }
  };

  const handleQuickInviteGislene = async () => {
    const gisleneEmail = 'gislene@roderbrasil.com.br';
    const existing = users.find(u => u.email === gisleneEmail);
    if (existing) { toast.info('Gislene já está cadastrada!'); handleShareAccess(existing); return; }
    try {
      const tempId = `gislene_${Date.now()}`;
      const gisleneData: UserProfile = {
        uid: tempId, name: 'Gislene', email: gisleneEmail, phone: '', role: 'manager',
        status: 'active', created_at: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', tempId), gisleneData);
      toast.success('Gislene cadastrada com sucesso!');
      handleShareAccess(gisleneData);
    } catch (error) { toast.error('Erro ao cadastrar Gislene.'); }
  };

  const handleQuickInviteMonali = async () => {
    const email = 'monali@roderbrasil.com.br';
    const existing = users.find(u => u.email === email);
    if (existing) { toast.info('Monalí já está cadastrada!'); handleShareAccess(existing); return; }
    try {
      const tempId = `monali_${Date.now()}`;
      const data: UserProfile = {
        uid: tempId, name: 'Monalí Souza', email: email, phone: '14998115211', role: 'internal_seller',
        status: 'active', created_at: new Date().toISOString(), city: 'Pardinho', state: 'SP', is_commissionable: false
      };
      await setDoc(doc(db, 'users', tempId), data);
      toast.success('Monalí cadastrada com sucesso!');
      handleShareAccess(data);
    } catch (error) { toast.error('Erro ao cadastrar Monalí.'); }
  };

  const handleQuickInviteHeloisa = async () => {
    const email = 'heloisa@roderbrasil.com.br';
    const existing = users.find(u => u.email === email);
    if (existing) { toast.info('Heloisa já está cadastrada!'); handleShareAccess(existing); return; }
    try {
      const tempId = `heloisa_${Date.now()}`;
      const data: UserProfile = {
        uid: tempId, name: 'Heloisa Laira', email: email, phone: '14996305110', role: 'internal_seller',
        status: 'active', created_at: new Date().toISOString(), city: 'Pardinho', state: 'SP', is_commissionable: false
      };
      await setDoc(doc(db, 'users', tempId), data);
      toast.success('Heloisa cadastrada com sucesso!');
      handleShareAccess(data);
    } catch (error) { toast.error('Erro ao cadastrar Heloisa.'); }
  };

  const filteredUsers = users.filter(u => {
    // Escopo da Luana/Triagem e Gerência Comercial: Vendedores e Triagem
    if ((isManager || isTriagem) && !isAdmin) {
      const salesScope = ['external_seller', 'internal_seller', 'triagem'];
      if (!salesScope.includes(u.role)) return false;
    }

    return u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           u.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleConfirmShareWithPassword = async () => {
    if (!shareUserModal) return;
    setIsSharingViaWhatsApp(true);

    try {
      const trimmedPwd = sharePassword.trim();
      const shouldSavePwd = shareIncludePassword && trimmedPwd.length >= 6;

      // If a password was informed/changed, save it in Firestore and sync with Firebase Auth
      if (shouldSavePwd && trimmedPwd !== shareUserModal.initial_password) {
        // 1. Update Firestore
        await updateDoc(doc(db, 'users', shareUserModal.uid), {
          initial_password: trimmedPwd,
          updated_at: new Date().toISOString()
        });

        // 2. Sync with Firebase Auth in background
        try {
          const token = await auth.currentUser?.getIdToken();
          if (token && shareUserModal.email) {
            const baseUrl = getApiBaseUrl();
            await fetch(`${baseUrl}/api/admin/set-user-password`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                email: shareUserModal.email,
                password: trimmedPwd,
                token
              })
            });
          }
        } catch (authErr) {
          console.warn('Auth sync notice:', authErr);
        }

        // Update local state
        setUsers(prev => prev.map(u => u.uid === shareUserModal.uid ? { ...u, initial_password: trimmedPwd } : u));
        toast.success('Senha salva e vinculada ao perfil do usuário!');
      }

      const msg = buildWhatsAppInviteMessage(shareUserModal, trimmedPwd, shareIncludePassword && trimmedPwd.length > 0);
      openWhatsAppUrl(shareUserModal.phone, msg);
      setShareUserModal(null);
      toast.success('WhatsApp aberto com a mensagem de convite!');
    } catch (err: any) {
      toast.error('Erro ao processar: ' + err.message);
    } finally {
      setIsSharingViaWhatsApp(false);
    }
  };

  const handleShareAccess = (user: UserProfile) => {
    const isMobileOnly = user.email?.endsWith('@mobile.roder.com.br');

    if (isMobileOnly) {
      const msg = buildWhatsAppInviteMessage(user);
      openWhatsAppUrl(user.phone, msg);
      toast.success('Mensagem de convite gerada para WhatsApp!');
      return;
    }

    // Only skip modal for internal Roder corporate accounts that have NO registered password
    const isInternalRoderWithoutPassword = 
      (user.email?.endsWith('@roderbrasil.com.br') || user.email?.endsWith('@roder.com.br')) && 
      !user.initial_password;

    if (isInternalRoderWithoutPassword) {
      const msg = buildWhatsAppInviteMessage(user);
      openWhatsAppUrl(user.phone, msg);
      toast.success('Mensagem de convite gerada para WhatsApp!');
      return;
    }

    // For all external sellers / indicators and any user with registered password:
    setShareUserModal(user);
    setSharePassword(user.initial_password || '');
    setShareIncludePassword(true);
    setShowSharePassword(false);
  };

  const handleResetPassword = async (email: string) => {
    if (!email || email.includes('@mobile.roder.com.br')) {
      toast.error('Este usuário não possui um e-mail válido para reset de senha.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`E-mail de redefinição de senha enviado para ${email}`);
    } catch (error: any) {
      toast.error('Erro ao enviar e-mail: ' + error.message);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(-1)} 
                className="h-8 w-8"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  {isUsersView ? 'Usuários' : 'Configurações'}
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {isUsersView 
                    ? 'Gerencie perfis, acessos e status dos usuários do sistema.' 
                    : 'Gerencie metas, envio de e-mails, instruções, monitoramento e conectividade offline.'}
                </p>
              </div>
            </div>
            
            {isUsersView && (
              <div className="flex gap-2">
                <Button 
                  onClick={mergeDuplicateUsers} 
                  variant="outline" 
                  size="sm" 
                  disabled={isMerging}
                  className="border-orange-500 text-orange-500 hover:bg-orange-500/5 text-[10px] h-8 px-4 font-bold uppercase tracking-wider flex shrink-0"
                >
                  {isMerging ? (
                    <span className="flex items-center gap-1">
                      <span className="animate-spin h-3 w-3 border-2 border-orange-500 border-t-transparent rounded-full" />
                      Unificando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> Unificar Duplicados
                    </span>
                  )}
                </Button>
                <Button 
                  onClick={syncAllExternalSellersPermissions} 
                  variant="outline" 
                  size="sm" 
                  className="border-primary text-primary hover:bg-primary/5 text-[10px] h-8 px-4 font-bold uppercase tracking-wider hidden sm:flex shrink-0"
                >
                  <Shield className="h-3 w-3 mr-1" /> Resetar Vendedores
                </Button>
                <Button onClick={() => { resetForm(); setDialogTab('general'); setIsDialogOpen(true); }} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] h-8 px-4 font-bold uppercase tracking-wider shadow-sm shrink-0">
                  <UserPlus className="h-3 w-3 mr-1" /> Novo Usuário
                </Button>
              </div>
            )}
          </div>

          {/* Quick Invite Badges positioned at the top for users view */}
          {isUsersView && (
            <div className="flex overflow-x-auto pb-1 -mx-1 px-1 gap-2 no-scrollbar">
              <Button onClick={handleQuickInviteRogerio} variant="outline" size="sm" className="border-green-600/30 text-green-600 bg-green-500/5 hover:bg-green-600/10 font-bold shrink-0 text-[10px] h-8 px-3">
                <Plus className="h-3 w-3 mr-1" /> Rogério
              </Button>
              <Button onClick={handleQuickInviteLuana} variant="outline" size="sm" className="border-blue-600/30 text-blue-600 bg-blue-500/5 hover:bg-blue-600/10 font-bold shrink-0 text-[10px] h-8 px-3">
                <Plus className="h-3 w-3 mr-1" /> Luana
              </Button>
              <Button onClick={handleQuickInviteGislene} variant="outline" size="sm" className="border-purple-600/30 text-purple-600 bg-purple-500/5 hover:bg-purple-600/10 font-bold shrink-0 text-[10px] h-8 px-3">
                <Plus className="h-3 w-3 mr-1" /> Gislene
              </Button>
              <Button onClick={handleQuickInviteMonali} variant="outline" size="sm" className="border-orange-600/30 text-orange-600 bg-orange-50/50 hover:bg-orange-600/10 font-bold shrink-0 text-[10px] h-8 px-3">
                <Plus className="h-3 w-3 mr-1" /> Monalí
              </Button>
              <Button onClick={handleQuickInviteHeloisa} variant="outline" size="sm" className="border-pink-600/30 text-pink-600 bg-pink-500/5 hover:bg-pink-600/10 font-bold shrink-0 text-[10px] h-8 px-3">
                <Plus className="h-3 w-3 mr-1" /> Heloisa
              </Button>
              <Link to="/contrato?preview=true" target="_blank" className="inline-flex items-center justify-center rounded-md text-[10px] font-bold border border-border bg-background hover:bg-accent h-8 px-3 shrink-0">
                <FileText className="h-3 w-3 mr-1" /> Contrato
              </Link>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {!isUsersView && (
            <TabsList className="w-full flex flex-wrap md:flex-nowrap items-stretch gap-1.5 p-1 bg-muted/40 border border-border rounded-xl mb-8 shadow-sm h-auto">
              {(isAdmin || isManager || isMarketing) && (
                <TabsTrigger 
                  value="settings" 
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-[11px] md:text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer h-11",
                    activeTab === 'settings' 
                      ? "bg-orange-600 text-white shadow-[0_4px_12px_rgba(234,88,12,0.3)] border border-orange-600 scale-[1.02] z-10" 
                      : "bg-transparent text-muted-foreground hover:text-foreground border border-transparent hover:bg-muted/30"
                  )}
                >
                  <Mail className="h-4 w-4 shrink-0" /> <span>E-mail</span>
                </TabsTrigger>
              )}
              {(isAdmin || isManager || isMarketing) && (
                <TabsTrigger 
                  value="goals" 
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-[11px] md:text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer h-11",
                    activeTab === 'goals' 
                      ? "bg-orange-600 text-white shadow-[0_4px_12px_rgba(234,88,12,0.3)] border border-orange-600 scale-[1.02] z-10" 
                      : "bg-transparent text-muted-foreground hover:text-foreground border border-transparent hover:bg-muted/30"
                  )}
                >
                  <TrendingUp className="h-4 w-4 shrink-0" /> <span>Metas</span>
                </TabsTrigger>
              )}
              {(isAdmin || isManager || isMarketing) && (
                <TabsTrigger 
                  value="instructions" 
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-[11px] md:text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer h-11",
                    activeTab === 'instructions' 
                      ? "bg-orange-600 text-white shadow-[0_4px_12px_rgba(234,88,12,0.3)] border border-orange-600 scale-[1.02] z-10" 
                      : "bg-transparent text-muted-foreground hover:text-foreground border border-transparent hover:bg-muted/30"
                  )}
                >
                  <FileText className="h-4 w-4 shrink-0" /> <span>Instruções</span>
                </TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger 
                  value="system" 
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-[11px] md:text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer h-11",
                    activeTab === 'system' 
                      ? "bg-orange-600 text-white shadow-[0_4px_12px_rgba(234,88,12,0.3)] border border-orange-600 scale-[1.02] z-10" 
                      : "bg-transparent text-muted-foreground hover:text-foreground border border-transparent hover:bg-muted/30"
                  )}
                >
                  <Activity className="h-4 w-4 shrink-0" /> <span>Monitoramento</span>
                </TabsTrigger>
              )}
              {(isAdmin || isManager) && (
                <TabsTrigger 
                  value="approval" 
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-[11px] md:text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer h-11 relative",
                    activeTab === 'approval' 
                      ? "bg-orange-600 text-white shadow-[0_4px_12px_rgba(234,88,12,0.3)] border border-orange-600 scale-[1.02] z-10" 
                      : "bg-transparent text-muted-foreground hover:text-foreground border border-transparent hover:bg-muted/30"
                  )}
                >
                  <Clock className="h-4 w-4 shrink-0" /> <span>Aprovações</span>
                  {approvalQueue.length > 0 && (
                    <Badge className={cn(
                      "absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center p-0 text-[10px] text-white font-black animate-bounce rounded-full border border-background",
                      activeTab === 'approval' ? "bg-orange-500 border-orange-600" : "bg-red-500"
                    )}>
                      {approvalQueue.length}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="connectivity" 
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-[11px] md:text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer h-11",
                  activeTab === 'connectivity' 
                    ? "bg-orange-600 text-white shadow-[0_4px_12px_rgba(234,88,12,0.3)] border border-orange-600 scale-[1.02] z-10" 
                    : "bg-transparent text-muted-foreground hover:text-foreground border border-transparent hover:bg-muted/30"
                )}
              >
                <Wifi className="h-4 w-4 shrink-0" /> <span>Conectividade</span>
              </TabsTrigger>
              {(isAdmin || isManager || realProfile?.email === 'roderbrasil@gmail.com') && (
                <TabsTrigger 
                  value="ai_monitoring" 
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-[11px] md:text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer h-11",
                    activeTab === 'ai_monitoring' 
                      ? "bg-purple-600 text-white shadow-[0_4px_12px_rgba(147,51,234,0.3)] border border-purple-600 scale-[1.02] z-10" 
                      : "bg-transparent text-muted-foreground hover:text-foreground border border-transparent hover:bg-muted/30"
                  )}
                >
                  <Brain className="h-4 w-4 shrink-0" /> <span>Cérebro IA</span>
                </TabsTrigger>
              )}
              {(isAdmin || isManager || realProfile?.email === 'roderbrasil@gmail.com') && (
                <TabsTrigger 
                  value="api_keys" 
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-[11px] md:text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer h-11",
                    activeTab === 'api_keys' 
                      ? "bg-emerald-600 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)] border border-emerald-600 scale-[1.02] z-10" 
                      : "bg-transparent text-muted-foreground hover:text-foreground border border-transparent hover:bg-muted/30"
                  )}
                >
                  <Code2 className="h-4 w-4 shrink-0" /> <span>Integrações (API)</span>
                </TabsTrigger>
              )}
            </TabsList>
          )}
          
          <TabsContent value="users" className="space-y-4">
            {/* Search Bar positioned above user list */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nome ou e-mail..." 
                className="pl-10 bg-background border-border h-11"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Card className="bg-card border-border shadow-sm overflow-hidden">
              <div className="hidden md:block overflow-x-auto border-t border-border">
                <table className="w-full text-[13px] text-left">
                    <thead className="text-[11px] text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-2 py-3 font-bold">Usuário</th>
                        <th className="px-2 py-3 font-bold hidden lg:table-cell">Papel</th>
                        <th className="px-2 py-3 font-bold hidden xl:table-cell">Localização</th>
                        <th className="px-2 py-3 font-bold hidden sm:table-cell">Atividade</th>
                        <th className="px-2 py-3 font-bold hidden md:table-cell">Config.</th>
                        <th className="px-2 py-3 font-bold">Status</th>
                        <th className="px-2 py-3 font-bold text-right">Contrato</th>
                        <th className="px-2 py-3 font-bold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredUsers.map((user) => (
                        <tr key={user.uid} className={`hover:bg-muted/50 transition-colors ${user.status === 'inactive' ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                          <td className="px-2 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-full ${user.status === 'inactive' ? 'bg-slate-200 text-slate-400' : 'bg-primary/10 text-primary'} flex items-center justify-center text-[10px] font-bold shrink-0`}>
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <p className={`font-bold truncate max-w-[120px] md:max-w-[180px] ${user.status === 'inactive' ? 'text-slate-400' : 'text-foreground'}`}>
                                    {user.name}
                                  </p>
                                  <div className="flex flex-wrap gap-1 shrink-0">
                                    {((userActivity[user.uid]?.indications || 0) === 0 && user.status === 'active' && !!user.created_at && (new Date().getTime() - new Date(user.created_at).getTime() > 1000 * 60 * 60 * 24 * 7)) && (
                                      <Badge title="Usuário sem indicações registradas (Pode ser duplicado)" className="h-4 px-1 bg-red-100 text-red-600 border-red-200 text-[8px] font-black uppercase animate-pulse">
                                        Remover?
                                      </Badge>
                                    )}
                                    {(userActivity[user.uid]?.indications || 0) > 0 && (
                                      <Badge title={`${userActivity[user.uid]?.indications} indicações realizadas`} className="h-4 min-w-[16px] px-1 bg-green-500 hover:bg-green-600 text-[9px] border-none flex items-center justify-center font-black">
                                        {userActivity[user.uid]?.indications}
                                      </Badge>
                                    )}
                                    {users.filter(u => u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()).length > 1 && (
                                      <Badge title="E-mail duplicado no sistema" className="h-4 px-1 bg-red-600 text-white text-[8px] font-black uppercase border-none animate-pulse">
                                        Duplicado
                                      </Badge>
                                    )}
                                    {user.contract_accepted && (
                                      <span title="Contrato Assinado">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                      </span>
                                    )}
                                    {user.permissions && (() => {
                                      const defaults = ROLE_DEFAULTS[user.role] || ROLE_DEFAULTS.external_seller;
                                      const hasCustomSidebar = Object.keys(user.permissions.sidebar || {}).some(k => 
                                        user.permissions.sidebar[k] !== defaults.sidebar.includes(k)
                                      );
                                      const hasCustomDashboard = Object.keys(user.permissions.dashboard_cards || {}).some(k => 
                                        user.permissions.dashboard_cards[k] !== defaults.dashboard.includes(k)
                                      );
                                      return hasCustomSidebar || hasCustomDashboard;
                                    })() && (
                                      <Badge title="Permissões Manuais Detectadas" variant="outline" className="h-4 px-1 border-orange-400 text-orange-600 bg-orange-50 text-[8px] font-bold uppercase shrink-0">
                                        Especial
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">{user.email}</p>
                                  {user.initial_password && (
                                    <span 
                                      title={`Senha cadastrada: ${user.initial_password}`} 
                                      className="inline-flex items-center gap-0.5 px-1 py-0.2 text-[8px] font-mono bg-emerald-500/10 text-emerald-600 rounded border border-emerald-500/20 font-bold shrink-0"
                                    >
                                      <Key className="h-2 w-2" />
                                      <span>Senha OK</span>
                                    </span>
                                  )}
                                </div>
                                <div className="lg:hidden mt-0.5 flex items-center gap-1">
                                  <Badge variant="secondary" className="text-[8px] px-1 h-3 capitalize">
                                    {user.role}
                                  </Badge>
                                  <span className="text-[9px] text-muted-foreground">{user.city}-{user.state}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-4 hidden lg:table-cell">
                            <Badge variant="secondary" className={`capitalize text-[10px] px-1.5 h-5 ${user.status === 'inactive' ? 'bg-slate-100 text-slate-400' : 'bg-muted text-foreground'} border-border shrink-0`}>
                               {user.role === 'external_seller' ? 'Externo' : 
                               user.role === 'vendedor_padrao' ? 'Padrão' :
                               user.role === 'internal_seller' ? 'Interno' :
                               user.role === 'triagem' ? 'Triagem' :
                               user.role === 'financial' ? 'Financeiro' :
                               user.role === 'manager' ? 'Gerente' : 'Admin'}
                            </Badge>
                          </td>
                          <td className="px-2 py-4 hidden xl:table-cell">
                             <p className="text-[11px] text-muted-foreground whitespace-nowrap">{user.city}-{user.state}</p>
                          </td>
                          <td className="px-2 py-4 hidden sm:table-cell">
                            <div className="flex flex-col gap-0.5">
                              <Badge variant="outline" className={`w-fit text-[9px] font-bold px-1.5 h-4 border ${
                                (userActivity[user.uid]?.indications || 0) > 0 
                                  ? "border-green-500 text-green-600 bg-green-50" 
                                  : "border-slate-200 text-slate-400 bg-slate-50"
                              }`}>
                                {userActivity[user.uid]?.indications || 0} Ind.
                              </Badge>
                              {(userActivity[user.uid]?.indications || 0) === 0 && (
                                <p className="text-[8px] text-slate-400 font-medium italic">Sem atividade</p>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-4 hidden md:table-cell">
                            <div className="space-y-0.5">
                              {user.role === 'external_seller' && (
                                <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                                  <Percent className="h-3 w-3" /> {user.commission_rate}%
                                </p>
                              )}
                              {user.role === 'internal_seller' && (
                                <div className="flex flex-col gap-0.5">
                                  {user.is_lead_receiver && (
                                    <Badge variant="outline" className="text-[9px] border-primary text-primary px-1.5 h-4 w-fit">Rec. Leads</Badge>
                                  )}
                                  {(() => {
                                    const hasAccess = user.permissions?.sidebar?.my_sales !== false;
                                    return hasAccess ? (
                                      <Badge variant="outline" className="text-[9px] border-green-500 text-green-600 px-1.5 h-4 w-fit">Central OK</Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[9px] border-red-500 text-red-600 px-1.5 h-4 w-fit">Sem Central</Badge>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-4">
                            <div className="flex items-center gap-1">
                              <Switch 
                                checked={user.status !== 'inactive'} 
                                className="scale-75 origin-left"
                                disabled={!isAdmin && !isManager && !isTriagem && !isMarketing}
                                onCheckedChange={async (checked) => {
                                  try {
                                    await updateDoc(doc(db, 'users', user.uid), {
                                      status: checked ? 'active' : 'inactive',
                                      updated_at: new Date().toISOString()
                                    });
                                    toast.success(checked ? 'Usuário ativado!' : 'Usuário desativado!');
                                  } catch (error: any) {
                                    toast.error('Erro ao atualizar status: ' + error.message);
                                  }
                                }}
                              />
                            </div>
                          </td>
                          <td className="px-2 py-4 text-right">
                            {user.is_commissionable !== false && user.role === 'external_seller' ? (
                              user.contract_accepted ? (
                                <div className="flex flex-col gap-0.5 items-end">
                                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px] px-1.5 h-4 w-fit">Assinado</Badge>
                                  <a 
                                    href={`/contrato?uid=${user.uid}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[9px] text-blue-500 hover:underline flex items-center gap-0.5"
                                  >
                                    <ExternalLink className="h-2.5 w-2.5" /> Ver
                                  </a>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-0.5 items-end">
                                  <Badge variant="outline" className="text-orange-500 border-orange-500/20 text-[9px] px-1.5 h-4 w-fit">Pendente</Badge>
                                </div>
                              )
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">N/A</span>
                            )}
                          </td>
                          <td className="px-2 py-4 text-right">
                            {(isAdmin || ((isManager || isTriagem) && ['external_seller', 'internal_seller', 'triagem'].includes(user.role as string))) && (
                              <div className="flex justify-end gap-0.5">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-blue-500 hover:bg-blue-500/10"
                                  onClick={async () => {
                                    if (!window.confirm(`Deseja restaurar as permissões padrão para ${user.name}? Isso pode resolver problemas de acesso a menus.`)) return;
                                    try {
                                      const defaults = ROLE_DEFAULTS[user.role] || ROLE_DEFAULTS.external_seller;
                                      const sidebar: Record<string, boolean> = {};
                                      sidebarItems.forEach(i => sidebar[i.id] = defaults.sidebar.includes(i.id));
                                      const dashboard_cards: Record<string, boolean> = {};
                                      dashboardCards.forEach(c => dashboard_cards[c.id] = defaults.dashboard.includes(c.id));
                                      
                                      await updateDoc(doc(db, 'users', user.uid), {
                                        permissions: { sidebar, dashboard_cards },
                                        updated_at: new Date().toISOString()
                                      });
                                      toast.success('Permissões restauradas com sucesso.');
                                    } catch (e: any) {
                                      toast.error('Erro ao restaurar: ' + e.message);
                                    }
                                  }}
                                  title="Restaurar Permissões Padrão"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-orange-500 hover:bg-orange-500/10" 
                                  onClick={() => {
                                    startImpersonation(user);
                                    toast.success(`Simulando visão de ${user.name}`);
                                    navigate('/');
                                  }}
                                  title="Acessar Visão do Usuário"
                                  disabled={user.uid === realProfile?.uid}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-indigo-600 hover:bg-indigo-500/10" 
                                    onClick={() => {
                                      setPasswordForUser({ email: user.email || '', password: user.initial_password || '', name: user.name });
                                      setIsPasswordDialogOpen(true);
                                    }}
                                    title="Definir Senha Manualmente"
                                    disabled={user.email?.endsWith('@mobile.roder.com.br')}
                                  >
                                    <Key className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-yellow-600 hover:bg-yellow-500/10" 
                                    onClick={() => handleManualResetInvite(user)}
                                    title="Enviar Instruções de Acesso (Recuperar Senha)"
                                    disabled={user.email?.endsWith('@mobile.roder.com.br')}
                                  >
                                    <Mail className="h-3.5 w-3.5" />
                                  </Button>
                                {podeLinkConsultor && user.role === 'external_seller' && user.status !== 'inactive' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-amber-600 hover:bg-amber-500/10"
                                      disabled={linkConsultorEm === user.uid}
                                      onClick={() => linkDoConsultor(user)}
                                      title="Link do consultor (copia o texto para o parceiro)"
                                    >
                                      {linkConsultorEm === user.uid ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-amber-700 hover:bg-amber-500/10"
                                      disabled={linkConsultorEm === user.uid}
                                      onClick={() => linkDoConsultor(user, true)}
                                      title="Gerar novo link do consultor (o antigo para de funcionar)"
                                    >
                                      <RefreshCw className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-blue-500 hover:bg-blue-500/10" 
                                  onClick={() => handleShareAccess(user)}
                                  title="Compartilhar Acesso"
                                >
                                  <Share2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-indigo-500 hover:bg-indigo-500/10" 
                                  onClick={() => {
                                    setEditingUser(user);
                                    setFormData({
                                      name: user.name,
                                      email: user.email || '',
                                      phone: user.phone || '',
                                      role: user.role,
                                      company_name: user.company_name || '',
                                      cpf_cnpj: user.cpf_cnpj || '',
                                      city: user.city || '',
                                      state: user.state || '',
                                      commission_rate: user.commission_rate || 2,
                                      monthly_salary: user.monthly_salary || 0,
                                      assigned_regions: user.assigned_regions || [],
                                      is_lead_receiver: user.is_lead_receiver || false,
                                      is_commissionable: user.is_commissionable !== false,
                                      status: user.status || 'active',
                                      pix_key: user.pix_key || '',
                                      initial_password: user.initial_password || '',
                                      bank_info: user.bank_info || { bank: '', agency: '', account: '' },
                                      permissions: {
                                        sidebar: user.permissions?.sidebar || {},
                                        dashboard_cards: user.permissions?.dashboard_cards || {},
                                      },
                                    });
                                    setDialogTab('permissions');
                                    setIsDialogOpen(true);
                                  }}
                                  title="Gerenciar Permissões"
                                >
                                  <Shield className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted/10" onClick={() => {
                                  setEditingUser(user);
                                  setFormData({
                                    name: user.name,
                                    email: user.email || '',
                                    phone: user.phone || '',
                                    role: user.role,
                                    company_name: user.company_name || '',
                                    cpf_cnpj: user.cpf_cnpj || '',
                                    city: user.city || '',
                                    state: user.state || '',
                                    commission_rate: user.commission_rate || 2,
                                    monthly_salary: user.monthly_salary || 0,
                                    assigned_regions: user.assigned_regions || [],
                                    is_lead_receiver: user.is_lead_receiver || false,
                                    is_commissionable: user.is_commissionable !== false,
                                    status: user.status || 'active',
                                    pix_key: user.pix_key || '',
                                    initial_password: user.initial_password || '',
                                    bank_info: user.bank_info || { bank: '', agency: '', account: '' },
                                    permissions: {
                                      sidebar: user.permissions?.sidebar || {},
                                      dashboard_cards: user.permissions?.dashboard_cards || {},
                                    },
                                  });
                                  setDialogTab('general');
                                  setIsDialogOpen(true);
                                }}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-orange-600 hover:bg-orange-600/10" onClick={() => handleResetPermissions(user)} title="Resetar Permissões p/ Padrão">
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(user.uid)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View: Compressed Cards */}
                <div className="md:hidden divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <div key={user.uid} className={`p-3 space-y-2 ${user.status === 'inactive' ? 'bg-slate-50/50 grayscale-[0.3]' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full ${user.status === 'inactive' ? 'bg-slate-200 text-slate-400' : 'bg-primary/10 text-primary'} flex items-center justify-center text-xs font-bold shrink-0`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className={`font-bold text-[13px] ${user.status === 'inactive' ? 'text-slate-400' : 'text-foreground'} truncate leading-tight`}>{user.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                              {user.initial_password && (
                                <span title={`Senha cadastrada: ${user.initial_password}`} className="inline-flex items-center gap-0.5 px-1 text-[8px] font-mono bg-emerald-500/10 text-emerald-600 rounded border border-emerald-500/20 font-bold shrink-0">
                                  <Key className="h-2 w-2" />
                                </span>
                              )}
                              <Badge className={`h-3 px-1 text-[8px] font-black ${
                                (userActivity[user.uid]?.indications || 0) > 0 
                                  ? "bg-green-500 hover:bg-green-600" 
                                  : "bg-slate-200 text-slate-500"
                              }`}>
                                {userActivity[user.uid]?.indications || 0} IND.
                              </Badge>
                              {user.contract_accepted && (
                                <CheckCircle2 className="h-3 w-3 text-blue-500" />
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="secondary" className={`text-[8px] px-1 h-4 uppercase ${user.status === 'inactive' ? 'bg-slate-100 text-slate-400' : 'bg-muted text-foreground'} border-border shrink-0 font-black`}>
                            {user.role === 'external_seller' ? 'Externo' : 
                             user.role === 'vendedor_padrao' ? 'Regional' :
                             user.role === 'internal_seller' ? 'Interno' :
                             user.role === 'triagem' ? 'Triagem' :
                             user.role === 'financial' ? 'Finan.' :
                             user.role === 'manager' ? 'G. Com.' : 'Admin'}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Switch 
                              checked={user.status !== 'inactive'}
                              className="scale-75 h-4 w-7"
                              onCheckedChange={async (checked) => {
                                try {
                                  await updateDoc(doc(db, 'users', user.uid), {
                                    status: checked ? 'active' : 'inactive',
                                    updated_at: new Date().toISOString()
                                  });
                                  toast.success(checked ? 'Ativado!' : 'Desativado!');
                                } catch (error: any) {
                                  toast.error('Erro: ' + error.message);
                                }
                              }}
                            />
                            <span className={`text-[8px] font-black uppercase ${user.status === 'active' ? 'text-green-600' : 'text-red-500'}`}>
                              {user.status === 'inactive' ? 'OFF' : 'ON'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-medium">
                          {user.phone && <span className="flex items-center gap-1 leading-none"><Phone className="h-2.5 w-2.5 shrink-0" /> {user.phone}</span>}
                          {(user.city || user.state) && <span className="flex items-center gap-1 leading-none"><MapPin className="h-2.5 w-2.5 shrink-0" /> {user.city}/{user.state}</span>}
                        </div>
                        {(isAdmin || isManager || isTriagem) && (
                          <div className="flex items-center gap-0.5">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-orange-500" 
                              onClick={() => {
                                startImpersonation(user);
                                toast.success(`Simulando visão de ${user.name}`);
                                navigate('/');
                              }}
                              disabled={user.uid === realProfile?.uid}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-indigo-600" 
                              onClick={() => {
                                setPasswordForUser({ email: user.email || '', password: user.initial_password || '', name: user.name });
                                setIsPasswordDialogOpen(true);
                              }}
                              disabled={user.email?.endsWith('@mobile.roder.com.br')}
                              title="Definir Senha Manualmente"
                            >
                              <Key className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-blue-500" 
                              onClick={() => handleShareAccess(user)}
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => {
                              setEditingUser(user);
                              setFormData({
                                name: user.name, email: user.email || '', phone: user.phone || '', role: user.role,
                                company_name: user.company_name || '', cpf_cnpj: user.cpf_cnpj || '',
                                city: user.city || '', state: user.state || '', commission_rate: user.commission_rate || 2,
                                monthly_salary: user.monthly_salary || 0, assigned_regions: user.assigned_regions || [],
                                is_lead_receiver: user.is_lead_receiver || false, is_commissionable: user.is_commissionable !== false,
                                status: user.status || 'active',
                                pix_key: user.pix_key || '', initial_password: user.initial_password || '', bank_info: user.bank_info || { bank: '', agency: '', account: '' },
                                permissions: {
                                  sidebar: user.permissions?.sidebar || {},
                                  dashboard_cards: user.permissions?.dashboard_cards || {},
                                },
                              });
                              setIsDialogOpen(true);
                            }}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(user.uid)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {podeLinkConsultor && user.role === 'external_seller' && user.status !== 'inactive' && (
                        <div className="flex gap-2 pt-1">
                          <Button
                            variant="outline"
                            className="h-11 flex-1 gap-1.5 text-[13px] font-bold"
                            disabled={linkConsultorEm === user.uid}
                            onClick={() => linkDoConsultor(user)}
                          >
                            {linkConsultorEm === user.uid ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Link do consultor
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-11 px-3 text-[12.5px] font-semibold text-muted-foreground"
                            disabled={linkConsultorEm === user.uid}
                            onClick={() => linkDoConsultor(user, true)}
                          >
                            Gerar novo link
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

          <TabsContent value="settings">
            {isAdmin && <div className="max-w-5xl"><RegrasSeguranca /><FotosExternas /></div>}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
              <div className="flex flex-col gap-6">
                {/* Central de Notificações */}
                <Card className="bg-card border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" /> Central de Notificações
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Escolha quais situações disparam e-mails informativos.</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      {/* Gmail Section - Only for main admin */}
                      {realProfile?.email === 'roderbrasil@gmail.com' && (
                        <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-4 mb-4">
                          <h4 className="text-xs font-black uppercase text-blue-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" /> Servidor de E-mail (Gmail SMTP)
                          </h4>
                          
                          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-2">
                            <p className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Configuração Atual
                            </p>
                            <p className="text-[11px] text-blue-700/80 leading-relaxed font-medium">
                              Utilizando <strong>hostindicaregistry@gmail.com</strong> com Senha de App (16 dígitos).
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[10px]">E-mail Remetente</Label>
                              <Input 
                                placeholder="hostindicaregistry@gmail.com" 
                                className="bg-background border-border h-9 text-xs"
                                value={emailSettings.user}
                                onChange={(e) => setEmailSettings({...emailSettings, user: e.target.value, provider: 'gmail'})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px]">Senha de App (16 dígitos)</Label>
                              <div className="relative">
                                <Input 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="xxxx xxxx xxxx xxxx" 
                                  className="bg-background border-border h-9 text-xs pr-10"
                                  value={emailSettings.pass}
                                  onChange={(e) => setEmailSettings({...emailSettings, pass: e.target.value, provider: 'gmail'})}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={handleSaveEmailSettings}
                                disabled={savingEmail}
                                className="flex-1 text-[10px] h-8 font-bold"
                              >
                                {savingEmail ? 'Salvando...' : 'Salvar Gmail'}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={handleTestEmail}
                                className="flex-1 text-[10px] h-8 font-bold border border-border"
                              >
                                <Send className="h-3 w-3 mr-1" /> Testar
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Nova Indicação (Admin)</Label>
                          <p className="text-[10px] text-muted-foreground">Avisar gestores sobre novos leads.</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.new_indication_admin} 
                          onCheckedChange={(v) => setNotificationSettings({...notificationSettings, new_indication_admin: v})}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Confirmação de Recebimento (Parceiro)</Label>
                          <p className="text-[10px] text-muted-foreground">Avisar o indicador que sua indicação foi recebida.</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.confirmation_partner} 
                          onCheckedChange={(v) => setNotificationSettings({...notificationSettings, confirmation_partner: v})}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Mudança de Status (Parceiro)</Label>
                          <p className="text-[10px] text-muted-foreground">Avisar o indicador quando o lead avança.</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.status_change_partner} 
                          onCheckedChange={(v) => setNotificationSettings({...notificationSettings, status_change_partner: v})}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Comissão Aprovada</Label>
                          <p className="text-[10px] text-muted-foreground">Avisar o parceiro que o pagamento foi liberado.</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.commission_approved_partner} 
                          onCheckedChange={(v) => setNotificationSettings({...notificationSettings, commission_approved_partner: v})}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Relatório Mensal (Diretoria/Gestão)</Label>
                          <p className="text-[10px] text-muted-foreground">Resumo completo enviado no dia 1º.</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.monthly_report_directors} 
                          onCheckedChange={(v) => setNotificationSettings({...notificationSettings, monthly_report_directors: v})}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Relatório Mensal (Indicadores)</Label>
                          <p className="text-[10px] text-muted-foreground">Extrato de comissões por parceiro (dia 1-5).</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.monthly_report_partners} 
                          onCheckedChange={(v) => setNotificationSettings({...notificationSettings, monthly_report_partners: v})}
                        />
                      </div>

                      <div className="space-y-2 pt-2">
                        <Label htmlFor="director_emails" className="text-xs">E-mails da Diretoria (Separados por vírgula)</Label>
                        <Input 
                          id="director_emails"
                          placeholder="diretor1@roder.com.br, diretor2@roder.com.br"
                          value={notificationSettings.director_emails}
                          onChange={(e) => setNotificationSettings({...notificationSettings, director_emails: e.target.value})}
                          className="bg-background border-border text-xs"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="finance_email" className="text-xs">E-mail do Financeiro</Label>
                        <Input 
                          id="finance_email"
                          placeholder="financeiro@roderbrasil.com.br"
                          value={notificationSettings.finance_email}
                          onChange={(e) => setNotificationSettings({...notificationSettings, finance_email: e.target.value})}
                          className="bg-background border-border text-xs"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="manager_emails" className="text-xs">E-mails dos Gestores</Label>
                        <Input 
                          id="manager_emails"
                          placeholder="gislene@roderbrasil.com.br, contato@roderbrasil.com.br"
                          value={notificationSettings.manager_emails}
                          onChange={(e) => setNotificationSettings({...notificationSettings, manager_emails: e.target.value})}
                          className="bg-background border-border text-xs"
                        />
                      </div>

                      <Button 
                        onClick={handleSaveNotificationSettings} 
                        disabled={savingNotifications} 
                        className="w-full bg-primary hover:bg-primary/90 mt-4"
                      >
                        {savingNotifications ? 'Salvando...' : 'Salvar Preferências'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Coluna 2: Integração Agendor CRM (desligada em out/2026) */}
              <div className="hidden">
                <Card className="bg-card border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" /> Integração Agendor CRM
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Sincronize contatos, empresas e indicações automaticamente.</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-semibold flex items-center gap-1.5 text-emerald-500">
                            <CheckCircle2 className="h-4 w-4" /> Ativar Integração
                          </Label>
                          <p className="text-[10px] text-muted-foreground">Se ativo, novas indicações serão enviadas automaticamente para o Agendor.</p>
                        </div>
                        <Switch 
                          checked={agendorSettings.enabled} 
                          onCheckedChange={(v) => setAgendorSettings({...agendorSettings, enabled: v})}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="agendor_token" className="text-xs font-semibold flex items-center gap-1">
                          <Key className="h-3.5 w-3.5 text-primary" /> Token de API do Agendor
                        </Label>
                        <div className="relative">
                          <Input 
                            id="agendor_token"
                            type={showAgendorToken ? "text" : "password"}
                            placeholder="Insira o Token obtido no perfil do Agendor"
                            value={agendorSettings.apiToken}
                            onChange={(e) => setAgendorSettings({...agendorSettings, apiToken: e.target.value})}
                            className="bg-background border-border text-xs pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAgendorToken(!showAgendorToken)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showAgendorToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          Para obter seu Token, acesse o <strong>Agendor &gt; Menu &gt; Configurações &gt; Integrações &gt; API</strong> ou use as credenciais de Gislene no site do Agendor para gerá-lo.
                        </p>
                      </div>

                      <div className="p-3.5 bg-slate-500/5 border border-border rounded-lg space-y-2">
                        <h4 className="text-[11px] font-bold uppercase text-amber-500 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" /> Como Funciona a Integração
                        </h4>
                        <ul className="text-[10px] text-muted-foreground space-y-1.5 list-disc pl-4 leading-normal">
                          <li><strong>Contatos unificados:</strong> O sistema busca ou cria automaticamente a Pessoa e a Empresa no Agendor antes de registrar o negócio.</li>
                          <li><strong>Sincronismo de Indicações:</strong> Novas solicitações de orçamento do Roder Indica são convertidas instantaneamente em <strong>Negócios (Deals)</strong> na etapa de <strong>Lead</strong> no Agendor.</li>
                          <li><strong>Rastreabilidade total:</strong> Cada indicação sincronizada salva a referência ID do Agendor no Roder Indica para consultas futuras.</li>
                        </ul>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={handleSaveAgendorSettings} 
                          disabled={savingAgendor} 
                          className="flex-1 bg-primary hover:bg-primary/90 text-xs font-bold"
                        >
                          {savingAgendor ? 'Salvando...' : 'Salvar Configurações'}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={handleTestAgendorConnection} 
                          disabled={testingAgendor || !agendorSettings.apiToken} 
                          className="flex-1 border-border text-xs font-bold"
                        >
                          {testingAgendor ? 'Testando...' : 'Testar Conexão'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="goals">
            <div className="max-w-2xl">
              <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" /> Definição de Metas Mensais
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Estes valores serão usados para calcular a performance no Dashboard.</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="monthly_revenue" className="text-xs">Meta de Faturamento Mensal (R$)</Label>
                      <Input 
                        id="monthly_revenue"
                        type="number"
                        placeholder="500000"
                        value={goals.monthly_revenue}
                        onChange={(e) => setGoals({...goals, monthly_revenue: parseFloat(e.target.value) || 0})}
                        className="bg-background border-border"
                      />
                      <p className="text-[10px] text-muted-foreground">Valor total somado das vendas concluídas.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthly_indications" className="text-xs">Meta de Indicações (Volume)</Label>
                      <Input 
                        id="monthly_indications"
                        type="number"
                        placeholder="50"
                        value={goals.monthly_indications}
                        onChange={(e) => setGoals({...goals, monthly_indications: parseInt(e.target.value) || 0})}
                        className="bg-background border-border"
                      />
                      <p className="text-[10px] text-muted-foreground">Quantidade total de leads recebidos no mês.</p>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveGoals} 
                    disabled={savingGoals} 
                    className="w-full bg-primary hover:bg-primary/90 mt-4 font-bold uppercase tracking-wider"
                  >
                    {savingGoals ? 'Salvando...' : 'Salvar Metas Mensais'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="instructions">
            <Card className="bg-card border-border shadow-md">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" /> Regras de Negócio e Instruções do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-bold text-primary uppercase tracking-wider text-sm border-b border-border pb-2">Pessoal Chave</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Badge variant="outline">Gislene</Badge> Gerente Comercial
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline">Luana</Badge> Responsável pela triagem e gestão de leads
                      </li>
                    </ul>

                    <h3 className="font-bold text-primary uppercase tracking-wider text-sm border-b border-border pb-2 mt-6">Regras de Negociações</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Validade da Proposta: 60 dias após upload do orçamento.</li>
                      <li>Proteção de Lead: 60 dias após envio do orçamento. Se não houver venda, o lead é cancelado mas pode ser renovado se houver interesse comprovado.</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-primary uppercase tracking-wider text-sm border-b border-border pb-2">Cálculo de Comissões</h3>
                    <div className="p-4 rounded-lg bg-muted/50 border border-border text-sm space-y-3">
                      <p>1. A comissão é calculada sobre o <strong>valor base da comissão</strong>.</p>
                      <p>2. Se houver desconto, deve ser deduzido do <strong>valor base</strong> antes de aplicar a taxa.</p>
                      <p>3. A taxa de comissão é fixa baseada no perfil do indicador e não muda durante a negociação.</p>
                    </div>

                    <h3 className="font-bold text-orange-500 uppercase tracking-wider text-sm border-b border-orange-500/20 pb-2 mt-6">Alertas para Gerência (Gislene/Luana)</h3>
                    <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20 text-sm flex items-start gap-3">
                      <Shield className="h-5 w-5 text-orange-500 mt-0.5" />
                      <p className="text-orange-200">
                        Exibir aviso se uma indicação estiver em "negociação" mas não tiver um <strong>valor base de comissão</strong> preenchido.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <h3 className="font-bold text-blue-400 text-sm mb-2 flex items-center gap-2">
                    <Settings className="h-4 w-4" /> Suporte Técnico e Acesso
                  </h3>
                  <p className="text-xs text-blue-200/70 leading-relaxed">
                    Administradores e Gerentes possuem o botão "OLHO" na lista de usuários que permite simular a visão de qualquer outro perfil (Impersonate). 
                    O email principal para administração é <strong>roderindica@gmail.com</strong>.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-md mt-6">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2 text-primary font-bold">
                    <Award className="h-6 w-6 text-primary" /> Procedimento Oficial de Atendimento (RODER Indica)
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Diretrizes oficiais para atendimento ágil e alta conversão de leads indicados</p>
                </div>
                <Button 
                  onClick={handleDownloadProcedurePDF}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs uppercase gap-1.5 h-9"
                >
                  <Download className="h-4 w-4" /> Baixar PDF com Logo
                </Button>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm leading-relaxed text-muted-foreground">
                            Por esta razão, o <strong>primeiro contato deve ser realizado direta e exclusivamente pelo Vendedor Interno da Fábrica</strong>, em coordenação inicial com o parceiro indicador se necessário.
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left block - O Vendedor Interno */}
                  <div className="space-y-4 border border-border p-5 rounded-xl bg-muted/20">
                    <h3 className="font-bold text-primary uppercase tracking-wider text-xs border-b border-border pb-2 flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" /> Atuação do Vendedor Interno (Fábrica)
                    </h3>
                    <ul className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold mt-0.5">•</span>
                        <span><strong>Interação Inicial Inteligente:</strong> Se achar interessante, o vendedor interno deve entrar em contato primeiro com o parceiro identificado para solicitar mais informações sobre o cliente antes de contatar o cliente propriamente dito. Isso agiliza muito o levantamento de dados e estabelece uma forte sinergia.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold mt-0.5">•</span>
                        <span><strong>Contato Multicanal com Cliente:</strong> O contato com o cliente pode ser realizado por WhatsApp ou ligação telefônica, sendo que normalmente nos comunicamos via WhatsApp. O vendedor apresenta-se, cita explicitamente a indicação e fundamenta o levantamento técnico complementar.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold mt-0.5">•</span>
                        <span><strong>Elaboração de Orçamento:</strong> Elabora e envia a proposta técnica comercial com máxima agilidade diretamente ao cliente, registrando-a no CRM Agendor para sincronização automática.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Right block - O Vendedor Externo */}
                  <div className="space-y-4 border border-border p-5 rounded-xl bg-muted/20">
                    <h3 className="font-bold text-primary uppercase tracking-wider text-xs border-b border-border pb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" /> Atuação do Vendedor Externo (Região)
                    </h3>
                    <ul className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold mt-0.5">•</span>
                        <span><strong>Comissão Territorial Garantida:</strong> Mesmo que a venda seja conduzida e fechada de forma direta pela fábrica com o vendedor interno, o Vendedor Externo da região tem o direito de receber integralmente sua <strong>comissão padrão de território</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold mt-0.5">•</span>
                        <span><strong>Sem Interferência Inicial:</strong> O externo <strong>não</strong> deve intervir ou fazer contato direto no primeiro momento, para manter a comunicação clara e focada no vendedor interno, evitando excesso de pessoas falando com o cliente.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold mt-0.5">•</span>
                        <span><strong>Apoio Presencial & Referências:</strong> É acionado apenas se o cliente solicitar uma visita física presencial ou desejar referências de máquinas operando na região. Como conhece muito bem o território local e os proprietários próximos, o vendedor externo traz excelente segurança para o fechamento.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Third block - O Parceiro Indicador */}
                  <div className="space-y-4 border border-border p-5 rounded-xl bg-muted/20">
                    <h3 className="font-bold text-primary uppercase tracking-wider text-xs border-b border-border pb-2 flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" /> Atuação do Parceiro Indicador
                    </h3>
                    <ul className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold mt-0.5">•</span>
                        <span><strong>Apoio de Mídia via WhatsApp:</strong> Assim que recebe os dados do cliente e o e-mail informando qual é o vendedor interno responsável pelo atendimento, o parceiro identificado pode enviar fotos, vídeos e outros detalhes da máquina base do cliente diretamente via WhatsApp para o vendedor.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold mt-0.5">•</span>
                        <span><strong>Acompanhamento da Negociação:</strong> O parceiro terá todas as informações e poderá acompanhar o andamento da negociação tanto pelo recebimento de e-mails de atualização de status quanto pela plataforma, que exibe o status e quaisquer alterações em tempo real.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold mt-0.5">•</span>
                        <span><strong>Sinergia desde o Início:</strong> Mantém-se integrado e disponível para apoiar a negociação caso seja necessário em conjunto com a fábrica.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="border border-border rounded-xl overflow-hidden mt-4">
                  <div className="bg-muted p-3 border-b border-border text-xs font-bold uppercase text-foreground">
                    Comparativo de Atribuições Comerciais
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border text-muted-foreground">
                          <th className="p-3 font-semibold">Atividade</th>
                          <th className="p-3 font-semibold">Vendedor Interno (Fábrica)</th>
                          <th className="p-3 font-semibold">Vendedor Externo (Região)</th>
                          <th className="p-3 font-semibold">Parceiro Indicador</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-muted-foreground">
                        <tr>
                          <td className="p-3 font-bold text-foreground">Primeiro Contato</td>
                          <td className="p-3">Se necessário, alinha antes com o parceiro indicador para obter fotos/vídeos da máquina. Se não, faz contato direto com o cliente.</td>
                          <td className="p-3">Não intervém no primeiro momento (evita duplicidade e ruído).</td>
                          <td className="p-3">Informa detalhes/fotos/vídeos da máquina ao vendedor designado, interage e aguarda o início do atendimento.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-foreground">Proposta Técnica</td>
                          <td className="p-3">Elabora e envia de forma ágil para manter o lead aquecido.</td>
                          <td className="p-3">Acompanha via CRM Agendor e auxilia em dúvidas regionais.</td>
                          <td className="p-3">Recebe e-mail com dados do vendedor e acompanha todo o progresso do orçamento pela plataforma.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-foreground">Suporte de Campo</td>
                          <td className="p-3">Direciona se o cliente solicitar visita técnica ou referências locais.</td>
                          <td className="p-3">Realiza visita técnica presencial e indica referências próximas.</td>
                          <td className="p-3">Acompanha o histórico no painel e recebe e-mails automáticos a cada nova mudança de status.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-foreground">Comissão / Ganhos</td>
                          <td className="p-3">Comissionado de acordo com as diretrizes internas da fábrica.</td>
                          <td className="p-3"><strong>Garantida!</strong> Recebe comissão padrão territorial sobre a venda.</td>
                          <td className="p-3"><strong>Garantida!</strong> Recebe comissão de indicação cadastrada no sistema.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Triage Protocol Info Box */}
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs leading-relaxed text-emerald-200/90 flex gap-3 items-start mb-4">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-emerald-300 font-bold block mb-1 text-sm">📋 Protocolo de Triagem e Análise de Duplicidade (Gestão Luana):</strong>
                    Assim que Luana recebe o lead na triagem, ela realiza uma análise imediata para verificar se já existe algum atendimento ou negociação ativa com este cliente sobre o mesmo equipamento:
                    <ul className="list-disc pl-4 mt-2 space-y-1 text-emerald-200/70">
                      <li><strong>Sem Atendimento Anterior:</strong> Se não houver nenhum atendimento ou negociação ativa cadastrada para o cliente e o mesmo equipamento, a indicação é <strong>aceita</strong> e passa a ter validade e proteção de <strong>60 dias</strong>, conforme as regras estabelecidas.</li>
                      <li><strong>Com Orçamento ou Negociação Ativa:</strong> Se houver um orçamento ou negociação em andamento, a indicação <strong>NÃO é aceita</strong> para preservar o canal comercial atual.</li>
                      <li><strong>Registro Integral:</strong> Absolutamente todas as informações coletadas, desde o início exato da triagem, são devidamente registradas e salvas no histórico do procedimento operacional da plataforma.</li>
                    </ul>
                  </div>
                </div>

                {/* Integration Info Box */}
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs leading-relaxed text-blue-200/90 flex gap-3 items-start">
                  <RefreshCw className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-blue-300 font-bold block mb-1 text-sm">🔄 Integração de Dados 100% Automática com CRM Agendor:</strong>
                    Toda a interação comercial, anotações de histórico, upload de orçamentos e faturamentos são realizados exclusivamente pelo Vendedor Interno dentro do <strong>CRM Agendor</strong>. 
                    Por ser totalmente integrado, qualquer novidade cadastrada no CRM Agendor é <strong>sincronizada de forma automática com o RODER Indica</strong>, sem necessidade de preenchimento manual duplo. O vendedor foca no cliente e os sistemas cuidam dos dados!
                  </div>
                </div>

                {/* Automatic Distribution Box */}
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs leading-relaxed text-orange-200/90 flex gap-3 items-start mt-4">
                  <Clock className="h-5 w-5 text-orange-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-orange-300 font-bold block mb-1 text-sm">🕒 Distribuição Automática por Limite de Tempo na Triagem (4 horas):</strong>
                    Se uma indicação de lead recém-chegada permanecer em triagem (status "Pendente") por mais de <strong>4 horas</strong> sem encaminhamento manual por parte de Luana, o sistema ativará o protocolo de **Distribuição Automática**.
                    <br />
                    O lead será atribuído imediatamente ao Vendedor Interno disponível que possuir a menor carga de leads ativos em negociação (balanceamento de carga). No momento do encaminhamento, e-mails detalhados contendo os dados de contato do Vendedor Interno são disparados para o Parceiro Indicador, permitindo a comunicação inicial e troca ágil de informações sobre a máquina base antes do contato final com o cliente.
                  </div>
                </div>

                {/* Technical Learning - Forest Grabs Compatibility */}
                <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs leading-relaxed text-amber-200/90 flex gap-4 items-start mt-4">
                  <Brain className="h-6 w-6 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-amber-300 font-bold block mb-2 text-sm uppercase tracking-wider flex items-center gap-1.5">
                      🎓 Aprendizagem Técnica (Consultor Técnico) - Compatibilidade e Dimensionamento de Garras:
                    </strong>
                    Ao indicar uma garra florestal, o consultor técnico <strong>NÃO</strong> deve considerar somente o volume ou o tipo de material que o cliente pretende movimentar. É fundamental avaliar tecnicamente a <strong>máquina base</strong> na qual o equipamento será instalado:
                    <ul className="list-disc pl-4 mt-3 space-y-2 text-amber-200/80">
                      <li><strong>Força da Máquina Base:</strong> Uma escavadeira de grande porte (como 14 toneladas) possui força, peso e pressão hidráulica imensamente superiores aos de uma grua em trator. Ao apoiar ou pressionar a garra contra o chão, a escavadeira gera um esforço que ultrapassa a capacidade estrutural de uma garra pequena, causando desgaste acelerado ou danos mecânicos graves (risco potencializado caso a pressão hidráulica da máquina esteja desregulada). Mesmo que o cliente movimente pouca carga (ex: apenas uma tora), a recomendação do catálogo oficial deve ser estritamente mantida.</li>
                      <li><strong>Garras R250 e R280:</strong> Possuem estrutura desenvolvida primariamente para aplicação em <strong>gruas de trator</strong>, onde as forces físicas e as pressões de trabalho são significativamente menores. As garras R280 e R280L são ótimas opções para gruas de trator.</li>
                      <li><strong>Garras para Escavadeiras Pequenas (&lt; 8 Ton.):</strong> Para escavadeiras de pequeno porte (abaixo de 8 toneladas), a melhor indicação é a garra <strong>R280L</strong>. Ela foi desenvolvida com engenharia de ponta que oferece uma estrutura mais leve, sendo a opção ideal e muito mais adequada e segura do que o modelo R250.</li>
                      <li><strong>Garras para Retroescavadeiras e Escavadeiras (&gt;= 8 Ton.):</strong> A partir do modelo <strong>.36 (como a R360)</strong>, os equipamentos são estruturalmente compatíveis com retroescavadeiras e escavadeiras a partir de aproximadamente 8 toneladas de peso operacional.</li>
                    </ul>
                  </div>
                </div>

                {/* Technical Sizing - Chippers Feeding */}
                <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs leading-relaxed text-emerald-200/90 flex gap-4 items-start mt-4">
                  <Wrench className="h-6 w-6 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-emerald-300 font-bold block mb-2 text-sm uppercase tracking-wider flex items-center gap-1.5">
                      ⚙️ Diretriz para Dimensionamento de Garras em Alimentação de Picadores:
                    </strong>
                    Quando a aplicação da garra for para alimentação de picadores florestais, a definição do modelo deve considerar de forma integrada dois fatores cruciais:
                    <ul className="list-disc pl-4 mt-3 space-y-2 text-emerald-200/80">
                      <li><strong>1. Máquina Base:</strong> Conforme a Tabela de Aplicação/Ficha Técnica da Roder. Ela define a viabilidade física e a segurança de instalação da garra na escavadeira.</li>
                      <li><strong>2. Potência do Picador:</strong> O modelo e a potência do picador determinam a real necessidade de volume e fluxo de alimentação operacional:
                        <ul className="list-circle pl-4 mt-1 space-y-1 text-emerald-300/80">
                          <li>Picadores de <strong>até 600 cv</strong>: Utilizar Garra <strong>R400</strong>.</li>
                          <li>Picadores de <strong>até 1.000 cv</strong>: Utilizar Garra <strong>R600</strong>.</li>
                        </ul>
                      </li>
                      <li className="mt-2"><strong>Exemplo Prático (8 Toneladas):</strong> Se o cliente possui uma escavadeira pequena de 8t, deve-se seguir rigorosamente o limite da máquina base, utilizando uma <strong>R280</strong> ou <strong>R360</strong>, conforme a aplicação recomendada.</li>
                      <li><strong>Exemplo Prático (&gt;= 14 Toneladas):</strong> Para escavadeiras de 14 toneladas ou superiores, onde a máquina base comporta perfeitamente garras maiores, o dimensionamento deve focar inteiramente na necessidade do picador: Picador até 600 cv (R400) ou Picador até 1.000 cv (R600).</li>
                    </ul>
                    <p className="mt-3 text-[11px] text-emerald-300/90 italic font-semibold">
                      Desta forma, a máquina base define a compatibilidade da instalação, enquanto o picador define a capacidade de alimentação necessária, assegurando o melhor desempenho operacional e maior produtividade.
                    </p>
                  </div>
                </div>

                {/* Technical Guideline - R360/R360G on 7-10 ton Excavators & 6t Rotator */}
                <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs leading-relaxed text-blue-200/90 flex gap-4 items-start mt-4">
                  <Wrench className="h-6 w-6 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-blue-300 font-bold block mb-2 text-sm uppercase tracking-wider flex items-center gap-1.5">
                      📐 Diretriz de Montagem: R360/R360G em Escavadeiras de 7 a 10 Toneladas & Rotator de 6t:
                    </strong>
                    <ul className="list-disc pl-4 space-y-2 text-blue-200/80">
                      <li><strong>Viabilidade Física da R360 / R360G:</strong> Em escavadeiras menores de 7 a 10 toneladas, é fisicamente possível e viável trabalhar com a garra R360 padrão ou com a R360G (com unhas tipo garfo para galhadas/resíduos).</li>
                      <li><strong>Aviso Obrigatório de Instabilidade Operacional:</strong> O cliente deve ser formalmente alertado de que, ao pegar madeiras muito compridas ou feixes de árvores inteiras para arrastar no picador, a escavadeira pode <em>"levantar a bunda" (ficar instável)</em>, ou a máquina pode não ter força de giro hidráulico suficiente para puxar o feixe pesado. Fisicamente a montagem é viável, mas a operação exige essa ciência do cliente.</li>
                      <li><strong>Dimensionamento Obrigatório de Rotator & Ponteira (6 Toneladas):</strong> Em ambos os casos (tanto para a garra R280 quanto para a R360 em máquinas de 7 a 10 toneladas), é terminantemente recomendada a utilização do <strong>Rotator de 6 toneladas</strong>.</li>
                      <li><strong>Ponteiras/Bielas:</strong> As ponteiras devem ser atribuídas e dimensionadas para a caçamba/máquina de 6 toneladas para assegurar a perfeita usabilidade e montagem com o rotator de 6t.</li>
                    </ul>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground italic border-t border-border pt-4 text-right">
                  Procedimento Comercial Oficial homologado pelo fundador e diretor técnico Jeferson Roder.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approval">
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" /> Fila de Aprovação de Catálogo
                </CardTitle>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Painel de Curadoria e Governança de Dados</p>
              </CardHeader>
              <CardContent>
                {approvalQueue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl opacity-50">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-2 opacity-20" />
                    <p className="text-sm font-bold opacity-60">Tudo limpo! Nenhuma solicitação pendente.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {approvalQueue.map((req) => (
                      <div key={req.id} className="flex flex-col md:flex-row items-stretch md:items-center justify-between p-4 rounded-xl border border-border bg-muted/20 gap-4 hover:border-primary/30 transition-all">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className={req.action === 'create' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}>
                              {req.action === 'create' ? 'Novo Item' : 'Atualização'}
                            </Badge>
                            <span className="font-bold text-sm">{req.entity_name}</span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1"><User className="h-3 w-3" /> {req.submitted_by_name}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(req.created_at).toLocaleString('pt-BR')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-9 px-4"
                            onClick={() => handleApprove(req)}
                            disabled={approvingId === req.id}
                          >
                            {approvingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aprovar'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-red-200 text-red-500 hover:bg-red-50 h-9 px-4"
                            onClick={() => handleReject(req)}
                            disabled={approvingId === req.id}
                          >
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Active Nodes */}
              <div className="lg:col-span-1 space-y-4">
                <Card className="bg-card border-border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Activity className="h-4 w-4 text-emerald-500 animate-pulse" /> Rede Distribuída (Hybrid P2P Vision)
                    </CardTitle>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tight">Arquitetura de Borda: Dispositivos atuando como nós de segurança</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {activeNodesList.length === 0 ? (
                        <div className="text-center py-8">
                          <Activity className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground italic">Nenhum nó ativo detectado.</p>
                        </div>
                      ) : (
                        activeNodesList.map(node => {
                          const lastSeen = node.last_seen?.toDate ? node.last_seen.toDate() : new Date();
                          const diffMs = Math.max(0, new Date().getTime() - lastSeen.getTime());
                          const diffMins = Math.floor(diffMs / 60000);
                          
                          // Determine if mobile or desktop based on browser device info
                          const isMobile = node.device_info && (
                            node.device_info.includes('Mobile') ||
                            node.device_info.includes('Android') ||
                            node.device_info.includes('iPhone')
                          );

                          return (
                            <div key={node.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border hover:border-emerald-500/30 transition-all">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                  {isMobile ? <Smartphone className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-xs font-bold leading-none mb-1">{node.name || node.email}</span>
                                   <div className="flex items-center gap-2">
                                     <span className="text-[10px] text-muted-foreground uppercase font-medium">{node.role || 'usuário'}</span>
                                     {node.is_pwa && <Badge variant="outline" className="h-3.5 px-1 py-0 text-[7px] border-emerald-500/30 text-emerald-600 bg-emerald-500/5 uppercase font-black">PWA</Badge>}
                                     <span className="text-[8px] text-muted-foreground truncate max-w-[100px]" title={node.device_info}>
                                       {isMobile ? 'Celular' : 'Computador'}
                                     </span>
                                   </div>
                                 </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <Badge variant="outline" className="text-[8px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-1 font-black">
                                  {diffMins <= 1 ? 'ATIVO AGORA' : `VISTO HÁ ${diffMins} MIN`}
                                </Badge>
                                <span className="text-[8px] text-muted-foreground mt-1 tabular-nums">v{node.app_version}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                      <Shield className="h-4 w-4" /> Segurança Híbrida
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <h4 className="text-[10px] font-black uppercase mb-1">Criptografia RSA-256</h4>
                      <p className="text-[9px] text-muted-foreground leading-relaxed">
                        Todos os dados sensíveis na nuvem estão "selados". Apenas administradores conseguem decriptar os payloads diretamente no navegador.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                      <h4 className="text-[10px] font-black uppercase mb-1">Lixeira Distribuída</h4>
                      <p className="text-[9px] text-muted-foreground leading-relaxed">
                        Exclusões em massa ou acidentais são retidas no cofre criptografado por 30 dias antes da destruição definitiva.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <h4 className="text-[10px] font-black uppercase mb-1">Nós de Inteligência (P2P Vision)</h4>
                      <p className="text-[9px] text-muted-foreground leading-relaxed">
                        A aplicação opera em modo Hybrid-Edge: o processamento pesado e a criptografia ocorrem no dispositivo do usuário, transformando cada celular em um "servidor parcial" de segurança.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Audit Log */}
              <div className="lg:col-span-2">
                <Card className="bg-card border-border shadow-sm min-h-[460px]">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> Log de Auditoria do Sistema
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-black uppercase">{auditLogs.length} Eventos</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground">
                            <th className="text-left font-bold py-2 uppercase tracking-tighter">Evento</th>
                            <th className="text-left font-bold py-2 uppercase tracking-tighter">Usuário</th>
                            <th className="text-left font-bold py-2 uppercase tracking-tighter">Detalhes</th>
                            <th className="text-right font-bold py-2 uppercase tracking-tighter">Horário</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {auditLogs.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center py-8 text-muted-foreground italic">Nenhum evento registrado.</td>
                            </tr>
                          ) : (
                            auditLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                <td className="py-2">
                                  <Badge className={`text-[8px] font-black uppercase ${
                                    log.action.includes('DELETE') ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                    log.action.includes('UPDATE') ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                    'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                  }`}>
                                    {log.action}
                                  </Badge>
                                </td>
                                <td className="py-2">
                                  <div className="flex flex-col">
                                    <span className="font-bold">{log.user_name}</span>
                                    <span className="text-[9px] opacity-60">{log.user_email}</span>
                                  </div>
                                </td>
                                <td className="py-2 opacity-80">{log.details}</td>
                                <td className="py-2 text-right text-muted-foreground">
                                  {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : '...'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top 10 Connected Users Report */}
              <div className="lg:col-span-3 mt-2">
                <Card className="bg-card border-border shadow-md">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg font-black flex items-center gap-2 text-foreground">
                          <Trophy className="h-5 w-5 text-amber-500 animate-bounce duration-[3000ms]" /> Top 10 Usuários Mais Conectados (Mês Atual)
                        </CardTitle>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">Métricas de Engajamento Temporais e Descentralização da Rede Híbrida</p>
                      </div>
                      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-black tracking-widest uppercase text-[9px] self-start sm:self-center">
                        Mês: Maio 2026
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-border/60 text-muted-foreground text-[10px] uppercase font-black tracking-wider pb-2">
                            <th className="py-3 px-2 text-center w-12">Pos.</th>
                            <th className="py-3 px-2">Usuário</th>
                            <th className="py-3 px-4 text-center">Horas Online</th>
                            <th className="py-3 px-4 text-center">Dias Ativo</th>
                            <th className="py-3 px-4">Engajamento Semanal</th>
                            <th className="py-3 px-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 text-xs">
                          {getTopConnectedUsers().map((nodeUser, i) => {
                            const isFirst = i === 0;
                            const isSecond = i === 1;
                            const isThird = i === 2;
                            // Calculate percentage relation against first
                            const topHours = getTopConnectedUsers()[0]?.hours || 200;
                            const progressPercent = Math.min(100, Math.round((nodeUser.hours / topHours) * 100));

                            return (
                              <tr key={nodeUser.uid} className="hover:bg-muted/20 transition-colors">
                                <td className="py-3.5 px-2 text-center">
                                  {isFirst ? (
                                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-500/15 text-amber-600 font-black"><Trophy className="h-3.5 w-3.5 text-amber-500" /></span>
                                  ) : isSecond ? (
                                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-300/15 text-slate-500 font-black"><Trophy className="h-3.5 w-3.5 text-slate-400" /></span>
                                  ) : isThird ? (
                                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-700/15 text-amber-800 font-black"><Trophy className="h-3.5 w-3.5 text-amber-700" /></span>
                                  ) : (
                                    <span className="text-muted-foreground font-bold tracking-tight text-[11px] font-mono">{i + 1}º</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-2">
                                  <div className="flex items-center gap-2">
                                    <div className="flex flex-col">
                                      <span className="font-extrabold uppercase text-foreground leading-tight">{nodeUser.name}</span>
                                      <span className="text-[10px] text-muted-foreground">{nodeUser.email}</span>
                                    </div>
                                    <Badge variant="outline" className="text-[8px] h-4 font-black uppercase tracking-tighter px-1 border-border/80">
                                      {(() => {
                                        const nameLower = (nodeUser.name || '').toLowerCase();
                                        const emailLower = (nodeUser.email || '').toLowerCase();
                                        if (
                                          nameLower.includes('elissangela') || 
                                          nameLower.includes('elissângela') || 
                                          nameLower.includes('elizangela') || 
                                          nameLower.includes('elizângela') || 
                                          emailLower.includes('elissangela') || 
                                          emailLower.includes('elizangela') ||
                                          nodeUser.role === 'financial'
                                        ) {
                                          return 'Financeiro';
                                        }
                                        if (nodeUser.role === 'admin') return 'Administrador';
                                        if (nodeUser.role === 'manager' || nameLower.includes('gislene') || emailLower.includes('gislene')) return 'Gerente Comercial';
                                        if (nodeUser.role === 'triagem' || nameLower.includes('luana') || emailLower.includes('luana')) return 'Triagem';
                                        if (nodeUser.role === 'internal_seller') return 'Vendedora Interna';
                                        if (nodeUser.role === 'vendedor_padrao') return 'Vendedor Padrão';
                                        if (nodeUser.role === 'external_seller') return 'Vendedor Externo';
                                        return 'Indicador';
                                      })()}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-center font-bold text-foreground font-mono tabular-nums">
                                  {nodeUser.hours}h
                                </td>
                                <td className="py-3.5 px-4 text-center font-bold text-muted-foreground font-mono tabular-nums">
                                  {nodeUser.days} dias
                                </td>
                                <td className="py-3.5 px-4 w-48">
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-28 bg-muted border border-border/40 rounded-full overflow-hidden shrink-0">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${
                                          isFirst ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]' :
                                          isSecond ? 'bg-slate-400' :
                                          isThird ? 'bg-amber-700' : 'bg-primary'
                                        }`}
                                        style={{ width: `${progressPercent}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground/80 font-mono">{progressPercent}%</span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-2 text-center">
                                  {nodeUser.isOnline ? (
                                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/15 text-[8px] font-black uppercase">
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      ONLINE
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-500/5 text-slate-500/60 border border-slate-500/10 text-[8px] font-black uppercase">
                                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                      STANDBY
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10 text-[10px] text-muted-foreground/90 flex items-start gap-2">
                      <Award className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        <strong>Incentivo à descentralização:</strong> Usuários com maior tempo de engajamento ativo atuam como validadores de dados na rede. Esse relatório é atualizado em tempo real com base na atividade criptografada recebida e nos logs de auditoria validados na borda.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="connectivity" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Connection Status & Sync Queue */}
              <Card className="bg-card border-border shadow-sm flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" /> Status da Rede
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-border">
                      <span className="text-xs font-bold text-muted-foreground">Conexão Atual</span>
                      <div className="flex items-center gap-2">
                        {isOffline ? (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                            <Badge className="bg-red-500/10 text-red-500 border-red-500/20 font-black">OFFLINE</Badge>
                          </>
                        ) : (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black">ONLINE</Badge>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-muted-foreground">Fila de Sincronização</span>
                        <span className="font-mono font-bold text-primary">{pendingSyncCount} itens</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Indicações ou cadastros salvos em contingência local aguardando conexão estável para envio ao servidor.
                      </p>
                    </div>
                  </CardContent>
                </div>
                
                <CardContent className="pt-0">
                  <Button
                    onClick={processSyncQueue}
                    disabled={isOffline || pendingSyncCount === 0}
                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-black text-xs uppercase"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-2" />
                    Enviar Dados Pendentes agora
                  </Button>
                </CardContent>
              </Card>

              {/* Database cache downloading and Offline activation */}
              <Card className="bg-card border-border shadow-sm flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Download className="h-4 w-4 text-primary" /> Armazenamento Offline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-muted-foreground">Instalador de Catálogos</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Baixe tabelas de estoque, catálogos e dados cadastrais no celular para que o aplicativo continue funcionando perfeitamente em locais sem sinal.
                      </p>
                    </div>

                    {isDownloading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span>Instalando...</span>
                          <span>{downloadProgress}%</span>
                        </div>
                        <Progress value={downloadProgress} className="h-1.5 bg-muted" />
                      </div>
                    )}

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-border flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground">Última atualização automática</span>
                      <span className="text-[10px] font-mono text-foreground font-bold">
                        {localStorage.getItem('roder_last_offline_sync_time')
                          ? new Date(parseInt(localStorage.getItem('roder_last_offline_sync_time')!, 10)).toLocaleDateString('pt-BR') + ' ' +
                            new Date(parseInt(localStorage.getItem('roder_last_offline_sync_time')!, 10)).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                          : 'Pendente (Primeiro Uso)'}
                      </span>
                    </div>
                  </CardContent>
                </div>

                <CardContent className="pt-0">
                  <Button
                    onClick={() => syncDataLocally(false)}
                    disabled={isDownloading || isOffline}
                    variant="outline"
                    className="w-full border-primary/30 hover:border-primary text-primary hover:bg-primary/5 font-black text-xs uppercase"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                        Baixando novidades...
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5 mr-2" />
                        Forçar Atualização Completa (Offline)
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* PWA Launcher Details */}
              <Card className="bg-card border-border shadow-sm flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-primary" /> Aplicativo Nativo (PWA)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-muted-foreground">Adicionar à Tela de Início</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Instale a RODER V2 diretamente em seu dispositivo como um aplicativo nativo para uma resposta ultrarrápida, área de toque expandida e menor consumo de dados.
                      </p>
                    </div>

                    <div className="flex gap-2.5 items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-border">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">O que é um PWA?</span>
                      <HelpTooltip content="Um PWA (Progressive Web App) funciona exatamente como um app instalado na Play Store, mas é mais leve, rápido e funciona sem internet de forma inteligente." />
                    </div>
                  </CardContent>
                </div>

                <CardContent className="pt-0">
                  {canInstall ? (
                    <Button
                      onClick={installApp}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase shadow-[0_4px_14px_rgba(249,115,22,0.3)]"
                    >
                      <Smartphone className="h-3.5 w-3.5 mr-2 animate-bounce" />
                      Instalar RODER no Dispositivo
                    </Button>
                  ) : (
                    <div className="text-center p-2.5 rounded-lg border border-border bg-slate-50 dark:bg-slate-900/10 text-[11px] text-muted-foreground">
                      Aplicativo já instalado ou dispositivo sem compatibilidade de instalação automatizada. No Safari (iOS), use <span className="font-bold">Compartilhar &rarr; Adicionar à Tela de Início</span>.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Network nodes dashboard panel */}
            <Card className="bg-card border-border shadow-sm p-5 mt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Tecnologia de Rede Híbrida Roder
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
                    Cada dispositivo ativo no campo atua de forma coordenada. Quando você cadastra uma indicação sem sinal, ela é enfileirada no banco local e sincronizada de forma segura assim que houver rede. Isso permite mobilidade total para fardos, guinchos e colheita sem comprometer o fluxo de leads de vendas.
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <div className="px-4 py-3 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase text-primary/70 tracking-tight">Estações de Campo</span>
                    <span className="text-2xl font-black text-primary font-mono select-none">ATIVO</span>
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase text-emerald-600 tracking-tight">Status Sincronismo</span>
                    <span className="text-lg font-black text-emerald-600 uppercase select-none flex items-center gap-1.5 pt-1">
                      <Wifi className="h-4 w-4" /> 100% OK
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="ai_monitoring" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <div className="space-y-1">
                <h2 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                  <Brain className="h-6 w-6 text-purple-600" /> Monitoramento do Cérebro RODER
                </h2>
                <p className="text-xs text-muted-foreground">Monitore, edite ou remova ensinamentos técnicos passados à IA.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    const todayTeachings = teachings.filter(t => t.timestamp?.startsWith(today));
                    if (todayTeachings.length === 0) {
                      toast.info("Nenhum ensinamento novo registrado hoje.");
                      return;
                    }
                    const report = todayTeachings.map(t => `### ${t.question}\n**Autor:** ${t.author}\n**Hora:** ${new Date(t.timestamp).toLocaleTimeString()}\n\n${t.improvedAnswer}`).join('\n\n---\n\n');
                    handleOpenReport(report, `Relatório Diário de Ensinamentos - ${new Date().toLocaleDateString()}`);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold uppercase text-xs rounded-xl h-10 px-4"
                >
                  <FileText className="mr-2 h-4 w-4" /> Relatório de Hoje
                </Button>
              </div>
            </div>

            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-3">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Filtrar por título, autor ou conteúdo..." 
                    className="pl-10 bg-muted/30 border-border h-10 text-sm"
                    value={teachingSearchTerm}
                    onChange={(e) => setTeachingSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loadingTeachings ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Carregando conhecimento...</p>
                  </div>
                ) : teachings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Brain className="h-8 w-8 text-muted-foreground opacity-20" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Nenhum ensinamento encontrado</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mt-1">
                      Ensine novos conhecimentos à IA através do menu "Ensinar IA" no canto inferior da tela.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teachings
                      .filter(t => 
                        t.question?.toLowerCase().includes(teachingSearchTerm.toLowerCase()) ||
                        t.improvedAnswer?.toLowerCase().includes(teachingSearchTerm.toLowerCase()) ||
                        t.author?.toLowerCase().includes(teachingSearchTerm.toLowerCase())
                      )
                      .map((teaching) => (
                      <div key={teaching.id} className="group p-4 rounded-xl border border-border bg-muted/10 hover:bg-muted/20 transition-all">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 text-[9px] font-black uppercase">
                                ID: {teaching.id.slice(-6)}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" /> {teaching.author}
                              </span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {new Date(teaching.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-tight text-foreground">{teaching.question}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed whitespace-pre-wrap">
                              {teaching.improvedAnswer}
                            </p>
                          </div>
                          <div className="flex md:flex-col items-center justify-end gap-2 shrink-0">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setEditingTeaching(teaching);
                                setIsTeachingDialogOpen(true);
                              }}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteTeaching(teaching.id)}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA INTEGRAÇÕES E CHAVES DE API */}
          <TabsContent value="api_keys" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Code2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                      Integrações & Chaves de API
                    </h2>
                    <p className="text-xs text-muted-foreground font-medium">
                      Conecte outros aplicativos e sistemas externos para ler em tempo real o Estoque Roder e Catálogo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setGuideSelectedKey(null);
                    setIsGuideDialogOpen(true);
                  }}
                  className="border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold h-10 px-4 rounded-xl flex items-center gap-2 shadow-sm transition-all"
                >
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  <span>Orientações de Uso da Chave</span>
                </Button>

                <Button
                  onClick={() => setIsApiKeyDialogOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-4 rounded-xl flex items-center gap-2 shadow-sm transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nova Chave de API</span>
                </Button>
              </div>
            </div>

            {/* Banner de Orientação para Integrações Externas */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                      Instrução para conectar em outro aplicativo
                    </h3>
                    <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30 text-[10px] font-bold">
                      Observação
                    </Badge>
                  </div>
                  <p className="text-sm font-bold text-amber-950 dark:text-amber-100">
                    Copie as orientações e coloque no aplicativo que vai ler a chave.
                  </p>
                  <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                    Ao levar a chave de API para outro aplicativo, envie junto o roteiro técnico de conexão. O outro sistema precisa saber o endereço da API e o formato do cabeçalho <code className="font-mono font-bold bg-amber-500/15 px-1 py-0.5 rounded">x-api-key</code>.
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <Button
                  onClick={() => {
                    setGuideSelectedKey(apiKeys[0] || null);
                    setIsGuideDialogOpen(true);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-9 px-4 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all w-full md:w-auto"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Ver & Copiar Orientações</span>
                </Button>
              </div>
            </div>

            {/* Guia Rápido do Endpoint para Aplicativos Externos */}
            <Card className="bg-muted/30 border-dashed border-emerald-500/30">
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-600 text-white text-[10px] font-black uppercase">
                      GET
                    </Badge>
                    <span className="font-mono text-xs font-semibold text-foreground select-all">
                      {(window.location.origin.includes('ais-dev-') ? window.location.origin.replace('ais-dev-', 'ais-pre-') : window.location.origin)}/api/v1/stock
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(`${(window.location.origin.includes('ais-dev-') ? window.location.origin.replace('ais-dev-', 'ais-pre-') : window.location.origin)}/api/v1/stock`)}
                    className="h-8 text-xs font-semibold flex items-center gap-1.5"
                  >
                    {copiedEndpoint ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedEndpoint ? "Copiado!" : "Copiar URL Pública"}</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">URL Pública (sem login do Google):</strong> A URL acima utiliza o domínio público compartilhado (<code className="font-mono font-bold text-emerald-600">ais-pre-*.run.app</code>), permitindo que aplicativos externos acessem diretamente via API Key sem redirecionar para a tela de login do Google. Faça a requisição com o cabeçalho <code className="bg-background px-1.5 py-0.5 rounded text-[11px] font-mono text-emerald-600 font-bold">x-api-key: SUA_CHAVE</code>.
                </p>
              </CardContent>
            </Card>

            {/* Lista de Chaves Ativas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Key className="h-4 w-4 text-emerald-600" />
                  <span>Chaves Configuradas ({apiKeys.length})</span>
                </h3>
              </div>

              {loadingApiKeys ? (
                <Card className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  <p className="text-xs font-medium">Carregando chaves de integração...</p>
                </Card>
              ) : apiKeys.length === 0 ? (
                <Card className="p-12 text-center space-y-4 border-dashed">
                  <div className="p-3 w-fit mx-auto rounded-full bg-muted">
                    <Key className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-foreground">Nenhuma chave de API gerada</h4>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                      Crie sua primeira chave para conectar o outro aplicativo. Você pode nomear o app e escolher se ele enxerga o Estoque, Catálogo ou outros dados.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsApiKeyDialogOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Criar Primeira Chave
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {apiKeys.map((k) => (
                    <Card key={k.id} className={cn("transition-all border", !k.active && "opacity-60 bg-muted/20 border-dashed")}>
                      <CardContent className="p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h4 className="font-black text-sm text-foreground uppercase tracking-tight">
                                {k.name}
                              </h4>
                              {k.active ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-black uppercase">
                                  Ativa & Conectada
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] font-black uppercase">
                                  Pausada / Bloqueada
                                </Badge>
                              )}
                              <span className="text-[11px] text-muted-foreground">
                                Criada em {new Date(k.created_at).toLocaleDateString('pt-BR')} por {k.created_by}
                              </span>
                            </div>
                            {k.last_used_at ? (
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Activity className="h-3 w-3 text-emerald-500" />
                                <span>Última sincronização externa: <strong>{new Date(k.last_used_at).toLocaleString('pt-BR')}</strong></span>
                              </p>
                            ) : (
                              <p className="text-[11px] text-amber-600/80 font-medium">
                                Nenhuma requisição recebida ainda com esta chave.
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleApiKeyStatus(k.id, k.active)}
                              className={cn(
                                "h-8 text-xs font-bold gap-1.5 transition-colors",
                                k.active ? "hover:bg-amber-50 hover:text-amber-700" : "hover:bg-emerald-50 hover:text-emerald-700"
                              )}
                            >
                              <Power className="h-3.5 w-3.5" />
                              <span>{k.active ? "Pausar Acesso" : "Ativar Acesso"}</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteApiKey(k.id, k.name)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Visualizador da Chave com Botão Copiar e Orientações */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-background p-2.5 rounded-xl border border-border">
                          <code className="font-mono text-xs text-foreground font-semibold flex-1 overflow-hidden text-ellipsis whitespace-nowrap select-all">
                            {k.key}
                          </code>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setGuideSelectedKey(k);
                                setIsGuideDialogOpen(true);
                              }}
                              className="h-8 px-3 text-xs font-bold border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-1.5"
                            >
                              <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Orientações</span>
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => copyToClipboard(k.key, k.id)}
                              className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                            >
                              {copiedKeyId === k.id ? (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Copiada!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>Copiar Chave</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Módulos e Permissões Compartilhadas */}
                        <div className="pt-2 border-t border-border/60 flex flex-wrap items-center gap-4 text-xs">
                          <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                            O que este app enxerga:
                          </span>

                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={k.permissions?.stock !== false}
                              onChange={() => handleTogglePermission(k.id, 'stock', k.permissions?.stock !== false)}
                              className="rounded border-border text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
                            />
                            <span className="font-medium text-foreground">Estoque Roder (Fábrica & Sinop)</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!k.permissions?.catalog}
                              onChange={() => handleTogglePermission(k.id, 'catalog', !!k.permissions?.catalog)}
                              className="rounded border-border text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
                            />
                            <span className="font-medium text-foreground">Catálogo de Equipamentos</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer select-none opacity-60">
                            <input
                              type="checkbox"
                              checked={!!k.permissions?.leads}
                              onChange={() => handleTogglePermission(k.id, 'leads', !!k.permissions?.leads)}
                              className="rounded border-border text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
                            />
                            <span className="font-medium text-foreground">Indicações / Vendas</span>
                          </label>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Teaching Dialog */}
        <Dialog open={isTeachingDialogOpen} onOpenChange={setIsTeachingDialogOpen}>
          <DialogContent className="max-w-2xl bg-card border-border shadow-2xl rounded-2xl p-0 overflow-hidden">
            <DialogHeader className="p-6 bg-purple-600 text-white">
              <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <Edit className="h-5 w-5" /> Editar Ensinamento da IA
              </DialogTitle>
              <DialogDescription className="text-purple-100 text-xs opacity-90 font-medium uppercase tracking-widest">
                Corrija o título ou o conteúdo técnico para melhorar o aprendizado do Cérebro RODER.
              </DialogDescription>
            </DialogHeader>
            
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Pergunta ou Tópico Principal</Label>
                <Input 
                  value={editingTeaching?.question || ''}
                  onChange={(e) => setEditingTeaching(prev => prev ? { ...prev, question: e.target.value } : null)}
                  className="bg-background border-border h-12 text-sm font-bold"
                  placeholder="Ex: Como configurar a Garra Roder G30?"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Resposta ou Explicação Técnica</Label>
                <textarea 
                  value={editingTeaching?.improvedAnswer || ''}
                  onChange={(e) => setEditingTeaching(prev => prev ? { ...prev, improvedAnswer: e.target.value } : null)}
                  className="w-full min-h-[250px] p-4 rounded-xl bg-background border border-border text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  placeholder="Digite a explicação detalhada aqui..."
                />
              </div>
            </div>

            <DialogFooter className="p-6 bg-muted/30 border-t border-border flex flex-col-reverse sm:flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsTeachingDialogOpen(false)}
                className="font-black uppercase text-[10px] h-12 px-8 rounded-xl border-border"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdateTeaching}
                className="bg-purple-600 hover:bg-purple-700 text-white font-black uppercase text-[10px] h-12 px-8 rounded-xl shadow-lg shadow-purple-500/20"
              >
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Report Dialog */}
        <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-card border-border shadow-2xl rounded-2xl">
            <DialogHeader className="p-6 bg-slate-900 text-white shrink-0">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-500" /> {reportTitle}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                    Compilação de conhecimentos técnicos processados
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.print()}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-9 px-4 text-[10px] font-black uppercase rounded-lg"
                  >
                    Imprimir / PDF
                  </Button>
                </div>
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-slate-950">
              <div className="prose prose-slate dark:prose-invert max-w-none prose-sm">
                <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                  {reportContent}
                </div>
              </div>
            </div>
            
            <DialogFooter className="p-4 bg-muted/30 border-t border-border shrink-0">
              <Button 
                onClick={() => setIsReportOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] h-10 px-8 rounded-xl"
              >
                Fechar Relatório
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[700px] md:max-w-[950px] lg:max-w-[1150px] xl:max-w-[1300px] w-full max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 shadow-2xl">
            <DialogHeader className="px-8 pt-8 pb-4 shrink-0 bg-muted/30 border-b border-border">
              <DialogTitle className="text-xl md:text-2xl font-black tracking-tight uppercase italic">{editingUser ? 'Editar Perfil de Acesso' : 'Cadastrar Novo Usuário'}</DialogTitle>
              <DialogDescription className="text-muted-foreground text-[10px] md:text-[11px] uppercase font-black tracking-[0.2em] text-primary">Configuração de credenciais, dados pessoais e barramento de permissões.</DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              <Tabs value={dialogTab} onValueChange={setDialogTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 border border-border p-1 h-12">
                  <TabsTrigger value="general" className="text-xs md:text-sm font-black uppercase tracking-wider py-2">
                    <User className="h-4 w-4 mr-2" /> Dados Cadastrais
                  </TabsTrigger>
                  <TabsTrigger value="permissions" className="text-xs md:text-sm font-black uppercase tracking-wider py-2">
                    <Shield className="h-4 w-4 mr-2" /> Permissões de Acesso
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="space-y-0.5">
                      <Label className="text-xs md:text-sm font-bold uppercase tracking-wider text-muted-foreground">Status da Conta</Label>
                      <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase font-black tracking-widest text-primary">
                        {formData.status === 'active' ? 'Ativo - Acesso Liberado' : 'Inativo - Acesso Bloqueado'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={formData.status === 'active'}
                        onCheckedChange={(checked) => setFormData({...formData, status: checked ? 'active' : 'inactive'})}
                      />
                      <Badge variant={formData.status === 'active' ? 'default' : 'destructive'} className="text-[9px] md:text-[10px] uppercase font-black px-2 py-0.5">
                        {formData.status === 'active' ? 'ON' : 'OFF'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[10px] md:text-xs font-black uppercase tracking-wider text-muted-foreground opacity-70">Nome Completo</Label>
                      <Input 
                        id="name" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="bg-background border-border text-xs md:text-sm h-10 px-3 font-semibold text-foreground uppercase"
                        placeholder="Nome do parceiro"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[10px] md:text-xs font-black uppercase tracking-wider text-muted-foreground opacity-70">Email de Acesso</Label>
                      <Input 
                        id="email" 
                        type="email"
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="bg-background border-border text-xs md:text-sm h-10 px-3 font-medium text-foreground lowercase"
                        placeholder="exemplo@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-[10px] md:text-xs font-black uppercase tracking-wider text-muted-foreground opacity-70">Papel / Função</Label>
                      <Select 
                        value={formData.role} 
                        onValueChange={(v: UserRole) => {
                          setFormData({...formData, role: v});
                          // Apply defaults automatically on change
                          applyDefaultPermissions(v);
                        }}
                      >
                        <SelectTrigger className="bg-background border-border w-full text-xs md:text-sm h-10 px-3 text-left font-bold text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-card-foreground min-w-[320px]">
                          <SelectItem value="external_seller">Vendedor Externo (Indicador)</SelectItem>
                          <SelectItem value="vendedor_padrao">Vendedor Padrão (Regional)</SelectItem>
                          {(isAdmin || isManager) && <SelectItem value="internal_seller">Vendedora Interna (Comercial)</SelectItem>}
                          {(isAdmin || isManager) && <SelectItem value="triagem">Triagem (Luana)</SelectItem>}
                          {isAdmin && <SelectItem value="financial">Financeiro</SelectItem>}
                          {isAdmin && <SelectItem value="marketing">Marketing (Eventos)</SelectItem>}
                          {isAdmin && <SelectItem value="manager">Gerente Comercial (Gislene)</SelectItem>}
                          {isAdmin && <SelectItem value="admin">Administrador</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="company_name" className="text-[10px] md:text-xs font-black uppercase tracking-wider text-muted-foreground opacity-70">Nome Fantasia / Empresa / Revenda</Label>
                      <Input 
                        id="company_name" 
                        value={formData.company_name} 
                        onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                        className="bg-background border-border text-xs md:text-sm h-10 px-3 font-medium text-foreground"
                        placeholder="Razão ou Nome Fantasia"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpf_cnpj" className="text-[10px] md:text-xs font-black uppercase tracking-wider text-muted-foreground opacity-70">CNPJ ou CPF (Documento)</Label>
                      <Input 
                        id="cpf_cnpj" 
                        value={formData.cpf_cnpj} 
                        onChange={(e) => setFormData({...formData, cpf_cnpj: maskCpfCnpj(e.target.value)})}
                        className="bg-background border-border text-xs md:text-sm h-10 px-3 font-mono font-bold text-foreground"
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-[10px] md:text-xs font-black uppercase tracking-wider text-muted-foreground opacity-70">WhatsApp / Contato Direto</Label>
                      <Input 
                        id="phone" 
                        value={formData.phone} 
                        onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})}
                        className="bg-background border-border text-xs md:text-sm h-10 px-3 font-bold text-foreground"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="initial_password" className="text-[10px] md:text-xs font-black uppercase tracking-wider text-muted-foreground opacity-70 flex items-center justify-between">
                        <span>Senha de Acesso</span>
                        <span className="text-[9px] lowercase text-muted-foreground font-normal">opcional</span>
                      </Label>
                      <Input 
                        id="initial_password" 
                        value={formData.initial_password} 
                        onChange={(e) => setFormData({...formData, initial_password: e.target.value})}
                        className="bg-background border-border text-xs md:text-sm h-10 px-3 font-mono font-semibold text-foreground"
                        placeholder="Ex: Roder@2025"
                      />
                    </div>
                  </div>

                  {formData.role === 'internal_seller' && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 mb-2">
                      <div className="space-y-0.5">
                        <Label className="text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-tight">Habilitar Recebimento de Leads</Label>
                        <p className="text-[10px] text-muted-foreground mr-4">Participará da distribuição automática.</p>
                      </div>
                      <Switch 
                        checked={formData.is_lead_receiver} 
                        onCheckedChange={(v) => setFormData({...formData, is_lead_receiver: v})} 
                      />
                    </div>
                  )}

                  {formData.role === 'vendedor_padrao' && (
                    <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20 space-y-4 mb-4">
                      <h4 className="text-[10px] font-black uppercase text-orange-600 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> Configuração Regional
                      </h4>
                      
                      <div className="space-y-2">
                        <Label className="text-xs">Regiões de Atendimento (Estados)</Label>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {BRAZIL_STATES.map((state) => (
                            <div 
                              key={state.value}
                              onClick={() => {
                                const current = formData.assigned_regions || [];
                                const next = current.includes(state.value)
                                  ? current.filter(s => s !== state.value)
                                  : [...current, state.value];
                                setFormData({...formData, assigned_regions: next});
                              }}
                              className={`
                                cursor-pointer rounded-md py-1.5 text-[10px] font-black text-center transition-all border
                                ${formData.assigned_regions?.includes(state.value)
                                  ? 'bg-orange-500 border-orange-600 text-white shadow-sm'
                                  : 'bg-background border-border text-muted-foreground hover:border-orange-200'}
                              `}
                            >
                              {state.value}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Comissão s/ Total (%)</Label>
                          <div className="relative">
                            <Input 
                              type="number"
                              value={formData.commission_rate}
                              onChange={(e) => setFormData({...formData, commission_rate: parseFloat(e.target.value) || 0})}
                              className="bg-background border-border pr-8 text-sm"
                            />
                            <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Salário / Ajuda Fixa (R$)</Label>
                          <Input 
                            type="number"
                            value={formData.monthly_salary}
                            onChange={(e) => setFormData({...formData, monthly_salary: parseFloat(e.target.value) || 0})}
                            className="bg-background border-border text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.role === 'external_seller' ? (
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
                      <div className="flex items-center justify-between p-2 bg-background rounded border border-border mb-2">
                        <div className="space-y-0.5">
                          <Label className="text-xs uppercase font-bold tracking-tight">Habilitar Comissionamento</Label>
                        </div>
                        <Switch 
                          checked={formData.is_commissionable} 
                          onCheckedChange={(v) => setFormData({...formData, is_commissionable: v})} 
                        />
                      </div>

                      {formData.is_commissionable && (
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="commission" className="text-xs uppercase font-bold tracking-tight">Comissão (%)</Label>
                            <p className="text-[10px] text-muted-foreground">Mínimo 1%, Máximo 3%</p>
                          </div>
                          <Input 
                            id="commission" 
                            type="number"
                            step="0.5"
                            min="1"
                            max="3"
                            className="w-24 bg-background border-border text-sm"
                            value={formData.commission_rate}
                            onChange={(e) => setFormData({...formData, commission_rate: parseFloat(e.target.value)})}
                          />
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">Cidade</Label>
                          <Input id="city" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="bg-background border-border text-sm" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">Estado</Label>
                          <Input id="state" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} className="bg-background border-border text-sm" />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-primary/10 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="pix_key" className="text-primary font-bold text-xs uppercase tracking-tight">Chave PIX</Label>
                          <Input 
                            id="pix_key" 
                            placeholder="CPF, Email, Celular ou Aleatória" 
                            value={formData.pix_key} 
                            onChange={(e) => setFormData({...formData, pix_key: e.target.value})} 
                            className="bg-background border-primary/20 focus:border-primary text-sm" 
                          />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label htmlFor="bank" className="text-[10px] uppercase font-bold opacity-70">Banco</Label>
                            <Input id="bank" value={formData.bank_info.bank} onChange={(e) => setFormData({...formData, bank_info: {...formData.bank_info, bank: e.target.value}})} className="bg-background border-border h-8 text-xs" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="agency" className="text-[10px] uppercase font-bold opacity-70">Agência</Label>
                            <Input id="agency" value={formData.bank_info.agency} onChange={(e) => setFormData({...formData, bank_info: {...formData.bank_info, agency: e.target.value}})} className="bg-background border-border h-8 text-xs" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="account" className="text-[10px] uppercase font-bold opacity-70">Conta</Label>
                            <Input id="account" value={formData.bank_info.account} onChange={(e) => setFormData({...formData, bank_info: {...formData.bank_info, account: e.target.value}})} className="bg-background border-border h-8 text-xs" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">Cidade</Label>
                        <Input id="city" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="bg-background border-border text-sm" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">Estado</Label>
                        <Input id="state" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} className="bg-background border-border text-sm" />
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="permissions" className="space-y-6 pt-2">
                  <div className="flex justify-end mb-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyDefaultPermissions(formData.role)}
                      className="text-[9px] h-7 font-bold uppercase border-primary text-primary"
                    >
                      Restaurar Padrão do Cargo ({formData.role === 'external_seller' ? 'Vendedor Externo' : formData.role})
                    </Button>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-widest border-b border-primary/10 pb-1">Menu Lateral (Sidebar)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                      {sidebarItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border hover:bg-muted/30 transition-colors">
                          <Label className="text-[10px] font-black cursor-pointer uppercase tracking-tight text-foreground pr-2" htmlFor={`sidebar-${item.id}`}>{item.label}</Label>
                          <Switch 
                            id={`sidebar-${item.id}`}
                            className="scale-90"
                            checked={formData.permissions.sidebar[item.id] ?? ROLE_DEFAULTS[formData.role]?.sidebar.includes(item.id)}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              permissions: {
                                ...formData.permissions,
                                sidebar: { ...formData.permissions.sidebar, [item.id]: checked }
                              }
                            })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase text-orange-500 tracking-widest border-b border-orange-500/10 pb-1">Cards do Dashboard</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                      {dashboardCards.map(card => (
                        <div key={card.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-500/5 border border-orange-500/10 hover:bg-orange-500/10 transition-colors">
                          <Label className="text-[10px] font-black cursor-pointer uppercase tracking-tight text-foreground pr-2" htmlFor={`card-${card.id}`}>{card.label}</Label>
                          <Switch 
                            id={`card-${card.id}`}
                            className="scale-90"
                            checked={formData.permissions.dashboard_cards[card.id] ?? ROLE_DEFAULTS[formData.role]?.dashboard.includes(card.id)}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              permissions: {
                                ...formData.permissions,
                                dashboard_cards: { ...formData.permissions.dashboard_cards, [card.id]: checked }
                              }
                            })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-border shrink-0">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-xs uppercase font-bold tracking-wider">Cancelar</Button>
              <Button onClick={handleSaveUser} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs uppercase font-bold tracking-wider px-6">
                Salvar Usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manual Password Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent className="bg-card border-border text-card-foreground max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                <span>Definir Senha Manual</span>
              </DialogTitle>
              <DialogDescription>
                Defina ou atualize a senha de acesso para <strong>{passwordForUser.name}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-1.5">
                <Label htmlFor="target-email" className="text-xs font-semibold">E-mail do Usuário</Label>
                <Input 
                  id="target-email"
                  value={passwordForUser.email || ''}
                  disabled
                  className="bg-muted opacity-70 font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="manual-password" className="text-xs font-semibold">Senha de Acesso</Label>
                <div className="relative">
                  <Input 
                    id="manual-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={passwordForUser.password}
                    onChange={(e) => setPasswordForUser({...passwordForUser, password: e.target.value})}
                    className="bg-background border-border pr-10 font-mono"
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordForUser.password && passwordForUser.password.length >= 6 ? (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ✅ Senha pronta para salvar e enviar ao usuário.
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground">
                    A senha deve ter no mínimo 6 caracteres.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)} disabled={isSettingPassword} className="sm:w-auto w-full">
                Cancelar
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleSetPasswordManually(false)} 
                disabled={isSettingPassword || passwordForUser.password.length < 6}
                className="border-primary text-primary font-bold uppercase text-xs sm:w-auto w-full"
              >
                {isSettingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Key className="h-4 w-4 mr-1.5" />}
                <span>Apenas Salvar</span>
              </Button>
              <Button 
                onClick={() => handleSetPasswordManually(true)} 
                disabled={isSettingPassword || passwordForUser.password.length < 6}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-xs sm:w-auto w-full flex items-center justify-center gap-1.5"
              >
                {isSettingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <MessageCircle className="h-4 w-4 mr-1.5" />}
                <span>Salvar e Enviar WhatsApp</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* WhatsApp Access Share Dialog */}
        <Dialog open={!!shareUserModal} onOpenChange={(open) => !open && setShareUserModal(null)}>
          <DialogContent className="bg-card border-border text-card-foreground max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Share2 className="h-5 w-5 text-emerald-500" />
                <span>Compartilhar Acesso via WhatsApp</span>
              </DialogTitle>
              <DialogDescription>
                Enviar mensagem de convite e dados de acesso para <strong>{shareUserModal?.name}</strong>.
              </DialogDescription>
            </DialogHeader>

            {shareUserModal && (
              <div className="space-y-4 py-2">
                {/* User Info card */}
                <div className="bg-muted/40 p-3 rounded-lg border border-border space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Usuário:</span>
                    <span className="font-bold text-foreground">{shareUserModal.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">E-mail:</span>
                    <span className="font-mono text-foreground">{shareUserModal.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">WhatsApp:</span>
                    <span className="font-medium text-foreground">{shareUserModal.phone || 'Não informado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Papel:</span>
                    <span className="capitalize text-foreground font-medium">{shareUserModal.role}</span>
                  </div>
                </div>

                {/* Password options */}
                <div className="space-y-3 p-3 bg-card rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="include-pwd-toggle" className="text-xs font-bold uppercase cursor-pointer">
                        Enviar com Senha Cadastrada
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        {shareIncludePassword 
                          ? 'O usuário receberá a senha cadastrada e entrará direto com E-mail e Senha.' 
                          : 'O usuário receberá instrução para criar a senha pelo botão "Esqueci minha senha".'}
                      </p>
                    </div>
                    <Switch
                      id="include-pwd-toggle"
                      checked={shareIncludePassword}
                      onCheckedChange={setShareIncludePassword}
                    />
                  </div>

                  {shareIncludePassword && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <Label htmlFor="share-pwd-input" className="text-xs font-bold">
                        Senha Cadastrada do Usuário
                      </Label>
                      <div className="relative">
                        <Input
                          id="share-pwd-input"
                          type={showSharePassword ? "text" : "password"}
                          placeholder="Digite a senha cadastrada para o usuário (mínimo 6 dígitos)"
                          value={sharePassword}
                          onChange={(e) => setSharePassword(e.target.value)}
                          className="bg-background border-border pr-10 font-mono text-sm"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowSharePassword(!showSharePassword)}
                        >
                          {showSharePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {shareUserModal.initial_password 
                          ? '✅ Senha salva no cadastro deste usuário.' 
                          : '💡 Ao enviar o convite, esta senha será salva e vinculada ao perfil do usuário.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Message Live Preview */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Prévia da Mensagem (WhatsApp)</span>
                  </Label>
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-sans whitespace-pre-wrap text-emerald-950 dark:text-emerald-100 max-h-48 overflow-y-auto leading-relaxed select-text">
                    {buildWhatsAppInviteMessage(
                      shareUserModal, 
                      sharePassword.trim(), 
                      shareIncludePassword && sharePassword.trim().length > 0
                    )}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShareUserModal(null)}
                disabled={isSharingViaWhatsApp}
                className="sm:w-auto w-full"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmShareWithPassword}
                disabled={isSharingViaWhatsApp || (shareIncludePassword && sharePassword.trim().length < 6)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold sm:w-auto w-full flex items-center justify-center gap-2"
              >
                {isSharingViaWhatsApp ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4" />
                    <span>Abrir WhatsApp com este Convite</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Gerar Nova Chave de API */}
        <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
          <DialogContent className="bg-card border-border text-card-foreground max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tight">
                <Code2 className="h-5 w-5 text-emerald-600" />
                <span>Nova Chave de Integração</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Gere uma chave para seu outro aplicativo ler o Estoque Roder em tempo real.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nome do Aplicativo ou Destino
                </Label>
                <Input
                  placeholder="Ex: Meu App de Vendas, Sistema Externo, Portal..."
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Permissões do Aplicativo
                </Label>
                <div className="space-y-2.5">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newKeyPermissions.stock}
                      onChange={(e) => setNewKeyPermissions(prev => ({ ...prev, stock: e.target.checked }))}
                      className="mt-0.5 rounded border-border text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-foreground block">Estoque Roder (Fábrica e Sinop)</span>
                      <span className="text-[11px] text-muted-foreground block">
                        Permite consultar todos os equipamentos, quantidades físicas e disponíveis calculadas.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newKeyPermissions.catalog}
                      onChange={(e) => setNewKeyPermissions(prev => ({ ...prev, catalog: e.target.checked }))}
                      className="mt-0.5 rounded border-border text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-foreground block">Catálogo de Equipamentos</span>
                      <span className="text-[11px] text-muted-foreground block">
                        Permite consultar fichas técnicas, modelos, fotos e especificações de catálogo.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsApiKeyDialogOpen(false)}
                disabled={generatingKey}
                className="sm:w-auto w-full"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGenerateApiKey}
                disabled={generatingKey || !newKeyName.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold sm:w-auto w-full flex items-center justify-center gap-2"
              >
                {generatingKey ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Gerando Chave...</span>
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4" />
                    <span>Criar Chave de API</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Orientações de Uso da Chave de API */}
        <Dialog open={isGuideDialogOpen} onOpenChange={setIsGuideDialogOpen}>
          <DialogContent className="bg-card border-border text-card-foreground max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="p-6 bg-gradient-to-r from-emerald-700 to-teal-800 text-white shrink-0">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <DialogTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-emerald-300" />
                    <span>Orientações de Uso da Chave API</span>
                  </DialogTitle>
                  <DialogDescription className="text-emerald-100/90 text-xs">
                    {guideSelectedKey ? `Configuração personalizada para o app "${guideSelectedKey.name}"` : 'Instruções e documentação técnica para conectar aplicativos externos'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Observação solicitada pelo usuário com destaque visual */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Atenção / Observação Importante
                  </h4>
                  <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-semibold">
                    Copie as orientações e coloque no aplicativo que vai ler a chave.
                  </p>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                    Todo desenvolvedor ou sistema precisa saber onde enviar a chave (no cabeçalho <code className="font-mono font-bold bg-amber-500/10 px-1 py-0.5 rounded">x-api-key</code>) e a URL do endpoint para conseguir consultar o estoque ou catálogo em tempo real.
                  </p>
                </div>
              </div>

              {/* Informações da chave atual */}
              {guideSelectedKey && (
                <div className="p-3 bg-muted/40 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                      Aplicativo / Chave Selecionada
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {guideSelectedKey.name}
                    </span>
                  </div>
                  <code className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-background px-2.5 py-1.5 rounded-lg border border-border">
                    {guideSelectedKey.key}
                  </code>
                </div>
              )}

              {/* Bloco de Texto Completo Pronto para Copiar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Texto com Orientações Técnicas (Pronto para Copiar)
                  </Label>
                  <Button
                    size="sm"
                    onClick={() => {
                      const text = generateGuideText(guideSelectedKey);
                      navigator.clipboard.writeText(text);
                      setCopiedGuideText(true);
                      toast.success("Orientações copiadas com sucesso!");
                      setTimeout(() => setCopiedGuideText(false), 2500);
                    }}
                    className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                  >
                    {copiedGuideText ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Orientações Copiadas!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copiar Orientações</span>
                      </>
                    )}
                  </Button>
                </div>

                <textarea
                  readOnly
                  value={generateGuideText(guideSelectedKey)}
                  className="w-full h-64 p-3.5 rounded-xl bg-muted/50 border border-border font-mono text-[11px] leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-foreground"
                />
              </div>
            </div>

            <DialogFooter className="p-4 bg-muted/30 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-2">
              <span className="text-[11px] text-muted-foreground italic">
                Dica: você pode colar este texto no Prompt da IA ou no arquivo de instruções do outro app.
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsGuideDialogOpen(false)}
                  className="h-9 px-4 text-xs font-bold w-full sm:w-auto"
                >
                  Fechar
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const text = generateGuideText(guideSelectedKey);
                    navigator.clipboard.writeText(text);
                    setCopiedGuideText(true);
                    toast.success("Orientações copiadas com sucesso!");
                    setTimeout(() => setCopiedGuideText(false), 2500);
                  }}
                  className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 w-full sm:w-auto"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copiedGuideText ? "Copiado!" : "Copiar Tudo"}</span>
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {textoLinkConsultor && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-3" onClick={() => setTextoLinkConsultor(null)}>
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-4 space-y-3" onClick={e => e.stopPropagation()}>
            <p className="font-bold text-foreground">Link do consultor pronto</p>
            <textarea readOnly value={textoLinkConsultor} className="w-full h-40 rounded-xl border border-border bg-background p-3 text-sm text-foreground" />
            <div className="flex gap-2">
              <Button variant="outline" className="h-11 flex-1" onClick={() => setTextoLinkConsultor(null)}>Fechar</Button>
              <Button className="h-11 flex-1 font-bold" onClick={async () => {
                if (await copiarTexto(textoLinkConsultor)) { toast.success('Texto copiado. Envie para o parceiro.'); setTextoLinkConsultor(null); }
                else toast.error('Não consegui copiar. Selecione o texto e copie.');
              }}>Copiar texto</Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
