// Mensagens prontas (funções puras: só montam texto, não buscam nada).
// Usadas na tela de sucesso do agendamento, no modal de pagamento e na rota de lembretes do servidor.

import { FORMA_PAGAMENTO, formatarDiaComSemana, formatarHora, formatarTelefone, formatarValor, MODO_PACOTE } from "./formatar.js";
import { LOJA } from "./loja.js";

const STATUS_PAGAMENTO_TEXTO = {
  pendente: "aguardando pagamento",
  pago: "pago",
  expirado: "cancelado (pagamento não realizado no prazo)",
};

/** Link do WhatsApp da loja com a mensagem já escrita. */
export function linkWhatsappLoja(mensagem) {
  return `${LOJA.whatsapp.link}?text=${encodeURIComponent(mensagem)}`;
}

/**
 * Pedido agendado, para o cliente mandar à loja. Usa só dados que o cliente já tem na tela.
 *
 * @param {{
 *   numero: number, total: number,
 *   nome: string, sobrenome: string, telefone: string,
 *   agendadoPara: string,                        // ISO
 *   tipoEntrega: "entrega" | "retirada",
 *   endereco?: { rua, numero, vila, ponto_referencia? } | null,
 *   taxaEntrega?: number | null,                  // frete (só entrega)
 *   itens: { quantidade: number, nome: string, modo?: "congelado" | "pronto",
 *            sabores?: { nome: string, quantidade: number }[] }[],   // quantidade do sabor = total da linha
 *   forma?: "pix" | "dinheiro" | "cartao" | "" | null,
 *   pagamentoStatus?: "pendente" | "pago" | "expirado" | "nao_exigido",
 *   observacao?: string | null,
 * }} pedido
 */
export function mensagemPedidoAgendado(pedido) {
  const linhas = [
    "Olá! Acabei de agendar um pedido pelo site.",
    `Pedido nº ${pedido.numero}`,
    `Nome: ${pedido.nome} ${pedido.sobrenome} · Tel: ${formatarTelefone(pedido.telefone)}`,
    `Data: ${formatarDiaComSemana(pedido.agendadoPara)} às ${formatarHora(pedido.agendadoPara)}`,
    pedido.tipoEntrega === "entrega" ? `Entrega em: ${textoEndereco(pedido.endereco)}` : "Retirada no local",
    "Itens:",
    ...pedido.itens.map(linhaItem),
    ...(pedido.tipoEntrega === "entrega" && pedido.taxaEntrega != null ? [`Entrega: R$ ${formatarValor(pedido.taxaEntrega)}`] : []),
    `Total: R$ ${formatarValor(pedido.total)}`,
    linhaPagamento(pedido),
  ];
  const obs = pedido.observacao?.trim();
  if (obs) linhas.push(`Observação: ${obs}`);
  return linhas.join("\n");
}

function textoEndereco(e) {
  if (!e) return "";
  const ref = e.ponto_referencia?.trim();
  return `${e.rua}, nº ${e.numero}, ${e.vila}${ref ? ` (ref.: ${ref})` : ""}`;
}

// "- 1x Cento (100 salgados) [congelado]: 34 Coxinha, 33 Kibe"
// Com mais de 1 pacote, os sabores são por pacote ("cada: ..."), como no resumo do checkout.
function linhaItem(item) {
  let linha = `- ${item.quantidade}x ${item.nome}`;
  if (item.modo) linha += ` [${MODO_PACOTE[item.modo].toLowerCase()}]`;
  if (item.sabores?.length) {
    const sabores = item.sabores.map((s) => `${s.quantidade / item.quantidade} ${s.nome}`).join(", ");
    linha += item.quantidade > 1 ? `, cada: ${sabores}` : `: ${sabores}`;
  }
  return linha;
}

function linhaPagamento(pedido) {
  const forma = FORMA_PAGAMENTO[pedido.forma] ?? "a combinar";
  const status = STATUS_PAGAMENTO_TEXTO[pedido.pagamentoStatus] ?? STATUS_PAGAMENTO_TEXTO.pendente;
  return `Pagamento: ${forma} · Status: ${status}`;
}

/** Botão "Pagar pelo WhatsApp" do modal de pagamento. */
export function mensagemPagarAgendamento({ numero, total }) {
  return `Olá! Quero pagar o agendamento do pedido nº ${numero} no valor de R$ ${formatarValor(total)}.`;
}

/** Lembrete enviado pelo servidor (WhatsApp/SMS, quando houver provedor). */
export function mensagemLembretePagamento({ numero, total }) {
  return `Para confirmar seu agendamento do pedido nº ${numero}, realize o pagamento de R$ ${formatarValor(total)}!`;
}

/** Endereço sem frete calculado: o cliente pergunta à loja se entrega e quanto custa. */
export function mensagemCombinarEntrega({ rua, numero, vila }) {
  return `Olá! Quero fazer um pedido para entrega em ${rua.trim()}, ${numero.trim()} - ${vila.trim()}, Ourinhos. Vocês entregam aqui? Qual o valor do frete?`;
}
