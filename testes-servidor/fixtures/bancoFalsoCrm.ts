// Firestore em memória para os testes da integração com o CRM (só o que o servidor usa).
const UNIAO = Symbol('arrayUnion');
export const arrayUnionFalso = (...v: any[]) => ({ [UNIAO]: v });

function aplicar(atual: any, mudanca: any) {
  const novo = { ...(atual || {}) };
  for (const [k, v] of Object.entries(mudanca)) {
    if (v && typeof v === 'object' && (v as any)[UNIAO]) {
      const lista = [...(novo[k] || [])];
      for (const item of (v as any)[UNIAO]) if (!lista.some(x => JSON.stringify(x) === JSON.stringify(item))) lista.push(item);
      novo[k] = lista;
    } else if (v === undefined) {
      throw new Error(`Firestore não aceita undefined (campo ${k})`);
    } else novo[k] = v;
  }
  return novo;
}

export function bancoFalsoCrm(inicial: Record<string, Record<string, any>> = {}) {
  const dados: Record<string, Record<string, any>> = structuredClone(inicial);
  const col = (n: string) => (dados[n] ||= {});
  let seq = 0;
  const falhas: { colecao?: string; vezes: number } = { vezes: 0 };

  const snapDoc = (n: string, id: string) => ({
    exists: id in col(n), id,
    data: () => (col(n)[id] ? structuredClone(col(n)[id]) : undefined),
    ref: docRef(n, id),
  });
  function docRef(n: string, id?: string): any {
    const did = id || `auto${++seq}`;
    return {
      id: did, _col: n,
      get: async () => snapDoc(n, did),
      set: async (v: any, o?: any) => { if (falhas.vezes > 0 && falhas.colecao === n) { falhas.vezes--; throw new Error('banco fora do ar'); } col(n)[did] = o?.merge ? aplicar(col(n)[did], v) : aplicar({}, v); },
      update: async (v: any) => { if (!(did in col(n))) throw new Error('não existe'); col(n)[did] = aplicar(col(n)[did], v); },
      create: async (v: any) => { if (did in col(n)) throw Object.assign(new Error('ALREADY_EXISTS'), { code: 6 }); col(n)[did] = aplicar({}, v); },
      delete: async () => { delete col(n)[did]; },
    };
  }
  const consulta = (n: string, f: [string, string, any][], ord: [string, 'asc' | 'desc'] | null = null, lim = 0, depois: any = null): any => ({
    where: (c: string, op: string, v: any) => consulta(n, [...f, [c, op, v]], ord, lim, depois),
    orderBy: (c: string, dir: 'asc' | 'desc' = 'asc') => consulta(n, f, [c, dir], lim, depois),
    limit: (x: number) => consulta(n, f, ord, x, depois),
    startAfter: (snap: any) => consulta(n, f, ord, lim, snap),
    get: async () => {
      let ids = Object.keys(col(n)).filter(id => f.every(([c, op, v]) => {
        const d = col(n)[id];
        return op === '==' ? d[c] === v : op === 'in' ? v.includes(d[c]) : false;
      }));
      if (ord) {
        // como o Firestore: documento sem o campo do orderBy não aparece
        ids = ids.filter(id => col(n)[id][ord[0]] !== undefined);
        ids.sort((a, b) => String(col(n)[a][ord[0]]).localeCompare(String(col(n)[b][ord[0]])) * (ord[1] === 'desc' ? -1 : 1));
        if (depois) { const i = ids.indexOf(depois.id); ids = ids.slice(i + 1); }
      }
      if (lim) ids = ids.slice(0, lim);
      const docs = ids.map(id => snapDoc(n, id));
      return { docs, empty: !docs.length, size: docs.length };
    },
  });
  const db: any = {
    dados, falhas,
    collection: (n: string) => ({
      doc: (id?: string) => docRef(n, id),
      add: async (v: any) => { const r = docRef(n); await r.set(v); return r; },
      ...consulta(n, []),
    }),
    runTransaction: async (fn: any) => {
      const escritas: (() => Promise<any>)[] = [];
      const tx = {
        get: (r: any) => r.get(),
        set: (r: any, v: any, o?: any) => { escritas.push(() => r.set(v, o)); },
        update: (r: any, v: any) => { escritas.push(() => r.update(v)); },
      };
      const out = await fn(tx);
      for (const e of escritas) await e();
      return out;
    },
  };
  return db;
}
