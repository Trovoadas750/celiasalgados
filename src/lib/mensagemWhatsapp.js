// Mensagens prontas para o WhatsApp da loja (funções puras: só montam texto, não buscam nada).
// Valores SEMPRE os do banco (total devolvido pelo criar_pedido / coluna `total`, já com frete):
// nada é recalculado aqui. Testes em mensagemWhatsapp.test.js (npm test).

import {
  formatarDiaComSemana,
  formatarDiaMes,
  formatarHora,
  formatarTelefone,
  formatarValor,
  mesmoDiaEmBrasilia,
} from "./formatar.js";
import { LOJA } from "./loja.js";

// Acima disso os sabores são resumidos ("+ 2 qualidades") para o link do WhatsApp não quebrar.
export const LIMITE_MENSAGEM = 1500;

const MODO_CURTO = { congelado: "congelado", pronto: "pronto" };

const STATUS_PAGAMENTO = {
  pago: "pago (agendamento confirmado)",
  expirado: "cancelado (pagamento não realizado no prazo)",
};

/** 113.8 -> "R$ 113,80" */
const dinheiro = (valor) => `R$ ${formatarValor(valor)}`;

/** Link do WhatsApp da loja com a mensagem já escrita. */
export function linkWhatsapp(texto) {
  return `${LOJA.whatsapp.link}?text=${encodeURIComponent(texto)}`;
}

/** Nome antigo, ainda usado pelos avisos de frete. */
export const linkWhatsappLoja = linkWhatsapp;

/** "{base}/acompanhar/{codigo}", ou null sem código (ou sem endereço do site). */
export function linkAcompanhamento(codigo, base) {
  const raiz = String(base ?? "").trim().replace(/\/+$/, "");
  if (!codigo || !raiz) return null;
  return `${raiz}/acompanhar/${encodeURIComponent(codigo)}`;
}

/** Prazo do pagamento: "21:37" (hoje) ou "23/10 às 21:37". */
export function horaDoPrazo(expiraEm, agora = Date.now()) {
  const hora = formatarHora(expiraEm);
  return mesmoDiaEmBrasilia(expiraEm, agora) ? hora : `${formatarDiaMes(expiraEm)} às ${hora}`;
}

/**
 * Forma de pagamento por extenso.
 * Agendamento (pago antes): "Pix" | "Cartão de crédito".
 * Pedido agora (paga ao receber): "Pix" | "Dinheiro (troco para R$ 150,00)" | "Cartão na entrega".
 */
export function textoFormaPagamento({ forma, trocoPara, agendadoPara, tipoEntrega }) {
  const agendado = Boolean(agendadoPara);
  if (forma === "pix") return "Pix";
  if (forma === "cartao") {
    if (agendado) return "Cartão de crédito";
    return tipoEntrega === "retirada" ? "Cartão na retirada" : "Cartão na entrega";
  }
  if (forma === "dinheiro") return Number(trocoPara) > 0 ? `Dinheiro (troco para ${dinheiro(trocoPara)})` : "Dinheiro";
  return agendado ? "Pix ou cartão de crédito" : "A combinar";
}

function textoEndereco(e) {
  if (!e) return "";
  const ref = e.ponto_referencia?.trim();
  return `${e.rua.trim()}, ${e.numero.trim()} - ${e.vila.trim()}${ref ? ` (ref.: ${ref})` : ""}`;
}

// "• 1x Cento (100 salgados) [pronto]: 34 Coxinha, 33 Kibe, 33 Risole"
// Mais de 1 pacote: sabores por pacote ("cada: ..."), como no resumo do checkout.
// `maxQualidades` corta a lista e resume o resto ("+ 2 qualidades").
function linhaItem(item, maxQualidades = Infinity) {
  let linha = `• ${item.quantidade}x ${item.nome}`;
  if (item.modo) linha += ` [${MODO_CURTO[item.modo] ?? item.modo}]`;
  if (item.sabores?.length) {
    const nomes = item.sabores.map((s) => `${s.quantidade / item.quantidade} ${s.nome}`);
    const mostrados = nomes.slice(0, maxQualidades);
    const resto = nomes.length - mostrados.length;
    if (resto > 0) mostrados.push(`+ ${resto} ${resto === 1 ? "qualidade" : "qualidades"}`);
    linha += item.quantidade > 1 ? `, cada: ${mostrados.join(", ")}` : `: ${mostrados.join(", ")}`;
  }
  return linha;
}

function linhaStatus(pedido, agora) {
  if (pedido.pagamentoStatus === "pendente" && pedido.pagamentoExpiraEm) {
    return `Status: aguardando pagamento — pagar até ${horaDoPrazo(pedido.pagamentoExpiraEm, agora)} para confirmar`;
  }
  return STATUS_PAGAMENTO[pedido.pagamentoStatus] ? `Status: ${STATUS_PAGAMENTO[pedido.pagamentoStatus]}` : null;
}

