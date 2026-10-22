// Mensagem e foto do equipamento para o cliente, no formato do botão WhatsApp do catálogo:
// foto grande + nome + máquina base + até 4 características + UM link (vídeo, ficha e orçamento).
// Catálogo e Consultor usam este mesmo código. Nunca leva dado do parceiro nem comissão.
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { perfilInstalacao, frasePara } from './instalacao';

export const DEFAULT_FAE_SPECS: Record<string, any> = {
  'fae-bl0-ex': { peso_do_equipamento: '290 a 325 kg', maquina_base: '2 a 4 Ton.', pressao: '180 a 250 bar', vazao: '50 a 90 L/min', diametro_max_trituracao: '80 mm (8 cm)', tipo_dente: 'Mini BL (Bite Limiter) / Lâmina ou Martelo Vídea (Fixo)' },
  'fae-pml-ex': { peso_do_equipamento: '190 a 210 kg', maquina_base: '1.5 a 5.5 Ton.', pressao: '150 a 220 bar', vazao: '20 a 90 L/min', diametro_max_trituracao: '50 mm (5 cm)', tipo_dente: 'Mini PML Lâminas Y ou Martelos PML' },
  'fae-bl1-ex-vt': { peso_do_equipamento: '350 a 410 kg', maquina_base: '4 a 8 Ton.', pressao: '180 a 350 bar', vazao: '50 a 140 L/min', diametro_max_trituracao: '120 mm (12 cm)', tipo_dente: 'Mini BL (Bite Limiter) dentes fixos planos com Vídea' },
  'fae-dml-hy': { peso_do_equipamento: '490 a 590 kg', maquina_base: '5 a 13 Ton.', pressao: '200 a 350 bar', vazao: '50 a 160 L/min', diametro_max_trituracao: '120 mm (12 cm)', tipo_dente: 'Dentes cilíndricos tipo E com Vídea' },
  'fae-bl2-ex-vt': { peso_do_equipamento: '570 kg', maquina_base: '8 a 14 Ton.', pressao: '180 a 350 bar', vazao: '100 a 140 L/min', diametro_max_trituracao: '150 mm (15 cm)', tipo_dente: 'Lâmina BL/MINI de série; dente de vídea C/3/MINI opcional' },
  'fae-bl3-ex-vt': { peso_do_equipamento: '1050 a 1250 kg', maquina_base: '14 a 20 Ton.', pressao: '220 a 350 bar', vazao: '100 a 200 L/min', diametro_max_trituracao: '200 mm (20 cm)', tipo_dente: 'Dentes fixos BL3 de Vídea tipo plano com limitador' },
  'fae-uml-ex-vt': { peso_do_equipamento: '1170 kg', maquina_base: '14 a 20 Ton.', pressao: '220 a 350 bar', vazao: '130 a 210 L/min', diametro_max_trituracao: '200 mm (20 cm)', tipo_dente: 'Dentes de vídea C/3 ou lâmina BL nos dentes centrais (a Roder fornece o outro para troca); C/3/HD só opcional' },
  'fae-uml-s-ex-vt': { peso_do_equipamento: '1450 kg', maquina_base: '18 a 25 Ton.', pressao: '220 a 350 bar', vazao: '145 a 240 L/min', diametro_max_trituracao: '300 mm (30 cm)', tipo_dente: 'Dentes de vídea C/3 ou lâmina BL nos dentes centrais (a Roder fornece o outro para troca)' },
  'fae-umm-ex-vt': { peso_do_equipamento: '2120 kg', maquina_base: '20 a 30 Ton.', pressao: '240 a 350 bar', vazao: '130 a 210 L/min', diametro_max_trituracao: '300 mm (30 cm)', tipo_dente: 'Dentes de vídea C/3 (a Roder sempre fornece assim), lâmina BL nos dentes centrais com suporte adaptador' }
};

const UNIDADES: Record<string, string> = {
  area_carga: ' m³', pressao_trabalho: ' bar', pressao: ' bar', peso: ' kg', capacidade_carga: ' kg',
  abertura_maxima: ' mm', abertura_total: ' mm', diametro_minimos: ' mm', diametro_minimo: ' mm',
  diametro_max_corte: ' mm', diametro_corte: ' mm', area_garra: ' m²', area_da_garra: ' m²', vazao: ' L/min', giro_360: '',
};

export function valorComUnidade(key: string, value: any) {
  if (!value) return '';
  const keyLower = key.toLowerCase();
  // valor que já traz a unidade segue como está
  const valStr = String(value).toLowerCase();
  if (valStr.includes('kg') || valStr.includes('ton') || valStr.includes('mm') || valStr.includes('bar') || valStr.includes('m²') || valStr.includes('m³') || valStr.includes('l/min') || valStr.includes('cm') || valStr.includes('"') || valStr.includes('cc')) {
    return value;
  }
  if (keyLower === 'giro_360') return value;
  if (keyLower.includes('abertura') || keyLower.includes('diametro') || keyLower.includes('medida_')) return `${value} mm`;
  if (keyLower.includes('peso') || keyLower.includes('capacidade')) return `${value} kg`;
  if (keyLower.includes('pressao')) return `${value} bar`;
  return `${value}${UNIDADES[keyLower] || ''}`;
}

