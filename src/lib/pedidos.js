import { getSupabase, supabaseConfigurado, MENSAGEM_SEM_CONFIGURACAO } from "./supabase";

// O site manda só produto_id + quantidade; preço, nome e categoria vêm do banco.
export function montarItens(itensSacola) {
  return itensSacola.map(({ produto, quantidade }) => ({ produto_id: produto.id, quantidade }));
}

function mensagemErroPedido(error) {
  // P0001: regra de negócio; a mensagem já vem em português, pronta para o usuário.
  if (error.code === "P0001") return error.message;
  if (error.code === "23514") return "Alguns dados do pedido estão inválidos. Confira o formulário.";
  if (error.code === "429" || /rate limit|too many/i.test(error.message ?? "")) {
    return "Muitas tentativas. Espere alguns minutos.";
  }
  if (/fetch|network/i.test(error.message ?? "")) return "Sem conexão. Confira sua internet e tente de novo.";
  return "Não foi possível enviar o pedido. Tente novamente.";
}

function vazioParaNull(valor) {
  const texto = typeof valor === "string" ? valor.trim() : valor;
  return texto === "" || texto === undefined ? null : texto;
}

// Cria o pedido pela RPC `criar_pedido`, igual para convidado e logado.
// Se houver sessão de cliente, o banco liga o pedido à conta sozinho (auth.uid()).
export async function enviarPedido({ cliente, endereco, entrega, pagamento, observacao, itens }) {
  if (!supabaseConfigurado) return { pedido: null, erro: MENSAGEM_SEM_CONFIGURACAO };

  const { data, error } = await getSupabase().rpc("criar_pedido", {
    p_nome: cliente.nome.trim(),
    p_sobrenome: cliente.sobrenome.trim(),
    p_telefone: cliente.telefone,
    p_rua: endereco.rua.trim(),
    p_vila: endereco.vila.trim(),
    p_numero: endereco.numero.trim(),
    p_ponto_referencia: vazioParaNull(endereco.ponto_referencia),
    p_itens: itens,
    p_forma_pagamento: pagamento.forma,
    p_troco_para: pagamento.forma === "dinheiro" ? vazioParaNull(pagamento.troco_para) : null,
    p_observacao: vazioParaNull(observacao),
    p_agendado_para: entrega.agendado_para ?? null,
  });

  if (error) return { pedido: null, erro: mensagemErroPedido(error) };
  return { pedido: data, erro: null }; // { numero, total }
}
