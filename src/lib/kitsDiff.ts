// Mínimo que a comparação precisa; a tela usa um InstallationKit com id e created_at, o catálogo local não.
export interface KitComparavel {
  code: string;
  description: string;
  items?: { code: string; description: string; quantity: number }[];
}

export type MudancaKit<K, T extends 'ADDED' | 'UPDATED' | 'UNCHANGED'> = {
  parsedKit: K;
  existingKit?: K;
  type: T;
  changes: string[];
};

// Soma por código: o ERP tem kits com o mesmo item em duas linhas (9003, 9031, 9044, 9056),
// e comparar só a última linha acusaria quantidade alterada onde nada mudou.
function quantidadesPorCodigo(items: KitComparavel['items']): Map<string, number> {
  const m = new Map<string, number>();
  (items || []).forEach(it => m.set(it.code, (m.get(it.code) || 0) + it.quantity));
  return m;
}

export function computeKitsDiff<K extends KitComparavel>(parsedKits: K[], existingKits: K[]) {
  const existingMap = new Map<string, K>();
  existingKits.forEach(k => existingMap.set(k.code.trim(), k));

  const added: MudancaKit<K, 'ADDED'>[] = [];
  const updated: MudancaKit<K, 'UPDATED'>[] = [];
  const unchanged: MudancaKit<K, 'UNCHANGED'>[] = [];

  parsedKits.forEach(pKit => {
    const existing = existingMap.get(pKit.code.trim());
    if (!existing) {
      added.push({ parsedKit: pKit, type: 'ADDED', changes: ['Novo kit cadastrado'] });
      return;
    }
    const changes: string[] = [];
    if (pKit.description.trim() !== existing.description.trim()) {
      changes.push(`Descrição alterada: "${existing.description}" ➔ "${pKit.description}"`);
    }
    const exQtd = quantidadesPorCodigo(existing.items);
    const novaQtd = quantidadesPorCodigo(pKit.items);
    const descricaoNova = new Map<string, string>();
    (pKit.items || []).forEach(it => descricaoNova.set(it.code, it.description));

    novaQtd.forEach((q, code) => {
      if (!exQtd.has(code)) changes.push(`Item adicionado: ${code} (${descricaoNova.get(code)}) - Qtd: ${q}`);
      else if (exQtd.get(code) !== q) changes.push(`Qtd alterada no item ${code}: ${exQtd.get(code)} ➔ ${q}`);
    });
    (existing.items || []).forEach((it, i, arr) => {
      if (!novaQtd.has(it.code) && arr.findIndex(x => x.code === it.code) === i) {
        changes.push(`Item removido: ${it.code} (${it.description})`);
      }
    });

    if (changes.length > 0) updated.push({ parsedKit: pKit, existingKit: existing, type: 'UPDATED', changes });
    else unchanged.push({ parsedKit: pKit, existingKit: existing, type: 'UNCHANGED', changes: [] });
  });

  return { added, updated, unchanged };
}
