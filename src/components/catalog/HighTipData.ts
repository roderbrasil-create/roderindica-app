export interface Machine {
  brand: string;
  model: string;
  operatingWeight: number; // t
  class: string;
  originalBucket: string;
  recommendedLight: string; // "2.0", "3.0", "4.0", "5.0"
  recommendedHeavy: string; // "2.0", "2.5", "2.8", "3.0"
}

export interface DischargeCalculations {
  originalPinHeight: number;       // e.g. 3.70
  standardDischargeHeight: number; // e.g. 2.90
  highTipElevation: number;        // e.g. 1.80
  highTipDischargeHeight: number;  // e.g. 5.50
  gainHeight: number;              // e.g. 2.60
}

export function calculateDischargeHeights(machine: Machine, bucketCapacity: string): DischargeCalculations {
  // Original pino point at ground level based on operating weight using a calibrated regression
  // calibrated so that Komatsu WA200 (12.8t) has exactly 3.77m/3.78m and Volvo L120 (20t) has ~4.26m.
  const originalPinHeight = 2.9 + (0.068 * machine.operatingWeight);
  
  // Standard bucket discharge height (about 45 degrees tilt reduces height by approx 0.8m)
  const standardDischargeHeight = originalPinHeight - 0.8;
  
  // High Tip elevation based on capacity
  const cap = parseFloat(bucketCapacity.replace(',', '.'));
  let highTipElevation = 1.8; // Default for 2.5, 2.8, 3.0
  if (cap <= 2.1) {
    highTipElevation = 1.5;   // For 2.0
  } else if (cap >= 3.9) {
    highTipElevation = 2.0;   // For 4.0, 5.0, 7.0 (corrected from 2.2m to 2.0m by the user)
  }
  
  // We calibrate the formula based on the verified Komatsu WA200 (operatingWeight = 12.8, originalPinHeight = 3.78m)
  // where the high-tip bucket with structure length 1.8m achieves exactly 4.20m free discharge height.
  // Standard discharge height for WA200 is 3.78 - 0.8 = 2.98m.
  // The gain is 4.20m - 2.98m = 1.22m (which is exactly ~67.77% of the 1.8m structure length).
  const calibrationFactor = 1.22 / 1.8; // ~0.677778
  
  // High Tip discharge height
  const highTipDischargeHeight = standardDischargeHeight + (highTipElevation * calibrationFactor);
  
  // Net gain in discharge height compared to standard
  const gainHeight = highTipDischargeHeight - standardDischargeHeight;
  
  return {
    originalPinHeight: Math.round(originalPinHeight * 100) / 100,
    standardDischargeHeight: Math.round(standardDischargeHeight * 100) / 100,
    highTipElevation,
    highTipDischargeHeight: Math.round(highTipDischargeHeight * 100) / 100,
    gainHeight: Math.round(gainHeight * 100) / 100,
  };
}

export interface Material {
  name: string;
  density: number; // kg/m³
  class: string; // "Muito leve", "Médio", "Pesado", "Muito pesado", "Extremamente pesado"
}

