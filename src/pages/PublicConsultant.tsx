import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getApiBaseUrl } from '../lib/utils';
import { CHAVE_PARCEIRO_LINK, TOKEN_LINK_VALIDO } from '../lib/consultorIndicar';
import EngineerHelper from '../components/layout/EngineerHelper';
import { useManifestoConsultor } from '../lib/useManifestoConsultor';
import { useAuth } from '../contexts/AuthContext';

// Helper function to programmatically draw a beautiful custom black square icon
function generateConsultantIcon(): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background: Solid premium black square
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle border highlight (like a luxury application icon)
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, 500, 500);

  // Setup text alignments
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 1. Draw "CONSULTOR" (Top Text)
  ctx.fillStyle = '#ffffff';
  ctx.font = '500 44px "Inter", "Helvetica Neue", sans-serif';
  ctx.fillText('CONSULTOR', 256, 170);

  // 2. Draw "RODER" (Middle Text - Extra Bold/Black)
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 110px "Inter", "Montserrat", "Arial Black", sans-serif';
  ctx.fillText('RODER', 256, 265);

  // 3. Draw "TÉCNICO" (Bottom Text - Bold)
  ctx.fillStyle = '#f59e0b'; // Amber highlight for Técnico to match the bubble style
  ctx.font = '700 44px "Inter", "Helvetica Neue", sans-serif';
  ctx.fillText('TÉCNICO', 256, 360);

  // 4. Draw the "IA" Badge in the corner (rounded rect + text)
  const bx = 370;
  const by = 50;
  const bw = 85;
  const bh = 42;
  const br = 8; // radius

  // Draw rounded rect
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(bx + br, by);
  ctx.lineTo(bx + bw - br, by);
  ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
  ctx.lineTo(bx + bw, by + bh - br);
  ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
  ctx.lineTo(bx + br, by + bh);
  ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
  ctx.lineTo(bx, by + br);
  ctx.quadraticCurveTo(bx, by, bx + br, by);
  ctx.closePath();
  ctx.fill();

  // Draw "IA" text inside badge
  ctx.fillStyle = '#000000';
  ctx.font = '900 24px "Inter", sans-serif';
  ctx.fillText('IA', bx + bw / 2, by + bh / 2 + 1);

  return canvas.toDataURL('image/png');
}

// Link pessoal do parceiro (/consultor?p=<token>): o servidor diz de quem é o link. O token fica
// guardado no aparelho, então reabrir /consultor ou o app instalado continua sabendo quem é.
// O token novo é guardado ANTES de perguntar ao servidor (com "pendente"), porque a barra de
// endereço é limpa na hora: se a internet cair no primeiro acesso, o link não se perde e a
// conferência é refeita na próxima abertura. Enquanto pendente, o consultor segue como visitante.
// Só um 404 (link desligado ou trocado: gerar novo desliga o antigo) apaga a identidade guardada.
type ParceiroGuardado = { token: string; nome?: string; primeiroNome?: string; pendente?: boolean };
function lerParceiroGuardado(): ParceiroGuardado | null {
  try {
    const p = JSON.parse(localStorage.getItem(CHAVE_PARCEIRO_LINK) || 'null');
    return p && TOKEN_LINK_VALIDO.test(String(p.token || '')) ? p : null;
  } catch { return null; }
}
function guardarParceiro(p: ParceiroGuardado) {
  try { localStorage.setItem(CHAVE_PARCEIRO_LINK, JSON.stringify(p)); } catch { /* navegador sem armazenamento */ }
}

function useParceiroDoLink(tokenUrl: string | null) {
  const [pronto, setPronto] = useState(() => !tokenUrl && !lerParceiroGuardado());
  useEffect(() => {
    const anterior = lerParceiroGuardado();
    const tokenNovo = tokenUrl && TOKEN_LINK_VALIDO.test(tokenUrl) ? tokenUrl : null;
    if (tokenNovo && anterior?.token !== tokenNovo) {
      // guarda primeiro: a barra de endereço é limpa logo abaixo
      guardarParceiro({ token: tokenNovo, pendente: true });
    }
    if (tokenUrl) {
      // o token não fica na barra de endereço (nem no histórico de quem pegar o celular)
      try { const u = new URL(window.location.href); u.searchParams.delete('p'); window.history.replaceState(window.history.state, '', u.pathname + u.search + u.hash); } catch { /* segue */ }
    }
    const guardado = lerParceiroGuardado();
    const token = tokenNovo || guardado?.token;
    if (!token) { setPronto(true); return; }
    const ctl = new AbortController();
    let vivo = true;
    const espera = setTimeout(() => ctl.abort(), 5000);
    fetch(`${getApiBaseUrl()}/api/consultor/parceiro/${encodeURIComponent(token)}`, { signal: ctl.signal })
      .then(async r => {
        if (r.status === 404) {
          // resposta definitiva: só apaga se ainda for o mesmo token guardado
          try { if (lerParceiroGuardado()?.token === token) localStorage.removeItem(CHAVE_PARCEIRO_LINK); } catch { /* sem armazenamento */ }
          if (vivo) toast.error('Este link do consultor não vale mais. Peça um novo ao comercial da Roder.');
          return;
        }
        if (!r.ok) return; // servidor fora ou erro: mantém o guardado (pendente tenta de novo na próxima abertura)
        const j = await r.json();
        const atual = lerParceiroGuardado();
        if (atual && atual.token !== token) return; // outro link chegou no meio do caminho
        if (!atual || atual.pendente) {
          // outro parceiro ou primeiro acesso: começa uma conversa nova, sem o "Quem é você?"
          try {
            sessionStorage.removeItem('roder_helper_messages');
            sessionStorage.removeItem('roder_helper_fluxo_ind');
          } catch { /* sem armazenamento */ }
        }
        guardarParceiro({ token, nome: j.nome || '', primeiroNome: j.primeiroNome || '' });
      })
      .catch(() => { /* sem internet ou demorou: segue com o que estava guardado e tenta na próxima */ })
      .finally(() => { clearTimeout(espera); if (vivo) setPronto(true); });
    return () => { vivo = false; clearTimeout(espera); ctl.abort(); };
  }, [tokenUrl]);
  return pronto;
}

