// De quem é o link curto: "Ver como" (modo olho). O admin ou a gerência que está vendo o app como um parceiro
// manda o uid dele; o link nasce no nome do parceiro e o pedido de orçamento do cliente cai com ele.
// Sem esta regra o link saía no uid do token REAL (o admin) e o lead ia para o Jeferson, não para o parceiro.
// Qualquer outro chamador que mande um uid é ignorado: ninguém gera link no nome de outra pessoa.

export const PAPEIS_QUE_VEEM_COMO = ['admin', 'manager'];
const UID_VALIDO = /^[A-Za-z0-9_-]{1,128}$/;

export async function donoDoLinkCurto(
  chamador: { uid: string; role?: string },
  uidPedido: unknown,
  parceiroAtivoExiste: (uid: string) => Promise<boolean>,
): Promise<string> {
  const pedido = typeof uidPedido === 'string' ? uidPedido.trim() : '';
  if (!pedido || pedido === chamador.uid) return chamador.uid;
  if (!PAPEIS_QUE_VEEM_COMO.includes(String(chamador.role || ''))) return chamador.uid;
  if (!UID_VALIDO.test(pedido)) return chamador.uid;
  try {
    return (await parceiroAtivoExiste(pedido)) ? pedido : chamador.uid;
  } catch {
    return chamador.uid;
  }
}
