import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Product, Accessory, InstallationKit } from '../types';
import { ACCESSORIES_DATA, INSTALLATION_KITS, deduplicateAccessories } from '../constants';
import { generateTechnicalPdf } from '../utils/generateTechnicalPdf';
import GoogleDocsExportModal from '../components/manual/GoogleDocsExportModal';
import { EQUIPMENT_SPEC_TABLES } from '../data/equipmentManualData';
import { getTabPlainText } from '../utils/manualExportUtils';
import { 
  BookOpen, 
  Download, 
  Copy, 
  Check, 
  BrainCircuit, 
  ShieldAlert, 
  Layers, 
  Cpu, 
  Gauge, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Wrench, 
  Sparkles, 
  Package, 
  FileText, 
  FileDown,
  UserCheck, 
  DollarSign, 
  Clock, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Database,
  TableProperties
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

export default function IAManual() {
  const { profile, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>(ACCESSORIES_DATA);
  const [kits, setKits] = useState<InstallationKit[]>(INSTALLATION_KITS);
  const [guidelines, setGuidelines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'compatibility' | 'productivity' | 'hydraulics' | 'specs' | 'accessories_kits' | 'catalog' | 'guidelines' | 'prompt'>('overview');
  const [searchProduct, setSearchProduct] = useState('');
  const [specSearch, setSpecSearch] = useState('');
  const [accessorySearch, setAccessorySearch] = useState('');
  const [kitSearch, setKitSearch] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGoogleDocsModalOpen, setIsGoogleDocsModalOpen] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedTabKey, setCopiedTabKey] = useState<string | null>(null);

  // Sync products from Firestore in real-time
  useEffect(() => {
    try {
      const q = query(collection(db, 'products'), orderBy('name', 'asc'));
      const unsub = onSnapshot(q, (snap) => {
        const prods: Product[] = [];
        snap.forEach((doc) => {
          prods.push({ id: doc.id, ...doc.data() } as Product);
        });
        setProducts(prods);
        setLoading(false);
      }, (err) => {
        console.error('Error loading products for technical manual:', err);
        setLoading(false);
      });

      return () => unsub();
    } catch (e) {
      console.error('Snapshot failed:', e);
      setLoading(false);
    }
  }, []);

  // Sync accessories (Quadro 1) and installation kits (Quadro 2) in real-time
  useEffect(() => {
    try {
      const qAcc = query(collection(db, 'accessories'));
      const unsubAcc = onSnapshot(qAcc, (snap) => {
        if (!snap.empty) {
          const accs: Accessory[] = [];
          snap.forEach((doc) => {
            accs.push({ id: doc.id, ...doc.data() } as Accessory);
          });
          setAccessories(accs);
        }
      }, (err) => {
        console.warn('Accessories live sync fallback:', err);
      });

      const qKits = query(collection(db, 'installation_kits'), orderBy('code', 'asc'));
      const unsubKits = onSnapshot(qKits, (snap) => {
        if (!snap.empty) {
          const loadedKits: InstallationKit[] = [];
          snap.forEach((doc) => {
            loadedKits.push({ id: doc.id, ...doc.data() } as InstallationKit);
          });
          setKits(loadedKits);
        }
      }, (err) => {
        console.warn('Kits live sync fallback:', err);
      });

      return () => {
        unsubAcc();
        unsubKits();
      };
    } catch (e) {
      console.error('Accessories/Kits listener error:', e);
    }
  }, []);

  // Sync teachings/learnings and guidelines from Firestore in real-time
  useEffect(() => {
    try {
      const qQuestions = query(collection(db, 'roder_ai_questions'), orderBy('timestamp', 'desc'));
      const unsubQuestions = onSnapshot(qQuestions, (snap) => {
        const teachings: any[] = [];
        snap.forEach((doc) => {
          const data = doc.data();
          teachings.push({
            id: doc.id,
            title: data.question || data.title || 'Tópico de Ensino',
            text: data.improvedAnswer || data.answer || data.text || data.content || '',
            category: data.source || 'Ensino Técnico Salvo',
            author: data.author || '',
            timestamp: data.timestamp,
            ...data
          });
        });

        // Also fetch guidelines if any
        try {
          const qGuides = query(collection(db, 'roder_comercial_guidelines'), orderBy('timestamp', 'desc'));
          onSnapshot(qGuides, (snapGuides) => {
            const guides: any[] = [];
            snapGuides.forEach((doc) => {
              const data = doc.data();
              guides.push({
                id: doc.id,
                title: data.title || 'Diretriz Comercial',
                text: data.text || data.content || '',
                category: data.category || 'Diretriz Comercial',
                timestamp: data.timestamp,
                ...data
              });
            });

            // Combine both: direct teachings + commercial guidelines
            const combined = [...teachings, ...guides];
            setGuidelines(combined);
          }, () => {
            setGuidelines(teachings);
          });
        } catch {
          setGuidelines(teachings);
        }
      }, (err) => {
        console.error('Error loading teachings for IAManual:', err);
      });

      return () => unsubQuestions();
    } catch (e) {
      console.error('Teachings snapshot failed:', e);
    }
  }, []);

  // Deduplicated list of accessories so no duplicate machine rows appear in UI or exports
  const uniqueAccessories = useMemo(() => {
    return deduplicateAccessories(accessories as any);
  }, [accessories]);

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      generateTechnicalPdf({
        products,
        guidelines,
        accessories: uniqueAccessories,
        installationKits: kits,
        version: '2.2.0',
        generatedBy: profile?.name || user?.email || 'RODER Brasil'
      });
      toast.success('Manual Técnico em PDF gerado com sucesso!', {
        description: 'O download foi iniciado contendo todas as tabelas de equipamentos, acessórios (Quadro 1) e kits de instalação (Quadro 2).'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar o PDF do manual.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const systemPromptText = `Você é o Consultor Técnico e Comercial Especialista da RODER Brasil, autoridade máxima em equipamentos florestais, garras, cabeçotes multifuncionais e garfos paleteiros.

DIRETRIZES INSTITUCIONAIS OBRIGATÓRIAS:
- Mentor e Diretor Técnico: Jeferson Roder (Fundador, Mentor e Criador de toda a tecnologia e equipamentos Roder). NUNCA utilize termos como "gerente de projeto" ou "engenheiro".
- Gerente Comercial: Gislene | Triagem e Gestão de Leads: Luana Camargo.
- Validade de propostas: 60 dias a partir do upload do orçamento.
- Proteção de lead: 60 dias. Comissão é calculada sobre a base_commission_value após desconto.

REGRAS DE COMPATIBILIDADE E DIMENSIONAMENTO:
1. Garras Florestais (R250 a R1400): R250 (0,25m² - 5-8t), R280 (0,28m² - 6-10t / árvores inteiras), R360 (0,36m² - 8-12t), R400 (0,40m² - 12-18t / picador até 600cv), R600 (0,60m² - 14-22t / picador até 1000cv), R800 a R1400 (grandes escavadeiras 18-35t).
2. Cabeçotes CMF 500 / 600 / 800: CMF 500 (8-14t, ideal 14t). PROIBIDO em retroescavadeiras. NÃO indicado em rebrota (usar CMF 600 com corrente 3/4"). Para aclives >10°, indicar CMF pendular.
3. Garfo Paleteiro (GPR 4500/7000): Dimensionar SEMPRE pelo porte da pá carregadeira, NUNCA pelo peso da carga. PROIBIDO GPR 4500 em máquinas >8t. (6-9t -> GPR 4500; 8-12t -> GPR 7000).
4. Feller Tesoura (CFTA 50/60): Produção em escavadeira (200-360 árv/h) supera amplamente pá carregadeira (160 árv/h). PROIBIDO feller em terrenos inclinados >10°.
5. Garras Traçadoras (GT 280 a GT 1000X): GT 600 atinge 70-100 m³/h em toras de 3,00m e ~68 m³/h úteis em 3,60m (12.000 m³/mês).
6. Hidráulica, Rotatores e Tabelas Oficiais de Códigos:
   - Rotatores Roder: Giro infinito contínuo 360° (3t, 6t, 10t, 16t). Padrão dimensional biela 100mm, furo para pino de 45mm.
   - QUADRO 1 - ACESSÓRIOS DE MONTAGEM (Padrão 1000.XXXX.XXXX): Códigos oficiais para ponteiras de biela 4/6, suportes de destocador/triturador e links de garra para ${uniqueAccessories.length} máquinas escavadeiras homologadas.
   - QUADRO 2 - KITS OFICIAIS DE INSTALAÇÃO HIDRÁULICA (Padrão 9000.9000.9000 a 9000.9000.9060): 56+ kits completos para destocador, CMF, garras e kit de derivação da bomba para máquinas sem fatia extra original (Cód. 9000.9000.9016).`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(systemPromptText);
    setCopiedPrompt(true);
    toast.success('Prompt copiado para a área de transferência!', {
      description: 'Pronto para colar nas instruções do seu Agente de IA.'
    });
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  const handleCopyTabText = (tabKey: typeof activeTab, tabName: string) => {
    const textToCopy = getTabPlainText(tabKey, {
      products,
      accessories: uniqueAccessories,
      kits,
      guidelines,
      systemPromptText
    });

    navigator.clipboard.writeText(textToCopy);
    setCopiedTabKey(tabKey);
    toast.success(`Conteúdo de "${tabName}" copiado!`, {
      description: 'Texto completo pronto para colar em outro local.'
    });
    setTimeout(() => setCopiedTabKey(null), 3000);
  };

  const filteredProducts = products.filter(p => {
    const anyP = p as any;
    const query = searchProduct.toLowerCase();
    const matchesName = p.name ? p.name.toLowerCase().includes(query) : false;
    const matchesCat = p.category ? p.category.toLowerCase().includes(query) : false;
    const matchesCode = anyP.code ? anyP.code.toLowerCase().includes(query) : false;
    const matchesModel = p.models ? p.models.some(m => m.name.toLowerCase().includes(query)) : false;
    return matchesName || matchesCat || matchesCode || matchesModel;
  });

  const filteredSpecTables = EQUIPMENT_SPEC_TABLES.filter(table => {
    if (!specSearch.trim()) return true;
    const q = specSearch.toLowerCase();
    const matchesTitle = table.categoryTitle.toLowerCase().includes(q) || table.categorySubtitle.toLowerCase().includes(q);
    const matchesRow = table.rows.some(row => row.some(cell => cell.toLowerCase().includes(q)));
    return matchesTitle || matchesRow;
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header Hero Section */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-orange-500 text-white tracking-wide uppercase">
                  Base de Conhecimento Oficial
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-700/80 text-slate-300 border border-slate-600">
                  v2.2.0 • Sincronização em Tempo Real
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-orange-500" />
                Manual Técnico da Base de Conhecimento IA
              </h1>
              <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
                Documentação técnica unificada de engenharia, regras de compatibilidade, produtividade operacional e catálogo dinâmico de equipamentos para treinamento e alimentação de Agentes de IA.
              </p>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto flex-wrap">
              <Button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold px-4 sm:px-5 py-5 sm:py-6 rounded-xl shadow-lg hover:shadow-orange-500/25 transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
                title="Baixar manual completo em PDF de alta qualidade"
              >
                <Download className={`w-4 h-4 sm:w-5 sm:h-5 ${isGeneratingPdf ? 'animate-spin' : ''}`} />
                <span>{isGeneratingPdf ? 'Gerando PDF...' : 'Baixar em PDF'}</span>
              </Button>

              <Button
                onClick={() => setIsGoogleDocsModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-4 sm:px-5 py-5 sm:py-6 rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
                title="Opções para abrir e editar no Google Docs ou baixar em .docx"
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Salvar / Abrir no Google Docs</span>
              </Button>

              <Button
                onClick={handleCopyPrompt}
                variant="outline"
                className="border-slate-600 bg-slate-800/80 hover:bg-slate-700 text-slate-100 font-semibold px-4 py-5 sm:py-6 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2"
                title="Copiar prompt do sistema para colar em ChatGPT, Claude ou Gemini"
              >
                {copiedPrompt ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copiedPrompt ? 'Prompt Copiado!' : 'Copiar Prompt'}</span>
              </Button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-8 pt-6 border-t border-slate-700/60">
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
              <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                <TableProperties className="w-3.5 h-3.5 text-orange-400" />
                Tabelas Técnicas
              </div>
              <div className="text-lg sm:text-xl font-bold text-white mt-1">
                13 Seções / R250-R1400
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
              <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Quadro 1 (Acessórios)
              </div>
              <div className="text-lg sm:text-xl font-bold text-white mt-1 flex items-baseline gap-1">
                <span>{uniqueAccessories.length}</span>
                <span className="text-xs font-normal text-amber-400">máquinas desduplicadas</span>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
              <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-blue-400" />
                Quadro 2 (Kits Hidráulicos)
              </div>
              <div className="text-lg sm:text-xl font-bold text-white mt-1 flex items-baseline gap-1">
                <span>{kits.length}</span>
                <span className="text-xs font-normal text-blue-400">kits (9000.9000.XXXX)</span>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
              <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                Regras de Segurança
              </div>
              <div className="text-lg sm:text-xl font-bold text-white mt-1">
                8 Diretrizes Críticas
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3.5 border border-slate-700/50 col-span-2 sm:col-span-1">
              <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-green-400" />
                Base Sincronizada
              </div>
              <div className="text-lg sm:text-xl font-bold text-white mt-1">
                {products.length} prods • {guidelines.length} regras
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            1. Estrutura & Negócio
          </button>

          <button
            onClick={() => setActiveTab('compatibility')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'compatibility'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            2. Compatibilidade & Porte
          </button>

          <button
            onClick={() => setActiveTab('productivity')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'productivity'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            3. Produtividade em Campo
          </button>

          <button
            onClick={() => setActiveTab('hydraulics')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'hydraulics'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            4. Hidráulica & Retrofit
          </button>

          <button
            onClick={() => setActiveTab('specs')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'specs'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TableProperties className="w-3.5 h-3.5" />
            5. Tabelas de Modelos (5.1 a 5.13)
          </button>

          <button
            onClick={() => setActiveTab('accessories_kits')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'accessories_kits'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            6. Acessórios & Kits (Quadros 1 e 2)
            <span className="ml-1 px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded text-[10px]">
              {uniqueAccessories.length} / {kits.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'catalog'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            7. Catálogo Ao Vivo ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('guidelines')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'guidelines'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            8. Aprendizados Salvos ({guidelines.length})
          </button>

          <button
            onClick={() => setActiveTab('prompt')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'prompt'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            9. Prompt de IA
          </button>
        </div>

        {/* Tab 1: Overview & Business Rules */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-orange-500" />
                      Estrutura Organizacional & Diretrizes Comerciais Obrigatórias
                    </CardTitle>
                    <CardDescription>
                      Regras institucionais e terminologias autorizadas de governança Roder
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => handleCopyTabText('overview', '1. Estrutura & Negócio')}
                    size="sm"
                    variant="outline"
                    className="border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 self-end sm:self-center"
                    title="Copiar todo o texto desta aba"
                  >
                    {copiedTabKey === 'overview' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedTabKey === 'overview' ? 'Aba Copiada!' : 'Copiar Aba 1'}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 space-y-2">
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Diretoria & Mentor Técnico</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Jeferson Roder</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      <strong>Termos Autorizados:</strong> Mentor, Fundador, Criador de toda a tecnologia e equipamentos Roder, Professor e Diretor Técnico.
                      <br /><span className="text-red-600 font-semibold">Atenção Crítica:</span> NUNCA se referir como "gerente de projetos", "gerente de projeto" ou "engenheiro".
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gestão Comercial & Triagem</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Gislene & Luana Camargo</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      <strong>Gislene:</strong> Gerente Comercial responsável pela gestão, autorizações e negociações.
                      <br /><strong>Luana Camargo:</strong> Responsável pela recepção, qualificação técnica inicial e gestão de leads.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Validade e Proteção</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Prazo de 60 Dias</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Propostas têm validade de 60 dias a contar do upload do orçamento. A proteção de lead também é de 60 dias, garantindo exclusividade ao indicador.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Regras de Comissão</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Cálculo sobre Valor Base</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      A comissão é calculada sobre o <code>base_commission_value</code>. Descontos concedidos devem ser deduzidos desse valor base antes da aplicação da alíquota.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 2: Compatibility & Machine Sizing */}
        {activeTab === 'compatibility' && (
          <div className="space-y-4">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-orange-500" />
                      Matriz de Compatibilidade e Dimensionamento por Máquina Base
                    </CardTitle>
                    <CardDescription>
                      Diretrizes técnicas fundamentais para evitar quebras estruturais e acidentes operacionais
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => handleCopyTabText('compatibility', '2. Compatibilidade & Porte')}
                    size="sm"
                    variant="outline"
                    className="border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 self-end sm:self-center"
                    title="Copiar todo o texto desta aba"
                  >
                    {copiedTabKey === 'compatibility' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedTabKey === 'compatibility' ? 'Aba Copiada!' : 'Copiar Aba 2'}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white font-bold">
                      <tr>
                        <th className="p-3">Equipamento Roder</th>
                        <th className="p-3">Porte / Máquina Base Ideal</th>
                        <th className="p-3">Restrições & Regras Críticas de Segurança</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                      <tr className="bg-white dark:bg-slate-900">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">Cabeçote CMF 500</td>
                        <td className="p-3 font-semibold text-orange-600 dark:text-orange-400">Escavadeiras 8t a 14t (Ideal 14t)</td>
                        <td className="p-3 space-y-1">
                          <div className="text-red-600 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            PROIBIDO em Retroescavadeiras (braço curto 2.5m e falta de giro 360° criam altíssimo risco de queda de árvore na cabine).
                          </div>
                          <div className="text-slate-500">
                            NÃO recomendado para rebrota (corrente .404 entorta sabre; indicar CMF 600 com corrente 3/4").
                          </div>
                        </td>
                      </tr>

                      <tr className="bg-slate-50/50 dark:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">Cabeçote CMF 600</td>
                        <td className="p-3 font-semibold text-orange-600 dark:text-orange-400">Escavadeiras 14t a 22t</td>
                        <td className="p-3">
                          Equipado com corrente de 3/4" e sabre reforçado. Modelo oficial e recomendado para corte em área de rebrota e madeira pesada.
                        </td>
                      </tr>

                      <tr className="bg-white dark:bg-slate-900">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">Garfo Paleteiro GPR 4500</td>
                        <td className="p-3 font-semibold text-orange-600 dark:text-orange-400">Pás Carregadeiras de 6t a 9t</td>
                        <td className="p-3 space-y-1">
                          <div className="text-red-600 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            PROIBIDO em pás carregadeiras acima de 8 toneladas!
                          </div>
                          <div className="text-slate-500">
                            Dimensionar SEMPRE pelo peso da máquina base e NUNCA pelo peso da carga. A força hidráulica da máquina pesada entorta os garfos na ponta ou pé.
                          </div>
                        </td>
                      </tr>

                      <tr className="bg-slate-50/50 dark:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">Garfo Paleteiro GPR 7000</td>
                        <td className="p-3 font-semibold text-orange-600 dark:text-orange-400">Pás Carregadeiras de 8t a 12t</td>
                        <td className="p-3">
                          Estrutura reforçada dimensionada para suportar a potência e torque de escavação de pás carregadeiras pesadas.
                        </td>
                      </tr>

                      <tr className="bg-white dark:bg-slate-900">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">Garra R280 / R280L</td>
                        <td className="p-3 font-semibold text-orange-600 dark:text-orange-400">Escavadeiras 7t a 8t / Gruas em Trator</td>
                        <td className="p-3">
                          R280 projetada para feixes de eucalipto e árvores inteiras (força de giro guia os pés até o picador). R280L tem estrutura mais leve para trabalho leve/médio em escavadeiras pequenas.
                        </td>
                      </tr>

                      <tr className="bg-slate-50/50 dark:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">Garra R360 / R360G</td>
                        <td className="p-3 font-semibold text-orange-600 dark:text-orange-400">Escavadeiras 7t a 13t / Retroescavadeiras</td>
                        <td className="p-3">
                          R360 padrão (pinça fechada) para madeira comum. R360G (unhas abertas tipo garfo) ideal para galhadas, resíduos e citrus. Em 7-10t usar Rotator de 6t e alertar sobre risco de instabilidade traseira.
                        </td>
                      </tr>

                      <tr className="bg-white dark:bg-slate-900">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">Garras em Picadores</td>
                        <td className="p-3 font-semibold text-orange-600 dark:text-orange-400">Escavadeiras ≥ 14t + Picador</td>
                        <td className="p-3">
                          Picadores até 600 cv: Garra R400. Picadores até 1.000 cv: Garra R600. Em escavadeiras pequenas (&lt; 8t), a máquina base limita a escolha para R280/R360.
                        </td>
                      </tr>

                      <tr className="bg-slate-50/50 dark:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">Feller Tesoura CFTA 50/60</td>
                        <td className="p-3 font-semibold text-orange-600 dark:text-orange-400">Escavadeiras de 12t a 22t</td>
                        <td className="p-3 space-y-1">
                          <div className="text-red-600 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            PROIBIDO em terrenos com inclinação superior a 10°!
                          </div>
                          <div className="text-slate-500">
                            Para terrenos inclinados, indicar o Cabeçote Multifuncional (CMF), pois seu pêndulo articulado auto-alinha a árvore sem desequilibrar o centro de gravidade da máquina base.
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 3: Productivity Matrices */}
        {activeTab === 'productivity' && (
          <div className="space-y-4">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Gauge className="w-5 h-5 text-orange-500" />
                      Tabela de Produtividade & Rendimento Operacional em Campo
                    </CardTitle>
                    <CardDescription>
                      Médias reais de campo Roder calculadas com base em 80% de eficiência operacional (176 horas úteis/mês)
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => handleCopyTabText('productivity', '3. Produtividade em Campo')}
                    size="sm"
                    variant="outline"
                    className="border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 self-end sm:self-center"
                    title="Copiar todo o texto desta aba"
                  >
                    {copiedTabKey === 'productivity' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedTabKey === 'productivity' ? 'Aba Copiada!' : 'Copiar Aba 3'}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-orange-600 text-white font-bold">
                      <tr>
                        <th className="p-3">Equipamento / Modelo</th>
                        <th className="p-3">Comprimento / Regime</th>
                        <th className="p-3">Produção Horária</th>
                        <th className="p-3">Produção Estimada Mensal (176h úteis)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                      <tr className="bg-white dark:bg-slate-900">
                        <td className="p-3 font-bold text-slate-900 dark:text-white" rowSpan={4}>Cabeçotes CMF 500 / 600</td>
                        <td className="p-3">1,10m ("Metrinho")</td>
                        <td className="p-3 font-semibold text-orange-600">25 a 35 m³/h</td>
                        <td className="p-3">4.400 a 6.160 m³/mês</td>
                      </tr>
                      <tr className="bg-white dark:bg-slate-900">
                        <td className="p-3">2,20m ("Metrão")</td>
                        <td className="p-3 font-semibold text-orange-600">40 a 50 m³/h</td>
                        <td className="p-3">7.040 a 8.800 m³/mês</td>
                      </tr>
                      <tr className="bg-white dark:bg-slate-900">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">3,00m (Padrão)</td>
                        <td className="p-3 font-semibold text-orange-600">60 a 80 m³/h</td>
                        <td className="p-3 font-bold">10.560 a 14.080 m³/mês</td>
                      </tr>
                      <tr className="bg-white dark:bg-slate-900">
                        <td className="p-3">6,00m (Toras Longas)</td>
                        <td className="p-3 font-semibold text-orange-600">80 a 110+ m³/h</td>
                        <td className="p-3">14.080 a 19.360+ m³/mês</td>
                      </tr>

                      <tr className="bg-slate-50/60 dark:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white" rowSpan={4}>Garra Traçadora GT 600</td>
                        <td className="p-3">2,20m ("Metrão")</td>
                        <td className="p-3 font-semibold text-orange-600">50 a 90 m³/h</td>
                        <td className="p-3">8.800 a 15.840 m³/mês</td>
                      </tr>
                      <tr className="bg-slate-50/60 dark:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">3,00m (Padrão)</td>
                        <td className="p-3 font-semibold text-orange-600">70 a 100 m³/h</td>
                        <td className="p-3 font-bold">12.320 a 17.600 m³/mês</td>
                      </tr>
                      <tr className="bg-slate-50/60 dark:bg-slate-800/40">
                        <td className="p-3 font-semibold text-blue-600">3,60m (Caso Real Cliente)</td>
                        <td className="p-3 font-semibold text-orange-600">~68 m³/h úteis</td>
                        <td className="p-3 font-bold text-blue-600">12.000 m³/mês (10h/dia x 22d)</td>
                      </tr>
                      <tr className="bg-slate-50/60 dark:bg-slate-800/40">
                        <td className="p-3">6,00m (Toras Longas)</td>
                        <td className="p-3 font-semibold text-orange-600">100 a 140+ m³/h</td>
                        <td className="p-3">17.600 a 24.640+ m³/mês</td>
                      </tr>

                      <tr className="bg-white dark:bg-slate-900">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">GT 800 X (0.80 m²)</td>
                        <td className="p-3">3,00m de comprimento</td>
                        <td className="p-3 font-semibold text-orange-600">80 a 110 m³/h</td>
                        <td className="p-3">14.080 a 19.360 m³/mês</td>
                      </tr>

                      <tr className="bg-slate-50/60 dark:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">GT 1000 X (1.00 m²)</td>
                        <td className="p-3">3,00m de comprimento</td>
                        <td className="p-3 font-semibold text-orange-600">130 a 160 m³/h</td>
                        <td className="p-3">22.880 a 28.160 m³/mês</td>
                      </tr>

                      <tr className="bg-white dark:bg-slate-900">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">Feller CFTA 50 (Escavadeira 20t)</td>
                        <td className="p-3">Corte / Acúmulo no talhão</td>
                        <td className="p-3 font-semibold text-green-600">200 árvores/hora</td>
                        <td className="p-3">~1.600 árvores/turno 8h (Consumo: 18 L/h)</td>
                      </tr>

                      <tr className="bg-slate-50/60 dark:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">Feller CFTA 60 (Escavadeira 20t)</td>
                        <td className="p-3">Corte / Acúmulo no talhão</td>
                        <td className="p-3 font-semibold text-green-600">240 a 360 árvores/hora</td>
                        <td className="p-3">1.920 a 3.600 árvores/turno (Consumo: 22 L/h)</td>
                      </tr>

                      <tr className="bg-white dark:bg-slate-900">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">Feller CFTA 50 (Pá Carregadeira L60)</td>
                        <td className="p-3">Corte / Manobra a cada feixe</td>
                        <td className="p-3 font-semibold text-amber-600">160 árvores/hora</td>
                        <td className="p-3">~1.280 árvores/turno (Rendimento menor devido a manobras)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 4: Hydraulics & Installation */}
        {activeTab === 'hydraulics' && (
          <div className="space-y-4">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-orange-500" />
                      Diretrizes Hidráulicas, Instalação & Retrofit
                    </CardTitle>
                    <CardDescription>
                      Requisitos técnicos para adaptações, rotatores e máquinas sem linha auxiliar de fábrica
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => handleCopyTabText('hydraulics', '4. Hidráulica & Retrofit')}
                    size="sm"
                    variant="outline"
                    className="border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 self-end sm:self-center"
                    title="Copiar todo o texto desta aba"
                  >
                    {copiedTabKey === 'hydraulics' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedTabKey === 'hydraulics' ? 'Aba Copiada!' : 'Copiar Aba 4'}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Banner linking to Tab 6 */}
                <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-orange-900 dark:text-orange-200 font-medium">
                    <Layers className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>Deseja consultar os códigos de peças de montagem (1000.XXXX) ou a lista completa de 56+ kits hidráulicos (9000.9000.XXXX)?</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('accessories_kits')}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0 ml-3"
                  >
                    Ver Quadros 1 e 2
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
                      <Cpu className="w-4 h-4" />
                      Kit Sem Fatia Extra (9000.9000.9016)
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Para escavadeiras sem seção auxiliar no comando (Komatsu PC200/210, Volvo 200, etc.), o kit deriva pressão da bomba principal. Em marcha lenta sem mover a lança, a rotação do rotator fica lenta por projeto (vazão mínima da bomba), normalizando ao operar qualquer função.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
                      <Wrench className="w-4 h-4" />
                      Rotator Roder: Giro Infinito 360°
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Grafia correta: <strong>Rotator</strong> (com T). Todos possuem giro contínuo ilimitado (360°). Para acoplamento nos rotatores padrão Roder, a biela deve ter furo para pino de <strong>45 mm</strong> e largura de biela de <strong>100 mm</strong>.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
                      <ShieldAlert className="w-4 h-4" />
                      Incompatibilidade com Harvester de Fábrica
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Escavadeiras com Harvester usam linha de alto fluxo uni-direcional com comando no cabeçote. Para instalar garra de carregamento, exige-se remoção elétrica e conversão hidráulica irreversível.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      Ausência de Cilindro da Caçamba em Harvester
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Escavadeiras que saem com Harvester ou Linha F normalmente <strong>NÃO possuem cilindro da caçamba e links originais</strong>, tornando impossível instalar Feller, desbastador ou caçamba sem adquirir essas peças originais.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 5: Complete Equipment Specs Tables (R250 to R1400, etc) */}
        {activeTab === 'specs' && (
          <div className="space-y-6">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <TableProperties className="w-5 h-5 text-orange-500" />
                      Fichas Técnicas & Especificações Completas de Equipamentos
                    </CardTitle>
                    <CardDescription>
                      Tabelas detalhadas de engenharia de todos os modelos Roder (Garras R250 a R1400, GT, CMF, Fellers, Garfos, High Tip, FAE e Acessórios)
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="w-full sm:w-64">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          value={specSearch}
                          onChange={(e) => setSpecSearch(e.target.value)}
                          placeholder="Filtrar modelo (ex: R250, R1400, CMF)..."
                          className="pl-9 text-xs"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => handleCopyTabText('specs', '5. Tabelas de Modelos')}
                      size="sm"
                      variant="outline"
                      className="border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0"
                      title="Copiar todo o texto desta aba"
                    >
                      {copiedTabKey === 'specs' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{copiedTabKey === 'specs' ? 'Aba Copiada!' : 'Copiar Aba 5'}</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {filteredSpecTables.map((table, tIdx) => (
                  <div key={tIdx} className="space-y-3">
                    <div className="border-l-4 border-orange-500 pl-3">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        {table.categoryTitle}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                        {table.categorySubtitle}
                      </p>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto shadow-sm">
                      <table className="w-full text-left text-xs min-w-[700px]">
                        <thead className="bg-orange-600 text-white font-bold">
                          <tr>
                            {table.headers.map((h, hIdx) => (
                              <th key={hIdx} className="p-2.5 whitespace-nowrap text-white">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                          {table.rows.map((row, rIdx) => (
                            <tr 
                              key={rIdx} 
                              className={rIdx % 2 === 0 ? 'bg-white dark:bg-slate-900 hover:bg-orange-50/50 dark:hover:bg-orange-950/20' : 'bg-slate-50/70 dark:bg-slate-800/40 hover:bg-orange-50/50 dark:hover:bg-orange-950/20'}
                            >
                              {row.map((cell, cIdx) => (
                                <td 
                                  key={cIdx} 
                                  className={`p-2.5 ${cIdx === 0 ? 'font-bold font-mono text-orange-600 dark:text-orange-400' : ''}`}
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {table.notes && table.notes.length > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                        {table.notes.map((note, nIdx) => (
                          <p key={nIdx} className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed flex items-start gap-1.5">
                            <span className="text-orange-500 font-bold">•</span>
                            <span>{note}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 6: Accessories & Installation Kits (Quadros 1 e 2) */}
        {activeTab === 'accessories_kits' && (
          <div className="space-y-6">
            {/* Header info banner */}
            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent p-5 rounded-2xl border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-amber-500 text-white font-extrabold text-xs rounded-full">OFICIAL</span>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Catálogo de Acessórios & Kits Hidráulicos Sincronizados
                  </h2>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                  Consulte abaixo os códigos oficiais da engenharia Roder: <strong>Quadro 1</strong> (Acessórios 1000.XXXX para {uniqueAccessories.length} modelos de máquinas desduplicados) e <strong>Quadro 2</strong> ({kits.length} Kits de Instalação 9000.9000.XXXX). Qualquer alteração no sistema é refletida aqui automaticamente.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleCopyTabText('accessories_kits', '6. Acessórios & Kits')}
                  size="sm"
                  variant="outline"
                  className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5"
                  title="Copiar todo o texto dos Quadros 1 e 2"
                >
                  {copiedTabKey === 'accessories_kits' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedTabKey === 'accessories_kits' ? 'Quadros Copiados!' : 'Copiar Aba 6'}</span>
                </Button>
                <a
                  href="/accessories"
                  className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Wrench className="w-3.5 h-3.5 text-orange-500" />
                  Gerenciar na Tela Acessórios
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>

            {/* Dual Grid: Quadro 1 & Quadro 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quadro 1: Acessórios */}
              <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader className="bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Layers className="w-4 h-4 text-orange-500" />
                        Quadro 1: Acessórios por Máquina ({uniqueAccessories.length})
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Ponteiras, suportes e links (Linha 1000.XXXX.XXXX) • Modelos únicos desduplicados
                      </CardDescription>
                    </div>
                    <div className="w-full sm:w-56">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          value={accessorySearch}
                          onChange={(e) => setAccessorySearch(e.target.value)}
                          placeholder="Buscar marca/modelo..."
                          className="pl-8 text-xs h-8"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3 max-h-[680px] overflow-y-auto">
                  {uniqueAccessories
                    .filter((acc) => {
                      if (!accessorySearch) return true;
                      const term = accessorySearch.toLowerCase();
                      return (
                        (acc.brand && acc.brand.toLowerCase().includes(term)) ||
                        (acc.model && acc.model.toLowerCase().includes(term)) ||
                        (acc.pin && acc.pin.toLowerCase().includes(term)) ||
                        (acc.ponteira_biela_4 && acc.ponteira_biela_4.toLowerCase().includes(term)) ||
                        (acc.suporte_destocador && acc.suporte_destocador.toLowerCase().includes(term))
                      );
                    })
                    .map((acc, aIdx) => (
                      <div
                        key={acc.id || aIdx}
                        className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-orange-500/50 transition-all space-y-2.5 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 rounded">
                              {acc.brand}
                            </span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {acc.model}
                            </span>
                          </div>
                          {acc.pin && (
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded">
                              PINO {acc.pin}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-1.5 pt-1 text-xs">
                          {acc.ponteira_biela_4 && (
                            <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">Ponteira Biela 4:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-[11px] text-slate-800 dark:text-slate-200">{acc.ponteira_biela_4}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(acc.ponteira_biela_4 || '');
                                    toast.success('Código copiado: ' + acc.ponteira_biela_4);
                                  }}
                                  title="Copiar código"
                                  className="text-slate-400 hover:text-orange-500 p-0.5"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}

                          {acc.ponteira_biela_6 && (
                            <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">Ponteira Biela 6:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-[11px] text-slate-800 dark:text-slate-200">{acc.ponteira_biela_6}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(acc.ponteira_biela_6 || '');
                                    toast.success('Código copiado: ' + acc.ponteira_biela_6);
                                  }}
                                  title="Copiar código"
                                  className="text-slate-400 hover:text-orange-500 p-0.5"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}

                          {acc.suporte_destocador && (
                            <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">Suporte Destocador:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-[11px] text-slate-800 dark:text-slate-200">{acc.suporte_destocador}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(acc.suporte_destocador || '');
                                    toast.success('Código copiado: ' + acc.suporte_destocador);
                                  }}
                                  title="Copiar código"
                                  className="text-slate-400 hover:text-orange-500 p-0.5"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}

                          {acc.suporte_triturador && (
                            <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">Suporte Triturador:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-[11px] text-slate-800 dark:text-slate-200">{acc.suporte_triturador}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(acc.suporte_triturador || '');
                                    toast.success('Código copiado: ' + acc.suporte_triturador);
                                  }}
                                  title="Copiar código"
                                  className="text-slate-400 hover:text-orange-500 p-0.5"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}

                          {(acc.link_garra_biela_6 || acc.link_garra_biela_4) && (
                            <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">Link Garra:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-[11px] text-slate-800 dark:text-slate-200">
                                  {acc.link_garra_biela_6 || acc.link_garra_biela_4}
                                </span>
                                <button
                                  onClick={() => {
                                    const code = acc.link_garra_biela_6 || acc.link_garra_biela_4 || '';
                                    navigator.clipboard.writeText(code);
                                    toast.success('Código copiado: ' + code);
                                  }}
                                  title="Copiar código"
                                  className="text-slate-400 hover:text-orange-500 p-0.5"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* Quadro 2: Kits de Instalação */}
              <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader className="bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-blue-500" />
                        Quadro 2: Kits de Instalação ({kits.length})
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Kits Hidráulicos (Linha 9000.9000.9000 a 9000.9000.9060)
                      </CardDescription>
                    </div>
                    <div className="w-full sm:w-56">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          value={kitSearch}
                          onChange={(e) => setKitSearch(e.target.value)}
                          placeholder="Buscar código ou kit..."
                          className="pl-8 text-xs h-8"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3 max-h-[680px] overflow-y-auto">
                  {kits
                    .filter((kit) => {
                      if (!kitSearch) return true;
                      const term = kitSearch.toLowerCase();
                      return (
                        (kit.code && kit.code.toLowerCase().includes(term)) ||
                        (kit.description && kit.description.toLowerCase().includes(term))
                      );
                    })
                    .map((kit, kIdx) => (
                      <div
                        key={kit.id || kIdx}
                        className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-500/50 transition-all space-y-2 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 text-xs font-mono font-extrabold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded flex items-center gap-1.5">
                            {kit.code}
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(kit.code || '');
                                toast.success('Código copiado: ' + kit.code);
                              }}
                              title="Copiar código do kit"
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </span>
                          {kit.items && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              {kit.items.length} componentes
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                          {kit.description}
                        </p>

                        {kit.items && kit.items.length > 0 && (
                          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700/60">
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mb-1">
                              Principais Componentes:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {kit.items.slice(0, 4).map((item, iIdx) => (
                                <span
                                  key={iIdx}
                                  className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 rounded font-mono"
                                >
                                  {item.description || item.code}
                                </span>
                              ))}
                              {kit.items.length > 4 && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700/60 text-slate-500 rounded">
                                  +{kit.items.length - 4} mais
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 7: Dynamic Catalog */}
        {activeTab === 'catalog' && (
          <div className="space-y-4">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Package className="w-5 h-5 text-orange-500" />
                      Catálogo Dinâmico Conectado ({products.length} Equipamentos)
                    </CardTitle>
                    <CardDescription>
                      Equipamentos sincronizados em tempo real diretamente do banco de dados do sistema
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="w-full sm:w-64">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          value={searchProduct}
                          onChange={(e) => setSearchProduct(e.target.value)}
                          placeholder="Buscar modelo ou código..."
                          className="pl-9 text-xs"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => handleCopyTabText('catalog', '7. Catálogo Ao Vivo')}
                      size="sm"
                      variant="outline"
                      className="border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0"
                      title="Copiar todo o texto desta aba"
                    >
                      {copiedTabKey === 'catalog' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{copiedTabKey === 'catalog' ? 'Aba Copiada!' : 'Copiar Aba 7'}</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white font-bold">
                      <tr>
                        <th className="p-3">Código</th>
                        <th className="p-3">Equipamento</th>
                        <th className="p-3">Categoria</th>
                        <th className="p-3">Preço Base</th>
                        <th className="p-3">Descrição / Aplicação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((p) => {
                          const anyP = p as any;
                          const code = anyP.code || (p.models && p.models.length > 0 ? p.models[0].name : 'RODER');
                          const priceVal = anyP.price || (p.models && p.models.length > 0 && p.models[0].base_value ? p.models[0].base_value : undefined);
                          const priceStr = priceVal ? `R$ ${Number(priceVal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Sob Consulta';

                          return (
                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-3 font-mono font-bold text-orange-600 dark:text-orange-400">
                                {code}
                              </td>
                              <td className="p-3 font-bold text-slate-900 dark:text-white">
                                {p.name}
                              </td>
                              <td className="p-3">
                                <Badge variant="outline" className="text-[10px]">
                                  {p.category || 'Geral'}
                                </Badge>
                              </td>
                              <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                                {priceStr}
                              </td>
                              <td className="p-3 text-slate-500 max-w-md truncate">
                                {p.description || 'Equipamento Roder de alta performance florestal'}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400">
                            Nenhum equipamento encontrado com os termos de busca.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 8: Guidelines / Learnings */}
        {activeTab === 'guidelines' && (
          <div className="space-y-4">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Database className="w-5 h-5 text-orange-500" />
                      Diretrizes Técnicas e Aprendizados Salvos ({guidelines.length})
                    </CardTitle>
                    <CardDescription>
                      Regras comerciais, respostas consolidadas e ensinamentos cadastrados na IA
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => handleCopyTabText('guidelines', '8. Aprendizados Salvos')}
                    size="sm"
                    variant="outline"
                    className="border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 self-end sm:self-center"
                    title="Copiar todo o texto desta aba"
                  >
                    {copiedTabKey === 'guidelines' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedTabKey === 'guidelines' ? 'Aba Copiada!' : 'Copiar Aba 8'}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {guidelines.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {guidelines.map((g, idx) => (
                      <div key={g.id || idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider bg-orange-100 dark:bg-orange-950/40 px-2 py-0.5 rounded truncate max-w-[200px]">
                            {g.category || 'Ensino Técnico'}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 shrink-0">
                            {g.author && <span className="font-medium text-slate-500 dark:text-slate-400">Por: {g.author.split('@')[0]}</span>}
                            {g.timestamp && (
                              <span>
                                {(() => {
                                  try {
                                    const d = g.timestamp?.toDate ? g.timestamp.toDate() : new Date(g.timestamp);
                                    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR');
                                  } catch {
                                    return '';
                                  }
                                })()}
                              </span>
                            )}
                          </div>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {g.title || 'Instrução Técnica'}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line bg-white/50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                          {g.text || g.content || g.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    Nenhuma diretriz adicional cadastrada no momento. Todas as regras padrão do manual estão ativas.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 9: AI System Prompt */}
        {activeTab === 'prompt' && (
          <div className="space-y-4">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-orange-500" />
                      Prompt de Sistema para Agentes de IA Externos
                    </CardTitle>
                    <CardDescription>
                      Copie e cole este bloco de instruções nas configurações do seu GPT Personalizado, Claude, Gemini ou assistente
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleCopyPrompt}
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center gap-1.5"
                  >
                    {copiedPrompt ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedPrompt ? 'Copiado!' : 'Copiar Prompt'}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="relative">
                  <pre className="p-5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono whitespace-pre-wrap leading-relaxed border border-slate-700 overflow-x-auto">
                    {systemPromptText}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <GoogleDocsExportModal
        isOpen={isGoogleDocsModalOpen}
        onClose={() => setIsGoogleDocsModalOpen(false)}
        products={products}
        guidelines={guidelines}
        userName={profile?.name || user?.email || 'RODER Brasil'}
      />
    </Layout>
  );
}
