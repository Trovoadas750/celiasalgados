// Testes da divisão fixa dos sabores. Rodar com: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { dividirSabores, quantidadesPorPacote } from "./dividirSabores.js";

const sabores = (n) => Array.from({ length: n }, (_, i) => ({ produtoId: i + 1, nome: `Sabor ${i + 1}` }));
const qtds = (lista) => lista.map((s) => s.quantidade);

test("50 com 3 sabores = 18 + 16 + 16 (resto no primeiro)", () => {
  assert.deepEqual(qtds(dividirSabores(50, sabores(3))), [18, 16, 16]);
});

test("Cento com 3 sabores = 34 + 33 + 33", () => {
  assert.deepEqual(qtds(dividirSabores(100, sabores(3))), [34, 33, 33]);
});

test("30 com 2 sabores = 15 + 15", () => {
  assert.deepEqual(qtds(dividirSabores(30, sabores(2))), [15, 15]);
});

test("Cento com 4 sabores = 25 cada", () => {
  assert.deepEqual(qtds(dividirSabores(100, sabores(4))), [25, 25, 25, 25]);
});

test("1 sabor = pacote inteiro", () => {
  assert.deepEqual(qtds(dividirSabores(50, sabores(1))), [50]);
});

test("2 pacotes de 50 com 3 sabores = 36 + 32 + 32", () => {
  assert.deepEqual(qtds(dividirSabores(50, sabores(3), 2)), [36, 32, 32]);
});

test("a soma sempre fecha o pacote × nº de pacotes", () => {
  for (const tamanho of [30, 50, 100]) {
    for (let n = 1; n <= 4; n++) {
      for (const pacotes of [1, 2, 3]) {
        const total = qtds(dividirSabores(tamanho, sabores(n), pacotes)).reduce((a, b) => a + b, 0);
        assert.equal(total, tamanho * pacotes, `${tamanho} com ${n} sabores × ${pacotes}`);
      }
    }
  }
});

test("mantém a ordem e os dados de cada sabor", () => {
  const r = dividirSabores(50, [{ produtoId: 9, nome: "Kibe" }, { produtoId: 3, nome: "Coxinha" }]);
  assert.deepEqual(r, [
    { produtoId: 9, nome: "Kibe", quantidade: 25 },
    { produtoId: 3, nome: "Coxinha", quantidade: 25 },
  ]);
});

test("nenhum sabor = lista vazia", () => {
  assert.deepEqual(quantidadesPorPacote(50, 0), []);
  assert.deepEqual(dividirSabores(50, []), []);
});
