# Banco de dados — Salgadaria (Supabase)

Este documento descreve **apenas a estrutura do banco**. O banco já está criado e configurado no Supabase. **Não crie nem altere tabelas, políticas ou funções** sem pedir. O front-end deve se adaptar a esta estrutura.

- **Banco:** Supabase (Postgres), plano gratuito
- **Cliente JS:** `@supabase/supabase-js`, com a chave **publishable** (`sb_publishable_...`)
- **Variáveis:** `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **Proibido:** usar a chave secreta (`sb_secret_...`) no navegador

---

## 1. Visão geral

```
produtos ──< kit_componentes >── produtos        (cardápio; kit contém outros produtos)

auth.users ──1:1── clientes                       (conta do cliente, opcional)
auth.users ──1:1── admins                         (dono)

clientes ──< pedidos ──< itens_pedido ──< itens_pedido_conteudo
                              │                     (o que vai dentro de cada kit pedido)
                              └── produto_id → produtos (pode ficar null)
```

- **Três papéis:**
  - **visitante** (não logado): role `anon`
  - **cliente logado**: role `authenticated`, com linha em `clientes`
  - **admin**: role `authenticated`, com linha em `admins`
- Pedido pode ser feito **com ou sem conta**.
- **Pedidos são criados SOMENTE pela função `criar_pedido`.** Ninguém tem INSERT direto em `pedidos`, `itens_pedido` ou `itens_pedido_conteudo`.
- **Preços vêm sempre do banco.** O site manda apenas `produto_id` + `quantidade`.

---

## 2. Tabelas

### `produtos` — cardápio
| coluna | tipo | regras |
|---|---|---|
| id | bigint (identity) | PK |
| criado_em | timestamptz | default now() |
| categoria | text | `'salgado'` \| `'kit'` \| `'refrigerante'` |
| nome | text | 2–80 caracteres |
| descricao | text | opcional, até 300 |
| preco | numeric(10,2) | ≥ 0; preço de **1 unidade** (1 salgado, 1 kit, 1 garrafa) |
| ativo | boolean | default true; `false` = some do site |
| imagem_url | text | opcional, até 500 (ex.: `/produtos/coxinha.jpg`, servido da pasta `public` do Next) |
| ordem | integer | default 0; ordem de exibição |
| salgados_a_escolher | integer | 0–2000, default 0. **Só kit.** Quantos salgados o cliente distribui entre sabores (0 = kit sem escolha) |
| max_sabores | integer | 1–20 ou null (sem limite). **Só kit.** |

- Constraint `escolha_de_sabores_so_em_kit`: se `categoria` ≠ `'kit'`, então `salgados_a_escolher = 0` e `max_sabores is null`.
- **Nunca apagar produto que já foi pedido ou que está num kit.** Desative com `ativo = false`. O banco bloqueia DELETE de produto usado como componente (FK restrict).

### `kit_componentes` — o que vem FIXO dentro de um kit
| coluna | tipo | regras |
|---|---|---|
| kit_id | bigint | FK `kit_componentes_kit_fk` → produtos.id (on delete cascade); precisa ser categoria `'kit'` |
| produto_id | bigint | FK `kit_componentes_produto_fk` → produtos.id (on delete restrict); **não** pode ser kit |
| quantidade | integer | 1–2000 |

- PK: (kit_id, produto_id).
- Um gatilho valida que `kit_id` é kit e que `produto_id` não é kit.
- Um kit pode ter:
  - partes fixas (aqui), e/ou
  - escolha de sabores (`produtos.salgados_a_escolher > 0`).
- Exemplos:
  - Kit Festa 100: `salgados_a_escolher=100`, `max_sabores=4`, componente fixo 1x Coca-Cola 2L.
  - Kit Lanche: sem escolha; componentes 10x Coxinha, 10x Kibe, 1x Guaraná 2L.

### `clientes` — conta do cliente (opcional)
| coluna | tipo | regras |
|---|---|---|
| id | uuid | PK, FK → auth.users.id (on delete cascade) |
| criado_em | timestamptz | default now() |
| nome | text | 2–60 |
| sobrenome | text | 2–80 |
| telefone | text | **único**, só dígitos, 10–11 (DDD + número) |

- **Criada automaticamente** por gatilho no cadastro. O front **não insere** aqui.
- O cliente pode editar só `nome` e `sobrenome`. `telefone` não muda, porque é o login.

### `pedidos`
| coluna | tipo | regras |
|---|---|---|
| id | bigint (identity) | PK = **número do pedido** (pode pular números) |
| criado_em | timestamptz | default now() |
| atualizado_em | timestamptz | atualizado por gatilho a cada UPDATE |
| cliente_id | uuid | FK → clientes.id (on delete set null); **null = visitante** |
| nome | text | 2–60 |
| sobrenome | text | 2–80 |
| telefone | text | só dígitos, 10–11 |
| rua | text | 2–120 |
| vila | text | 2–80 |
| numero | text | 1–10 (texto: aceita "123A", "S/N") |
| ponto_referencia | text | opcional, até 200 |
| agendado_para | timestamptz | opcional; null = o quanto antes; data = encomenda (futura, até 90 dias) |
| forma_pagamento | text | opcional: `'pix'` \| `'dinheiro'` \| `'cartao'` |
| troco_para | numeric(10,2) | opcional, > 0; **só com `'dinheiro'`** (constraint `troco_so_no_dinheiro`) e ≥ total |
| observacao | text | opcional, até 500 |
| status | text | default `'novo'`; `'novo'` \| `'em_preparo'` \| `'saiu_para_entrega'` \| `'entregue'` \| `'cancelado'` |
| total | numeric(10,2) | calculado pelo banco (soma dos subtotais) |

- Nome, telefone e endereço são gravados no pedido mesmo para cliente logado. O endereço pode variar a cada pedido.

### `itens_pedido` — cada linha = 1 produto pedido
| coluna | tipo | regras |
|---|---|---|
| id | bigint (identity) | PK |
| pedido_id | bigint | FK → pedidos.id (on delete cascade) |
| produto_id | bigint | FK → produtos.id (on delete set null); pode ser null em itens antigos |
| categoria | text | cópia da categoria do produto no momento do pedido |
| nome_produto | text | cópia do nome no momento do pedido |
| quantidade | integer | 1–1000 |
| preco_unitario | numeric(10,2) | cópia do preço no momento do pedido |
| subtotal | numeric(10,2) | **coluna gerada** = quantidade × preco_unitario (não enviar) |

- Nome, categoria e preço são **snapshots**: mudar o cardápio não altera pedidos antigos.
- Refrigerante é uma linha normal (`categoria='refrigerante'`), independente de kits. Para exibir em blocos (Salgados / Kits / Refrigerantes), agrupe por `categoria`.
- Itens de pedidos anteriores à versão salgadaria têm `categoria='salgado'` e `produto_id = null`.

### `itens_pedido_conteudo` — o que vai DENTRO de cada kit pedido
| coluna | tipo | regras |
|---|---|---|
| id | bigint (identity) | PK |
| item_id | bigint | FK → itens_pedido.id (on delete cascade) |
| produto_id | bigint | FK → produtos.id (on delete set null) |
| nome_produto | text | snapshot |
| quantidade | integer | > 0; **já multiplicada** pela quantidade de kits da linha |
| escolhido_pelo_cliente | boolean | `true` = sabor escolhido; `false` = parte fixa do kit |

- Só existe para itens de categoria `'kit'`. É preenchida pela `criar_pedido`.

### `admins`
| coluna | tipo | regras |
|---|---|---|
| user_id | uuid | PK, FK → auth.users.id |
| criado_em | timestamptz | default now() |

- Ninguém lê essa tabela pela API (RLS sem políticas). Para saber se o usuário é admin, use a função `sou_admin()`.

---

## 3. Autenticação

- **Cliente:** login por **telefone + senha**, sem e-mail e sem SMS.
  - O Supabase Auth recebe um e-mail fictício: `<telefone só dígitos>@cliente.invalid` (ex.: `14999990001@cliente.invalid`).
  - Cadastro: `supabase.auth.signUp({ email, password, options: { data: { nome, sobrenome } } })`. Um gatilho em `auth.users` cria a linha em `clientes` com o telefone tirado do e-mail.
  - "Confirm email" está **desligado**, então o `signUp` já devolve sessão.
  - Telefone repetido ou inválido → o cadastro falha.
  - Login: `signInWithPassword({ email: '<tel>@cliente.invalid', password })`.
  - O domínio `cliente.invalid` está fixo no gatilho do banco. Não mudar no front sem mudar no banco.
- **Admin:** e-mail real + senha, criado no painel do Supabase e inserido em `admins`. Usuários sem e-mail `@cliente.invalid` **não** viram cliente.
- Chamadas de auth devem rodar **no navegador** (componentes `'use client'`), não em Server Actions. O limite de tentativas do Supabase é por IP.
- Não há recuperação de senha por e-mail/SMS.

---

## 4. Funções (RPC)

### `criar_pedido(...)` → `jsonb` — anon e authenticated
Cria pedido + itens + conteúdo dos kits numa única transação e devolve `{"numero": <id>, "total": <numeric>}`.

| parâmetro | tipo | obrigatório |
|---|---|---|
| p_nome | text | sim |
| p_sobrenome | text | sim |
| p_telefone | text | sim (pode vir com máscara; o banco deixa só dígitos) |
| p_rua | text | sim |
| p_vila | text | sim |
| p_numero | text | sim |
| p_itens | jsonb | sim |
| p_ponto_referencia | text | não |
| p_forma_pagamento | text | não (`pix` / `dinheiro` / `cartao`) |
| p_troco_para | numeric | não (só com `dinheiro`) |
| p_observacao | text | não |
| p_agendado_para | timestamptz | não (ISO string) |

Formato de `p_itens` (1 a 30 linhas):
```json
[
  { "produto_id": 1, "quantidade": 30 },
  { "produto_id": 5, "quantidade": 2 },
  { "produto_id": 7, "quantidade": 1,
    "sabores": [ { "produto_id": 1, "quantidade": 60 },
                 { "produto_id": 2, "quantidade": 40 } ] }
]
```

**Regras aplicadas pelo banco:**
- O produto precisa estar `ativo`. Preço, nome e categoria vêm da tabela `produtos`; qualquer preço enviado é ignorado.
- Se logado como cliente, `cliente_id` é preenchido automaticamente via `auth.uid()`.
- **Kit com escolha** (`salgados_a_escolher > 0`):
  - soma dos `sabores` = `salgados_a_escolher × quantidade`;
  - sabores precisam ser produtos `salgado` ativos;
  - nº de sabores distintos ≤ `max_sabores`;
  - os sabores valem para todos os kits daquela linha;
  - sabores com quantidade 0 são ignorados.
- `sabores` enviados para produto sem escolha → erro.
- As partes fixas do kit (`kit_componentes`) são copiadas para `itens_pedido_conteudo`, multiplicadas pela quantidade.
- Anti-spam: no máximo 3 pedidos por telefone a cada 10 minutos.
- `agendado_para` precisa ser futuro e até 90 dias.
- `troco_para` precisa ser ≥ total.

**Erros** (o campo `error.code` do supabase-js traz o SQLSTATE):
- `P0001`: erro de regra; `error.message` já vem em **português**, pronto para mostrar ao usuário (ex.: `Escolha exatamente 100 salgados para "Kit Festa 100" (escolhidos: 50).`).
- `23514`: violação de check (dados inválidos: nome curto, telefone inválido, quantidade fora do limite etc.).

### `sou_admin()` → `boolean` — authenticated
Retorna `true` se o usuário logado está em `admins`.

### `ping()` → `text` — anon e authenticated
Retorna `'ok'`. É usada por um cron diário (keep-alive) para o projeto gratuito não ser pausado após 7 dias sem uso.

---

## 5. Permissões (RLS)

| tabela | visitante (anon) | cliente logado | admin |
|---|---|---|---|
| produtos | SELECT só `ativo = true` | SELECT só `ativo = true` | SELECT tudo, INSERT, UPDATE, DELETE |
| kit_componentes | SELECT tudo | SELECT tudo | SELECT, INSERT, UPDATE, DELETE |
| clientes | — | SELECT/UPDATE (nome, sobrenome) da própria linha | SELECT/UPDATE todos |
| pedidos | — | SELECT dos próprios (`cliente_id = auth.uid()`) | SELECT, UPDATE, DELETE todos |
| itens_pedido | — | SELECT dos próprios pedidos | SELECT, UPDATE, DELETE |
| itens_pedido_conteudo | — | SELECT dos próprios pedidos | SELECT, UPDATE, DELETE |
| admins | — | — | — |

- Ninguém faz INSERT direto em pedidos, itens ou conteúdo: só via `criar_pedido`.
- Usuário logado que não é cliente nem admin vê apenas o cardápio.
- Apagar um pedido apaga em cascata os itens e o conteúdo.

---

## 6. Tempo real

`pedidos` está na publicação `supabase_realtime`, e o Realtime respeita o RLS. Para o painel do admin atualizar sozinho:
```js
supabase.channel('pedidos-admin')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, callback)
  .subscribe()
