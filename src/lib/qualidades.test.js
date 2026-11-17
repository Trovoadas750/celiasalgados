// Rodar com: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { comQualidades } from "./qualidades.js";

test("troca sabores por qualidades, com concordância", () => {
  assert.equal(comQualidades("Escolha quantos salgados e quantos sabores quiser"), "Escolha quantos salgados e quantas qualidades quiser");
  assert.equal(comQualidades("Escolha até 4 sabores"), "Escolha até 4 qualidades");
  assert.equal(
    comQualidades('Em "Monte do seu jeito", cada sabor precisa ter pelo menos 10 unidades.'),
    'Em "Monte do seu jeito", cada qualidade precisa ter pelo menos 10 unidades.',
  );
  assert.equal(comQualidades(null), null);
});
