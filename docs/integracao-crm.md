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
`mensagem` é lida quando falta o dado estruturado: só a que começa com "Em atendimento por" dá a vendedora (senão vale `dados.vendedora` ou o texto genérico "Em atendimento"); o motivo da recusa e da perda vêm dela (sem o prefixo "Negociação encerrada:"). Todo texto que o parceiro vê passa pelo filtro de segurança (nada de comissão, % ou nome de outro parceiro).
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

Tela Admin, cartão "CRM (Roder Vision)": **Simular carga** só conta ("N em negociação na carga; M pendentes irão como novas na virada");
**Enviar indicações abertas ao CRM** manda um `POST { "tipo": "carga_inicial", "itens": [...] }` com até 200 por clique (teto 500; aperte de
novo até zerar). Histórica: o CRM não manda aviso de "recebida" e vincula por CNPJ/CPF. A resposta
`{ ok, recebidos, vinculados, repetidos, ignorados }` aparece na tela; se vier só a contagem, o lote inteiro é marcado quando `ok: true`.
API: `GET /api/admin/crm/estado`, `POST /api/admin/crm/carga-inicial {simulacao, limite}` e `POST /api/admin/crm/reativar`, só admin.
**A carga exige só `CRM_CHAVE` (e `CRM_URL` se mudar): roda com `CRM_ATIVO` ainda desligado.** O endpoint de eventos continua 503 sem `CRM_ATIVO=1`.

Decisão (24/10/2026): **a carga leva SÓ as indicações `negotiating` (já aceitas)**, com "[Já estava em negociação no Roder Indica com X]"
na observação. `pending` e `triagem` NÃO entram: vão pelo laço normal, como indicação nova (com triagem no CRM), assim que `CRM_ATIVO=1`,
de qualquer idade e em lotes de 20 por rodada. As `sold` não vão (já faturadas).
Falha de transporte, 401, 403, 429 ou 5xx na carga NÃO conta tentativa nem desiste: só solta a reserva, e a carga pode ser repetida à vontade.
Só a recusa por item (`resultados[].ok: false`) conta tentativa daquela indicação.

O primeiro envio real da carga manual grava `carga_inicial_em` em `settings/crm_integracao` (o corte). Cargas repetidas só levam o que nasceu antes dele.
Sem carga manual, quem manda o histórico é o laço; quando ele termina (não resta `negotiating` anterior ao corte sem `crm_enviado_em`), grava `carga_inicial_em`
só se ainda estiver vazio. Não muda o corte, que já é `ativo_desde`.
O laço usa esse corte como `ativo_desde` e manda ao CRM tudo o que ainda não foi enviado, de qualquer idade: `pending` e `triagem` como indicação
nova (20 por rodada). **`negotiating` criada ANTES de `ativo_desde` (inclusive a `pending` que virou `negotiating` antes de ser enviada) NUNCA vai como
indicação normal, que o CRM triaria: vai no formato `{ tipo: "carga_inicial", itens }`, em lotes de até 100 por rodada, com a nota "[Já estava em
negociação...]" e sem `notificar_email`.** Se `CRM_ATIVO=1` e ainda há essas em negociação por enviar, o card Admin mostra um aviso
amarelo ("Carga inicial ainda não feita: N em negociação ainda não enviadas irão como histórico pelo laço") enquanto existirem `negotiating` anteriores ao corte
sem `crm_enviado_em`; ele some sozinho quando elas forem enviadas, pela carga manual ou pelo laço. `negotiating` criada depois da virada vai como nova, com a nota. Todo minuto lê as
últimas 72 h; a cada 15 minutos (ou enquanto ainda sobra fila) faz a varredura completa de todas as abertas, sem índice composto.
**Aviso por e-mail (`notificar_email`): só vai na indicação criada em ou depois de `ativo_desde`.** As antigas e as sobras vão SEM aviso, para não
gerar e-mail em massa na virada (o card Admin mostra "N pendentes irão como novas na virada, SEM aviso por e-mail").
Com `CRM_ATIVO=1` e chave configurada, o robô de triagem do Indica não atribui indicação ainda não enviada, mas nunca fica bloqueado sem fim: reassume se o
envio desistir (`crm_desistiu_em`), se passarem 24 h sem envio (contadas do mais recente entre `created_at` e `ativo_desde`) ou se houver mais de 20 falhas de
transporte seguidas (`crm_falhas_transporte`). O laço segue tentando; se o robô atribuir, a indicação vai ao CRM depois como `negotiating` (histórico, com a nota).

**Falhas, em todos os envios (fila, carga, atualização, comissão):** erro de rede, 401, 403, 408, 429 e 5xx NÃO contam tentativa nem causam desistência;
só reagendam com backoff (1 min até 6 h) e acendem o aviso vermelho do card Admin ("CRM recusou a chave (401)...", sem segredo), que some no primeiro
sucesso. Só a rejeição de validação (outros 4xx ou `ok:false`) conta tentativa, e depois de 10 a indicação desiste.

