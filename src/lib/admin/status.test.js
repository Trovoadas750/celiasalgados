// Rodar com: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  horaAlvo,
  ordenarPorHoraAlvo,
  proximoStatus,
  resumoItens,
  rotuloAcaoProximo,
  rotuloPagamento,
  rotuloStatus,
  statusAnterior,
  textoHoraAlvo,
  urgencia,
} from "./status.js";
import { etapasAcompanhamento } from "../acompanhamento.js";
import { gerarCsv, valorCsv } from "./csv.js";
import { linkWhatsappCliente, mensagemParaCliente, mensagensParaCliente } from "./mensagens.js";

const AGORA = new Date("2026-10-22T18:00:00-03:00").getTime();
const agora = (min) => new Date(AGORA + min * 60000).toISOString();

test("rótulos de status na entrega e na retirada", () => {
  assert.equal(rotuloStatus("saiu_para_entrega", "entrega"), "Saiu para entrega");
  assert.equal(rotuloStatus("saiu_para_entrega", "retirada"), "Pronto para retirar");
  assert.equal(rotuloStatus("entregue", "retirada"), "Retirado");
  assert.equal(rotuloStatus("entregue", "entrega"), "Entregue");
});

test("próximo status e o texto do botão", () => {
  assert.equal(proximoStatus("novo"), "em_preparo");
  assert.equal(proximoStatus("entregue"), null);
  assert.equal(proximoStatus("cancelado"), null);
  assert.equal(statusAnterior("em_preparo"), "novo");
  assert.equal(statusAnterior("novo"), null);
  assert.equal(rotuloAcaoProximo("novo", "entrega"), "Iniciar preparo");
  assert.equal(rotuloAcaoProximo("em_preparo", "retirada"), "Pronto para retirar");
  assert.equal(rotuloAcaoProximo("saiu_para_entrega", "retirada"), "Retirado");
  assert.equal(rotuloAcaoProximo("saiu_para_entrega", "entrega"), "Entregue");
});

test("pagamento", () => {
  assert.equal(rotuloPagamento("pendente"), "Aguardando pagamento");
  assert.equal(rotuloPagamento("nao_exigido", "retirada"), "Paga na retirada");
});

test("hora-alvo e urgência usam o mesmo tempo de preparo", () => {
  const agoraPedido = { id: 1, status: "novo", criado_em: agora(-50), agendado_para: null };
  assert.equal(horaAlvo(agoraPedido, 40).toISOString(), agora(-10));
  assert.deepEqual(urgencia(agoraPedido, AGORA, 40), { tipo: "atrasado", minutos: 10, texto: "Atrasado 10 min" });
  assert.equal(urgencia(agoraPedido, AGORA, 60).tipo, "urgente"); // com 60 min ainda faltam 10
  const agendado = { id: 2, status: "novo", criado_em: agora(-300), agendado_para: agora(90) };
  assert.equal(urgencia(agendado, AGORA, 40), null);
  assert.equal(urgencia({ ...agendado, agendado_para: agora(20) }, AGORA, 40).texto, "Em 20 min");
  assert.equal(urgencia({ ...agoraPedido, status: "entregue" }, AGORA, 40), null);
  assert.equal(urgencia({ ...agoraPedido, pagamento_status: "expirado" }, AGORA, 40), null);
});

test("texto da hora-alvo", () => {
  assert.equal(textoHoraAlvo({ criado_em: agora(-12), agendado_para: null }, AGORA), "Agora, há 12 min");
  assert.equal(textoHoraAlvo({ agendado_para: "2026-10-22T18:30:00-03:00" }, AGORA), "Hoje 18:30");
  assert.equal(textoHoraAlvo({ agendado_para: "2026-10-23T10:00:00-03:00" }, AGORA), "Amanhã 10:00");
  assert.equal(textoHoraAlvo({ agendado_para: "2026-10-25T10:00:00-03:00" }, AGORA), "dom, 25/10 10:00");
});

test("ordena pela hora-alvo", () => {
  const lista = [
    { id: 1, criado_em: agora(-5), agendado_para: null }, // alvo +35
    { id: 2, criado_em: agora(-100), agendado_para: agora(10) }, // alvo +10
    { id: 3, criado_em: agora(-60), agendado_para: null }, // alvo -20
  ];
  assert.deepEqual(ordenarPorHoraAlvo(lista, 40).map((p) => p.id), [3, 2, 1]);
});

