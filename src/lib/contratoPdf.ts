// PDF REAL do contrato de parceria (A4, texto selecionável). Síncrono e sem imagens externas:
// assim o arquivo sai no mesmo toque do botão (o iPhone perde o "gesto" se houver espera longa).
// Usa as fontes padrão do PDF (Helvetica, WinAnsi), que cobrem ã ç é ª º – … do português.
import { jsPDF } from 'jspdf';
import type { ContratoMontado, Paragrafo } from './contratoParceria';

const PAG_L = 210, PAG_A = 297;
const MARG = 20;
const LARG = PAG_L - 2 * MARG;
const TOPO = 24;           // início do texto nas páginas 2+
const BASE = PAG_A - 20;   // limite inferior do texto
const CORPO = 10;          // pt
const ENTRELINHA = 5;      // mm
const COR_TEXTO: [number, number, number] = [20, 20, 20];
const COR_SUAVE: [number, number, number] = [110, 110, 110];
const COR_MARCA: [number, number, number] = [30, 30, 30];

type Token = { t: string; b: boolean; w: number; esp: boolean };

function linhasDoParagrafo(pdf: jsPDF, p: Paragrafo, larg: number, pt: number): Token[][] {
  pdf.setFontSize(pt);
  const tokens: Token[] = [];
  for (const tr of p) {
    pdf.setFont('helvetica', tr.b ? 'bold' : 'normal');
    for (const parte of tr.t.split(/(\s+)/)) {
      if (!parte) continue;
      // sem kerning: os visualizadores não aplicam kerning ao desenhar, então medida = desenho
      const esp = /^\s+$/.test(parte);
      const mede = (x: string) => pdf.getStringUnitWidth(x, { doKerning: false }) * pt / 72 * 25.4;
      if (esp || mede(parte) <= larg) { tokens.push({ t: parte, b: !!tr.b, w: mede(parte), esp }); continue; }
      // palavra sozinha mais larga que a linha (e-mail, PIX, nome sem espaço): parte por caracteres
      let pedaco = '';
      for (const ch of Array.from(parte)) {
        if (pedaco && mede(pedaco + ch) > larg) { tokens.push({ t: pedaco, b: !!tr.b, w: mede(pedaco), esp: false }); pedaco = ''; }
        pedaco += ch;
      }
      if (pedaco) tokens.push({ t: pedaco, b: !!tr.b, w: mede(pedaco), esp: false });
    }
  }
  const linhas: Token[][] = [];
  let atual: Token[] = [], usado = 0;
  for (const tk of tokens) {
    if (atual.length === 0 && tk.esp) continue;
    if (!tk.esp && usado + tk.w > larg && atual.length) {
      while (atual.length && atual[atual.length - 1].esp) atual.pop();
      linhas.push(atual); atual = []; usado = 0;
    }
    atual.push(tk); usado += tk.w;
  }
  while (atual.length && atual[atual.length - 1].esp) atual.pop();
  if (atual.length) linhas.push(atual);
  return linhas;
}

function desenharLinha(pdf: jsPDF, linha: Token[], x: number, y: number, pt: number, cor = COR_TEXTO) {
  pdf.setFontSize(pt);
  pdf.setTextColor(...cor);
  // Palavra por palavra, cada uma na posição medida com as métricas da Helvetica. Um trecho longo numa
  // chamada só desloca o que vem depois quando o visualizador troca a fonte padrão por outra (visto no
  // poppler: "o" colado em "PARCEIRO"). Texto continua selecionável e o pdftotext recompõe os espaços.
  let cx = x;
  for (const tk of linha) {
    if (!tk.esp) {
      pdf.setFont('helvetica', tk.b ? 'bold' : 'normal');
      pdf.text(tk.t, cx, y);
    }
    cx += tk.w;
  }
}

