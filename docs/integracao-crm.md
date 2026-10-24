# Integração Roder Indica e CRM (Roder Vision)

Desligada por padrão. Nada é enviado nem aceito enquanto `CRM_ATIVO` não for `1`, e o Agendor já está
desligado no app (as rotas `/api/agendor/*` foram removidas antes; os campos `agendor_*` da indicação
ficam só como histórico). Ao ligar, a indicação nova vai só ao CRM.

## Variáveis de ambiente (Hostinger)

| Variável | Para que serve |
|---|---|
| `CRM_ATIVO` | `1` liga a integração (a virada). Sem ela, tudo fica como está. |
| `CRM_CHAVE` | Vai no cabeçalho `x-roder-chave` ao enviar indicações. Em teste, a chave de teste do CRM. |
| `CRM_SEGREDO` | Segredo do HMAC dos eventos que voltam do CRM. Sem ele o endpoint responde 503. |
| `CRM_URL` | Opcional. Padrão `https://roder-vision.lovable.app/api/public/hooks/crm-entrada`. Aceita só https (ou http em localhost). |
| `CRM_ATIVO_DESDE` | Opcional, data ISO. Sem ela vale `settings/crm_integracao.ativo_desde`, gravado sozinho na primeira rodada com a integração ligada. |
| `CRM_NOTIFICAR_EMAIL` | Opcional. Vai em `notificar_email` nas indicações novas (não na carga inicial). |

Nenhum valor fica no código.

## Indica para CRM (nova indicação)

- Laço de 1 minuto no servidor (`server/crmEntrada.ts`, agendado em `server.ts`). Lê (`where created_at >= janela orderBy created_at`, até 500) as indicações criadas nas últimas
  72 horas, nunca antes da data da virada, e filtra em memória (sem índice composto,
  porque `== null` não casa campo inexistente).
- Envia `POST CRM_URL` com `x-roder-chave`. Corpo: `id_externo` (id do doc em `indications`), `nome`, `empresa`, `cnpj`,
  `telefone`, `email`, `cidade`, `uf`, `produto`, `observacao`, `parceiro {id (uid), nome, telefone, email}`, `criado_em`.
- 2xx grava `crm_enviado_em` e `crm_id`. Falha grava `crm_tentativas`, `crm_ultimo_erro` (só "HTTP 500" ou erro de rede,
  nunca a chave) e `crm_proxima_tentativa_em`. Backoff de 1, 2, 4, 8 minutos até 6 horas; depois de 10 tentativas grava
  `crm_desistiu_em`. `crm_reservado_ate` impede dois envios simultâneos da mesma indicação.
- Só status `pending`, `triagem` e `negotiating`. Ficam de fora `sold`, `cancelled`, `archived`, `new` e
  as conversas do consultor digital (`creator_type: visitor`).
- Com o CRM ligado, o robô de 4 horas úteis que distribuía lead pendente no Indica deixa de distribuir o que o CRM já tem
  (a triagem passa a ser lá).

## CRM para Indica (andamento)

`POST https://roderindica.com/api/crm/eventos`, corpo `{ id, evento, em, id_externo, parceiro_id, status, mensagem, dados }`.
Os campos do evento (`pedido_numero`, `cnpj`, `data_pedido`, `previsao_entrega`, `data_faturamento`, `nota_fiscal`, `valor_total`, `itens`, `motivo`, `etapa`, `vendedora`) valem no topo do corpo ou dentro de `dados` (`dados` prevalece).
`mensagem` é lida quando falta o dado estruturado: "Em atendimento por X" dá a vendedora, o motivo da recusa e da perda vêm dela (sem o prefixo "Negociação encerrada:"). Todo texto que o parceiro vê passa pelo filtro de segurança (nada de comissão, % ou nome de outro parceiro).
`itens` é `[{codigo, nome, quantidade, valor}]` com `valor` UNITÁRIO. Datas `AAAA-MM-DD` valem o dia de America/Sao_Paulo.
Cabeçalhos `X-Roder-Timestamp` e `X-Roder-Assinatura: sha256=` + HMAC-SHA256(`CRM_SEGREDO`, `timestamp + "." + corpo cru`) em hex.
O timestamp pode ser segundos, milissegundos ou ISO, e é usado exatamente como veio na conta do HMAC.

- 503 sem `CRM_ATIVO=1` ou sem `CRM_SEGREDO`; 401 assinatura inválida ou timestamp a mais de 5 minutos; 400 corpo
  inválido; 200 aplicado, ignorado (com `motivo`) ou repetido; 500 erro transitório (o CRM reenvia).
- Idempotente: cada `id` processado fica em `crm_eventos/{id}` (com resultado e dados, só o servidor lê). As linhas do
  histórico também têm id fixo `crm-{id do evento}`, então um reprocessamento nunca duplica.
