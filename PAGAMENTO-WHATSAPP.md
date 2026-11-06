# Pagamento pelo WhatsApp: passo a passo da loja

Por enquanto o site **não recebe pagamento online**. Todo pagamento é combinado pelo WhatsApp da loja, (14) 99753-4514.

Existem dois tipos de pedido:

- **Pedido "o quanto antes"**: o cliente paga na entrega ou na retirada (Pix, dinheiro ou cartão na maquininha). Não precisa confirmar nada no sistema.
- **Pedido agendado**: o cliente **paga antes**, por Pix ou cartão de crédito. O horário só fica garantido depois que a loja **confirma o pagamento no sistema**.

---

## 1. O cliente manda a mensagem com o pedido

Depois de finalizar no site, o cliente toca em **"Enviar pedido para a loja no WhatsApp"**. Chega uma mensagem assim:

```
Olá! Fiz um pedido pelo site 😊
*Pedido nº 42*
Nome: Ana Lima · Tel: (14) 99999-0001

*Itens*
• 1x Cento (100 salgados) [pronto]: 34 Coxinha de frango, 33 Kibe de carne, 33 Risole de carne
• 2x Coca-Cola 2L

Subtotal: R$ 106,80
Entrega: R$ 7,00
*TOTAL A PAGAR: R$ 113,80*

Entrega em: Rua X, 120 - Vila Y (ref.: portão azul)
Agendado para sex, 23/10 às 10:30
Pagamento: Pix
Status: aguardando pagamento — pagar até 21:37 para confirmar
```

- O **TOTAL A PAGAR** é o valor que o sistema gravou e **já inclui o frete**. Cobre exatamente esse valor.
- Guarde o **número do pedido** (ex.: 42). Ele é usado para confirmar o pagamento.

Nos agendamentos, o cliente também pode tocar em **"Pagar agora"** (no aviso do site ou em "Meus pedidos"). Nesse caso chega uma mensagem curta com o número do pedido, o valor e a forma de pagamento.

## 2. Responda com a chave Pix ou o link do cartão

- **Pix**: envie a chave Pix da loja.
- **Cartão de crédito**: gere o link de pagamento no app da maquininha (InfinitePay) com o **valor total** e envie ao cliente.

## 3. Pagamento recebido: confirme no sistema em até 2 horas

> ⚠ **Muito importante:** se o pagamento não for confirmado no sistema dentro do prazo (2 horas, ou até o horário agendado se for antes), **o agendamento é cancelado sozinho e o horário fica livre** para outro cliente.

O painel do administrador ainda não existe. Por enquanto, confirme pelo **SQL Editor do Supabase**:

1. Entre no Supabase → projeto da loja → **SQL Editor** → **New query**.
2. Cole o comando abaixo, troque o **42** pelo número do pedido e a anotação pelo que fizer sentido (forma e data do pagamento).
3. Clique em **Run**.

```sql
update public.pedidos
   set pagamento_status = 'pago', pago_em = now(),
       pagamento_referencia = 'Pix WhatsApp 23/10'
 where id = 42 and pagamento_status = 'pendente';
```

- Se aparecer **"1 row affected"**, deu certo: o agendamento está confirmado e o site do cliente atualiza sozinho.
- Se aparecer **"0 rows affected"**, o pedido não estava aguardando pagamento: confira o número, ou veja se ele já expirou (passo 4).

## 4. Ver os agendamentos que aguardam pagamento

No SQL Editor:

```sql
select id, nome, telefone, total, agendado_para, pagamento_expira_em
  from public.pedidos
 where pagamento_status = 'pendente' and status <> 'cancelado'
 order by pagamento_expira_em;
```

- `id` é o número do pedido.
- `pagamento_expira_em` é o prazo: depois desse horário, o agendamento é cancelado.
- Os horários aparecem no fuso UTC (3 horas a mais que o horário de Brasília). Ex.: `00:37+00` = 21:37 em Brasília.

## Resumo rápido

| Situação | O que fazer |
|---|---|
| Chegou pedido "o quanto antes" | Preparar. O pagamento é na entrega/retirada. |
| Chegou pedido agendado | Enviar a chave Pix ou o link do cartão com o **total da mensagem**. |
| Cliente pagou o agendamento | Confirmar no SQL Editor (passo 3) **antes do prazo**. |
| Pagamento chegou depois do prazo | O pedido já foi cancelado. Combine com o cliente (novo pedido ou devolução). |
