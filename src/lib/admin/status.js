// Status, hora-alvo e urgência dos pedidos no painel (funções puras; testes em status.test.js).

import { rotuloStatus } from "../acompanhamento.js";
import { formatarDiaComSemana, formatarHora } from "../formatar.js";
import { dataEmBrasilia, somarDias } from "./datas.js";
import { URGENTE_MIN } from "./config.js";

export { rotuloStatus };

export const STATUS_ATIVOS = ["novo", "em_preparo", "saiu_para_entrega"];
export const STATUS_FINAIS = ["entregue", "cancelado"];
const SEQUENCIA = ["novo", "em_preparo", "saiu_para_entrega", "entregue"];

export const STATUS_OPCOES = [
  { id: "novo", rotulo: "Novo" },
  { id: "em_preparo", rotulo: "Em preparo" },
  { id: "saiu_para_entrega", rotulo: "Saiu para entrega / Pronto para retirar" },
  { id: "entregue", rotulo: "Entregue / Retirado" },
  { id: "cancelado", rotulo: "Cancelado" },
];

/** Pedido encerrado: entregue, cancelado ou agendamento expirado. */
export function finalizado(pedido) {
  return STATUS_FINAIS.includes(pedido.status) || pedido.pagamento_status === "expirado";
}

export function proximoStatus(status) {
  const i = SEQUENCIA.indexOf(status);
  return i >= 0 && i < SEQUENCIA.length - 1 ? SEQUENCIA[i + 1] : null;
}

export function statusAnterior(status) {
  const i = SEQUENCIA.indexOf(status);
  return i > 0 ? SEQUENCIA[i - 1] : null;
}

/** Texto do botão que leva ao próximo status ("Iniciar preparo", "Saiu para entrega"...). */
export function rotuloAcaoProximo(status, tipoEntrega) {
  const proximo = proximoStatus(status);
  if (!proximo) return null;
  if (proximo === "em_preparo") return "Iniciar preparo";
  return rotuloStatus(proximo, tipoEntrega);
}

/** Pagamento para exibir. `null` = nada a mostrar. */
export function rotuloPagamento(pagamentoStatus, tipoEntrega) {
  switch (pagamentoStatus) {
    case "pendente":
      return "Aguardando pagamento";
    case "pago":
      return "Pago";
    case "expirado":
      return "Expirado";
    case "nao_exigido":
      return tipoEntrega === "retirada" ? "Paga na retirada" : "Paga na entrega";
    default:
      return null;
  }
}

/** Hora-alvo: agendado -> agendado_para; "o quanto antes" -> criado_em + tempo de preparo. */
export function horaAlvo(pedido, tempoMin) {
  if (pedido.agendado_para) return new Date(pedido.agendado_para);
  return new Date(new Date(pedido.criado_em).getTime() + tempoMin * 60000);
}

/**
 * Urgência pela hora-alvo.
 * @returns {{ tipo: "atrasado" | "urgente", minutos: number, texto: string } | null}
 */
export function urgencia(pedido, agora, tempoMin) {
  if (finalizado(pedido)) return null;
  const minutos = Math.round((horaAlvo(pedido, tempoMin).getTime() - agora) / 60000);
  if (minutos < 0) return { tipo: "atrasado", minutos: -minutos, texto: `Atrasado ${duracao(-minutos)}` };
  if (minutos <= URGENTE_MIN) return { tipo: "urgente", minutos, texto: minutos === 0 ? "Agora" : `Em ${duracao(minutos)}` };
  return null;
}

/** 15 -> "15 min"; 75 -> "1h 15min"; 120 -> "2h" */
export function duracao(minutos) {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

/** "Hoje 18:30", "Amanhã 10:00", "sex, 23/10 10:30" */
export function textoDiaHora(quando, agora) {
  const dia = dataEmBrasilia(quando);
  const hoje = dataEmBrasilia(agora);
  const hora = formatarHora(quando);
  if (dia === hoje) return `Hoje ${hora}`;
  if (dia === somarDias(hoje, 1)) return `Amanhã ${hora}`;
  if (dia === somarDias(hoje, -1)) return `Ontem ${hora}`;
  return `${formatarDiaComSemana(quando)} ${hora}`;
}

/** Hora-alvo para o card: agendado "Hoje 18:30"; "o quanto antes" "Agora, há 12 min". */
export function textoHoraAlvo(pedido, agora) {
  if (pedido.agendado_para) return textoDiaHora(pedido.agendado_para, agora);
  const minutos = Math.max(0, Math.round((agora - new Date(pedido.criado_em).getTime()) / 60000));
  if (minutos > 12 * 60) return `Agora · feito ${textoDiaHora(pedido.criado_em, agora)}`;
  return minutos < 1 ? "Agora, há menos de 1 min" : `Agora, há ${duracao(minutos)}`;
}

/** "1x Cento pronto · 2x Coca-Cola 2L" */
export function resumoItens(itens = []) {
  return itens
    .map((i) => `${i.quantidade}x ${i.nome_produto}${i.modo ? ` ${i.modo === "pronto" ? "pronto" : "congelado"}` : ""}`)
    .join(" · ");
}

/** Ordena pela hora-alvo (mais urgente primeiro). */
export function ordenarPorHoraAlvo(pedidos, tempoMin) {
  return [...pedidos].sort((a, b) => horaAlvo(a, tempoMin) - horaAlvo(b, tempoMin) || a.id - b.id);
}
