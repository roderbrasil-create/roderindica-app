// Vídeo do equipamento (pedido do Jeferson em 19/10/2026): ainda não há biblioteca de vídeos,
// então vale o vídeo já cadastrado no catálogo (video_url do modelo ou do produto) e, sem ele,
// o mapa fixo PRODUCT_VIDEOS por nome. Usado no Consultor (pronta entrega, folha, aviso e cartão
// da conversa) e na página pública de orçamento, para os dois mostrarem o mesmo vídeo.
// Sem dependência do navegador: o teste do servidor importa este arquivo.

export const PRODUCT_VIDEOS: Record<string, string> = {
  "CMF 600": "https://www.youtube.com/watch?v=0_u6eJ6-YnQ",
  "CMF 500": "https://www.youtube.com/watch?v=Aof_7Q-fS1s",
  "CMF 800": "https://www.youtube.com/watch?v=t5A9Tj_C9n4",
  "GPR 4500": "https://www.youtube.com/watch?v=W0ybyuB9gB0",
  "GPR 7000": "https://www.youtube.com/watch?v=W0ybyuB9gB0",
  "R250": "https://www.youtube.com/watch?v=Kzqi_Cn2WG4",
  "R280": "https://www.youtube.com/watch?v=Kzqi_Cn2WG4",
  "R360": "https://www.youtube.com/watch?v=Kzqi_Cn2WG4",
  "R360G": "https://www.youtube.com/watch?v=Kzqi_Cn2WG4",
  "R400": "https://www.youtube.com/watch?v=Kzqi_Cn2WG4",
  "R600": "https://www.youtube.com/watch?v=Kzqi_Cn2WG4",
  "R800": "https://www.youtube.com/watch?v=Kzqi_Cn2WG4",
  "Mini Skidder": "https://youtu.be/OE0bsl5FlRw",
  "MSR 600": "https://youtu.be/OE0bsl5FlRw",
  "MSR 1000": "https://youtu.be/OE0bsl5FlRw",
  "Garra Frontal": "https://youtu.be/tlp3Grju-LM",
  "Garra para Estufagem": "https://youtu.be/tlp3Grju-LM",
  "AF400": "https://youtu.be/tlp3Grju-LM",
  "AF 400": "https://youtu.be/tlp3Grju-LM",
  "AF - 400": "https://youtu.be/tlp3Grju-LM",
  "SSH 150": "https://www.youtube.com/watch?v=na5Z2tLWMgA",
  "SSH 200": "https://www.youtube.com/watch?v=na5Z2tLWMgA",
  "SSH 225": "https://www.youtube.com/watch?v=na5Z2tLWMgA",
  "SSH 250": "https://www.youtube.com/watch?v=na5Z2tLWMgA",
  "SSH-150": "https://www.youtube.com/watch?v=na5Z2tLWMgA",
  "SSH-200": "https://www.youtube.com/watch?v=na5Z2tLWMgA",
  "SSH-225": "https://www.youtube.com/watch?v=na5Z2tLWMgA",
  "SSH-250": "https://www.youtube.com/watch?v=na5Z2tLWMgA"
};

// vídeo antigo que saiu do ar e continua gravado em alguns modelos
const VIDEOS_MORTOS = ['t_8n_nlf2xk'];

export function videoValido(url: any): string {
  const v = String(url || '').trim();
  if (!v) return '';
  if (!/^https?:\/\//i.test(v) && !/^db-file:\/\/[A-Za-z0-9_-]+$/.test(v)) return '';
  if (VIDEOS_MORTOS.some(m => v.toLowerCase().includes(m))) return '';
  // página do site da Roder (ex.: a da Garra Frontal) não é vídeo: tocaria como arquivo quebrado
  if (/^https?:\/\/(www\.)?roderbrasil\.com\.br\/(?!.*\.(mp4|webm|mov)(\?|$))/i.test(v)) return '';
  return v;
}

// O Mini Skidder nasceu no cadastro com o vídeo da garra florestal (erro de 2026) e esse endereço
// ficou gravado no produto. Enquanto o cadastro não for corrigido, esse vídeo nunca vale para ele.
const VIDEO_GARRA = 'Kzqi_Cn2WG4';
const ehSkidder = (nome: any) => /skidder|^msr\b/i.test(String(nome || ''));
const semVideoErrado = (url: any, prod: any, model: any) =>
  String(url || '').includes(VIDEO_GARRA) && (ehSkidder(prod?.name) || ehSkidder(model?.name)) ? '' : url;

export function videoDoEquipamento(prod: any, model: any): string {
  return videoValido(semVideoErrado(model?.video_url, prod, model)) || videoValido(semVideoErrado(prod?.video_url, prod, model))
    || videoValido(PRODUCT_VIDEOS[String(model?.name || '')]) || videoValido(PRODUCT_VIDEOS[String(prod?.name || '')]);
}

// youtube.com/watch?v=, youtu.be/, /shorts/, /embed/ e /live/
export function idYoutube(url: string): string {
  const u = String(url || '');
  if (!/(youtube\.com|youtube-nocookie\.com|youtu\.be)/i.test(u)) return '';
  const m = u.match(/[?&]v=([A-Za-z0-9_-]{6,20})/) || u.match(/youtu\.be\/([A-Za-z0-9_-]{6,20})/) || u.match(/\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{6,20})/);
  return m ? m[1] : '';
}

export function ehYoutube(url: string): boolean { return !!idYoutube(url); }

// O player só existe depois do toque, então o autoplay aqui não gasta dado de ninguém
export function urlEmbedYoutube(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;
}

// Como tocar dentro do cartão: iframe (YouTube, Vimeo, Drive) ou <video> (arquivo do Storage,
// do banco ou mp4 direto). 'arquivo' é o único que dá para baixar e mandar como vídeo.
export type ComoTocar = { tipo: 'iframe'; src: string; youtube: boolean } | { tipo: 'arquivo'; src: string };
export function comoTocar(url: string): ComoTocar | null {
  const v = videoValido(url);
  if (!v) return null;
  const yt = idYoutube(v);
  if (yt) return { tipo: 'iframe', src: urlEmbedYoutube(yt), youtube: true };
  const vimeo = v.match(/vimeo\.com\/(?:video\/)?(\d{5,})/i);
  if (vimeo) return { tipo: 'iframe', src: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1&playsinline=1`, youtube: false };
  const drive = v.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=)([\w-]{10,})/i);
  if (drive) return { tipo: 'iframe', src: `https://drive.google.com/file/d/${drive[1]}/preview`, youtube: false };
  return { tipo: 'arquivo', src: v };
}

export function textoVideoWhats(equipamento: string, link: string): string {
  return `Olha o ${equipamento} da Roder trabalhando. Veja o vídeo e peça o orçamento direto com a Roder: ${link}`;
}

// Arquivo maior que isto não é baixado para mandar como vídeo: vai o link
export const LIMITE_VIDEO_ARQUIVO_MB = 40;
