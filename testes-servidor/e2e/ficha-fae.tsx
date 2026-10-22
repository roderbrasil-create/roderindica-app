// Página mínima do teste e2e da ficha individual FAE (testes-servidor/ficha-fae-pdf-e2e.test.ts).
// Expõe os dois caminhos reais: o PDF (gerarFichaFaePdf, o mesmo de "Salvar PDF" e "Enviar") e a medição de regiões.
import { gerarFichaFaePdf } from '../../src/components/catalog/FichaTrituradorFae';

const w = window as any;
w.__gerar = async (chave: string) => (await gerarFichaFaePdf(chave as any)).output('datauristring');

// fração de pixels que diferem do fundo da região (canto superior esquerdo), numa imagem PNG em base64
w.__medir = async (b64: string, regioes: Record<string, [number, number, number, number]>, modo: Record<string, string>) => {
  const img = new Image();
  img.src = `data:image/png;base64,${b64}`;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const saida: Record<string, number> = {};
  for (const [nome, [x, y, l, a]] of Object.entries(regioes)) {
    const px = ctx.getImageData(Math.round(x * c.width), Math.round(y * c.height), Math.max(1, Math.round(l * c.width)), Math.max(1, Math.round(a * c.height))).data;
    let n = 0, tot = px.length / 4;
    const bg = [px[0], px[1], px[2]];
    for (let i = 0; i < px.length; i += 4) {
      if (modo[nome] === 'claro') { if (px[i] > 200 && px[i + 1] > 200 && px[i + 2] > 200) n++; }
      else if (Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2]) > 90) n++;
    }
    saida[nome] = n / tot;
  }
  return saida;
};
w.__ok = true;
