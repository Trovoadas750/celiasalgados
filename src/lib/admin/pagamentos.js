// Pagamentos no painel: agendamentos aguardando, expirados recentes, pagos e (se houver) o
// pagamento online (InfinitePay, ainda desligado). Só leitura, fora "confirmar"/"reativar"
// (que ficam em pedidos.js) e a anotação de devolução.

import { getSupabaseAdmin } from "./supabaseAdmin";
import { inicioDoDia, iso, somarDias } from "./datas";
import { checar, COLUNAS_LISTA, POR_PAGINA_PADRAO } from "./pedidos";

const db = () => getSupabaseAdmin();
const SETE_DIAS = 7 * 24 * 60 * 60000;

// Reativar precisa de pago_em, referência e das cobranças (para sugerir "Já está pago").
const COLUNAS_PAGAMENTO = `${COLUNAS_LISTA}, pago_em, pagamento_referencia, cobrancas ( status )`;

export async function listarAguardando() {
  const { data } = checar(
    await db()
      .from("pedidos")
      .select(COLUNAS_PAGAMENTO)
      .eq("pagamento_status", "pendente")
      .neq("status", "cancelado")
      .order("pagamento_expira_em")
      .range(0, 199),
  );
  return data ?? [];
}

/** Expirados com prazo vencido nos últimos 7 dias. */
export async function listarExpiradosRecentes(agora) {
  const { data } = checar(
    await db()
      .from("pedidos")
      .select(COLUNAS_PAGAMENTO)
      .eq("pagamento_status", "expirado")
      .gte("pagamento_expira_em", iso(agora - SETE_DIAS))
      .order("pagamento_expira_em", { ascending: false })
      .range(0, 199),
  );
  return data ?? [];
}

/** Pagos (pago_em) entre as datas, paginado. */
export async function listarPagos({ de, ate, pagina = 0 }) {
  const { data, count } = checar(
    await db()
      .from("pedidos")
      .select(COLUNAS_PAGAMENTO, { count: "exact" })
      .eq("pagamento_status", "pago")
      .gte("pago_em", iso(new Date(inicioDoDia(de))))
      .lt("pago_em", iso(new Date(inicioDoDia(somarDias(ate, 1)))))
      .order("pago_em", { ascending: false })
      .range(pagina * POR_PAGINA_PADRAO, (pagina + 1) * POR_PAGINA_PADRAO - 1),
  );
  return { pedidos: data ?? [], total: count ?? 0 };
}

// ---- Pagamento online (InfinitePay) ----
/** Existe alguma cobrança online? (a seção só aparece se existir) */
export async function existemCobrancas() {
  const { count, error } = await db().from("cobrancas").select("id", { count: "exact", head: true });
  return !error && (count ?? 0) > 0;
}

export const PREFIXO_DEVOLVIDO = "Pagamento online devolvido";

/** Cobranças pagas depois do prazo (o pedido não voltou sozinho: a dona decide). */
export async function listarPagosForaDoPrazo() {
  const { data } = checar(
    await db()
      .from("cobrancas")
      .select(
        `id, pedido_id, valor_centavos, valor_pago_centavos, paga_em, capture_method, receipt_url,
        pedidos ( id, nome, sobrenome, telefone, total, status, tipo_entrega, agendado_para, pagamento_status, pago_em,
          pagamento_referencia, codigo_acompanhamento, cobrancas ( status ), anotacoes_pedido ( texto ) )`,
      )
      .eq("status", "paga_fora_do_prazo")
      .order("paga_em", { ascending: false })
      .range(0, 99),
  );
  return data ?? [];
}

/** Log de pagamento (somente leitura). `soErros` = só origem "erro" (ex.: valor divergente). */
export async function listarEventos({ pagina = 0, soErros = false } = {}) {
  let q = db()
    .from("eventos_pagamento")
    .select("id, recebido_em, origem, pedido_id, cobranca_id, resultado, payload", { count: "exact" })
    .order("recebido_em", { ascending: false });
  if (soErros) q = q.eq("origem", "erro");
  const { data, count } = checar(await q.range(pagina * POR_PAGINA_PADRAO, (pagina + 1) * POR_PAGINA_PADRAO - 1));
  return { eventos: data ?? [], total: count ?? 0 };
}
