import { useEffect, useRef } from 'react';

// Telas que abrem por estado (sem rota própria), como a lista de modelos do catálogo
// ou a central de negociação, não criavam entrada no histórico. O "voltar" do app e
// o gesto do celular pulavam a tela anterior e caíam no dashboard. Este hook cria a
// entrada ao abrir e, quando a pessoa volta, fecha só a tela de cima.

type Item = { marca: string; fechar: () => void; voltou: boolean; empurrado: boolean };

// Pilha das telas abertas: com uma ficha aberta por cima da lista de modelos, um
// "voltar" fecha a ficha e o próximo fecha a lista. Sem a pilha, um voltar fecharia as duas.
const pilha: Item[] = [];
// Quantos "voltar" fomos nós que disparamos (tela fechada pelo próprio botão X).
// Esses não podem fechar a tela de baixo.
let voltasNossas = 0;
// Telas abertas enquanto um "voltar" nosso ainda não terminou. O voltar do navegador
// é assíncrono: criar a entrada nova antes dele terminar faria o voltar apagá-la.
const aguardando: Item[] = [];
let ouvindo = false;

function empurrar(item: Item) {
  window.history.pushState({ ...(window.history.state || {}), __sub: item.marca }, '');
  item.empurrado = true;
}

function voltarNos() {
  voltasNossas++;
  window.history.back();
}

function entradaSobrando() {
  const sub = (window.history.state as any)?.__sub;
  return !!sub && !pilha.some(i => i.marca === sub && i.empurrado);
}

function aoVoltar() {
  if (voltasNossas > 0) {
    voltasNossas--;
    if (voltasNossas === 0) {
      // Duas telas fechadas juntas podem deixar uma entrada da mesma página para trás
      if (entradaSobrando()) { voltarNos(); return; }
      while (aguardando.length) empurrar(aguardando.shift()!);
    }
    return;
  }
  const topo = [...pilha].reverse().find(i => i.empurrado);
  if (!topo) return;
  pilha.splice(pilha.indexOf(topo), 1);
  topo.voltou = true;
  topo.fechar();
  // Caiu numa entrada que sobrou de uma tela já fechada (mesma página): passa direto,
  // senão a pessoa aperta "voltar" e nada acontece
  if (entradaSobrando()) voltarNos();
}

// Há alguma tela interna aberta? O botão voltar do app usa isto para fechar a tela
// em vez de trocar de página.
export function temTelaAberta() {
  return pilha.length > 0;
}

export function useVoltarFecha(aberto: boolean, fechar: () => void) {
  const fecharRef = useRef(fechar);
  fecharRef.current = fechar;

  useEffect(() => {
    if (!aberto || typeof window === 'undefined') return;
    if (!ouvindo) {
      window.addEventListener('popstate', aoVoltar);
      ouvindo = true;
    }
    const item: Item = {
      marca: `sub-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      fechar: () => fecharRef.current(),
      voltou: false,
      empurrado: false,
    };
    pilha.push(item);
    if (voltasNossas > 0) aguardando.push(item);
    else empurrar(item);
    return () => {
      const i = pilha.indexOf(item);
      if (i !== -1) pilha.splice(i, 1);
      const j = aguardando.indexOf(item);
      if (j !== -1) { aguardando.splice(j, 1); return; }
      // fechou pelo botão da própria tela: tira a entrada extra, senão o próximo
      // "voltar" ficaria parado na mesma página. Só se ainda estivermos nela:
      // se a pessoa navegou para outra rota, não se mexe no histórico.
      const atual = (window.history.state as any)?.__sub;
      if (!item.voltou && atual && (atual === item.marca || entradaSobrando())) voltarNos();
    };
  }, [aberto]);
}
