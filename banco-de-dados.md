# Banco de dados — Salgadaria (Supabase)

Este documento descreve **apenas a estrutura do banco**. O banco já está criado e configurado no Supabase. **Não crie nem altere tabelas, políticas ou funções** sem pedir. O front-end deve se adaptar a esta estrutura.

- **Banco:** Supabase (Postgres), plano gratuito
- **Cliente JS:** `@supabase/supabase-js`, com a chave **publishable** (`sb_publishable_...`)
- **Variáveis:** `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **Proibido:** usar a chave secreta (`sb_secret_...`) no navegador

---

## 1. Como a salgadaria vende

- **Salgados não são vendidos avulsos.** O cliente compra **pacotes**:

  | pacote | salgados | sabores ("qualidades") | preço base (fritos) | só assados |
  |---|---|---|---|---|
  | 30 salgados | 30 | até 2 | R$ 23,90 | — (usa a regra de mistura) |
  | 50 salgados | 50 | até 3 | R$ 37,90 | R$ 45,00 |
  | Cento (100 salgados) | 100 | até 4 | R$ 75,00 | R$ 90,00 |

- Cada pacote pedido é **congelado** (o cliente frita em casa) ou **pronto para comer**.
- Os sabores têm três tipos:
  - **frito**: preço base;
  - **assado**: tem acréscimo;
  - **variado** (mini pastel, mini churros, palito de queijo): tem acréscimo e **só sai pronto para comer**.
- O acréscimo de cada sabor fica no banco (`acrescimo_percentual`). **O site nunca mostra percentual, nem diz que assado é mais caro.** Ele mostra só o preço final, calculado pelo banco.
- **Refrigerantes** são vendidos por unidade, à parte dos pacotes, e não têm imagem.

**Horário e agendamento** (tudo validado pelo banco, horário de Brasília):
- A loja tem um **horário de atendimento** por dia da semana (`horarios_funcionamento`) e **dias fechados** (`dias_fechados`).
- **Dentro do horário**, o cliente escolhe "**Agora**" (entrega ou retirada) ou "**Agendar**".
- **Fora do horário**, o pedido **só pode ser agendado**.
- **Agendamento em horários de 30 em 30 minutos**, a partir da abertura de cada faixa.
  - O último horário é 30 min antes de fechar.
  - **Cada horário atende só UM pedido.** Garantido por índice único: dois clientes nunca pegam o mesmo horário, nem clicando ao mesmo tempo.
  - Pedido cancelado libera o horário.
  - Para agendar no mesmo dia, é preciso **pelo menos 1 hora de antecedência**.
  - Dá para agendar até 90 dias à frente.
- **Entrega só até 100 salgados** (1 cento). **Acima de 100**, o pedido é **só retirada no local** e **precisa ser agendado a partir do dia seguinte**.
- **Assados prontos** precisam ser **agendados a partir do dia seguinte**.

**Frete (só entrega):**
- A loja fica na Rua Miguel de Moraes, 377 - Jardim Europa, **Ourinhos-SP**, CEP 19914-300. Entrega **só em Ourinhos**.
- O frete é calculado pela **distância em linha reta** até a loja:

  | distância | frete |
  |---|---|
  | até 2 km | R$ 5,00 |
  | até 4 km | R$ 7,00 |
  | até 6 km | R$ 10,00 |
  | acima de 6 km | R$ 12,00 |

  As faixas ficam na tabela `faixas_frete` e o admin edita pelo painel.
- **Fluxo:**
  1. O cliente informa rua, número e vila (CEP opcional; cidade fixa).
  2. A **rota do servidor** `/api/frete` consulta o cache (`buscar_geocodificacao`). Se não houver resultado guardado, chama a **Geoapify** (geocodificação, plano grátis) uma vez e grava o resultado (`registrar_geocodificacao`).
  3. O **banco** calcula a distância e o valor. O navegador nunca envia distância nem valor de frete.
- Endereço **não encontrado** pela Geoapify, **fora da área** (mais de `raio_maximo_km`) ou loja **sem coordenadas**: a entrega pelo site fica bloqueada, e o site oferece **WhatsApp** para combinar ou **retirada**.
- O `total` do pedido = itens + `taxa_entrega`. Retirada não tem frete.

**Pagamento do agendamento:**
- **Para agendar é obrigatório ter conta de cliente e estar logado.** O pedido fica gravado na conta (`cliente_id`). O pedido "agora" continua liberado para convidado.
- Todo agendamento nasce com **pagamento pendente** (`pagamento_status = 'pendente'`). Ele só fica **confirmado** quando o pagamento é confirmado (`'pago'`).
- **Prazo para pagar:** 2 horas, ou até o horário agendado, o que vier antes (`pagamento_expira_em`).
  - Passou do prazo sem pagar: o pedido é **cancelado automaticamente** (`pagamento_status = 'expirado'`) e o horário fica livre de novo.
  - A expiração roda sozinha antes de cada novo pedido. Não precisa de cron.
- **O sistema de pagamento ainda não existe.** Por enquanto, o **admin confirma pelo painel** com `confirmar_pagamento`. No futuro, o webhook do provedor chama a mesma função com a chave secreta, no servidor.
- **Lembretes de 30 em 30 minutos:**
  - no site, `meus_pagamentos_pendentes()` já devolve a mensagem pronta;
  - no servidor (futuro WhatsApp/SMS), `pedidos_para_lembrete()` + `registrar_lembrete()`.
- Pedidos "agora": `pagamento_status = 'nao_exigido'`, e o pagamento é feito na entrega/retirada (Pix, dinheiro ou cartão na maquininha).

**Pagamento online (InfinitePay): só para agendamentos**
- Formas aceitas: **Pix** e **cartão de crédito** (à vista ou parcelado). A InfinitePay não tem débito online.
- **Agendamento não aceita dinheiro nem troco:** `criar_pedido` recusa `p_forma_pagamento = 'dinheiro'` ou `p_troco_para` quando há `p_agendado_para`. A forma de pagamento é gravada só na confirmação (`pix` ou `cartao`).
- **Fluxo:**
  1. Cliente clica em "Pagar agora".
  2. O servidor chama `preparar_cobranca`, cria o link na InfinitePay (`POST /links`) e guarda com `salvar_link_cobranca`.
  3. O cliente paga na página da InfinitePay.
  4. Webhook ou retorno ao site → o servidor **SEMPRE** confere no `payment_check` oficial → `registrar_pagamento_cobranca` → agendamento confirmado.
- **O webhook da InfinitePay não é assinado.** O conteúdo do aviso e os parâmetros da URL de retorno **nunca** confirmam pagamento sozinhos; só o `payment_check` vale.
- O link vale até o prazo do agendamento (`valida_ate = pagamento_expira_em`), aceita **um pagamento só** e reaproveita o mesmo link em cliques repetidos.
- **Pagou depois do prazo** (pedido já expirado ou cancelado): a cobrança fica `paga_fora_do_prazo` e o pedido **não** volta sozinho. O dono decide pelo painel (reativar ou devolver).
- **Valor divergente:** não confirma, grava no log e devolve `valor_divergente`.
- O **parcelamento no cartão** pode ter juros pagos pelo cliente. Nesse caso, `valor_pago_centavos` > `valor_centavos`, e isso é normal. O que precisa bater é o `amount`.
- Não há ambiente de teste na InfinitePay: **os testes são feitos na conta real da loja**. Tudo fica registrado em `eventos_pagamento`.

**Preço do pacote** (calculado só no banco, pela função interna `private.precificar`):
- regra de mistura: `preço base × Σ(quantidade do sabor × (1 + acréscimo/100)) ÷ total de salgados do pacote`;
- se **todos** os sabores são assados e o pacote tem `preco_so_assado`, usa o **maior** valor entre `preco_so_assado` e a regra de mistura. Assim, uma esfiha fica no preço da tabela, e a mini pizza, que tem acréscimo maior, sai pelo valor dela.

Exemplos:
- cento com 50 coxinhas + 50 esfihas: 75 × (50 + 57,5) / 100 = **R$ 80,63**;
- 50 só de palito de queijo: 37,90 × 1,20 = **R$ 45,48**.

> **O front NUNCA calcula preço.** Para mostrar valores (carrinho, resumo), use a função `calcular_pedido`. Para gravar, use `criar_pedido`. As duas usam a mesma regra.

---

## 2. Visão geral das tabelas

```
produtos ──< kit_componentes >── produtos        (não usado no cardápio atual; pacotes não têm partes fixas)

