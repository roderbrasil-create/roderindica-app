// Mensagem pronta para o parceiro mandar o equipamento ao cliente pelo WhatsApp:
// nome, 2 a 4 características do modelo e o link público (/o/código), onde o cliente
// pede o orçamento, vê o vídeo e abre a ficha. Nunca leva dado do parceiro nem comissão.
import { faixaDoModelo } from './faixaCmf';
import { tituloFicha } from './tituloFicha';

type Espec = Record<string, any>;
interface ModeloMin { id?: string; name?: string; technical_specs?: Espec }
interface ProdutoMin { name?: string; description?: string; technical_specs?: Espec }

const MAX_CARACTERISTICAS = 4;

const vazio = (v: unknown) => v === undefined || v === null || String(v).trim() === '' || String(v).trim() === '-';
const soNumero = (v: string) => /^[\d.,\s]+$/.test(v);

// Ordem de importância para o cliente; cada item: chaves aceitas, rótulo e unidade quando vier só o número
const ESPECS: Array<{ chaves: string[]; rotulo: string; unidade?: string }> = [
  { chaves: ['peso', 'peso_do_equipamento', 'peso_kg', 'peso_estimado'], rotulo: 'Peso', unidade: 'kg' },
  { chaves: ['diametro_corte', 'diametro_max_corte', 'capacidade_diametro'], rotulo: 'Corte até', unidade: 'mm' },
  { chaves: ['abertura_maxima', 'abertura_total'], rotulo: 'Abertura máxima', unidade: 'mm' },
  { chaves: ['capacidade_carga', 'capacidade_de_carga'], rotulo: 'Capacidade de carga' },
  { chaves: ['area_carga', 'area_da_garra'], rotulo: 'Área de carga', unidade: 'm²' },
  { chaves: ['trator_hp', 'potencia_do_trator', 'trator'], rotulo: 'Trator' },
  { chaves: ['vazao', 'vazão'], rotulo: 'Vazão', unidade: 'l/min' },
  { chaves: ['pressao_trabalho', 'pressao'], rotulo: 'Pressão', unidade: 'bar' },
  { chaves: ['giro_360'], rotulo: 'Giro 360°' },
];

const texto = (v: unknown) => String(v).replace(/\s+/g, ' ').trim();

// "13 a 22 Ton." vira "13 a 22 t"
const faixaCurta = (f: string) => texto(f).replace(/\s*ton\.?$/i, ' t').replace(/\s+t$/i, ' t');

export function caracteristicasDoModelo(prod: ProdutoMin, model: ModeloMin): string[] {
  const sp: Espec = { ...(prod.technical_specs || {}), ...(model.technical_specs || {}) };
  const itens: string[] = [];
  const faixa = faixaDoModelo(model);
  if (!vazio(faixa)) itens.push(`Indicado para escavadeiras de ${faixaCurta(faixa)}`);
  for (const e of ESPECS) {
    if (itens.length >= MAX_CARACTERISTICAS) break;
    const chave = e.chaves.find(c => !vazio(sp[c]));
    if (!chave) continue;
    const v = texto(sp[chave]);
    itens.push(`${e.rotulo} ${soNumero(v) && e.unidade ? `${v} ${e.unidade}` : v}`);
  }
  // cadastro magro: completa com a primeira frase da descrição, curta
  if (itens.length < 2) {
    const frase = texto(prod.description || '').split(/(?<=[.!?])\s+/)[0] || '';
    if (frase) itens.push(frase.length > 120 ? `${frase.slice(0, 117).replace(/\s+\S*$/, '')}...` : frase);
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
