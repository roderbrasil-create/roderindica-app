import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { corrigirDestocadorDth240b, ehModeloDth240b } from './destocadorDth';

// Grava no cadastro do Destocador DTH 240B os valores da ficha (22/10/2026). Roda UMA vez: a marca em
// settings/migracao_destocador_dth240b impede que uma edição feita depois seja desfeita. Só a diretoria roda
// (mesmo caminho e mesmas regras da migração do CMF 500). Se não puder gravar, a exibição já sai certa
// por comDestocadorDthCorrigido. Recebe os produtos como vieram do banco, sem a correção de exibição.
// A gravação lê o documento ATUAL dentro de uma transação e regrava o array de modelos a partir dele,
// então edição feita por outra pessoa entre o carregamento da tela e a gravação não se perde.
export async function corrigirDestocadorDthUmaVez(dadosBrutos: any[], db: any) {
  try {
    const marca = doc(db, 'settings', 'migracao_destocador_dth240b');
    if ((await getDoc(marca)).exists()) return;
    const produto = dadosBrutos.find(p => (p.models || []).some((m: any) => ehModeloDth240b(m)));
    if (!produto) return; // catálogo ainda não carregado: tenta na próxima vez
    const ref = doc(db, 'products', produto.id);
    await runTransaction(db, async (tx: any) => {
      if ((await tx.get(marca)).exists()) return;
      const atual = await tx.get(ref);
      if (!atual.exists()) return;
      const novos = corrigirDestocadorDth240b((atual.data() as any).models);
      if (novos) tx.update(ref, { models: novos });
      tx.set(marca, { feito_em: new Date().toISOString(), produto: produto.id, alterou: !!novos });
    });
  } catch (err) {
    console.error('Correção do Destocador DTH 240B falhou:', err);
  }
}
