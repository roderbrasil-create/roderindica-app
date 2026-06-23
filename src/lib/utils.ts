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
  const hostname = window.location.hostname;
  if (
    hostname === 'localhost' || 
    hostname === '127.0.0.1' || 
    hostname.endsWith('run.app') || 
    hostname.includes('webcontainer') ||
    hostname.includes('github.dev')
  ) {
    return '';
  }
  // Fallback to the Cloud Run Shared App URL which is always active and has all backend endpoints
  return 'https://ais-pre-5iqoo2vhpig2v4eiflfmpf-239499535537.us-west2.run.app';
}
