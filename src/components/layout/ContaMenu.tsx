import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { rotuloDoPerfil } from '../../lib/conta';

// Ícone da conta no cabeçalho, ao lado do sino: nome, perfil, "Minha conta" e "Sair da conta"
// (com confirmação). É o único lugar de sair; saiu do rodapé do menu lateral.
// Em "Ver como" quem está logado de verdade é o admin: o item vira "Sair da simulação"
// e nunca desloga ninguém.
export default function ContaMenu() {
  const { profile, user, logout, isImpersonating, stopImpersonation, isAdmin, isManager, isTriagem, isInternalSeller, isExternalSeller, isRegionalSeller, isFinancial } = useAuth();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const raiz = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: Event) => { if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false); };
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('pointerdown', fora);
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('pointerdown', fora); document.removeEventListener('keydown', tecla); };
  }, [aberto]);

  const nome = (profile?.name || user?.email?.split('@')[0] || 'Usuário').replace('Jefferson', 'Jeferson');
  const inicial = (nome.charAt(0) || '?').toUpperCase();
  const perfil = rotuloDoPerfil({ isAdmin, isManager, isTriagem, isInternalSeller, isExternalSeller, isRegionalSeller, isFinancial }, profile?.role as string);

  const sair = async () => {
    setSaindo(true);
    try {
      await logout();
      navigate('/login');
    } finally {
      setSaindo(false);
      setConfirmando(false);
    }
  };

  const item = 'w-full min-h-11 px-3 flex items-center gap-2.5 text-left text-sm font-semibold rounded-lg hover:bg-muted';

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        aria-label="Menu da conta"
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => setAberto(v => !v)}
        className="h-11 w-11 flex items-center justify-center"
      >
        <span className="h-9 w-9 rounded-full bg-primary text-primary-foreground font-extrabold text-base flex items-center justify-center">{inicial}</span>
      </button>
      {aberto && (
        <div role="menu" className="absolute right-0 top-full mt-1 w-64 z-[70] rounded-xl border border-border bg-card text-card-foreground shadow-xl p-2">
          <div className="px-3 py-2 border-b border-border mb-1">
            <p className="text-sm font-bold truncate">{nome}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">{perfil}</p>
          </div>
          <button role="menuitem" className={item} onClick={() => { setAberto(false); navigate('/perfil'); }}>
            <User className="h-4 w-4" /> Minha conta
          </button>
          {isImpersonating ? (
            <button role="menuitem" className={`${item} text-orange-600`} onClick={() => { setAberto(false); stopImpersonation(); }}>
              <EyeOff className="h-4 w-4" /> Sair da simulação
            </button>
          ) : (
            <button role="menuitem" className={`${item} text-red-600`} onClick={() => { setAberto(false); setConfirmando(true); }}>
              <LogOut className="h-4 w-4" /> Sair da conta
            </button>
          )}
        </div>
      )}
      <Dialog open={confirmando} onOpenChange={(v: boolean) => { if (!saindo) setConfirmando(v); }}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Quer mesmo sair da conta?</DialogTitle>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 h-11" disabled={saindo} onClick={() => setConfirmando(false)}>Não</Button>
            <Button className="flex-1 h-11" disabled={saindo} onClick={sair}>{saindo ? 'Saindo...' : 'Sim'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