- `parceiro_id` é obrigatório e tem de ser o uid da indicação em `pedido.faturado`, `pedido.lancado`, `negocio.ganho`,
  `negocio.perdido`, `indicacao.aceita` e `indicacao.recusada`; ausente ou diferente é ignorado (200, motivo `parceiro_diferente`).
- Estorno também vale quando está só no histórico ("ESTORNO DE FATURAMENTO"): nunca ganha comissão nova pelo CRM.
- Um `pedido.faturado` novo enquanto a indicação espera conferência vale como o último; o anterior fica em `crm_eventos/{id}.substituiu`.
- Evento que regrediria o status é ignorado e fica só no log. Evento para `id_externo` inexistente ou com `parceiro_id`
  diferente do da indicação também (200 com o motivo).

| Evento | Efeito na indicação |
|---|---|
| `indicacao.recebida` | Só histórico "Indicação recebida". |
| `indicacao.aceita` | Como a Triagem ao encaminhar: `negotiating`, vendedora (`dados.vendedora` como texto ou `{nome, email, uid}`, casada com o cadastro), "Em atendimento por X", notifica vendedora e parceiro. A proteção de 60 dias da criação continua; só nasce se faltar. |
| `indicacao.recusada` | Como a Triagem ao arquivar: `archived`, `dados.motivo` curto, notifica o parceiro. |
| `indicacao.vinculada` | `negotiating` (cliente já atendido pela Roder). |
| `negocio.etapa` | Histórico "Etapa: X" (`dados.etapa`). |
| `proposta.enviada` | `dados.numero`, `dados.data`, `dados.valor`: `budget_loaded`, `budget_number`, `budget_date`, `gross_budget_value`, `budget_sent_at`, proteção de 60 dias do envio (nunca encurta), "Orçamento enviado", notifica na primeira. |
| `pedido.lancado` | `sale_order_number`, `sale_order_date`, itens em `commissioned_products`, histórico. |
| `pedido.faturado` | Como Faturar: `sold`, comissão congelada, ver abaixo. |
| `negocio.ganho` | Só histórico (e `crm_ganho_valor`). Não cria comissão. |
| `negocio.perdido` | `cancelled` com o motivo, notifica o parceiro. |

Texto do parceiro: o motivo de recusa, perda e o nome da etapa passam por filtro. Se citar parceiro, "indicado por",
e-mail, telefone, valor ou comissão, troca por texto genérico ("Indicação não aceita pela Roder.", "Negócio não concluído.").
O parceiro nunca vê percentual de comissão.

### pedido.faturado e a comissão

`dados`: `numero`, `cnpj`, `data_pedido`, `data_faturamento`, `previsao_entrega`, `itens [{codigo, nome, quantidade, valor}]`.
`valor` é o valor UNITÁRIO de cada item (se vier só `valor_total` no item, o Indica divide pela quantidade).
Vai para conferência, sem comissão, o pedido em que `valor_total` do item é igual a `valor` com quantidade maior que 1
(ambíguo), ou em que a soma de quantidade x valor não bate com o `valor_total` (ou `total`) do pedido, quando ele vier.
Valores são arredondados em centavos no caminho do CRM (base 166809 x 2% = 3336,18).

Mesma conta de `src/lib/calculoComissao.ts`: taxa do cadastro do parceiro (`taxaDoParceiro`, padrão 2%), kit 9000 e
serviços (frete, montagem, instalação...) fora da base, mês de pagamento por `mesDaComissao(previsao_entrega)`,
documento `commissions/{id da indicação}` com status `waiting_nf`. Aviso ao financeiro 2 dias depois, como na tela.

Regra de cada item, nesta ordem: kit/serviço (fora); decisão do vendedor naquele código dentro da indicação
(`commissioned_products`); cadastro do produto (`registered_products.is_commissionable`, ausente = conta); senão, SEM REGRA.

Com item sem regra, sem itens, base zero, parceiro sem cadastro, ou indicação estornada, o Indica NÃO cria comissão e NÃO
muda o status: grava `faturamento_aguardando_conferencia: true` (aparece como "Faturado no CRM: conferir" na Central de
Negociações), notifica administrador, gerência e financeiro, e guarda o detalhe em `crm_eventos/{id}.conferencia`.
Quem confere usa Finalizar Faturamento na Central, que limpa a marca. Se a comissão já existe (ou `estornado_em` existe),
nada é recriado nem sobrescrito. Venda sem parceiro comissionável vira `sold` sem comissão.

## Carga inicial (administrador)

Tela Admin, cartão "CRM (Roder Vision)": **Simular carga** só conta; **Enviar indicações abertas ao CRM** manda um
`POST { "tipo": "carga_inicial", "itens": [...] }` com até 200 indicações por clique (teto 500; aperte de novo até zerar).
Histórica: o CRM não manda aviso de "recebida" e vincula por CNPJ/CPF. A resposta `{ ok, recebidos, vinculados, repetidos, ignorados }`
aparece na tela; se vier só a contagem, o lote inteiro é marcado como enviado quando `ok: true`.
API: `GET /api/admin/crm/estado` e `POST /api/admin/crm/carga-inicial {simulacao, limite}`, só admin.
**A carga exige só `CRM_CHAVE` (e `CRM_URL` se mudar): roda com `CRM_ATIVO` ainda desligado.** O endpoint de eventos
continua 503 sem `CRM_ATIVO=1`.

