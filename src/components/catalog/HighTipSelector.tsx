import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Calculator, 
  ArrowRight, 
  Layers, 
  Cpu, 
  CheckCircle, 
  HelpCircle,
  Truck,
  Scale,
  FileText,
  Share2,
  Printer,
  X,
  ChevronRight,
  Check
} from 'lucide-react';
import { 
  MACHINES, 
  MATERIALS, 
  getRecommendedBucket, 
  calculateDischargeHeights,
  Machine, 
  Material 
} from './HighTipData';
import { RODER_LOGO_BASE64 } from './RoderLogo';

interface HighTipSelectorProps {
  onSelectModel?: (modelCapacity: string) => void;
  embedded?: boolean;
}

export function HighTipSelector({ onSelectModel, embedded = false }: HighTipSelectorProps) {
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedModelName, setSelectedModelName] = useState<string>('');
  const [densityMode, setDensityMode] = useState<'material' | 'custom'>('material');
  const [selectedMaterialName, setSelectedMaterialName] = useState<string>('');
  const [customDensity, setCustomDensity] = useState<number>(350); // Default wood chip density
  const [recommendation, setRecommendation] = useState<{
    capacity: string;
    machine: Machine;
    materialName: string;
    density: number;
    materialClass: 'light' | 'medium' | 'heavy';
  } | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Get unique brands
  const brands = Array.from(new Set(MACHINES.map(m => m.brand))).sort();

  // Get models for selected brand
  const models = MACHINES.filter(m => m.brand === selectedBrand).sort((a, b) => a.operatingWeight - b.operatingWeight);

  // Handle brand change
  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setSelectedModelName('');
    setRecommendation(null);
  };

  // Handle model change
  const handleModelChange = (modelName: string) => {
    setSelectedModelName(modelName);
  };

  // Run recommendation calculation
  useEffect(() => {
    if (!selectedBrand || !selectedModelName) {
      setRecommendation(null);
      return;
    }

    const machine = MACHINES.find(m => m.brand === selectedBrand && m.model === selectedModelName);
    if (!machine) return;

    let density = customDensity;
    let matName = 'Personalizado';

    if (densityMode === 'material') {
      const material = MATERIALS.find(m => m.name === selectedMaterialName);
      if (material) {
        density = material.density;
        matName = material.name;
      } else {
        // If no material selected yet, don't recommend
        setRecommendation(null);
        return;
      }
    } else {
      matName = `Densidade ${customDensity} kg/m³`;
    }

    const recommendedSize = getRecommendedBucket(machine, density);
    let matClass: 'light' | 'medium' | 'heavy' = 'heavy';
    if (density <= 600) {
      matClass = 'light';
    } else if (density <= 1000) {
      matClass = 'medium';
    }

    setRecommendation({
      capacity: recommendedSize,
      machine,
      materialName: matName,
      density,
      materialClass: matClass
    });

  }, [selectedBrand, selectedModelName, densityMode, selectedMaterialName, customDensity]);

  const heights = recommendation ? calculateDischargeHeights(recommendation.machine, recommendation.capacity) : null;

  const generateWhatsAppText = () => {
    if (!recommendation || !reportData || !heights) return '';
    const brand = recommendation.machine.brand;
    const model = recommendation.machine.model;
    const material = recommendation.materialName;
    const cap = recommendation.capacity;
    const density = recommendation.density;
    const origBucketCap = reportData.origBucketCap;
    const payloadLimit = reportData.payloadLimit;
    const loadWithOriginalBucket = reportData.loadWithOriginalBucket;
    const loadWithHighTip = reportData.loadWithHighTip;
    const utilizationWithOriginalBucket = reportData.utilizationWithOriginalBucket;
    const utilizationWithHighTip = reportData.utilizationWithHighTip;
    const gainPercentage = reportData.gainPercentage;
    const standardH = heights.standardDischargeHeight.toFixed(2);
    const finalH = heights.highTipDischargeHeight.toFixed(2);
    const gain = heights.gainHeight.toFixed(2);

    return `*ESTUDO TÉCNICO DE PRODUTIVIDADE - RODER BRASIL* 🚀\n` +
           `----------------------------------------\n` +
           `Análise de Dimensionamento e Viabilidade de Caçamba de Alto Volteio (High Tip)\n\n` +
           `*1. EQUIPAMENTO E OPERAÇÃO:*\n` +
           `• Carregadeira: *${brand} ${model}*\n` +
           `• Material de Trabalho: *${material}*\n` +
           `• Densidade Real: *${density} kg/m³*\n\n` +
           `*2. DIMENSIONAMENTO RECOMENDADO:*\n` +
           `• Caçamba Original Padrão: *${origBucketCap.toFixed(1)} m³*\n` +
           `• 👉 *CAÇAMBA INDICADA: Caçamba High Tip Roder de ${cap} m³*\n` +
           `• Limite de Carga de Segurança (Payload): *${payloadLimit.toLocaleString('pt-BR')} kg*\n\n` +
           `*3. ESTUDO DE PRODUTIVIDADE POR CICLO:*\n` +
           `• Carga com Caçamba Padrão: *${loadWithOriginalBucket.toLocaleString('pt-BR')} kg* (${utilizationWithOriginalBucket}% da capacidade)\n` +
           `• Carga com Caçamba High Tip Roder: *${loadWithHighTip.toLocaleString('pt-BR')} kg* (${utilizationWithHighTip}% da capacidade)\n` +
           `• 📈 *Ganho Volumétrico Estimado:* *+${gainPercentage}%* de volume por ciclo!\n\n` +
           `*4. GANHO GEOMÉTRICO DE ALTURA DE DESCARGA:*\n` +
           `• Altura Original de Descarga Livre: *${standardH} m*\n` +
           `• 🔺 *Altura de Descarga High Tip Roder:* *${finalH} m*\n` +
           `• 📈 *Ganho Real de Altura Livre:* *+${gain} m*\n\n` +
           `*5. JUSTIFICATIVA TÉCNICA:*\n` +
           `• Ao carregar ${material} com a caçamba padrão de ${origBucketCap.toFixed(1)} m³, a máquina trabalha "vazia" volumetricamente com apenas ${utilizationWithOriginalBucket}% da sua capacidade útil de carga. Com a *Caçamba High Tip Roder de ${cap} m³*, a produtividade por ciclo sobe para ${utilizationWithHighTip}% do limite de segurança, entregando *+${gainPercentage}% de volume por ciclo* sem sobrecarregar a estrutura hidráulica!\n\n` +
           `Este estudo confirma que a Caçamba High Tip Roder de ${cap} m³ é a escolha ideal de produtividade para a sua operação.`;
  };

  const generateWhatsAppLink = () => {
    const text = generateWhatsAppText();
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  const handleCopyText = () => {
    const text = generateWhatsAppText();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handlePrint = () => {
    const printContent = reportRef.current;
    if (!printContent) return;

    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.title = 'Relatorio_Tecnico_Roder_High_Tip';

    // Get Tailwind style tags or other styles to inject into iframe so it retains beautiful layout
    let stylesHTML = '';
    const styleElements = document.querySelectorAll('style, link[rel="stylesheet"]');
    styleElements.forEach(el => {
      stylesHTML += el.outerHTML;
    });

    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório Técnico Roder High Tip</title>
          ${stylesHTML}
          <style>
            @media print {
              @page {
                size: A4;
                margin: 1.2cm 1cm;
              }
              body {
                background-color: white !important;
                color: black !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                padding: 0 !important;
                margin: 0 !important;
              }
            }
            body {
              padding: 10px;
              margin: 0;
              background-color: white;
              font-family: system-ui, sans-serif;
            }
            .print-container {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
                setTimeout(function() {
                  window.parent.document.body.removeChild(window.frameElement);
                }, 500);
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  const getReportData = () => {
    if (!recommendation) return null;
    
    const machine = recommendation.machine;
    const materialName = recommendation.materialName;
    const density = recommendation.density;
    const recCap = parseFloat(recommendation.capacity.replace(',', '.'));
    
    // Parse original bucket capacity
    const origBucketStr = machine.originalBucket.replace('m³', '').replace('m3', '').replace(',', '.').trim();
    const origBucketCap = parseFloat(origBucketStr) || 2.0;
    
    // Limits
    const payloadLimit = Math.round(machine.operatingWeight * 300); // in kg
    const loadWithOriginalBucket = Math.round(origBucketCap * density);
    const loadWithHighTip = Math.round(recCap * density);
    
    const utilizationWithOriginalBucket = Math.min(100, Math.round((loadWithOriginalBucket / payloadLimit) * 100));
    const utilizationWithHighTip = Math.min(100, Math.round((loadWithHighTip / payloadLimit) * 100));
    const gainPercentage = Math.round(((loadWithHighTip - loadWithOriginalBucket) / loadWithOriginalBucket) * 100);
    
    return {
      machine,
      materialName,
      density,
      recCap,
      origBucketCap,
      payloadLimit,
      loadWithOriginalBucket,
      loadWithHighTip,
      utilizationWithOriginalBucket,
      utilizationWithHighTip,
      gainPercentage,
    };
  };

  const reportData = getReportData();

  return (
    <div className={`w-full rounded-2xl border border-border bg-card text-card-foreground shadow-sm ${embedded ? 'p-0 border-none bg-transparent shadow-none' : 'p-6'}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
          <Calculator className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-extrabold text-lg text-foreground">Guia de Seleção Digital</h4>
          <p className="text-xs text-muted-foreground">Selecione a carregadeira e o material para obter o modelo ideal.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Controls */}
        <div className="space-y-4">
          {/* Step 1: Carregadeira Brand */}
          <div>
            <label className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block mb-1.5">
              1. Marca da Carregadeira
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {brands.map(brand => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => handleBrandChange(brand)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-all truncate text-center ${
                    selectedBrand === brand
                      ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-muted/20 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Carregadeira Model */}
          {selectedBrand && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-1.5"
            >
              <label className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block">
                2. Modelo da Máquina
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1">
                {models.map(m => (
                  <button
                    key={m.model}
                    type="button"
                    onClick={() => handleModelChange(m.model)}
                    className={`px-2 py-2 rounded-lg text-xs font-bold border transition-all text-left flex flex-col justify-between ${
                      selectedModelName === m.model
                        ? 'bg-primary/15 border-primary text-primary shadow-sm'
                        : 'border-border bg-muted/10 hover:bg-muted text-foreground'
                    }`}
                  >
                    <span className="font-extrabold">{m.model}</span>
                    <span className="text-[9px] text-muted-foreground font-medium">{m.operatingWeight}t | {m.class}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Material or Density selection */}
          {selectedModelName && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block">
                  3. Tipo de Material / Densidade
                </label>
                <div className="flex border border-border rounded-lg overflow-hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => setDensityMode('material')}
                    className={`px-2 py-1 text-[9px] font-bold transition-all ${
                      densityMode === 'material'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Materiais
                  </button>
                  <button
                    type="button"
                    onClick={() => setDensityMode('custom')}
                    className={`px-2 py-1 text-[9px] font-bold transition-all ${
                      densityMode === 'custom'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Densidade Direta
                  </button>
                </div>
              </div>

              {densityMode === 'material' ? (
                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {MATERIALS.map(m => (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => setSelectedMaterialName(m.name)}
                      className={`px-2 py-2 rounded-lg text-left border transition-all flex flex-col justify-between ${
                        selectedMaterialName === m.name
                          ? 'bg-primary/10 border-primary text-primary shadow-sm'
                          : 'border-border bg-muted/10 hover:bg-muted text-foreground'
                      }`}
                    >
                      <span className="text-xs font-bold truncate block" title={m.name}>{m.name}</span>
                      <span className="text-[9px] text-muted-foreground flex items-center justify-between w-full font-medium">
                        <span>{m.density} kg/m³</span>
                        <span className={`text-[8px] font-black uppercase px-1 rounded-sm ${
                          m.density <= 600 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : m.density <= 1000
                              ? 'bg-sky-500/10 text-sky-500'
                              : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {m.density <= 600 ? 'Leve' : m.density <= 1000 ? 'Médio' : 'Pesado'}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 bg-muted/25 p-3 rounded-xl border border-border/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">Densidade Estimada:</span>
                    <span className="font-mono text-sm font-black text-primary">{customDensity} kg/m³</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="2500"
                    step="50"
                    value={customDensity}
                    onChange={(e) => setCustomDensity(Number(e.target.value))}
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground font-bold">
                    <span>100 kg/m³ (Extremamente Leve)</span>
                    <span>2500 kg/m³ (Pesado)</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-relaxed mt-1 border-t border-border/40 pt-1.5">
                    💡 <span className="font-semibold">Nota:</span> Materiais com peso até 600 kg são <span className="text-emerald-500 font-bold">Leves</span> (ex: cavacos, serragem). De 700 a 1000 kg são <span className="text-sky-500 font-bold">Médios</span> (ex: milho, soja, fertilizantes). Acima de 1000 kg são <span className="text-amber-500 font-bold">Pesados</span> (ex: terra, brita, areia).
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Output Recommendation Card */}
        <div className="flex flex-col justify-center">
          {recommendation ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 p-5 relative overflow-hidden flex flex-col h-full min-h-[300px] justify-between shadow-lg"
            >
              {/* Background ambient accents */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -ml-12 -mb-12" />

              <div className="space-y-4 relative">
                <div className="flex items-start justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="space-y-1">
                    <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                      Recomendação Técnica
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-semibold pt-1">
                      <Truck className="h-3.5 w-3.5 text-primary" />
                      {recommendation.machine.brand} {recommendation.machine.model}
                    </span>
                  </div>
                  <img 
                    src={RODER_LOGO_BASE64} 
                    alt="Roder" 
                    className="h-8 object-contain brightness-100 dark:brightness-110"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="text-center py-4 bg-muted/20 border border-border/40 rounded-xl my-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Tamanho de Concha Indicado</p>
                  <p className="text-4xl md:text-5xl font-black text-primary tracking-tight mt-1 animate-pulse">
                    {recommendation.capacity} m³
                  </p>
                  <p className="text-[9px] text-muted-foreground font-bold mt-1.5">Caçamba High Tip Roder</p>
                </div>

                <div className="space-y-2 text-xs border-t border-border/40 pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Material de Trabalho:</span>
                    <span className="font-bold text-foreground text-right max-w-[150px] truncate">{recommendation.materialName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Classe do Material:</span>
                    <span className={`font-extrabold uppercase text-[10px] ${
                      recommendation.materialClass === 'light' 
                        ? 'text-emerald-500' 
                        : recommendation.materialClass === 'medium'
                          ? 'text-sky-500'
                          : 'text-amber-500'
                    }`}>
                      {recommendation.materialClass === 'light' 
                        ? 'Leve (150 a 600 kg/m³)' 
                        : recommendation.materialClass === 'medium'
                          ? 'Médio (700 a 1000 kg/m³)'
                          : 'Pesado (1200 a 2200+ kg/m³)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Peso Operacional Máquina:</span>
                    <span className="font-bold text-foreground">{recommendation.machine.operatingWeight} t ({recommendation.machine.class})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Caçamba Original Carregadeira:</span>
                    <span className="font-bold text-foreground">{recommendation.machine.originalBucket}</span>
                  </div>

                  {heights && (
                    <div className="mt-3 pt-3 border-t border-border/45 space-y-1.5 bg-primary/5 p-2.5 rounded-xl border border-primary/10">
                      <p className="text-[10px] uppercase font-black text-primary tracking-wider mb-1">Cálculo de Altura de Descarga</p>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground font-medium">Altura Original do Pino (Solo):</span>
                        <span className="font-bold text-foreground">{heights.originalPinHeight} m</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground font-medium">Descarga Padrão da Máquina:</span>
                        <span className="font-medium text-slate-500 line-through">{heights.standardDischargeHeight} m</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground font-medium">Estrutura do Braço High Tip:</span>
                        <span className="font-bold text-slate-700">{heights.highTipElevation.toFixed(2)} m</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground font-medium">Ganho Real de Altura Livre:</span>
                        <span className="font-extrabold text-emerald-600">+{heights.gainHeight.toFixed(2)} m</span>
                      </div>
                      <div className="flex justify-between text-xs pt-1 border-t border-primary/20 mt-1">
                        <span className="font-black text-foreground">Alt. Descarga High Tip:</span>
                        <span className="font-extrabold text-primary text-sm">{heights.highTipDischargeHeight} m *</span>
                      </div>
                      <p className="text-[8px] text-muted-foreground leading-none text-right mt-1">* Altura de descarga estimada a 45°</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 mt-4 pt-4 border-t border-border/40">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(true)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-[11px] transition-all duration-200 active:scale-[0.98] shadow-sm"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Visualizar Relatório
                  </button>
                  <a
                    href={generateWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] transition-all duration-200 active:scale-[0.98] shadow-sm"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Enviar p/ WhatsApp
                  </a>
                </div>

                <button
                  type="button"
                  onClick={handleCopyText}
                  className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-[11px] font-black transition-all duration-200 active:scale-[0.98] shadow-sm ${
                    copied 
                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 animate-bounce" />
                      Copiado! Pronto p/ colar no WhatsApp
                    </>
                  ) : (
                    <>
                      <FileText className="h-3.5 w-3.5" />
                      Copiar Apenas o Texto do Relatório
                    </>
                  )}
                </button>

                {onSelectModel && (
                  <Button
                    onClick={() => onSelectModel(recommendation.capacity)}
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-md shadow-primary/10 flex items-center justify-center gap-2 mt-2"
                  >
                    Ver Ficha do Equipamento de {recommendation.capacity} m³ <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-border/60 bg-muted/5 flex flex-col items-center justify-center text-center p-8 min-h-[300px]">
              <Cpu className="h-10 w-10 text-muted-foreground/30 mb-3 stroke-1" />
              <p className="text-sm font-bold text-muted-foreground">Aguardando Parâmetros</p>
              <p className="text-xs text-muted-foreground/80 max-w-[200px] mt-1">
                Selecione a marca da máquina, o modelo e o material ao lado para calcular a recomendação.
              </p>
            </div>
          )}
        </div>
      </div>

    {/* A4 Technical Selection Report Modal */}
    {isReportOpen && reportData && (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 md:p-10 print:p-0 print:absolute print:inset-0 print:bg-white print:z-[100]">
        <div className="relative bg-white text-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-none">
          
          {/* Modal Controls - Hidden during Printing */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 gap-3 print:hidden">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" />
                <h3 className="font-extrabold text-slate-800 text-sm sm:text-base uppercase tracking-tight">
                  Relatório Técnico de Viabilidade - Roder High Tip
                </h3>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                💡 Dica: No diálogo de impressão, escolha <span className="font-bold text-orange-600">"Salvar como PDF"</span> para gerar o arquivo digital.
              </p>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handleCopyText}
                className={`flex items-center gap-1.5 py-1.5 px-3 border text-xs font-bold rounded-lg transition-colors shadow-sm ${
                  copied
                    ? 'bg-emerald-600 text-white border-emerald-600 animate-pulse'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                {copied ? 'Copiado!' : 'Copiar Texto'}
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir / Salvar PDF
              </button>
              <button
                onClick={() => setIsReportOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* A4 Content Area */}
          <div className="p-8 sm:p-12 overflow-y-auto max-h-[80vh] print:max-h-none print:overflow-visible print:p-4 bg-white print:w-full font-sans">
            
            {/* Report CSS print hacks */}
            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                body * {
                  visibility: hidden;
                }
                #print-area, #print-area * {
                  visibility: visible !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                #print-area {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  background: white !important;
                  color: black !important;
                }
                .print\\:hidden {
                  display: none !important;
                }
              }
            `}} />

            <div ref={reportRef} id="print-area" className="space-y-6 text-slate-900">
              {/* Header with Logo */}
              <div className="flex items-center justify-between border-b-4 border-orange-500 pb-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-orange-600 font-extrabold uppercase tracking-widest">Estudo de Produtividade & Engenharia</p>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                    RELATÓRIO TÉCNICO DE SELEÇÃO
                  </h1>
                  <p className="text-[11px] text-slate-500 font-semibold uppercase">
                    Caçamba de Alto Volteio (High Tip) • Doc: #RT-{Math.floor(100000 + Math.random() * 900000)}
                  </p>
                </div>
                <img 
                  src={RODER_LOGO_BASE64} 
                  alt="Roder Brasil Logo" 
                  className="h-12 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Subheader / Summary Statement */}
              <div className="p-4 bg-orange-500/5 rounded-xl border border-orange-500/10">
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Este relatório técnico apresenta a análise de viabilidade e dimensionamento ideal para a utilização da 
                  <span className="font-extrabold text-orange-600"> Caçamba High Tip Roder</span> instalada na pá carregadeira do cliente. 
                  O estudo baseia-se na densidade específica do material de trabalho e na capacidade de carga nominal de segurança da máquina, garantindo o máximo ganho de produtividade sem sobrecarga estrutural.
                </p>
              </div>

              {/* Grid for Machine & Material info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Machine Specs */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                    <Truck className="h-4 w-4 text-orange-500" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Especificações da Carregadeira</h4>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                    <div className="flex justify-between">
                      <span>Marca/Modelo:</span>
                      <span className="font-bold text-slate-900">{reportData.machine.brand} {reportData.machine.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Peso Operacional:</span>
                      <span className="font-bold text-slate-900">{reportData.machine.operatingWeight.toFixed(1)} t</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Classe da Carregadeira:</span>
                      <span className="font-bold text-slate-900">{reportData.machine.class}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1.5">
                      <span>Caçamba Original Padrão:</span>
                      <span className="font-bold text-slate-800">{reportData.machine.originalBucket}</span>
                    </div>
                    <div className="flex justify-between text-orange-600 font-bold">
                      <span>Carga Limite Segura (Payload):</span>
                      <span>{reportData.payloadLimit.toLocaleString()} kg</span>
                    </div>
                  </div>
                </div>

                {/* Material Specs */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                    <Scale className="h-4 w-4 text-orange-500" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Dados do Material e Operação</h4>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                    <div className="flex justify-between">
                      <span>Material Selecionado:</span>
                      <span className="font-bold text-slate-900">{reportData.materialName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Densidade Real do Material:</span>
                      <span className="font-bold text-slate-900">{reportData.density} kg/m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Classificação de Peso:</span>
                      <span className={`font-bold uppercase text-[10px] ${
                        reportData.density <= 600 ? 'text-emerald-600' : reportData.density <= 1000 ? 'text-sky-600' : 'text-amber-600'
                      }`}>
                        {reportData.density <= 600 ? 'Leve' : reportData.density <= 1000 ? 'Médio' : 'Pesado'}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1.5 text-slate-500">
                      <span>Tipo de Caçamba Indicada:</span>
                      <span className="font-bold text-slate-700">Alto Volteio (High Tip)</span>
                    </div>
                    <div className="flex justify-between text-orange-600 font-bold">
                      <span>Tamanho Recomendado:</span>
                      <span>{recommendation.capacity} m³</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Justificativa Técnica - POR QUE SELECIONAR ESTE TAMANHO */}
              <div className="p-5 bg-slate-900 text-white rounded-xl space-y-3">
                <h4 className="text-xs font-black text-orange-400 uppercase tracking-wider">Justificativa Técnica de Viabilidade</h4>
                <div className="text-xs leading-relaxed space-y-2.5 font-medium text-slate-300">
                  <p>
                    1. <span className="text-white font-extrabold">Subutilização com Caçamba Padrão:</span> Ao carregar <span className="text-white">{reportData.materialName}</span> com a caçamba original padrão de {reportData.origBucketCap.toFixed(1)} m³, o peso transportado por ciclo é de apenas <span className="text-white font-bold">{reportData.loadWithOriginalBucket} kg</span>. Isso representa <span className="text-orange-400 font-extrabold">{reportData.utilizationWithOriginalBucket}%</span> da capacidade útil da sua carregadeira. A máquina trabalha "vazia" volumetricamente, desperdiçando combustível e ciclos de movimentação.
                  </p>
                  <p>
                    2. <span className="text-white font-extrabold">Otimização com Caçamba High Tip Roder:</span> Com a caçamba Roder dimensionada em <span className="text-orange-400 font-extrabold">{recommendation.capacity} m³</span>, o peso transportado por ciclo aumenta para <span className="text-white font-bold">{reportData.loadWithHighTip.toLocaleString()} kg</span>, atingindo <span className="text-emerald-400 font-extrabold">{reportData.utilizationWithHighTip}%</span> da capacidade nominal.
                  </p>
                  <p>
                    3. <span className="text-white font-extrabold">Ganho Exponencial de Produtividade:</span> Esta combinação entrega um ganho real de <span className="text-emerald-400 font-extrabold">+{reportData.gainPercentage}% de volume útil por ciclo</span>, acelerando o carregamento de caminhões e silos na mesma proporção, enquanto se mantém perfeitamente na zona operacional segura de {reportData.payloadLimit.toLocaleString()} kg, evitando desgastes prematuros.
                  </p>
                </div>
              </div>

              {/* Gráfico de Capacidade de Carga e Limites */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Análise de Carga por Ciclo vs Limite de Segurança</h4>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded-full uppercase">
                    Zona de Operação Segura ✓
                  </span>
                </div>

                <div className="space-y-4 pt-2">
                  {/* Bar 1 - Original bucket */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-500">Peso de Carga na Caçamba Original ({reportData.origBucketCap.toFixed(1)} m³)</span>
                      <span className="font-bold text-slate-700">{reportData.loadWithOriginalBucket.toLocaleString()} kg ({reportData.utilizationWithOriginalBucket}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-slate-400 h-full rounded-full" 
                        style={{ width: `${Math.min(100, reportData.utilizationWithOriginalBucket)}%` }} 
                      />
                    </div>
                  </div>

                  {/* Bar 2 - High Tip Bucket */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-orange-600 font-bold">Peso de Carga na Caçamba High Tip Roder ({recommendation.capacity} m³)</span>
                      <span className="font-extrabold text-orange-600">{reportData.loadWithHighTip.toLocaleString()} kg ({reportData.utilizationWithHighTip}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden relative">
                      <div 
                        className="bg-orange-500 h-full rounded-full" 
                        style={{ width: `${Math.min(100, reportData.utilizationWithHighTip)}%` }} 
                      />
                    </div>
                  </div>

                  {/* Safety Line Indicator */}
                  <div className="relative pt-2 border-t border-dashed border-slate-300">
                    <div className="flex justify-between text-[10px] text-slate-400 uppercase font-black">
                      <span>0% Início</span>
                      <span className="text-red-500 font-bold">100% Limite Hidráulico da Máquina ({reportData.payloadLimit.toLocaleString()} kg)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alturas de descarga */}
              {heights && (
                <div className="p-4 bg-orange-500/5 rounded-xl border border-orange-500/10 space-y-3">
                  <h4 className="text-xs font-black text-orange-600 uppercase tracking-wider">Cálculo Geométrico de Descarga Livre</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-sm">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Altura Pino Original</p>
                      <p className="text-base font-black text-slate-800 mt-0.5">{heights.originalPinHeight.toFixed(2)} m</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-sm">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Descarga Padrão</p>
                      <p className="text-base font-bold text-slate-500 line-through mt-0.5">{heights.standardDischargeHeight.toFixed(2)} m</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-sm">
                      <p className="text-[10px] text-orange-500 font-bold uppercase">Ganho de Altura</p>
                      <p className="text-base font-black text-emerald-600 mt-0.5">+{heights.gainHeight.toFixed(2)} m</p>
                    </div>
                    <div className="p-2.5 bg-orange-600 rounded-lg text-white shadow-md">
                      <p className="text-[10px] text-orange-100 font-bold uppercase">Descarga High Tip</p>
                      <p className="text-base font-black mt-0.5">{heights.highTipDischargeHeight.toFixed(2)} m *</p>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 text-right leading-none">* Altura teórica livre de descarga livre calculada a 45° de inclinação sob peso operacional.</p>
                </div>
              )}

              {/* Assinatura / Contato */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs font-medium text-slate-600">
                <div className="space-y-4">
                  <p className="uppercase text-[9px] text-slate-400 font-black tracking-wider">Roder Brasil S/A</p>
                  <div className="h-10 border-b border-slate-300" />
                  <p className="font-bold text-slate-800">Assinatura do Consultor Técnico Roder</p>
                </div>
                <div className="space-y-4 text-right">
                  <p className="uppercase text-[9px] text-slate-400 font-black tracking-wider">Aceite e Ciência do Cliente</p>
                  <div className="h-10 border-b border-slate-300" />
                  <p className="font-bold text-slate-800">Responsável Técnico / Operacional do Cliente</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with branding */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500 print:hidden flex justify-between items-center">
            <span>Roder Brasil S/A • www.roderbrasil.com.br</span>
            <button
              onClick={() => setIsReportOpen(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}

// Re-declaring a localized Button component here to avoid import resolution issues in standalone/embedded situations
function Button({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: string }) {
  return (
    <button
      {...props}
      className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.98] ${className}`}
    >
      {children}
    </button>
  );
}