auth.users ──1:1── clientes                       (conta do cliente, opcional)
auth.users ──1:1── admins                         (dono)

clientes ──< pedidos ──< itens_pedido ──< itens_pedido_conteudo
                              │                     (sabores escolhidos em cada pacote)
                              └── produto_id → produtos (pode ficar null)
```

- **Três papéis:**
  - **visitante** (não logado): role `anon`
  - **cliente logado**: role `authenticated`, com linha em `clientes`
  - **admin**: role `authenticated`, com linha em `admins`
- Pedido pode ser feito **com ou sem conta**.
- **Pedidos são criados SOMENTE pela função `criar_pedido`.** Ninguém tem INSERT direto em pedidos, itens ou conteúdo.

---

## 3. Tabelas

### `produtos` — cardápio
`categoria` define o que é:
- `'kit'` = **pacote** (30/50/100);
- `'salgado'` = **sabor** que vai dentro do pacote;
- `'refrigerante'` = bebida.

| coluna | tipo | vale para | regras |
|---|---|---|---|
| id | bigint (identity) | todos | PK |
| criado_em | timestamptz | todos | default now() |
| categoria | text | todos | `'salgado'` \| `'kit'` \| `'refrigerante'` |
| nome | text | todos | 2–80 caracteres (ex.: "Coxinha de frango", "Cento (100 salgados)", "Coca-Cola 2L") |
| descricao | text | todos | opcional, até 300 (pacotes: "Escolha até 4 sabores") |
| preco | numeric(10,2) | kit, refrigerante | **pacote:** preço base (fritos); **refrigerante:** preço da unidade; **salgado:** não usado (0) |
| ativo | boolean | todos | default true; `false` = some do site (use em vez de apagar) |
| imagem_url | text | todos | opcional, até 500 (ex.: `/produtos/coxinha.webp`, da pasta `public` do Next). Refrigerantes ficam sem imagem |
| ordem | integer | todos | ordem de exibição |
| salgados_a_escolher | integer | kit | quantidade de salgados do pacote (30, 50, 100) |
| max_sabores | integer | kit | máximo de sabores (2, 3, 4) |
| preco_so_assado | numeric(10,2) | kit | preço quando todos os sabores são assados (null = usa a regra de mistura) |
| tipo_salgado | text | salgado | **obrigatório em salgado e proibido nos outros**: `'frito'` \| `'assado'` \| `'variado'` |
| acrescimo_percentual | numeric(5,2) | salgado | 0–100; acréscimo sobre o preço base. **Nunca exibir no site.** |
| vende_congelado | boolean | salgado | pode ir em pacote congelado (variados = false) |
| vende_pronto | boolean | salgado | pode ir em pacote pronto para comer |
| antecedencia_dias | integer | salgado | 0–30; dias mínimos de agendamento **quando o pacote é pronto** (assados = 1) |

**Cardápio cadastrado:**

| tipo | sabores | acréscimo | congelado | pronto | antecedência |
|---|---|---|---|---|---|
| frito | Coxinha de frango, Kibe de carne, Bolinha de queijo, Enrolado de salsicha, Risole de queijo, Risole de frango com catupiry, Risole de palmito, Risole de carne, Croquete de milho, Medalhão de presunto e queijo | 0% | sim | sim | 0 |
| assado | Esfiha de frango com catupiry, Esfiha de carne, Mini hambúrguer | 15% | sim | sim | 1 dia |
| assado | Mini pizza de presunto e queijo, Mini pizza de queijo | 72,35% | sim | sim | 1 dia |
| variado | Mini pastel de carne, Mini pastel de pizza, Mini pastel de queijo | 19,37% | não | sim | 0 |
| variado | Mini churros de doce de leite | 19,37% | não | sim | 0 |
| variado | Palito de queijo | 52,49% | não | sim | 0 |

Refrigerantes: Coca-Cola 2L, Coca-Cola 600ml, Guaraná Conquista 2L e Guaraná Conquista 600ml.

Constraints:
- `tipo_salgado_so_em_salgado`;
- `escolha_de_sabores_so_em_kit`;
- `produtos_preco_so_assado_check` (`preco_so_assado` só em kit).

Nunca apagar produto que já foi pedido: desative com `ativo = false`.

### `kit_componentes` — partes fixas de um kit
Existe para kits com itens fixos, mas **os pacotes atuais não usam**. Colunas:
- `kit_id`: FK `kit_componentes_kit_fk`;
- `produto_id`: FK `kit_componentes_produto_fk`;
- `quantidade`.

Kit dentro de kit é proibido.

### `clientes` — conta do cliente (opcional)
| coluna | tipo | regras |
|---|---|---|
| id | uuid | PK, FK → auth.users.id (on delete cascade) |
| criado_em | timestamptz | default now() |
| nome | text | 2–60 |
| sobrenome | text | 2–80 |
| telefone | text | **único**, só dígitos, 10–11 |

- **Criada automaticamente** por gatilho no cadastro. O front não insere aqui.
- O cliente pode editar só `nome` e `sobrenome`.
- Para excluir um cliente, apague o usuário em **Authentication › Users**: isso remove a linha em `clientes` junto. Apagar só a linha em `clientes` deixa a conta de login ativa.

### `pedidos`
| coluna | tipo | regras |
|---|---|---|
| id | bigint (identity) | PK = **número do pedido** (pode pular números) |
| criado_em | timestamptz | default now() |
| atualizado_em | timestamptz | atualizado por gatilho a cada UPDATE |
| cliente_id | uuid | FK → clientes.id; **null = convidado** |
| nome | text | 2–60 |
| sobrenome | text | 2–80 |
| telefone | text | só dígitos, 10–11 |
| tipo_entrega | text | `'entrega'` (default) \| `'retirada'` |
| rua | text | 2–120; **obrigatório só na entrega** (null na retirada) |
| vila | text | 2–80; **obrigatório só na entrega** |
| numero | text | 1–10 (aceita "123A", "S/N"); **obrigatório só na entrega** |
| ponto_referencia | text | opcional, até 200 (null na retirada) |
| agendado_para | timestamptz | null = "agora" (só com a loja aberta); preenchido = um dos horários de `horarios_disponiveis`. **Obrigatório** fora do horário, com assado pronto ou com mais de 100 salgados. **Único** entre pedidos não cancelados (índice `pedidos_um_por_horario`) |
| forma_pagamento | text | opcional: `'pix'` \| `'dinheiro'` \| `'cartao'` |
| troco_para | numeric(10,2) | opcional, > 0; só com `'dinheiro'`, e ≥ total |
| observacao | text | opcional, até 500 |
| status | text | default `'novo'`; `'novo'` \| `'em_preparo'` \| `'saiu_para_entrega'` \| `'entregue'` \| `'cancelado'` |
| total | numeric(10,2) | calculado pelo banco = itens + `taxa_entrega` |
| cep | text | opcional, 8 dígitos (só entrega) |
| distancia_km | numeric(6,2) | distância em linha reta até a loja (só entrega) |
| taxa_entrega | numeric(10,2) | frete cobrado (0 na retirada); snapshot, não muda se a tabela mudar |
| pagamento_status | text | `'nao_exigido'` (pedido agora) \| `'pendente'` (agendado aguardando pagamento) \| `'pago'` (agendamento **confirmado**) \| `'expirado'` (não pagou no prazo; pedido cancelado) |
| pagamento_expira_em | timestamptz | prazo para pagar (só agendados) |
| pago_em | timestamptz | quando o pagamento foi confirmado |
| pagamento_referencia | text | até 200; id da transação no provedor (futuro) ou anotação do admin (ex.: "PIX 23/10") |
| lembretes_enviados | integer | lembretes enviados pelo servidor (estrutura futura) |
| ultimo_lembrete_em | timestamptz | último lembrete enviado pelo servidor |

Constraints:
- `endereco_obrigatorio_na_entrega`;
- `troco_so_no_dinheiro`.

Na retirada, o status `'saiu_para_entrega'` não se aplica. O painel pode exibir "Pronto para retirar" no lugar desse status quando `tipo_entrega = 'retirada'` (é só o rótulo; o valor gravado é o mesmo).

### `itens_pedido` — cada linha = 1 pacote ou 1 refrigerante
| coluna | tipo | regras |
|---|---|---|
| id | bigint (identity) | PK |
| pedido_id | bigint | FK → pedidos.id (on delete cascade) |
| produto_id | bigint | FK → produtos.id (on delete set null) |
| categoria | text | snapshot: `'kit'` (pacote) \| `'refrigerante'` (`'salgado'` só em pedidos antigos) |
| nome_produto | text | snapshot do nome |
| modo | text | `'congelado'` \| `'pronto'` para pacotes; null para refrigerante |
| quantidade | integer | 1–1000 (nº de pacotes ou de garrafas) |
| preco_unitario | numeric(10,2) | snapshot do preço de 1 pacote/garrafa (já com acréscimos) |
| subtotal | numeric(10,2) | coluna gerada = quantidade × preco_unitario |

### `itens_pedido_conteudo` — sabores de cada pacote pedido
| coluna | tipo | regras |
|---|---|---|
| id | bigint (identity) | PK |
| item_id | bigint | FK → itens_pedido.id (on delete cascade) |
| produto_id | bigint | FK → produtos.id (on delete set null) |
| nome_produto | text | snapshot (ex.: "Coxinha de frango") |
| quantidade | integer | > 0; total do sabor, **já multiplicado** pelo nº de pacotes da linha |
| escolhido_pelo_cliente | boolean | `true` = sabor escolhido |

### `horarios_funcionamento` — horário de atendimento
| coluna | tipo | regras |
|---|---|---|
| id | bigint (identity) | PK |
| dia_semana | smallint | 0 = domingo, 1 = segunda ... 6 = sábado |
| abre | time | início da faixa (ex.: 08:00) |
| fecha | time | fim da faixa (ex.: 18:00); pelo menos 30 min depois de `abre` |
| ativo | boolean | default true |

- Pode haver **mais de uma faixa no mesmo dia** (ex.: 08:00–12:00 e 13:30–18:00).
- Dia da semana sem linha ativa = fechado.
- Os horários de agendamento são gerados de 30 em 30 min a partir de `abre`, até 30 min antes de `fecha`.

### `dias_fechados` — feriados e folgas
| coluna | tipo | regras |
|---|---|---|
| data | date | PK |
| motivo | text | opcional, até 120 (ex.: "Natal") |

### `config_loja` — dados da loja (uma linha, `id = 1`)
| coluna | tipo | regras |
|---|---|---|
| endereco | text | "Rua Miguel de Moraes, 377 - Jardim Europa" (use na retirada) |
| cidade / uf | text | "Ourinhos" / "SP" (cidade fixa da entrega) |
| cep | text | "19914300" |
| loja_lat / loja_lng | numeric(9,6) | coordenadas da loja; **sem elas o frete fica `nao_configurado`** |
| raio_maximo_km | numeric(5,2) | default 15; acima disso = fora da área (proteção contra endereço achado errado) |

### `faixas_frete` — tabela de preço do frete
| coluna | tipo | regras |
|---|---|---|
| id | bigint (identity) | PK |
| ate_km | numeric(5,2) | limite da faixa (ex.: 2.00); **null = "acima da última faixa"** (só pode existir uma) |
| valor | numeric(10,2) | ≥ 0 |
| ativo | boolean | default true |

A faixa usada é a primeira ativa (em ordem crescente de `ate_km`) com `distância ≤ ate_km`. Se nenhuma servir, usa a faixa null.

### `enderecos_geocodificados` — cache da geocodificação (**só servidor**)
- Colunas: `chave` (rua|número|vila normalizados: minúsculas, sem acento, sem pontuação), `encontrado`, `lat`, `lng`, `endereco_formatado` e `criado_em`.
- Ninguém lê pela API pública. Só a chave secreta acessa, pelas funções `buscar_geocodificacao` e `registrar_geocodificacao`.

### `cobrancas` — tentativas de pagamento online (InfinitePay)
| coluna | tipo | regras |
|---|---|---|
| id | uuid | PK; é enviado como **`order_nsu`** para a InfinitePay |
| pedido_id | bigint | FK → pedidos.id |
| provedor | text | `'infinitepay'` |
| status | text | `'aberta'` \| `'paga'` \| `'paga_fora_do_prazo'` \| `'expirada'` \| `'cancelada'`; só uma `'aberta'` por pedido |
| valor_centavos | integer | total do pedido em centavos (itens + frete) |
| valida_ate | timestamptz | = prazo de pagamento do agendamento |
| checkout_url | text | link de pagamento devolvido pela InfinitePay (https) |
| criada_em / paga_em | timestamptz | |
| transaction_nsu | text | **único**; id da transação na InfinitePay |
| invoice_slug | text | código da fatura (`slug` na URL de retorno, `invoice_slug` no webhook) |
| capture_method | text | `'pix'` \| `'credit_card'` |
| parcelas | integer | 1–12 |
| valor_pago_centavos | integer | `paid_amount` (pode incluir juros do parcelamento) |
| receipt_url | text | link do comprovante |

### `eventos_pagamento` — log de pagamento (servidor grava; admin lê)
- Colunas: `id`, `recebido_em`, `origem` (`'webhook'`, `'retorno'`, `'criacao'`, `'verificacao'` ou `'erro'`), `cobranca_id`, `pedido_id`, `payload` (jsonb) e `resultado` (texto curto).
- **Nunca** gravar chave de API nem dados de cartão no payload.

### `admins`
- Colunas: `user_id` (PK, FK → auth.users) e `criado_em`.
- Ninguém lê essa tabela pela API. Para saber se o usuário é admin, use `sou_admin()`.

---

## 4. Autenticação

- **Cliente:** login por **telefone + senha**, sem e-mail e sem SMS.
  - E-mail enviado ao Supabase Auth: `<telefone só dígitos>@cliente.invalid`.
  - Cadastro: `signUp({ email, password, options: { data: { nome, sobrenome } } })`. O gatilho cria a linha em `clientes`. "Confirm email" está desligado, então o `signUp` já devolve sessão.
  - Login: `signInWithPassword`.
  - Não há recuperação de senha por e-mail/SMS.
- **Convidado:** não usa Auth. Os dados ficam só no navegador, e o pedido vai com `cliente_id = null`.
- **Admin:** e-mail real + senha, cadastrado em `admins`.
- **Sessão válida ≠ cliente válido.** Se houver sessão mas não houver linha em `clientes` (e o usuário não for admin), faça `signOut()`.
- Chamadas de auth rodam no navegador (`'use client'`). O limite de tentativas é por IP.

---

## 5. Funções (RPC)

### `calcular_pedido(p_itens jsonb, p_tipo_entrega text default null, p_rua text default null, p_numero text default null, p_vila text default null)` → `jsonb`: anon e authenticated
**Não grava nada.** Use para o carrinho e o resumo do checkout. Valida itens e sabores com as mesmas regras do `criar_pedido`, e devolve erro `P0001` se algo estiver inválido.
- Só com `p_itens`: calcula os itens, sem frete.
- Com `p_tipo_entrega = 'entrega'` + rua, número e vila: inclui o frete, se ele já foi calculado pelo servidor.

Retorno:
```json
{
  "total_itens": 163.00,
  "frete": { "status": "ok", "distancia_km": 3.00, "valor": 7.00 },
  "total": 170.00,
  "total_salgados": 200,
  "limite_entrega": 100,
  "entrega_permitida": false,
  "exige_agendamento": true,
  "motivo_agendamento": "acima_do_limite",
  "data_minima_agendamento": "2026-10-23",
  "loja_aberta": true,
  "pode_pedir_agora": false,
  "itens": [
    { "produto_id": 23, "nome_produto": "Cento (100 salgados)", "modo": "pronto",
      "quantidade": 2, "preco_unitario": 75.00, "subtotal": 150.00 },
    { "produto_id": 26, "nome_produto": "Coca-Cola 2L", "modo": null,
      "quantidade": 1, "preco_unitario": 13.00, "subtotal": 13.00 }
  ]
}
```

- `frete`: null na retirada ou sem endereço. Quando vem preenchido, `status` é:
  - `'ok'`: tem `valor` e `distancia_km`;
  - `'nao_calculado'`: chame `/api/frete` primeiro;
  - `'nao_encontrado'`, `'fora_da_area'` ou `'nao_configurado'`: entrega pelo site indisponível; oferecer WhatsApp ou retirada.
- `total` = `total_itens` + frete (só quando `status = 'ok'`).
- `entrega_permitida`: false quando há mais de `limite_entrega` salgados. Nesse caso é **só retirada**.
- `exige_agendamento`: true quando há assado pronto ou mais de 100 salgados.
- `motivo_agendamento`: `'acima_do_limite'` (mais de 100 salgados), `'assados'` ou null.
- `data_minima_agendamento`: primeiro dia que pode ser agendado. É **sempre preenchida** (hoje, quando não há restrição).
- `loja_aberta`: a loja está no horário de atendimento agora.
- `pode_pedir_agora`: true só se `loja_aberta` e não `exige_agendamento`. Se false, o checkout **só oferece agendar**.
- Os itens voltam **na mesma ordem** em que foram enviados.

### `status_loja()` → `jsonb`: anon e authenticated
```json
{ "aberta": false, "fecha_as": null, "proxima_abertura": "2026-10-23T08:00:00-03:00" }
```
- `fecha_as` ("HH:MM") vem preenchido só quando a loja está aberta.
- `proxima_abertura`: próxima vez que a loja abre nos próximos 14 dias (null se não houver).

### `horarios_disponiveis(p_data date, p_itens jsonb default null)` → `jsonb`: anon e authenticated
Horários **livres** para agendar em uma data (formato `'YYYY-MM-DD'`):
```json
[ { "inicio": "2026-10-23T08:00:00-03:00", "hora": "08:00" },
  { "inicio": "2026-10-23T08:30:00-03:00", "hora": "08:30" } ]
