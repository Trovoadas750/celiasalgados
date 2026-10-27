// Pagamento. O front do cliente NUNCA confirma pagamento.
//
// Pedido "agora": pagamento_status = 'nao_exigido'; paga na entrega ou na retirada (forma_pagamento).
// Pedido agendado: nasce 'pendente' e é pago antes, sem dinheiro/troco. Vira 'pago' quando:
//  - ONLINE (InfinitePay, Pix ou cartão de crédito): o servidor confere no payment_check e registra
//    (app/api/pagamentos). Liga sozinho quando INFINITEPAY_HANDLE está definido no servidor;
//  - pelo WhatsApp (enquanto o online está desligado ou se falhar): o admin confirma (confirmar_pagamento).
// O site recebe a confirmação pelo realtime.

import { getSupabase } from "./supabase";
import { linkWhatsappLoja, mensagemPagarAgendamento } from "./mensagemWhatsapp";

// Valores aceitos pela coluna `pedidos.forma_pagamento`.
// `detalhe` recebe o momento do pagamento: "na entrega" ou "na retirada".
export const FORMAS_PAGAMENTO = [
  { id: "pix", rotulo: "Pix", detalhe: () => "Pague com Pix" },
  { id: "dinheiro", rotulo: "Dinheiro", detalhe: (momento) => `Pague ${momento} · informe se precisa de troco` },
  { id: "cartao", rotulo: "Cartão", detalhe: (momento) => `Crédito ou débito ${momento}` },
];

/** Link do WhatsApp da loja para pagar o agendamento (caminho sem pagamento online). */
export function linkPagarPeloWhatsapp(pedido) {
  return linkWhatsappLoja(mensagemPagarAgendamento(pedido));
}

/** O servidor está com o pagamento online ligado? Em qualquer falha, considera desligado (usa o WhatsApp). */
export async function pagamentoOnlineDisponivel() {
  try {
    const resposta = await fetch("/api/pagamentos", { cache: "no-store" });
    if (!resposta.ok) return false;
    return (await resposta.json())?.online === true;
  } catch {
    return false;
  }
}

/**
 * Pede ao servidor o link de pagamento (InfinitePay) do agendamento. Precisa de cliente logado.
 * @returns {Promise<{ url: string } | { erro: string }>}
 */
export async function gerarLinkPagamento(pedidoId) {
  try {
    const { data } = await getSupabase().auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { erro: "Entre na sua conta para pagar." };
    const resposta = await fetch("/api/pagamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ pedidoId }),
    });
    const corpo = await resposta.json().catch(() => null);
    if (resposta.ok && typeof corpo?.url === "string") return { url: corpo.url };
    return { erro: corpo?.erro ?? "Não foi possível gerar o link de pagamento agora. Tente de novo em instantes." };
  } catch {
    return { erro: "Sem conexão. Confira sua internet e tente de novo." };
  }
}
