// Rodar com: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { diaDaSemana, horariosDoDia, horariosDoDiaDaSemana, paraHora, paraMinutos, semanaDe } from "./agenda.js";

const faixas = [
  { dia_semana: 5, abre: "08:00:00", fecha: "10:00:00", ativo: true }, // sexta
  { dia_semana: 5, abre: "13:30:00", fecha: "15:00:00", ativo: true },
  { dia_semana: 5, abre: "20:00:00", fecha: "22:00:00", ativo: false },
  { dia_semana: 6, abre: "08:00:00", fecha: "12:00:00", ativo: true },
];

test("minutos e horas", () => {
  assert.equal(paraMinutos("08:30:00"), 510);
  assert.equal(paraHora(510), "08:30");
});

test("dia da semana em Brasília", () => {
  assert.equal(diaDaSemana("2026-10-23"), 5); // sexta
  assert.equal(diaDaSemana("2026-10-25"), 0); // domingo
});

test("horários do dia: 30 em 30, até 30 min antes de fechar, várias faixas, ignora inativa", () => {
  assert.deepEqual(horariosDoDia(faixas, "2026-10-23"), ["08:00", "08:30", "09:00", "09:30", "13:30", "14:00", "14:30"]);
  assert.deepEqual(horariosDoDia(faixas, "2026-10-25"), []); // domingo fechado
});

test("semana de segunda a domingo", () => {
  assert.deepEqual(semanaDe("2026-10-23"), [
    "2026-10-19",
    "2026-10-20",
    "2026-10-21",
    "2026-10-22",
    "2026-10-23",
    "2026-10-24",
    "2026-10-25",
  ]);
  assert.equal(semanaDe("2026-10-25")[0], "2026-10-19");
});

test("prévia por dia da semana", () => {
  assert.deepEqual(horariosDoDiaDaSemana(faixas, 6), ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]);
});
