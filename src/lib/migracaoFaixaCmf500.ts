import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { corrigirEspecificacoesGt, ESPECIFICACOES_GT } from './fichaGt';
import { corrigirFaixaCmf500, FAIXA_CMF500, corrigirFaixaCmf800, FAIXA_CMF800 } from './faixaCmf';

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


// CMF 800 de "20 a 30 Ton." para "20 a 35 Ton." (Jeferson, 13/11/2026). Mesma regra: roda UMA vez.
export async function corrigirFaixaCmf800UmaVez(data: any[], db: any) {
  try {
    const marca = doc(db, 'settings', 'migracao_faixa_cmf800');
    if ((await getDoc(marca)).exists()) return;
    const cabecote = data.find(p => (p.models || []).some((m: any) => /^cmf[-_ ]?800$/i.test(String(m.id || '')) || /^cmf\s*800$/i.test(String(m.name || '').trim())));
    if (!cabecote) return;
    const novos = corrigirFaixaCmf800(cabecote.models);
    if (novos) {
      console.log('[Healing] CMF 800: faixa de máquina 20 a 30 Ton. -> 20 a 35 Ton.');
      await updateDoc(doc(db, 'products', cabecote.id), { models: novos });
    }
    await setDoc(marca, { feito_em: new Date().toISOString(), faixa: FAIXA_CMF800, produto: cabecote.id, alterou: !!novos });
  } catch (err) {
    console.error('Correção da faixa do CMF 800 falhou:', err);
  }
}


// Garras traçadoras GT 600X, 800X e 1000X: dados das fichas novas (Jeferson, 13/11/2026). Roda UMA vez.
export async function corrigirEspecificacoesGtUmaVez(data: any[], db: any) {
  try {
    const marca = doc(db, 'settings', 'migracao_gt_fichas_novas');
    if ((await getDoc(marca)).exists()) return;
    const garra = data.find(p => p.name === 'Garra Traçadora');
    if (!garra) return;
    const novos = corrigirEspecificacoesGt(garra.models || []);
    if (novos) {
      console.log('[Healing] Garra Traçadora: dados das fichas novas GT 600X, 800X e 1000X');
      await updateDoc(doc(db, 'products', garra.id), { models: novos });
    }
    await setDoc(marca, { feito_em: new Date().toISOString(), produto: garra.id, alterou: !!novos });
  } catch (err) {
    console.error('Correção dos dados das garras traçadoras falhou:', err);
  }
}

// GT 400: a ficha era um link do Google Drive, que pede login e não abre para parceiro indicador nem cliente.
// Tira o link do cadastro (a ficha nova mora no app) e põe os dados da ficha de 23/11/2026. Roda UMA vez.
export async function trazerFichaGt400ParaOAppUmaVez(data: any[], db: any) {
  try {
    const marca = doc(db, 'settings', 'migracao_gt400_ficha_no_app');
    if ((await getDoc(marca)).exists()) return;
    const garra = data.find(p => p.name === 'Garra Traçadora');
    if (!garra) return;
    let mudou = false;
    const modelos = (garra.models || []).map((m: any) => {
      if (!/gt[-_ ]?400/i.test(`${m.name || ''} ${m.id || ''}`)) return m;
      mudou = true;
      const { pdf_url, ...resto } = m;
      // não existe GT 400X: o modelo se chama GT 400
      return { ...resto, id: 'gt-400', name: 'GT 400', technical_specs: { ...(m.technical_specs || {}), ...ESPECIFICACOES_GT.gt400 } };
    });
    if (mudou) {
      console.log('[Healing] GT 400: ficha sai do Drive e passa a abrir do app');
      await updateDoc(doc(db, 'products', garra.id), { models: modelos });
    }
    await setDoc(marca, { feito_em: new Date().toISOString(), produto: garra.id, alterou: mudou });
  } catch (err) {
    console.error('Ficha da GT 400 no app falhou:', err);
  }
}

// GT 280 e GT 360 ganharam ficha nova no app (23/11/2026): sai qualquer link de Drive e entram os dados oficiais do site
export async function trazerFichasGt280e360ParaOAppUmaVez(data: any[], db: any) {
  try {
    const marca = doc(db, 'settings', 'migracao_gt280_gt360_ficha_no_app');
    if ((await getDoc(marca)).exists()) return;
    const garra = data.find(p => p.name === 'Garra Traçadora');
    if (!garra) return;
    let mudou = false;
    const modelos = (garra.models || []).map((m: any) => {
      const txt = `${m.name || ''} ${m.id || ''}`;
      const chave = /gt[-_ ]?280/i.test(txt) ? 'gt280' : /gt[-_ ]?360/i.test(txt) ? 'gt360' : null;
      if (!chave) return m;
      mudou = true;
      const { pdf_url, ...resto } = m;
      return { ...resto, technical_specs: { ...(m.technical_specs || {}), ...ESPECIFICACOES_GT[chave] } };
    });
    if (mudou) {
      console.log('[Healing] GT 280 e GT 360: ficha nova abre do app');
      await updateDoc(doc(db, 'products', garra.id), { models: modelos });
    }
    await setDoc(marca, { feito_em: new Date().toISOString(), produto: garra.id, alterou: mudou });
  } catch (err) {
    console.error('Ficha da GT 280 e GT 360 no app falhou:', err);
  }
}