export default function PublicConsultant() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref');
  const parceiroPronto = useParceiroDoLink(searchParams.get('p'));
  // Logado no Roder Indica (mesmo navegador): o consultor usa o papel da pessoa (equipe ou parceiro)
  // e não pergunta "Quem é você?". Espera o login ser lido para não piscar a pergunta.
  const { loading } = useAuth();
  let talvezLogado = false;
  try { talvezLogado = !!localStorage.getItem('roder_profile_cache'); } catch { /* sem armazenamento */ }
  const carregandoLogin = loading && talvezLogado;
  useManifestoConsultor();

  useEffect(() => {
    // Store original page metadata to restore on unmount
    let originalAppleTouchIcon = '';
    const appleTouchIconEl = document.querySelector('link[rel="apple-touch-icon"]');
    if (appleTouchIconEl) {
      originalAppleTouchIcon = appleTouchIconEl.getAttribute('href') || '';
    }

    let originalFavicon = '';
    const faviconEl = document.querySelector('link[rel="icon"]');
    if (faviconEl) {
      originalFavicon = faviconEl.getAttribute('href') || '';
    }

    let originalAppleTitle = '';
    const appleTitleEl = document.getElementById('apple-app-title');
    if (appleTitleEl) {
      originalAppleTitle = appleTitleEl.getAttribute('content') || '';
    }

    // Generate our high-fidelity, custom-styled full-black-square icon
    const iconDataUrl = generateConsultantIcon();

    // 1. Set Custom Apple Touch Icon
    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
    if (appleTouchIcon) {
      appleTouchIcon.setAttribute('href', iconDataUrl);
    } else {
      const newAppleTouchIcon = document.createElement('link');
      newAppleTouchIcon.rel = 'apple-touch-icon';
      newAppleTouchIcon.href = iconDataUrl;
      document.head.appendChild(newAppleTouchIcon);
    }

    // Set Favicon
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.setAttribute('href', iconDataUrl);
    }

    // 2. Manifesto e título: useManifestoConsultor (public/consultor.webmanifest, "Consultor Roder")

    // 3. Set the apple-mobile-web-app-title tag to keep the icon name on iOS
    let meta = document.getElementById('apple-app-title') as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.id = 'apple-app-title';
      meta.name = 'apple-mobile-web-app-title';
      document.getElementsByTagName('head')[0].appendChild(meta);
    }
    meta.setAttribute('content', "Consultor Técnico Roder");

    // Store referral salesperson in localStorage if provided in the URL
    if (ref) {
      localStorage.setItem('roder_consultant_ref', ref);
      console.log("[PUBLIC_CONSULTANT] Referral detected and saved:", ref);
    }

    return () => {
      // Clean up and restore original site metadata on unmount
      
      const touchIcon = document.querySelector('link[rel="apple-touch-icon"]');
      if (touchIcon && originalAppleTouchIcon) {
        touchIcon.setAttribute('href', originalAppleTouchIcon);
      }
      
      const fav = document.querySelector('link[rel="icon"]');
      if (fav && originalFavicon) {
        fav.setAttribute('href', originalFavicon);
      }

      const appTitle = document.getElementById('apple-app-title');
      if (appTitle) {
        if (originalAppleTitle) {
          appTitle.setAttribute('content', originalAppleTitle);
        } else {
          appTitle.remove();
        }
      }
    };
  }, [ref]);

  return (
    <div className="w-full h-[100dvh] bg-slate-950 flex flex-col relative font-sans overflow-hidden">
      {/* On top, we render the EngineerHelper. Since isFullPage={true} is passed, it covers the whole viewport on mobile. */}
      {carregandoLogin || !parceiroPronto ? null : <EngineerHelper isFullPage={true} />}
    </div>
  );
}
