// Mensagem pronta para o parceiro mandar o equipamento ao cliente pelo WhatsApp:
// nome, 2 a 4 características do modelo e o link público (/o/código), onde o cliente
// pede o orçamento, vê o vídeo e abre a ficha. Nunca leva dado do parceiro nem comissão.
import { faixaDoModelo } from './faixaCmf';
import { tituloFicha } from './tituloFicha';

type Espec = Record<string, any>;
interface ModeloMin { id?: string; name?: string; technical_specs?: Espec }
interface ProdutoMin { name?: string; description?: string; technical_specs?: Espec }

const MAX_CARACTERISTICAS = 4;

// número ou faixa "N a N" / "N - N", sem letras ("1e3" não passa): é onde a unidade entra
const soNumero = (v: string) => /^\d[\d.,]*(\s*(a|-|–)\s*\d[\d.,]*)?$/i.test(v.trim());

// Ordem de importância para o cliente; cada item: chaves aceitas, rótulo e unidade quando vier só o número
const ESPECS: Array<{ chaves: string[]; rotulo: string; unidade?: string }> = [
  { chaves: ['peso', 'peso_do_equipamento', 'peso_kg', 'peso_estimado'], rotulo: 'Peso', unidade: 'kg' },
  { chaves: ['diametro_corte', 'diametro_max_corte', 'capacidade_diametro'], rotulo: 'Corte até', unidade: 'mm' },
  { chaves: ['abertura_maxima', 'abertura_total'], rotulo: 'Abertura máxima', unidade: 'mm' },
  { chaves: ['capacidade_carga', 'capacidade_de_carga'], rotulo: 'Capacidade de carga' },
  { chaves: ['area_carga', 'area_da_garra'], rotulo: 'Área de carga', unidade: 'm²' },
  { chaves: ['trator_hp', 'potencia_do_trator', 'trator'], rotulo: 'Trator' },
  { chaves: ['vazao', 'vazão'], rotulo: 'Vazão', unidade: 'L/min' },
  { chaves: ['pressao_trabalho', 'pressao'], rotulo: 'Pressão', unidade: 'bar' },
  { chaves: ['giro_360'], rotulo: 'Giro 360°' },
];

// Travessão vindo do cadastro: entre números vira "a" ("160 – 280 hp" vira "160 a 280 hp"); no resto, vírgula
const semTravessao = (v: string) => v
  .replace(/(\d)\s*[—–]\s*(\d)/g, '$1 a $2')
  .replace(/\s*[—–]\s*/g, ', ');
const texto = (v: unknown) => semTravessao(String(v).replace(/\s+/g, ' ').trim());

// Só texto não vazio ou número finito maior que zero; objeto, lista, 0 e NaN não entram
const valido = (v: unknown): boolean => {
  if (typeof v === 'number') return Number.isFinite(v) && v > 0;
  if (typeof v !== 'string') return false;
  const t = v.trim();
  if (!t || t === '-') return false;
  if (/^(undefined|null|nan|\[object .*\])$/i.test(t)) return false;
  if (/^[\d.,\s]+$/.test(t)) { const n = Number(t.replace(/\./g, '').replace(',', '.')); return Number.isFinite(n) && n > 0; }
  return true;
};

// "13 a 22 Ton." vira "13 a 22 t"
const faixaCurta = (f: string) => texto(f).replace(/\s*ton\.?$/i, ' t').replace(/\s+t$/i, ' t');

// A faixa de máquina depende do tipo: tonelada é escavadeira (ou pá carregadeira, pelo nome da linha),
// hp/cv é trator. Qualquer outra coisa (ex.: "Pá Carregadeira") não vira frase. Mesmo critério do server/previaLink.ts
function itemDaFaixa(bruto: string, nomeLinha: string): { item: string; trator: boolean } | null {
  const f = faixaCurta(bruto);
  if (/\b(hp|cv)\b/i.test(f)) return { item: `Indicado para tratores de ${f}`, trator: true };
  if (/\d/.test(f) && /\bt$/i.test(f)) {
    const alvo = /carregadeira|engate/i.test(nomeLinha) ? 'pás carregadeiras' : 'escavadeiras';
    return { item: `Indicado para ${alvo} de ${f}`, trator: false };
  }
  return null;
}

const frasesDa = (d: unknown): string[] => {
  if (typeof d !== 'string') return [];
  return texto(d).split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean)
    .map(x => (x.length > 120 ? `${x.slice(0, 117).replace(/\s+\S*$/, '')}...` : x));
};

export function caracteristicasDoModelo(prod: ProdutoMin, model: ModeloMin): string[] {
  const sp: Espec = { ...(prod.technical_specs || {}), ...(model.technical_specs || {}) };
  const itens: string[] = [];
  let tratorNaFaixa = false;
  const bruto = faixaDoModelo(model);
  if (valido(bruto)) {
    const f = itemDaFaixa(String(bruto), prod.name || '');
    if (f) { itens.push(f.item); tratorNaFaixa = f.trator; }
  }
  for (const e of ESPECS) {
    if (itens.length >= MAX_CARACTERISTICAS) break;
    // o trator já saiu na faixa: não repete
    if (tratorNaFaixa && e.rotulo === 'Trator') continue;
    const chave = e.chaves.find(c => valido(sp[c]));
    if (!chave) continue;
    const v = texto(sp[chave]);
    itens.push(`${e.rotulo} ${soNumero(v) && e.unidade ? `${v} ${e.unidade}` : v}`);
  }
  // cadastro magro: completa com frases curtas da descrição até ter 2; sem dado, não inventa
  for (const fr of frasesDa(prod.description)) {
    if (itens.length >= 2) break;
    itens.push(fr);
  }
  return itens.slice(0, MAX_CARACTERISTICAS);
}

export function textoEquipamentoCliente(prod: ProdutoMin, model: ModeloMin, link: string): string {
  const nome = tituloFicha(prod as any, model as any) || texto(model.name || prod.name || 'equipamento');
  const itens = caracteristicasDoModelo(prod, model);
  const lista = itens.length ? `\n${itens.map(i => `• ${i}`).join('\n')}\n` : '\n';
  return `Olá! Separei o *${nome}* da Roder para você:${lista}\nNo link você pede o orçamento, vê o vídeo e abre a ficha técnica: ${link}`;
}

export function linkWhatsSemNumero(mensagem: string): string {
  return `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
}
