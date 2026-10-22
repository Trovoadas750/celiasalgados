# Edna & Célia Salgados

Site de pedidos da salgadaria (Next.js + Supabase). Regras do banco em [banco-de-dados.md](banco-de-dados.md) e cores em [design-cores.md](design-cores.md).

## Variáveis de ambiente

Copie `.env.example` para `.env.local`.

| variável | onde é usada | observação |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | navegador e servidor | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | navegador | chave publishable (`sb_publishable_...`) |
| `SUPABASE_SECRET_KEY` | **só servidor** | chave secreta (`sb_secret_...`). Nunca com `NEXT_PUBLIC_` |
| `CRON_SECRET` | **só servidor** | protege a rota de lembretes |

## Pagamento do agendamento

- Agendar exige conta de cliente. Todo agendamento nasce **aguardando pagamento** e tem prazo (2 h ou até o horário, o que vier antes). Sem pagamento no prazo, o banco cancela e libera o horário.
- **Ainda não há pagamento online.** O botão "Pagar agora" abre o WhatsApp da loja. O ponto de extensão é `iniciarPagamento` em `src/lib/pagamento.js`.
- Quem confirma o pagamento hoje é o admin (`confirmar_pagamento`). O cliente vê a confirmação na hora (realtime).

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
