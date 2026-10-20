// Bloco escondido que o servidor manda no fim da resposta do consultor:
// <painel>{"maquina":{...},"perguntas":[...],"alternativas":[...],"produto":"...","videos":["id"]}</painel>
// Nunca aparece para ninguém: sai do texto antes de mostrar, copiar, gerar relatório ou guardar.
// Sem dependência do navegador: o teste do servidor importa este arquivo.
import { lerIdsVideos } from './videosConsultor';

export interface PainelConversa {
  maquina?: { nome?: string; tipo?: string; potencia?: string; transmissao?: string; serve?: 'sim' | 'nao' | 'verificar'; motivo?: string };
  perguntas?: string[];
  alternativas?: { nome: string; obs?: string }[];
  produto?: string;
  // ids da biblioteca de vídeos (no máximo 3); quem mostra confere de novo contra a lista que tem
  videos?: string[];
}

const RE_PAINEL = /<\s*painel\s*>([\s\S]*?)<\s*\/\s*painel\s*>/gi;
// pedaço sem fechamento (resposta cortada no meio do bloco)
const RE_PAINEL_ABERTO = /<\s*painel\b[\s\S]*$/i;

const textoCurto = (v: any, max = 120) => (typeof v === 'string' || typeof v === 'number') ? String(v).trim().slice(0, max) : '';

export const lerPainel = (json: string): PainelConversa | null => {
  try {
    const bruto = JSON.parse(json.trim());
    if (!bruto || typeof bruto !== 'object') return null;
    const painel: PainelConversa = {};
    const m = bruto.maquina;
    if (m && typeof m === 'object') {
      const serve = textoCurto(m.serve, 12).toLowerCase().replace('ã', 'a');
      const maquina = {
        nome: textoCurto(m.nome, 80),
        tipo: textoCurto(m.tipo, 60),
        potencia: textoCurto(m.potencia, 40),
        transmissao: textoCurto(m.transmissao, 60),
        serve: (['sim', 'nao', 'verificar'].includes(serve) ? serve : undefined) as any,
        motivo: textoCurto(m.motivo, 200),
      };
      if (maquina.nome) painel.maquina = maquina;
    }
    if (Array.isArray(bruto.perguntas)) {
      const perguntas = bruto.perguntas.map((p: any) => textoCurto(p, 160)).filter(Boolean).slice(0, 3);
      if (perguntas.length) painel.perguntas = perguntas;
    }
    if (Array.isArray(bruto.alternativas)) {
      const alternativas = bruto.alternativas
        .map((a: any) => typeof a === 'string' ? { nome: textoCurto(a, 80) } : { nome: textoCurto(a?.nome, 80), obs: textoCurto(a?.obs, 60) })
        .filter((a: any) => a.nome).slice(0, 3);
      if (alternativas.length) painel.alternativas = alternativas;
    }
    const produto = textoCurto(bruto.produto, 80);
    if (produto) painel.produto = produto;
    const videos = lerIdsVideos(bruto.videos);
    if (videos.length) painel.videos = videos;
    return Object.keys(painel).length ? painel : null;
  } catch {
    return null;
  }
};

// Separa o texto que a pessoa vê do bloco do painel (que é lido com segurança e pode faltar)
export const separarPainel = (content: string): { texto: string; painel: PainelConversa | null } => {
  const bruto = content || '';
  let painel: PainelConversa | null = null;
  const texto = bruto
    .replace(RE_PAINEL, (_t, json) => { painel = lerPainel(json) || painel; return ''; })
    .replace(RE_PAINEL_ABERTO, '')
    .trim();
  return { texto, painel };
};

