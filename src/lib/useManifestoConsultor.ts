import { useEffect } from 'react';

// Nas telas do consultor (/consultor, /consultor-tecnico, /consultor-equipe) o navegador enxerga
// um app próprio, "Consultor Roder": o Chrome e o Edge oferecem "Instalar" ou fixar na barra de
// tarefas com ícone separado do Roder Indica. Ao sair da tela, volta tudo como era.
export function useManifestoConsultor() {
  useEffect(() => {
    const tituloAntes = document.title;
    let manifesto = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    const criouManifesto = !manifesto;
    if (!manifesto) {
      manifesto = document.createElement('link');
      manifesto.rel = 'manifest';
      document.head.appendChild(manifesto);
    }
    const manifestoAntes = manifesto.getAttribute('href') || '';
    manifesto.setAttribute('href', window.location.pathname.startsWith('/consultor-equipe') ? '/consultor-equipe.webmanifest' : '/consultor.webmanifest');

    const cor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    const corAntes = cor?.getAttribute('content') || '';
    cor?.setAttribute('content', '#1B1E22');

    document.title = 'Consultor Roder';

    return () => {
      document.title = tituloAntes;
      if (criouManifesto) manifesto?.remove();
      else manifesto?.setAttribute('href', manifestoAntes);
      if (cor && corAntes) cor.setAttribute('content', corAntes);
    };
  }, []);
}