```
- Já remove os horários ocupados por outros pedidos (não cancelados), os horários a menos de 1 hora de agora, os dias fechados e os horários fora do expediente.
- Se `p_itens` for enviado (os itens do carrinho), aplica também a data mínima: com assados prontos ou mais de 100 salgados, **hoje volta vazio**.
- Lista vazia = sem horário nesse dia.
- Envie o **`inicio` exatamente como veio** em `p_agendado_para` do `criar_pedido`.
- Não revela nada sobre os outros pedidos, só quais horários estão livres.

### `criar_pedido(...)` → `jsonb`: anon e authenticated
Grava o pedido inteiro e devolve:
```json
{ "numero": 11, "total": 82.00, "taxa_entrega": 7.00, "pagamento_status": "pendente", "pagamento_expira_em": "2026-10-22T21:37:00-03:00" }
```
- Pedido "agora": `pagamento_status = "nao_exigido"` e `pagamento_expira_em = null`.
- **Agendamento exige cliente logado.**

| parâmetro | tipo | obrigatório |
|---|---|---|
| p_nome | text | sim |
| p_sobrenome | text | sim |
| p_telefone | text | sim (máscara é aceita) |
| p_rua | text | só na entrega (envie null na retirada) |
| p_vila | text | só na entrega |
| p_numero | text | só na entrega |
| p_itens | jsonb | sim |
| p_ponto_referencia | text | não |
| p_forma_pagamento | text | não (`pix` / `dinheiro` / `cartao`) |
| p_troco_para | numeric | não (só com `dinheiro`) |
| p_observacao | text | não |
| p_agendado_para | timestamptz | null = "agora"; senão, o `inicio` de um item de `horarios_disponiveis`. **Obrigatório** fora do horário, com assado pronto ou com mais de 100 salgados |
| p_tipo_entrega | text | não; default `'entrega'`; ou `'retirada'` |
| p_cep | text | não (máscara aceita; guardado só na entrega) |

Na **entrega**, o frete precisa ter sido calculado antes pelo `/api/frete`. Se não, o pedido dá erro:
- `Calcule o frete do endereço antes de finalizar o pedido.`
- `Não conseguimos calcular a entrega para esse endereço. Fale com a loja pelo WhatsApp para combinar a entrega ou escolha retirada no local.`

O troco é comparado com o total **com frete**.

**Formato de `p_itens`** (mesmo formato para `calcular_pedido`), de 1 a 30 linhas:
```json
[
  { "produto_id": 23, "quantidade": 1, "modo": "pronto",
    "sabores": [ { "produto_id": 1, "quantidade": 50 },
                 { "produto_id": 12, "quantidade": 50 } ] },
  { "produto_id": 26, "quantidade": 2 }
]
```

- **Pacote** (`categoria = 'kit'`) exige `modo` (`'congelado'` ou `'pronto'`) e `sabores`:
  - soma das quantidades = `salgados_a_escolher × quantidade`;
  - nº de sabores ≤ `max_sabores`;
  - cada sabor precisa ser salgado ativo e disponível no modo (`vende_congelado` / `vende_pronto`).
- **Refrigerante:** só `produto_id` e `quantidade`.
- Enviar um **salgado** diretamente gera erro: salgado só entra como sabor de pacote.

**Regras aplicadas:**
- preço sempre do banco, nunca do site;
- `cliente_id` preenchido automaticamente se o usuário estiver logado como cliente;
- entrega com mais de 100 salgados → erro (só retirada);
- entrega exige rua, vila e número;
- pedido "agora" (`agendado_para` null) só com a loja aberta e sem restrição de agendamento;
- pedido agendado:
  - precisa ser um horário válido (30 em 30 min, dentro do expediente, fora de dia fechado);
  - pelo menos 1 hora à frente e no máximo 90 dias;
  - data ≥ `data_minima_agendamento`;
- **horário já ocupado** por outro pedido → erro (o índice único garante, mesmo com cliques simultâneos);
- no máximo 3 pedidos por telefone a cada 10 minutos;
- troco ≥ total.

**Erros** (o campo `error.code` do supabase-js traz o SQLSTATE):
- `P0001`: regra de negócio; `error.message` já vem **em português**, pronto para exibir. Exemplos:
  - `Estamos fora do horário de atendimento. Agende seu pedido para um dos horários disponíveis.`
  - `Esse horário acabou de ser reservado por outro cliente. Escolha outro horário.` (recarregue os horários)
  - `Horário de agendamento inválido. Escolha um dos horários disponíveis.`
  - `Agende com pelo menos 1 hora de antecedência.`
  - `Para agendar um pedido, entre na sua conta ou crie uma.`
  - `Agendamentos são pagos pelo site, com Pix ou cartão de crédito.`
  - `A entrega só é possível para pedidos de até 100 salgados (1 cento). Acima disso, o pedido é só para retirada no local, com agendamento a partir do dia seguinte.`
  - `Pedidos acima de 100 salgados precisam ser agendados a partir de 23/10/2026 para retirada no local.`
  - `Pedidos com assados precisam ser agendados a partir de 23/10/2026.`
  - `"30 salgados" aceita no máximo 2 sabores.`
  - `Um dos sabores escolhidos para "30 salgados" não está disponível na opção congelado.`
- `23514`: dado fora do formato (nome curto, telefone inválido...).

### `confirmar_pagamento(p_pedido_id bigint, p_referencia text default null)` → `jsonb`
Confirma o agendamento: `pagamento_status` vira `'pago'` e `pago_em` recebe a data atual.
- **Quem pode:** admin logado (painel) ou o servidor com a chave secreta (webhook futuro). Cliente e visitante recebem erro.
- Só funciona em pedido com pagamento `'pendente'` e não cancelado. Senão, devolve o erro `Pedido X não encontrado ou sem pagamento pendente.`
- Retorno: `{ "numero", "pagamento_status": "pago", "pago_em", "agendado_para" }`.

### `meus_pagamentos_pendentes()` → `jsonb` (authenticated)
Agendamentos do **cliente logado** aguardando pagamento e ainda dentro do prazo:
```json
[ { "numero": 11, "total": 75.00, "agendado_para": "2026-10-23T11:00:00-03:00",
    "expira_em": "2026-10-22T21:37:00-03:00",
    "mensagem": "Para confirmar seu agendamento do pedido nº 11, realize o pagamento de R$ 75,00!" } ]
