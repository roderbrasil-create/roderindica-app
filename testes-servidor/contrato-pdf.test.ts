// Contrato de parceria em PDF: estrutura única (tela e PDF), nome de arquivo seguro, decisão de entrega
// (compartilhar arquivo x baixar + WhatsApp) e o PDF de verdade (páginas A4, acentos, 2% por extenso).
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { montarContrato, nomeArquivoContrato, textoDoParagrafo, rotuloAssinaturaParceiro } from '../src/lib/contratoParceria.ts';
import { gerarContratoPdf } from '../src/lib/contratoPdf.ts';
import { decidirAbrirPdf, decidirCompartilhar, abrirPdfContrato, compartilharPdfContrato, detectarAmbiente } from '../src/lib/compartilharContrato.ts';

const base = { nome: 'João Conceição Araújo', email: 'joao@ex.com.br', telefone: '(14) 99811-5111', pix: '123.456.789-00', mostrarPix: true, taxa: 2, aceito: true, dataAceite: '2026-09-15T15:00:00.000Z', jaGravado: true };
const todoTexto = (c: ReturnType<typeof montarContrato>) => [c.abertura, ...c.clausulas.flatMap(x => x.paragrafos)].map(textoDoParagrafo).join('\n');

test('ESTRUTURA: 7 cláusulas, percentual "2% (dois por cento)" na 2.1 e dados do parceiro', () => {
  const c = montarContrato(base);
  assert.equal(c.clausulas.length, 7);
  assert.match(todoTexto(c), /comissão de 2% \(dois por cento\) sobre o VALOR BASE DE TABELA/);
  assert.deepEqual(c.qualificacao.map(q => q.rotulo), ['NOME', 'E-MAIL', 'TELEFONE', 'CHAVE PIX PARA PAGAMENTO']);
  assert.equal(c.qualificacao[0].valor, 'João Conceição Araújo');
});

test('ESTRUTURA: taxa do cadastro (2,5) aparece por extenso e sem PIX a linha some', () => {
  const c = montarContrato({ ...base, taxa: 2.5, mostrarPix: false });
  assert.match(todoTexto(c), /2,5% \(dois vírgula cinco por cento\)/);
  assert.ok(!c.qualificacao.some(q => q.rotulo.includes('PIX')));
});

test('ASSINATURA: assinado mostra a data do aceite; sem data gravada avisa; antes de assinar aguarda', () => {
  assert.deepEqual(rotuloAssinaturaParceiro({ aceito: true, dataAceite: '2026-09-15T15:00:00.000Z' }), { assinado: true, linha1: 'ASSINADO DIGITALMENTE', linha2: 'EM 15/09/2026' });
  assert.equal(rotuloAssinaturaParceiro({ aceito: true, jaGravado: true }).linha2, 'EM DATA NÃO REGISTRADA');
  assert.equal(rotuloAssinaturaParceiro({ aceito: true, hoje: '01/02/2027' }).linha2, 'EM 01/02/2027');
  assert.equal(rotuloAssinaturaParceiro({ aceito: false }).assinado, false);
});

test('NOME DO ARQUIVO: seguro, sem acento, espaço nem caractere inválido', () => {
  assert.equal(nomeArquivoContrato('João da Conceição'), 'Contrato_Parceria_Roder_Joao_da_Conceicao.pdf');
  assert.equal(nomeArquivoContrato('  A/B\\C:D*E?"<>|  '), 'Contrato_Parceria_Roder_A_B_C_D_E.pdf');
  assert.equal(nomeArquivoContrato(''), 'Contrato_Parceria_Roder_Parceiro.pdf');
  assert.equal(nomeArquivoContrato(null), 'Contrato_Parceria_Roder_Parceiro.pdf');
  assert.equal(nomeArquivoContrato('%%%'), 'Contrato_Parceria_Roder_Parceiro.pdf');
  assert.ok(nomeArquivoContrato('x'.repeat(300)).length < 100);
});

test('DECISÃO: Imprimir/PDF no iPhone abre ou compartilha, nos demais baixa', () => {
  assert.equal(decidirAbrirPdf({ ios: true, standalone: false, compartilhaArquivo: true }), 'abrir');
  assert.equal(decidirAbrirPdf({ ios: true, standalone: true, compartilhaArquivo: true }), 'compartilhar');
  assert.equal(decidirAbrirPdf({ ios: true, standalone: true, compartilhaArquivo: false }), 'abrir');
  assert.equal(decidirAbrirPdf({ ios: false, standalone: false, compartilhaArquivo: true }), 'baixar');
  assert.equal(decidirAbrirPdf({ ios: false, standalone: true, compartilhaArquivo: false }), 'baixar');
});

test('DECISÃO: Compartilhar usa o arquivo quando o aparelho aceita, senão baixa e abre o WhatsApp', () => {
  assert.equal(decidirCompartilhar({ compartilhaArquivo: true }), 'arquivo');
  assert.equal(decidirCompartilhar({ compartilhaArquivo: false }), 'baixar-e-whatsapp');
});

