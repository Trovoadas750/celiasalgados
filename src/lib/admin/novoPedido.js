// Pedido lançado pelo painel (telefone, WhatsApp, balcão). Usa o MESMO criar_pedido do site, mas
// com a sessão do admin: o banco libera agendar sem conta, loja fechada/pausada, dinheiro no
// agendamento etc., grava origem = 'admin' e o pagamento não expira (banco-de-dados.md, seção 5).

import { criarPedido } from "@/lib/pedidos";
import { getSupabaseAdmin } from "./supabaseAdmin";
import { checar } from "./pedidos";

/** Mesmo formato do criarPedido do site; devolve { numero, total, codigoAcompanhamento, ... }. */
export function criarPedidoAdmin(dados) {
  return criarPedido({ ...dados, conexao: getSupabaseAdmin() });
}

let sequencia = 0;
const novaChave = () => `admin-${Date.now()}-${++sequencia}`;

/**
 * Dados de um pedido antigo para "Repetir pedido", já no formato do formulário.
 * Itens que saíram do cardápio (ou sem produto) ficam de fora e voltam em `ignorados`.
 * @param {number} id
 * @param {{ pacotes: object[], refrigerantes: object[], adicionais: object[], sabores: object }} cardapio
 */
export async function carregarParaRepetir(id, cardapio) {
  const { data: p } = checar(
    await getSupabaseAdmin()
      .from("pedidos")
      .select(
        `nome, sobrenome, telefone, tipo_entrega, rua, numero, vila, ponto_referencia, cep, forma_pagamento, observacao,
        itens_pedido ( id, produto_id, categoria, nome_produto, modo, quantidade,
          itens_pedido_conteudo ( produto_id, nome_produto, quantidade ) )`,
      )
      .eq("id", id)
      .order("id", { referencedTable: "itens_pedido" })
      .maybeSingle(),
  );
  if (!p) throw new Error("Pedido não encontrado.");

  const pacotes = new Map(cardapio.pacotes.map((x) => [x.id, x]));
  const avulsos = new Map([...cardapio.refrigerantes, ...cardapio.adicionais].map((x) => [x.id, x]));
  const sabores = new Set(Object.values(cardapio.sabores).flat().map((s) => s.id));
  const itens = [];
  const ignorados = [];

  for (const i of p.itens_pedido) {
    const pacote = i.modo ? pacotes.get(i.produto_id) : null;
    if (pacote) {
      const conteudo = i.itens_pedido_conteudo ?? [];
      if (conteudo.every((c) => sabores.has(c.produto_id))) {
        itens.push({
          chave: novaChave(),
          produtoId: pacote.id,
          nome: pacote.nome,
          quantidade: i.quantidade,
          modo: i.modo,
          tamanho: pacote.salgados_a_escolher,
          sabores: conteudo.map((c) => ({ produtoId: c.produto_id, nome: c.nome_produto, quantidade: c.quantidade })),
        });
        continue;
      }
    } else if (!i.modo && avulsos.has(i.produto_id)) {
      const produto = avulsos.get(i.produto_id);
      itens.push({ chave: novaChave(), produtoId: produto.id, nome: produto.nome, categoria: produto.categoria, quantidade: i.quantidade });
      continue;
    }
    ignorados.push(`${i.quantidade}x ${i.nome_produto}`);
  }

  return {
    cliente: { nome: p.nome, sobrenome: p.sobrenome, telefone: p.telefone },
    tipoEntrega: p.tipo_entrega,
    endereco:
      p.tipo_entrega === "entrega"
        ? { cep: p.cep ?? "", rua: p.rua ?? "", numero: p.numero ?? "", vila: p.vila ?? "", ponto_referencia: p.ponto_referencia ?? "" }
        : null,
    forma: p.forma_pagamento ?? "",
    observacao: p.observacao ?? "",
    itens,
    ignorados,
  };
}

export { novaChave };
