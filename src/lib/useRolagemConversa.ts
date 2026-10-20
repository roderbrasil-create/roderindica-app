import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

// Rolagem da conversa do consultor no celular (bug do dono, 20/10/2026: "a tela pula sozinha enquanto leio").
//
// Três regras, todas medidas no navegador (ver scratchpad/ctela):
//  1. GRUDAR NO FIM SÓ SE A PESSOA JÁ ESTÁ PERTO DO FIM. Quem subiu para ler não é puxado de volta.
//     Ao enviar uma mensagem a regra volta a valer (`grudarNoFim`).
//  2. ÂNCORA MANUAL. O Safari do iPhone não tem `overflow-anchor`. Quando algo cresce ou encolhe
//     acima do que a pessoa lê (imagem que carrega, cartão do painel ou vídeo que chega, fonte), a
//     posição de leitura é devolvida ao mesmo ponto. Medimos o primeiro elemento visível a cada
//     rolagem e, se o conteúdo mudar de altura, compensamos a diferença.
//  3. NADA DE `scrollIntoView`: ele rola também a página e a janela atrás do painel, e foi o que
//     "mexia a tela toda" no iPhone. Aqui só o contêiner da conversa rola.

const LIMIAR_PERTO_DO_FIM = 80; // px do fim ainda contados como "lendo o fim"

// Primeiro ancestral que rola na vertical
function rolavelAcima(el: HTMLElement | null): HTMLElement | null {
  let p = el?.parentElement || null;
  while (p) {
    const oy = getComputedStyle(p).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > 0) return p;
    p = p.parentElement;
  }
  return null;
}

type Ancora = { el: HTMLElement; desloc: number } | null;

// Elemento visível mais fundo que ainda cruza (ou toca) o topo da área de leitura
function acharAncora(conteudo: HTMLElement, rolavel: HTMLElement): Ancora {
  const topo = rolavel.getBoundingClientRect().top;
  let atual: HTMLElement = conteudo;
  for (let nivel = 0; nivel < 6; nivel++) {
    let achado: HTMLElement | null = null;
    for (const c of Array.from(atual.children) as HTMLElement[]) {
      const r = c.getBoundingClientRect();
      if (r.height > 0 && r.bottom > topo + 1) { achado = c; break; }
    }
    if (!achado) break;
    atual = achado;
    // só desce quando o elemento atravessa o topo: é ali que o crescimento interno o desloca
    if (achado.getBoundingClientRect().top >= topo || achado.children.length === 0) break;
  }
  if (atual === conteudo) return null;
  return { el: atual, desloc: atual.getBoundingClientRect().top - topo };
}

export function useRolagemConversa(fimRef: React.RefObject<HTMLElement | null>, chave: unknown) {
  const rolavelRef = useRef<HTMLElement | null>(null);
  const conteudoRef = useRef<HTMLElement | null>(null);
  const pertoDoFim = useRef(true);
  const ancora = useRef<Ancora>(null);
  const ocupadoAte = useRef(0); // rolagem nossa em andamento: não corrigir por cima dela
  const quadro = useRef(0);

  const medirPerto = useCallback(() => {
    const r = rolavelRef.current;
    if (!r) return;
    pertoDoFim.current = r.scrollHeight - r.scrollTop - r.clientHeight <= LIMIAR_PERTO_DO_FIM;
  }, []);

  const guardarAncora = useCallback(() => {
    const r = rolavelRef.current, c = conteudoRef.current;
    ancora.current = r && c ? acharAncora(c, r) : null;
  }, []);

  // Liga os ouvintes ao contêiner que rola e ao bloco de mensagens (muda quando a tela troca de modo)
  useLayoutEffect(() => {
    const c = fimRef.current?.parentElement || null;
    // mesmo bloco de mensagens e contêiner ainda na tela: nada a refazer neste render
    if (c === conteudoRef.current && (!c || rolavelRef.current?.isConnected)) return;
    const r = rolavelAcima(fimRef.current);
    rolavelRef.current = r;
    conteudoRef.current = c;
    if (r) {
      // sem ancoragem nativa: a nossa é a única, igual no Chrome e no Safari
      r.style.overflowAnchor = 'none';
      medirPerto();
      guardarAncora();
    }
  });

  useEffect(() => {
    const r = rolavelRef.current, c = conteudoRef.current;
    if (!r || !c) return;
    const aoRolar = () => {
      medirPerto();
      if (quadro.current) return;
      quadro.current = requestAnimationFrame(() => { quadro.current = 0; guardarAncora(); });
    };
    r.addEventListener('scroll', aoRolar, { passive: true });
    let ultimaAltura = r.scrollHeight;
    const obs = new ResizeObserver(() => {
      const altura = r.scrollHeight;
      if (altura === ultimaAltura) return;
      ultimaAltura = altura;
      if (performance.now() < ocupadoAte.current) { guardarAncora(); return; }
      if (pertoDoFim.current) {
        // lendo o fim: o fim continua à vista
        r.scrollTop = r.scrollHeight;
      } else if (ancora.current && ancora.current.el.isConnected) {
        const topo = r.getBoundingClientRect().top;
        const delta = ancora.current.el.getBoundingClientRect().top - topo - ancora.current.desloc;
        if (Math.abs(delta) >= 1) r.scrollTop += delta;
      }
      guardarAncora();
    });
    obs.observe(c);
    return () => {
      r.removeEventListener('scroll', aoRolar);
      obs.disconnect();
      if (quadro.current) { cancelAnimationFrame(quadro.current); quadro.current = 0; }
    };
  }, [chave, medirPerto, guardarAncora]);

  const rolarAoFim = useCallback((suave = false) => {
    const r = rolavelRef.current;
    if (!r) return;
    ocupadoAte.current = performance.now() + (suave ? 700 : 120);
    r.scrollTo({ top: r.scrollHeight, behavior: suave ? 'smooth' : 'auto' });
    pertoDoFim.current = true;
  }, []);

  const rolarAoElemento = useCallback((el: HTMLElement, suave = true) => {
    const r = rolavelRef.current;
    if (!r) return;
    const top = el.getBoundingClientRect().top - r.getBoundingClientRect().top + r.scrollTop;
    ocupadoAte.current = performance.now() + (suave ? 700 : 120);
    r.scrollTo({ top, behavior: suave ? 'smooth' : 'auto' });
  }, []);

  return { pertoDoFim, rolarAoFim, rolarAoElemento, rolavelRef };
}
