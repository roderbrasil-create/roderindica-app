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

    // 2. Local storage cache override (mainly for hybrid wrappers or advanced settings)
    const cached = window.localStorage.getItem('RODER_API_BASE_URL');
    if (cached !== null) {
      return cached;
    }

    // 3. Auto-detect environment based on hostname
    const hostname = window.location.hostname;
    const isDevOrCloudRun = 
      hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      hostname.endsWith('run.app') ||
      hostname === 'roderindica.com' ||
      hostname.endsWith('.roderindica.com');

    // If we are in dev (localhost), in AI Studio preview (*.run.app), or on the custom domain (roderindica.com), we prefer relative paths
    if (isDevOrCloudRun) {
      return '';
    }

    // Default fallback if not cached yet
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
    
    // 1. If we are on localhost or dev, same-origin relative path is always preferred
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      window.localStorage.removeItem('RODER_API_BASE_URL');
      return;
    }

    // 2. Test relative path on current origin first (same-origin is always the most secure and bypasses CORS)
    try {
      const res = await fetch('/api/health', { method: 'GET' });
      // If we got a response (status 200 or 500, it means the Express server handles the request)
      if (res.status === 200 || res.status === 500) {
        console.log('[AUTO-DETECT] Same-origin API is working. Caching empty base URL (relative paths).');
        window.localStorage.setItem('RODER_API_BASE_URL', '');
        return;
      }
    } catch (err) {
      console.log('[AUTO-DETECT] Same-origin API is not available on this host. Testing external backends...', err);
    }

    // 3. Test known external production backend URLs
    const candidates = [
      'https://roder-indica-142737915053.us-west1.run.app',
      'https://roder-indica-v2-142737915053.us-west1.run.app',
      'https://ais-pre-5iqoo2vhpig2v4eiflfmpf-239499535537.us-west2.run.app'
    ];

    for (const url of candidates) {
      try {
        const res = await fetch(`${url}/api/health`, { method: 'GET' });
        if (res.status === 200 || res.status === 500) {
          console.log(`[AUTO-DETECT] Working external API detected: ${url}`);
          window.localStorage.setItem('RODER_API_BASE_URL', url);
          return;
        }
      } catch (err) {
        // Continue to next candidate
      }
    }

    // 4. Default fallback if nothing else worked
    console.warn('[AUTO-DETECT] No working API backend found. Falling back to default.');
    if (window.localStorage.getItem('RODER_API_BASE_URL') === null) {
      window.localStorage.setItem('RODER_API_BASE_URL', 'https://roder-indica-v2-142737915053.us-west1.run.app');
    }
  };

  detectApi().catch(err => console.error('[AUTO-DETECT] Error during API auto-detection:', err));
}
