import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// React #310 ("Rendered more hooks than during the previous render"): um hook depois de um
// `return` antecipado do componente muda o número de hooks entre renders. Na Central de
// Negociações o useRef do estorno ficava depois de `if (!isOpen || !activeIndication) return null`
// e abrir uma venda já faturada derrubava a tela.
const HOOK = /^\s{2}(?:const|let)\s+.*=\s*(?:React\.)?use[A-Z]\w*\(|^\s{2}(?:React\.)?use[A-Z]\w*\(/;
const RETORNO = /^\s{2}if \(.*\) return(?: null|;| <)/;

export function hooksDepoisDeRetorno(fonte: string): number[] {
  const linhas = fonte.split('\n');
  const ini = linhas.findIndex(l => /^export default function \w+\(/.test(l));
  if (ini < 0) return [];
  let retorno = -1;
  const ruins: number[] = [];
  for (let i = ini + 1; i < linhas.length; i++) {
    if (retorno < 0 && RETORNO.test(linhas[i]) && /return null/.test(linhas[i])) retorno = i;
    else if (retorno >= 0 && HOOK.test(linhas[i])) ruins.push(i + 1);
  }
  return ruins;
}

for (const arq of ['src/components/negotiation/NegotiationCentral.tsx', 'src/pages/Indications.tsx', 'src/pages/Commissions.tsx']) {
  test(`${arq}: nenhum hook depois de return antecipado`, () => {
    assert.deepEqual(hooksDepoisDeRetorno(readFileSync(arq, 'utf8')), []);
  });
}

test('o detector pega o defeito antigo', () => {
  const ruim = `export default function X() {\n  const a = useState(1);\n  if (!a) return null;\n  const r = useRef(false);\n}`;
  assert.deepEqual(hooksDepoisDeRetorno(ruim), [4]);
});
