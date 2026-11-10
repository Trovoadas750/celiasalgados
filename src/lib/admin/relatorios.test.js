// Rodar com: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { contagem, intervaloRelatorio, normalizarResumo, serieFaturamento, seriePorHora } from "./relatorios.js";

const HOJE = "2026-11-10";

test("períodos", () => {
  assert.deepEqual(intervaloRelatorio("hoje", HOJE), [HOJE, HOJE]);
  assert.deepEqual(intervaloRelatorio("ontem", HOJE), ["2026-11-09", "2026-11-09"]);
  assert.deepEqual(intervaloRelatorio("7dias", HOJE), ["2026-11-04", HOJE]);
  assert.deepEqual(intervaloRelatorio("mes", HOJE), ["2026-11-01", HOJE]);
  assert.deepEqual(intervaloRelatorio("mes_passado", HOJE), ["2026-10-01", "2026-10-31"]);
  assert.deepEqual(intervaloRelatorio("mes_passado", "2026-03-15"), ["2026-02-01", "2026-02-28"]);
  assert.deepEqual(intervaloRelatorio("intervalo", HOJE, "2026-10-05", "2026-10-01"), ["2026-10-05", "2026-10-05"]);
  assert.deepEqual(intervaloRelatorio("intervalo", HOJE, "2025-01-01", "2026-11-10"), ["2025-01-01", "2026-01-01"]);
  assert.deepEqual(intervaloRelatorio("intervalo", HOJE, "", ""), ["2026-11-04", HOJE]);
});

test("faturamento por dia preenche os dias sem venda", () => {
  const serie = serieFaturamento([{ dia: "2026-11-05", pedidos: 2, faturamento: "80.50" }], "2026-11-04", "2026-11-06");
  assert.deepEqual(serie, [
    { chave: "2026-11-04", rotulo: "04/11", valor: 0, pedidos: 0 },
    { chave: "2026-11-05", rotulo: "05/11", valor: 80.5, pedidos: 2 },
    { chave: "2026-11-06", rotulo: "06/11", valor: 0, pedidos: 0 },
  ]);
});

test("períodos longos viram meses", () => {
  const serie = serieFaturamento(
    [
      { dia: "2026-01-10", pedidos: 1, faturamento: 10 },
      { dia: "2026-01-20", pedidos: 1, faturamento: 5 },
      { dia: "2026-03-01", pedidos: 2, faturamento: 30 },
    ],
    "2026-01-01",
    "2026-03-31",
  );
  assert.deepEqual(serie.map((s) => [s.rotulo, s.valor, s.pedidos]), [
    ["jan/26", 15, 2],
    ["fev/26", 0, 0],
    ["mar/26", 30, 2],
  ]);
});

test("pedidos por hora", () => {
  assert.deepEqual(seriePorHora([{ hora: 10, pedidos: 2 }, { hora: 12, pedidos: 1 }, { hora: 3, pedidos: 0 }]).map((h) => [h.rotulo, h.valor]), [
    ["10h", 2],
    ["11h", 0],
    ["12h", 1],
  ]);
  assert.deepEqual(seriePorHora([]), []);
});

test("normaliza o retorno do banco", () => {
  assert.deepEqual(contagem(3), { pedidos: 3, valor: null });
  assert.deepEqual(contagem({ pedidos: "2", valor: "40.00" }), { pedidos: 2, valor: 40 });
  const r = normalizarResumo({ pedidos: 4, faturamento: "100.5", aguardando_pagamento: { pedidos: 1, valor: "20" }, por_origem: { site: 3, admin: 1 } });
  assert.equal(r.faturamento, 100.5);
  assert.deepEqual(r.aguardando, { pedidos: 1, valor: 20 });
  assert.equal(r.porOrigem.admin.pedidos, 1);
  assert.deepEqual(r.topSabores, []);
});
