import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Calculator, 
  ArrowRight, 
  Layers, 
  Cpu, 
  CheckCircle, 
  HelpCircle,
  Tractor,
  Scale,
  FileText,
  Share2,
  Printer,
  X,
  ChevronRight,
  Check,
  Download
} from 'lucide-react';
import { 
  MACHINES, 
  MATERIALS, 
  getRecommendedBucket, 
  calculateDischargeHeights,
  getHighTipBucketWeight,
  Machine, 
  Material 
} from './HighTipData';
import { RODER_LOGO_BASE64 } from './RoderLogo';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

interface HighTipSelectorProps {
  onSelectModel?: (modelCapacity: string) => void;
  onViewFicha?: (modelCapacity: string) => void;
  embedded?: boolean;
  modelsList?: any[];
}

export function HighTipSelector({ onSelectModel, onViewFicha, embedded = false, modelsList }: HighTipSelectorProps) {
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
  const [selectedBucket, setSelectedBucket] = useState<string>('');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [useTurnSafety, setUseTurnSafety] = useState<boolean>(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Synchronize selectedBucket when recommendation is recalculated
  useEffect(() => {
    if (recommendation?.capacity) {
      setSelectedBucket(recommendation.capacity);
    } else {
      setSelectedBucket('');
    }
  }, [recommendation?.capacity]);

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

    const recommendedSize = getRecommendedBucket(machine, density, useTurnSafety);
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

    // Automatically notify the parent of the recommended capacity so it updates background selection instantly
    // We removed automatic call to prevent opening the model technical sheet during active parameter selection

  }, [selectedBrand, selectedModelName, densityMode, selectedMaterialName, customDensity, useTurnSafety]);

  const heights = (recommendation && selectedBucket) ? calculateDischargeHeights(recommendation.machine, selectedBucket) : null;

  const recommendedModel = modelsList?.find(m => {
    const modelCap = m.technical_specs?.capacidade || m.name || '';
    return modelCap.includes(selectedBucket || '');
  });

  const recommendedModelImage = recommendedModel?.images?.[0] || recommendedModel?.technical_sheet_image || 'https://roderbrasil.com.br/wp-content/webp-express/webp-images/uploads/2025/08/Cacamba-High-Tip.jpg.webp';

  const generateWhatsAppText = () => {
    if (!recommendation || !reportData || !heights) return '';
    const brand = recommendation.machine.brand;
    const model = recommendation.machine.model;
    const material = recommendation.materialName;
    const cap = selectedBucket;
    const density = recommendation.density;
    const origBucketCap = reportData.origBucketCap;
    const payloadLimit = reportData.payloadLimit;
    const adjustedPayloadLimit = reportData.adjustedPayloadLimit;
    const loadWithOriginalBucket = reportData.loadWithOriginalBucket;
    const loadWithHighTip = reportData.loadWithHighTip;
    const highTipWeight = reportData.highTipWeight;
    const extraWeight = reportData.extraWeight;
    const totalEffectiveLoad = reportData.totalEffectiveLoad;
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
           `• Peso Estimado da Caçamba High Tip: *${highTipWeight.toLocaleString('pt-BR')} kg*\n` +
           `• Diferencial de Peso (+20% vs Original): *+${extraWeight.toLocaleString('pt-BR')} kg*\n\n` +
           `*3. ANÁLISE DE SEGURANÇA E ESTABILIDADE TÉCNICA:*\n` +
           `• Limite de Carga Nominal (Linha Reta): *${payloadLimit.toLocaleString('pt-BR')} kg*\n` +
           (useTurnSafety ? `• Margem p/ Esterçamento Máximo (Curvas): *-15%* (Segurança contra tombo lateral)\n` : `• Margem p/ Esterçamento Máximo (Curvas): *Desativado*\n`) +
           `• Deslocamento do Centro de Carga (+50 cm à frente): *-12%* (Momento de Alavanca do braço High Tip)\n` +
           `• 🛡️ *Limite de Trabalho Seguro Ajustado:* *${adjustedPayloadLimit.toLocaleString('pt-BR')} kg*\n\n` +
           `*4. ESTUDO DE PRODUTIVIDADE E CARGA EFETIVA:*\n` +
           `• Carga com Caçamba Padrão: *${loadWithOriginalBucket.toLocaleString('pt-BR')} kg* (${utilizationWithOriginalBucket}% da capacidade)\n` +
           `• Carga Efetiva total com Caçamba High Tip: *${totalEffectiveLoad.toLocaleString('pt-BR')} kg* (${utilizationWithHighTip}% do Limite Seguro)\n` +
           `• 📈 *Ganho Volumétrico Estimado:* *+${gainPercentage}%* de volume por ciclo!\n\n` +
           `*5. GANHO GEOMÉTRICO DE ALTURA DE DESCARGA:*\n` +
           `• Altura Original de Descarga Livre: *${standardH} m*\n` +
           `• 🔺 *Altura de Descarga High Tip Roder:* *${finalH} m*\n` +
           `• 📈 *Ganho Real de Altura Livre:* *+${gain} m*\n\n` +
           `*6. JUSTIFICATIVA OPERACIONAL:*\n` +
           `• Ao carregar ${material} com a caçamba padrão, a máquina trabalha subutilizada volumetricamente com apenas ${utilizationWithOriginalBucket}% da sua capacidade. Com a *Caçamba High Tip Roder de ${cap} m³*, elevamos a eficiência para *${utilizationWithHighTip}% do limite de segurança estrutural*, já considerando a compensação do braço de alavanca de 50 cm${useTurnSafety ? ' e a estabilidade lateral em curvas fechadas' : ''}. Isso garante produtividade máxima com zero risco de empinar as rodas traseiras!`;
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

  const handleGeneratePDF = async () => {
    const element = reportRef.current;
    if (!element) {
      toast.error("Elemento do relatório não encontrado.");
      return;
    }

    const toastId = toast.loading("Gerando relatório técnico em PDF...");

    try {
      // Small timeout to ensure everything is rendered
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Capture options for high-quality single-page PDF rendering
      const options = {
        quality: 1.0,
        pixelRatio: 2, // Enhances text clarity
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: '794px',
          height: '1123px',
        }
      };

      const dataUrl = await toPng(element, options);

      // A4 Dimensions: 210mm x 297mm (fits exactly 1 page)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 297, undefined, 'FAST');

      // Save the PDF file
      const docName = `Relatorio_Tecnico_Roder_High_Tip_${selectedBucket || 'Selecao'}.pdf`;
      pdf.save(docName);

      // Also try to open the PDF in a new tab / window
      try {
        const blob = pdf.output('blob');
        const blobURL = URL.createObjectURL(blob);
        window.open(blobURL, '_blank');
      } catch (e) {
        console.warn("Could not open PDF in new window (possibly blocked by popup blocker), but download started.", e);
      }

      toast.success("PDF baixado e aberto com sucesso!", { id: toastId });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Ocorreu um erro ao gerar o arquivo PDF.", { id: toastId });
    }
  };

  const getReportData = () => {
    if (!recommendation || !selectedBucket) return null;
    
    const machine = recommendation.machine;
    const materialName = recommendation.materialName;
    const density = recommendation.density;
    const recCap = parseFloat(selectedBucket.replace(',', '.'));
    
    // Parse original bucket capacity
    const origBucketStr = machine.originalBucket.replace('m³', '').replace('m3', '').replace(',', '.').trim();
    const origBucketCap = parseFloat(origBucketStr) || 2.0;
    
    // Limits
    const payloadLimit = Math.round(machine.operatingWeight * 300); // in kg
    
    // Safety reductions:
    // 1. Articulation safety (15% reduction for turning/maneuvering to prevent lateral tipping) -> factor of 0.85 (if enabled)
    // 2. Load center displacement (12% reduction because high-tip frame moves bucket 50cm forward) -> factor of 0.88
    const turnSafetyFactor = useTurnSafety ? 0.85 : 1.0;
    const adjustedPayloadLimit = Math.round(payloadLimit * turnSafetyFactor * 0.88);
    
    const loadWithOriginalBucket = Math.round(origBucketCap * density);
    const loadWithHighTip = Math.round(recCap * density);
    
    // Weights logic based on high-tip bucket size
    const highTipWeight = getHighTipBucketWeight(selectedBucket);
    const originalWeight = Math.round(highTipWeight / 1.2);
    const extraWeight = Math.round(highTipWeight - originalWeight); // Excess weight (+20% over original bucket)
    const totalEffectiveLoad = loadWithHighTip + extraWeight;
    
    const utilizationWithOriginalBucket = Math.min(100, Math.round((loadWithOriginalBucket / payloadLimit) * 100));
    const utilizationWithHighTip = Math.round((totalEffectiveLoad / adjustedPayloadLimit) * 100); // Calculated against the strictly safe adjusted stability limit!
    const gainPercentage = Math.round(((loadWithHighTip - loadWithOriginalBucket) / loadWithOriginalBucket) * 100);
    
    return {
      machine,
      materialName,
      density,
      recCap,
      origBucketCap,
      payloadLimit,
      adjustedPayloadLimit,
      loadWithOriginalBucket,
      loadWithHighTip,
      highTipWeight,
      originalWeight,
      extraWeight,
      totalEffectiveLoad,
      utilizationWithOriginalBucket,
      utilizationWithHighTip,
      gainPercentage,
    };
  };

  const reportData = getReportData();

  return (
    <div className={`w-full rounded-2xl border border-border bg-card text-card-foreground shadow-sm ${embedded ? 'p-0 border-none bg-transparent shadow-none' : 'p-6'}`}>
      {!embedded && (
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-lg text-foreground antialiased subpixel-antialiased tracking-tight">Guia de Seleção Digital de Caçamba High Tip</h4>
            <p className="text-xs text-muted-foreground antialiased">Selecione a carregadeira e o material para obter o modelo ideal de Caçamba High Tip Roder.</p>
          </div>
        </div>
      )}

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
                  translate="no"
                  onClick={() => handleBrandChange(brand)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-all truncate text-center notranslate ${
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
                    translate="no"
                    onClick={() => handleModelChange(m.model)}
                    className={`px-2 py-2 rounded-lg text-xs font-bold border transition-all text-left flex flex-col justify-between notranslate ${
                      selectedModelName === m.model
                        ? 'bg-primary/15 border-primary text-primary shadow-sm'
                        : 'border-border bg-muted/10 hover:bg-muted text-foreground'
                    }`}
                  >
                    <span className="font-extrabold notranslate" translate="no">{m.model}</span>
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
                <div className="grid grid-cols-2 gap-1.5 max-h-[290px] overflow-y-auto pr-1">
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
            <div
              className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 p-5 relative overflow-hidden flex flex-col h-full min-h-[300px] justify-between shadow-lg antialiased subpixel-antialiased"
              style={{ WebkitFontSmoothing: 'subpixel-antialiased', MozOsxFontSmoothing: 'auto' }}
            >
              {/* Background ambient accents */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -ml-12 -mb-12" />

              <div className="space-y-4 relative">
                <div className="flex items-start justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="space-y-1">
                    <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-wider antialiased">
                      Recomendação Técnica
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-semibold pt-1 notranslate" translate="no">
                      <Tractor className="h-3.5 w-3.5 text-primary" />
                      {recommendation.machine.brand} {recommendation.machine.model}
                    </span>
                    <div className="pt-1">
                      <span className="text-[12px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-tight antialiased subpixel-antialiased">
                        Modelo Recomendado: Caçamba Roder HT {recommendation.capacity} m³
                      </span>
                    </div>
                  </div>
                  <img 
                    src={RODER_LOGO_BASE64} 
                    alt="Roder" 
                    className="h-8 object-contain brightness-0 dark:brightness-100 dark:invert"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Interactive Bucket Size Selectors */}
                <div className="space-y-2 my-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider antialiased">
                      Selecione o tamanho da caçamba Roder:
                    </span>
                    <span className="text-[10px] text-primary font-bold antialiased">
                      Estudo Dinâmico
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {['2.0', '2.5', '2.8', '3.0', '4.0', '5.0', '7.0'].map((size) => {
                      const isActive = selectedBucket === size;
                      const isRecommended = recommendation.capacity === size;
                      const bucketWeight = getHighTipBucketWeight(size);
                      return (
                        <button
                          key={size}
                          onClick={() => setSelectedBucket(size)}
                          className={`relative py-1.5 px-0.5 rounded-lg text-[10.5px] font-black transition-all flex flex-col items-center justify-center border h-13 antialiased ${
                            isActive
                              ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/15 scale-[1.02]'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="leading-tight font-black">{size} m³</span>
                          <span className={`text-[7px] font-bold mt-0.5 leading-none ${isActive ? 'text-orange-100' : 'text-muted-foreground'}`}>
                            {bucketWeight.toLocaleString('pt-BR')} kg
                          </span>
                          {isRecommended && (
                            <span className={`text-[6px] font-extrabold uppercase px-0.5 rounded mt-0.5 leading-none tracking-tighter ${isActive ? 'bg-white text-orange-600' : 'bg-orange-100 text-orange-600'}`}>
                              ★ Rec
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* On-Screen Live Load Capacity Chart */}
                {reportData && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-border/60 rounded-xl space-y-3 my-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                        Análise de Carga vs Limite Hidráulico
                      </span>
                      {reportData.utilizationWithHighTip > 100 ? (
                        <span className="text-[8px] font-extrabold bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded uppercase">
                          ⚠️ Sobrecarga!
                        </span>
                      ) : reportData.utilizationWithHighTip >= 60 && reportData.utilizationWithHighTip <= 85 ? (
                        <span className="text-[8px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded uppercase">
                          ✓ Zona Ideal
                        </span>
                      ) : (
                        <span className="text-[8px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded uppercase">
                          Operação Segura
                        </span>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      {/* Original Bucket */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                          <span>Original ({reportData.origBucketCap.toFixed(1)} m³)</span>
                          <span>{reportData.loadWithOriginalBucket.toLocaleString()} kg ({reportData.utilizationWithOriginalBucket}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-slate-400 dark:bg-slate-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, reportData.utilizationWithOriginalBucket)}%` }}
                          />
                        </div>
                      </div>

                      {/* Selected High Tip Bucket */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className={`${selectedBucket === recommendation.capacity ? 'text-primary' : 'text-foreground'}`}>
                            Roder Selecionada ({selectedBucket} m³)
                          </span>
                          <span className={
                            reportData.utilizationWithHighTip > 100 ? 'text-red-600 font-extrabold' : 'text-primary font-bold'
                          }>
                            {reportData.totalEffectiveLoad.toLocaleString('pt-BR')} kg ({reportData.utilizationWithHighTip}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              reportData.utilizationWithHighTip > 100
                                ? 'bg-red-500'
                                : reportData.utilizationWithHighTip > 85
                                  ? 'bg-amber-500'
                                  : reportData.utilizationWithHighTip >= 60
                                    ? 'bg-emerald-500'
                                    : 'bg-sky-500'
                            }`}
                            style={{ width: `${Math.min(100, reportData.utilizationWithHighTip)}%` }}
                          />
                        </div>
                        {reportData.utilizationWithHighTip > 100 && (
                          <div className="text-[8.5px] text-red-500 font-bold leading-tight mt-1.5 space-y-0.5 animate-pulse">
                            <p>⚠️ ALERTA DE TOMBAMENTO E SEGURANÇA:</p>
                            <p>A carga efetiva ultrapassa o limite seguro de {reportData.adjustedPayloadLimit.toLocaleString('pt-BR')} kg para operação {useTurnSafety ? 'articulada (esterçada) ' : ''}com deslocamento frontal do centro de carga (+50 cm).</p>
                          </div>
                        )}
                        {reportData.utilizationWithHighTip <= 100 && (
                          <p className="text-[8px] text-slate-500 mt-1 leading-normal">
                            🛡️ Limite ajustado considerando {useTurnSafety ? 'esterçamento (curva) e ' : ''}projeção frontal do centro de carga (+50 cm).
                          </p>
                        )}
                        {reportData.utilizationWithHighTip < 60 && (
                          <p className="text-[8px] text-sky-500 font-bold leading-none mt-1">
                            ℹ️ DICA: Capacidade de carga abaixo de 60%. Teste uma caçamba Roder maior!
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Toggle for Turn Safety */}
                    <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9.5px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Cálculo de Esterçamento (-15%)</span>
                        <span className="text-[8px] text-muted-foreground">Aplica margem de segurança para manobras/curvas</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUseTurnSafety(!useTurnSafety)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          useTurnSafety ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            useTurnSafety ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] border-t border-border/40 pt-2.5 antialiased">
                  <div className="flex justify-between border-b border-dashed border-border/20 pb-1">
                    <span className="text-muted-foreground font-semibold">Material:</span>
                    <span className="font-extrabold text-foreground truncate max-w-[100px]" translate="no">{recommendation.materialName}</span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-border/20 pb-1">
                    <span className="text-muted-foreground font-semibold">Classe:</span>
                    <span className={`font-extrabold uppercase text-[9px] ${
                      recommendation.materialClass === 'light' 
                        ? 'text-emerald-500' 
                        : recommendation.materialClass === 'medium'
                          ? 'text-sky-500'
                          : 'text-amber-500'
                    }`}>
                      {recommendation.materialClass === 'light' 
                        ? 'Leve' 
                        : recommendation.materialClass === 'medium'
                          ? 'Médio'
                          : 'Pesado'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-border/20 pb-1">
                    <span className="text-muted-foreground font-semibold">Peso Operac.:</span>
                    <span className="font-extrabold text-foreground">{recommendation.machine.operatingWeight} t ({recommendation.machine.class})</span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-border/20 pb-1">
                    <span className="text-muted-foreground font-semibold">Caçamba Original:</span>
                    <span className="font-extrabold text-foreground">{recommendation.machine.originalBucket}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {/* Cálculo de Carga */}
                  {reportData && (
                    <div className="space-y-1 bg-orange-500/5 p-2.5 rounded-xl border border-orange-500/10 flex flex-col justify-between antialiased">
                      <div>
                        <p className="text-[9.5px] uppercase font-black text-orange-600 tracking-wider mb-1.5 pb-1 border-b border-orange-500/10">Cálculo de Carga (Ciclo)</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10.5px]">
                            <span className="text-muted-foreground font-medium">Carga Líq. Material:</span>
                            <span className="font-extrabold text-foreground">{reportData.loadWithHighTip.toLocaleString('pt-BR')} kg</span>
                          </div>
                          <div className="flex justify-between text-[10.5px]">
                            <span className="text-muted-foreground font-medium">Peso Caçamba HT:</span>
                            <span className="font-extrabold text-foreground">{reportData.highTipWeight.toLocaleString('pt-BR')} kg</span>
                          </div>
                          <div className="flex justify-between text-[10.5px]">
                            <span className="text-muted-foreground font-medium">Remoção Original:</span>
                            <span className="font-medium text-slate-500 line-through">-{reportData.originalWeight.toLocaleString('pt-BR')} kg</span>
                          </div>
                          <div className="flex justify-between text-[10.5px]">
                            <span className="text-muted-foreground font-medium">Diferencial (+20%):</span>
                            <span className="font-extrabold text-orange-600">+{reportData.extraWeight.toLocaleString('pt-BR')} kg</span>
                          </div>
                          <div className="flex justify-between text-[10.5px] pt-1 border-t border-orange-500/10">
                            <span className="text-muted-foreground font-semibold">L. Nominal (Reta):</span>
                            <span className="font-extrabold text-slate-700">{reportData.payloadLimit.toLocaleString('pt-BR')} kg</span>
                          </div>
                          {useTurnSafety ? (
                            <div className="flex justify-between text-[10.5px]">
                              <span className="text-muted-foreground font-medium">Esterçamento (-15%):</span>
                              <span className="font-extrabold text-amber-600">-15%</span>
                            </div>
                          ) : (
                            <div className="flex justify-between text-[10.5px] opacity-40 line-through">
                              <span className="text-muted-foreground font-medium">Esterçamento (-15%):</span>
                              <span className="font-bold text-slate-400">Desativado</span>
                            </div>
                          )}
                          <div className="flex justify-between text-[10.5px]">
                            <span className="text-muted-foreground font-medium">CG Projeção (-12%):</span>
                            <span className="font-extrabold text-amber-600">-12%</span>
                          </div>
                          <div className="flex justify-between text-[10.5px]">
                            <span className="text-muted-foreground font-semibold">L. Seguro Ajustado:</span>
                            <span className="font-extrabold text-emerald-600">{reportData.adjustedPayloadLimit.toLocaleString('pt-BR')} kg</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between text-[11px] pt-1.5 border-t border-orange-500/20 mt-1.5">
                        <span className="font-black text-foreground">Carga Efetiva:</span>
                        <span className="font-black text-orange-600">{reportData.totalEffectiveLoad.toLocaleString('pt-BR')} kg</span>
                      </div>
                    </div>
                  )}

                  {/* Cálculo de Altura de Descarga */}
                  {heights && (
                    <div className="space-y-1 bg-primary/5 p-2.5 rounded-xl border border-primary/10 flex flex-col justify-between antialiased">
                      <div>
                        <p className="text-[9.5px] uppercase font-black text-primary tracking-wider mb-1.5 pb-1 border-b border-primary/10">Cálculo de Altura</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10.5px]">
                            <span className="text-muted-foreground font-medium">Pino Solo Original:</span>
                            <span className="font-extrabold text-foreground">{heights.originalPinHeight} m</span>
                          </div>
                          <div className="flex justify-between text-[10.5px]">
                            <span className="text-muted-foreground font-medium">Descarga Padrão:</span>
                            <span className="font-medium text-slate-500 line-through">{heights.standardDischargeHeight} m</span>
                          </div>
                          <div className="flex justify-between text-[10.5px]">
                            <span className="text-muted-foreground font-medium">Elevação HT:</span>
                            <span className="font-extrabold text-slate-700">{heights.highTipElevation.toFixed(2)} m</span>
                          </div>
                          <div className="flex justify-between text-[10.5px] pt-1 border-t border-primary/10">
                            <span className="text-muted-foreground font-semibold">Ganho Real Altura:</span>
                            <span className="font-black text-emerald-600 font-extrabold">+{heights.gainHeight.toFixed(2)} m</span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-1.5 border-t border-primary/20 mt-1.5">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-black text-foreground">Alt. Máx High Tip:</span>
                          <span className="font-black text-primary text-[13px]">{heights.highTipDischargeHeight} m</span>
                        </div>
                        <p className="text-[7.5px] text-muted-foreground leading-none text-right mt-1">* Estimado a 45°</p>
                      </div>
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

                { (onSelectModel || onViewFicha) && (
                  <Button
                    onClick={() => {
                      if (onViewFicha) {
                        onViewFicha(selectedBucket);
                      } else if (onSelectModel) {
                        onSelectModel(selectedBucket);
                      }
                    }}
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-md shadow-primary/10 flex items-center justify-center gap-2 mt-2"
                  >
                    Ver Ficha do Equipamento de {selectedBucket} m³ <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
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
      <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-start justify-center p-4 sm:p-6 md:p-10 print:p-0 print:absolute print:inset-0 print:bg-white print:z-[100]">
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
                💡 Dica: O PDF será gerado com o design completo e salvo diretamente no seu dispositivo.
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
                onClick={handleGeneratePDF}
                className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                Salvar PDF
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

            <div ref={reportRef} id="print-area" className="w-[794px] h-[1123px] bg-white text-slate-900 p-[40px] flex flex-col justify-between overflow-hidden shadow-2xl relative select-text text-left">
              <div className="space-y-4">
                {/* Header with Logo */}
                <div className="flex items-center justify-between border-b-4 border-orange-500 pb-3">
                  <div className="space-y-0.5">
                    <p className="text-[9px] text-orange-600 font-extrabold uppercase tracking-widest">Estudo de Produtividade & Engenharia</p>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
                      RELATÓRIO TÉCNICO DE SELEÇÃO
                    </h1>
                    <p className="text-[11px] text-slate-600 font-bold uppercase mt-1">
                      Indicação: Roder • Caçamba de tamanho {selectedBucket} m³
                    </p>
                  </div>
                  <img 
                    src={RODER_LOGO_BASE64} 
                    alt="Roder Brasil Logo" 
                    className="h-10 w-auto object-contain brightness-0"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Subheader / Summary Statement */}
                <div className="p-3 bg-orange-500/5 rounded-xl border border-orange-500/10">
                  <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                    Este relatório técnico apresenta a análise de viabilidade e dimensionamento ideal para a utilização da 
                    <span className="font-extrabold text-orange-600"> Caçamba High Tip Roder</span> instalada na pá carregadeira do cliente. 
                    O estudo baseia-se na densidade específica do material de trabalho e na capacidade de carga nominal de segurança da máquina, garantindo o máximo ganho de produtividade sem sobrecarga estrutural.
                  </p>
                </div>

                {/* Grid for Machine & Material info */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Machine Specs */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1">
                      <Tractor className="h-3.5 w-3.5 text-orange-500" />
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Especificações da Carregadeira</h4>
                    </div>
                    <div className="space-y-1 text-xs text-slate-600 font-medium">
                      <div className="flex justify-between">
                        <span>Marca/Modelo:</span>
                        <span translate="no" className="font-bold text-slate-900 notranslate">{reportData.machine.brand} {reportData.machine.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Peso Operacional:</span>
                        <span className="font-bold text-slate-900">{reportData.machine.operatingWeight.toFixed(1)} t</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Classe da Carregadeira:</span>
                        <span className="font-bold text-slate-900">{reportData.machine.class}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
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
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1">
                      <Scale className="h-3.5 w-3.5 text-orange-500" />
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Dados do Material e Operação</h4>
                    </div>
                    <div className="space-y-1 text-xs text-slate-600 font-medium">
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
                      <div className="flex justify-between border-t border-slate-200 pt-1 mt-1 text-slate-500">
                        <span>Recomendação Técnica Roder:</span>
                        <span className="font-bold text-slate-700">{recommendation.capacity} m³</span>
                      </div>
                      <div className="flex justify-between text-orange-600 font-extrabold">
                        <span>Tamanho Selecionado:</span>
                        <span>{selectedBucket} m³</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-100 pt-1 text-[11px]">
                        <span>Peso Est. Caçamba High Tip:</span>
                        <span className="font-bold text-slate-800">{reportData.highTipWeight.toLocaleString('pt-BR')} kg</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span>Diferencial Estrutural (+20%):</span>
                        <span className="font-bold text-orange-600">+{reportData.extraWeight.toLocaleString('pt-BR')} kg</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Justificativa Técnica - POR QUE SELECIONAR ESTE TAMANHO */}
                <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                  <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-wider">Justificativa Técnica de Viabilidade</h4>
                  <div className="text-[11px] leading-normal space-y-2 font-medium text-slate-300">
                    <p>
                      1. <span className="text-white font-extrabold">Subutilização com Caçamba Padrão:</span> Ao carregar <span className="text-white">{reportData.materialName}</span> com a caçamba original padrão de {reportData.origBucketCap.toFixed(1)} m³, o peso transportado por ciclo é de apenas <span className="text-white font-bold">{reportData.loadWithOriginalBucket.toLocaleString()} kg</span>. Isso representa <span className="text-orange-400 font-extrabold">{reportData.utilizationWithOriginalBucket}%</span> da capacidade útil da sua carregadeira. A máquina trabalha "vazia" volumetricamente, desperdiçando combustível e ciclos de movimentação.
                    </p>
                    <p>
                      2. <span className="text-white font-extrabold">Otimização com Caçamba High Tip Roder:</span> Com a caçamba Roder selecionada em <span className="text-orange-400 font-extrabold">{selectedBucket} m³</span>, o peso líquido de material por ciclo é de <span className="text-white font-bold">{reportData.loadWithHighTip.toLocaleString()} kg</span>. Considerando o diferencial de peso da caçamba High Tip Roder (+{reportData.extraWeight.toLocaleString()} kg em relação à caçamba original), a carga efetiva total de solicitação passa a ser de <span className="text-white font-bold">{reportData.totalEffectiveLoad.toLocaleString()} kg</span>, correspondendo a <span className="text-emerald-400 font-extrabold">{reportData.utilizationWithHighTip}%</span> do limite de segurança da carregadeira.
                    </p>
                    <p>
                      3. <span className="text-white font-extrabold">Ganho Exponencial de Produtividade:</span> Esta combinação entrega um ganho real de <span className="text-emerald-400 font-extrabold">+{reportData.gainPercentage}% de volume útil por ciclo</span>, acelerando o carregamento de caminhões e silos na mesma proporção, enquanto se mantém na zona operacional recomendada, aproveitando ao máximo a máquina com total segurança estrutural.
                    </p>
                  </div>
                </div>

                {/* Gráfico de Capacidade de Carga e Limites */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Análise de Carga por Ciclo vs Limite de Segurança</h4>
                    {reportData.utilizationWithHighTip > 100 ? (
                      <span className="text-[9px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full uppercase">
                        Aviso de Sobrecarga ⚠️
                      </span>
                    ) : (
                      <span className="text-[9px] bg-emerald-100 text-emerald-600 font-bold px-2 py-0.5 rounded-full uppercase">
                        Zona de Operação Segura ✓
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Bar 1 - Original bucket */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-500">Peso de Carga na Caçamba Original ({reportData.origBucketCap.toFixed(1)} m³)</span>
                        <span className="font-bold text-slate-700">{reportData.loadWithOriginalBucket.toLocaleString()} kg ({reportData.utilizationWithOriginalBucket}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-slate-400 h-full rounded-full" 
                          style={{ width: `${Math.min(100, reportData.utilizationWithOriginalBucket)}%` }} 
                        />
                      </div>
                    </div>

                    {/* Bar 2 - High Tip Bucket */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-orange-600 font-bold">Carga Efetiva na Caçamba High Tip Roder ({selectedBucket} m³)</span>
                        <span className={reportData.utilizationWithHighTip > 100 ? 'font-extrabold text-red-600' : 'font-extrabold text-orange-600'}>
                          {reportData.totalEffectiveLoad.toLocaleString()} kg ({reportData.utilizationWithHighTip}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden relative">
                        <div 
                          className={`h-full rounded-full ${reportData.utilizationWithHighTip > 100 ? 'bg-red-500' : 'bg-orange-500'}`}
                          style={{ width: `${Math.min(100, reportData.utilizationWithHighTip)}%` }} 
                        />
                      </div>
                    </div>

                    {/* Safety Line Indicator */}
                    <div className="relative pt-1 border-t border-dashed border-slate-300">
                      <div className="flex justify-between text-[9px] text-slate-400 uppercase font-black">
                        <span>0% Início</span>
                        <span>L. Nominal (Reta): {reportData.payloadLimit.toLocaleString('pt-BR')} kg</span>
                        <span className="text-red-500 font-bold">100% Limite Seguro Ajustado ({reportData.adjustedPayloadLimit.toLocaleString('pt-BR')} kg) {useTurnSafety ? '(C/ Esterc.)' : '(S/ Esterc.)'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alturas de descarga */}
                {heights && (
                  <div className="p-3 bg-orange-500/5 rounded-xl border border-orange-500/10 space-y-2">
                    <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-wider">Cálculo Geométrico de Descarga Livre</h4>
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                        <p className="text-[8px] text-slate-400 font-bold uppercase">Altura Pino Original</p>
                        <p className="text-sm font-black text-slate-800 mt-0.5">{heights.originalPinHeight.toFixed(2)} m</p>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                        <p className="text-[8px] text-slate-400 font-bold uppercase">Descarga Padrão</p>
                        <p className="text-sm font-bold text-slate-500 line-through mt-0.5">{heights.standardDischargeHeight.toFixed(2)} m</p>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                        <p className="text-[8px] text-orange-500 font-bold uppercase">Ganho de Altura</p>
                        <p className="text-sm font-black text-emerald-600 mt-0.5">+{heights.gainHeight.toFixed(2)} m</p>
                      </div>
                      <div className="p-2 bg-orange-600 rounded-lg text-white shadow-md">
                        <p className="text-[8px] text-orange-100 font-bold uppercase">Descarga High Tip</p>
                        <p className="text-sm font-black mt-0.5">{heights.highTipDischargeHeight.toFixed(2)} m *</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Assinatura / Contato */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-8 text-[11px] font-medium text-slate-600">
                <div className="space-y-2">
                  <p className="uppercase text-[8px] text-slate-400 font-black tracking-wider">Roder Brasil S/A</p>
                  <div className="h-8 border-b border-slate-300" />
                  <p className="font-bold text-slate-800">Assinatura do Consultor Técnico Roder</p>
                </div>
                <div className="space-y-2 text-right">
                  <p className="uppercase text-[8px] text-slate-400 font-black tracking-wider">Aceite e Ciência do Cliente</p>
                  <div className="h-8 border-b border-slate-300" />
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
