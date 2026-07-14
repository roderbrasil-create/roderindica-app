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

  // Draw the Roder/Roger style white badge in the upper center
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(256, 185, 95, 0, Math.PI * 2);
  ctx.stroke();

  // Draw stylized white letter "R" inside the circle
  ctx.fillStyle = '#ffffff';
  
  // Vertical stem
  ctx.beginPath();
  ctx.rect(218, 130, 26, 110);
  ctx.fill();

  // Outer loop curve
  ctx.beginPath();
  ctx.arc(244, 158, 28, -Math.PI / 2, Math.PI / 2, false);
  ctx.lineWidth = 26;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  // Slanted leg
  ctx.beginPath();
  ctx.moveTo(244, 186);
  ctx.lineTo(288, 240);
  ctx.lineTo(320, 240);
  ctx.lineTo(266, 186);
  ctx.closePath();
  ctx.fill();

  // Write "CONSULTOR TÉCNICO" in crisp display bold sans-serif
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 34px "Inter", "Helvetica Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CONSULTOR TÉCNICO', 256, 355);

  // Write "RODER" in the official brand orange/amber color
  ctx.fillStyle = '#f97316';
  ctx.font = '800 40px "Inter", "Helvetica Neue", sans-serif';
  ctx.fillText('RODER', 256, 415);

  // Subtle bottom design element
  ctx.fillStyle = '#334155';
  ctx.fillRect(180, 460, 152, 6);

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
    <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center font-sans overflow-hidden">
      {/* Full screen rendering of the technical consultant helper */}
      <div className="w-full h-full max-w-none flex flex-col relative">
        <EngineerHelper isFullPage={true} />
      </div>
    </div>
  );
}