// ---- ações com navegador falso
function falso(opts: { ua?: string; share?: (d: any) => Promise<void>; canShare?: boolean; standalone?: boolean; abrirJanela?: boolean }) {
  const chamadas: any = { share: [] as any[], open: [] as string[], baixou: [] as string[] };
  const nav: any = { userAgent: opts.ua || 'Mozilla/5.0 (Windows NT 10.0)', platform: 'Win32', maxTouchPoints: 0, standalone: opts.standalone };
  if (opts.canShare !== undefined) {
    nav.canShare = (d: any) => opts.canShare && !!d.files?.length;
    nav.share = async (d: any) => { chamadas.share.push(d); if (opts.share) await opts.share(d); };
  }
  const win: any = { open: (u: string) => { chamadas.open.push(u); return opts.abrirJanela === false ? null : {}; }, matchMedia: () => ({ matches: false }) };
  const doc: any = { createElement: () => { const a: any = { click() { chamadas.baixou.push(a.download); }, remove() {} }; return a; }, body: { appendChild() {} } };
  (globalThis as any).URL.createObjectURL ||= () => 'blob:x';
  return { d: { nav, win, doc }, chamadas };
}
const blob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';

test('COMPARTILHAR no celular: manda o PDF (arquivo) com título e texto, sem abrir WhatsApp à parte', async () => {
  const { d, chamadas } = falso({ ua: IPHONE, canShare: true });
  assert.equal(await compartilharPdfContrato(blob, 'João Silva', d), 'compartilhado');
  assert.equal(chamadas.share[0].files[0].name, 'Contrato_Parceria_Roder_Joao_Silva.pdf');
  assert.equal(chamadas.share[0].files[0].type, 'application/pdf');
  assert.ok(chamadas.share[0].title && chamadas.share[0].text);
  assert.equal(chamadas.open.length, 0);
  assert.equal(chamadas.baixou.length, 0);
});

test('COMPARTILHAR: fechar a folha não baixa nem abre nada', async () => {
  const { d, chamadas } = falso({ ua: IPHONE, canShare: true, share: async () => { const e: any = new Error('x'); e.name = 'AbortError'; throw e; } });
  assert.equal(await compartilharPdfContrato(blob, 'A', d), 'cancelou');
  assert.equal(chamadas.open.length + chamadas.baixou.length, 0);
});

test('COMPARTILHAR no computador (sem canShare): baixa o PDF e abre wa.me com texto curto', async () => {
  const { d, chamadas } = falso({});
  assert.equal(await compartilharPdfContrato(blob, 'Maria', d), 'baixado-whatsapp');
  assert.deepEqual(chamadas.baixou, ['Contrato_Parceria_Roder_Maria.pdf']);
  assert.match(chamadas.open[0], /^https:\/\/wa\.me\/\?text=/);
  assert.ok(decodeURIComponent(chamadas.open[0]).includes('PDF'));
});

test('COMPARTILHAR: share que falha por outro motivo cai em baixar + WhatsApp, sem quebrar', async () => {
  const { d, chamadas } = falso({ ua: IPHONE, canShare: true, share: async () => { const e: any = new Error('NotAllowed'); e.name = 'NotAllowedError'; throw e; } });
  assert.equal(await compartilharPdfContrato(blob, 'A', d), 'baixado-whatsapp');
  assert.equal(chamadas.baixou.length, 1);
});

test('IMPRIMIR/PDF: iPhone no Safari abre o PDF; se a aba for bloqueada, baixa', async () => {
  const a = falso({ ua: IPHONE, canShare: true });
  assert.equal(await abrirPdfContrato(blob, 'A', a.d), 'aberto');
  assert.match(a.chamadas.open[0], /^blob:/);
  const b = falso({ ua: IPHONE, canShare: true, abrirJanela: false });
  assert.equal(await abrirPdfContrato(blob, 'A', b.d), 'baixado');
});

test('IMPRIMIR/PDF: PWA instalado no iPhone usa a folha de compartilhar; computador baixa', async () => {
  const a = falso({ ua: IPHONE, canShare: true, standalone: true });
  assert.equal(await abrirPdfContrato(blob, 'A', a.d), 'compartilhado');
  const b = falso({});
  assert.equal(await abrirPdfContrato(blob, 'A', b.d), 'baixado');
  assert.deepEqual(b.chamadas.baixou, ['Contrato_Parceria_Roder_A.pdf']);
});

test('AMBIENTE: iPad moderno (MacIntel com toque) conta como iOS', () => {
  const amb = detectarAmbiente({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 5 }, {});
  assert.equal(amb.ios, true);
});

// ---- PDF de verdade
let temPdftotext = true;
try { execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }); } catch { temPdftotext = false; }

