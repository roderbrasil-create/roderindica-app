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
      hostname.endsWith('run.app');

    // If we are in dev (localhost) or in AI Studio preview (*.run.app), we use relative/same-origin paths
    if (isDevOrCloudRun) {
      return '';
    }

    // For production deployed on custom domains (like Hostinger on roderindica.com), point to the production backend
    return 'https://roder-indica-v2-142737915053.us-west1.run.app';
  }

  if ((import.meta as any).env?.VITE_API_BASE_URL) {
    return (import.meta as any).env.VITE_API_BASE_URL;
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

  if (isDevOrCloudRun) {
    // Dev/Preview environments should always use same-origin relative requests
    window.localStorage.removeItem('RODER_API_BASE_URL');
  } else {
    // Custom domain production environments (like roderindica.com) must use the Cloud Run URL
    window.localStorage.setItem('RODER_API_BASE_URL', 'https://roder-indica-v2-142737915053.us-west1.run.app');
  }
}