```
O site chama ao abrir e de 30 em 30 minutos para exibir o lembrete. Lista vazia = nada pendente.

### `pedidos_para_lembrete()` → `jsonb` e `registrar_lembrete(p_pedido_id bigint)` (só chave secreta)
Estrutura para lembretes enviados pelo **servidor** (WhatsApp/SMS/e-mail, quando houver provedor):
- `pedidos_para_lembrete()` lista os pendentes que não recebem lembrete há 30 min ou mais (`numero`, `nome`, `telefone`, `total`, `agendado_para`, `expira_em`, `lembretes_enviados`).
- Depois de enviar, chame `registrar_lembrete(numero)`.
- **Nunca chamar do navegador.** Só de rota de API no servidor, com `sb_secret_...`.

### `expirar_pagamentos_pendentes()` → `integer` (admin ou chave secreta)
Força a expiração dos agendamentos vencidos agora e devolve quantos cancelou. Opcional: a expiração já acontece sozinha a cada novo pedido. O painel pode chamar ao abrir.

### `calcular_frete(p_rua, p_numero, p_vila)` → `jsonb`: anon e authenticated
Lê o frete de um endereço **já calculado** (nunca chama a Geoapify): `{ "status": "ok", "distancia_km": 3.00, "valor": 7.00 }`, ou um dos status acima. Não expõe coordenadas.

### `buscar_geocodificacao(p_rua, p_numero, p_vila)` → `jsonb` (**só chave secreta**)
`{ "existe": false }` ou `{ "existe": true, "encontrado": true|false }`. A rota `/api/frete` chama antes da Geoapify para não gastar requisição repetida.

### `registrar_geocodificacao(p_rua, p_numero, p_vila, p_encontrado boolean, p_lat, p_lng, p_endereco_formatado)` → `jsonb` (**só chave secreta**)
Grava o resultado da Geoapify no cache e já devolve o frete, no mesmo formato de `calcular_frete`. Se ela não achou, envie `p_encontrado = false` sem coordenadas.

### Funções de pagamento online (**só chave secreta**, rotas do servidor)

**`preparar_cobranca(p_pedido_id bigint, p_cliente_id uuid)`** → `jsonb`
- Valida que o pedido é do cliente (`p_cliente_id` = id do usuário da sessão, conferido no servidor), está pendente e ainda está no prazo.
- Reaproveita a cobrança aberta, se for do mesmo valor e já tiver link: `{ "reaproveitada": true, "checkout_url", ... }`.
- Senão, cria uma nova cobrança:
  ```json
  { "reaproveitada": false, "cobranca_id": "uuid", "order_nsu": "uuid", "valor_centavos": 7500,
    "valida_ate": "...", "descricao": "Pedido nº 16 - Edna & Célia Salgados",
    "cliente_nome": "Ana Lima", "cliente_telefone": "+5514999990001", "pedido_id": 16 }
  ```
- Erros (P0001):
  - `Pedido não encontrado.`
  - `Este agendamento já está pago.`
  - `O prazo para pagar este agendamento terminou. Faça um novo agendamento.`
  - `Este pedido não tem pagamento online.`

**`salvar_link_cobranca(p_cobranca_id uuid, p_checkout_url text, p_invoice_slug text default null)`**
- Guarda o link (precisa começar com `https://`).