test("resumo dos itens", () => {
  assert.equal(
    resumoItens([
      { quantidade: 1, nome_produto: "Cento (100 salgados)", modo: "pronto" },
      { quantidade: 2, nome_produto: "Coca-Cola 2L", modo: null },
    ]),
    "1x Cento (100 salgados) pronto · 2x Coca-Cola 2L",
  );
});

test("linha do tempo: etapas, retirada e cancelado", () => {
  const historico = [
    { status: "novo", em: "2026-10-22T17:00:00-03:00" },
    { status: "em_preparo", em: "2026-10-22T17:10:00-03:00" },
  ];
  const etapas = etapasAcompanhamento({ status: "em_preparo", tipo_entrega: "retirada", historico });
  assert.deepEqual(
    etapas.map((e) => [e.rotulo, e.situacao, Boolean(e.em)]),
    [
      ["Pedido recebido", "feita", true],
      ["Em preparo", "atual", true],
      ["Pronto para retirar", "futura", false],
      ["Retirado", "futura", false],
    ],
  );
  const entregue = etapasAcompanhamento({ status: "entregue", tipo_entrega: "entrega", historico });
  assert.equal(entregue.at(-1).situacao, "feita");
  const cancelado = etapasAcompanhamento({
    status: "cancelado",
    tipo_entrega: "entrega",
    historico: [...historico, { status: "cancelado", em: "2026-10-22T17:20:00-03:00" }],
  });
  assert.deepEqual(cancelado.map((e) => e.status), ["novo", "em_preparo", "cancelado"]);
  assert.equal(cancelado.at(-1).situacao, "cancelada");
});

test("mensagens para o cliente", () => {
  const p = { id: 42, total: 82, tipo_entrega: "retirada" };
  const link = "https://site.com.br/acompanhar/abc";
  assert.equal(
    mensagemParaCliente("pronto", p, { link, enderecoLoja: "Rua Miguel de Moraes, 377" }),
    `Seu pedido nº 42 está pronto para retirada na Rua Miguel de Moraes, 377.\nAcompanhe: ${link}`,
  );
  assert.equal(mensagemParaCliente("cobranca", p), "Para confirmar o agendamento do pedido nº 42, falta o pagamento de R$ 82,00.");
  assert.equal(mensagemParaCliente("cancelado", p, { motivo: "sem entregador" }), "Seu pedido nº 42 foi cancelado: sem entregador");
  assert.ok(mensagensParaCliente({ ...p, tipo_entrega: "entrega" }).some((m) => m.id === "saiu"));
  assert.equal(linkWhatsappCliente("(14) 99999-0001", "Oi"), "https://wa.me/5514999990001?text=Oi");
});

test("csv com ; e aspas", () => {
  const csv = gerarCsv(
    [
      { titulo: "Nº", valor: (l) => l.id },
      { titulo: "Cliente", valor: (l) => l.nome },
      { titulo: "Total", valor: (l) => valorCsv(l.total) },
    ],
    [{ id: 1, nome: 'Ana "Lu"; Lima', total: 1234.5 }],
  );
  assert.equal(csv, '﻿Nº;Cliente;Total\r\n1;"Ana ""Lu""; Lima";1.234,50');
});

test("confirmação de pedido lançado pelo painel", async () => {
  const { mensagemConfirmacaoPainel } = await import("./mensagens.js");
  assert.equal(
    mensagemConfirmacaoPainel({ numero: 50, total: 82, tipoEntrega: "retirada", quandoTexto: "sáb, 25/10 às 10:30", pagamentoTexto: "Pix", link: null }),
    "Recebemos seu pedido nº 50! 😊\nTotal: R$ 82,00 · Pix\nRetirada: sáb, 25/10 às 10:30",
  );
});

test("mensagens de expirado e nova senha", async () => {
  const { mensagemExpirado, mensagemNovaSenha } = await import("./mensagens.js");
  assert.match(mensagemExpirado({ id: 7 }), /^Seu agendamento do pedido nº 7 foi cancelado/);
  assert.match(mensagemNovaSenha({ nome: "Ana", senha: "Abc1-Def2-Ghi3" }), /Olá, Ana!.*\nNova senha: Abc1-Def2-Ghi3\n/s);
});

test("sugestão de senha", async () => {
  const { gerarSenha } = await import("./senha.js");
  assert.equal(gerarSenha(() => new Uint32Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])), "Abc5-Efg9-Jkm5");
  const senha = gerarSenha();
  assert.match(senha, /^[A-Z][a-z]{2}[2-9]-[A-Z][a-z]{2}[2-9]-[A-Z][a-z]{2}[2-9]$/);
  assert.doesNotMatch(senha, /[01ilIoO]/);
});
