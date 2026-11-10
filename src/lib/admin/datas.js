// Datas do painel, sempre no fuso de Brasília (sem horário de verão desde 2019: -03:00).

const FUSO = "America/Sao_Paulo";
const OFFSET = "-03:00";

const formatoData = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" });

/** Dia no calendário de Brasília: "2026-10-23". */
export function dataEmBrasilia(quando = Date.now()) {
  return formatoData.format(new Date(quando));
}

/** "2026-10-23" + n dias -> "2026-10-24" */
export function somarDias(data, n) {
  const d = new Date(`${data}T12:00:00${OFFSET}`);
  d.setUTCDate(d.getUTCDate() + n);
  return dataEmBrasilia(d);
}

/** Início do dia em Brasília, em ISO: "2026-10-23T00:00:00-03:00" */
export function inicioDoDia(data) {
  return `${data}T00:00:00${OFFSET}`;
}

/** "2026-10-23" + "18:30" -> ISO em Brasília */
export function dataHora(data, hora) {
  return `${data}T${hora.length === 5 ? `${hora}:00` : hora}${OFFSET}`;
}

/** Date -> ISO (UTC), para filtros do PostgREST. */
export function iso(quando) {
  return new Date(quando).toISOString();
}

/** Agora, em ms. Use em efeitos e cliques (nunca para desenhar a tela: lá use useRelogio). */
export function agoraMs() {
  return Date.now();
}
