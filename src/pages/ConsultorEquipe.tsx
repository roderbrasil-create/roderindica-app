import { useState } from 'react';
import EngineerHelper from '../components/layout/EngineerHelper';
import { getApiBaseUrl } from '../lib/utils';
import { Loader2 } from 'lucide-react';
import { useManifestoConsultor } from '../lib/useManifestoConsultor';
import { useAuthOpcional } from '../contexts/AuthContext';

// Consultor técnico para a equipe Roder (vendedores internos), num link próprio:
// roderindica.com/consultor-equipe. Entra uma vez com o e-mail cadastrado e fica liberado
// naquele aparelho, para deixar aberto o dia todo sem precisar do Roder Indica.
const CHAVE = 'roder_public_user_profile';

function perfilSalvo() {
  try {
    const p = JSON.parse(localStorage.getItem(CHAVE) || 'null');
    return p && p.equipe === true ? p : null;
  } catch { return null; }
}

export default function ConsultorEquipe() {
  useManifestoConsultor();
  // Equipe já logada no Roder Indica neste navegador: entra direto, com o papel do login
  const auth = useAuthOpcional() as any;
  const logadoEquipe = !!(auth?.user && auth?.isEquipeRoder);
  const [liberadoPeloEmail, setLiberado] = useState(!!perfilSalvo());
  const liberado = liberadoPeloEmail || logadoEquipe;
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [conferindo, setConferindo] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setConferindo(true);
    try {
      const r = await fetch(`${getApiBaseUrl()}/api/consultor/equipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) { setErro(j.error || 'Não consegui conferir o e-mail.'); return; }
      try {
        localStorage.setItem(CHAVE, JSON.stringify({ userType: 'vendedor', equipe: true, email: email.trim().toLowerCase(), name: j.name, role: j.role }));
        sessionStorage.removeItem('roder_helper_messages');
      } catch { /* navegador sem armazenamento: libera só nesta abertura */ }
      setLiberado(true);
    } catch {
      setErro('Sem conexão. Confira a internet e tente de novo.');
    } finally {
      setConferindo(false);
    }
  };

  if (liberado) {
    return (
      <div className="w-full h-[100dvh] bg-slate-950 flex flex-col relative overflow-hidden">
        <EngineerHelper isFullPage={true} />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0b0b0b] flex items-center justify-center px-5" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <form onSubmit={entrar} className="w-full max-w-sm text-center">
        <img src="/marca/roder-redondo-512.png" alt="Roder" className="w-20 h-20 mx-auto" />
        <h1 className="text-white text-2xl font-black mt-4">Consultor Técnico Roder</h1>
        <p className="text-slate-400 text-sm mt-1">Acesso da equipe Roder. Entre com o seu e-mail cadastrado.</p>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu.nome@roderbrasil.com.br"
          className="mt-6 w-full h-12 rounded-xl bg-white px-4 text-base text-black outline-none"
        />
        {erro && <p className="mt-2 text-sm font-bold text-red-400">{erro}</p>}
        <button
          type="submit"
          disabled={conferindo}
          className="mt-3 w-full h-12 rounded-xl bg-[#facc15] text-black font-black text-base flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {conferindo && <Loader2 className="h-4 w-4 animate-spin" />}
          ENTRAR
        </button>
        <p className="text-slate-500 text-xs mt-4">Depois de entrar, este aparelho fica liberado.</p>
      </form>
    </div>
  );
}
