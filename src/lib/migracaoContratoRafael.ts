import { collection, doc, getDocs, query, runTransaction, where } from 'firebase/firestore';
import { ajusteDeTaxaDoParceiro, EMAIL_PARCEIRO_CORRIGIDO } from './percentualContrato';

// Contrato do parceiro Rafael (MAQLOC): comissão de 1% para 2% (22/10/2026). Roda UMA vez, só para admin:
// a marca em settings/migracao_contrato_rafael_2pct impede que uma mudança de taxa feita depois seja desfeita.
// Grava SOMENTE commission_rate no cadastro do parceiro (as regras já deixam o admin escrever em users),
// sem tocar em contract_accepted, contract_accepted_at nem em nenhum outro campo.
export async function corrigirContratoRafaelUmaVez(db: any) {
  try {
    // v2 (28/10/2026): a primeira rodada só acertava o PRIMEIRO cadastro com esse e-mail. Se houver mais de
    // um (login e cadastro por telefone, por exemplo), o outro continuava em 1% e a Gislene e a Luana viam 1%.
    // Agora acerta TODOS os cadastros desse e-mail que ainda estiverem em 1%, uma vez.
    const marca = doc(db, 'settings', 'migracao_contrato_rafael_2pct_v2');
    const achados = await getDocs(query(collection(db, 'users'), where('email', '==', EMAIL_PARCEIRO_CORRIGIDO)));
    if (achados.empty) return; // cadastro não encontrado: tenta na próxima vez, sem marca
    await runTransaction(db, async (tx: any) => {
      if ((await tx.get(marca)).exists()) return;
      const lidos: { ref: any; ajuste: { commission_rate: number } | null }[] = [];
      for (const d of achados.docs) {
        const atual = await tx.get(d.ref);
        lidos.push({ ref: d.ref, ajuste: atual.exists() ? ajusteDeTaxaDoParceiro(atual.data()) : null });
      }
      for (const l of lidos) if (l.ajuste) tx.update(l.ref, l.ajuste);
      tx.set(marca, { feito_em: new Date().toISOString(), cadastros: achados.size, alterados: lidos.filter(l => l.ajuste).length });
    });
  } catch (err) {
    console.error('Correção do contrato do parceiro Rafael falhou:', err);
  }
}