function pdfEmTexto(c: ReturnType<typeof montarContrato>) {
  const pdf = gerarContratoPdf(c);
  const dir = mkdtempSync(join(tmpdir(), 'contrato-'));
  try {
    const arq = join(dir, 'c.pdf');
    writeFileSync(arq, Buffer.from(pdf.output('arraybuffer')));
    const bytes = readFileSync(arq);
    const info = execFileSync('pdfinfo', [arq]).toString();
    const texto = execFileSync('pdftotext', ['-layout', arq, '-']).toString();
    const paginas = texto.split('\f').filter(p => p.trim());
    return { bytes, info, texto, paginas };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

test('PDF: A4, cabeçalho Roder, dados, 2% por extenso, acentos, 7 cláusulas e assinatura com a data', { skip: !temPdftotext }, () => {
  const { bytes, info, texto, paginas } = pdfEmTexto(montarContrato(base));
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
  assert.match(info, /Page size:\s+595\.\d+ x 841\.\d+ pts \(A4\)/);
  assert.match(info, new RegExp(`Pages:\\s+${paginas.length}\\b`));
  assert.ok(paginas.length >= 2 && paginas.length <= 4, `páginas: ${paginas.length}`);
  for (const trecho of ['RODER', 'MÁQUINAS E EQUIPAMENTOS', 'CONTRATO DE PARCERIA COMERCIAL', '05.420.841/0001-71',
    'NOME: João Conceição Araújo', 'E-MAIL: joao@ex.com.br', 'TELEFONE: (14) 99811-5111', 'CHAVE PIX PARA PAGAMENTO: 123.456.789-00',
    '2% (dois por cento)', 'ASSINADO DIGITALMENTE', 'EM 15/09/2026', 'PARCEIRO INDICADOR', 'Proteção de Dados', 'ª – DO OBJETO']) {
    assert.ok(texto.includes(trecho), `faltou no PDF: ${trecho}`);
  }
  for (let i = 1; i <= 7; i++) assert.ok(texto.includes(`CLÁUSULA ${i}ª`), `cláusula ${i}`);
  paginas.forEach((p, i) => assert.ok(p.includes(`Página ${i + 1} de ${paginas.length}`), `numeração da página ${i + 1}`));
});

test('PDF: caracteres do português ã ç é ª º – … saem corretos', { skip: !temPdftotext }, () => {
  const c = montarContrato(base);
  c.clausulas[0].paragrafos.push([{ t: 'Teste: ã ç é ª º – … ü Ç Õ' }]);
  const { texto } = pdfEmTexto(c);
  assert.ok(texto.includes('ã ç é ª º – …'), 'sequência de acentos');
  assert.ok(texto.includes('Ç Õ'));
});

test('PDF: nenhuma página termina com título de cláusula sozinho, nem a assinatura se separa', { skip: !temPdftotext }, () => {
  // varia o tamanho do texto (nome longo, parágrafos extras) para pegar quebras em lugares diferentes
  for (let extra = 0; extra < 40; extra++) {
    const c = montarContrato({ ...base, nome: 'Nome Muito Comprido '.repeat(1 + (extra % 4)) });
    c.clausulas[2].paragrafos.push(...Array.from({ length: extra }, (_, i) => [{ t: `3.${5 + i}. Parágrafo de enchimento para mudar a quebra de página ${i}. `.repeat(2) }]));
    const { paginas } = pdfEmTexto(c);
    paginas.forEach((p, i) => {
      const linhas = p.split('\n').map(l => l.trim()).filter(Boolean).filter(l => !/Página \d+ de \d+/.test(l) && !l.startsWith('RODER MÁQUINAS E EQUIPAMENTOS'));
      const ultima = linhas[linhas.length - 1] || '';
      assert.ok(!/^CLÁUSULA \d/.test(ultima), `extra ${extra}: página ${i + 1} termina em título: ${ultima}`);
    });
    const comAss = paginas.filter(p => p.includes('ASSINADO DIGITALMENTE'));
    assert.equal(comAss.length, 1);
    const p = comAss[0];
    assert.ok(p.includes('Assinado Digitalmente via App') && p.includes('EM 15/09/2026') && p.includes('PARCEIRO INDICADOR') && p.includes('CNPJ: 05.420.841'), `extra ${extra}: assinatura partida`);
    assert.ok(comAss[0] === paginas[paginas.length - 1], 'assinatura na última página');
    // a página da assinatura tem texto do contrato acima dela
    assert.ok(/CLÁUSULA|\d\.\d\./.test(p), `extra ${extra}: assinatura sozinha na página`);
  }
});

test('PDF na prévia/antes de assinar: mostra "Aguardando Assinatura"', { skip: !temPdftotext }, () => {
  const { texto } = pdfEmTexto(montarContrato({ ...base, aceito: false, dataAceite: undefined, jaGravado: false }));
  assert.ok(/AGUARDANDO ASSINATURA/.test(texto));
  assert.ok(!texto.includes('ASSINADO DIGITALMENTE'));
});

test('TELA: Contract.tsx usa a mesma estrutura do PDF e os dois botões geram o PDF', () => {
  const f = readFileSync(new URL('../src/pages/Contract.tsx', import.meta.url), 'utf8');
  assert.match(f, /montarContrato\(/);
  assert.match(f, /gerarContratoPdf\(contrato\)/);
  assert.match(f, /abrirPdfContrato\(/);
  assert.match(f, /compartilharPdfContrato\(/);
  assert.doesNotMatch(f, /window\.print\(\)/);
});
