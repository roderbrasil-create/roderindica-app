import { useEffect, useRef } from 'react';

// Telas que abrem por estado (sem rota própria), como a lista de modelos do catálogo
// ou a central de negociação, não criavam entrada no histórico. O "voltar" do app e
// o gesto do celular pulavam a tela anterior e caíam no dashboard. Este hook cria a
// entrada ao abrir e, quando a pessoa volta, fecha só a tela de cima.

type Item = { marca: string; fechar: () => void; voltou: boolean };

// Pilha das telas abertas: com uma ficha aberta por cima da lista de modelos, um
// "voltar" fecha a ficha e o próximo fecha a lista. Sem a pilha, um voltar fecharia as duas.
const pilha: Item[] = [];
// Quantos "voltar" fomos nós que disparamos (tela fechada pelo próprio botão X).
// Esses não podem fechar a tela de baixo.
let voltasNossas = 0;
let ouvindo = false;

function aoVoltar() {
  if (voltasNossas > 0) {
    voltasNossas--;
    return;
  }
  const topo = pilha.pop();
  if (!topo) return;
  topo.voltou = true;
  topo.fechar();
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
    const marca = `sub-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const item: Item = { marca, fechar: () => fecharRef.current(), voltou: false };
    window.history.pushState({ ...(window.history.state || {}), __sub: marca }, '');
    pilha.push(item);
    return () => {
      const i = pilha.indexOf(item);
      if (i !== -1) pilha.splice(i, 1);
      // fechou pelo botão da própria tela: tira a entrada extra, senão o próximo
      // "voltar" ficaria parado na mesma página. Só se ainda estivermos nela:
      // se a pessoa navegou para outra rota, não se mexe no histórico.
      if (!item.voltou && window.history.state?.__sub === marca) {
        voltasNossas++;
        window.history.back();
      }
    };
  }, [aberto]);
}
