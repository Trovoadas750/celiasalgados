// Testes das mensagens prontas. Rodar com: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LIMITE_MENSAGEM,
  linkAcompanhamento,
  linkWhatsapp,
  mensagemCombinarEntrega,
  mensagemLembretePagamento,
  mensagemPagamento,
  mensagemPedido,
  textoFormaPagamento,
} from "./mensagemWhatsapp.js";

// "Agora" fixo: 22/10/2026 19:37 em Brasília.
const AGORA = new Date("2026-10-22T19:37:00-03:00").getTime();

const base = {
  numero: 42,
  nome: "Ana",
  sobrenome: "Lima",
  telefone: "14999990001",
  itens: [
    {
      quantidade: 1,
      nome: "Cento (100 salgados)",
      modo: "pronto",
      sabores: [
        { nome: "Coxinha de frango", quantidade: 34 },
        { nome: "Kibe de carne", quantidade: 33 },
        { nome: "Risole de carne", quantidade: 33 },
      ],
    },
    { quantidade: 2, nome: "Coca-Cola 2L" },
    { quantidade: 3, nome: "Molho de pimenta" },
  ],
  subtotal: 106.8,
};

const endereco = { rua: "Rua X", numero: "120", vila: "Vila Y", ponto_referencia: "portão azul" };

test("pedido agora com entrega, frete, troco e acompanhamento", () => {
  const texto = mensagemPedido(
    {
      ...base,
      total: 113.8,
      taxaEntrega: 7,
      tipoEntrega: "entrega",
      endereco,
      agendadoPara: null,
      forma: "dinheiro",
      trocoPara: 150,
      pagamentoStatus: "nao_exigido",
      observacao: "Tocar o interfone",
      linkAcompanhamento: "https://exemplo.com.br/acompanhar/abc123",
    },
    AGORA,
  );
  assert.equal(
    texto,
    [
      "Olá! Fiz um pedido pelo site 😊",
      "*Pedido nº 42*",
      "Nome: Ana Lima · Tel: (14) 99999-0001",
      "",
      "*Itens*",
      "• 1x Cento (100 salgados) [pronto]: 34 Coxinha de frango, 33 Kibe de carne, 33 Risole de carne",
      "• 2x Coca-Cola 2L",
      "• 3x Molho de pimenta",
      "",
      "Subtotal: R$ 106,80",
      "Entrega: R$ 7,00",
      "*TOTAL A PAGAR: R$ 113,80*",
      "",
      "Entrega em: Rua X, 120 - Vila Y (ref.: portão azul)",
      "Quando: o quanto antes",
      "Pagamento: Dinheiro (troco para R$ 150,00)",
      "Observação: Tocar o interfone",
      "Acompanhe: https://exemplo.com.br/acompanhar/abc123",
    ].join("\n"),
  );
});

test("retirada agora: sem linha de entrega, cartão na retirada, sem acompanhamento", () => {
  const texto = mensagemPedido(
    { ...base, total: 106.8, taxaEntrega: 0, tipoEntrega: "retirada", forma: "cartao", pagamentoStatus: "nao_exigido" },
    AGORA,
  );
  assert.match(texto, /\nRetirada no local\n/);
  assert.match(texto, /Pagamento: Cartão na retirada/);
  assert.match(texto, /\*TOTAL A PAGAR: R\$ 106,80\*/);
  assert.doesNotMatch(texto, /Entrega:/);
  assert.doesNotMatch(texto, /Status:/);
  assert.doesNotMatch(texto, /Observação/);
  assert.doesNotMatch(texto, /Acompanhe/);
});

test("agendado pendente: data, forma e prazo de pagamento", () => {
  const texto = mensagemPedido(
    {
      ...base,
      total: 113.8,
      taxaEntrega: 7,
      tipoEntrega: "entrega",
      endereco,
      agendadoPara: "2026-10-23T10:30:00-03:00",
      forma: "pix",
      pagamentoStatus: "pendente",
      pagamentoExpiraEm: "2026-10-22T21:37:00-03:00",
    },
    AGORA,
  );
  assert.match(texto, /\nAgendado para sex, 23\/10 às 10:30\n/);
  assert.match(texto, /\nPagamento: Pix\n/);
  assert.match(texto, /Status: aguardando pagamento — pagar até 21:37 para confirmar/);
  assert.doesNotMatch(texto, /o quanto antes/);
});

