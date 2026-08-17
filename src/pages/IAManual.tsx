import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Product } from '../types';
import { generateTechnicalPdf } from '../utils/generateTechnicalPdf';
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
  UserCheck, 
  DollarSign, 
  Clock, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

export default function IAManual() {
  const { profile, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [guidelines, setGuidelines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'compatibility' | 'productivity' | 'hydraulics' | 'catalog' | 'guidelines' | 'prompt'>('overview');
  const [searchProduct, setSearchProduct] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

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

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      generateTechnicalPdf({
        products,
        guidelines,
        version: '2.2.0',
        generatedBy: profile?.name || user?.email || 'RODER Brasil'
      });
      toast.success('Manual Técnico em PDF gerado com sucesso!', {
        description: 'O download foi iniciado contendo todas as tabelas e dados atualizados.'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar o PDF do manual.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const systemPromptText = `Você é o Consultor Técnico e Comercial da RODER Brasil, especialista em equipamentos florestais e de movimentação de carga.

DIRETRIZES INSTITUCIONAIS OBRIGATÓRIAS:
- Mentor e Diretor Técnico: Jeferson Roder (Fundador, Mentor e Criador de toda a tecnologia e equipamentos Roder). NUNCA utilize termos como "gerente de projeto" ou "engenheiro".
- Gerente Comercial: Gislene | Triagem e Gestão de Leads: Luana Camargo.
- Validade de propostas: 60 dias a partir do upload do orçamento.
- Proteção de lead: 60 dias. Comissão é calculada sobre a base_commission_value após desconto.

REGRAS DE COMPATIBILIDADE E DIMENSIONAMENTO:
1. CMF 500: Indicado para escavadeiras de 8 a 14t (ideal 14t). PROIBIDO em retroescavadeiras (risco operacional grave e falta de giro 360° da cabine para desviar de quedas). NÃO recomendado em rebrota (corrente .404 entorta sabre; para rebrota indicar CMF 600 com corrente 3/4"). Para terrenos inclinados (>10°), indicar CMF com biela pendular.
2. Garfo Paleteiro (GPR 4500/7000): Dimensionar SEMPRE pelo porte da pá carregadeira, NUNCA pelo peso da carga. PROIBIDO GPR 4500 em máquinas >8t (força da máquina entorta os garfos). Para 6-9t -> GPR 4500; 8-12t -> GPR 7000.
3. Garras: R280 para escavadeiras 7-8t e feixes de árvores inteiras/eucalipto. R360G para galhadas, resíduos e citrus. Picadores até 600cv -> R400; até 1000cv -> R600.
4. Feller Tesoura (CFTA 50/60): Produção em escavadeira (200-360 árv/h) supera amplamente pá carregadeira (160 árv/h). PROIBIDO feller em terrenos inclinados >10°.
5. Hidráulica: Rotator tem giro infinito 360° (pino 45mm, biela 100mm). Máquinas sem fatia extra usam kit 9000.9000.9016. Escavadeiras com Harvester de fábrica exigem conversão hidráulica e não possuem cilindro da caçamba.`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(systemPromptText);
    setCopiedPrompt(true);
    toast.success('Prompt copiado para a área de transferência!', {
      description: 'Pronto para colar nas instruções do seu Agente de IA.'
    });
    setTimeout(() => setCopiedPrompt(false), 3000);
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <Button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold px-6 py-6 rounded-xl shadow-lg hover:shadow-orange-500/25 transition-all text-sm flex items-center justify-center gap-2.5"
              >
                <Download className={`w-5 h-5 ${isGeneratingPdf ? 'animate-spin' : 'animate-bounce'}`} />
                <span>{isGeneratingPdf ? 'Gerando Documento...' : 'Baixar Manual Completo (PDF)'}</span>
              </Button>

              <Button
                onClick={handleCopyPrompt}
                variant="outline"
                className="border-slate-600 bg-slate-800/80 hover:bg-slate-700 text-slate-100 font-semibold px-4 py-6 rounded-xl text-sm flex items-center justify-center gap-2"
              >
                {copiedPrompt ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copiedPrompt ? 'Prompt Copiado!' : 'Copiar Prompt para Agente'}</span>
              </Button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-slate-700/60">
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
              <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-orange-400" />
                Equipamentos no Catálogo
              </div>
              <div className="text-xl font-bold text-white mt-1">
                {loading ? '...' : products.length > 0 ? products.length : '8 Modelos Base'}
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
              <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Regras de Compatibilidade
              </div>
              <div className="text-xl font-bold text-white mt-1">
                8 Diretrizes Críticas
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
              <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-green-400" />
                Matrizes de Produtividade
              </div>
              <div className="text-xl font-bold text-white mt-1">
                14 Casos & Comprimentos
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
              <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                Aprendizados Salvos
              </div>
              <div className="text-xl font-bold text-white mt-1">
                {guidelines.length} Diretrizes
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
            onClick={() => setActiveTab('catalog')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'catalog'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            5. Catálogo Ao Vivo ({products.length})
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
            6. Aprendizados Salvos ({guidelines.length})
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
            7. Prompt de IA
          </button>
        </div>

        {/* Tab 1: Overview & Business Rules */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-orange-500" />
                  Estrutura Organizacional & Diretrizes Comerciais Obrigatórias
                </CardTitle>
                <CardDescription>
                  Regras institucionais e terminologias autorizadas de governança Roder
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 space-y-2">
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Diretoria & Mentor Técnico</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Jeferson Roder</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      <strong>Termos Autorizados:</strong> Mentor, Fundador, Criador de toda a tecnologia e equipamentos Roder, Professor e Diretor Técnico.
                      <br /><span className="text-red-600 font-semibold">Atenção Crítica:</span> NUNCA se referir como "gerente de projetos" ou "engenheiro".
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
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-orange-500" />
                  Matriz de Compatibilidade e Dimensionamento por Máquina Base
                </CardTitle>
                <CardDescription>
                  Diretrizes técnicas fundamentais para evitar quebras estruturais e acidentes operacionais
                </CardDescription>
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
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-orange-500" />
                  Tabela de Produtividade & Rendimento Operacional em Campo
                </CardTitle>
                <CardDescription>
                  Médias reais de campo Roder calculadas com base em 80% de eficiência operacional (176 horas úteis/mês)
                </CardDescription>
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
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-orange-500" />
                  Diretrizes Hidráulicas, Instalação & Retrofit
                </CardTitle>
                <CardDescription>
                  Requisitos técnicos para adaptações, rotatores e máquinas sem linha auxiliar de fábrica
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
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

        {/* Tab 5: Dynamic Catalog */}
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

        {/* Tab 6: Guidelines / Learnings */}
        {activeTab === 'guidelines' && (
          <div className="space-y-4">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Database className="w-5 h-5 text-orange-500" />
                  Diretrizes Técnicas e Aprendizados Salvos ({guidelines.length})
                </CardTitle>
                <CardDescription>
                  Regras comerciais, respostas consolidadas e ensinamentos cadastrados na IA
                </CardDescription>
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

        {/* Tab 7: AI System Prompt */}
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
    </Layout>
  );
}
