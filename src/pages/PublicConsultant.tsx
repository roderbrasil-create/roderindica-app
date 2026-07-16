import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import EngineerHelper from '../components/layout/EngineerHelper';

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

export default function PublicConsultant() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref');

  useEffect(() => {
    // Store original page metadata to restore on unmount
    const originalTitle = document.title;
    
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

    let originalManifest = '';
    const manifestEl = document.querySelector('link[rel="manifest"]');
    if (manifestEl) {
      originalManifest = manifestEl.getAttribute('href') || '';
    }

    let originalAppleTitle = '';
    const appleTitleEl = document.getElementById('apple-app-title');
    if (appleTitleEl) {
      originalAppleTitle = appleTitleEl.getAttribute('content') || '';
    }

    // Set custom, premium document title
    document.title = "Consultor Técnico Digital - RODER";

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

    // 2. Setup dynamic custom manifest so "Add to Home Screen" keeps the "Consultor Técnico Roder" name & brand-new black icon
    const manifestLink = document.querySelector('link[rel="manifest"]');
    const customManifest = JSON.stringify({
      id: '/consultor',
      name: "Consultor Técnico Roder",
      short_name: "Consultor Técnico Roder",
      description: "Consultor Técnico Digital - RODER",
      display: "standalone",
      start_url: window.location.origin + window.location.pathname + (ref ? `?ref=${encodeURIComponent(ref)}` : ''),
      background_color: '#000000',
      theme_color: '#f97316',
      orientation: 'any',
      scope: '/',
      icons: [
        {
          src: iconDataUrl,
          sizes: "512x512",
          type: "image/png",
          purpose: "any"
        }
      ]
    });

    if (manifestLink) {
      manifestLink.setAttribute('href', `data:application/json;charset=utf-8,${encodeURIComponent(customManifest)}`);
    } else {
      const newManifest = document.createElement('link');
      newManifest.rel = 'manifest';
      newManifest.href = `data:application/json;charset=utf-8,${encodeURIComponent(customManifest)}`;
      document.head.appendChild(newManifest);
    }

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
      document.title = originalTitle;
      
      const touchIcon = document.querySelector('link[rel="apple-touch-icon"]');
      if (touchIcon && originalAppleTouchIcon) {
        touchIcon.setAttribute('href', originalAppleTouchIcon);
      }
      
      const fav = document.querySelector('link[rel="icon"]');
      if (fav && originalFavicon) {
        fav.setAttribute('href', originalFavicon);
      }

      const man = document.querySelector('link[rel="manifest"]');
      if (man && originalManifest) {
        man.setAttribute('href', originalManifest);
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
      <EngineerHelper isFullPage={true} />
    </div>
  );
}
