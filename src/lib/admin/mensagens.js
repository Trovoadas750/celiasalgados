// Mensagens prontas da LOJA para o CLIENTE (WhatsApp). Funções puras; testes em mensagens.test.js.

import { formatarTelefone, formatarValor } from "../formatar.js";

/** wa.me do cliente (Brasil) com a mensagem escrita. */
export function linkWhatsappCliente(telefone, texto) {
  const digitos = String(telefone ?? "").replace(/\D/g, "");
  return `https://wa.me/55${digitos}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}

/** tel: para o botão "Ligar". */
export function linkLigar(telefone) {
  return `tel:+55${String(telefone ?? "").replace(/\D/g, "")}`;
}

const acompanhe = (link) => (link ? `\nAcompanhe: ${link}` : "");

/**
 * As mensagens do detalhe do pedido.
 * @param {{ id: number, total: number, tipo_entrega: string }} pedido
 * @param {{ link?: string | null, enderecoLoja?: string | null, motivo?: string }} extra
 * @returns {{ id: string, rotulo: string, texto: string }[]}
 */
export function mensagensParaCliente(pedido, { link = null, enderecoLoja = null, motivo = "" } = {}) {
  const n = pedido.id;
  const lista = [
    { id: "recebido", rotulo: "Pedido recebido", texto: `Recebemos seu pedido nº ${n}! Já vamos preparar.${acompanhe(link)}` },
    pedido.tipo_entrega === "retirada"
      ? {
          id: "pronto",
          rotulo: "Pronto para retirar",
          texto: `Seu pedido nº ${n} está pronto para retirada${enderecoLoja ? ` na ${enderecoLoja}` : ""}.${acompanhe(link)}`,
        }
      : { id: "saiu", rotulo: "Saiu para entrega", texto: `Seu pedido nº ${n} saiu para entrega!${acompanhe(link)}` },
    {
      id: "cobranca",
      rotulo: "Cobrar pagamento",
      texto: `Para confirmar o agendamento do pedido nº ${n}, falta o pagamento de R$ ${formatarValor(pedido.total)}.`,
    },
    { id: "atraso", rotulo: "Vai atrasar", texto: `Seu pedido nº ${n} vai atrasar uns minutinhos, já está saindo!${acompanhe(link)}` },
    {
      id: "cancelado",
      rotulo: "Pedido cancelado",
      texto: `Seu pedido nº ${n} foi cancelado${motivo.trim() ? `: ${motivo.trim()}` : "."}`,
    },
  ];
  return lista;
}

/** Uma mensagem pelo id ("saiu", "cancelado"...). */
export function mensagemParaCliente(id, pedido, extra) {
  return mensagensParaCliente(pedido, extra).find((m) => m.id === id)?.texto ?? "";
}

/** Resumo do pedido em texto (botão "Copiar resumo"). */
export function resumoPedidoTexto(pedido, { horaAlvoTexto, pagamentoTexto } = {}) {
  const linhas = [
    `Pedido nº ${pedido.id}${horaAlvoTexto ? ` · ${horaAlvoTexto}` : ""}`,
    pedido.tipo_entrega === "retirada" ? "RETIRADA" : "ENTREGA",
    `${pedido.nome} ${pedido.sobrenome} · ${formatarTelefone(pedido.telefone)}`,
    pedido.tipo_entrega === "entrega"
      ? `${pedido.rua}, ${pedido.numero} - ${pedido.vila}${pedido.ponto_referencia ? ` (ref.: ${pedido.ponto_referencia})` : ""}`
      : null,
    "",
    ...(pedido.itens_pedido ?? []).flatMap((i) => [
      `${i.quantidade}x ${i.nome_produto}${i.modo ? ` [${i.modo === "pronto" ? "PRONTO" : "CONGELADO"}]` : ""}`,
      ...(i.itens_pedido_conteudo ?? []).map((c) => `   ${c.quantidade} ${c.nome_produto}`),
    ]),
    "",
    Number(pedido.taxa_entrega) > 0 ? `Entrega: R$ ${formatarValor(pedido.taxa_entrega)}` : null,
    `Total: R$ ${formatarValor(pedido.total)}`,
    pagamentoTexto ? `Pagamento: ${pagamentoTexto}` : null,
    pedido.observacao ? `Obs.: ${pedido.observacao}` : null,
  ];
  return linhas.filter((l) => l !== null).join("\n");
}

/**
 * Confirmação de pedido lançado pelo painel (telefone/WhatsApp/balcão).
 * @param {{ numero: number, total: number, tipoEntrega: string, agendadoPara?: string | null,
 *           quandoTexto?: string | null, pagamentoTexto?: string | null, link?: string | null }} p
 */
export function mensagemConfirmacaoPainel({ numero, total, tipoEntrega, quandoTexto, pagamentoTexto, link }) {
  return [
    `Recebemos seu pedido nº ${numero}! 😊`,
    `Total: R$ ${formatarValor(total)}${pagamentoTexto ? ` · ${pagamentoTexto}` : ""}`,
    `${tipoEntrega === "retirada" ? "Retirada" : "Entrega"}: ${quandoTexto || "o quanto antes"}`,
    link ? `Acompanhe: ${link}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Agendamento cancelado por falta de pagamento no prazo. */
export function mensagemExpirado({ id }) {
  return `Seu agendamento do pedido nº ${id} foi cancelado porque o pagamento não foi confirmado até o prazo. Se ainda quiser, responda esta mensagem que a gente vê um novo horário.`;
}

/** Senha nova definida pela loja (o cliente entra com o telefone + essa senha). */
export function mensagemNovaSenha({ nome, senha }) {
  return `Olá${nome ? `, ${nome}` : ""}! Sua senha do site da Edna & Célia Salgados foi redefinida.\nNova senha: ${senha}\nPara entrar, use seu telefone e essa senha. Depois, se quiser, troque em Minha conta.`;
}