Decisão: vão `pending`, `triagem` e `negotiating` ainda não enviadas. As `sold` NÃO vão: já estão faturadas no Indica e
entrariam no CRM como lead novo na triagem. As em negociação levam na observação "[Já estava em negociação no Roder Indica
com X]". O primeiro envio real grava `carga_inicial_em` em `settings/crm_integracao`: é o corte. Cargas repetidas só levam
o que nasceu antes dele; o que nasce depois é do laço, que ao ligar o `CRM_ATIVO=1` usa esse corte como `ativo_desde` e envia como
indicação nova (com triagem), sem buraco entre a carga e a virada.

## Fase 2 (Indica para CRM, só com `CRM_ATIVO=1`)

Rodam no laço de 1 minuto, só para indicações que já têm `crm_enviado_em`, com o mesmo backoff (1 min até 6 h, 10 tentativas), sem índice composto.

- `atualizacao`: entradas do histórico escritas pelo PARCEIRO depois do envio. Nunca volta o que veio do CRM (autor "CRM Roder", ids `crm-`).
  `id_mensagem` = `<id da indicação>:<id da entrada>` (estável: reenviar não duplica). Anexos: até 10; URL do Firebase Storage é
  reassinada por 24 h (se falhar, vai a URL original); anexo maior que 20 MB ou guardado só no aparelho (`data:`) não vai e o texto avisa.
  Marcas na indicação: `crm_atualizacoes_enviadas`, `crm_atu_falha_<id>`, `crm_atualizacoes_desistiu`.
- `comissao`: quando a comissão é congelada (tela de faturamento ou evento do CRM): pedido, parceiro, valor do equipamento, percentual,
  valor, data de cálculo e previsão de pagamento (dia 7 do mês da comissão). Nada de desconto nem de vendedor interno.
  Marca: `crm_comissao_enviada_em`.
- `comissao_paga`: quando a comissão passa a `paid`. Marca: `crm_paga_enviada_em`. Só vai depois da `comissao`.

## Como testar com a chave de teste

1. No servidor de teste: `CRM_ATIVO=1`, `CRM_CHAVE=<chave de teste>`, `CRM_SEGREDO=<segredo de teste>`.
2. Cadastre uma indicação como parceiro. Em até 1 minuto ela aparece no CRM de teste; a indicação ganha `crm_enviado_em`.
3. Painel Admin: Simular carga, depois enviar.
4. Evento de volta, sem o CRM (troque `ID` pelo id da indicação):

```
CORPO='{"id":"teste-1","evento":"indicacao.aceita","em":"2026-10-26T12:00:00Z","id_externo":"ID","parceiro_id":"UID","dados":{"vendedora":"Heloisa"}}'
TS=$(date +%s)
SIG=sha256=$(printf '%s.%s' "$TS" "$CORPO" | openssl dgst -sha256 -hmac "$CRM_SEGREDO" -hex | sed 's/^.* //')
curl -X POST https://roderindica.com/api/crm/eventos -H "X-Roder-Timestamp: $TS" -H "X-Roder-Assinatura: $SIG" -H 'Content-Type: application/json' -d "$CORPO"
```

Repetir o mesmo `id` responde 200 `duplicado`.

## Virada (carga no fim de semana 24-25/10, CRM ligado na segunda 26/10/2026)

1. Configurar na Hostinger `CRM_CHAVE` (de produção) e `CRM_SEGREDO`, com `CRM_ATIVO` vazio (ou 0). Reiniciar.
2. Fim de semana: na tela Admin, Simular carga, conferir o número, Enviar até `restantes` chegar a 0 (conferir o resumo recebidos/vinculados/repetidos/ignorados).
3. Segunda, depois de o CRM ligar o destino: `CRM_ATIVO=1` e reiniciar. O laço passa a enviar o que nasceu depois da carga, e o endpoint de eventos e a fase 2 começam a funcionar. Uma nova carga pode ser rodada para sobras.
4. Combinar com o CRM o mesmo segredo e o endereço `https://roderindica.com/api/crm/eventos`.
5. Acompanhar o log (`[CRM-ENVIO]`, `[CRM-FASE2]`, `[CRM-EVENTOS]`). Voltar atrás: apagar `CRM_ATIVO`.

## Limites conhecidos

- Não há baixa automática de estoque nem pesquisa de qualidade pós-entrega no `pedido.faturado` (a tela faz isso no Faturar).
- E-mails ao parceiro (como `notifyStatusChange`) não saem pelos eventos; só a notificação dentro do app.
