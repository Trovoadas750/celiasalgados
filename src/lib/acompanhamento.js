// Etapas do pedido para a linha do tempo (funções puras). Usado no painel admin e na página
// pública de acompanhamento. O histórico vem de `pedido_status_historico` (gatilho do banco).

const ORDEM = ["novo", "em_preparo", "saiu_para_entrega", "entregue"];

/**
 * Nome do status para exibir. Na retirada, "saiu_para_entrega" é "Pronto para retirar" e
 * "entregue" é "Retirado" (o valor gravado no banco é o mesmo).
 */
export function rotuloStatus(status, tipoEntrega) {
  const retirada = tipoEntrega === "retirada";
  switch (status) {
    case "novo":
      return "Novo";
    case "em_preparo":
      return "Em preparo";
    case "saiu_para_entrega":
      return retirada ? "Pronto para retirar" : "Saiu para entrega";
    case "entregue":
      return retirada ? "Retirado" : "Entregue";
    case "cancelado":
      return "Cancelado";
    default:
      return status ?? "";
  }
}

// Na linha do tempo, "novo" aparece como "Pedido recebido".
function rotuloEtapa(status, tipoEntrega) {
  return status === "novo" ? "Pedido recebido" : rotuloStatus(status, tipoEntrega);
}

/** Último momento em que o pedido entrou em `status` (o status pode ter sido desfeito e refeito). */
function ultimaVez(historico, status) {
  let em = null;
  for (const h of historico) {
    if (h.status === status && (!em || new Date(h.em) > new Date(em))) em = h.em;
  }
  return em;
}

/**
 * @param {{ status: string, tipo_entrega: "entrega" | "retirada",
 *           historico?: { status: string, em: string }[] }} pedido
 * @returns {{ status: string, rotulo: string, em: string | null,
 *             situacao: "feita" | "atual" | "futura" | "cancelada" }[]}
 *   Cancelado: as etapas que chegaram a acontecer + "Cancelado" no fim.
 */
export function etapasAcompanhamento({ status, tipo_entrega: tipoEntrega, historico = [] }) {
  if (status === "cancelado") {
    const feitas = ORDEM.filter((s) => s === "novo" || ultimaVez(historico, s)).map((s) => ({
      status: s,
      rotulo: rotuloEtapa(s, tipoEntrega),
      em: ultimaVez(historico, s),
      situacao: "feita",
    }));
    return [...feitas, { status: "cancelado", rotulo: "Cancelado", em: ultimaVez(historico, "cancelado"), situacao: "cancelada" }];
  }

  const atual = Math.max(0, ORDEM.indexOf(status));
  return ORDEM.map((s, i) => ({
    status: s,
    rotulo: rotuloEtapa(s, tipoEntrega),
    em: i <= atual ? ultimaVez(historico, s) : null,
    situacao: i < atual ? "feita" : i === atual ? (s === "entregue" ? "feita" : "atual") : "futura",
  }));
}
