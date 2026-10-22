// Ficha individual FAE: o PDF (baixar E enviar usam a mesma função) precisa sair com foto, logo FAE, rotor,
// dentes, QR e logo Roder, e com a tabela sem texto por cima de texto. Bug de 22/10/2026 no iPhone:
// as imagens sumiam e o rótulo "Largura total (com chapas laterais e mancais)" cobria o valor.
// Roda no Chromium do Playwright (não existe WebKit neste ambiente); sem Chromium o teste é pulado.
// Rodar: node --import tsx --test testes-servidor/ficha-fae-pdf-e2e.test.ts
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { CHAVES_FICHA_FAE, FICHAS_FAE } from '../src/data/fichasTrituradorFae.ts';

const fonte = (caminho: string) => readFileSync(new URL(caminho, import.meta.url), 'utf8');

// ---- parte estática: modal ("Salvar PDF"/"Enviar") e enviarFichaFae passam pelo MESMO caminho blindado
test('baixar e enviar usam gerarFichaFaePdf, que confere as imagens e captura sem transform', () => {
  const f = fonte('../src/components/catalog/FichaTrituradorFae.tsx');
  assert.match(f, /export async function enviarFichaFae[\s\S]*?await gerarFichaFaePdf\(chave\)/);
  assert.match(f, /const gerar = async \(modo[\s\S]*?await gerarFichaFaePdf\(chave\)/);
  assert.match(f, /imagensNaoCarregadas\(folha!\)/);
  assert.match(f, /throw new Error\(`Imagens da ficha sem carregar/);
  assert.match(f, /pdfDasFolhas\(\[folha!\], \{ largura: LARGURA_FAE, pixelRatio: 1, aquecimentos: 2, fundo: '#f0efed' \}\)/);
  assert.match(f, /fetch\(c\)/);
  assert.match(f, /readAsDataURL/);
  assert.match(f, /document as any\)\.fonts\?\.ready/);
  // nada que o Safari larga na captura: fundo por background-image, blend mode, imagem sem tamanho, transform na folha
  assert.doesNotMatch(f, /background-image|backgroundImage|mix-blend-mode|height: 'auto'|height:auto/);
  assert.doesNotMatch(f, /className="ffae"[^>]*transform/);
});

// ---- parte e2e
async function carregarPlaywright(): Promise<any | null> {
  const req = createRequire(import.meta.url);
  for (const caminho of [process.env.PLAYWRIGHT_CORE, 'playwright-core', 'playwright'].filter(Boolean) as string[]) {
    try { return req(caminho); } catch { /* tenta o próximo */ }
  }
  return null;
}
const chromium = ['/opt/pw-browsers/chromium', process.env.CHROMIUM_PATH || ''].find(c => c && existsSync(c));
let temPdftoppm = true;
try { execFileSync('pdftoppm', ['-v'], { stdio: 'ignore' }); } catch { temPdftoppm = false; }

// regiões da folha A4 em fração (x, y, largura, altura), tiradas das medidas da ficha em mm
const A = (x: number, y: number, l: number, a: number): [number, number, number, number] => [x / 210, y / 297, l / 210, a / 297];
const REGIOES = {
  foto: A(130, 32, 68, 48),
  logoFae: A(184, 7, 17, 16),
  qr: A(143, 165, 15, 15),
  roder: A(138, 272, 58, 10),
  rotor: A(12, 150, 30, 10),
};
const MODO = { foto: 'cor', logoFae: 'cor', qr: 'cor', roder: 'claro', rotor: 'cor' };

test('PDF dos 4 modelos sai com todas as imagens (foto, logo FAE, dentes, QR, logo Roder)', { timeout: 600000 }, async t => {
  const pw = await carregarPlaywright();
  if (!pw || !chromium || !temPdftoppm) { t.skip('sem Playwright, Chromium ou pdftoppm neste ambiente'); return; }
  const { createServer } = await import('vite');
  const servidor = await createServer({ server: { host: '127.0.0.1', port: 0, hmr: false }, logLevel: 'error' });
  await servidor.listen();
  const porta = (servidor.httpServer!.address() as any).port;
  const navegador = await pw.chromium.launch({ executablePath: chromium });
  const pasta = mkdtempSync(join(tmpdir(), 'ficha-fae-'));
  try {
    const pagina = await navegador.newPage({ viewport: { width: 1000, height: 900 } });
    const erros: string[] = [];
    pagina.on('pageerror', (e: Error) => erros.push(e.message));
    await pagina.goto(`http://127.0.0.1:${porta}/testes-servidor/e2e/ficha-fae.html`);
    await pagina.waitForFunction(() => (window as any).__ok, null, { timeout: 120000 });
    for (const chave of CHAVES_FICHA_FAE) {
      const uri: string = await pagina.evaluate((c: string) => (window as any).__gerar(c), chave);
      const pdf = join(pasta, `${chave}.pdf`);
      writeFileSync(pdf, Buffer.from(uri.split(',')[1], 'base64'));
      execFileSync('pdftoppm', ['-r', '100', '-png', '-singlefile', pdf, join(pasta, chave)]);
      const b64 = readFileSync(join(pasta, `${chave}.png`)).toString('base64');
      const m: Record<string, number> = await pagina.evaluate(([b, r, md]: any) => (window as any).__medir(b, r, md), [b64, REGIOES, MODO]);
      assert.ok(m.foto > 0.12, `${chave}: foto do triturador faltando (${m.foto})`);
      assert.ok(m.logoFae > 0.1, `${chave}: logo FAE faltando (${m.logoFae})`);
      assert.ok(m.qr > 0.25, `${chave}: QR faltando (${m.qr})`);
      assert.ok(m.roder > 0.08, `${chave}: logo Roder do rodapé faltando (${m.roder})`);
      if (FICHAS_FAE[chave].dentes.some(d => d.imagem === 'rotor-bl.png')) {
        assert.ok(m.rotor > 0.1, `${chave}: imagem do rotor Bite Limiter faltando (${m.rotor})`);
      }
    }
    assert.deepEqual(erros, [], 'erro de JavaScript na página');
  } finally {
    await navegador.close();
    await servidor.close();
    rmSync(pasta, { recursive: true, force: true });
  }
});
