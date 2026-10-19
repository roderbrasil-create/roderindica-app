import { Send } from 'lucide-react';

// Botão "Enviar" das fichas (só aparece para a equipe Roder): gera o PDF e abre o compartilhar
export function BotaoEnviarFicha({ onClick, destaque = false, disabled = false }: { onClick: () => void; destaque?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title="Enviar a ficha em PDF (WhatsApp, e-mail...)"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1FA855] hover:bg-[#178a45] text-white font-black text-xs transition-all shadow-sm disabled:opacity-60 ${destaque ? 'ring-2 ring-offset-2 ring-[#1FA855] animate-pulse' : ''}`}
    >
      <Send className="h-3.5 w-3.5" /> Enviar
    </button>
  );
}