```

---

## 7. Consultas de referência (supabase-js)

Cardápio público. **Use os nomes das FKs**, porque `produtos` e `kit_componentes` se ligam por duas colunas:
```js
supabase.from('produtos')
  .select(`id, categoria, nome, descricao, preco, imagem_url, salgados_a_escolher, max_sabores,
    componentes:kit_componentes!kit_componentes_kit_fk (
      quantidade,
      produto:produtos!kit_componentes_produto_fk ( id, nome, categoria ) )`)
  .eq('ativo', true).order('ordem').order('nome')
```

Pedidos com itens e conteúdo (admin vê todos; cliente vê os seus):
```js
supabase.from('pedidos')
  .select(`*, itens_pedido ( id, categoria, nome_produto, quantidade, preco_unitario, subtotal,
    itens_pedido_conteudo ( nome_produto, quantidade, escolhido_pelo_cliente ) )`)
  .order('criado_em', { ascending: false })
  .range(0, 29)   // paginar para economizar egress do plano grátis
```

Criar pedido:
```js
const { data, error } = await supabase.rpc('criar_pedido', {
  p_nome, p_sobrenome, p_telefone, p_rua, p_vila, p_numero,
  p_itens: [{ produto_id: 1, quantidade: 30 }],
  p_ponto_referencia: null, p_forma_pagamento: 'pix',
  p_troco_para: null, p_observacao: null, p_agendado_para: null,
})
// data = { numero: 42, total: 30 }
```

---

## 8. Cuidados do plano gratuito

- O projeto pausa após 7 dias sem uso. Existe a função `ping()` para o keep-alive diário.
- Egress limitado: pagine listas e não sirva imagens pelo Supabase Storage (use a pasta `public` do Next).
- Sem backup automático.