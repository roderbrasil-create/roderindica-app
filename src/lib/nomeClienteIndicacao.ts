// Nome do cliente de uma indicação. O cadastro pode trazê-lo em campos diferentes (pessoa, empresa,
// contato): as telas do parceiro liam só client_name e mostravam "Cliente" quando ele vinha vazio.
export function nomeClienteIndicacao(ind: any, vazio = 'Cliente'): string {
  const nome = [ind?.client_name, ind?.client_company_name, ind?.company_name, ind?.client_person_name, ind?.client_contact_name]
    .map((v: any) => String(v || '').trim()).find(Boolean);
  return nome || vazio;
}
