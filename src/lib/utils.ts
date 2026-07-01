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
  if ((import.meta as any).env?.VITE_API_BASE_URL) {
    return (import.meta as any).env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Check if we have previously cached the working API base URL
    const cached = window.localStorage.getItem('RODER_API_BASE_URL');
    if (cached !== null) {
      return cached;
    }

    const isDevOrCloudRun = 
      hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      hostname.endsWith('run.app');

    if (!isDevOrCloudRun) {
      return 'https://roder-indica-v2-142737915053.us-west1.run.app';
    }
  }
  return '';
}

// Background auto-detection of the correct, working API endpoint
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  const isDevOrCloudRun = 
    hostname === 'localhost' || 
    hostname === '127.0.0.1' || 
    hostname.endsWith('run.app');

  if (!isDevOrCloudRun) {
    // Ping local health endpoint and verify it is fully functional and credentialed
    fetch('/api/health')
      .then(res => {
        if (res.ok) {
          return res.json();
        } else {
          throw new Error('Local API health check returned non-200 status');
        }
      })
      .then(data => {
        if (data && data.status === 'ok' && data.hasGeminiKey && data.hasServiceAccount) {
          console.log('[API-DETECTION] Local backend is fully credentialed and healthy! Setting API Base to same-origin.');
          window.localStorage.setItem('RODER_API_BASE_URL', '');
        } else {
          throw new Error('Local backend is missing required credentials or key configurations');
        }
      })
      .catch((err) => {
        console.warn('[API-DETECTION] Local backend verification failed:', err.message, '- Falling back to Google Cloud Run.');
        window.localStorage.setItem('RODER_API_BASE_URL', 'https://roder-indica-v2-142737915053.us-west1.run.app');
      });
  } else {
    // Clear cache for localhost / dev sandbox environments to use local port 3000
    window.localStorage.removeItem('RODER_API_BASE_URL');
  }
}
