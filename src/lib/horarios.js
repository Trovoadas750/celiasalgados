import { getSupabase, supabaseConfigurado } from "./supabase";

// Status da loja e horários de atendimento (banco-de-dados.md: status_loja, horarios_funcionamento,
// dias_fechados). Tudo em horário de Brasília. Leitura pública (anon).

export const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/** @returns {Promise<{ aberta: boolean, fecha_as: string | null, proxima_abertura: string | null } | null>} */
export async function buscarStatusLoja() {
  if (!supabaseConfigurado) return null;
  const { data, error } = await getSupabase().rpc("status_loja");
  return error ? null : data;
}

/**
 * Faixas de cada dia da semana (0 = domingo) e os dias fechados dos próximos 7 dias.
 * @returns {Promise<{ dias: { abre: string, fecha: string }[][], fechados: { data: string, motivo: string | null }[] } | null>}
 */
export async function buscarHorariosSemana(hojeIso) {
  if (!supabaseConfigurado) return null;
  const supabase = getSupabase();
  const [horarios, fechados] = await Promise.all([
    supabase.from("horarios_funcionamento").select("dia_semana, abre, fecha").eq("ativo", true).order("abre"),
    supabase.from("dias_fechados").select("data, motivo").gte("data", hojeIso).lte("data", somarDias(hojeIso, 6)).order("data"),
  ]);
  if (horarios.error) return null;
  const dias = DIAS_SEMANA.map(() => []);
  for (const h of horarios.data) dias[h.dia_semana]?.push({ abre: h.abre.slice(0, 5), fecha: h.fecha.slice(0, 5) });
  return { dias, fechados: fechados.error ? [] : fechados.data };
}

function somarDias(dataIso, dias) {
  const [a, m, d] = dataIso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}
