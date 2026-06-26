import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Calculator, 
  ArrowRight, 
  Layers, 
  Cpu, 
  CheckCircle, 
  HelpCircle,
  Truck,
  Scale
} from 'lucide-react';
import { 
  MACHINES, 
  MATERIALS, 
  getRecommendedBucket, 
  calculateDischargeHeights,
  Machine, 
  Material 
} from './HighTipData';

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
    isLight: boolean;
  } | null>(null);

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
    setRecommendation({
      capacity: recommendedSize,
      machine,
      materialName: matName,
      density,
      isLight: density <= 600
    });

  }, [selectedBrand, selectedModelName, densityMode, selectedMaterialName, customDensity]);

  const heights = recommendation ? calculateDischargeHeights(recommendation.machine, recommendation.capacity) : null;

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
                            : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {m.density <= 600 ? 'Leve' : 'Pesado'}
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
                    💡 <span className="font-semibold">Nota:</span> Materiais com peso por m³ até 600 kg são classificados como <span className="text-emerald-500 font-bold">Leves</span> (ex: cavacos, serragem, biomassa). Acima de 600 kg/m³ são considerados <span className="text-amber-500 font-bold">Pesados</span> (ex: terra, brita, areia).
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
                <div className="flex items-center justify-between">
                  <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                    Recomendação Técnica
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                    <Truck className="h-3.5 w-3.5" />
                    {recommendation.machine.brand} {recommendation.machine.model}
                  </span>
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
                    <span className={`font-extrabold uppercase text-[10px] ${recommendation.isLight ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {recommendation.isLight ? 'Leve (200 a 600 kg/m³)' : 'Pesado (900 a 2000 kg/m³)'}
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

              {onSelectModel && (
                <Button
                  onClick={() => onSelectModel(recommendation.capacity)}
                  size="lg"
                  className="w-full mt-5 bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-md shadow-primary/10 flex items-center justify-center gap-2"
                >
                  Ver Ficha do Equipamento de {recommendation.capacity} m³ <ArrowRight className="h-4 w-4" />
                </Button>
              )}
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
