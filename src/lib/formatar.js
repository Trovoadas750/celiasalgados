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

// ---- Datas do agendamento (sempre em Brasília) ----
const FUSO = "America/Sao_Paulo";
const diaSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: FUSO });
const diaMes = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: FUSO });
const hora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: FUSO });

/** "2026-10-23T11:00:00-03:00" -> "sex, 23/10" */
export function formatarDiaComSemana(iso) {
  const data = new Date(iso);
  return `${diaSemana.format(data).replace(".", "")}, ${diaMes.format(data)}`;
}

/** -> "11:00" */
export function formatarHora(iso) {
  return hora.format(new Date(iso));
}

/** -> "23/10" */
export function formatarDiaMes(iso) {
  return diaMes.format(new Date(iso));
}

/** Mesmo dia no calendário de Brasília? */
export function mesmoDiaEmBrasilia(a, b) {
  return diaMes.format(new Date(a)) === diaMes.format(new Date(b));
}

/** 75 -> "75,00" (sem "R$", para frases do tipo "R$ {valor}") */
export function formatarValor(valor) {
  return Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Milissegundos até o prazo -> "1h 37min", "12 min" ou "menos de 1 min" */
export function formatarTempoRestante(ms) {
  const minutos = Math.floor(ms / 60000);
  if (minutos < 1) return "menos de 1 min";
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}
