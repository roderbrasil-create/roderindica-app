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

`POST https://roderindica.com/api/crm/eventos`, corpo `{ id, evento, em, id_externo, parceiro_id, dados }`.
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

Tela Admin, aba de configurações, cartão "CRM (Roder Vision)": **Simular carga** só conta; **Enviar indicações abertas ao CRM**
manda até 40 por clique (pode apertar de novo até zerar). API: `GET /api/admin/crm/estado` e
`POST /api/admin/crm/carga-inicial {simulacao, limite}`, ambas só para admin.

Decisão: vão `pending`, `triagem` e `negotiating` ainda não enviadas. As `sold` NÃO vão: já estão faturadas no Indica e
entrariam no CRM como lead novo na triagem. As em negociação levam na observação "[Já estava em negociação no Roder Indica
com X]" para ninguém triar de novo. Se um relatório precisar das vendidas, é uma rotina à parte.

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

## Virada (segunda, 26/10/2026)

1. Configurar `CRM_CHAVE` (de produção) e `CRM_SEGREDO` na Hostinger, com `CRM_ATIVO` ainda vazio.
2. Combinar com o CRM o mesmo segredo e o endereço `https://roderindica.com/api/crm/eventos`.
3. Ligar `CRM_ATIVO=1` e reiniciar. A primeira rodada grava a data da virada.
4. Na tela Admin: Simular carga, conferir o número, enviar até zerar.
5. Acompanhar o log do servidor (`[CRM-ENVIO]`, `[CRM-EVENTOS]`). Voltar atrás: apagar `CRM_ATIVO` (volta ao comportamento anterior; o que já foi enviado fica no CRM).

## Fora desta fase (ganchos em `server/crmEntrada.ts`)

Atualizações do parceiro com áudio e fotos (`atualizacao`) e envio de comissão (`comissao`, `comissao_paga`).

## Limites conhecidos

- Não há baixa automática de estoque nem pesquisa de qualidade pós-entrega no `pedido.faturado` (a tela faz isso no Faturar).
- E-mails ao parceiro (como `notifyStatusChange`) não saem pelos eventos; só a notificação dentro do app.
