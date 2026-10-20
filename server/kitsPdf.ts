// Leitor do relatório "Estruturas - Nível a Nível" do ERP (DBCorp PCR) com os kits de instalação.
// Serve para o texto vindo de qualquer extrator de PDF: com colunas alinhadas (pdftotext -layout) ou
// com uma célula por linha (pdf-parse, o que o servidor usa), porque a unidade e a quantidade podem
// vir na mesma linha do item, na linha de baixo ou depois de uma descrição quebrada em várias linhas.
// Itens repetidos no mesmo kit continuam separados (o ERP tem 4 kits com o mesmo item em duas linhas).
export interface KitLido { code: string; description: string; items: { code: string; description: string; quantity: number }[] }

const RE_COD = '\\d{4}\\.\\d{4}\\.\\d{4}';
const RE_CABECALHO_KIT = new RegExp(`^(${RE_COD})\\s+(.*)$`);
const RE_ITEM = new RegExp(`^\\d+\\s+\\d+\\s+(${RE_COD})\\s*(.*)$`);
// "UN 1,000000 11/06/2022 [fim]" no fim da linha, com o começo opcional (descrição)
const RE_FIM_ITEM = /^(.*?)\s*(?:^|\s)(?:UN|PC|MT|PAR|KG|CJ|LT|JG|PCT|CX|M2|M3|M|L|GR|RL)\s+([\d.]*\d,\d{1,6})\s+\d{2}\/\d{2}\/\d{4}(?:\s+\d{2}\/\d{2}\/\d{4})?$/;
const RE_LIXO = /^(Roder M[aá]quinas|Quant\. Item Pai|N[ií]vel\b|Item(\s+UN(\s+Vers[aã]o)?)?$|UN$|Vers[aã]o$|\d{2}\/\d{2}\/\d{4}(\s+\d{2}:\d{2})?$)|--\s*\d+\s+of\s+\d+\s*--|Filtros:|DBCorp PCR|Relat[oó]rio de Estruturas/i;

const limpa = (t: string) => t.replace(/\s+/g, ' ').trim();
const numero = (t: string) => parseFloat(t.replace(/\./g, '').replace(',', '.'));

export function parseKitsText(texto: string): KitLido[] {
  const kits: KitLido[] = [];
  let kit: KitLido | null = null;
  let item: { code: string; partes: string[] } | null = null; // item ainda sem unidade e quantidade
  let noTitulo = false; // entre o cabeçalho do kit e a linha "Nível": o título pode quebrar em várias linhas

  const fecha = (qtd: number) => {
    if (kit && item) kit.items.push({ code: item.code, description: limpa(item.partes.join(' ')), quantity: Number.isFinite(qtd) && qtd > 0 ? qtd : 1 });
    item = null;
  };
  const semUnidadeDoKit = (t: string) => t.replace(/\s*\bUN\s+\d+$/i, '');

  for (const bruta of String(texto || '').split(/\r?\n/)) {
    const linha = limpa(bruta);
    if (!linha) continue;
    if (/^N[ií]vel\b/i.test(linha)) { noTitulo = false; continue; }
    if (RE_LIXO.test(linha)) continue;

    const ehItem = RE_ITEM.exec(linha);
    if (ehItem) {
      if (!kit) continue;
      noTitulo = false;
      item = { code: ehItem[1], partes: [] };
      const resto = ehItem[2];
      const fim = RE_FIM_ITEM.exec(resto);
      if (fim) { if (limpa(fim[1])) item.partes.push(fim[1]); fecha(numero(fim[2])); }
      else if (resto) item.partes.push(resto);
      continue;
    }

    const ehKit = RE_CABECALHO_KIT.exec(linha);
    if (ehKit && !item) {
      kit = { code: ehKit[1], description: limpa(semUnidadeDoKit(ehKit[2])), items: [] };
      kits.push(kit);
      noTitulo = true;
      continue;
    }

    if (item) {
      // descrição quebrada antes da unidade (pdf-parse) ou a linha com a unidade e a quantidade
      const fim = RE_FIM_ITEM.exec(linha);
      if (fim) { if (limpa(fim[1])) item.partes.push(fim[1]); fecha(numero(fim[2])); }
      else item.partes.push(linha);
    } else if (kit && noTitulo) {
      const t = limpa(semUnidadeDoKit(linha));
      if (t) kit.description = limpa(`${kit.description} ${t}`);
    } else if (kit && kit.items.length) {
      // texto solto depois de um item já fechado (colunas alinhadas): é o resto da descrição dele
      const ultimo = kit.items[kit.items.length - 1];
      ultimo.description = limpa(`${ultimo.description} ${linha}`);
    }
  }
  return kits;
}
