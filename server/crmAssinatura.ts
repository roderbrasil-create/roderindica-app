// Assinatura dos eventos que o CRM manda para o Indica (POST /api/crm/eventos).
// Cabeçalhos: X-Roder-Timestamp e X-Roder-Assinatura = "sha256=" + HMAC-SHA256(CRM_SEGREDO, timestamp + "." + corpoCru) em hex.
// O corpo tem de ser o CRU exato que chegou (qualquer espaço a mais muda a assinatura).
import { createHmac, timingSafeEqual } from 'node:crypto';

export const TOLERANCIA_RELOGIO_MS = 5 * 60 * 1000;

export function assinarCrm(segredo: string, timestamp: string, corpo: Buffer | string): string {
  const mac = createHmac('sha256', segredo);
  mac.update(`${timestamp}.`);
  mac.update(typeof corpo === 'string' ? Buffer.from(corpo, 'utf8') : corpo);
  return `sha256=${mac.digest('hex')}`;
}

// Segundos (10 dígitos), milissegundos (13) ou data ISO.
export function timestampEmMs(ts: string): number | null {
  const s = String(ts || '').trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) { const n = Number(s); return s.length <= 11 ? n * 1000 : n; }
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : null;
}

export type ResultadoAssinatura = { ok: true } | { ok: false; status: 401 | 503; motivo: string };

export function verificarAssinaturaCrm(o: {
  segredo: string; timestamp: string | undefined; assinatura: string | undefined; corpo: Buffer; agora?: Date; toleranciaMs?: number;
}): ResultadoAssinatura {
  if (!o.segredo) return { ok: false, status: 503, motivo: 'segredo_nao_configurado' };
  const ts = String(o.timestamp || '').trim();
  const sig = String(o.assinatura || '').trim();
  if (!ts || !sig) return { ok: false, status: 401, motivo: 'cabecalhos_ausentes' };
  const ms = timestampEmMs(ts);
  if (ms === null) return { ok: false, status: 401, motivo: 'timestamp_invalido' };
  const agora = (o.agora || new Date()).getTime();
  if (Math.abs(agora - ms) > (o.toleranciaMs ?? TOLERANCIA_RELOGIO_MS)) return { ok: false, status: 401, motivo: 'timestamp_fora_da_janela' };
  const esperado = Buffer.from(assinarCrm(o.segredo, ts, o.corpo), 'utf8');
  const recebido = Buffer.from(sig.toLowerCase().startsWith('sha256=') ? `sha256=${sig.slice(7).toLowerCase()}` : sig, 'utf8');
  // tamanhos diferentes: timingSafeEqual lançaria; já é inválida
  if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) return { ok: false, status: 401, motivo: 'assinatura_invalida' };
  return { ok: true };
}
