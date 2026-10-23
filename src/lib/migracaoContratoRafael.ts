import { collection, doc, getDocs, query, runTransaction, where } from 'firebase/firestore';
import { ajusteDeTaxaDoParceiro, EMAIL_PARCEIRO_CORRIGIDO } from './percentualContrato';

// Contrato do parceiro Rafael (MAQLOC): comissão de 1% para 2% (22/10/2026). Roda UMA vez, só para admin:
// a marca em settings/migracao_contrato_rafael_2pct impede que uma mudança de taxa feita depois seja desfeita.
// Grava SOMENTE commission_rate no cadastro do parceiro (as regras já deixam o admin escrever em users),
// sem tocar em contract_accepted, contract_accepted_at nem em nenhum outro campo.
export async function corrigirContratoRafaelUmaVez(db: any) {
  try {
    const marca = doc(db, 'settings', 'migracao_contrato_rafael_2pct');
    const achados = await getDocs(query(collection(db, 'users'), where('email', '==', EMAIL_PARCEIRO_CORRIGIDO)));
    if (achados.empty) return; // cadastro não encontrado: tenta na próxima vez, sem marca
    const ref = achados.docs[0].ref;
    await runTransaction(db, async (tx: any) => {
      if ((await tx.get(marca)).exists()) return;
      const atual = await tx.get(ref);
      if (!atual.exists()) return;
      const ajuste = ajusteDeTaxaDoParceiro(atual.data());
      if (ajuste) tx.update(ref, ajuste);
      tx.set(marca, { feito_em: new Date().toISOString(), parceiro: ref.id, alterou: !!ajuste });
    });
  } catch (err) {
    console.error('Correção do contrato do parceiro Rafael falhou:', err);
  }
}