**`registrar_pagamento_cobranca(p_order_nsu text, p_transaction_nsu text, p_valor_centavos int, p_valor_pago_centavos int, p_capture_method text, p_parcelas int, p_invoice_slug text, p_receipt_url text)`** → `jsonb`
- Chame **somente** com os dados devolvidos pelo `payment_check` com `paid: true`. `p_valor_centavos` é o `amount`; `p_valor_pago_centavos` é o `paid_amount`.
- Resultados:
  - `confirmado`: pedido passou a `pago` e `forma_pagamento` virou `pix` ou `cartao`;
  - `ja_registrado`: aviso repetido, não faz nada;
  - `revisar`: pagou fora do prazo, cobrança `paga_fora_do_prazo`;
  - `valor_divergente`: não confirma.
- Erros: `order_nsu inválido.`, `Cobrança não encontrada.`, `transaction_nsu ausente.`, `Cobrança já paga com outra transação.`, `Transação já usada em outra cobrança.`

**`cobranca_do_pedido(p_pedido_id bigint)`** → `jsonb`
- A cobrança mais recente do pedido (`order_nsu`, `status`, `invoice_slug`, `transaction_nsu`, `valor_centavos`, `valida_ate`), ou `null`.

**`registrar_evento_pagamento(p_origem, p_payload jsonb, p_resultado, p_cobranca_id, p_pedido_id)`**
- Grava no log.

