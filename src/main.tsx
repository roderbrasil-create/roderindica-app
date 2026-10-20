import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { auth } from './lib/firebase';

// Todo /api/ do próprio app leva o token de quem está logado, para o servidor saber quem pede.
// Sem isso, rotas como envio de e-mail e configurações não tinham como distinguir a equipe de um visitante.
if (typeof window !== 'undefined' && window.fetch) {
  const fetchOriginal = window.fetch.bind(window);
  // SESSÃO DERRUBADA (20/10/2026). O servidor responde 401 com codigo "token_revogado" quando a
  // senha foi trocada pela gestão ou o login foi derrubado. Em qualquer tela (Usuários, Configurações,
  // envio de arquivos) a pessoa via só "erro", sem saber o que fazer. Aqui, num lugar só: aviso claro
  // e saída da conta, para entrar de novo. Uma vez só por sessão (várias chamadas falham juntas).
  // O primeiro acesso (/api/auth/reivindicar-perfil) tem tratamento próprio e fica de fora.
  let avisouSessaoEncerrada = false;
  const tratarSessaoEncerrada = async (url: string, resposta: Response, tinhaLogin: boolean) => {
    try {
      if (!tinhaLogin || resposta.status !== 401 || avisouSessaoEncerrada) return;
      if (url.includes('/api/auth/reivindicar-perfil')) return;
      const j = await resposta.clone().json().catch(() => null);
      if (j?.codigo !== 'token_revogado') return;
      avisouSessaoEncerrada = true;
      toast.error('Sua sessão foi encerrada. Entre de novo.');
      await signOut(auth).catch(() => {});
      setTimeout(() => { avisouSessaoEncerrada = false; }, 5000);
    } catch { /* o aviso nunca derruba a chamada */ }
  };
  window.fetch = async (entrada: RequestInfo | URL, init?: RequestInit) => {
    let url = '';
    let comLogin = false;
    try {
      url = typeof entrada === 'string' ? entrada : entrada instanceof URL ? entrada.href : entrada.url;
      const doApp = url.startsWith('/api/') || url.startsWith(window.location.origin + '/api/');
      const usuario = auth.currentUser;
      comLogin = doApp && !!usuario && !usuario.isAnonymous;
      if (doApp && usuario && !usuario.isAnonymous && !(entrada instanceof Request)) {
        const headers = new Headers(init?.headers || {});
        if (!headers.has('Authorization')) {
          const token = await usuario.getIdToken().catch(() => '');
          if (token) headers.set('Authorization', `Bearer ${token}`);
          const resposta = await fetchOriginal(entrada, { ...init, headers });
          void tratarSessaoEncerrada(url, resposta, comLogin);
          return resposta;
        }
      }
    } catch { /* segue sem token */ }
    const resposta = await fetchOriginal(entrada, init);
    void tratarSessaoEncerrada(url, resposta, comLogin);
    return resposta;
  };
}

// Safe DOM patch to prevent React reconciler crashes (removeChild / insertBefore) caused by Google Translate or extensions
if (typeof window !== 'undefined' && typeof Node !== 'undefined' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (child.parentNode) {
        return originalRemoveChild.call(child.parentNode, child) as T;
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (referenceNode.parentNode) {
        return originalInsertBefore.call(referenceNode.parentNode, newNode, referenceNode) as T;
      }
      return originalInsertBefore.call(this, newNode, null) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

// Auto-recovery mechanism for dynamic chunk load failures (due to new deployments)
window.addEventListener('error', (event) => {
  const msg = event.message || '';
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Importing a module script failed')
  ) {
    console.warn('Falha ao carregar módulo dinâmico. Atualizando a página para obter a versão mais recente...', event);
    window.location.reload();
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason?.message || '';
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Importing a module script failed')
  ) {
    console.warn('Rejeição não tratada de módulo dinâmico. Atualizando a página...', event);
    window.location.reload();
  }
});

// Modo sem internet: guarda o app, as fotos e as fichas no celular (public/roder-sw.js)
if ('serviceWorker' in navigator && import.meta.env.PROD && (/roderindica\.com$/.test(location.hostname) || location.hostname === 'localhost')) {
  const registrar = () => navigator.serviceWorker.register('/roder-sw.js').catch(err => console.warn('[SW] não registrado', err));
  // o app às vezes termina de carregar antes deste código rodar: aí registra na hora
  if (document.readyState === 'complete') registrar();
  else window.addEventListener('load', registrar);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
