import React, { useState, useRef } from 'react';
import { 
  X, 
  Search, 
  BookOpen, 
  FileText, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Download, 
  Info, 
  Zap, 
  DollarSign,
  Users,
  Briefcase,
  HelpCircle,
  Truck,
  Settings,
  Flame,
  Filter,
  ArrowLeft
} from 'lucide-react';
import { RODER_LOGO_BASE64 } from './RoderLogo';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

interface EstudosComparativosModalProps {
  isOpen?: boolean;
  onClose: () => void;
  initialSearch?: string;
  onOpenGmtFicha?: () => void;
}

interface EstudoDocument {
  id: string;
  title: string;
  category: string;
  keywords: string[];
  summary: string;
  badge: string;
  badgeColor: string;
  content: React.ReactNode;
}

export function EstudosComparativosModal({ onClose, initialSearch = '' }: EstudosComparativosModalProps) {
  const [searchTerm, setSearchTerm] = useState<string>(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedDocId, setSelectedDocId] = useState<string>('regras-comerciais-gislene');
  const [showMobileDetail, setShowMobileDetail] = useState<boolean>(false);
  const printRef = useRef<HTMLDivElement>(null);

  const categories = [
    'Todas',
    'Regras Comerciais & Vendas',
    'Cabeçotes & Poda',
    'Pás Carregadeiras',
    'Garras & Picadores',
    'Linha F & Harvester',
    'Hidráulica & Segurança'
  ];

  const handleShareWhatsapp = (title: string, text: string) => {
    const fullText = `*RODER MÁQUINAS - CENTRAL DE ESTUDOS & DIRETRIZES TÉCNICAS*\n*${title}*\n\n${text}\n\n📌 *Acesse a Central de Estudos Roder para mais informações e orçamentos.*`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`, '_blank');
  };

  const handlePrintPdf = async () => {
    if (!printRef.current) return;
    toast.loading('Gerando PDF do Estudo Técnico/Comercial...', { id: 'estudo-pdf' });
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const dataUrl = await toPng(printRef.current, { quality: 0.98, pixelRatio: 2, cacheBust: true });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Roder_Estudo_Tecnico_${selectedDocId}.pdf`);
      toast.success('PDF baixado com sucesso!', { id: 'estudo-pdf' });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar PDF.', { id: 'estudo-pdf' });
    }
  };

  const documentosEstudos: EstudoDocument[] = [
    {
      id: 'regras-comerciais-gislene',
      title: 'Política Comercial, Regras de Negociação, Validade & Gestão de Leads',
      category: 'Regras Comerciais & Vendas',
      keywords: ['gislene', 'luana', 'comissao', 'comissão', 'validade', 'proposta', 'orcamento', 'orçamento', 'desconto', 'base_commission_value', 'lead', 'proteção', 'protecao', 'jeferson roder', 'gerente'],
      summary: 'Regras oficiais transmitidas pela Gerente Comercial Gislene e Luana: Validade de propostas (60 dias), cálculo de comissão com descontos, proteção de leads e regimento interno.',
      badge: 'Política Comercial Oficial',
      badgeColor: 'bg-emerald-700 text-white',
      content: (
        <div className="space-y-6 text-slate-950 text-sm sm:text-base leading-relaxed">
          {/* Header Documento */}
          <div className="border-b-4 border-emerald-700 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={RODER_LOGO_BASE64} alt="Roder Logo" className="h-10 sm:h-12 w-auto" />
              <div>
                <span className="text-xs font-black uppercase text-emerald-800 block tracking-widest">
                  Diretrizes Comerciais & Regras do Negócio Roder
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-950 uppercase">
                  POLÍTICA COMERCIAL, COMISSÕES, PROPOSTAS & LEADS
                </h2>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-950 font-black text-xs px-3 py-1.5 rounded-md border-2 border-emerald-500 shrink-0">
              Gislene & Luana (Gerência)
            </span>
          </div>

          {/* Destaque Equipe e Nomenclatura */}
          <div className="bg-slate-950 text-white p-4 sm:p-5 rounded-2xl space-y-3 border-2 border-slate-800 shadow-md">
            <p className="font-black text-emerald-400 uppercase flex items-center gap-2 text-sm sm:text-base">
              <Users className="h-5 w-5 text-emerald-400 shrink-0" />
              Quadro de Pessoal & Nomenclatura Obrigatória:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                <p className="font-extrabold text-white text-sm">Gislene</p>
                <p className="text-slate-200 font-bold text-xs sm:text-sm">Gerente Comercial</p>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                <p className="font-extrabold text-white text-sm">Luana</p>
                <p className="text-slate-200 font-bold text-xs sm:text-sm">Triagem e Gestão de Leads</p>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border-2 border-emerald-500">
                <p className="font-black text-emerald-400 text-sm">Jeferson Roder</p>
                <p className="text-slate-100 font-extrabold text-xs sm:text-sm">Mentor, Professor, Fundador & Diretor Técnico</p>
              </div>
            </div>
            <div className="bg-emerald-950/60 border-l-4 border-emerald-500 p-3 rounded-r-lg mt-2">
              <p className="text-xs sm:text-sm text-slate-200 font-bold">
                <strong className="text-emerald-400 uppercase">Atenção Crítica:</strong> NUNCA se refira ao Sr. Jeferson Roder como "gerente de projetos" ou "engenheiro". Utilize estritamente os termos autorizados: Mentor, Professor, Fundador, Criador, Diretor Técnico ou Mentor Técnico.
              </p>
            </div>
          </div>

          {/* Grid Regras Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Box 1: Validade de Propostas */}
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 sm:p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b-2 border-emerald-200 pb-2">
                <span className="font-black text-emerald-950 text-sm sm:text-base uppercase flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-emerald-800 shrink-0" />
                  1. Validade da Negociação
                </span>
                <span className="bg-emerald-800 text-white text-xs font-black px-2.5 py-1 rounded-md">60 Dias</span>
              </div>
              <p className="text-sm font-semibold text-slate-950 leading-relaxed">
                <strong className="text-emerald-950 font-black">Prazo Oficial:</strong> Todas as propostas e orçamentos emitidos possuem validade rigorosa de <span className="bg-emerald-200 text-emerald-950 font-black px-1.5 py-0.5 rounded">60 dias</span> contados a partir do momento do upload do orçamento no sistema.
              </p>
              <div className="bg-white p-3 rounded-lg border border-emerald-300 shadow-xs">
                <p className="text-xs sm:text-sm font-bold text-emerald-950">
                  Após 60 dias sem fechamento, o valor e condições comerciais devem ser reavaliados pela gerência (Gislene) antes de confirmar o pedido ao cliente.
                </p>
              </div>
            </div>

            {/* Box 2: Cálculo de Comissão */}
            <div className="bg-slate-100 border-2 border-slate-300 rounded-xl p-4 sm:p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b-2 border-slate-300 pb-2">
                <span className="font-black text-slate-950 text-sm sm:text-base uppercase flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-slate-800 shrink-0" />
                  2. Regra de Cálculo de Comissão
                </span>
                <span className="bg-slate-800 text-white text-xs font-black px-2.5 py-1 rounded-md">Fórmula Oficial</span>
              </div>
              <p className="text-sm font-semibold text-slate-950 leading-relaxed">
                A comissão do indicador é calculada estritamente sobre o valor do campo <code className="bg-slate-200 text-slate-950 font-black px-1.5 py-0.5 rounded">base_commission_value</code>.
              </p>
              <div className="bg-white p-3 rounded-lg border border-slate-300 space-y-1.5 shadow-xs">
                <p className="font-black text-slate-950 text-xs sm:text-sm uppercase">• Regra de Abatimento de Descontos:</p>
                <p className="text-xs sm:text-sm font-extrabold text-slate-950">
                  Se um desconto for concedido ao cliente na negociação, ele <strong className="underline text-slate-950">DEVE ser deduzido do base_commission_value</strong> antes de aplicar a taxa de comissão.
                </p>
                <p className="text-xs font-bold text-slate-700">
                  A taxa/porcentagem de comissão é fixa com base no perfil do indicador e não se altera durante a negociação.
                </p>
              </div>
            </div>
          </div>

          {/* Proteção de Leads & Avisos de Gerência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-slate-100 border-2 border-slate-300 p-4 sm:p-5 rounded-xl space-y-2.5 shadow-sm">
              <span className="font-black text-slate-950 text-sm sm:text-base uppercase block border-b-2 border-slate-300 pb-1.5">
                3. Proteção de Leads (Luana & Gislene)
              </span>
              <p className="text-sm font-semibold text-slate-950 leading-relaxed">
                A proteção do lead vigora por <strong className="text-slate-950 font-black">60 dias</strong> a partir do envio do orçamento.
              </p>
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                Se a venda não se concretizar em 60 dias, a indicação é cancelada no sistema. Pode ser renovada caso haja comprovação formal de interesse ativo do cliente.
              </p>
            </div>

            <div className="bg-slate-100 border-2 border-slate-300 p-4 sm:p-5 rounded-xl space-y-2.5 shadow-sm">
              <span className="font-black text-slate-950 text-sm sm:text-base uppercase block border-b-2 border-slate-300 pb-1.5">
                4. Alerta de Preenchimento Obrigatório
              </span>
              <p className="text-sm font-extrabold text-slate-950 leading-relaxed">
                Avisos automáticos de atenção são exibidos para Gislene e Luana quando uma indicação está no status <strong className="bg-slate-200 text-slate-950 px-1.5 py-0.5 rounded font-black">'em negociação'</strong> mas não possui o valor <code>base_commission_value</code> cadastrado.
              </p>
            </div>
          </div>
        </div>
      )
    },

    {
      id: 'gmt035-vs-gp150',
      title: 'Comparativo Técnico: GMT 035 / JMT 035 (Importado) x GP 150 Roder',
      category: 'Cabeçotes & Poda',
      keywords: ['gmt', '035', 'gmt035', 'jmt035', 'jmt', 'gp150', 'gp 150', 'poda', 'munck', 'braço isolado', 'braco isolado', 'linha viva', 'cesto aéreo', 'guindaste'],
      summary: 'Regra de indicação comercial obrigatória entre guindastes Munck (GMT 035 / JMT 035) e caminhões com braço isolado / cesto aéreo em redes energizadas (GP 150 Roder).',
      badge: 'Regra Comercial Crítica',
      badgeColor: 'bg-emerald-700 text-white font-black',
      content: (
        <div className="space-y-6 text-slate-950 text-sm sm:text-base leading-relaxed">
          {/* Header Documento */}
          <div className="border-b-4 border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={RODER_LOGO_BASE64} alt="Roder Logo" className="h-10 sm:h-12 w-auto" />
              <div>
                <span className="text-xs font-black uppercase text-slate-700 block tracking-widest">
                  Estudo de Aplicação Comercial & Comparativo Técnico
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-950 uppercase">
                  GMT 035 / JMT 035 (IMPORTADO) VS. GP 150 RODER
                </h2>
              </div>
            </div>
            <span className="bg-slate-100 text-slate-950 border-2 border-slate-400 font-black text-xs px-3 py-1.5 rounded-md shrink-0">
              Uso da Equipe Comercial
            </span>
          </div>

          {/* Objetivo */}
          <div className="bg-slate-100 border-l-6 border-slate-800 p-4 rounded-r-xl text-sm font-semibold space-y-1 shadow-sm">
            <p className="font-black text-slate-950 uppercase text-xs sm:text-sm">Diretriz do Mentor Técnico (Jeferson Roder):</p>
            <p className="text-slate-950 font-semibold leading-relaxed">
              Entenda que as grafias <strong className="text-slate-950 font-black">GMT 035</strong> e <strong className="text-slate-950 font-black">JMT 035</strong> referem-se exatamente ao mesmo equipamento importado. Definir com precisão qual ofertar de acordo com a máquina base do cliente é indispensável para evitar incompatibilidades fatais.
            </p>
          </div>

          {/* Grid Comparativo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Box GMT 035 */}
            <div className="bg-slate-100 border-2 border-slate-300 rounded-xl p-4 sm:p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b-2 border-slate-300 pb-2">
                <span className="font-black text-slate-950 text-sm sm:text-base uppercase">1. Caminhão com Guindaste / Munck</span>
                <span className="bg-slate-800 text-white text-xs font-black px-2.5 py-1 rounded-md">GMT 035 / JMT 035</span>
              </div>
              <p className="font-black text-slate-950 text-sm sm:text-base bg-slate-200 p-2 rounded-md">
                Ofertar EXCLUSIVAMENTE o Cabeçote GMT 035 (Importado)
              </p>
              <p className="text-sm font-semibold text-slate-950 leading-relaxed">
                <strong className="font-black text-slate-950">Motivo Técnico:</strong> Trabalha suspenso por rotator/pendular em guindastes Munck, gruas florestais ou escavadeiras de até 8t. Possui serra de garra e kit de válvulas solenoides dedicado.
              </p>
              <div className="bg-white p-3 rounded-lg border border-slate-300 space-y-1.5 shadow-xs text-xs sm:text-sm font-bold text-slate-950">
                <p className="font-black text-slate-950 uppercase">• Requisitos no Guindaste Munck:</p>
                <p className="flex items-center gap-1.5">✓ Necessita de 4 linhas hidráulicas até a ponta da lança.</p>
                <p className="flex items-center gap-1.5">✓ Vazão: 35 a 65 L/min | Pressão: 185 a 250 Bar.</p>
                <p className="flex items-center gap-1.5">✓ Instalação de válvula de dreno de descarga de pressão na linha de abrir garra (sem 5ª linha).</p>
                <p className="flex items-center gap-1.5">✓ Sistema TTC acionado por controle remoto sem fio para travamento vertical de galhas.</p>
              </div>
            </div>

            {/* Box GP 150 Roder */}
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 sm:p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b-2 border-emerald-200 pb-2">
                <span className="font-black text-emerald-950 text-sm sm:text-base uppercase">2. Caminhão com Braço Isolado (Linha Viva)</span>
                <span className="bg-emerald-800 text-white text-xs font-black px-2.5 py-1 rounded-md">GP 150 Roder</span>
              </div>
              <p className="font-black text-emerald-950 text-sm sm:text-base bg-emerald-200/80 p-2 rounded-md">
                Ofertar EXCLUSIVAMENTE o Cabeçote GP 150 Roder
              </p>
              <p className="text-sm font-semibold text-slate-950 leading-relaxed">
                <strong className="font-black text-emerald-950">Motivo Técnico:</strong> Projetado e construído pela Roder especificamente para acoplamento direto no cesto aéreo de fibra para poda em redes elétricas energizadas com isolamento elétrico certificado.
              </p>
              <div className="bg-white p-3 rounded-lg border border-emerald-300 space-y-1.5 shadow-xs text-xs sm:text-sm font-bold text-slate-950">
                <p className="font-black text-emerald-950 uppercase">• Requisitos no Braço Isolado:</p>
                <p className="flex items-center gap-1.5">✓ Fixação direta no mesmo suporte do cesto de fibra do caminhão de linha viva.</p>
                <p className="flex items-center gap-1.5">✓ 06 engates rápidos de face plana de rápida desconexão.</p>
                <p className="flex items-center gap-1.5">✓ Regulagem hidráulica interna: Serra 200-230 bar | Garra 150-220 bar.</p>
                <p className="flex items-center gap-1.5">✓ Isolamento elétrico testado e aprovado contra choque elétrico em redes energizadas.</p>
              </div>
            </div>
          </div>

          {/* Tabela Matriz */}
          <div className="space-y-2">
            <span className="font-black text-sm sm:text-base text-slate-950 uppercase tracking-wider block">
              Matriz de Decisão Rápida para o Vendedor
            </span>
            <div className="border-2 border-slate-300 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-950 text-white font-black uppercase tracking-wider">
                    <th className="py-3 px-4 border-b border-slate-800">Parâmetro</th>
                    <th className="py-3 px-4 bg-slate-800 border-b border-slate-700">GMT 035 / JMT 035 (Importado)</th>
                    <th className="py-3 px-4 bg-emerald-900 border-b border-emerald-800">GP 150 Roder (Fabricação Própria)</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-200 font-bold text-slate-950">
                  <tr className="bg-slate-50">
                    <td className="py-2.5 px-4 font-black text-slate-950">Tipo de Equipamento Base:</td>
                    <td className="py-2.5 px-4 font-black text-slate-950">Munck / Guindaste / Grua / Escavadeira ≤8t</td>
                    <td className="py-2.5 px-4 font-black text-emerald-950">Caminhão de Braço Isolado (Linha Viva)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-black text-slate-950">Pode usar no Cesto de Fibra?</td>
                    <td className="py-2.5 px-4 font-black text-red-600 bg-red-50">NÃO PERMITIDO</td>
                    <td className="py-2.5 px-4 font-black text-emerald-700 bg-emerald-50">SIM (EXCLUSIVO)</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-2.5 px-4 font-black text-slate-950">Diâmetro de Corte:</td>
                    <td className="py-2.5 px-4">40 cm (único) até 60 cm (duplo)</td>
                    <td className="py-2.5 px-4">150 mm (até 200 mm)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-black text-slate-950">Pressão Operacional:</td>
                    <td className="py-2.5 px-4">185 a 250 Bar (Vazão 35-65 L/min)</td>
                    <td className="py-2.5 px-4">200-230 Bar (Serra) / 150-220 Bar (Garra)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-red-100 border-2 border-red-400 p-4 rounded-xl space-y-1 text-xs sm:text-sm shadow-sm">
            <p className="font-black text-red-950 flex items-center gap-2 uppercase text-sm sm:text-base">
              <AlertTriangle className="h-5 w-5 text-red-700 shrink-0" />
              Proibição Comercial Estreita:
            </p>
            <p className="text-red-950 font-bold leading-relaxed">
              É estritamente proibido oferecer o GP 150 Roder para instalações em guindastes Munck sem validação prévia por escrito da equipe técnica e do Mentor Técnico Jeferson Roder. Em caso de dúvidas sobre o caminhão do cliente, solicite fotos e a ficha técnica da máquina base.
            </p>
          </div>
        </div>
      )
    },

    {
      id: 'garfo-paleteiro-gpr',
      title: 'Dimensionamento de Garfo Paleteiro por Porte da Pá Carregadeira (GPR 4500 x GPR 7000)',
      category: 'Pás Carregadeiras',
      keywords: ['garfo', 'paleteiro', 'gpr', 'gpr4500', 'gpr 4500', 'gpr7000', 'gpr 7000', 'pá carregadeira', 'pa carregadeira'],
      summary: 'Regra de Ouro: O dimensionamento deve ser feito SEMPRE de acordo com o porte da pá carregadeira, NUNCA pelo peso da carga a ser transportada.',
      badge: 'Regra de Ouro Técnica',
      badgeColor: 'bg-emerald-600 text-white font-black',
      content: (
        <div className="space-y-6 text-slate-950 text-sm sm:text-base leading-relaxed">
          <div className="border-b-4 border-emerald-500 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={RODER_LOGO_BASE64} alt="Roder Logo" className="h-10 sm:h-12 w-auto" />
              <div>
                <span className="text-xs font-black uppercase text-emerald-700 block tracking-widest">
                  Diretriz Técnica de Dimensionamento
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-950 uppercase">
                  GARFO PALETEIRO GPR 4500 X GPR 7000
                </h2>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-950 border-2 border-emerald-400 font-black text-xs px-3 py-1.5 rounded-md shrink-0">
              Regra de Ouro
            </span>
          </div>

          <div className="bg-emerald-100 border-l-6 border-emerald-600 p-4 rounded-r-xl space-y-1 shadow-sm">
            <p className="font-black text-emerald-950 uppercase text-xs sm:text-sm">REGRA DE OURO DE DIMENSIONAMENTO:</p>
            <p className="text-emerald-950 font-black text-sm sm:text-base leading-relaxed">
              O dimensionamento do garfo paleteiro deve ser feito SEMPRE de acordo com o tamanho/porte da pá carregadeira, e NUNCA de acordo com o peso da carga a ser transportada.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-slate-100 border-2 border-slate-300 p-4 sm:p-5 rounded-xl space-y-2 shadow-sm">
              <span className="font-black text-slate-950 text-sm sm:text-base uppercase block border-b-2 border-slate-300 pb-1.5">
                Máquinas de 6 a 9 Toneladas: Indique o GPR 4500
              </span>
              <p className="text-sm font-bold text-slate-900 leading-relaxed">
                Projetado estruturalmente para força de empuxo e cilindrada hidráulica de pás carregadeiras pequenas e médias (6 a 9t).
              </p>
            </div>

            <div className="bg-emerald-50 border-2 border-emerald-300 p-4 sm:p-5 rounded-xl space-y-2 shadow-sm">
              <span className="font-black text-emerald-950 text-sm sm:text-base uppercase block border-b-2 border-emerald-300 pb-1.5">
                Máquinas de 8 a 12+ Toneladas: Indique o GPR 7000
              </span>
              <p className="text-sm font-bold text-emerald-950 leading-relaxed">
                Obrigatório para pás carregadeiras pesadas (acima de 8t). Estrutura reforçada para suportar a imensa força bruta do braço da máquina.
              </p>
            </div>
          </div>

          <div className="bg-red-100 border-2 border-red-400 p-4 rounded-xl space-y-2 text-xs sm:text-sm shadow-sm">
            <p className="font-black text-red-950 uppercase flex items-center gap-2 text-sm sm:text-base">
              <AlertTriangle className="h-5 w-5 text-red-700 shrink-0" />
              Proibição e Risco Técnico (Uso do GPR 4500 em Máquinas &gt; 8 Toneladas):
            </p>
            <p className="text-red-950 font-black text-sm">
              É estritamente PROIBIDO utilizar o GPR 4500 em pás carregadeiras acima de 8 toneladas, mesmo que o cliente alegue que a carga a ser levantada pesa menos de 4.500 kg!
            </p>
            <p className="text-red-900 font-bold leading-relaxed">
              <strong>Justificativa Técnica:</strong> Pás carregadeiras pesadas possuem força bruta colossal na hidráulica. Se o operador fizer força sobre um único garfo ou pegar a carga descentralizada, a força bruta da máquina vai entortar o garfo na ponta ou na base. Se o garfo ceder por mau dimensionamento de máquina base, a garantia será negada.
            </p>
          </div>
        </div>
      )
    },

    {
      id: 'gavras-picador-florestal',
      title: 'Dimensionamento de Garras Florestais para Alimentação de Picadores (R280, R360, R360G, R400, R600)',
      category: 'Garras & Picadores',
      keywords: ['garra', 'picador', 'r280', 'r360', 'r360g', 'r400', 'r600', 'alimentação', 'eucalipto', 'galhada', 'residuos', 'resíduos'],
      summary: 'Critérios de seleção para gavras R280, R360, R360G, R400 e R600 com base na potência do picador, tipo de madeira e estabilidade da máquina base.',
      badge: 'Guia de Vendas',
      badgeColor: 'bg-emerald-700 text-white font-black',
      content: (
        <div className="space-y-6 text-slate-950 text-sm sm:text-base leading-relaxed">
          <div className="border-b-4 border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={RODER_LOGO_BASE64} alt="Roder Logo" className="h-10 sm:h-12 w-auto" />
              <div>
                <span className="text-xs font-black uppercase text-slate-700 block tracking-widest">
                  Estudo de Aplicação Comercial
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-950 uppercase">
                  GARRAS FLORESTAIS PARA ALIMENTAÇÃO DE PICADORES
                </h2>
              </div>
            </div>
            <span className="bg-slate-100 text-slate-950 border-2 border-slate-400 font-black text-xs px-3 py-1.5 rounded-md shrink-0">
              Dimensionamento Picadores
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-slate-100 border-2 border-slate-300 p-4 rounded-xl space-y-1.5 shadow-sm">
              <p className="font-black text-slate-950 text-sm uppercase">Picadores até 600 cv (HP):</p>
              <p className="font-black text-slate-950 text-base sm:text-lg">Utilizar Garra R400</p>
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                Garante o volume ideal de alimentação contínua sem sobrecarregar a mesa do picador.
              </p>
            </div>

            <div className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-xl space-y-1.5 shadow-sm">
              <p className="font-black text-emerald-950 text-sm uppercase">Picadores até 1.000 cv (HP):</p>
              <p className="font-black text-emerald-950 text-base sm:text-lg">Utilizar Garra R600</p>
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                Alta capacidade volumétrica para picadores industriais de alta produtividade.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <span className="font-black text-sm sm:text-base text-slate-950 uppercase tracking-wider block">
              Aplicações Especiais em Escavadeiras Pequenas (7 a 13 Toneladas):
            </span>
            <div className="bg-slate-100 border-2 border-slate-300 p-3.5 rounded-xl space-y-1">
              <p className="font-black text-slate-950 text-sm sm:text-base">• Árvores Inteiras e Eucalipto (Arraste):</p>
              <p className="text-sm font-bold text-slate-900">
                Indique a <strong className="text-slate-950 font-black">Garra R280</strong>. Foi projetada para agarrar feixes de árvores inteiras e arrastá-las usando a força de giro da escavadeira até a boca do picador.
              </p>
            </div>

            <div className="bg-slate-100 border-2 border-slate-300 p-3.5 rounded-xl space-y-1">
              <p className="font-black text-slate-950 text-sm sm:text-base">• Resíduos, Galhadas, Paletes e Restos de Pés de Laranja:</p>
              <p className="text-sm font-bold text-slate-900">
                Indique a <strong className="text-slate-950 font-black">Garra R360G</strong> (com unha tipo garfo, aberta). Excelente penetração para carregar resíduos e galhadas trançadas para a esteira do picador.
              </p>
            </div>

            <div className="bg-slate-100 border-2 border-slate-300 p-3.5 rounded-xl space-y-1 text-slate-950">
              <p className="font-black uppercase text-xs sm:text-sm">Alerta Obrigatório de Instabilidade (Escavadeiras 7 a 10t):</p>
              <p className="text-xs sm:text-sm font-bold">
                Ao ofertar a R360 ou R360G para escavadeiras de 7 a 10t, alerte formalmente o cliente que arrastar feixes longos pode fazer a máquina "levantar a traseira". Recomende o Rotator de 6 Toneladas com ponteira/biela dedicada.
              </p>
            </div>
          </div>
        </div>
      )
    },

    {
      id: 'linha-f-harvester-compatibilidade',
      title: 'Diretrizes de Escavadeiras com Harvester ou Linha F (Florestal) de Fábrica',
      category: 'Linha F & Harvester',
      keywords: ['harvester', 'linha f', 'florestal', 'biela', 'ponteira', 'rotator', 'cilindro', 'cacamba', 'caçamba', 'feller', 'desbastador', 'triturador'],
      summary: 'Alertas de incompatibilidade direta entre escavadeiras preparadas para Harvester e outros acessórios, ausência de cilindro da caçamba e padrões de biela para Rotator Roder.',
      badge: 'Compatibilidade Crítica',
      badgeColor: 'bg-red-700 text-white font-black',
      content: (
        <div className="space-y-6 text-slate-950 text-sm sm:text-base leading-relaxed">
          <div className="border-b-4 border-red-600 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={RODER_LOGO_BASE64} alt="Roder Logo" className="h-10 sm:h-12 w-auto" />
              <div>
                <span className="text-xs font-black uppercase text-red-700 block tracking-widest">
                  Análise de Compatibilidade de Máquina Base
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-950 uppercase">
                  ESCAVADEIRAS COM HARVESTER OU LINHA F DE FÁBRICA
                </h2>
              </div>
            </div>
            <span className="bg-red-100 text-red-950 border-2 border-red-400 font-black text-xs px-3 py-1.5 rounded-md shrink-0">
              Atenção de Fábrica
            </span>
          </div>

          <div className="space-y-4">
            <div className="bg-red-100 border-2 border-red-400 p-4 rounded-xl space-y-1.5 shadow-sm">
              <p className="font-black text-red-950 uppercase flex items-center gap-2 text-sm sm:text-base">
                <AlertTriangle className="h-5 w-5 text-red-700 shrink-0" />
                1. Incompatibilidade Direta com Garras de Carregamento:
              </p>
              <p className="text-sm font-black text-red-950 leading-relaxed">
                Escavadeiras configuradas ou operando com Harvester florestal NÃO são compatíveis diretamente com gavras de carregamento, gavras traçadoras ou cabeçotes multifuncionais sem modificações hidráulicas e elétricas profundas e irreversíveis.
              </p>
              <p className="text-xs sm:text-sm font-bold text-red-900">
                O Harvester utiliza linha de pressão única de alto fluxo com união de bombas e bloco solenoide no próprio cabeçote. Mudar para garra convencional exige desativar a elétrica original e alterar o comando para fluxo bidirecional.
              </p>
            </div>

            <div className="bg-slate-100 border-2 border-slate-300 p-4 rounded-xl space-y-1.5 shadow-sm">
              <p className="font-black text-slate-950 uppercase flex items-center gap-2 text-sm sm:text-base">
                <Info className="h-5 w-5 text-slate-700 shrink-0" />
                2. Ponto Crítico de Ausência: Cilindro e Links da Caçamba Ausentes
              </p>
              <p className="text-sm font-black text-slate-950">
                Escavadeiras com Harvester ou Linha F de fábrica normalmente NÃO vêm equipadas com o cilindro da caçamba, bielas/links e pinos originais!
              </p>
              <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">
                Sem esses componentes instalados na máquina base, é estritamente IMPOSSÍVEL instalar equipamentos que necessitam da articulação do cilindro da caçamba, tais como: Feller de Disco, Feller Tesoura, Desbastador, Triturador e a própria Caçamba/Concha.
              </p>
            </div>

            <div className="bg-slate-100 border-2 border-slate-300 p-4 rounded-xl space-y-1.5 shadow-sm">
              <p className="font-black text-slate-950 uppercase text-sm sm:text-base">3. Medidas Padrão de Biela para Rotator Roder:</p>
              <p className="text-sm font-bold text-slate-900 leading-relaxed">
                A biela para acoplar nos rotatores padrão RODER deve possuir obrigatoriamente um <strong className="text-slate-950 font-black">furo para pino de 45 mm</strong> com <strong className="text-slate-950 font-black">largura de biela de exatamente 100 mm</strong>.
              </p>
              <p className="text-xs font-bold text-slate-700 italic">
                Sempre solicite ao vendedor que confirme com a concessionária ou forneça um vídeo detalhado das linhas hidráulicas e da ponta do braço antes do fechamento.
              </p>
            </div>
          </div>
        </div>
      )
    },

    {
      id: 'cabecote-cmf500-retro',
      title: 'Inviabilidade de Cabeçote Multifuncional (CMF 500) em Retroescavadeiras',
      category: 'Colheita Florestal',
      keywords: ['cmf500', 'cmf 500', 'retroescavadeira', 'cabeçote', 'cabecote', 'escavadeira', 'esteira'],
      summary: 'Entenda os motivos hidráulicos, operacionais e de segurança pelos quais a Roder NÃO recomenda o CMF 500 em retroescavadeiras.',
      badge: 'Alerta Operacional & Segurança',
      badgeColor: 'bg-red-700 text-white font-black',
      content: (
        <div className="space-y-6 text-slate-950 text-sm sm:text-base leading-relaxed">
          <div className="border-b-4 border-red-600 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={RODER_LOGO_BASE64} alt="Roder Logo" className="h-10 sm:h-12 w-auto" />
              <div>
                <span className="text-xs font-black uppercase text-red-700 block tracking-widest">
                  Diretriz Técnica de Segurança e Engenharia
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-950 uppercase">
                  INVIABILIDADE DE CMF 500 EM RETROESCAVADEIRAS
                </h2>
              </div>
            </div>
            <span className="bg-red-100 text-red-950 border-2 border-red-400 font-black text-xs px-3 py-1.5 rounded-md shrink-0">
              Regra de Segurança
            </span>
          </div>

          <div className="bg-red-100 border-l-6 border-red-600 p-4 rounded-r-xl space-y-1 shadow-sm">
            <p className="font-black text-red-950 uppercase text-xs sm:text-sm">RECOMENDAÇÃO OFICIAL RODER:</p>
            <p className="text-red-950 font-black text-base sm:text-lg leading-relaxed">
              A Roder NÃO realiza ou recomenda a instalação de cabeçote multifuncional (CMF 500) em retroescavadeiras.
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-100 border-2 border-slate-300 p-3.5 rounded-xl space-y-1">
              <p className="font-black text-slate-950 text-sm sm:text-base">1. Motivo Hidráulico vs. Operacional:</p>
              <p className="text-sm font-bold text-slate-900 leading-relaxed">
                Hidraulicamente o fluxo e pressão são compatíveis, porém operacionalmente a produtividade é baixíssima devido ao alcance limitado do braço (curso de apenas 2,5 metros) e à falta de giro da cabine (apenas o braço gira traseiramente).
              </p>
            </div>

            <div className="bg-slate-100 border-2 border-slate-300 p-3.5 rounded-xl space-y-1">
              <p className="font-black text-slate-950 text-sm sm:text-base">2. Risco Crítico de Segurança do Operador:</p>
              <p className="text-sm font-bold text-slate-900 leading-relaxed">
                Em caso de queda acidental da árvore sobre a cabine (vento contra ou erro no corte), o operador da retroescavadeira não consegue girar a cabine para se proteger. Em escavadeiras de esteira com giro central de 360°, a fuga/giro é imediata.
              </p>
            </div>

            <div className="bg-emerald-100 border-2 border-emerald-300 p-3.5 rounded-xl space-y-1">
              <p className="font-black text-emerald-950 text-sm sm:text-base">3. Alternativa Recomendada ao Cliente:</p>
              <p className="text-sm font-bold text-emerald-950 leading-relaxed">
                Indique a aquisição de uma <strong className="text-emerald-950 font-black">escavadeira de esteira pequena (7 a 8 toneladas)</strong>. São ágeis, fáceis de transportar, possuem excelente alcance e alta economia de combustível por hora de trabalho.
              </p>
            </div>
          </div>
        </div>
      )
    },

    {
      id: 'kit-sem-fatia-extra',
      title: 'Instalação em Escavadeiras Sem Fatia Extra de Comando (Kit 9000.9000.9016)',
      category: 'Hidráulica & Segurança',
      keywords: ['fatia extra', 'comando', 'kit', '9000.9000.9016', 'rotator', 'escavadeira', 'komatsu', 'volvo'],
      summary: 'Funcionamento do Kit 9000.9000.9016 em escavadeiras sem comando extra e características operacionais de vazão.',
      badge: 'Manual do Técnico',
      badgeColor: 'bg-slate-800 text-white font-black',
      content: (
        <div className="space-y-6 text-slate-950 text-sm sm:text-base leading-relaxed">
          <div className="border-b-4 border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={RODER_LOGO_BASE64} alt="Roder Logo" className="h-10 sm:h-12 w-auto" />
              <div>
                <span className="text-xs font-black uppercase text-slate-700 block tracking-widest">
                  Orientações de Adequação Hidráulica
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-950 uppercase">
                  MÁQUINAS SEM FATIA EXTRA DE COMANDO • KIT 9016
                </h2>
              </div>
            </div>
            <span className="bg-slate-100 text-slate-950 border-2 border-slate-400 font-black text-xs px-3 py-1.5 rounded-md shrink-0">
              Código 9000.9000.9016
            </span>
          </div>

          <div className="bg-slate-100 border-2 border-slate-300 p-4 rounded-xl space-y-1">
            <p className="font-black text-slate-950 text-sm sm:text-base">Aplicação:</p>
            <p className="text-sm font-bold text-slate-900 leading-relaxed">
              Escavadeiras que não possuem a fatia extra original de fábrica no comando (ex: Komatsu PC200, PC210, Volvo 200, etc.) utilizam o <strong className="text-slate-950 font-black">Kit 9000.9000.9016</strong>.
            </p>
          </div>

          <div className="bg-slate-100 border-2 border-slate-300 p-4 rounded-xl space-y-2">
            <p className="font-black text-slate-950 uppercase flex items-center gap-2 text-sm sm:text-base">
              <Info className="h-5 w-5 text-slate-700 shrink-0" />
              Característica Normal de Funcionamento (Orientar o Cliente):
            </p>
            <p className="text-sm font-bold text-slate-900 leading-relaxed">
              O kit deriva a pressão direto da bomba principal. Quando a escavadeira está estática (idle/marcha lenta sem mover braço), a bomba reduz para vazão mínima, tornando o giro do rotator lento.
            </p>
            <p className="text-xs sm:text-sm font-bold text-slate-800">
              A rotação normaliza instantaneamente quando o operador faz qualquer movimento simultâneo (erguer braço ou girar cabine). Trata-se de uma característica normal do sistema e não defeito.
            </p>
          </div>

          <div className="bg-red-100 border-2 border-red-400 p-4 rounded-xl space-y-1.5 text-red-950 shadow-sm">
            <p className="font-black uppercase text-sm sm:text-base">Risco em Cabeçote Multifuncional:</p>
            <p className="text-sm font-bold leading-relaxed">
              Para o cabeçote multifuncional, a instalação física sem fatia extra é viável, porém a operação de colheita torna-se perigosa sem a fatia extra original. Por conta disso, a Roder <strong className="text-red-950 font-black underline">NÃO recomenda</strong> instalar cabeçotes multifuncionais sem fatia extra original de comando.
            </p>
          </div>
        </div>
      )
    }
  ];

  const filteredDocs = documentosEstudos.filter(doc => {
    if (selectedCategory !== 'Todas' && doc.category !== selectedCategory) {
      return false;
    }
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      doc.title.toLowerCase().includes(term) ||
      doc.category.toLowerCase().includes(term) ||
      doc.summary.toLowerCase().includes(term) ||
      doc.keywords.some(k => k.toLowerCase().includes(term))
    );
  });

  const selectedDoc = documentosEstudos.find(d => d.id === selectedDocId) || documentosEstudos[0];

  const handleSelectDoc = (id: string) => {
    setSelectedDocId(id);
    setShowMobileDetail(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-1 sm:p-3 md:p-5 overflow-y-auto backdrop-blur-md antialiased selection:bg-emerald-600 selection:text-white">
      <div className="relative w-[98vw] max-w-[1600px] h-[95vh] max-h-[1080px] bg-slate-950 border-2 border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 bg-slate-900 border-b-2 border-slate-800 shrink-0 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-emerald-950/60 border-2 border-emerald-700/60 rounded-xl shadow-xs">
              <BookOpen className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-white tracking-wide flex items-center gap-2 flex-wrap">
                Central de Estudos Técnicos, Regras Comerciais & Diretrizes Roder
                <span className="text-xs bg-emerald-700 text-white font-black px-3 py-1 rounded-md uppercase border border-emerald-600 shadow-xs">
                  Base Comercial & Suporte
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5 hidden sm:block">
                Políticas de vendas (Gislene & Luana), comissões, regras de dimensionamento, matrizes de decisão e estudos operacionais.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black transition-all border border-slate-700 hover:border-emerald-500 shadow-sm"
            title="Fechar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Category Tabs Filter */}
        <div className="flex items-center gap-2.5 px-5 sm:px-7 py-3 bg-slate-950 border-b-2 border-slate-800 overflow-x-auto shrink-0 scrollbar-none">
          <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mr-1 shrink-0 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 shadow-xs">
            <Filter className="h-4 w-4 text-emerald-400" /> Categoria:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setShowMobileDetail(false);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all shrink-0 border-2 ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md scale-102'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content Area: Sidebar + Document Display */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 bg-slate-950">
          
          {/* Sidebar Left: Search & Document List (hidden on mobile if detail is shown) */}
          <div className={`md:col-span-4 lg:col-span-3 border-r-2 border-slate-800 bg-slate-900 p-4 flex flex-col gap-3.5 overflow-y-auto ${
            showMobileDetail ? 'hidden md:flex' : 'flex'
          }`}>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Buscar estudo (ex: Gislene, GMT035, Garfo)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border-2 border-slate-800 focus:border-emerald-500 text-white text-xs sm:text-sm pl-10 pr-8 py-2.5 rounded-xl focus:outline-none placeholder:text-slate-400 font-bold shadow-inner"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-black bg-slate-800 rounded-full h-5 w-5 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-emerald-400" />
                Estudos & Regras ({filteredDocs.length})
              </span>
              {selectedCategory !== 'Todas' && (
                <span className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md font-bold">
                  {selectedCategory}
                </span>
              )}
            </div>

            {/* List */}
            <div className="space-y-3 flex-1">
              {filteredDocs.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex flex-col gap-2.5 ${
                    selectedDocId === doc.id
                      ? 'bg-slate-900 border-emerald-500 shadow-xl text-white ring-1 ring-emerald-500/30'
                      : 'bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-900/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-md shadow-xs ${doc.badgeColor}`}>
                      {doc.badge}
                    </span>
                    <span className="text-xs text-slate-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                      {doc.category}
                    </span>
                  </div>
                  {/* Green Title for cards as requested by user */}
                  <h3 className="text-xs sm:text-sm font-black leading-snug text-emerald-400 group-hover:text-emerald-300">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium line-clamp-2 leading-relaxed">
                    {doc.summary}
                  </p>
                </button>
              ))}

              {filteredDocs.length === 0 && (
                <div className="p-8 text-center text-slate-300 text-xs sm:text-sm space-y-2 bg-slate-950 rounded-xl border border-slate-800">
                  <p className="font-bold text-white">Nenhum estudo encontrado.</p>
                  <p className="text-xs text-slate-400">Tente buscar por "Gislene", "GMT", "Garfo", "Picador" ou limpe os filtros.</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Document Viewer (visible on desktop or on mobile when showMobileDetail is true) */}
          <div className={`md:col-span-8 lg:col-span-9 flex-col bg-slate-950 overflow-y-auto p-4 sm:p-6 md:p-8 ${
            showMobileDetail ? 'flex' : 'hidden md:flex'
          }`}>
            
            {/* Mobile Back Button */}
            <div className="md:hidden mb-4">
              <button
                onClick={() => setShowMobileDetail(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-white font-black text-xs border border-slate-700 shadow-md"
              >
                <ArrowLeft className="h-4 w-4 text-emerald-400" />
                <span>Voltar para Lista de Documentos</span>
              </button>
            </div>

            {/* Action Bar for selected doc */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b-2 border-slate-800 mb-6 gap-3.5 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                  Documento Ativo Selecionado:
                </span>
                <h3 className="text-sm sm:text-base md:text-lg text-white font-black">
                  {selectedDoc.title}
                </h3>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => handleShareWhatsapp(selectedDoc.title, selectedDoc.summary)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black transition-all shadow-md border border-emerald-500"
                  title="Compartilhar resumo via WhatsApp"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Enviar WhatsApp</span>
                </button>

                <button
                  onClick={handlePrintPdf}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-black transition-all shadow-md border border-slate-600 hover:border-emerald-500"
                  title="Baixar cópia impressa em PDF"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar PDF</span>
                </button>
              </div>
            </div>

            {/* Document Printable Card */}
            <div className="flex justify-center pb-8">
              <div 
                ref={printRef}
                className="w-full max-w-[1100px] bg-white text-slate-950 rounded-2xl p-6 sm:p-9 md:p-12 shadow-2xl border-2 border-slate-300 select-text"
              >
                {selectedDoc.content}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