O **cliente logado** pode ler (SELECT) as cobranças dos próprios pedidos, por exemplo o `status` e o `receipt_url`, mas não altera nada.

### `sou_admin()` → `boolean` (authenticated)
Diz se o usuário logado é admin.

### `ping()` → `text` (anon e authenticated)
Usada pelo keep-alive diário.

---

## 6. Permissões (RLS)

| tabela | visitante (anon) | cliente logado | admin |
|---|---|---|---|
| produtos | SELECT só `ativo = true` | SELECT só `ativo = true` | SELECT tudo, INSERT, UPDATE, DELETE |
| kit_componentes | SELECT | SELECT | tudo |
| clientes | — | SELECT/UPDATE (nome, sobrenome) da própria linha | SELECT/UPDATE todos |
| pedidos | — | SELECT dos próprios | SELECT, UPDATE, DELETE todos |
| itens_pedido | — | SELECT dos próprios | SELECT, UPDATE, DELETE |
| itens_pedido_conteudo | — | SELECT dos próprios | SELECT, UPDATE, DELETE |
| horarios_funcionamento | SELECT | SELECT | SELECT, INSERT, UPDATE, DELETE |
| dias_fechados | SELECT | SELECT | SELECT, INSERT, UPDATE, DELETE |
| config_loja | SELECT | SELECT | SELECT, UPDATE |
| faixas_frete | SELECT | SELECT | SELECT, INSERT, UPDATE, DELETE |
| enderecos_geocodificados | — | — | — (só chave secreta) |
| cobrancas | — | SELECT das dos próprios pedidos | SELECT (escrita só chave secreta) |
| eventos_pagamento | — | — | SELECT (escrita só chave secreta) |
| admins | — | — | — |

