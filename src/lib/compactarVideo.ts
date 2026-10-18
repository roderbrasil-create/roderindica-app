// Compacta o vídeo NO CELULAR antes de enviar: vira MP4 (H.264) com no máximo 1280 px no
// lado maior, ~2,5 Mbit/s. Um minuto gravado no iPhone (100 a 350 MB) cai para uns 20 MB,
// com qualidade boa na tela do celular. O MP4 também toca em qualquer aparelho; o .mov do
// iPhone (HEVC) não toca em vários Android.
// Celular que não consegue compactar (navegador antigo) envia o original, como antes.
// A biblioteca só é baixada quando alguém escolhe um vídeo: não pesa na abertura do app.

const LADO_MAIOR = 1280;
const TAXA_VIDEO = 2_500_000;

export type ResultadoCompactacao = { arquivo: File; compactou: boolean; motivo?: string };

export async function compactarVideo(
  original: File,
  aoProgredir: (fracao: number) => void,
  registrarCancelar: (cancelar: () => void) => void,
): Promise<ResultadoCompactacao> {
  const semCompactar = (motivo: string): ResultadoCompactacao => ({ arquivo: original, compactou: false, motivo });
  if (typeof (window as any).VideoEncoder === 'undefined') return semCompactar('navegador sem compactação');
  // já é pequeno e já é MP4: não vale o trabalho
  if (original.size < 12 * 1024 * 1024 && /mp4$/i.test(original.type || original.name)) return semCompactar('já é pequeno');

  // arquivo próprio em /libs (como o pdf.js): fora do pacote principal do app, que ficaria 700 KB maior
  const mb: any = await import(/* @vite-ignore */ `${window.location.origin}/libs/mediabunny-1.60.0.min.mjs`);
  const entrada = new mb.Input({ source: new mb.BlobSource(original), formats: mb.ALL_FORMATS });
  try {
    const trilha = await entrada.getPrimaryVideoTrack();
    if (!trilha) return semCompactar('sem trilha de vídeo');
    const largura = trilha.displayWidth;
    const altura = trilha.displayHeight;
    const deitado = largura >= altura;
    const maior = Math.max(largura, altura);
    const escala = maior > LADO_MAIOR ? LADO_MAIOR / maior : 1;
    // H.264 pede medidas pares
    const par = (n: number) => Math.max(2, Math.round(n / 2) * 2);
    const w = par(largura * escala);
    const h = par(altura * escala);
    if (!(await mb.canEncodeVideo('avc', { width: w, height: h, bitrate: TAXA_VIDEO }))) return semCompactar('celular não codifica H.264');

    const saida = new mb.Output({ format: new mb.Mp4OutputFormat({ fastStart: 'in-memory' }), target: new mb.BufferTarget() });
    const conversao = await mb.Conversion.init({
      input: entrada,
      output: saida,
      tracks: 'primary',
      showWarnings: false,
      video: {
        ...(deitado ? { width: w } : { height: h }),
        codec: 'avc',
        bitrate: TAXA_VIDEO,
        frameRate: 30,
        forceTranscode: true,
        hardwareAcceleration: 'prefer-hardware', // chip de vídeo do celular: bem mais rápido
      },
      // áudio do iPhone (AAC) é copiado como está; outro formato vira AAC
      audio: { codec: 'aac' },
    });
    if (!conversao.isValid) return semCompactar('formato não suportado');
    registrarCancelar(() => { conversao.cancel(); });
    conversao.onProgress = (p: number) => aoProgredir(Math.min(1, Math.max(0, p)));
    await conversao.execute();

    const buffer = (saida.target as any).buffer as ArrayBuffer | null;
    if (!buffer || buffer.byteLength < 1000) return semCompactar('saída vazia');
    // compactar não adiantou: manda o original
    if (buffer.byteLength >= original.size * 0.9) return semCompactar('não ficou menor');
    const nome = original.name.replace(/\.[a-z0-9]+$/i, '') + '.mp4';
    return { arquivo: new File([buffer], nome, { type: 'video/mp4' }), compactou: true };
  } finally {
    try { (entrada as any).dispose?.(); } catch { /* nada */ }
  }
}
