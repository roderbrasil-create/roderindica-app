// Quais equipamentos a Roder entrega instalados na máquina do cliente (adequação
// hidráulica, regulagem de pressão e orientação ao operador) e quais o próprio cliente
// acopla e liga as mangueiras ou a TDP. Usado na tela de orçamento e no e-mail ao cliente,
// para nenhum texto prometer instalação em equipamento que não leva.
const SEM_INSTALACAO = [
  /mini\s*skid/i, /\bmsr\s*\d/i, // Mini Skidder (trator, 3 pontos)
  /carreta/i, /clam\s*bank/i, /clambank/i, // carreta de arrasto
  /fresa/i, /\bssh\s*\d/i, // Fresa FAE de trator (TDP)
  /garfo\s*paleteiro/i, /\bgpr\s*\d/i, // garfo mecânico
];

export function precisaInstalacao(...nomes: (string | undefined | null)[]): boolean {
  const texto = nomes.filter(Boolean).join(' ');
  if (!texto) return true;
  return !SEM_INSTALACAO.some(r => r.test(texto));
}