> `acrescimo_percentual` é legível pela API (como as demais colunas de `produtos`), mas **não deve ser selecionado nem exibido** nas telas públicas. Nas consultas do site, liste as colunas explicitamente.

---

## 7. Tempo real

`pedidos` está na publicação `supabase_realtime` (respeita RLS):
```js
supabase.channel('pedidos-admin')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, callback)
  .subscribe()
```

---

## 8. Consultas de referência (supabase-js)

Cardápio público (sem `acrescimo_percentual`):
```js
supabase.from('produtos')
  .select('id, categoria, nome, descricao, preco, imagem_url, ordem, salgados_a_escolher, max_sabores, tipo_salgado, vende_congelado, vende_pronto, antecedencia_dias')
  .eq('ativo', true)
  .order('ordem').order('nome')
```
Separe no front:
- pacotes = `categoria === 'kit'`;
- sabores = `categoria === 'salgado'`, agrupados por `tipo_salgado`;
- refrigerantes = `categoria === 'refrigerante'`.

Para o modo escolhido, filtre os sabores por `vende_congelado` / `vende_pronto`.

> Não mostre o `preco` dos pacotes como preço final fixo quando a escolha incluir assado ou variado: o valor real vem do `calcular_pedido`. Pode exibir "a partir de R$ 75,00".

