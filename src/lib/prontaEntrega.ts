// Pronta entrega: quais equipamentos do catálogo estão no estoque agora.
// Usado na tela inicial do parceiro e no Consultor (parceiro e equipe), para os dois
// mostrarem exatamente a mesma lista. Só usa o que o estoque público já mostra
// (código, descrição e quantidade do estoque; nome, foto e máquina base do catálogo):
// nada de preço.
import { frasePara, perfilInstalacao } from './instalacao';
import { tituloFicha } from './tituloFicha';

export type ItemProntaEntrega = {
  chave: string; // `${produto.id}:${modelo.id}`
  produto: any;
  modelo: any;
  nome: string;
  foto?: string;
  para: string; // "Para escavadeiras de 12 a 18 t"
};

const so = (t: any) => String(t || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

// O código do estoque casa com o código Roder do modelo; sem código, o nome do modelo
// inteiro, com fronteira ("CMF 50" não casa com "CMF500", "R250" não casa com "R2500").
export function montarProntaEntrega(estoque: any[], produtos: any[], limite = 10): ItemProntaEntrega[] {
  const achados: ItemProntaEntrega[] = [];
  const vistos = new Set<string>();
  for (const item of estoque || []) {
    if (!(Number(item?.quantity) > 0)) continue;
    const cod = so(item.code);
    const desc = ` ${String(item.description || '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ')} `;
    for (const p of produtos || []) {
      if (!p || p.is_blocked) continue;
      for (const m of (p.models || [])) {
        const codModelo = so(m.technical_specs?.codigo_roder || m.codigo_roder);
        const partes = String(m.name || '').toUpperCase().match(/[A-Z]+|\d+/g) || [];
        const nomeOk = partes.length > 0 && /\d/.test(partes.join('')) && partes.join('').length >= 4;
        const casouNome = nomeOk && new RegExp(`(^|[^A-Z0-9])${partes.join('\\s*')}([^A-Z0-9]|$)`).test(desc);
        const casou = (codModelo && cod && codModelo === cod) || casouNome;
        if (!casou) continue;
        const chave = `${p.id}:${m.id}`;
        if (vistos.has(chave)) continue;
        vistos.add(chave);
        // mesmo título da ficha: "Garras Florestais" + "R400" vira "Garra Florestal R400"
        const nome = tituloFicha(p, m);
        const foto = (m.images || []).find((i: string) => i && !/\.run\.app\//.test(i)) || m.image_url || p.image_url;
        const specs = m.technical_specs || {};
        achados.push({ chave, produto: p, modelo: m, nome, foto, para: frasePara(perfilInstalacao(`${p.name} ${m.name}`, specs), `${p.name} ${m.name}`, specs.maquina_base) });
      }
    }
  }
  return achados.slice(0, limite);
}

// O equipamento da conversa está na pronta entrega?
export function itemProntoDe(lista: ItemProntaEntrega[], produtoId?: string, modeloId?: string): ItemProntaEntrega | null {
  if (!produtoId || !modeloId) return null;
  return lista.find(i => i.chave === `${produtoId}:${modeloId}`) || null;
}
