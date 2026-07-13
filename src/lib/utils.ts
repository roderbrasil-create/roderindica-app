import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function safeFormatDate(date: any, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }) {
  if (!date) return 'Não informado';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Data Inválida';
  try {
    return d.toLocaleDateString('pt-BR', options);
  } catch (e) {
    return 'Erro na data';
  }
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // 1. Explicit environment variable overrides everything else
    if ((import.meta as any).env?.VITE_API_BASE_URL) {
      return (import.meta as any).env.VITE_API_BASE_URL;
    }

    const hostname = window.location.hostname;
    const isIframe = window.self !== window.top;
    const isCloudRunDev =
      hostname.endsWith('run.app') ||
      hostname.includes('aistudio') ||
      hostname.includes('preview') ||
      hostname.includes('google');

    // 2. For localhost/127.0.0.1, always use relative path
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      try {
        window.localStorage.removeItem('RODER_API_BASE_URL');
      } catch (e) {}
      return '';
    }

    // 3. For AI Studio / Cloud Run Dev environment
    if (isCloudRunDev) {
      // Clear any poisoned cache to guarantee the standalone tab functions correctly
      try {
        window.localStorage.removeItem('RODER_API_BASE_URL');
      } catch (e) {}
      
      // We always return relative path for same-origin dev server requests.
      // In a standalone tab, this will work perfectly.
      // In an iframe, this will trigger the 'Open in New Tab' banner on first failure.
      return '';
    }

    // 4. Local storage cache override (dynamically populated by background auto-detection)
    try {
      const cached = window.localStorage.getItem('RODER_API_BASE_URL');
      if (cached !== null) {
        return cached;
      }
    } catch (e) {
      console.warn('[API-BASE-URL] LocalStorage read blocked/failed:', e);
    }

    if (hostname === 'roderindica.com' || hostname.endsWith('.roderindica.com')) {
      return '';
    }

    return 'https://roder-indica-v2-142737915053.us-west1.run.app';
  }

  if ((import.meta as any).env?.VITE_API_BASE_URL) {
    return (import.meta as any).env.VITE_API_BASE_URL;
  }
  return '';
}

// Background auto-detection of the correct, working API endpoint
if (typeof window !== 'undefined') {
  const detectApi = async () => {
    const hostname = window.location.hostname;
    const isIframe = window.self !== window.top;
    const isCloudRunDev =
      hostname.endsWith('run.app') ||
      hostname.includes('aistudio') ||
      hostname.includes('preview') ||
      hostname.includes('google');

    // For localhost, 127.0.0.1, and Cloud Run Dev domains, relative path is always correct and working in standalone mode.
    // Skip detection completely on these environments to prevent local storage poisoning.
    if (hostname === 'localhost' || hostname === '127.0.0.1' || isCloudRunDev) {
      try {
        window.localStorage.removeItem('RODER_API_BASE_URL');
      } catch (e) {}
      return;
    }

    // 1. Test relative path on current origin first (same-origin is always the most secure and bypasses CORS)
    try {
      const res = await fetch('/api/health', { method: 'GET', credentials: 'include' });
      // If we got a response (status 200 or 500, it means the Express server handles the request)
      if (res.status === 200 || res.status === 500) {
        console.log('[AUTO-DETECT] Same-origin API is working. Caching empty base URL (relative paths).');
        try {
          window.localStorage.setItem('RODER_API_BASE_URL', '');
        } catch (e) {}
        return;
      }
    } catch (err) {
      console.log('[AUTO-DETECT] Same-origin API is not available/blocked on this host. Testing external backends...', err);
    }

    // 2. Test known external production backend URLs (useful fallback when running inside an authenticated iframe with third-party cookies disabled)
    const candidates = [
      'https://roder-indica-v2-142737915053.us-west1.run.app',
      'https://roder-indica-142737915053.us-west1.run.app',
      'https://ais-pre-5iqoo2vhpig2v4eiflfmpf-239499535537.us-west2.run.app'
    ];

    for (const url of candidates) {
      if (url.includes(hostname)) continue; // Avoid self-referencing loops
      try {
        const res = await fetch(`${url}/api/health`, { method: 'GET' });
        if (res.status === 200 || res.status === 500) {
          console.log(`[AUTO-DETECT] Working external API detected: ${url}`);
          try {
            window.localStorage.setItem('RODER_API_BASE_URL', url);
          } catch (e) {}
          return;
        }
      } catch (err) {
        // Continue to next candidate
      }
    }

    // 3. Default fallback if nothing else worked
    console.warn('[AUTO-DETECT] No working API backend found. Falling back to default Cloud Run production backend.');
    try {
      window.localStorage.setItem('RODER_API_BASE_URL', 'https://roder-indica-v2-142737915053.us-west1.run.app');
    } catch (e) {}
  };

  detectApi().catch(err => console.error('[AUTO-DETECT] Error during API auto-detection:', err));
}
