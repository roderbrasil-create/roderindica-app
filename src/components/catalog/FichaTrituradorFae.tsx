import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { X, ShieldCheck, Download, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useVoltarFecha } from '../../lib/useVoltarFecha';
import { ZoomRolagem } from '../documento/ZoomRolagem';
import {
  carregarLogoFae, esperarImagens, pdfDasFolhas, entregarPdf, enviarArquivoPdf,
  nomeArquivoFicha, usePodeEnviarFicha,
} from './fichaPdf';
import {
  FICHAS_FAE, TITULO_FICHA_FAE, LINHA_FICHA_FAE, SUBTITULO_FICHA_FAE, NOTA_FICHA_FAE, RODAPE_FICHA_FAE,
  type ChaveFichaFae, type FichaFae,
} from '../../data/fichasTrituradorFae';

// Ficha individual (A4, uma página) dos trituradores FAE de escavadeira que a Roder vende.
// Desenha o layout aprovado em 22/10/2026 a partir de src/data/fichasTrituradorFae.ts.
// A folha é desenhada direto em 1680 x 2376 px (o dobro das outras fichas, 8 px por mm), SEM transform:
// - a captura do PDF (html-to-image) troca cada font-size por floor(tamanho) - 0,1 px, o que encolhia o texto
//   e quebrava linha diferente da tela; aqui todo font-size é inteiro e grande, então a perda some;
// - no iPhone (WebKit) imagem dentro de folha com transform sumia na captura; aqui a folha é capturada com
//   pixelRatio 1, sem escala nenhuma, e toda imagem tem largura e altura explícitas e nunca é ampliada.
// Na tela, a folha é reduzida pela metade por um envoltório (fora do elemento capturado).
const PASTA = '/fichas-fae';
export const LARGURA_FAE = 1680;
export const ALTURA_FAE = 2376;
const LARGURA_TELA = LARGURA_FAE / 2;
const ALTURA_TELA = ALTURA_FAE / 2;
const PX_MM = LARGURA_FAE / 210; // 8 px por mm
const PX_PT = (96 / 72) * (840 / (210 * 96 / 25.4)) * (LARGURA_FAE / 840); // pt do HTML aprovado, na folha de 840 px, dobrado
const mm = (n: number) => `${Math.round(n * PX_MM * 100) / 100}px`;
// converte o CSS escrito em mm e pt (como no HTML aprovado) para px da folha; font-size sempre inteiro
const emPx = (css: string) => css
  .replace(/font-size:(-?\d*\.?\d+)pt/g, (_, n) => `font-size:${Math.round(parseFloat(n) * PX_PT)}@@`)
  .replace(/(-?\d*\.?\d+)(mm|pt|px)\b/g, (_, n, u) => {
    const v = parseFloat(n);
    return `${Math.round((u === 'mm' ? v * PX_MM : u === 'pt' ? v * PX_PT : v * 2) * 100) / 100}px`;
  })
  .replace(/@@/g, 'px');

const caminhoImagem = (chave: ChaveFichaFae, arquivo: string) => `${PASTA}/${chave}/${arquivo}`;
const COMUM = { qr: `${PASTA}/comum/qr.png`, roder: `${PASTA}/comum/roder-branco.png`, fundo: `${PASTA}/comum/x-000.png` };
// largura / altura reais do rotor de cada modelo: a imagem tem as duas medidas escritas, nunca "auto"
const PROPORCAO: Record<string, number> = {
  'bl2/rotor-bl.png': 640 / 289,
  'uml-ex-vt/rotor-bl.png': 640 / 385,
  'uml-s-ex-vt/rotor-bl.png': 640 / 393,
};
const PESOS_OSWALD = [400, 500, 600, 700];
// colunas da tabela (mm): a divisória laranja fica no meio (94 + 94); o rótulo longo da direita tem folga
const COLUNAS_MM = [56, 34, 64, 34] as const;

