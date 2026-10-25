// Como o cliente recebe o pedido: retirar no local ou entrega (motoboy).

export const RECEBIMENTO_PADRAO = "retirada";

export const TIPOS_RECEBIMENTO = {
  retirada: { titulo: "Retirar no local", resumo: "Você busca na salgadaria", momento: "na retirada" },
  entrega: { titulo: "Entrega", resumo: "Motoboy leva até você", momento: "na entrega" },
};

// O tipo vem da coluna `pedidos.tipo_entrega` ("entrega" | "retirada"). Na retirada o banco grava
// rua/vila/número como null.
export function ehRetirada(pedido) {
  return pedido?.tipo_entrega === "retirada";
}


// Frete: calculado pelo banco a partir do endereço (rota /api/frete + calcular_pedido). Ver lib/frete.js.
