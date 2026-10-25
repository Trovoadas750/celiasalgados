// Testes das mensagens prontas. Rodar com: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mensagemCombinarEntrega,
  mensagemLembretePagamento,
  mensagemPagarAgendamento,
  mensagemPedidoAgendado,
} from "./mensagemWhatsapp.js";

const base = {
  numero: 11,
  total: 75,
  nome: "João",
  sobrenome: "Silva",
  telefone: "14999990001",
  agendadoPara: "2026-10-23T11:00:00-03:00",
  forma: "pix",
  pagamentoStatus: "pendente",
  itens: [
    {
      quantidade: 1,
      nome: "Cento (100 salgados)",
      modo: "congelado",
      sabores: [
        { nome: "Coxinha", quantidade: 34 },
        { nome: "Kibe", quantidade: 33 },
        { nome: "Risole de carne", quantidade: 33 },
      ],
    },
    { quantidade: 2, nome: "Coca-Cola 2L" },
  ],
};

test("pedido agendado com entrega e observação", () => {
  const texto = mensagemPedidoAgendado({
    ...base,
    tipoEntrega: "entrega",
    endereco: { rua: "Rua X", numero: "10", vila: "Vila Z", ponto_referencia: "portão azul" },
    taxaEntrega: 7,
    observacao: "Tocar o interfone",
  });
  assert.equal(
    texto,
    [
      "Olá! Acabei de agendar um pedido pelo site.",
      "Pedido nº 11",
      "Nome: João Silva · Tel: (14) 99999-0001",
      "Data: sex, 23/10 às 11:00",
      "Entrega em: Rua X, nº 10, Vila Z (ref.: portão azul)",
      "Itens:",
      "- 1x Cento (100 salgados) [congelado]: 34 Coxinha, 33 Kibe, 33 Risole de carne",
      "- 2x Coca-Cola 2L",
      "Entrega: R$ 7,00",
      "Total: R$ 75,00",
      "Pagamento: Pix · Status: aguardando pagamento",
      "Observação: Tocar o interfone",
    ].join("\n"),
  );
});

test("retirada, sem observação, 2 pacotes mostram sabores por pacote", () => {
  const texto = mensagemPedidoAgendado({
    ...base,
    tipoEntrega: "retirada",
    forma: "",
    itens: [{ quantidade: 2, nome: "30 salgados", modo: "pronto", sabores: [{ nome: "Coxinha", quantidade: 60 }] }],
  });
  assert.match(texto, /\nRetirada no local\n/);
  assert.match(texto, /- 2x 30 salgados \[pronto para comer\], cada: 30 Coxinha/);
  assert.match(texto, /Pagamento: a combinar/);
  assert.doesNotMatch(texto, /Observação/);
});

test("mensagens de pagamento", () => {
  assert.equal(
    mensagemPagarAgendamento({ numero: 11, total: 75 }),
    "Olá! Quero pagar o agendamento do pedido nº 11 no valor de R$ 75,00.",
  );
  assert.equal(
    mensagemLembretePagamento({ numero: 11, total: "80.63" }),
    "Para confirmar seu agendamento do pedido nº 11, realize o pagamento de R$ 80,63!",
  );
});

test("combinar entrega pelo WhatsApp", () => {
  assert.equal(
    mensagemCombinarEntrega({ rua: " Rua X ", numero: "10", vila: "Vila Z" }),
    "Olá! Quero fazer um pedido para entrega em Rua X, 10 - Vila Z, Ourinhos. Vocês entregam aqui? Qual o valor do frete?",
  );
});