// Tudo preso a .ffae, para não mexer em nenhuma outra tela
const CSS = emPx(`
${PESOS_OSWALD.map(p => `@font-face{font-family:Oswald;font-weight:${p};font-display:block;src:url(${PASTA}/fonts/oswald-latin-${p}-normal.woff2) format("woff2")}`).join('\n')}
.ffae,.ffae *{box-sizing:border-box;margin:0;padding:0}
.ffae{position:relative;width:210mm;height:297mm;overflow:hidden;background:#f0efed;font-family:Oswald,sans-serif;color:#111;text-rendering:geometricPrecision;font-kerning:normal;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.ffae .titulo{position:absolute;left:11mm;top:11mm;font-weight:600;font-size:29pt;line-height:1;letter-spacing:-.3pt;color:#111}
.ffae .modelo{position:absolute;left:11mm;top:24mm;font-weight:700;font-size:34pt;line-height:1;color:#ff7a00;letter-spacing:-.3pt}
.ffae .cod{position:absolute;left:11.4mm;top:38mm;font-weight:500;font-size:8pt;letter-spacing:.5pt;color:#555}
.ffae .sub{position:absolute;left:11mm;top:46mm;width:108mm;font-weight:600;font-size:12.5pt;line-height:1.25}
.ffae .desc{position:absolute;left:11mm;top:58mm;width:112mm;font-weight:400;font-size:11pt;line-height:1.42;color:#222}
.ffae .foto{position:absolute;right:8mm;top:26mm;width:76mm;height:59mm;display:flex;align-items:center;justify-content:center}
.ffae .foto img{width:100%;height:100%;object-fit:contain}
.ffae .vant{position:absolute;right:8mm;top:93mm;width:78mm}
.ffae .vant h3{color:#ff7a00;font-weight:600;font-size:10.5pt;letter-spacing:.3pt;margin-bottom:2.2mm}
.ffae .vant ul{list-style:none}
.ffae .vant li{list-style:none;position:relative;padding-left:5mm;font-size:8.8pt;line-height:1.25;color:#222}
.ffae .vant li:before{content:"";position:absolute;left:0;top:1.1mm;width:2.2mm;height:2.2mm;background:#ff7a00}
.ffae .rotor{position:absolute;left:11mm;top:86mm;width:112mm}
.ffae .rotor .fab{font-size:8.2pt;color:#333;margin:-1mm 0 2mm;line-height:1.25}
.ffae .rotor h3{font-weight:600;font-size:12pt;margin-bottom:2.4mm}
.ffae .rotor h3 span{color:#ff7a00}
.ffae .lin{display:flex;gap:4mm;align-items:center;margin-bottom:2.2mm}
.ffae .im{width:30mm;height:20mm;flex:none;display:flex;align-items:center;justify-content:center}
.ffae .im img{width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain}
.ffae .lin .tx{width:72mm}
.ffae .tx b{display:block;font-weight:600;font-size:9.6pt;margin-bottom:.8mm}
.ffae .tx b i{font-style:normal;color:#ff7a00}
.ffae .tx p{font-size:7.8pt;line-height:1.3;color:#333}
.ffae .tab{position:absolute;left:0;right:0;top:181mm}
.ffae .tab h2{position:absolute;left:11mm;top:0;font-weight:700;font-size:17pt;color:#ff7a00;letter-spacing:.2pt}
.ffae .tab table{position:absolute;left:11mm;top:10mm;width:188mm;border-collapse:collapse;font-size:9.2pt;table-layout:fixed}
.ffae .tab th{background:#000;color:#fff;font-weight:600;text-align:left;padding:2mm 3mm}
.ffae .tab td{padding:1.8mm 1mm 1.8mm 3mm;border-bottom:1px solid #dcdbd8;font-weight:400;background:#f4f3f1;white-space:nowrap}
.ffae .tab td:nth-child(1),.ffae .tab td:nth-child(3){white-space:normal}
.ffae .tab tr:nth-child(even) td{background:#e7e6e3}
.ffae .tab td:nth-child(1),.ffae .tab td:nth-child(3){color:#6b6b6b;font-weight:400}
.ffae .tab td:nth-child(2),.ffae .tab td:nth-child(4){color:#000;font-weight:700;text-align:left}
.ffae .tab td:nth-child(3){padding-left:4mm;border-left:2px solid #ff7a00}
.ffae .qr{position:absolute;left:142mm;top:164mm;width:57mm;display:flex;gap:3mm;align-items:flex-start;font-family:Arial,Helvetica,sans-serif;font-size:6.4pt;line-height:1.3;color:#444}
.ffae .qr img{width:17mm;height:17mm}
.ffae .nota{position:absolute;left:11mm;top:256mm;width:150mm;font-size:7.4pt;line-height:1.35;color:#666;font-weight:400}
.ffae .rod{position:absolute;left:0;bottom:0;width:210mm;height:34mm;background-color:#000;overflow:hidden}
.ffae .rod .fundo{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;object-position:left bottom}
.ffae .rod:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.35),rgba(0,0,0,.88) 70%)}
.ffae .rod .f{position:absolute;left:11mm;top:11mm;color:#fff;font-weight:600;font-size:15pt;z-index:2;max-width:92mm;line-height:1.15}
.ffae .rod .l{position:absolute;right:11mm;top:6.5mm;z-index:2;display:flex;align-items:center;gap:6mm}
.ffae .rod .l img.r{height:14.5mm;width:66.18mm}
.ffae .logofae{position:absolute;right:8mm;top:6mm;height:18mm;width:19.35mm;border-radius:1.5mm}
`);

