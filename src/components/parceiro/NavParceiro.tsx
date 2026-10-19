import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Plus, ListChecks, Menu, Wallet, Package, Bot, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

// Navegação do PARCEIRO (aprovada pelo Jeferson em 18/10/2026): barra fixa embaixo no celular
// com o dia a dia (Início, Catálogo, Indicar, Indicações, Menu) e menu lateral só com o resto.
// A equipe Roder continua com o menu completo de sempre.

export function useEhParceiro() {
  const { isExternalSeller, isAdmin, isManager, isInternalSeller, isTriagem } = useAuth();
  return isExternalSeller && !isAdmin && !isManager && !isInternalSeller && !isTriagem;
}

export const abrirConsultor = (pergunta?: string) =>
  window.dispatchEvent(new CustomEvent('roder:abrir-consultor', { detail: { pergunta } }));

export function BarraParceiro({ abrirMenu }: { abrirMenu: () => void }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // telas que já têm barra própria embaixo (abas do estoque, botão de enviar a indicação)
  if (pathname.startsWith('/estoque') || pathname.startsWith('/indicacoes/nova')) return null;
  const item = (ativo: boolean) => cn('flex-1 min-w-0 px-0 h-auto flex flex-col items-center gap-1 pt-2 text-[11px] font-bold', ativo ? 'text-[#d4a106] dark:text-[#facc15]' : 'text-zinc-500 dark:text-zinc-400');
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#0b0b0b] border-t border-zinc-200 dark:border-zinc-800 flex items-start"
      style={{ height: 'calc(64px + env(safe-area-inset-bottom, 0px))', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <button className={item(pathname === '/')} onClick={() => navigate('/')}><Home className="h-6 w-6" />Início</button>
      <button className={item(pathname.startsWith('/catalogo'))} onClick={() => navigate('/catalogo')}><BookOpen className="h-6 w-6" />Catálogo</button>
      <button className="flex-1 min-w-0 px-0 h-auto flex flex-col items-center gap-1 text-[11px] font-bold text-zinc-600 dark:text-zinc-300" onClick={() => navigate('/indicacoes/nova')}>
        <span className="-mt-6 h-14 w-14 rounded-full bg-[#facc15] text-black flex items-center justify-center border-4 border-white dark:border-[#0b0b0b] shadow-md">
          <Plus className="h-7 w-7" strokeWidth={2.6} />
        </span>
        Indicar
      </button>
      <button className={item(pathname === '/indicacoes')} onClick={() => navigate('/indicacoes')}><ListChecks className="h-6 w-6" />Indicações</button>
      <button className={item(false)} onClick={abrirMenu}><Menu className="h-6 w-6" />Menu</button>
    </nav>
  );
}

// Itens do menu lateral do parceiro. No celular, os da barra de baixo não se repetem.
export function MenuParceiro({ fechar, celular }: { fechar: () => void; celular: boolean }) {
  const { pathname } = useLocation();
  const { isRegionalSeller, profile } = useAuth();
  // respeita o que o administrador desligou para este parceiro em Usuários
  const desligado = (id: string) => profile?.permissions?.sidebar?.[id] === false;
  const itens = [
    ...(celular ? [] : [
      { nome: 'Início', icone: Home, para: '/' },
      { nome: 'Catálogo de equipamentos', icone: BookOpen, para: '/catalogo' },
      { nome: 'Indicar cliente', icone: Plus, para: '/indicacoes/nova' },
      { nome: 'Minhas indicações', icone: ListChecks, para: '/indicacoes' },
    ]),
    ...(isRegionalSeller || desligado('comissoes_ext') ? [] : [{ nome: 'Meus ganhos', icone: Wallet, para: '/comissoes' }]),
    { nome: 'Pronta entrega', icone: Package, para: '/estoque' }, // sempre: vitrine do parceiro
    ...(desligado('technical_consultant_parent') ? [] : [{ nome: 'Consultor Roder', icone: Bot, acao: () => abrirConsultor() }]),
    { nome: 'Minha conta', icone: User, para: '/perfil' },
  ] as { nome: string; icone: any; para?: string; acao?: () => void }[];
  return (
    <nav className="space-y-1">
      {itens.map(it => {
        const ativo = !!it.para && (it.para === '/' ? pathname === '/' : pathname === it.para);
        const cls = cn(
          'w-full flex items-center gap-3.5 px-3 py-3 rounded-lg text-[15px] font-semibold border-l-[3px] transition-colors',
          ativo ? 'bg-sidebar-accent border-[#facc15] text-sidebar-foreground' : 'border-transparent text-sidebar-foreground/80 hover:bg-sidebar-accent/60'
        );
        const conteudo = <><it.icone className={cn('h-5 w-5 shrink-0', ativo ? 'text-[#facc15]' : 'text-sidebar-foreground/50')} />{it.nome}</>;
        return it.para
          ? <Link key={it.nome} to={it.para} onClick={fechar} className={cls}>{conteudo}</Link>
          : <button key={it.nome} onClick={() => { fechar(); it.acao?.(); }} className={cls}>{conteudo}</button>;
      })}
    </nav>
  );
}
