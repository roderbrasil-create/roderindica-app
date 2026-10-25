// Estoque só leitura (variável ESTOQUE_SO_LEITURA no servidor; padrão 0 = como hoje, bidirecional).
// Com 1: estoque e reservas passam a ser feitos no Roder Vision; o Indica só mostra. O servidor também grava
// settings/estoque_config.so_leitura, que as regras do Firestore usam para recusar as escritas do navegador.
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { addDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { getApiBaseUrl } from './utils';

export const MENSAGEM_SO_LEITURA = 'Estoque e reservas são feitos no Roder Vision';

let soLeitura = false;
let carregado: Promise<boolean> | null = null;
let ultimoAviso = 0;

export const estaSoLeitura = () => soLeitura;

export function carregarSoLeitura(): Promise<boolean> {
  if (!carregado) {
    carregado = fetch(`${getApiBaseUrl()}/api/public/estoque-config`)
      .then(r => (r.ok ? r.json() : null))
      .then(j => { soLeitura = j?.so_leitura === true; return soLeitura; })
      .catch(() => soLeitura);
  }
  return carregado;
}

export function useEstoqueSoLeitura(): boolean {
  const [v, setV] = useState(soLeitura);
  useEffect(() => { let vivo = true; carregarSoLeitura().then(x => { if (vivo) setV(x); }); return () => { vivo = false; }; }, []);
  return v;
}

/** Recusa escrita no modo só leitura (com um aviso, no máximo a cada 5 s). */
export function exigirEscrita() {
  if (!soLeitura) return;
  if (Date.now() - ultimoAviso > 5000) { ultimoAviso = Date.now(); toast.error(MENSAGEM_SO_LEITURA); }
  throw new Error(MENSAGEM_SO_LEITURA);
}

// Versões das funções de escrita do Firestore que respeitam o modo só leitura.
export const addDocE = ((...a: any[]) => { exigirEscrita(); return (addDoc as any)(...a); }) as typeof addDoc;
export const updateDocE = ((...a: any[]) => { exigirEscrita(); return (updateDoc as any)(...a); }) as typeof updateDoc;
export const deleteDocE = ((...a: any[]) => { exigirEscrita(); return (deleteDoc as any)(...a); }) as typeof deleteDoc;
export const writeBatchE = ((...a: any[]) => { exigirEscrita(); return (writeBatch as any)(...a); }) as typeof writeBatch;

/** Parceiro indicador (external_seller) nunca reserva estoque. */
export const parceiroNaoReserva = (role?: string | null) => role === 'external_seller';