Depois de 10 falhas o laço desiste de uma indicação (`crm_desistiu_em`). O botão **Tentar de novo as que desistiram** do cartão zera isso
(indicações e comissões).

## status_indica e as vendidas na carga

Todo item de indicação enviado ao CRM (nova, lote e carga) leva `status_indica`: `pendente`, `triagem`, `em_negociacao`, `vendido`, `arquivado` ou `cancelado`
(do status do Indica: pending, triagem, negotiating, sold, archived, cancelled). Para `em_negociacao` a observação continua com "[Já estava em negociação no Roder Indica...]".

**A carga inicial inclui também as VENDIDAS (`sold`) com parceiro**, como histórico para o relatório do CRM, com `status_indica: "vendido"`, sem `notificar_email` e
nunca como indicação nova. Venda direta (`direct_factory` e afins) não entra. Arquivadas e canceladas ficam fora. Depois de enviada, a vendida não é reenviada.
As vendidas vão só pela carga manual do card Admin; o laço não as envia (nem como nova, nem como histórico).
Campos extras do item vendido (campo ausente é omitido, nunca `null` nem 0 inventado):

| Campo | Origem |
|---|---|
| `pedido_numero` | `sale_order_number` |
| `data_pedido` | `sale_order_date` (na falta, `sale_date`), AAAA-MM-DD no fuso de São Paulo |
| `data_faturamento` | `crm_faturado_em` (na falta, `sale_date`), AAAA-MM-DD |
| `previsao_entrega` | `delivery_date`, AAAA-MM-DD |
| `valor_total` | `sale_value` |
| `itens` | `[{codigo, nome, quantidade, valor}]`, `valor` unitário (de `commissioned_products`, ou de `items`) |
| `comissao` | `{valor_equipamento, percentual, valor_comissao, calculada_em, previsao_pagamento, paga_em}` |

Em `comissao`: `valor_equipamento` é a base comissionável líquida de desconto; `percentual` em pontos percentuais (2 = 2%); `previsao_pagamento` é o dia 7 do mês da
comissão; `paga_em` só existe se a comissão foi paga.
**Fase 2 e duplicidade:** a carga não marca nada na comissão. A fase 2 segue mandando `comissao` e `comissao_paga` normalmente para as comissões que ela lê (aguardando pagamento,
as mais novas e as dos últimos 14 dias); o CRM trata por `id_externo` + `pedido_numero`, então o reenvio é idempotente. As vendidas antigas, fora dessas janelas, chegam só pelo objeto
`comissao` da carga.

Simulação e card Admin mostram contagens separadas: em negociação, vendidas (histórico), pendentes/triagem (irão como novas na virada, sem aviso por e-mail), total da carga e próximo lote.

**Comissão marcada antes como "não se aplica":** ao enviar a vendida na carga, a marca `crm_nao_aplica_em` das comissões dela é limpa e `crm_aguardando_paga` é ligado, e a fase 2 manda `comissao` e `comissao_paga`.

**Conferência do faturado:** `valor_total` é comparado com a soma de `itens` (quantidade x `valor` unitário), menos `desconto`, mais `frete` (campos separados, no topo ou em `dados`),
com tolerância de R$ 0,05. `desconto` ou `frete` negativo ou não numérico também é divergência. Se não bater, o faturamento vai para conferência, sem comissão. `data_faturamento` e `previsao_entrega` são AAAA-MM-DD (São Paulo).

## Fase 2 (Indica para CRM, só com `CRM_ATIVO=1`)

Rotinas separadas da fila de novas (que roda a cada minuto e nunca espera por elas), só para indicações que já têm `crm_enviado_em`, sem índice
composto e com teto por rodada (30): `atualizacao` a cada **10 minutos**; `comissao` e `comissao_paga` a cada **5 minutos**.
Leitura das atualizações: o marcador de última rodada só avança depois de processar tudo; se a rodada parar pelo teto de 30, a seguinte relê a mesma janela e pega as sobras. A rodada normal lê só indicações com `updated_at` recente (a Central grava `updated_at` em toda nota) mais as que têm
retentativa marcada (`crm_atu_retry`); a cada 6 horas (e ao reiniciar) faz a varredura completa das **2000 indicações mais recentes** por `crm_enviado_em`.
Limite conhecido: nota que não mexa em `updated_at`, em indicação fora dessas 2000, não seria vista.