test("agendado: prazo em outro dia mostra a data", () => {
  const texto = mensagemPedido(
    {
      ...base,
      total: 106.8,
      tipoEntrega: "retirada",
      agendadoPara: "2026-10-24T09:00:00-03:00",
      forma: "cartao",
      pagamentoStatus: "pendente",
      pagamentoExpiraEm: "2026-10-23T08:00:00-03:00",
    },
    AGORA,
  );
  assert.match(texto, /Pagamento: Cartão de crédito/);
  assert.match(texto, /pagar até 23\/10 às 08:00 para confirmar/);
});

test("2 pacotes mostram os sabores por pacote", () => {
  const texto = mensagemPedido(
    {
      ...base,
      total: 70,
      tipoEntrega: "retirada",
      forma: "pix",
      itens: [{ quantidade: 2, nome: "30 salgados", modo: "congelado", sabores: [{ nome: "Coxinha", quantidade: 60 }] }],
    },
    AGORA,
  );
  assert.match(texto, /• 2x 30 salgados \[congelado\], cada: 30 Coxinha/);
});

test("mensagem longa resume os sabores em qualidades", () => {
  const sabores = Array.from({ length: 10 }, (_, i) => ({ nome: `Salgado com nome bem comprido ${i + 1}`, quantidade: 10 }));
  const itens = Array.from({ length: 8 }, () => ({ quantidade: 1, nome: "Cento (100 salgados)", modo: "pronto", sabores }));
  const texto = mensagemPedido({ ...base, total: 600, tipoEntrega: "retirada", forma: "pix", itens }, AGORA);
  assert.ok(texto.length <= LIMITE_MENSAGEM, `mensagem com ${texto.length} caracteres`);
  assert.match(texto, /\+ \d+ qualidades/);
  assert.doesNotMatch(texto, /sabores/);
  assert.match(texto, /\*TOTAL A PAGAR: R\$ 600,00\*/);
});

test("forma de pagamento por extenso", () => {
  assert.equal(textoFormaPagamento({ forma: "cartao", tipoEntrega: "entrega" }), "Cartão na entrega");
  assert.equal(textoFormaPagamento({ forma: "dinheiro", trocoPara: null }), "Dinheiro");
  assert.equal(textoFormaPagamento({ forma: null, agendadoPara: "2026-10-23T10:30:00-03:00" }), "Pix ou cartão de crédito");
});

test("mensagem de pagamento do agendamento", () => {
  const pedido = {
    numero: 42,
    total: 113.8,
    agendadoPara: "2026-10-23T10:30:00-03:00",
    expiraEm: "2026-10-22T21:37:00-03:00",
  };
  assert.equal(
    mensagemPagamento({ ...pedido, forma: "pix" }, AGORA),
    [
      "Olá! Quero pagar o agendamento do *pedido nº 42*.",
      "*Valor: R$ 113,80* · Forma: Pix",
      "Agendado para sex, 23/10 às 10:30 (pagar até 21:37).",
      "Pode me enviar a chave Pix?",
    ].join("\n"),
  );
  assert.match(mensagemPagamento({ ...pedido, forma: "cartao" }, AGORA), /Forma: Cartão de crédito\n[\s\S]*o link do cartão\?$/);
  assert.match(mensagemPagamento({ ...pedido, forma: null }, AGORA), /a chave Pix ou o link do cartão\?$/);
});

test("links", () => {
  assert.equal(linkWhatsapp("Olá & tchau"), "https://wa.me/5514997534514?text=Ol%C3%A1%20%26%20tchau");
  assert.equal(linkAcompanhamento("abc123", "https://site.com.br/"), "https://site.com.br/acompanhar/abc123");
  assert.equal(linkAcompanhamento(null, "https://site.com.br"), null);
  assert.equal(linkAcompanhamento("abc123", ""), null);
});

test("lembrete do servidor e combinar entrega", () => {
  assert.equal(
    mensagemLembretePagamento({ numero: 11, total: "80.63" }),
    "Para confirmar seu agendamento do pedido nº 11, realize o pagamento de R$ 80,63!",
  );
  assert.equal(
    mensagemCombinarEntrega({ rua: " Rua X ", numero: "10", vila: "Vila Z" }),
    "Olá! Quero fazer um pedido para entrega em Rua X, 10 - Vila Z, Ourinhos. Vocês entregam aqui? Qual o valor do frete?",
  );
});
