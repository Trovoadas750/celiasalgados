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

/*
 * Simulação de frete (estrutura pronta, cálculo ainda não implementado).
 *
 * Estados que a interface já sabe mostrar (ver components/checkout/ResumoFrete.js):
 *  - { status: "aguardando_endereco" }                  endereço incompleto
 *  - { status: "calculando" }                           consulta em andamento
 *  - { status: "disponivel", valor, prazoMinutos }      frete calculado
 *  - { status: "fora_da_area" }                         a loja não entrega nesse endereço
 *  - { status: "a_combinar" }                           sem cálculo automático (hoje)
 *  - { status: "erro" }                                 falha na consulta
 *
 * TODO(frete): calcular por vila/bairro (tabela de taxas) ou por distância (API de mapas,
 * chamada por uma rota do servidor para não expor chaves). Atenção: o banco ainda não tem
 * coluna de taxa de entrega, então `pedidos.total` não inclui o frete.
 *
 * O limite de salgados para entrega NÃO é decidido aqui: use `entrega_permitida` do
 * `calcularPedido` (lib/pedidos.js). O texto do limite está em `LOJA.limiteEntrega` (lib/loja.js).
 */
export async function simularFrete(endereco) {
  void endereco;
  return { status: "a_combinar" };
}
