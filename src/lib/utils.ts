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

// --- COMMERCIAL HOURS SLA UTILITIES (BRT: Seg-Sex 07:00 às 17:00) ---

export function getBrtDateParts(dateInput: Date | string | number) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return getBrtDateParts(now);
  }
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(d);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }
  
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  let hour = parseInt(partMap.hour, 10);
  if (hour === 24) hour = 0;

  return {
    year: parseInt(partMap.year, 10),
    month: parseInt(partMap.month, 10) - 1, // 0-indexed
    day: parseInt(partMap.day, 10),
    dayOfWeek: weekdayMap[partMap.weekday] ?? 0,
    hour,
    minute: parseInt(partMap.minute, 10),
    second: parseInt(partMap.second, 10)
  };
}

function createBrtDate(year: number, month: number, day: number, hour: number, minute: number): Date {
  const y = String(year);
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  const h = String(hour).padStart(2, '0');
  const min = String(minute).padStart(2, '0');
  return new Date(`${y}-${m}-${d}T${h}:${min}:00.000-03:00`);
}

function advanceOneDay(year: number, month: number, day: number) {
  const d = new Date(Date.UTC(year, month, day + 1));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate()
  };
}

function getNextBusinessDay0700(year: number, month: number, day: number, dayOfWeek: number): Date {
  let cur = { year, month, day };
  let dow = dayOfWeek;
  do {
    cur = advanceOneDay(cur.year, cur.month, cur.day);
    const tempDate = createBrtDate(cur.year, cur.month, cur.day, 12, 0);
    const tempParts = getBrtDateParts(tempDate);
    dow = tempParts.dayOfWeek;
  } while (dow === 0 || dow === 6);
  
  return createBrtDate(cur.year, cur.month, cur.day, 7, 0);
}

export function calculateSlaExpiration(createdAtInput: Date | string | number, slaHours: number = 4): Date {
  let current = new Date(createdAtInput);
  if (isNaN(current.getTime())) current = new Date();
  
  let remainingMinutes = slaHours * 60;

  let safetyCounter = 0;
  while (remainingMinutes > 0 && safetyCounter < 100) {
    safetyCounter++;
    const parts = getBrtDateParts(current);
    
    // 1. Weekend check
    if (parts.dayOfWeek === 0 || parts.dayOfWeek === 6) {
      current = getNextBusinessDay0700(parts.year, parts.month, parts.day, parts.dayOfWeek);
      continue;
    }

    // 2. Before commercial hours (< 07:00 BRT)
    if (parts.hour < 7) {
      current = createBrtDate(parts.year, parts.month, parts.day, 7, 0);
      continue;
    }

    // 3. After commercial hours (>= 17:00 BRT)
    if (parts.hour >= 17) {
      current = getNextBusinessDay0700(parts.year, parts.month, parts.day, parts.dayOfWeek);
      continue;
    }

    // 4. Within commercial hours (07:00 <= hour < 17:00 Mon-Fri)
    const minutesLeftToday = (17 - parts.hour) * 60 - parts.minute;
    if (remainingMinutes <= minutesLeftToday) {
      current = new Date(current.getTime() + remainingMinutes * 60000);
      remainingMinutes = 0;
    } else {
      remainingMinutes -= minutesLeftToday;
      current = getNextBusinessDay0700(parts.year, parts.month, parts.day, parts.dayOfWeek);
    }
  }

  return current;
}

export function getSlaRemainingInfo(createdAtInput: Date | string | number, slaHours: number = 4) {
  const expirationDate = calculateSlaExpiration(createdAtInput, slaHours);
  const now = new Date();
  const diffMs = expirationDate.getTime() - now.getTime();
  const isExpired = diffMs <= 0;

  if (isExpired) {
    return {
      expirationDate,
      isExpired: true,
      label: 'SLA 4h Expirado (Redirecionando)',
      badgeColor: 'bg-red-500/10 text-red-600 border-red-200 font-bold'
    };
  }

  const totalDiffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalDiffMins / 60);
  const mins = totalDiffMins % 60;

  let label = '';
  if (hours > 0) {
    label = `SLA: ${hours}h ${mins}m (Horário Comercial BRT)`;
  } else {
    label = `SLA: ${mins}m (Horário Comercial BRT)`;
  }

  let badgeColor = 'bg-emerald-500/10 text-emerald-700 border-emerald-200 font-semibold';
  if (totalDiffMins < 60) {
    badgeColor = 'bg-amber-500/10 text-amber-700 border-amber-200 animate-pulse font-bold';
  }

  return {
    expirationDate,
    isExpired: false,
    label,
    badgeColor,
    hours,
    mins
  };
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
