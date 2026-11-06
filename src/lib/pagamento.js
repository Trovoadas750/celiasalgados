// Pagamento. O front do cliente NUNCA confirma pagamento.
//
// Pedido "agora": pagamento_status = 'nao_exigido'; paga na entrega ou na retirada (forma_pagamento).
// Pedido agendado: nasce 'pendente' e é pago antes (Pix ou cartão de crédito, sem dinheiro/troco).
// HOJE o pagamento é combinado pelo WhatsApp da loja: o cliente manda a mensagem com o total, a loja
// envia a chave Pix ou o link do cartão e confirma no sistema (PAGAMENTO-WHATSAPP.md).
// O site recebe a confirmação pelo realtime.
//
// O pagamento online (InfinitePay, app/api/pagamentos + ModalPagamento) está DESLIGADO na tela:
// o código continua aqui, sem uso, para quando for ligado (ver PROMPT-PAGAMENTO.md).

import { getSupabase } from "./supabase";
import { linkWhatsapp, mensagemPagamento } from "./mensagemWhatsapp";

// Valores aceitos pela coluna `pedidos.forma_pagamento`.
// `detalhe` recebe o momento do pagamento: "na entrega" ou "na retirada".
export const FORMAS_PAGAMENTO = [
  { id: "pix", rotulo: "Pix", detalhe: () => "Pague com Pix" },
  { id: "dinheiro", rotulo: "Dinheiro", detalhe: (momento) => `Pague ${momento} · informe se precisa de troco` },
  { id: "cartao", rotulo: "Cartão", detalhe: (momento) => `Na maquininha, ${momento} · crédito ou débito` },
];

// Agendamento: pago antes, para confirmar o horário. O banco recusa dinheiro e troco.
export const FORMAS_PAGAMENTO_AGENDAMENTO = [
  { id: "pix", rotulo: "Pix", detalhe: () => "A loja envia a chave Pix pelo WhatsApp" },
  { id: "cartao", rotulo: "Cartão de crédito", detalhe: () => "A loja envia o link de pagamento pelo WhatsApp" },
];

/**
 * Link do WhatsApp da loja para pagar o agendamento.
 * @param {{ numero: number, total: number, forma?: string | null, agendadoPara?: string | null, expiraEm?: string | null }} pedido
 */
export function linkPagamento(pedido) {
  return linkWhatsapp(mensagemPagamento(pedido));
}

/** Nome antigo (ModalPagamento, desligado). */
export const linkPagarPeloWhatsapp = linkPagamento;

/**
 * "Pagar agora": abre o WhatsApp da loja com a mensagem de pagamento.
 * Na tela, prefira um <a href={linkPagamento(pedido)} target="_blank">; esta função serve para
 * quem só tem um clique em botão.
 * TODO: pagamento online (InfinitePay) — ver PROMPT-PAGAMENTO.md
 */
export function iniciarPagamento(pedido) {
  window.open(linkPagamento(pedido), "_blank", "noopener,noreferrer");
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