export function gerarContratoPdf(c: ContratoMontado): jsPDF {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  pdf.setProperties({ title: `${c.titulo} - ${c.empresa}`, subject: c.tituloInstrumento, author: c.empresa, creator: 'Roder Indica' });
  let y = 0;

  const cabecalhoPaginaCheia = () => {
    // páginas 2+: linha fina com a marca
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(...COR_SUAVE);
    pdf.text(c.empresa, MARG, 13);
    pdf.setFont('helvetica', 'normal');
    pdf.text(c.titulo, PAG_L - MARG, 13, { align: 'right' });
    pdf.setDrawColor(200, 200, 200); pdf.setLineWidth(0.2); pdf.line(MARG, 16, PAG_L - MARG, 16);
    y = TOPO;
  };
  const novaPagina = () => { pdf.addPage(); cabecalhoPaginaCheia(); };
  const garantir = (altura: number) => { if (y + altura > BASE) novaPagina(); };

  // ---- página 1: cabeçalho Roder
  pdf.setFillColor(...COR_MARCA); pdf.rect(0, 0, PAG_L, 30, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(17); pdf.text('RODER', MARG, 14);
  pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal');
  pdf.text('MÁQUINAS E EQUIPAMENTOS', MARG, 19.5);
  pdf.text(`CNPJ ${c.cnpj}  |  Pardinho/SP`, MARG, 24.5);
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12);
  pdf.text(c.titulo.toUpperCase(), PAG_L - MARG, 17, { align: 'right' });
  y = 42;

  // ---- instrumento, versão, abertura
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10.5); pdf.setTextColor(...COR_TEXTO);
  pdf.text(c.tituloInstrumento.toUpperCase(), MARG, y); y += 5;
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...COR_SUAVE);
  pdf.text(c.versao, MARG, y); y += 7;

  const paragrafo = (p: Paragrafo, extraDepois = 2.5) => {
    const ls = linhasDoParagrafo(pdf, p, LARG, CORPO);
    ls.forEach((l, i) => {
      // órfã/viúva: não deixa uma linha sozinha em cima ou embaixo
      if (i === 0 && ls.length > 1) garantir(ENTRELINHA * 2);
      else if (i === ls.length - 1 && ls.length > 2 && y + ENTRELINHA > BASE) { /* quebra normal */ }
      garantir(ENTRELINHA);
      desenharLinha(pdf, l, MARG, y, CORPO);
      y += ENTRELINHA;
    });
    y += extraDepois;
  };
  paragrafo(c.abertura, 3);

  // ---- dados do parceiro (caixa inteira, nunca partida)
  const linhasQual = c.qualificacao.map(q => ({ rotulo: q.rotulo, ls: linhasDoParagrafo(pdf, [{ t: `${q.rotulo}: `, b: true }, { t: q.valor }], LARG - 8, 9.5) }));
  const alturaCaixa = 6 + linhasQual.reduce((s, q) => s + q.ls.length * 4.8, 0);
  garantir(alturaCaixa + 4);
  pdf.setFillColor(244, 244, 244); pdf.setDrawColor(210, 210, 210); pdf.setLineWidth(0.2);
  pdf.roundedRect(MARG, y, LARG, alturaCaixa, 1.5, 1.5, 'FD');
  let yq = y + 6;
  for (const q of linhasQual) for (const l of q.ls) { desenharLinha(pdf, l, MARG + 4, yq, 9.5); yq += 4.8; }
  y += alturaCaixa + 5;
  paragrafo(c.encerramentoAbertura, 4);

  // ---- cláusulas: título nunca fica sozinho no fim da página
  // nome do parceiro na assinatura: quantas linhas precisar, nunca descarta texto
  const COL_W = LARG / 2 - 5;
  const nomeLs = (() => {
    pdf.setFont('helvetica', 'bold');
    return linhasDoParagrafo(pdf, [{ t: (c.assinatura.parceiro.nome || '').toUpperCase(), b: true }], COL_W, 9)
      .map(l => l.map(t => t.t).join(''));
  })();
  const ALT_ASS = 46 + Math.max(0, nomeLs.length - 1) * 4.2;
  c.clausulas.forEach((cl, idx) => {
    // última cláusula: se a assinatura não cabe junto dela, as duas vão juntas para a página seguinte
    // (assinatura nunca fica sozinha numa página sem nenhum texto do contrato acima)
    if (idx === c.clausulas.length - 1) {
      const h = 9 + cl.paragrafos.reduce((s, p) => s + linhasDoParagrafo(pdf, p, LARG, CORPO).length * ENTRELINHA + 2.5, 0);
      if (y + h + ALT_ASS + 10 > BASE && h + ALT_ASS + 10 < BASE - TOPO) novaPagina();
    }
    const primeira = linhasDoParagrafo(pdf, cl.paragrafos[0] || [], LARG, CORPO).length;
    garantir(8 + ENTRELINHA * Math.min(2, Math.max(primeira, 1)));
    y += 2;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9.5); pdf.setTextColor(...COR_TEXTO);
    const tl = pdf.splitTextToSize(cl.titulo, LARG) as string[];
    for (const t of tl) { pdf.text(t, MARG, y); y += 5; }
    y += 0.5;
    for (const p of cl.paragrafos) paragrafo(p);
    y += 1.5;
  });

  // ---- assinatura: bloco inteiro na mesma página
  garantir(ALT_ASS);
  y += 8;
  pdf.setDrawColor(190, 190, 190); pdf.setLineWidth(0.2); pdf.line(MARG, y, PAG_L - MARG, y);
  y += 12;
  const colL = MARG, colR = MARG + LARG / 2 + 5, colW = LARG / 2 - 5;
  const ass = c.assinatura;
  pdf.setTextColor(...COR_TEXTO);
  // esquerda: Roder
  pdf.setFont('helvetica', 'italic'); pdf.setFontSize(8); pdf.text(ass.roder.rotulo, colL + colW / 2, y, { align: 'center' });
  // direita: parceiro
  if (ass.parceiro.assinado) {
    pdf.setFont('helvetica', 'bolditalic'); pdf.setFontSize(8.5); pdf.text(ass.parceiro.linha1, colR + colW / 2, y - 3.5, { align: 'center' });
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...COR_SUAVE); pdf.text(ass.parceiro.linha2, colR + colW / 2, y + 0.5, { align: 'center' });
  } else {
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(...COR_SUAVE); pdf.text(ass.parceiro.linha1.toUpperCase(), colR + colW / 2, y, { align: 'center' });
  }
  y += 3;
  pdf.setDrawColor(0, 0, 0); pdf.setLineWidth(0.3);
  pdf.line(colL, y, colL + colW, y); pdf.line(colR, y, colR + colW, y);
  y += 5;
  pdf.setTextColor(...COR_TEXTO); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
  pdf.text(ass.roder.nome, colL + colW / 2, y, { align: 'center', maxWidth: colW });
  nomeLs.forEach((t, i) => pdf.text(t, colR + colW / 2, y + i * 4.2, { align: 'center' }));
  const dy = Math.max(0, nomeLs.length - 1) * 4.2;
  y += 4.5;
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...COR_SUAVE);
  pdf.text(ass.roder.cnpj, colL + colW / 2, y, { align: 'center' });
  pdf.text(ass.parceiro.papel, colR + colW / 2, y + dy, { align: 'center' });

  // ---- rodapé em todas as páginas: Página X de Y
  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(200, 200, 200); pdf.setLineWidth(0.2); pdf.line(MARG, PAG_A - 14, PAG_L - MARG, PAG_A - 14);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...COR_SUAVE);
    pdf.text(`${c.empresa}  |  CNPJ ${c.cnpj}`, MARG, PAG_A - 9);
    pdf.text(`Página ${i} de ${total}`, PAG_L - MARG, PAG_A - 9, { align: 'right' });
  }
  return pdf;
}
