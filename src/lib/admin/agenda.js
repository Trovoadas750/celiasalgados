// Grade de horários da agenda (funções puras; testes em agenda.test.js).
// Mesma regra do banco: de 30 em 30 min a partir de `abre`, até 30 min antes de `fecha`.

import { somarDias } from "./datas.js";

/** "08:30" ou "08:30:00" -> 510 */
export function paraMinutos(hora) {
  const [h, m] = String(hora).split(":").map(Number);
  return h * 60 + (m || 0);
}

/** 510 -> "08:30" */
export function paraHora(minutos) {
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}

/** 0 = domingo ... 6 = sábado (dia do calendário de Brasília). */
export function diaDaSemana(data) {
  return new Date(`${data}T12:00:00-03:00`).getUTCDay();
}

/**
 * Horários de agendamento de um dia.
 * @param {{ dia_semana: number, abre: string, fecha: string, ativo: boolean }[]} faixas
 * @returns {string[]} ["08:00", "08:30", ...] em ordem, sem repetir
 */
export function horariosDoDia(faixas, data) {
  return horariosDoDiaDaSemana(faixas, diaDaSemana(data));
}

/** Mesma grade, pelo dia da semana (0 = domingo): prévia da tela Horários. */
export function horariosDoDiaDaSemana(faixas, dia) {
  const horas = new Set();
  for (const f of faixas) {
    if (!f.ativo || f.dia_semana !== dia) continue;
    for (let m = paraMinutos(f.abre); m <= paraMinutos(f.fecha) - 30; m += 30) horas.add(m);
  }
  return [...horas].sort((a, b) => a - b).map(paraHora);
}

/** Os 7 dias (segunda a domingo) da semana que contém `data`. */
export function semanaDe(data) {
  const deslocamento = (diaDaSemana(data) + 6) % 7; // segunda = 0
  const segunda = somarDias(data, -deslocamento);
  return Array.from({ length: 7 }, (_, i) => somarDias(segunda, i));
}
