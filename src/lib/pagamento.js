// Estrutura de pagamento. O pagamento online AINDA NÃO EXISTE.
//
// Pedido "agora": pagamento_status = 'nao_exigido'; paga na entrega ou na retirada (forma_pagamento).
// Pedido agendado: nasce 'pendente' e só vira 'pago' quando confirmado. Hoje quem confirma é o admin
// (confirmar_pagamento). No futuro, o webhook do provedor confirma no servidor, com a chave secreta.
// O front do cliente NUNCA confirma pagamento.

import { linkWhatsappLoja, mensagemPagarAgendamento } from "./mensagemWhatsapp";

// Valores aceitos pela coluna `pedidos.forma_pagamento`.
// `detalhe` recebe o momento do pagamento: "na entrega" ou "na retirada".
export const FORMAS_PAGAMENTO = [
  { id: "pix", rotulo: "Pix", detalhe: () => "Pague com Pix" },
  { id: "dinheiro", rotulo: "Dinheiro", detalhe: (momento) => `Pague ${momento} · informe se precisa de troco` },
  { id: "cartao", rotulo: "Cartão", detalhe: (momento) => `Crédito ou débito ${momento}` },
];

/**
 * Ponto de extensão do botão "Pagar agora" (modal de pagamento).
 *
 * @param {{ numero: number, total: number }} pedido  agendamento com pagamento pendente
 * @returns {Promise<{ tipo: "whatsapp", link: string }>}
 *
 * TODO(provedor): quando houver pagamento online, criar a cobrança por uma rota do servidor
 * (ex.: app/api/pagamentos/route.js, com a chave do provedor só no servidor) e devolver
 * { tipo: "online", qrCode, copiaECola } ou { tipo: "redirecionar", url }. O webhook do provedor
 * chama confirmar_pagamento no servidor; o site recebe a confirmação pelo realtime.
 */
export async function iniciarPagamento(pedido) {
  return { tipo: "whatsapp", link: linkWhatsappLoja(mensagemPagarAgendamento(pedido)) };
}