export const MACHINES: Machine[] = [
  { brand: 'Bruto', model: 'BRT20', operatingWeight: 7.0, class: 'Compacta', originalBucket: '1,3 m³', recommendedLight: '2.0', recommendedHeavy: '2.0' },
  { brand: 'Bruto', model: 'BRT25', operatingWeight: 8.5, class: 'Compacta', originalBucket: '1,6 m³', recommendedLight: '2.0', recommendedHeavy: '2.0' },
  { brand: 'XCMG', model: 'LW188', operatingWeight: 8.8, class: 'Compacta', originalBucket: '1,8 m³', recommendedLight: '2.0', recommendedHeavy: '2.0' },
  { brand: 'LiuGong', model: '816', operatingWeight: 9.5, class: 'Compacta', originalBucket: '1,8 m³', recommendedLight: '2.0', recommendedHeavy: '2.0' },
  { brand: 'Michigan', model: '55', operatingWeight: 9.5, class: 'Compacta', originalBucket: '1,8 m³', recommendedLight: '2.0', recommendedHeavy: '2.0' },
  { brand: 'SDLG', model: 'LG918', operatingWeight: 9.8, class: 'Compacta', originalBucket: '1,8 m³', recommendedLight: '2.0', recommendedHeavy: '2.0' },
  { brand: 'XGMA', model: 'XG935', operatingWeight: 10.0, class: 'Compacta', originalBucket: '1,8 m³', recommendedLight: '2.0', recommendedHeavy: '2.0' },
  { brand: 'Case', model: 'W20', operatingWeight: 10.2, class: 'Pequena', originalBucket: '2,0 m³', recommendedLight: '3.0', recommendedHeavy: '2.5' },
  { brand: 'New Holland', model: '12D / W12D', operatingWeight: 10.515, class: 'Pequena', originalBucket: '1,9 m³', recommendedLight: '3.0', recommendedHeavy: '2.5' },
  { brand: 'XCMG', model: 'LW300KV', operatingWeight: 10.9, class: 'Pequena', originalBucket: '1,8 m³', recommendedLight: '3.0', recommendedHeavy: '2.5' },
  { brand: 'Volvo', model: 'L60', operatingWeight: 11.8, class: 'Pequena', originalBucket: '2,1 m³', recommendedLight: '3.0', recommendedHeavy: '2.5' },
  { brand: 'SDLG', model: 'LG936', operatingWeight: 11.8, class: 'Pequena', originalBucket: '2,1 m³', recommendedLight: '3.0', recommendedHeavy: '2.5' },
  { brand: 'JCB', model: '422 / 422ZX', operatingWeight: 11.9, class: 'Pequena', originalBucket: '2,1 m³', recommendedLight: '3.0', recommendedHeavy: '2.5' },
  { brand: 'LiuGong', model: '842', operatingWeight: 11.9, class: 'Pequena', originalBucket: '2,2 m³', recommendedLight: '3.0', recommendedHeavy: '2.5' },
  { brand: 'New Holland', model: 'W130', operatingWeight: 12.0, class: 'Pequena', originalBucket: '2,2 m³', recommendedLight: '3.0', recommendedHeavy: '2.5' },
  { brand: 'Case', model: '621', operatingWeight: 12.5, class: 'Média', originalBucket: '2,1 m³', recommendedLight: '4.0', recommendedHeavy: '2.8' },
  { brand: 'Hyundai', model: 'HL745', operatingWeight: 12.5, class: 'Média', originalBucket: '2,3 m³', recommendedLight: '4.0', recommendedHeavy: '2.8' },
  { brand: 'Caterpillar', model: '924K', operatingWeight: 12.8, class: 'Média', originalBucket: '2,1 m³', recommendedLight: '4.0', recommendedHeavy: '2.8' },
  { brand: 'John Deere', model: '524K', operatingWeight: 12.8, class: 'Média', originalBucket: '2,3 m³', recommendedLight: '4.0', recommendedHeavy: '2.8' },
  { brand: 'Komatsu', model: 'WA200', operatingWeight: 12.8, class: 'Média', originalBucket: '2,3 m³', recommendedLight: '4.0', recommendedHeavy: '2.8' },
  { brand: 'Randon', model: 'RD410', operatingWeight: 13.0, class: 'Média', originalBucket: '2,3 m³', recommendedLight: '4.0', recommendedHeavy: '2.8' },
  { brand: 'SDLG', model: 'LG938', operatingWeight: 13.2, class: 'Média', originalBucket: '2,5 m³', recommendedLight: '4.0', recommendedHeavy: '2.8' },
  { brand: 'Volvo', model: 'L70', operatingWeight: 14.2, class: 'Média/Pesada', originalBucket: '2,5 m³', recommendedLight: '5.0', recommendedHeavy: '3.0' },
  { brand: 'Komatsu', model: 'WA320', operatingWeight: 14.3, class: 'Média/Pesada', originalBucket: '2,5 m³', recommendedLight: '5.0', recommendedHeavy: '3.0' },
  { brand: 'JCB', model: '426 / 426ZX', operatingWeight: 14.5, class: 'Média/Pesada', originalBucket: '2,6 m³', recommendedLight: '5.0', recommendedHeavy: '3.0' },
  { brand: 'Volvo', model: 'L90', operatingWeight: 15.0, class: 'Média/Pesada', originalBucket: '2,7 m³', recommendedLight: '5.0', recommendedHeavy: '3.0' },
  { brand: 'Hyundai', model: 'HL757', operatingWeight: 15.2, class: 'Média/Pesada', originalBucket: '2,8 m³', recommendedLight: '5.0', recommendedHeavy: '3.0' },
  { brand: 'John Deere', model: '624K', operatingWeight: 15.5, class: 'Média/Pesada', originalBucket: '2,7 m³', recommendedLight: '5.0', recommendedHeavy: '3.0' },
  { brand: 'LiuGong', model: '848', operatingWeight: 15.8, class: 'Média/Pesada', originalBucket: '2,8 m³', recommendedLight: '5.0', recommendedHeavy: '3.0' },
  { brand: 'Caterpillar', model: '938K / 938M', operatingWeight: 15.9, class: 'Média/Pesada', originalBucket: '2,8 m³', recommendedLight: '5.0', recommendedHeavy: '3.0' },
  { brand: 'Michigan', model: '75', operatingWeight: 16.0, class: 'Média/Pesada', originalBucket: '2,8 m³', recommendedLight: '5.0', recommendedHeavy: '3.0' },
  { brand: 'LiuGong', model: '856', operatingWeight: 17.0, class: 'Média/Pesada', originalBucket: '3,0 m³', recommendedLight: '7.0', recommendedHeavy: '3.0' },
  { brand: 'SDLG', model: 'L956F', operatingWeight: 17.2, class: 'Média/Pesada', originalBucket: '3,0 m³', recommendedLight: '7.0', recommendedHeavy: '3.0' },
  { brand: 'XCMG', model: 'LW500KV', operatingWeight: 17.2, class: 'Média/Pesada', originalBucket: '3,0 m³', recommendedLight: '7.0', recommendedHeavy: '3.0' },
  { brand: 'New Holland', model: 'W190', operatingWeight: 17.5, class: 'Média/Pesada', originalBucket: '3,2 m³', recommendedLight: '7.0', recommendedHeavy: '3.0' },
  { brand: 'Volvo', model: 'L120', operatingWeight: 20.0, class: 'Pesada', originalBucket: '3,5 m³', recommendedLight: '7.0', recommendedHeavy: '3.0' },
];

