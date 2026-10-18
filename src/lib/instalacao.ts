// O que entra no orçamento de cada equipamento e o que o consultor vai confirmar com o
// cliente. Regras passadas pelo Jeferson (17/10/2026). Usado na tela de orçamento, no
// e-mail ao cliente e na mensagem do WhatsApp, para nenhum texto prometer instalação
// em equipamento que não leva.
export type PerfilInstalacao = 'completa' | 'linha_extra' | 'garfo' | 'trator_tecnico' | 'trator' | 'guindaste';

export const TEXTOS_INSTALACAO: Record<PerfilInstalacao, { itens: string[]; consultor: string }> = {
  // Escavadeira e pá carregadeira com função hidráulica (engate rápido, garra frontal, CFR, triturador p/ pá)
  completa: {
    itens: ['Equipamento', 'Frete até a sua cidade', 'Instalação hidráulica na sua máquina por técnico Roder', 'Regulagem e orientação ao operador'],
    consultor: 'Ele vai pedir a marca e o modelo da sua máquina e fotos do comando hidráulico, para confirmar se ela tem fatia extra e válvula de regulagem de pressão. É com isso que a Roder prepara a instalação hidráulica completa.',
  },
  // Caçamba High Tip e prolongador com concha: precisam de uma linha extra bidirecional (3ª função)
  linha_extra: {
    itens: ['Equipamento com o encaixe do engate da sua pá carregadeira', 'Frete até a sua cidade', 'Instalação da linha extra (3ª função), se a sua máquina ainda não tiver'],
    consultor: 'Ele vai confirmar o modelo da sua pá carregadeira e se ela já tem engate rápido e linha extra bidirecional (3ª função). Se já tiver, não precisa de instalação. Se não tiver, a Roder instala.',
  },
  // Garfo paleteiro: só mecânico
  garfo: {
    itens: ['Equipamento', 'Frete até a sua cidade'],
    consultor: 'Ele vai confirmar o modelo da sua pá carregadeira e se ela usa engate rápido, para o garfo ir com o encaixe certo.',
  },
  // FAE de trator (Fresa SSH e trituradores de TDP): equipamento mais técnico
  trator_tecnico: {
    itens: ['Equipamento', 'Frete até a sua cidade', 'Técnico Roder acompanha a primeira instalação no trator', 'Orientação de trabalho ao operador no início'],
    consultor: 'Ele vai confirmar o modelo e a potência do seu trator.',
  },
  // Mini Skidder, carreta de arrasto, Clambank: o cliente acopla e liga as mangueiras
  trator: {
    itens: ['Equipamento pronto para acoplar no trator', 'Frete até a sua cidade'],
    consultor: 'Ele vai confirmar o modelo do seu trator e fechar frete e prazo de entrega.',
  },
  // GMT 035 (guindaste, Munck, grua) e GP 150 (cesto aéreo): as linhas vêm do fornecedor do guindaste/cesto
  guindaste: {
    itens: ['Equipamento', 'Frete até a sua cidade'],
    consultor: 'Ele vai confirmar o modelo do seu guindaste, grua ou cesto aéreo e as linhas hidráulicas que ele já tem preparadas para o equipamento.',
  },
};

export function perfilInstalacao(nome: string, specs?: Record<string, any>): PerfilInstalacao {
  const t = (nome || '').toLowerCase();
  if (/mini\s*skid|\bmsr\s*\d|carreta|clam\s*bank|clambank/.test(t)) return 'trator';
  if (/garfo\s*paleteiro|\bgpr\s*\d/.test(t)) return 'garfo';
  if (/high\s*tip|prolongador/.test(t)) return 'linha_extra';
  if (/gmt\s*0?35|cabe[cç]ote de poda|\bgp\s*150/.test(t)) return 'guindaste';
  const ehTrator = /fresa|\bssh\s*\d|trator/.test(t) || !!(specs && (specs.pto_rpm || specs.trator_hp || specs.potencia_do_trator_cv));
  if (ehTrator && !/carregadeira|escavadeira/.test(t)) return 'trator_tecnico';
  return 'completa';
}

// Quem é a "máquina base" para escrever "Para escavadeiras de 20 a 30 t"
export function nomeMaquinaBase(perfil: PerfilInstalacao, nome: string): string {
  const t = (nome || '').toLowerCase();
  if (perfil === 'trator' || perfil === 'trator_tecnico') return 'tratores';
  if (perfil === 'guindaste') return 'guindastes';
  if (perfil === 'linha_extra' || perfil === 'garfo' || /engate|carregadeira|\bcfr\b|carregador frontal|garra frontal|top clamp/.test(t)) return 'pá carregadeira';
  return 'escavadeiras';
}

// "20 a 30 Ton." vira "Para escavadeiras de 20 a 30 t"; texto livre ("Guindaste Munck") fica como está
export function frasePara(perfil: PerfilInstalacao, nome: string, maquinaBase: string): string {
  const base = String(maquinaBase || '').trim().replace(/\s*ton\.?$/i, ' t');
  if (!base) return '';
  return /^\d/.test(base) ? `Para ${nomeMaquinaBase(perfil, nome)} de ${base}` : `Para ${base}`;
}

// "Qual a máquina do seu cliente?": em quais máquinas cada equipamento do catálogo trabalha
export type TipoMaquina = 'escavadeira' | 'pa' | 'trator' | 'guindaste';
export const NOME_MAQUINA: Record<TipoMaquina, string> = { escavadeira: 'escavadeira', pa: 'pá carregadeira', trator: 'trator', guindaste: 'guindaste, Munck ou cesto aéreo' };
export function maquinasDoProduto(p: { name?: string; models?: any[] }): Set<TipoMaquina> {
  const r = new Set<TipoMaquina>();
  const modelos = (p.models && p.models.length) ? p.models : [{ name: '', technical_specs: {} }];
  for (const m of modelos) {
    const nome = `${p.name || ''} ${m?.name || ''}`;
    const specs = m?.technical_specs || {};
    const perfil = perfilInstalacao(nome, specs);
    const base = nomeMaquinaBase(perfil, nome);
    const textoBase = String(specs.maquina_base || specs.trator || '').toLowerCase();
    if (base === 'tratores') r.add('trator');
    else if (base === 'guindastes') r.add('guindaste');
    else if (base === 'pá carregadeira') r.add('pa');
    else r.add('escavadeira');
    if (/p[áa]\s*carregadeira|carregadeira/.test(textoBase)) r.add('pa');
    if (/escavadeira/.test(textoBase)) r.add('escavadeira');
    if (/trator/.test(textoBase)) r.add('trator');
    if (/guindaste|munck|grua|cesto/.test(textoBase)) r.add('guindaste');
  }
  return r;
}
