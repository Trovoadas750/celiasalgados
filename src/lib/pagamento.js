// Estrutura de pagamento. A integração com gateway (Pix online, cartão online) ainda não existe:
// hoje o pedido só registra a forma escolhida em `pedidos.forma_pagamento` e o pagamento é
// combinado na entrega. Quando o gateway entrar, a chamada vai em `iniciarPagamento`.

// Valores aceitos pela coluna `pedidos.forma_pagamento`.
export const FORMAS_PAGAMENTO = [
  { id: "pix", rotulo: "Pix", detalhe: "Pague com Pix" },
  { id: "dinheiro", rotulo: "Dinheiro", detalhe: "Na entrega · informe se precisa de troco" },
  { id: "cartao", rotulo: "Cartão", detalhe: "Crédito ou débito na entrega" },
];

/**
 * Chamado logo depois de `criar_pedido` dar certo.
 * @param {{ numero: number, total: number, forma: "pix" | "dinheiro" | "cartao" }} pedido
 * @returns {Promise<{ status: "na_entrega" | "aguardando" | "pago", instrucoes?: string }>}
 *
 * TODO(gateway): para "pix", gerar a cobrança no gateway e devolver { status: "aguardando", qrCode, copiaECola }.
 * A chave secreta do gateway NUNCA pode ir para o navegador: essa chamada deve passar por uma
 * rota do servidor (Route Handler) que fala com o gateway.
 */
export async function iniciarPagamento(pedido) {
  void pedido;
  return { status: "na_entrega" };
}
