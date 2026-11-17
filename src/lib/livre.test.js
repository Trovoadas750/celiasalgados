// Testes do "Monte do seu jeito". Rodar com: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ajustarQuantidade,
  dividirLivre,
  kitParaSugerir,
  problemasLivre,
  quantidadeAbaixo,
  quantidadeAcima,
  situacaoLivre,
  textoDivisao,
  totalSalgados,
} from "./livre.js";

const REGRAS = { quantidade_minima: 30, quantidade_maxima: 500, minimo_qualidades: 2, minimo_por_sabor: 10, multiplo: 5 };

test("ajuste da quantidade digitada: múltiplo mais próximo, mínimo e máximo", () => {
  assert.equal(ajustarQuantidade("", REGRAS), 0);
  assert.equal(ajustarQuantidade("0", REGRAS), 0);
  assert.equal(ajustarQuantidade("-5", REGRAS), 0);
  assert.equal(ajustarQuantidade("3", REGRAS), 10); // abaixo do mínimo sobe para o mínimo
  assert.equal(ajustarQuantidade("12", REGRAS), 10);
  assert.equal(ajustarQuantidade("13", REGRAS), 15);
  assert.equal(ajustarQuantidade("22,5", REGRAS), 25);
  assert.equal(ajustarQuantidade("40", REGRAS), 40);
  assert.equal(ajustarQuantidade("999", REGRAS), 500);
  assert.equal(ajustarQuantidade("abc", REGRAS), 0);
  assert.equal(ajustarQuantidade("11", { ...REGRAS, minimo_por_sabor: 12 }), 15); // mínimo fora do múltiplo sobe
});

test("botões + e −", () => {
  assert.equal(quantidadeAcima(0, REGRAS), 10);
  assert.equal(quantidadeAcima(10, REGRAS), 15);
  assert.equal(quantidadeAbaixo(15, REGRAS), 10);
  assert.equal(quantidadeAbaixo(10, REGRAS), 0);
});

test("situação da montagem", () => {
  const s = (modo, ...qtds) => situacaoLivre({ modo, sabores: qtds.map((quantidade, i) => ({ produtoId: i, quantidade })), regras: REGRAS });
  assert.equal(s(null).rodape, "Escolha como quer receber");
  assert.equal(s("congelado").rodape, "Escolha pelo menos 30 salgados e 2 qualidades");
  assert.deepEqual(s("congelado", 10, 10), { pronto: false, aviso: "Faltam 10 para o mínimo de 30", rodape: "Faltam 10 para o mínimo de 30" });
  assert.equal(s("congelado", 20).rodape, "Escolha pelo menos 30 salgados e 2 qualidades");
  assert.equal(s("congelado", 30).aviso, "Escolha pelo menos mais 1 qualidade");
  assert.deepEqual(s("congelado", 15, 15), { pronto: true, aviso: null, rodape: null });
  assert.equal(s("congelado", 300, 205).aviso, "Máximo de 500 salgados");
  assert.equal(totalSalgados([{ quantidade: 15 }, { quantidade: 20 }]), 35);
});

test("divisão do pedido entre as qualidades", () => {
  assert.deepEqual(dividirLivre(30, 2, REGRAS), [15, 15]);
  assert.deepEqual(dividirLivre(100, 3, REGRAS), [35, 35, 30]);
  assert.deepEqual(dividirLivre(50, 4, REGRAS), [15, 15, 10, 10]);
  assert.equal(dividirLivre(30, 4, REGRAS), null); // 4 × 10 > 30
  assert.equal(dividirLivre(33, 2, REGRAS), null); // fora do múltiplo
});

test("quando sugerir o kit", () => {
  const kits = [
    { id: 1, salgados_a_escolher: 30, max_sabores: 2 },
    { id: 2, salgados_a_escolher: 50, max_sabores: 3 },
    { id: 3, salgados_a_escolher: 100, max_sabores: 4 },
    { id: 4, salgados_a_escolher: 100, max_sabores: 4, ativo: false },
  ];
  const saboresPorId = new Map([
    [10, { id: 10, nome: "Coxinha", vende_congelado: true, vende_pronto: true }],
    [11, { id: 11, nome: "Kibe", vende_congelado: true, vende_pronto: true }],
    [12, { id: 12, nome: "Mini pastel", vende_congelado: false, vende_pronto: true }],
    [13, { id: 13, nome: "Risole", vende_congelado: true, vende_pronto: true }],
  ]);
  const sugerir = (total, ids, modo = "congelado", qtd = 10) =>
    kitParaSugerir({ total, sabores: ids.map((produtoId) => ({ produtoId, quantidade: qtd })), modo, kits, saboresPorId });

  assert.equal(sugerir(50, [10, 11, 13])?.id, 2); // tamanho igual e cabe no máximo
  assert.equal(sugerir(100, [10, 11])?.id, 3);
  assert.equal(sugerir(70, [10, 11]), null); // não existe kit de 70
  assert.equal(sugerir(30, [10, 11, 13]), null); // 3 qualidades não cabem no kit de 30
  assert.equal(sugerir(50, [10, 12]), null); // mini pastel não sai congelado
  assert.equal(sugerir(50, [10, 12], "pronto")?.id, 2);
  assert.equal(sugerir(50, [], "congelado"), null);
});

test("texto da divisão e conferência do pedido repetido", () => {
  assert.equal(textoDivisao([25, 25, 25, 25]), "25 de cada");
  assert.equal(textoDivisao([34, 33, 33]), "34, 33 e 33");

  const saboresPorId = new Map([
    [10, { id: 10, nome: "Coxinha", vende_congelado: true, vende_pronto: true }],
    [11, { id: 11, nome: "Kibe", vende_congelado: true, vende_pronto: true }],
  ]);
  const base = { modo: "congelado", regras: REGRAS, maxSabores: 10, saboresPorId };
  assert.deepEqual(problemasLivre({ ...base, sabores: [{ produtoId: 10, quantidade: 20 }, { produtoId: 11, quantidade: 15 }] }), []);
  const problemas = problemasLivre({ ...base, sabores: [{ produtoId: 10, quantidade: 20 }, { produtoId: 99, nome: "Esfiha", quantidade: 15 }] });
  assert.ok(problemas.includes("Esfiha não está mais no cardápio"));
});
