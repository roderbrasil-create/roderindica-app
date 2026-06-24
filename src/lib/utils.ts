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

    if (
      hostname === 'roderindica.com' || 
      hostname === 'www.roderindica.com' || 
      hostname === 'roderindica.roderbrasil.com.br'
    ) {
      return 'https://roder-indica-v2-142737915053.us-west1.run.app';
    }
  }
  return '';
}

// Background auto-detection of the correct, working API endpoint
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  if (
    hostname === 'roderindica.com' || 
    hostname === 'www.roderindica.com' || 
    hostname === 'roderindica.roderbrasil.com.br'
  ) {
    // Ping local Hostinger health endpoint to see if Node.js server runs locally
    fetch('/api/health')
      .then(res => {
        if (res.ok) {
          console.log('[API-DETECTION] Hostinger native backend detected! Setting API Base to same-origin.');
          window.localStorage.setItem('RODER_API_BASE_URL', '');
        } else {
          throw new Error('Local API health check failed');
        }
      })
      .catch(() => {
        console.log('[API-DETECTION] Hostinger native backend not detected. Falling back to Google Cloud Run.');
        window.localStorage.setItem('RODER_API_BASE_URL', 'https://roder-indica-v2-142737915053.us-west1.run.app');
      });
  } else {
    // Clear cache for localhost / dev sandbox environments
    window.localStorage.removeItem('RODER_API_BASE_URL');
  }
}
