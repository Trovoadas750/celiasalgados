import { getSupabase, supabaseConfigurado, MENSAGEM_SEM_CONFIGURACAO } from "./supabase";

// Pedidos: simular (`calcular_pedido`) e gravar (`criar_pedido`). contextoBD.md, seção 5.
//
// O FRONT NUNCA CALCULA PREÇO. Todo valor mostrado (sacola, resumo, total) vem do `calcularPedido`.
//
// Formato dos itens no front:
//   pacote:       { produtoId, quantidade, modo: "congelado" | "pronto", sabores: [{ produtoId, quantidade }] }
//   refrigerante: { produtoId, quantidade }

// Front -> banco: { produto_id, quantidade, modo, sabores: [{ produto_id, quantidade }] }.
// Sabores com quantidade 0 são removidos.
export function paraItensDoBanco(itens) {
  return itens.map(({ produtoId, quantidade, modo, sabores }) => {
    const item = { produto_id: produtoId, quantidade };
    if (modo) item.modo = modo;
    if (sabores) {
      item.sabores = sabores
        .filter((s) => Number(s.quantidade) > 0)
        .map((s) => ({ produto_id: s.produtoId, quantidade: Number(s.quantidade) }));
    }
    return item;
  });
}

function erroDoBanco(error) {
  // P0001: regra de negócio; a mensagem já vem em português, pronta para exibir.
  if (error.code === "P0001") return new Error(error.message);
  if (error.code === "23514") return new Error("Confira os dados informados.");
  return new Error("Não foi possível concluir o pedido agora. Tente novamente.");
}

function supabase() {
  if (!supabaseConfigurado) throw new Error(MENSAGEM_SEM_CONFIGURACAO);
  return getSupabase();
}

function vazioParaNull(valor) {
  if (valor === undefined || valor === null) return null;
  const texto = typeof valor === "string" ? valor.trim() : valor;
  return texto === "" ? null : texto;
}

// numeric do Postgres pode chegar como string
const numero = (v) => (v === null || v === undefined ? v : Number(v));

/**
 * Simula o pedido (não grava nada). Use na sacola e no resumo do checkout.
 * Lança Error com a mensagem pronta para exibir se algo estiver inválido.
 *
 * @returns {Promise<{
 *   total: number, total_salgados: number, limite_entrega: number, entrega_permitida: boolean,
 *   exige_agendamento: boolean, data_minima_agendamento: string | null,
 *   itens: { produto_id: number, nome_produto: string, modo: string | null, quantidade: number, preco_unitario: number, subtotal: number }[]
 * }>}  Os itens voltam na mesma ordem em que foram enviados.
 */
export async function calcularPedido(itens) {
  const { data, error } = await supabase().rpc("calcular_pedido", { p_itens: paraItensDoBanco(itens) });
  if (error) throw erroDoBanco(error);
  return {
    ...data,
    total: numero(data.total),
    itens: (data.itens ?? []).map((i) => ({ ...i, preco_unitario: numero(i.preco_unitario), subtotal: numero(i.subtotal) })),
  };
}

/**
 * Grava o pedido. Igual para convidado e logado: se houver sessão de cliente, o banco liga o pedido
 * à conta sozinho. Lança Error com a mensagem pronta para exibir.
 *
 * @param {{
 *   cliente: { nome: string, sobrenome: string, telefone: string },
 *   tipoEntrega: "entrega" | "retirada",
 *   endereco?: { rua: string, vila: string, numero: string, ponto_referencia?: string },  // só na entrega
 *   itens: object[],                 // formato do front (ver topo do arquivo)
 *   agendadoPara?: string | null,    // ISO; obrigatório se houver assado pronto
 *   formaPagamento?: "pix" | "dinheiro" | "cartao" | null,
 *   trocoPara?: number | null,       // só com "dinheiro"
 *   observacao?: string | null,
 * }} pedido
 * @returns {Promise<{ numero: number, total: number }>}
 */
export async function criarPedido({
  cliente,
  tipoEntrega,
  endereco,
  itens,
  agendadoPara = null,
  formaPagamento = null,
  trocoPara = null,
  observacao = null,
}) {
  if (tipoEntrega !== "entrega" && tipoEntrega !== "retirada") {
    throw new Error('tipoEntrega precisa ser "entrega" ou "retirada".');
  }
  const entrega = tipoEntrega === "entrega";

  const { data, error } = await supabase().rpc("criar_pedido", {
    p_nome: cliente.nome.trim(),
    p_sobrenome: cliente.sobrenome.trim(),
    p_telefone: cliente.telefone, // máscara é aceita; o banco deixa só dígitos
    // Na retirada o endereço vai null (constraint endereco_obrigatorio_na_entrega).
    p_rua: entrega ? vazioParaNull(endereco?.rua) : null,
    p_vila: entrega ? vazioParaNull(endereco?.vila) : null,
    p_numero: entrega ? vazioParaNull(endereco?.numero) : null,
    p_ponto_referencia: entrega ? vazioParaNull(endereco?.ponto_referencia) : null,
    p_itens: paraItensDoBanco(itens),
    p_forma_pagamento: vazioParaNull(formaPagamento),
    p_troco_para: formaPagamento === "dinheiro" ? vazioParaNull(trocoPara) : null,
    p_observacao: vazioParaNull(observacao),
    p_agendado_para: vazioParaNull(agendadoPara),
    p_tipo_entrega: tipoEntrega,
  });

  if (error) throw erroDoBanco(error);
  return { numero: data.numero, total: numero(data.total) };
}
