// Produtividade da Garra Traçadora (GT), por comprimento da tora.
// Mesmo cálculo do consultor técnico; também entra na ficha padrão em PDF dos modelos GT.

export const getGTProductivityData = (modelName: string, length: number) => {
  let area = 0.60; // default (GT 600)
  let machineBase = 'Escavadeira de 20 toneladas (PC 200)';
  let chainSpec = '3/4" 11H (padrão das traçadoras maiores)';
  
  const cleanName = (modelName || '').toUpperCase();
  if (cleanName.includes('280')) {
    area = 0.28;
    machineBase = 'Escavadeira de 6 a 10 toneladas';
    chainSpec = 'Harvester 0.404"';
  } else if (cleanName.includes('360')) {
    area = 0.36;
    machineBase = 'Escavadeira de 8 a 16 toneladas';
    chainSpec = 'Harvester 0.404"';
  } else if (cleanName.includes('400')) {
    area = 0.40;
    machineBase = 'Escavadeira de 14 a 18 toneladas';
    chainSpec = '3/4" 11H (padrão das traçadoras maiores)';
  } else if (cleanName.includes('600')) {
    area = 0.60;
    machineBase = 'Escavadeira de 20 toneladas (PC 200)';
    chainSpec = '3/4" 11H (padrão das traçadoras maiores)';
  } else if (cleanName.includes('800')) {
    area = 0.80;
    machineBase = 'Escavadeira de 20 a 30 toneladas';
    chainSpec = '3/4" 11H (padrão das traçadoras maiores)';
  } else if (cleanName.includes('1000')) {
    area = 1.00;
    machineBase = 'Escavadeira de 25 a 35 toneladas';
    chainSpec = '3/4" 11H (padrão das traçadoras maiores)';
  }

  // Load factor: 85% average capacity due to tapering/copa loss, offset by pulling extra trees
  const loadFactor = 0.85; 
  
  // Volume per cycle = Area * Length * Load Factor
  const volPerCycle = area * length * loadFactor;

  // Operational efficiency factor (fator de aproveitamento de pátio):
  // 1.0m (metrinho) allows more continuous feeding/piling (30% efficiency)
  // 2.4m and 3.0m require more handling (25% and 22%)
  // 6.0m requires careful positioning and is highly limited by felling/skidder flow (15% efficiency)
  let opEfficiency = 0.30;
  if (length === 6.0) {
    opEfficiency = 0.15;
  } else if (length === 3.0) {
    opEfficiency = 0.22;
  } else if (length === 2.4) {
    opEfficiency = 0.25;
  }

  // Active cycles per hour:
  // - Fast: 20 seconds per cycle = 180 cycles/hour (expert operator, perfect sharpening)
  // - Slow: 30 seconds per cycle = 120 cycles/hour (beginner operator, low sharpening maintenance)
  const hourlyMin = parseFloat((120 * volPerCycle * opEfficiency).toFixed(1));
  const hourlyMax = parseFloat((180 * volPerCycle * opEfficiency).toFixed(1));

  // 10-hour standard forest shift
  const shiftMin = Math.round(hourlyMin * 10);
  const shiftMax = Math.round(hourlyMax * 10);

  // Monthly estimate (22 working days, 10 hours per day)
  const monthlyMin = Math.round(hourlyMin * 10 * 22);
  const monthlyMax = Math.round(hourlyMax * 10 * 22);

  return {
    area,
    loadFactor,
    chainSpec,
    hourlyMin,
    hourlyMax,
    shiftMin,
    shiftMax,
    monthlyMin,
    monthlyMax,
    machineBase,
    cycleRange: '20s a 30s',
    opEfficiency: Math.round(opEfficiency * 100)
  };
};

// Comprimentos que o consultor oferece (1,0 m é o "metrinho")
export const COMPRIMENTOS_GT = [1.0, 2.4, 3.0, 6.0];

// Garra Traçadora: modelo "GT 600x" ou produto/categoria "Traçadora"
export function ehGarraTracadora(nomeProduto = '', categoria = '', nomeModelo = ''): boolean {
  const t = `${nomeProduto} ${categoria}`.toLowerCase();
  return /\bgt[-_ ]?\d{3,4}x?\b/i.test(nomeModelo) || /tra[çc]adora/.test(t);
}
