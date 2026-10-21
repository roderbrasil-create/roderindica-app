// Conta do zoom por pinça na ficha: o ponto (c) do conteúdo a 100% que estava sob o dedo (p, em px do quadro)
// continua sob o dedo depois de ampliar. Devolve o quanto o quadro precisa rolar.
export const rolagemParaAncorar = (c: number, zoom: number, p: number) => c * zoom - p;

// Ponto do conteúdo a 100% que está sob o ponto p do quadro, dado o zoom e a rolagem atuais
export const pontoDoConteudo = (rolagem: number, p: number, zoom: number) => (rolagem + p) / zoom;

// Zoom dentro dos limites (a 100% é a ficha ajustada à largura)
export const limitarZoom = (z: number, max: number) => Math.min(max, Math.max(1, z));
