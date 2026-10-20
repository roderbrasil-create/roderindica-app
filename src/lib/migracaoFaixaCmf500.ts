import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { corrigirFaixaCmf500, FAIXA_CMF500 } from './faixaCmf';

// CMF 500 de "8 a 22 Ton." para "8 a 13 Ton." (regra do Jeferson, 19/10/2026). Roda UMA vez:
// a marca em settings/migracao_faixa_cmf500 impede que uma edição feita depois pela tela de
// cadastro seja desfeita. Só a diretoria roda, e as regras deixam o admin escrever em settings
// e products. É o que sobrou do antigo SelfHealing, cujas outras correções (restaurar fotos e
// recriar produtos apagados) foram removidas para o admin poder bloquear e apagar produtos.
export async function corrigirFaixaCmf500UmaVez(data: any[], db: any) {
  try {
    const marca = doc(db, 'settings', 'migracao_faixa_cmf500');
    if ((await getDoc(marca)).exists()) return;
    const cabecote = data.find(p => (p.models || []).some((m: any) => /^cmf[-_ ]?500$/i.test(String(m.id || '')) || /^cmf\s*500$/i.test(String(m.name || '').trim())));
    // catálogo ainda não carregado: tenta na próxima vez, sem gravar a marca
    if (!cabecote) return;
    const novos = corrigirFaixaCmf500(cabecote.models);
    if (novos) {
      console.log('[Healing] CMF 500: faixa de máquina 8 a 22 Ton. -> 8 a 13 Ton.');
      await updateDoc(doc(db, 'products', cabecote.id), { models: novos });
    }
    await setDoc(marca, { feito_em: new Date().toISOString(), faixa: FAIXA_CMF500, produto: cabecote.id, alterou: !!novos });
  } catch (err) {
    console.error('Correção da faixa do CMF 500 falhou:', err);
  }
}

