import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getApiBaseUrl } from '../lib/utils';

// roderindica.com/o/K7P2Q: troca o código curto pelo equipamento e abre a tela de orçamento
export default function LinkCurto() {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const [erro, setErro] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${getApiBaseUrl()}/api/link-curto/${encodeURIComponent(codigo || '')}`);
        if (!r.ok) throw new Error('nao encontrado');
        const d = await r.json();
        const q = new URLSearchParams({ uid: d.uid || '', pid: d.pid || '', mid: d.mid || '', c: String(codigo || '').toUpperCase() });
        navigate(`/pedido-orcamento?${q.toString()}`, { replace: true });
      } catch {
        setErro(true);
      }
    })();
  }, [codigo]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f1f5f9] text-slate-700 p-6 text-center">
      <img src="/marca/roder-redondo-512.png" alt="Roder" className="h-16 w-16 mb-4" />
      {erro ? (
        <>
          <p className="font-bold">Este link não está mais disponível.</p>
          <a href="https://roderbrasil.com.br" className="mt-3 text-blue-700 font-semibold underline">Conheça a Roder</a>
        </>
      ) : (
        <p className="text-sm font-medium">Abrindo...</p>
      )}
    </div>
  );
}
