import "server-only";

import { consultarPagamento } from "./infinitepay";

// Regras do pagamento online que rodam no SERVIDOR (rotas em app/api/pagamentos).
// O banco faz as conferências finais (funções de pagamento online em banco-de-dados.md): valor,
// duplicidade e prazo.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Endereço público do site (para o retorno e o webhook). SITE_URL tem prioridade sobre o da requisição. */
export function urlDoSite(request) {
  const configurado = (process.env.SITE_URL ?? "").trim().replace(/\/+$/, "");
  return configurado || new URL(request.url).origin;
}

function texto(valor, maximo) {
  const t = typeof valor === "string" ? valor.trim() : valor == null ? "" : String(valor);
  return t && t.length <= maximo ? t : null;
}

function inteiro(valor, min, max) {
  const n = Number(valor);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

/** Log em eventos_pagamento. Nunca derruba o fluxo; nunca grave chave nem dados de cartão. */
export async function registrarEvento(supabase, { origem, payload = null, resultado = null, cobrancaId = null, pedidoId = null }) {
  try {
    const { error } = await supabase.rpc("registrar_evento_pagamento", {
      p_origem: origem,
      p_payload: payload,
      p_resultado: resultado ? String(resultado).slice(0, 500) : null,
      p_cobranca_id: cobrancaId,
      p_pedido_id: pedidoId,
    });
    if (error) console.error("[pagamentos] registrar_evento_pagamento:", error.message);
  } catch (e) {
    console.error("[pagamentos] registrar_evento_pagamento:", e.message);
  }
}

/**
 * Confere um pagamento na API oficial e, se estiver pago, registra no banco.
 * Usado pelo webhook e pelo retorno do cliente (o mesmo pagamento pode chegar pelos dois: o banco
 * trata a repetição como `ja_registrado`).
 *
 * @param {{ orderNsu: string, transactionNsu: string, slug: string, receiptUrl?: string }} dados
 * @returns {Promise<{ resultado: "confirmado" | "ja_registrado" | "revisar" | "valor_divergente"
 *   | "pendente" | "nao_encontrada" | "invalido", pedidoId: number | null }>}
 */
export async function conferirERegistrar(supabase, { orderNsu, transactionNsu, slug, receiptUrl }) {
  const nsu = texto(orderNsu, 100);
  const transacao = texto(transactionNsu, 200);
  const fatura = texto(slug, 200);
  if (!nsu || !UUID.test(nsu) || !transacao || !fatura) return { resultado: "invalido", pedidoId: null };

  // Só consulta a InfinitePay se a cobrança for nossa (evita chamadas por avisos falsos).
  const { data: cobranca, error } = await supabase.from("cobrancas").select("id, pedido_id").eq("id", nsu).maybeSingle();
  if (error) throw new Error(`cobrancas: ${error.message}`);
  if (!cobranca) return { resultado: "nao_encontrada", pedidoId: null };
  const pedidoId = cobranca.pedido_id;

  const conferido = await consultarPagamento({ orderNsu: nsu, transactionNsu: transacao, slug: fatura });
  await registrarEvento(supabase, {
    origem: "verificacao",
    payload: conferido,
    resultado: conferido?.paid === true ? "payment_check: pago" : "payment_check: não pago",
    cobrancaId: nsu,
    pedidoId,
  });
  if (conferido?.paid !== true) return { resultado: "pendente", pedidoId };

  // Só valores que a tabela aceita; o original fica no log acima.
  const metodo = ["pix", "credit_card"].includes(conferido.capture_method) ? conferido.capture_method : null;
  const { data, error: erroRegistro } = await supabase.rpc("registrar_pagamento_cobranca", {
    p_order_nsu: nsu,
    p_transaction_nsu: transacao,
    p_valor_centavos: inteiro(conferido.amount, 1, 100_000_000),
    p_valor_pago_centavos: inteiro(conferido.paid_amount, 1, 100_000_000),
    p_capture_method: metodo,
    p_parcelas: inteiro(conferido.installments, 1, 12),
    p_invoice_slug: fatura,
    p_receipt_url: receiptUrl && /^https:\/\//.test(receiptUrl) ? texto(receiptUrl, 1000) : null,
  });
  if (erroRegistro) {
    await registrarEvento(supabase, { origem: "erro", resultado: `registrar_pagamento_cobranca: ${erroRegistro.message}`, cobrancaId: nsu, pedidoId });
    throw new Error(`registrar_pagamento_cobranca: ${erroRegistro.message}`);
  }
  return { resultado: data?.resultado ?? "revisar", pedidoId: data?.pedido_id ?? pedidoId };
}
