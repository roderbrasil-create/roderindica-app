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
