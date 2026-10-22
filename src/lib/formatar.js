const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatarPreco(valor) {
  return moeda.format(valor);
}

// "14999990001" -> "(14) 99999-0001"; "1433334444" -> "(14) 3333-4444"
export function formatarTelefone(digitos) {
  const d = String(digitos).replace(/\D/g, "");
  const meio = d.length === 11 ? 7 : 6;
  return `(${d.slice(0, 2)}) ${d.slice(2, meio)}-${d.slice(meio)}`;
}

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export function formatarDataHora(iso) {
  return dataHora.format(new Date(iso));
}

export const STATUS_PEDIDO = {
  novo: { rotulo: "Recebido", classe: "bg-laranja text-cafe" },
  em_preparo: { rotulo: "Em preparo", classe: "bg-aviso-fundo text-aviso-texto" },
  saiu_para_entrega: { rotulo: "Saiu para entrega", classe: "bg-info-fundo text-info" },
  entregue: { rotulo: "Entregue", classe: "bg-sucesso-fundo text-sucesso" },
  cancelado: { rotulo: "Cancelado", classe: "bg-cancelado-fundo text-texto-sec" },
};

// Status do pedido considerando o tipo de recebimento (contextoBD.md: na retirada,
// "saiu_para_entrega" é exibido como "Pronto para retirar"; o valor gravado é o mesmo).
export function statusDoPedido(pedido) {
  const status = STATUS_PEDIDO[pedido.status] ?? STATUS_PEDIDO.novo;
  if (pedido.status === "saiu_para_entrega" && pedido.tipo_entrega === "retirada") {
    return { ...status, rotulo: "Pronto para retirar" };
  }
  return status;
}

export const MODO_PACOTE = { congelado: "Congelado", pronto: "Pronto para comer" };

export const FORMA_PAGAMENTO = { pix: "Pix", dinheiro: "Dinheiro", cartao: "Cartão" };
