// Duração e capa de um vídeo escolhido no celular, tiradas ali mesmo (antes de subir).
// Depois de subir não dá: o Storage não libera CORS e o quadro desenhado no canvas fica "sujo"
// (o navegador não deixa exportar). Se o celular não consegue abrir o arquivo, volta sem capa.
export async function lerVideoLocal(arquivo: File, tempoMs = 15000): Promise<{ duracao: number; capa: Blob | null }> {
  if (typeof document === 'undefined') return { duracao: 0, capa: null };
  const url = URL.createObjectURL(arquivo);
  const v = document.createElement('video');
  v.muted = true;
  v.playsInline = true;
  v.preload = 'auto';
  v.src = url;
  const limpar = () => { try { v.removeAttribute('src'); v.load(); } catch { /* nada */ } URL.revokeObjectURL(url); };
  let duracao = 0;
  try {
    duracao = await new Promise<number>((ok, falha) => {
      const t = setTimeout(() => falha(new Error('tempo')), tempoMs);
      v.onloadedmetadata = () => { clearTimeout(t); ok(Number.isFinite(v.duration) ? v.duration : 0); };
      v.onerror = () => { clearTimeout(t); falha(new Error('não abriu')); };
    });
    // um pouco depois do começo: o primeiro quadro costuma ser preto
    const alvo = duracao > 0 ? Math.min(1.5, duracao * 0.2) : 0.1;
    await new Promise<void>((ok, falha) => {
      const t = setTimeout(() => falha(new Error('tempo')), tempoMs);
      v.onseeked = () => { clearTimeout(t); ok(); };
      v.currentTime = alvo;
    });
    const larg = Math.min(640, v.videoWidth || 640);
    const alt = Math.round(larg * ((v.videoHeight || 360) / (v.videoWidth || 640)));
    const c = document.createElement('canvas');
    c.width = larg;
    c.height = alt;
    const ctx = c.getContext('2d');
    if (!ctx) return { duracao, capa: null };
    ctx.drawImage(v, 0, 0, larg, alt);
    const capa = await new Promise<Blob | null>(ok => c.toBlob(b => ok(b), 'image/jpeg', 0.8));
    return { duracao, capa };
  } catch {
    return { duracao, capa: null };
  } finally {
    limpar();
  }
}
