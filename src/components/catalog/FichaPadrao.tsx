import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { X, ShieldCheck, Download, Send, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { RODER_LOGO_BASE64 } from './RoderLogo';
import type { Product, ProductModel } from '../../types';
import { useVoltarFecha } from '../../lib/useVoltarFecha';
import { getGTProductivityData, COMPRIMENTOS_GT, ehGarraTracadora } from '../../lib/produtividadeGt';
import {
  LARGURA_FOLHA, ALTURA_FOLHA, carregarLogoFae, esperarImagens, pdfDasFolhas, entregarPdf,
  enviarArquivoPdf, nomeArquivoFicha, resolverImagem, usePodeEnviarFicha,
} from './fichaPdf';

// Ficha padrão (uma folha A4) para todo equipamento do catálogo sem ficha própria.
// Cores da ficha Roder: grafite e amarelo Roder.
const COR_G = '#1B1E22';
const COR_A = '#F6C400';
const COR_AC = '#FFF7D1';
const COR_AE = '#9A7A00';
const COR_T2 = '#5E6672';
const COR_BD = '#E2E5E8';
const FONTE_TIT = "'Archivo Variable', 'Geist Variable', sans-serif";
const FONTE_TXT = "'Geist Variable', system-ui, sans-serif";

// Rótulos em português das chaves de technical_specs (mesmos nomes do catálogo)
const ROTULOS: Record<string, string> = {
  maquina_base: 'Máquina base',
  area_carga: 'Área de carga',
  area_da_garra: 'Área da garra',
  diametro_minimo: 'Diâmetro mínimo',
  abertura_maxima: 'Abertura máxima',
  abertura_total: 'Abertura total',
  peso: 'Peso',
  peso_do_equipamento: 'Peso',
  peso_kg: 'Peso',
  peso_operacional: 'Peso operacional',
  peso_sem_rotator: 'Peso sem rotator',
  peso_com_rotator: 'Peso com rotator',
  pressao_trabalho: 'Pressão de trabalho',
  pressao: 'Pressão',
  vazao: 'Vazão',
  'vazão': 'Vazão',
  diametro_corte: 'Diâmetro de corte',
  diametro_max_corte: 'Diâmetro máx. de corte',
  sabre: 'Sabre',
  corrente: 'Corrente',
  motor: 'Motor',
  giro_360: 'Giro 360°',
  dimensoes: 'Dimensões',
  capacidade_diametro: 'Diâmetro máximo',
  capacidade_carga: 'Capacidade de carga',
  capacidade_de_carga: 'Capacidade de carga',
  capacidade: 'Capacidade',
  finame: 'Finame',
  linhaviva: 'Linha viva',
  trator: 'Trator',
  trator_hp: 'Potência do trator',
  potencia_do_trator: 'Potência do trator',
  pto_rpm: 'Rotação da TDP',
  medida_a: 'Altura "A"',
  medida_b: 'Largura total "B"',
  medida_c: 'Comprimento "C"',
  medida_d: 'Medida "D"',
  n_facas: 'Nº de facas',
  acumulador: 'Acumulador',
  carregadeira: 'Pá carregadeira',
  escavadeira: 'Escavadeira',
  diametro_max_carga: 'Diâmetro máx. de carga',
  comprimento_giro: 'Comprimento de giro',
  diametro_max_trituracao: 'Trituração máxima',
  diametro_max_de_trituracao_mm: 'Trituração máxima',
  tipo_dente: 'Tipo de dente',
  tipo_material: 'Tipo de material',
  largura_de_trabalho_mm: 'Largura de trabalho',
  largura_total_mm: 'Largura total',
  diametro_do_rotor_mm: 'Diâmetro do rotor',
  profundidade_max_de_trabalho_mm: 'Profundidade máxima',
  numero_de_dentes: 'Número de dentes',
  altura_total: 'Altura total',
  largura_total: 'Largura total',
  comprimento_util_garfo: 'Comprimento útil do garfo',
  volume: 'Volume',
  volume_concha: 'Volume da concha',
  escavadeira_cavaco: 'Escavadeira p/ cavaco',
  escavadeira_areia: 'Escavadeira p/ areia',
  diametro_rachamento: 'Diâmetro máx. de rachamento',
  altura_garra_aberta: 'Altura (garra aberta)',
  diametro_max_tora: 'Diâmetro máx. de tora',
  codigo_roder: 'Código Roder',
  hidraulica: 'Hidráulica',
};

// Rótulos curtos para o cabeçalho da tabela "Modelos da linha"
const ROTULOS_CURTOS: Record<string, string> = {
  maquina_base: 'Máquina base', area_carga: 'Área', area_da_garra: 'Área', abertura_maxima: 'Abertura',
  abertura_total: 'Abertura', diametro_minimo: 'Ø mín.', peso: 'Peso', peso_do_equipamento: 'Peso', peso_kg: 'Peso',
  peso_operacional: 'Peso oper.', pressao_trabalho: 'Pressão', pressao: 'Pressão', vazao: 'Vazão', 'vazão': 'Vazão',
  diametro_corte: 'Ø corte', diametro_max_corte: 'Ø corte', diametro_max_trituracao: 'Trituração',
  capacidade_diametro: 'Ø máx.', capacidade_carga: 'Capacidade', capacidade_de_carga: 'Capacidade',
  trator_hp: 'Trator', potencia_do_trator: 'Trator', trator: 'Trator', volume: 'Volume', volume_concha: 'Volume',
  largura_total: 'Largura', largura_total_mm: 'Largura', largura_de_trabalho_mm: 'Larg. trabalho',
};

// Ordem de importância (a mesma do catálogo)
const ORDEM = [
  'maquina_base', 'area_carga', 'area_da_garra', 'abertura_maxima', 'abertura_total', 'diametro_minimo',
  'peso_do_equipamento', 'peso', 'peso_kg', 'peso_operacional', 'diametro_max_trituracao', 'diametro_max_de_trituracao_mm',
  'diametro_max_corte', 'diametro_corte', 'capacidade_diametro', 'capacidade_de_carga', 'capacidade_carga', 'capacidade',
  'volume', 'volume_concha', 'pressao', 'pressao_trabalho', 'vazao', 'vazão', 'largura_de_trabalho_mm', 'largura_total_mm',
  'trator_hp', 'potencia_do_trator', 'giro_360', 'n_facas', 'acumulador', 'carregadeira', 'escavadeira',
  'altura_total', 'largura_total', 'comprimento_util_garfo', 'dimensoes', 'tipo_dente', 'tipo_material',
];

// Fora dos números de destaque e do comparativo (são códigos ou viram a faixa "Indicada para")
const FORA_DOS_NUMEROS = new Set(['codigo_roder', 'maquina_base', 'giro_360', 'finame', 'linhaviva', 'escavadeira', 'carregadeira', 'trator', 'trator_hp', 'potencia_do_trator']);

const vazio = (v: any) => v === null || v === undefined || String(v).trim() === '' || String(v).trim() === '-';

const rotulo = (k: string) => ROTULOS[k.toLowerCase()] || (k.charAt(0).toUpperCase() + k.slice(1)).replace(/_/g, ' ');

// Completa a unidade que falta (mesma regra do catálogo): "620" em peso vira "620 kg"
function comUnidade(key: string, valor: any): string {
  let v = String(valor).trim();
  const k = key.toLowerCase();
  const lv = v.toLowerCase();
  if (!/\d/.test(v)) return v;
  if ((k.includes('peso') || k.includes('capacidade_de_carga') || k === 'capacidade_carga') && !k.includes('operacional') && !lv.includes('kg') && !lv.includes('ton') && !/\bt\b/.test(lv)) v += ' kg';
  else if ((k.includes('medida') || k.includes('abertura') || (k.includes('diametro') && !k.includes('capacidade')) || k.includes('altura') || k.includes('largura') || k.includes('comprimento')) && !k.includes('dimensoes') && !/(mm|cm|\bm\b)/.test(lv)) v += ' mm';
  else if (k.includes('pressao') && !lv.includes('bar')) v += ' bar';
  else if ((k.includes('vazao') || k.includes('vazão')) && !lv.includes('l/min') && !lv.includes('lmin')) v += ' L/min';
  else if (k.includes('area') && !lv.includes('m²') && !lv.includes('m2')) v += ' m²';
  // "1950 mm" vira "1.950 mm" (números de 4+ dígitos sem separador, fora de códigos)
  v = v.replace(/(^|[\s(])(\d{4,})(?=\s|$|[)])/g, (_, a, n) => a + n.replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
  // "12 a 18 Ton." vira "12 a 18 t"
  return v.replace(/\s*\b(ton\.?|tons\.?|toneladas)(?=\s|$|\))/gi, ' t').replace(/\s+/g, ' ').trim();
}

// "1.950 mm" separa número e unidade, para a unidade sair menor
function separarUnidade(v: string): [string, string] {
  const m = v.match(/^(.*\d)\s*(kg|mm|cm|m²|m³|m3|m|bar|L\/min|t|cv|HP|rpm|%|°)$/i);
  return m ? [m[1], m[2]] : [v, ''];
}

function ordenar(chaves: string[]) {
  return [...chaves].sort((a, b) => {
    const ia = ORDEM.indexOf(a.toLowerCase());
    const ib = ORDEM.indexOf(b.toLowerCase());
    if (ia !== -1 && ib !== -1) return ia - ib;
    return ia !== -1 ? -1 : ib !== -1 ? 1 : 0;
  });
}

const specsDe = (m?: ProductModel) => (m?.technical_specs || {}) as Record<string, any>;

export const ehProdutoFae = (p?: Partial<Product> | null, m?: Partial<ProductModel> | null) =>
  /\bfae\b/i.test(`${p?.name || ''} ${p?.category || ''} ${m?.name || ''}`);

// "Garra Florestal" + "R400" vira "Garra Florestal R400"; não repete quando o modelo já tem o nome
export function tituloFicha(p: Partial<Product>, m: Partial<ProductModel>) {
  const pn = (p.name || '').trim();
  const mn = (m.name || '').trim();
  if (!mn) return pn;
  if (!pn || mn.toLowerCase().includes(pn.toLowerCase()) || pn.toLowerCase().includes(mn.toLowerCase())) return mn.length >= pn.length ? mn : pn;
  return `${pn} ${mn}`;
}

export const fotoDoModelo = (p: Partial<Product>, m: Partial<ProductModel>) =>
  (m.images && m.images.find(Boolean)) || m.image_url || p.image_url || '';

// Faixa "Indicada para": a máquina base e, se houver, o rotator / giro
function faixaIndicada(p: Partial<Product>, m: Partial<ProductModel>) {
  const s = specsDe(m as ProductModel);
  const itens: { rotulo: string; valor: string }[] = [];
  const chaveBase = ['maquina_base', 'escavadeira', 'carregadeira', 'potencia_do_trator', 'trator_hp', 'trator'].find(k => !vazio(s[k]));
  if (chaveBase) {
    let v = comUnidade(chaveBase, s[chaveBase]);
    const texto = `${p.name || ''} ${p.category || ''} ${m.name || ''}`.toLowerCase();
    // Só número ("12 a 18 t"): diz em que máquina vai
    if (/^[\d\s.,a-]+t?$/i.test(v) && /\d/.test(v)) {
      if (chaveBase === 'carregadeira' || /carregadeira|engate|high tip/.test(texto)) v = `Pás carregadeiras de ${v}`;
      else if (chaveBase.includes('trator') || /trator/.test(texto)) v = `Tratores de ${v}`;
      else if (chaveBase === 'escavadeira' || /garra|cabe[çc]ote|tritura|desbast|feller|destoc|tra[çc]ador|concha|ca[çc]amba|rachador/.test(texto)) v = `Escavadeiras de ${v}`;
      else v = `Máquinas de ${v}`;
    }
    itens.push({ rotulo: 'Indicada para', valor: v });
  }
  const giro = s.giro_360 ?? s.rotator;
  if (!vazio(giro)) {
    const g = String(giro).trim();
    const sim = /^(sim|s|ilimitado|infinito|360|360°|360º|yes)$/i.test(g);
    itens.push({ rotulo: 'Rotator', valor: sim ? 'Giro infinito 360°' : g });
  }
  return itens;
}

export interface DadosFicha {
  titulo: string;
  categoria: string;
  descricao: string;
  codigo: string;
  faixa: { rotulo: string; valor: string }[];
  numeros: { rotulo: string; valor: string }[];
  linhas: { rotulo: string; valor: string }[];
  produtividade: string;
  // Garra Traçadora: produtividade calculada por comprimento e a nota de corrente/sabre
  gt: { linhas: { comprimento: string; hora: string; turno: string; mes: string }[]; corrente: string; maquina: string } | null;
  comparativo: { colunas: { chave: string; rotulo: string }[]; modelos: { id: string; nome: string; valores: string[]; ativo: boolean }[] } | null;
  fae: boolean;
}

const numBr = (n: number, casas = 0) => n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

// Mesmo cálculo do consultor (ciclo de 20 s a 30 s, carga média de 85%, turno de 10 h, 22 dias/mês)
function dadosGt(modelo: string): DadosFicha['gt'] {
  let corrente = '';
  let maquina = '';
  const linhas = COMPRIMENTOS_GT.map(c => {
    const d = getGTProductivityData(modelo, c);
    corrente = d.chainSpec;
    maquina = d.machineBase;
    return {
      comprimento: `${numBr(c, 1)} m`,
      hora: `${numBr(d.hourlyMin, 1)} a ${numBr(d.hourlyMax, 1)}`,
      turno: `${numBr(d.shiftMin)} a ${numBr(d.shiftMax)}`,
      mes: `${numBr(d.monthlyMin)} a ${numBr(d.monthlyMax)}`,
    };
  });
  return { linhas, corrente, maquina };
}

export function montarDadosFicha(p: Partial<Product>, m: Partial<ProductModel>): DadosFicha {
  const s = specsDe(m as ProductModel);
  const chaves = ordenar(Object.keys(s).filter(k => !vazio(s[k])));

  const faixa = faixaIndicada(p, m);
  const giroNaFaixa = faixa.some(f => f.rotulo === 'Rotator');
  const linhas = chaves.filter(k => k !== 'codigo_roder' && !(giroNaFaixa && k === 'giro_360')).slice(0, 14).map(k => ({ rotulo: rotulo(k), valor: comUnidade(k, s[k]) }));

  // Números de destaque: os 4 primeiros que cabem num quadro (valor curto)
  const numeros = chaves
    .filter(k => !FORA_DOS_NUMEROS.has(k.toLowerCase()))
    .map(k => ({ rotulo: rotulo(k), valor: comUnidade(k, s[k]) }))
    .filter(n => n.valor.length <= 18 && /\d/.test(n.valor))
    .slice(0, 4);

  // Comparativo: chaves que a maioria dos modelos da linha tem, até 5 colunas
  let comparativo: DadosFicha['comparativo'] = null;
  const modelos = (p.models || []).filter(x => x && x.name);
  if (modelos.length >= 2) {
    const contagem = new Map<string, number>();
    const tamanho = new Map<string, number>();
    modelos.forEach(x => Object.entries(specsDe(x)).forEach(([k, v]) => {
      if (vazio(v) || k === 'codigo_roder' || k === 'giro_360') return;
      contagem.set(k, (contagem.get(k) || 0) + 1);
      tamanho.set(k, Math.max(tamanho.get(k) || 0, comUnidade(k, v).length));
    }));
    const minimo = Math.max(2, Math.ceil(modelos.length / 2));
    const candidatas = ordenar([...contagem.keys()].filter(k => (contagem.get(k) || 0) >= minimo && (tamanho.get(k) || 0) <= 22));
    // Uma coluna por assunto: peso e peso_do_equipamento não entram juntos
    const vistas = new Set<string>();
    const colunas: { chave: string; rotulo: string }[] = [];
    for (const k of candidatas) {
      const r = ROTULOS_CURTOS[k.toLowerCase()] || rotulo(k);
      if (vistas.has(r)) continue;
      vistas.add(r);
      colunas.push({ chave: k, rotulo: r });
      if (colunas.length === 5) break;
    }
    if (colunas.length) {
      // Linha com muitos modelos: até 8, sempre com o escolhido
      let lista = modelos;
      if (lista.length > 8) {
        const i = Math.max(0, lista.findIndex(x => x.id === m.id));
        const ini = Math.min(Math.max(0, i - 3), lista.length - 8);
        lista = lista.slice(ini, ini + 8);
      }
      comparativo = {
        colunas,
        modelos: lista.map(x => ({
          id: x.id,
          nome: x.name,
          ativo: x.id === m.id,
          valores: colunas.map(c => (vazio(specsDe(x)[c.chave]) ? '-' : comUnidade(c.chave, specsDe(x)[c.chave]))),
        })),
      };
    }
  }

  let descricao = (p.description || '').replace(/\s+/g, ' ').trim();
  if (descricao.length > 360) descricao = descricao.slice(0, 357).replace(/\s+\S*$/, '') + '...';
  const gt = ehGarraTracadora(p.name, p.category, m.name) ? dadosGt(m.name || '') : null;
  // Na GT a tabela calculada substitui o texto livre: com os dois a folha passa do A4
  let produtividade = gt ? '' : (m.productivity_text || '').trim();
  if (produtividade.length > 700) produtividade = produtividade.slice(0, 697).replace(/\s+\S*$/, '') + '...';

  return {
    titulo: tituloFicha(p, m),
    categoria: (p.category || '').trim(),
    descricao,
    codigo: vazio(s.codigo_roder) ? '' : String(s.codigo_roder).trim(),
    faixa,
    numeros,
    linhas,
    produtividade,
    gt,
    comparativo,
    fae: ehProdutoFae(p, m),
  };
}

// Zoom da foto: aceita fator (1.2) ou porcentagem (120)
function escalaFoto(z?: number) {
  if (!z || !isFinite(z)) return 1;
  const f = z > 4 ? z / 100 : z;
  return Math.min(2.5, Math.max(0.5, f));
}

interface FolhaProps {
  dados: DadosFicha;
  foto: string;
  zoom?: number;
  logoFae: string | null;
  modelo: string;
}

// A folha em si (840 px = A4). Sem hooks de contexto: também é desenhada fora da tela para gerar o PDF.
export const FolhaFichaPadrao = React.forwardRef<HTMLDivElement, FolhaProps>(({ dados, foto, zoom, logoFae, modelo }, ref) => {
  const tdBase: React.CSSProperties = { padding: '6px 8px', borderBottom: `1px solid ${COR_BD}` };
  const thComp: React.CSSProperties = { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: COR_T2, textAlign: 'right', padding: '6px 8px', borderBottom: `2px solid ${COR_G}`, fontWeight: 700 };
  const secao = (t: string) => (
    <div style={{ fontFamily: FONTE_TIT, fontStretch: '108%', fontWeight: 800, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '7px', color: COR_G }}>
      <span style={{ width: '4px', height: '15px', background: COR_A, borderRadius: '2px', display: 'inline-block' }} />
      {t}
    </div>
  );
  const tabela = (linhas: { rotulo: string; valor: string }[], inicio = 0) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
      <tbody>
        {linhas.map((l, i) => {
          const fundo = (i + inicio) % 2 === 0 ? '#F7F8F9' : '#ffffff';
          return (
            <tr key={l.rotulo + i}>
              <td style={{ ...tdBase, color: COR_T2, fontWeight: 600, background: fundo, verticalAlign: 'top' }}>{l.rotulo}</td>
              <td style={{ ...tdBase, fontWeight: 800, textAlign: 'right', color: COR_G, background: fundo }}>{l.valor}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
  // Produtividade: na Garra Traçadora, a tabela calculada por comprimento e a nota de corrente/sabre
  const thGt: React.CSSProperties = { fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.04em', color: COR_T2, textAlign: 'right', padding: '5px 6px', borderBottom: `2px solid ${COR_G}`, fontWeight: 700 };
  const tdGt: React.CSSProperties = { padding: '5px 6px', borderBottom: `1px solid ${COR_BD}`, textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' };
  const blocoProd = (dados.produtividade || dados.gt) ? (
    <div>
      {secao('Produtividade')}
      {dados.gt && (
        <div className="ficha-gt">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr>
                <th style={{ ...thGt, textAlign: 'left' }}>Tora</th>
                <th style={thGt}>m³/hora</th>
                <th style={thGt}>Turno 10 h</th>
                <th style={thGt}>Mês (22 dias)</th>
              </tr>
            </thead>
            <tbody>
              {dados.gt.linhas.map((l, i) => {
                const fundo = i % 2 === 0 ? '#F7F8F9' : '#ffffff';
                return (
                  <tr key={l.comprimento}>
                    <td style={{ ...tdGt, textAlign: 'left', fontWeight: 800, background: fundo }}>{l.comprimento}</td>
                    <td style={{ ...tdGt, background: fundo }}>{l.hora}</td>
                    <td style={{ ...tdGt, background: fundo }}>{l.turno}</td>
                    <td style={{ ...tdGt, background: fundo }}>{l.mes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ fontSize: '9.5px', color: COR_T2, marginTop: '4px', lineHeight: 1.4 }}>
            m³ estéreo. Ciclo de 20 s a 30 s e carga média de 85% da garra; tora de 1,0 m é o metrinho.
          </div>
          <div style={{ marginTop: '8px', background: COR_AC, borderLeft: `3px solid ${COR_A}`, borderRadius: '8px', padding: '8px 10px', fontSize: '10.5px', lineHeight: 1.45 }}>
            <b style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
              Corrente e sabre{dados.gt.corrente ? ` · passo ${dados.gt.corrente}` : ''}
            </b>
            <div>Corrente sempre afiada: troca a cada 2 h (máx. 2,5 h), 5 correntes afiadas por turno de 10 h.</div>
            <div>Consumo médio: 4 a 5 correntes e 1 sabre por mês; pinhão de 20 a 30 dias (100 a 400 h).</div>
            <div>Lubrificação automática sempre ativa: sem óleo, a corrente aquece e o sabre empena.</div>
          </div>
        </div>
      )}
      {dados.produtividade && (
        <div style={{ background: '#F7F8F9', borderRadius: '10px', padding: dados.gt ? '8px 10px' : '11px 13px', marginTop: dados.gt ? '8px' : 0, fontSize: dados.gt ? '10.5px' : '11.5px', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{dados.produtividade}</div>
      )}
    </div>
  ) : null;
  const metade = Math.ceil(dados.linhas.length / 2);
  const tituloGrande = dados.titulo.length > 26 ? '30px' : '36px';

  return (
    <div
      ref={ref}
      className="ficha-folha"
      style={{
        width: `${LARGURA_FOLHA}px`, minWidth: `${LARGURA_FOLHA}px`, minHeight: `${ALTURA_FOLHA}px`, background: '#ffffff', color: COR_G,
        fontFamily: FONTE_TXT, padding: '38px 42px 28px', display: 'flex', flexDirection: 'column', gap: '18px',
        boxShadow: '0 4px 14px rgba(0,0,0,.12)', borderRadius: '4px', boxSizing: 'border-box', lineHeight: 1.4,
      }}
    >
      {/* Cabeçalho: logo Roder, sem faixa colorida, linha grafite de 2 px */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: `2px solid ${COR_G}`, gap: '16px' }}>
        <img src={RODER_LOGO_BASE64} alt="Roder" style={{ height: '40px', width: 'auto', display: 'block' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          {dados.fae && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
              {logoFae ? (
                <img src={logoFae} alt="FAE" style={{ height: '28px', width: 'auto', display: 'block' }} />
              ) : (
                <span style={{ fontFamily: FONTE_TIT, fontStretch: '120%', fontWeight: 900, fontSize: '25px', color: '#E8590C', letterSpacing: '0.06em', lineHeight: 1 }}>FAE</span>
              )}
              <span style={{ fontSize: '8.5px', letterSpacing: '0.12em', color: COR_T2, fontWeight: 700, textTransform: 'uppercase' }}>Distribuidor oficial</span>
            </div>
          )}
          <div style={{ textAlign: 'right', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.14em', color: COR_T2, textTransform: 'uppercase', borderLeft: dados.fae ? `1px solid ${COR_BD}` : 'none', paddingLeft: dados.fae ? '18px' : 0 }}>
            Ficha técnica
            {dados.categoria && <b style={{ display: 'block', fontSize: '12.5px', color: COR_G, letterSpacing: '0.06em', marginTop: '2px', maxWidth: '300px' }}>{dados.categoria}</b>}
          </div>
        </div>
      </div>

      {/* Título, para que serve e foto */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px', alignItems: 'center' }}>
        <div style={{ minWidth: 0 }}>
          {dados.codigo && <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: COR_AE }}>Código Roder {dados.codigo}</div>}
          <h1 style={{ fontFamily: FONTE_TIT, fontStretch: '112%', fontWeight: 850, fontSize: tituloGrande, lineHeight: 1.04, letterSpacing: '-0.4px', margin: '4px 0 0', color: COR_G, overflowWrap: 'anywhere' }}>
            {dados.titulo}
          </h1>
          {dados.descricao && <p style={{ fontSize: '13px', color: '#333', marginTop: '10px', lineHeight: 1.5 }}>{dados.descricao}</p>}
        </div>
        <div style={{ height: dados.gt ? '220px' : '290px', borderRadius: '14px', background: 'linear-gradient(180deg,#F4F5F6,#E1E4E7)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {foto ? (
            <img
              src={foto}
              alt={modelo}
              crossOrigin={foto.startsWith('data:') ? undefined : 'anonymous'}
              style={{ maxWidth: '92%', maxHeight: dados.gt ? '196px' : '256px', objectFit: 'contain', mixBlendMode: 'multiply', transform: `scale(${escalaFoto(zoom)})` }}
            />
          ) : (
            <span style={{ fontFamily: FONTE_TIT, fontWeight: 800, fontSize: '22px', color: '#AEB4BC' }}>{modelo}</span>
          )}
        </div>
      </div>

      {/* Indicada para */}
      {dados.faixa.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'stretch', gap: '16px', background: COR_G, color: '#fff', borderRadius: '12px', padding: '12px 16px' }}>
          {dados.faixa.map((f, i) => (
            <React.Fragment key={f.rotulo}>
              {i > 0 && <div style={{ width: '1px', background: '#3A3F46' }} />}
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#AEB4BC' }}>{f.rotulo}</span>
                <b style={{ fontFamily: FONTE_TIT, fontStretch: '108%', fontWeight: 800, fontSize: '18px', color: COR_A, display: 'block', lineHeight: 1.25 }}>{f.valor}</b>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Números principais */}
      {dados.numeros.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${dados.numeros.length}, 1fr)`, border: `1px solid ${COR_BD}`, borderRadius: '12px', overflow: 'hidden' }}>
          {dados.numeros.map((n, i) => {
            const [num, un] = separarUnidade(n.valor);
            return (
              <div key={n.rotulo + i} style={{ padding: '11px 12px', borderRight: i < dados.numeros.length - 1 ? `1px solid ${COR_BD}` : 'none' }}>
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: COR_T2 }}>{n.rotulo}</span>
                <b style={{ display: 'block', fontFamily: FONTE_TIT, fontStretch: '108%', fontWeight: 800, fontSize: num.length > 12 ? '16px' : '20px', marginTop: '3px', lineHeight: 1.2 }}>
                  {num}{un && <small style={{ fontSize: '12px', fontWeight: 700 }}> {un}</small>}
                </b>
              </div>
            );
          })}
        </div>
      )}

      {/* Especificações e produtividade */}
      {dados.linhas.length > 0 && (blocoProd ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            {secao(`Especificações ${modelo}`)}
            {tabela(dados.linhas)}
            <div style={{ fontSize: '9.5px', color: COR_T2, fontStyle: 'italic', marginTop: '5px' }}>Padrão de fábrica. Pode mudar sem aviso.</div>
          </div>
          {blocoProd}
        </div>
      ) : (
        <div>
          {secao(`Especificações ${modelo}`)}
          {/* Poucas linhas: uma tabela só, na metade da folha; muitas: duas colunas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {dados.linhas.length <= 5 ? (
              <div>{tabela(dados.linhas)}</div>
            ) : (
              <>
                <div>{tabela(dados.linhas.slice(0, metade))}</div>
                <div>{tabela(dados.linhas.slice(metade), metade)}</div>
              </>
            )}
          </div>
          <div style={{ fontSize: '9.5px', color: COR_T2, fontStyle: 'italic', marginTop: '5px' }}>Padrão de fábrica. Pode mudar sem aviso.</div>
        </div>
      ))}
      {dados.linhas.length === 0 && blocoProd}

      {/* Modelos da linha */}
      {dados.comparativo && (
        <div>
          {secao('Modelos da linha')}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
            <thead>
              <tr>
                <th style={{ ...thComp, textAlign: 'left' }}>Modelo</th>
                {dados.comparativo.colunas.map(c => <th key={c.chave} style={thComp}>{c.rotulo}</th>)}
              </tr>
            </thead>
            <tbody>
              {dados.comparativo.modelos.map((x, i) => {
                const fundo = x.ativo ? COR_AC : (i % 2 === 0 ? '#F7F8F9' : '#ffffff');
                const td: React.CSSProperties = { ...tdBase, textAlign: 'right', fontWeight: 700, color: COR_G, background: fundo };
                return (
                  <tr key={x.id || x.nome}>
                    <td style={{ ...td, textAlign: 'left', fontWeight: 800 }}>{x.nome}</td>
                    {x.valores.map((v, j) => <td key={j} style={td}>{v}</td>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Contato */}
      <div style={{ marginTop: 'auto', border: `1.5px solid ${COR_BD}`, borderRadius: '12px', padding: '12px 15px', fontSize: '12px', color: COR_G }}>
        <b style={{ fontFamily: FONTE_TIT, fontWeight: 800, fontSize: '14px' }}>Fale com a Roder</b>
        <div style={{ marginTop: '2px' }}>WhatsApp comercial (14) 99811-5111 · Fone (14) 3161-5110</div>
      </div>

      {/* Rodapé */}
      <div style={{ borderTop: `1px solid ${COR_BD}`, paddingTop: '9px', display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: COR_T2 }}>
        <span>Roder Máquinas e Equipamentos Ltda.</span>
        <span>Pardinho, SP · Sinop, MT</span>
        <span>roderbrasil.com.br</span>
      </div>
    </div>
  );
});
FolhaFichaPadrao.displayName = 'FolhaFichaPadrao';

// Gera o PDF da ficha padrão sem abrir a tela (botão "Enviar ficha")
export async function gerarFichaPadraoPdf(p: Product, m: ProductModel) {
  const dados = montarDadosFicha(p, m);
  const [foto, logoFae] = await Promise.all([resolverImagem(fotoDoModelo(p, m)), dados.fae ? carregarLogoFae() : Promise.resolve(null)]);
  const caixa = document.createElement('div');
  caixa.setAttribute('aria-hidden', 'true');
  caixa.style.cssText = `position:fixed;left:-10000px;top:0;width:${LARGURA_FOLHA}px;pointer-events:none;`;
  document.body.appendChild(caixa);
  const raiz = createRoot(caixa);
  try {
    let folha: HTMLDivElement | null = null;
    await new Promise<void>(ok => {
      raiz.render(<FolhaFichaPadrao ref={el => { folha = el; if (el) ok(); }} dados={dados} foto={foto} zoom={m.image_zoom ?? p.image_zoom} logoFae={logoFae} modelo={m.name} />);
    });
    await esperarImagens(folha!);
    return await pdfDasFolhas([folha!]);
  } finally {
    raiz.unmount();
    caixa.remove();
  }
}

// "Enviar ficha" da ficha padrão: gera e abre o compartilhar (ou baixa e abre o WhatsApp Web)
export async function enviarFichaPadrao(p: Product, m: ProductModel) {
  const id = toast.loading('Gerando a ficha em PDF...');
  try {
    const pdf = await gerarFichaPadraoPdf(p, m);
    toast.dismiss(id);
    await enviarArquivoPdf(pdf.output('blob'), nomeArquivoFicha(m.name), `Ficha técnica ${tituloFicha(p, m)}`);
  } catch (e) {
    console.error('Erro ao gerar a ficha padrão:', e);
    toast.error('Não consegui gerar o PDF. Tente de novo.', { id });
  }
}

interface FichaPadraoProps {
  product: Product;
  model: ProductModel;
  onClose: () => void;
  // aberta pelo "Enviar ficha": destaca o botão Enviar
  enviar?: boolean;
}

export function FichaPadrao({ product, model, onClose, enviar = false }: FichaPadraoProps) {
  useVoltarFecha(true, onClose);
  const podeEnviar = usePodeEnviarFicha();
  const [modeloId, setModeloId] = useState(model.id);
  const modelos = (product.models || []).length ? product.models! : [model];
  const atual = modelos.find(x => x.id === modeloId) || model;
  const dados = montarDadosFicha(product, atual);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const folhaRef = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);
  const [alturaVista, setAlturaVista] = useState(0);
  const [foto, setFoto] = useState('');
  const [logoFae, setLogoFae] = useState<string | null>(null);
  const [gerando, setGerando] = useState<null | 'baixar' | 'enviar'>(null);

  useEffect(() => { setModeloId(model.id); }, [model.id]);

  useEffect(() => {
    let vivo = true;
    resolverImagem(fotoDoModelo(product, atual)).then(u => { if (vivo) setFoto(u); });
    return () => { vivo = false; };
  }, [product, atual]);

  useEffect(() => {
    if (dados.fae) carregarLogoFae().then(setLogoFae);
  }, [dados.fae]);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  useEffect(() => {
    const medir = () => {
      if (!wrapperRef.current || !folhaRef.current) return;
      const disponivel = wrapperRef.current.clientWidth - (window.innerWidth < 640 ? 16 : 32);
      const e = disponivel < LARGURA_FOLHA ? disponivel / LARGURA_FOLHA : 1;
      setEscala(e);
      setAlturaVista(folhaRef.current.offsetHeight * e);
    };
    medir();
    const obs = new ResizeObserver(medir);
    if (wrapperRef.current) obs.observe(wrapperRef.current);
    if (folhaRef.current) obs.observe(folhaRef.current);
    window.addEventListener('resize', medir);
    return () => { obs.disconnect(); window.removeEventListener('resize', medir); };
  }, [modeloId]);

  // Gera pelo mesmo caminho do "Enviar ficha" de fora (folha desenhada fora da tela, sem escala)
  const gerar = async (modo: 'baixar' | 'enviar') => {
    if (gerando) return;
    setGerando(modo);
    const id = toast.loading('Gerando a ficha em PDF...');
    try {
      const pdf = await gerarFichaPadraoPdf(product, atual);
      toast.dismiss(id);
      await entregarPdf(pdf, nomeArquivoFicha(atual.name), modo, `Ficha técnica ${dados.titulo}`);
      if (modo === 'baixar') toast.success('PDF baixado.');
    } catch (e) {
      console.error('Erro ao gerar a ficha padrão:', e);
      toast.error('Não consegui gerar o PDF. Tente de novo.', { id });
    } finally {
      setGerando(null);
    }
  };

  const pdfSite = atual.pdf_url || product.pdf_url || '';
  const temPdfSite = /^https?:\/\//.test(pdfSite);

  return (
    <div style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0.5rem)' }} className="fixed inset-0 z-[99999] overflow-hidden bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="bg-card text-card-foreground w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col h-[96vh]">
        <div className="bg-muted px-3 sm:px-6 py-3 flex items-center justify-between gap-2 border-b border-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded-lg bg-amber-400/15 text-amber-600 shrink-0"><ShieldCheck className="h-5 w-5" /></span>
            <span className="font-extrabold text-sm tracking-tight text-foreground truncate">Ficha técnica · {dados.titulo}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {podeEnviar && (
              <>
                <button
                  onClick={() => gerar('baixar')}
                  disabled={!!gerando}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-black text-xs disabled:opacity-60"
                >
                  {gerando === 'baixar' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">Salvar PDF</span>
                </button>
                <button
                  onClick={() => gerar('enviar')}
                  disabled={!!gerando}
                  className={`flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#1FA855] hover:bg-[#178a45] text-white font-black text-xs disabled:opacity-60 ${enviar ? 'ring-2 ring-offset-2 ring-[#1FA855] animate-pulse' : ''}`}
                >
                  {gerando === 'enviar' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Enviar
                </button>
              </>
            )}
            <button onClick={onClose} aria-label="Fechar" className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg hover:bg-muted-foreground/10 text-muted-foreground">
              <X className="h-5 w-5 shrink-0" />
            </button>
          </div>
        </div>

        <div ref={wrapperRef} className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-8 bg-neutral-100 flex flex-col items-center">
          {(modelos.length > 1 || temPdfSite) && (
            <div className="w-full max-w-4xl mx-auto mb-3 flex flex-wrap items-center justify-between gap-2 bg-white p-1.5 rounded-xl border border-neutral-200 shrink-0">
              <div className="flex flex-wrap gap-1 flex-1">
                {modelos.length > 1 && modelos.map(x => (
                  <button
                    key={x.id}
                    onClick={() => setModeloId(x.id)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${x.id === atual.id ? 'bg-[#1B1E22] text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
                  >
                    {x.name}
                  </button>
                ))}
              </div>
              {temPdfSite && (
                <a href={pdfSite} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-black text-neutral-700 hover:text-neutral-950 rounded-lg hover:bg-neutral-100">
                  <ExternalLink className="h-3 w-3" /> PDF do site
                </a>
              )}
            </div>
          )}
          <div className="w-full flex justify-center" style={{ height: alturaVista ? `${alturaVista}px` : 'auto' }}>
            <div style={{ width: `${LARGURA_FOLHA}px`, minWidth: `${LARGURA_FOLHA}px`, transform: `scale(${escala})`, transformOrigin: 'top center' }}>
              <FolhaFichaPadrao ref={folhaRef} dados={dados} foto={foto} zoom={atual.image_zoom ?? product.image_zoom} logoFae={logoFae} modelo={atual.name} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
