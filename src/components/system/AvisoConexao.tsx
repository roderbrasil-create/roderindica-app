import React, { useEffect, useRef, useState } from 'react';
import { WifiOff } from 'lucide-react';

// Tarja fininha no alto avisando que está sem internet. Não fica ocupando espaço:
// aparece ao abrir o app (ou ao cair a internet) e quando a pessoa toca em algo que
// precisa de internet, e some sozinha.
const EVENTO = 'roder:sem-internet';

export function avisarSemInternet(texto = 'Não tem internet. Esta função precisa de conexão.') {
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: texto }));
}

export function semInternet() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export default function AvisoConexao() {
  const [texto, setTexto] = useState('');
  const timer = useRef<any>(null);

  const mostrar = (t: string, ms = 4000) => {
    setTexto(t);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setTexto(''), ms);
  };

  useEffect(() => {
    const geral = 'Sem internet · catálogo, fotos e fichas disponíveis';
    if (semInternet()) mostrar(geral, 5000);
    const aoCair = () => mostrar(geral, 5000);
    const aoVoltar = () => mostrar('Internet de volta.', 2000);
    const aoPedir = (e: Event) => mostrar((e as CustomEvent<string>).detail, 3500);
    window.addEventListener('offline', aoCair);
    window.addEventListener('online', aoVoltar);
    window.addEventListener(EVENTO, aoPedir);

    // Rede de segurança: qualquer chamada ao servidor feita sem internet avisa sozinha
    const original = window.fetch;
    window.fetch = (async (...args: Parameters<typeof fetch>) => {
      const url = String(args[0] instanceof Request ? args[0].url : args[0] || '');
      if (semInternet() && url.includes('/api/')) avisarSemInternet();
      return original(...args);
    }) as typeof fetch;

    return () => {
      window.removeEventListener('offline', aoCair);
      window.removeEventListener('online', aoVoltar);
      window.removeEventListener(EVENTO, aoPedir);
      window.fetch = original;
      clearTimeout(timer.current);
    };
  }, []);

  if (!texto) return null;
  return (
    <div
      className="fixed left-0 right-0 top-0 z-[2147483600] flex justify-center pointer-events-none"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className={`mt-1 px-3 py-1.5 rounded-full shadow-lg text-[12px] font-bold flex items-center gap-1.5 ${texto.startsWith('Internet de volta') ? 'bg-green-600 text-white' : 'bg-slate-900 text-white'}`}>
        {!texto.startsWith('Internet de volta') && <WifiOff className="h-3.5 w-3.5 text-yellow-400" />}
        {texto}
      </div>
    </div>
  );
}