export const MATERIALS: Material[] = [
  { name: 'Casca de arroz', density: 150, class: 'Muito leve' },
  { name: 'Bagaço de cana', density: 200, class: 'Muito leve' },
  { name: 'Serragem', density: 260, class: 'Muito leve' },
  { name: 'Cavaco de madeira', density: 350, class: 'Muito leve' },
  { name: 'Biomassa', density: 375, class: 'Muito leve' },
  { name: 'Casca de pinus', density: 375, class: 'Muito leve' },
  { name: 'Carvão vegetal', density: 350, class: 'Muito leve' },
  { name: 'Resíduos recicláveis', density: 350, class: 'Muito leve' },
  { name: 'Milho', density: 730, class: 'Médio' },
  { name: 'Soja', density: 750, class: 'Médio' },
  { name: 'Fertilizante', density: 1000, class: 'Pesado' },
  { name: 'Terra seca', density: 1200, class: 'Pesado' },
  { name: 'Calcário', density: 1350, class: 'Pesado' },
  { name: 'Cascalho', density: 1600, class: 'Muito pesado' },
  { name: 'Pedra britada', density: 1600, class: 'Muito pesado' },
  { name: 'Areia seca', density: 1600, class: 'Muito pesado' },
  { name: 'Areia úmida', density: 1900, class: 'Muito pesado' },
  { name: 'Minério de ferro', density: 2250, class: 'Extremamente pesado' },
];

export function getRecommendedBucket(machine: Machine, density: number): string {
  // Threshold to determine light vs heavy material selection.
  // Materials <= 600 kg/m³ are considered light
  if (density <= 600) {
    return machine.recommendedLight;
  } else {
    return machine.recommendedHeavy;
  }
}