Pedidos com itens e sabores (admin vê todos; cliente vê os seus):
```js
supabase.from('pedidos')
  .select(`*, itens_pedido ( id, categoria, nome_produto, modo, quantidade, preco_unitario, subtotal,
    itens_pedido_conteudo ( nome_produto, quantidade ) )`)
  .order('criado_em', { ascending: false })
  .range(0, 29)
```

Simular e depois criar:
```js
const { data: resumo } = await supabase.rpc('calcular_pedido', { p_itens })
// mostra resumo.total; se !resumo.entrega_permitida -> só retirada;
// se !resumo.pode_pedir_agora -> só "Agendar"

const { data: horarios } = await supabase.rpc('horarios_disponiveis', {
  p_data: '2026-10-23',   // data escolhida (>= resumo.data_minima_agendamento)
  p_itens,                // aplica a data mínima do carrinho
})
// horarios = [{ inicio, hora }, ...] -> mostrar "hora", enviar "inicio"

const { data, error } = await supabase.rpc('criar_pedido', {
  p_nome, p_sobrenome, p_telefone,
  p_rua: null, p_vila: null, p_numero: null,      // retirada
  p_itens, p_tipo_entrega: 'retirada',
  p_agendado_para: horarios[0].inicio,           // ou null para "agora"
  p_forma_pagamento: 'pix', p_troco_para: null, p_observacao: null, p_ponto_referencia: null,
})
```

---

## 9. Cuidados do plano gratuito

- O projeto pausa após 7 dias sem uso. O `ping()` é chamado 1x/dia pelo cron da Vercel.
- Egress limitado: pagine listas e sirva imagens pela pasta `public` do Next, não pelo Supabase Storage.
- Sem backup automático.