# Edna & Célia Salgados

Site de pedidos da salgadaria (Next.js + Supabase). Regras do banco em [banco-de-dados.md](banco-de-dados.md) e cores em [design-cores.md](design-cores.md).

## Variáveis de ambiente

Copie `.env.example` para `.env.local`.

| variável | onde é usada | observação |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | navegador e servidor | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | navegador | chave publishable (`sb_publishable_...`) |
| `SUPABASE_SECRET_KEY` | **só servidor** | chave secreta (`sb_secret_...`). Nunca com `NEXT_PUBLIC_` |
| `GEOAPIFY_API_KEY` | **só servidor** | geocodificação do frete (`/api/frete`). Nunca com `NEXT_PUBLIC_` |
| `CRON_SECRET` | **só servidor** | protege a rota de lembretes |

## Frete (entrega)

- Entrega só em **Ourinhos-SP**. Frete por **distância em linha reta** até a loja, pelas faixas da tabela `faixas_frete` (hoje: até 2 km R$ 5 · até 4 km R$ 7 · até 6 km R$ 10 · acima R$ 12).
- O navegador manda **só o endereço** para `POST /api/frete` (`src/app/api/frete/route.js`). A rota consulta o cache do banco; se o endereço for novo, chama a **Geoapify** uma vez e grava. Quem calcula distância e valor é o **banco**.
- O checkout calcula sozinho: 1 s depois que o cliente para de digitar ou quando ele sai do campo (rua, número, vila). O CEP é opcional e usa o ViaCEP para preencher rua e bairro.
- Endereço não encontrado, fora da área ou **loja sem coordenadas** (`config_loja.loja_lat/loja_lng`): a entrega pelo site fica bloqueada e o cliente vê "Combinar entrega pelo WhatsApp" ou "Prefiro retirar no local".
- **Geoapify, plano grátis:** 3.000 requisições por dia (cada endereço novo gasta 1; endereço repetido sai do cache). O plano exige o crédito **"Powered by Geoapify"** com link perto do valor do frete: já está no checkout, não remova.
- `POST /api/frete/loja` (só admin, com o token da sessão) busca as coordenadas da loja sem salvar, para a futura tela "Frete" do painel.

## Pagamento do agendamento

- Agendar exige conta de cliente. Todo agendamento nasce **aguardando pagamento** e tem prazo (2 h ou até o horário, o que vier antes). Sem pagamento no prazo, o banco cancela e libera o horário.
- Agendamento é pago **antes**, sem dinheiro nem troco: no checkout, a seção "Pagamento" só explica isso. A forma (`pix` ou `cartao`) é gravada quando o pagamento é confirmado.
- O cliente vê a confirmação na hora (realtime).

### Pagamento online (InfinitePay) — PRONTO, DESLIGADO até ter o handle

Liga sozinho quando `INFINITEPAY_HANDLE` está definido no servidor. Sem ele, o "Pagar agora" abre o WhatsApp da loja e quem confirma é o admin (`confirmar_pagamento`).

- `GET /api/pagamentos` → `{ online }`: o modal decide entre o link da InfinitePay e o WhatsApp.
- `POST /api/pagamentos` `{ pedidoId }` (com o token da sessão do cliente): `preparar_cobranca` → cria o link (`POST /links`) → `salvar_link_cobranca`. Cliques repetidos reaproveitam o link.
- `POST /api/pagamentos/webhook`: aviso da InfinitePay. **Não é assinado**: só diz qual cobrança conferir.
- `GET /api/pagamentos/retorno`: a InfinitePay devolve o cliente aqui; depois ele vai para `/pedidos` com o resultado.
- Webhook e retorno **sempre** conferem no `payment_check` oficial antes de chamar `registrar_pagamento_cobranca`. Tudo fica no log `eventos_pagamento`.

**Para ligar:**
1. Rode o SQL do pagamento online no Supabase (tabelas `cobrancas` e `eventos_pagamento`, funções e o novo `criar_pedido`).
2. Na Vercel, cadastre `INFINITEPAY_HANDLE` (InfiniteTag sem o `$`) e `SITE_URL` (ex.: `https://celiasalgados.com.br`) e faça um novo deploy.
3. Teste com um agendamento de valor baixo na conta real (a InfinitePay não tem ambiente de teste) e confira `eventos_pagamento`.

### Lembretes no site (já funcionam)

`src/components/pagamento/LembretePagamento.js` (no layout, só para cliente logado) consulta `meus_pagamentos_pendentes()` ao abrir o site, a cada 30 min e ao voltar para a aba. Mostra um aviso no topo e, se o cliente permitir, uma notificação do navegador (no máximo 1 a cada 30 min).

### Lembretes pelo servidor (WhatsApp/SMS) — DESLIGADO

Estrutura pronta em `src/app/api/lembretes-pagamento/route.js`:

1. busca `pedidos_para_lembrete()` com a chave secreta;
2. monta "Para confirmar seu agendamento do pedido nº X, realize o pagamento de R$ Y!";
3. chama `enviarLembrete(telefone, mensagem)` em `src/lib/notificacoes.js` (hoje só faz `console.log`);
4. depois de cada envio de verdade, chama `registrar_lembrete(numero)`.

Para ligar, quando houver provedor:

1. Integre o provedor em `enviarLembrete` (fazendo-a devolver `{ enviado: true }`).
2. Defina `SUPABASE_SECRET_KEY` e `CRON_SECRET` na Vercel.
3. Crie um **cron externo a cada 30 minutos** (ex.: [cron-job.org](https://cron-job.org)) chamando:
   ```
   GET https://SEU-DOMINIO/api/lembretes-pagamento
   Authorization: Bearer <CRON_SECRET>
   ```
   **Não use o `vercel.json`:** no plano grátis da Vercel o cron roda só 1 vez por dia.

Sem as variáveis, a rota responde `503` e não faz nada.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