function montarPedido(pedido, agora, maxQualidades) {
  const agendado = Boolean(pedido.agendadoPara);
  const entrega = pedido.tipoEntrega === "entrega";
  const obs = pedido.observacao?.trim();
  const taxa = Number(pedido.taxaEntrega);

  const blocos = [
    [
      "Olá! Fiz um pedido pelo site 😊",
      `*Pedido nº ${pedido.numero}*`,
      `Nome: ${`${pedido.nome} ${pedido.sobrenome ?? ""}`.trim()} · Tel: ${formatarTelefone(pedido.telefone)}`,
    ],
    ["*Itens*", ...pedido.itens.map((item) => linhaItem(item, maxQualidades))],
    [
      pedido.subtotal != null && `Subtotal: ${dinheiro(pedido.subtotal)}`,
      entrega && pedido.taxaEntrega != null && `Entrega: ${taxa > 0 ? dinheiro(taxa) : "grátis"}`,
      `*TOTAL A PAGAR: ${dinheiro(pedido.total)}*`,
    ],
    [
      entrega ? `Entrega em: ${textoEndereco(pedido.endereco)}` : "Retirada no local",
      agendado
        ? `Agendado para ${formatarDiaComSemana(pedido.agendadoPara)} às ${formatarHora(pedido.agendadoPara)}`
        : "Quando: o quanto antes",
      `Pagamento: ${textoFormaPagamento(pedido)}`,
      agendado && linhaStatus(pedido, agora),
      obs && `Observação: ${obs}`,
      pedido.linkAcompanhamento && `Acompanhe: ${pedido.linkAcompanhamento}`,
    ],
  ];
  return blocos
    .map((linhas) => linhas.filter(Boolean).join("\n"))
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Mensagem enviada à loja ao finalizar QUALQUER pedido (agora ou agendado).
 *
 * @param {{
 *   numero: number, total: number,               // do criar_pedido
 *   subtotal?: number | null,                    // total_itens do calcularPedido
 *   taxaEntrega?: number | null,                 // do criar_pedido (só entrega)
 *   nome: string, sobrenome?: string, telefone: string,
 *   tipoEntrega: "entrega" | "retirada",
 *   endereco?: { rua, numero, vila, ponto_referencia? } | null,
 *   agendadoPara?: string | null,                // ISO; null = o quanto antes
 *   forma?: "pix" | "dinheiro" | "cartao" | null,
 *   trocoPara?: number | null,
 *   pagamentoStatus?: string, pagamentoExpiraEm?: string | null,
 *   itens: { quantidade: number, nome: string, modo?: "congelado" | "pronto",
 *            sabores?: { nome: string, quantidade: number }[] }[],   // quantidade do sabor = total da linha
 *   observacao?: string | null,
 *   linkAcompanhamento?: string | null,
 * }} pedido
 * @param {number} agora  só para decidir se o prazo é "hoje" (testes passam um valor fixo)
 */
export function mensagemPedido(pedido, agora = Date.now()) {
  let texto = montarPedido(pedido, agora, Infinity);
  for (const max of [3, 2, 1]) {
    if (texto.length <= LIMITE_MENSAGEM) break;
    texto = montarPedido(pedido, agora, max);
  }
  return texto;
}

/**
 * Mensagem curta do botão "Pagar agora" (lembrete e "Meus pedidos").
 * @param {{ numero: number, total: number, forma?: "pix" | "cartao" | null,
 *           agendadoPara?: string | null, expiraEm?: string | null }} pedido
 */
export function mensagemPagamento({ numero, total, forma, agendadoPara, expiraEm }, agora = Date.now()) {
  const nomeForma = forma === "pix" ? "Pix" : forma === "cartao" ? "Cartão de crédito" : "Pix ou cartão de crédito";
  const pedir = forma === "pix" ? "a chave Pix" : forma === "cartao" ? "o link do cartão" : "a chave Pix ou o link do cartão";
  const prazo = expiraEm ? ` (pagar até ${horaDoPrazo(expiraEm, agora)})` : "";
  return [
    `Olá! Quero pagar o agendamento do *pedido nº ${numero}*.`,
    `*Valor: ${dinheiro(total)}* · Forma: ${nomeForma}`,
    agendadoPara && `Agendado para ${formatarDiaComSemana(agendadoPara)} às ${formatarHora(agendadoPara)}${prazo}.`,
    `Pode me enviar ${pedir}?`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Lembrete enviado pelo servidor (WhatsApp/SMS, quando houver provedor). */
export function mensagemLembretePagamento({ numero, total }) {
  return `Para confirmar seu agendamento do pedido nº ${numero}, realize o pagamento de R$ ${formatarValor(total)}!`;
}

/** Endereço sem frete calculado: o cliente pergunta à loja se entrega e quanto custa. */
export function mensagemCombinarEntrega({ rua, numero, vila }) {
  return `Olá! Quero fazer um pedido para entrega em ${rua.trim()}, ${numero.trim()} - ${vila.trim()}, Ourinhos. Vocês entregam aqui? Qual o valor do frete?`;
}