- `atualizacao`: só nota do PARCEIRO (`type` `note` ou `whatsapp`) escrita depois do envio. O app grava `author_uid` nas notas novas e o
  parceiro é reconhecido por `author_uid === external_seller_uid`; nota antiga sem `author_uid` só vale se o nome bater exatamente.
  Nunca vão: entradas do CRM (autor "CRM Roder"), automáticas do sistema ("Dados da negociação atualizados...", "Orçamento anexado...",
  mudanças de status), a observação da abertura e notas de outras pessoas (estas recebem a marca `crm_atualizacoes_ignoradas`).
  `id_mensagem` = `<id da indicação>:<id da entrada>` (estável). Anexos: até 10; só arquivo do Storage do PRÓPRIO projeto é reassinado por 24 h
  (outro bucket ou endereço externo não vai e o texto avisa); se a assinatura falhar vai a URL original, desde que o tamanho tenha sido
  conferido no Storage; mais de 20 MB, tamanho não conferido ou `data:` (guardado só no aparelho) não vão, com aviso no texto.
- `comissao`: quando a comissão é congelada (tela de faturamento ou evento do CRM). **`percentual` vai em pontos percentuais (2 = 2%)**;
  `valor_equipamento` é a base comissionável LÍQUIDA de desconto usada no cálculo, de modo que `valor_comissao = valor_equipamento x percentual / 100`
  (vem de `base_value_used`; na falta, outros campos só valem se baterem com taxa e valor a menos de R$ 0,01; senão a base é `valor_comissao / (taxa/100)`).
  Taxa ausente ou zero em comissão antiga: calculada de `valor_comissao / base`; se não der, a rotina espera (nunca manda 0). Sem
  `sale_order_number` na indicação a rotina espera. Se a comissão for corrigida depois, a rotina reenvia `tipo:"comissao"` atualizado (mesmo
  `id_externo` + `pedido_numero`; o CRM deve tratar por esses dois campos). **Se o número do pedido mudar depois do primeiro envio, os reenvios
  (e a `comissao_paga`) seguem com o número do primeiro envio** (`crm_comissao_pedido_numero`), para não duplicar no CRM, e a divergência é registrada
  no histórico interno da indicação. Nada de desconto nem de vendedor interno.
- `comissao_paga`: quando a comissão passa a `paid`; só depois da `comissao`.
- Leitura: `crm_aguardando_paga == true` (qualquer idade, então a "paga" nunca se perde), as 100 mais novas por `created_at` e as criadas ou atualizadas nos
  últimos 14 dias. Comissão já concluída (enviada, sem "paga" pendente, valores iguais ao do último envio, `crm_comissao_campos`) é pulada sem ler a indicação; `crm_aguardando_paga` fica ligado também quando a comissão já nasce paga. Comissão de indicação que nunca foi ao CRM recebe `crm_nao_aplica_em` e não é lida de novo.

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
2. Fim de semana: na tela Admin, Simular carga, conferir, Enviar até `restantes` chegar a 0 (conferir o resumo recebidos/vinculados/repetidos/ignorados).
3. Segunda, depois de o CRM ligar o destino: `CRM_ATIVO=1` e reiniciar. O laço manda como novas as `pending`/`triagem` e o que nasceu depois da carga; o endpoint de eventos e a fase 2 começam a funcionar.
4. Combinar com o CRM o mesmo segredo e o endereço `https://roderindica.com/api/crm/eventos`.
5. Acompanhar o log (`[CRM-ENVIO]`, `[CRM-FASE2]`, `[CRM-EVENTOS]`). Voltar atrás: apagar `CRM_ATIVO`.

## Limites conhecidos

- Não há baixa automática de estoque nem pesquisa de qualidade pós-entrega no `pedido.faturado` (a tela faz isso no Faturar).
- E-mails ao parceiro (como `notifyStatusChange`) não saem pelos eventos; só a notificação dentro do app.

## Roder Vision -> Indica: estoque semanal e importações (POST /api/public/hooks/estoque)

- Autenticação: cabeçalho `x-roder-chave` igual à variável `VISION_CHAVE` (Hostinger) ou uma chave ativa em `api_keys` com `permissions.estoque_escrita = true`.
- Estoque: `{ tipo:"estoque", origem, filial, enviado_em, itens:[{ codigo, descricao, quantidade }] }`. Origem: roder, fae, accessories, manual, sinop_pdf. Filial: matriz, sinop. Cada envio substitui só aquela origem + filial, com as mesmas regras da tela Estoque > Atualizar (duplicata vale a maior; igual ignora; 0 ou sumido remove, exceto com reserva ativa, que fica com 0; novo cria). Resposta `{ ok, origem, filial, criados, atualizados (= alterados), removidos, mantidos_por_reserva, ignorados }`.
- Importações: `{ tipo:"importacoes", enviado_em, itens:[{ descricao, quantidade, embarque, chegada }] }`, datas AAAA-MM-DD. Substitui a lista inteira; item com reserva ativa nunca é apagado. Resposta `{ ok, itens, criados, atualizados (= alterados), removidos, reservas_preservadas }`.
- A tela antiga do Indica continua funcionando. Código: `server/estoqueVision.ts`, regras em `src/lib/estoqueVision.ts`, testes em `testes-servidor/estoque-vision.test.ts`.