// Garra Clamshell GCR: o produto principal abre a ficha com os três modelos e cada modelo abre a própria (25/11/2026). Roda UMA vez.
export async function fichaPorModeloGcrUmaVez(data: any[], db: any) {
  try {
    const marca = doc(db, 'settings', 'migracao_gcr_ficha_por_modelo');
    if ((await getDoc(marca)).exists()) return;
    const garra = data.find(p => p.name === 'Garra Clamshell GCR');
    if (!garra) return;
    let mudou = false;
    const modelos = (garra.models || []).map((m: any) => {
      const n = String(m.name || '').replace(/\s+/g, '').toUpperCase();
      if (!/^GCR(1000|1500|2500)$/.test(n)) return m;
      mudou = true;
      return { ...m, pdf_url: `/catalogo/gcr/Ficha_Garra_Clamshell_${n}.pdf` };
    });
    if (mudou) {
      console.log('[Healing] Garra Clamshell GCR: ficha própria em cada modelo');
      await updateDoc(doc(db, 'products', garra.id), { pdf_url: '/catalogo/gcr/Ficha_Garra_Clamshell_GCR.pdf', models: modelos });
    }
    await setDoc(marca, { feito_em: new Date().toISOString(), produto: garra.id, alterou: mudou });
  } catch (err) {
    console.error('Ficha por modelo da GCR falhou:', err);
  }
}

// Garra Clamshell GCR: rotator compatível (12 ou 16 ton), pressão de 190 bar e fluxo de 80 a 150 l/min nos três modelos (25/11/2026). Roda UMA vez.
export async function rotatorPressaoFluxoGcrUmaVez(data: any[], db: any) {
  try {
    const marca = doc(db, 'settings', 'migracao_gcr_rotator_pressao_fluxo');
    if ((await getDoc(marca)).exists()) return;
    const garra = data.find(p => p.name === 'Garra Clamshell GCR');
    if (!garra) return;
    let mudou = false;
    const modelos = (garra.models || []).map((m: any) => {
      if (!/^GCR(1000|1500|2500)$/.test(String(m.name || '').replace(/\s+/g, '').toUpperCase())) return m;
      mudou = true;
      return { ...m, technical_specs: { ...(m.technical_specs || {}), rotator_compativel: '12 ou 16 ton', pressao_trabalho: '190', fluxo_oleo: '80 a 150 l/min' } };
    });
    if (mudou) {
      console.log('[Healing] Garra Clamshell GCR: rotator, pressão e fluxo');
      await updateDoc(doc(db, 'products', garra.id), { models: modelos });
    }
    await setDoc(marca, { feito_em: new Date().toISOString(), produto: garra.id, alterou: mudou });
  } catch (err) {
    console.error('Rotator, pressão e fluxo da GCR falharam:', err);
  }
}

// CMF 600: ficha nova no padrão Roder, guardada no app, aberta pelo modelo CMF 600 (25/11/2026). Roda UMA vez.
export async function fichaCmf600UmaVez(data: any[], db: any) {
  try {
    const marca = doc(db, 'settings', 'migracao_cmf600_ficha_no_app');
    if ((await getDoc(marca)).exists()) return;
    const cabecote = data.find(p => (p.models || []).some((m: any) => /^cmf[-_ ]?600$/i.test(String(m.id || '')) || /^cmf\s*600$/i.test(String(m.name || '').trim())));
    if (!cabecote) return;
    let mudou = false;
    const modelos = (cabecote.models || []).map((m: any) => {
      if (!(/^cmf[-_ ]?600$/i.test(String(m.id || '')) || /^cmf\s*600$/i.test(String(m.name || '').trim()))) return m;
      mudou = true;
      return { ...m, pdf_url: '/catalogo/cmf/Ficha_Cabecote_Multifuncional_CMF600.pdf' };
    });
    if (mudou) {
      console.log('[Healing] CMF 600: ficha nova no app');
      await updateDoc(doc(db, 'products', cabecote.id), { models: modelos });
    }
    await setDoc(marca, { feito_em: new Date().toISOString(), produto: cabecote.id, alterou: mudou });
  } catch (err) {
    console.error('Ficha do CMF 600 no app falhou:', err);
  }
}
