import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';

// Kit 9000.9000.9044 alterado para o pedido de exportação (Jeferson, 27/11/2026).
// O Rogério (ERP) cadastra os códigos que faltam; quando o PDF novo do ERP for carregado em
// Acessórios, a comparação ajusta tudo conforme o PDF e os códigos provisórios abaixo saem sozinhos.
type Item = { code: string; description: string; quantity: number };

export const KIT_9044 = '9000.9000.9044';
export const DESCRICAO_KIT_9044 = 'KIT INSTALACAO CMF500/600 + LINCK ESCAVADEIRA CAT 320GC - ( MAQUINA COM FATIA EXTRA DUPLA SEM LINHA)';

// Saem: caixa elétrica 0053 (troca pela 0016), manopla, comando SDS180/2, adaptadores 0284 e 0307,
// chapa e suporte de comando e as três mangueiras de 2000 mm (viram 2600 mm).
export const SAEM_9044 = [
  '5000.1001.0053', '5000.1001.0018', '3000.5003.0100', '3000.5000.0284', '3000.5000.0307',
  '2000.1000.4166', '2000.1000.4165', '3000.5001.1134', '3000.5001.1110', '3000.5001.1042',
];

export const QUANTIDADE_9044: Record<string, number> = {
  '3000.5001.1188': 4, '3000.5000.0398': 6, '3000.5000.0276': 4, '3000.5000.0324': 4, '3000.5000.0294': 4,
};

const PROVISORIO = '[CÓDIGO A CADASTRAR NO ERP] ';
export const ENTRAM_9044: Item[] = [
  { code: '5000.1001.0016', description: 'CAIXA ELETRICA PARA KIT DE ACIONAMENTO ESCAVADEIRA PARA', quantity: 1 },
  { code: '3000.5000.0334', description: 'ADAPTADOR TEE FEMEA LATERAL 1.1/16 JIC (descrição a conferir no ERP)', quantity: 2 },
  { code: '3000.5003.0188', description: 'VALVULA CONTROLE FLUXO BI-DIRECIONAL 3/4 BSP', quantity: 2 },
  { code: '3000.5000.0362', description: 'ENGATE RAPIDO MACHO FACE PLANA 9/16 UNF-14 - CORPO 1/4', quantity: 1 },
  { code: '3000.5000.0361', description: 'ENGATE RAPIDO FEMEA FACE PLANA 9/16 UNF-14 - CORPO 1/4', quantity: 1 },
  { code: '3000.5000.0308', description: 'Adaptador macho/macho 1/2 NPT x 7/8 JIC', quantity: 2 },
  { code: '3000.5000.0501', description: 'ADAPTADOR MACHO/MACHO 3/4 BSP X 1.3/16 PLANO', quantity: 2 },
  { code: '3000.5000.0291', description: 'ADAPTADOR MACHO/MACHO 1/4 BSPP PARALELO COM ANEL VEDACAO ED X 9/16 JIC', quantity: 2 },
  { code: 'A-CADASTRAR-01', description: PROVISORIO + '3/4R12 - 1650 MM X FG GIRATORIA 1.3/16 PLANO X FG 1.1/16 JIC', quantity: 2 },
  { code: 'A-CADASTRAR-02', description: PROVISORIO + 'ADAPTADOR TEE FEMEA LATERAL 1.3/16 PLANO, ROSCA CENTRAL 3/8 BSP', quantity: 2 },
  { code: 'A-CADASTRAR-03', description: PROVISORIO + '3/4R12 - 2600 MM X FG 1.1/16 JIC X FG 3/4 BSP BOL (no lugar da 3000.5001.1134)', quantity: 2 },
  { code: 'A-CADASTRAR-04', description: PROVISORIO + '1/2 R2 - 2600 MM X FG 7/8 JIC X FG 1/2 BSP BOL (no lugar da 3000.5001.1110)', quantity: 3 },
  { code: 'A-CADASTRAR-05', description: PROVISORIO + '3/8 R2 - 2600 MM X FG 9/16 JIC X FG 9/16 JIC (no lugar da 3000.5001.1042)', quantity: 1 },
];

/** Devolve o kit alterado. Pode rodar de novo sem duplicar nada (mexe por código). */
export function aplicarAlteracaoKit9044<K extends { description: string; items: Item[] }>(kit: K): K {
  const saem = new Set(SAEM_9044);
  const visto = new Set<string>();
  const items: Item[] = [];
  for (const it of kit.items || []) {
    if (saem.has(it.code)) continue;
    // o ERP traz alguns itens em duas linhas: fica uma só, com a quantidade nova
    if (visto.has(it.code)) continue;
    visto.add(it.code);
    items.push(it.code in QUANTIDADE_9044 ? { ...it, quantity: QUANTIDADE_9044[it.code] } : { ...it });
  }
  for (const novo of ENTRAM_9044) {
    const i = items.findIndex(x => x.code === novo.code);
    if (i >= 0) items[i] = { ...items[i], quantity: novo.quantity };
    else items.push({ ...novo });
  }
  return { ...kit, description: DESCRICAO_KIT_9044, items };
}

// Roda UMA vez (a marca em settings impede de refazer sobre uma edição posterior). Só o admin escreve em settings.
export async function alterarKit9044UmaVez(kits: { id: string; code: string; description: string; items: Item[] }[], db: any) {
  try {
    const marca = doc(db, 'settings', 'migracao_kit_9044_exportacao');
    if ((await getDoc(marca)).exists()) return;
    const kit = kits.find(k => k.code?.trim() === KIT_9044);
    // catálogo ainda não carregado: tenta na próxima vez, sem gravar a marca
    if (!kit?.id) return;
    const novo = aplicarAlteracaoKit9044(kit);
    await updateDoc(doc(db, 'installation_kits', kit.id), { description: novo.description, items: novo.items });
    await setDoc(marca, { feito_em: new Date().toISOString(), kit: kit.id, itens: novo.items.length });
  } catch (err) {
    console.error('Alteração do kit 9044 falhou:', err);
  }
}