interface FolhaProps {
  ficha: FichaFae;
  logoFae: string | null;
  // troca o endereço de cada imagem (o PDF usa cópias já carregadas em memória)
  resolver?: (caminho: string) => string;
}

// A folha em si, 1680 x 2376 px. Sem hooks de contexto: também é desenhada fora da tela para gerar o PDF.
export const FolhaFichaFae = React.forwardRef<HTMLDivElement, FolhaProps>(({ ficha, logoFae, resolver }, ref) => {
  const src = (c: string) => (resolver ? resolver(c) : c);
  return (
    <div ref={ref} className="ffae" data-ficha-fae={ficha.chave}>
      <style>{CSS}</style>
      <div style={{ display: 'contents' }}>
        <div className="titulo">{TITULO_FICHA_FAE}</div>
        <div className="modelo">{ficha.nome}</div>
        <div className="cod">{LINHA_FICHA_FAE}</div>
        <div className="sub">{SUBTITULO_FICHA_FAE}</div>
        <div className="desc">{ficha.descricao}</div>

        {logoFae && <img className="logofae" src={logoFae} alt="FAE" />}
        <div className="foto"><img src={src(caminhoImagem(ficha.chave, 'foto.jpg'))} alt={ficha.nome} /></div>

        <div className="rotor">
          <h3>Qual <span>dente</span> usar</h3>
          <div className="fab">{ficha.introDentes}</div>
          {ficha.dentes.map(d => (
            <div className="lin" key={d.imagem}>
              <div className="im">
                <img src={src(caminhoImagem(ficha.chave, d.imagem))} alt={d.titulo} style={d.larguraMm ? { maxWidth: 'none', maxHeight: 'none', width: mm(d.larguraMm), height: mm(d.larguraMm / (PROPORCAO[`${ficha.chave}/${d.imagem}`] || 2)), flex: 'none', objectFit: 'fill' } : undefined} />
              </div>
              <div className="tx"><b>{d.titulo}{d.destaque ? <> <i>{d.destaque}</i></> : null}</b><p>{d.texto}</p></div>
            </div>
          ))}
        </div>

        <div className="vant">
          <h3>VANTAGENS RODER</h3>
          <ul>{ficha.vantagens.map(v => <li key={v} style={{ marginBottom: mm(ficha.espacoVantagensMm) }}>{v}</li>)}</ul>
        </div>

        <div className="tab">
          <h2>MODELO E CARACTERÍSTICA TÉCNICA</h2>
          <table>
            <colgroup><col style={{ width: mm(COLUNAS_MM[0]) }} /><col style={{ width: mm(COLUNAS_MM[1]) }} /><col style={{ width: mm(COLUNAS_MM[2]) }} /><col style={{ width: mm(COLUNAS_MM[3]) }} /></colgroup>
            <tbody>
              <tr><th colSpan={4}>ESPECIFICAÇÃO <span style={{ float: 'right' }}>{ficha.codigoTabela}</span></th></tr>
              {ficha.linhas.map(l => (
                <tr key={l.celulas[0]}>
                  {l.celulas.length === 4
                    ? l.celulas.map((c, i) => <td key={i}>{c}</td>)
                    : <><td>{l.celulas[0]}</td><td colSpan={3}>{l.celulas[1]}</td></>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="qr"><img src={src(COMUM.qr)} alt="" /><div>Acesse<br />e conheça nossa<br />linha completa.</div></div>
        <div className="nota">{NOTA_FICHA_FAE}</div>

        <div className="rod">
          <img className="fundo" src={src(COMUM.fundo)} alt="" />
          <div className="f">{RODAPE_FICHA_FAE}</div>
          <div className="l"><img className="r" src={src(COMUM.roder)} alt="Roder" /></div>
        </div>
      </div>
    </div>
  );
});
FolhaFichaFae.displayName = 'FolhaFichaFae';

const todasAsImagens = (ficha: FichaFae) => [
  caminhoImagem(ficha.chave, 'foto.jpg'),
  ...ficha.dentes.map(d => caminhoImagem(ficha.chave, d.imagem)),
  COMUM.qr, COMUM.roder, COMUM.fundo,
];

const comoDataUrl = (blob: Blob) => new Promise<string>((ok, erro) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result));
  r.onerror = () => erro(r.error);
  r.readAsDataURL(blob);
});

// Passa a imagem por um canvas: sai sempre como um bitmap simples, já decodificado e no tamanho de uso.
// Foto grande e PNG com perfil de cor estranho são o que o Safari costuma largar dentro da captura.
async function recodificar(dataUrl: string, ladoMax: number, tipo: 'image/png' | 'image/jpeg'): Promise<string> {
  try {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const f = Math.min(1, ladoMax / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.naturalWidth * f));
    c.height = Math.max(1, Math.round(img.naturalHeight * f));
    const ctx = c.getContext('2d');
    if (!ctx) return dataUrl;
    if (tipo === 'image/jpeg') { ctx.fillStyle = '#f0efed'; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const saida = c.toDataURL(tipo, 0.92);
    return saida.startsWith('data:image') ? saida : dataUrl;
  } catch { return dataUrl; }
}

// Imagens pequenas e já em memória: a captura do PDF não depende de buscar arquivo no meio do caminho
// (no iPhone a primeira captura saía sem as imagens que ainda não tinham decodificado).
async function imagensEmMemoria(ficha: FichaFae): Promise<Record<string, string>> {
  const mapa: Record<string, string> = {};
  await Promise.all(todasAsImagens(ficha).map(async c => {
    try {
      const r = await fetch(c);
      if (!r.ok) throw new Error(String(r.status));
      const url = await comoDataUrl(await r.blob());
      mapa[c] = c.endsWith('foto.jpg') ? await recodificar(url, 760, 'image/jpeg')
        : c === COMUM.roder ? await recodificar(url, 640, 'image/png') : url;
    } catch { /* sem a cópia, a folha usa o endereço normal */ }
  }));
  return mapa;
}

// Nome das imagens da folha que não estão carregadas de verdade (o teste e a geração do PDF cobram vazio)
export function imagensNaoCarregadas(folha: HTMLElement): string[] {
  return (Array.from(folha.getElementsByTagName('img')) as HTMLImageElement[])
    .filter(i => !i.complete || i.naturalWidth === 0)
    .map(i => (i.getAttribute('alt') || i.className || 'imagem') + '');
}

async function esperarFontes() {
  try {
    await Promise.all(PESOS_OSWALD.map(p => (document as any).fonts?.load(`${p} 16px Oswald`)));
    await (document as any).fonts?.ready;
  } catch { /* sem API de fontes */ }
}

export async function gerarFichaFaePdf(chave: ChaveFichaFae) {
  const ficha = FICHAS_FAE[chave];
  const [logoFae, mapa] = await Promise.all([carregarLogoFae(), imagensEmMemoria(ficha)]);
  const caixa = document.createElement('div');
  caixa.setAttribute('aria-hidden', 'true');
  caixa.style.cssText = `position:fixed;left:-10000px;top:0;width:${LARGURA_FAE}px;pointer-events:none;`;
  document.body.appendChild(caixa);
  const raiz = createRoot(caixa);
  try {
    let folha: HTMLDivElement | null = null;
    await new Promise<void>(ok => {
      raiz.render(<FolhaFichaFae ref={el => { folha = el; if (el) ok(); }} ficha={ficha} logoFae={logoFae} resolver={c => mapa[c] || c} />);
    });
    await esperarFontes();
    await esperarImagens(folha!);
    const faltam = imagensNaoCarregadas(folha!);
    if (faltam.length) throw new Error(`Imagens da ficha sem carregar: ${faltam.join(', ')}`);
    return await pdfDasFolhas([folha!], { largura: LARGURA_FAE, pixelRatio: 1, aquecimentos: 2, fundo: '#f0efed' });
  } finally {
    raiz.unmount();
    caixa.remove();
  }
}

export const tituloPdfFichaFae = (chave: ChaveFichaFae) => `Ficha técnica ${FICHAS_FAE[chave].nome}`;

// "Enviar ficha" de fora da tela: gera e abre o compartilhar (ou baixa e abre o WhatsApp Web)
export async function enviarFichaFae(chave: ChaveFichaFae) {
  const id = toast.loading('Gerando a ficha em PDF...');
  try {
    const pdf = await gerarFichaFaePdf(chave);
    toast.dismiss(id);
    await enviarArquivoPdf(pdf.output('blob'), nomeArquivoFicha(FICHAS_FAE[chave].nome), tituloPdfFichaFae(chave));
  } catch (e) {
    console.error('Erro ao gerar a ficha individual FAE:', e);
    toast.error('Não consegui gerar o PDF. Tente de novo.', { id });
  }
}

interface FichaFaeProps {
  chave: ChaveFichaFae;
  onClose: () => void;
  // aberta pelo "Enviar ficha": destaca o botão Enviar
  enviar?: boolean;
}

export function FichaTrituradorFae({ chave, onClose, enviar = false }: FichaFaeProps) {
  useVoltarFecha(true, onClose);
  const podeEnviar = usePodeEnviarFicha();
  const ficha = FICHAS_FAE[chave];
  const wrapperRef = useRef<HTMLDivElement>(null);
  const folhaRef = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);
  const [logoFae, setLogoFae] = useState<string | null>(null);
  const [gerando, setGerando] = useState<null | 'baixar' | 'enviar'>(null);

  useEffect(() => { carregarLogoFae().then(setLogoFae); }, []);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  useEffect(() => {
    const medir = () => {
      if (!wrapperRef.current) return;
      const disponivel = wrapperRef.current.clientWidth - (window.innerWidth < 640 ? 16 : 32);
      setEscala(disponivel < LARGURA_TELA ? disponivel / LARGURA_TELA : 1);
    };
    medir();
    const obs = new ResizeObserver(medir);
    if (wrapperRef.current) obs.observe(wrapperRef.current);
    window.addEventListener('resize', medir);
    return () => { obs.disconnect(); window.removeEventListener('resize', medir); };
  }, [chave]);

  const gerar = async (modo: 'baixar' | 'enviar') => {
    if (gerando) return;
    setGerando(modo);
    const id = toast.loading('Gerando a ficha em PDF...');
    try {
      const pdf = await gerarFichaFaePdf(chave);
      toast.dismiss(id);
      await entregarPdf(pdf, nomeArquivoFicha(ficha.nome), modo, tituloPdfFichaFae(chave));
      if (modo === 'baixar') toast.success('PDF baixado.');
    } catch (e) {
      console.error('Erro ao gerar a ficha individual FAE:', e);
      toast.error('Não consegui gerar o PDF. Tente de novo.', { id });
    } finally {
      setGerando(null);
    }
  };

  return (
    <div style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0.5rem)' }} className="fixed inset-0 z-[99999] overflow-hidden bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="bg-card text-card-foreground w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col h-[96vh]">
        <div className="bg-muted px-3 sm:px-6 py-3 flex items-center justify-between gap-2 border-b border-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded-lg bg-amber-400/15 text-amber-600 shrink-0"><ShieldCheck className="h-5 w-5" /></span>
            <span className="font-extrabold text-sm tracking-tight text-foreground truncate">Ficha técnica · {ficha.nome}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {podeEnviar && (
              <>
                <button
                  onClick={() => gerar('baixar')}
                  disabled={!!gerando}
                  className="flex items-center gap-1.5 h-11 min-h-[44px] min-w-[44px] px-3 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-black text-xs disabled:opacity-60"
                >
                  {gerando === 'baixar' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">Salvar PDF</span>
                </button>
                <button
                  onClick={() => gerar('enviar')}
                  disabled={!!gerando}
                  className={`flex items-center gap-1.5 h-11 min-h-[44px] px-3 rounded-lg bg-[#1FA855] hover:bg-[#178a45] text-white font-black text-xs disabled:opacity-60 ${enviar ? 'ring-2 ring-offset-2 ring-[#1FA855] animate-pulse' : ''}`}
                >
                  {gerando === 'enviar' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Enviar
                </button>
              </>
            )}
            <button onClick={onClose} aria-label="Fechar" className="h-11 w-11 min-h-[44px] min-w-[44px] p-0 shrink-0 flex items-center justify-center rounded-lg hover:bg-muted-foreground/10 text-muted-foreground">
              <X className="h-5 w-5 shrink-0" />
            </button>
          </div>
        </div>

        <ZoomRolagem
          className="flex-1 min-h-0 bg-neutral-100"
          interiorRef={wrapperRef}
          interiorClassName="p-2 sm:p-8 flex flex-col items-center"
          reiniciarCom={chave}
        >
          <div className="w-full flex justify-center" style={{ height: `${ALTURA_TELA * escala}px` }}>
            <div style={{ width: `${LARGURA_TELA}px`, minWidth: `${LARGURA_TELA}px`, transform: `scale(${escala})`, transformOrigin: 'top center' }}>
              {/* a folha tem o dobro do tamanho da tela: a redução pela metade fica aqui, fora do que é capturado */}
              <div style={{ width: `${LARGURA_TELA}px`, height: `${ALTURA_TELA}px`, overflow: 'hidden' }}>
                <div style={{ width: `${LARGURA_FAE}px`, height: `${ALTURA_FAE}px`, transform: 'scale(0.5)', transformOrigin: 'top left' }}>
                  <FolhaFichaFae ref={folhaRef} ficha={ficha} logoFae={logoFae} />
                </div>
              </div>
            </div>
          </div>
        </ZoomRolagem>
      </div>
    </div>
  );
}