const CURTOS: Record<string, string> = {
  diametro_max_tora: 'Tora até', diametro_rachamento: 'Racha toras até', diametro_corte: 'Corte até', diametro_max_corte: 'Corte até',
  diametro_max_trituracao: 'Tritura até', diametro_max_de_trituracao_mm: 'Tritura até', abertura_maxima: 'Abertura', abertura_total: 'Abertura',
  area_carga: 'Área', area_da_garra: 'Área', volume: 'Volume', capacidade_carga: 'Carga', capacidade_de_carga: 'Carga',
  peso: 'Peso', peso_do_equipamento: 'Peso', peso_kg: 'Peso', peso_sem_rotator: 'Peso', largura_de_trabalho_mm: 'Largura de trabalho',
  pressao: 'Pressão', vazao: 'Vazão',
};

// Mesma mensagem do botão WhatsApp do catálogo (pedido do Jeferson: nome, máquina base, até 4 características e UM link)
export function textoCatalogoWhats(productName: string, model: any, link: string): string {
  const finalProductName = productName || 'Equipamento Roder';
  const palavras = finalProductName.trim().split(/\s+/);
  const ultima = palavras[palavras.length - 1] || '';
  const nomeProduto = ultima && String(model.name || '').toUpperCase().startsWith(ultima.toUpperCase()) && ultima.length <= 4
    ? palavras.slice(0, -1).join(' ') : finalProductName;
  const titulo = nomeProduto.toLowerCase().includes(String(model.name || '').toLowerCase()) ? nomeProduto : `${nomeProduto} ${model.name}`.trim();
  const specsTodas: Record<string, any> = { ...(DEFAULT_FAE_SPECS[model.id] || {}), ...(model.technical_specs || {}) };
  const paraMaquina = frasePara(perfilInstalacao(`${finalProductName} ${model.name}`, specsTodas), `${finalProductName} ${model.name}`, specsTodas.maquina_base);
  const vistos = new Set<string>();
  const destaques: string[] = [];
  for (const k of Object.keys(CURTOS)) {
    const v = specsTodas[k];
    if (!v || String(v).trim() === '' || String(v).trim() === '-' || vistos.has(CURTOS[k])) continue;
    vistos.add(CURTOS[k]);
    destaques.push(`• ${CURTOS[k]} ${valorComUnidade(k, v)}`);
    if (destaques.length === 4) break;
  }
  return `*${titulo} - RODER*\n` +
    (paraMaquina ? `${paraMaquina}\n` : '') +
    (destaques.length ? `\n${destaques.join('\n')}\n` : '') +
    `\n${link}\n👆 Fotos, vídeo, ficha e orçamento`;
}

// Foto do modelo como arquivo, pronta para o menu de compartilhar do celular (a prévia do link no
// WhatsApp não aparecia: mandando a foto junto, ela chega sempre). Tenta até 3 imagens; nulo se nenhuma serve.
export async function arquivoDeFoto(imagens: Array<string | undefined> | undefined, nome: string): Promise<File | null> {
  for (const src of (imagens || []).filter((i): i is string => typeof i === 'string' && !!i && !/\.run\.app\//.test(i)).slice(0, 3)) {
    try {
      let blob: Blob | null = null;
      if (src.startsWith('db-file://')) {
        const snap = await getDoc(doc(db, 'app_files', src.slice(10)));
        const dados = String(snap.data()?.data || '');
        if (dados.startsWith('data:image/')) blob = await (await fetch(dados)).blob();
      } else {
        const abs = new URL(src, window.location.origin).href;
        const mesma = abs.startsWith(window.location.origin);
        const r = await fetch(mesma ? abs : `/api/documento?url=${encodeURIComponent(abs)}`);
        if (r.ok) blob = await r.blob();
      }
      if (blob && blob.size > 1000 && blob.type.startsWith('image/')) {
        const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
        const nomeArq = `${nome}`.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'roder';
        return new File([blob], `${nomeArq}-RODER.${ext}`, { type: blob.type });
      }
    } catch { /* tenta a próxima foto */ }
  }
  return null;
}

// Foto + texto pelo menu de compartilhar. 'ok' enviou, 'cancelou' fechou o menu, 'indisponivel' o aparelho
// não aceita (ou o celular recusou por não ser logo após o toque): quem chama cai no WhatsApp só com texto.
export async function compartilharFotoETexto(foto: File | null | undefined, texto: string): Promise<'ok' | 'cancelou' | 'indisponivel'> {
  if (!foto || typeof navigator === 'undefined' || typeof navigator.share !== 'function' || !navigator.canShare?.({ files: [foto] })) return 'indisponivel';
  try {
    await navigator.share({ files: [foto], text: texto });
    return 'ok';
  } catch (e: any) {
    return e?.name === 'AbortError' ? 'cancelou' : 'indisponivel';
  }
}
