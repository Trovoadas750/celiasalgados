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
  novo: { rotulo: "Recebido", classe: "bg-sky-100 text-sky-800" },
  em_preparo: { rotulo: "Em preparo", classe: "bg-amber-100 text-amber-900" },
  saiu_para_entrega: { rotulo: "Saiu para entrega", classe: "bg-violet-100 text-violet-800" },
  entregue: { rotulo: "Entregue", classe: "bg-emerald-100 text-emerald-800" },
  cancelado: { rotulo: "Cancelado", classe: "bg-stone-200 text-stone-600" },
};

export const FORMA_PAGAMENTO = { pix: "Pix", dinheiro: "Dinheiro", cartao: "Cartão" };
