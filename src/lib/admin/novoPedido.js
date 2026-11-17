// Pedido lançado pelo painel (telefone, WhatsApp, balcão). Usa o MESMO criar_pedido do site, mas
// com a sessão do admin: o banco libera agendar sem conta, loja fechada/pausada, dinheiro no
// agendamento etc., grava origem = 'admin' e o pagamento não expira (banco-de-dados.md, seção 5).

import { problemasLivre } from "@/lib/livre";
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
 * "Monte do seu jeito" que não cumpre mais as regras (ex.: qualidade desativada) volta em `ajustar`
 * ({ item, problemas }), com as qualidades que ainda valem, para abrir a montagem e corrigir.
 * @param {number} id
 * @param {{ pacotes: object[], refrigerantes: object[], adicionais: object[], sabores: object, livre?: object | null }} cardapio
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
  const saboresPorId = new Map(Object.values(cardapio.sabores).flat().map((s) => [s.id, s]));
  const livre = cardapio.livre ?? null;
  const itens = [];
  const ignorados = [];
  const ajustar = [];

  for (const i of p.itens_pedido) {
    // "Monte do seu jeito": copia modo + qualidades com as quantidades; o banco recalcula o preço.
    if (i.modo && livre && i.produto_id === livre.id) {
      const conteudo = (i.itens_pedido_conteudo ?? []).map((c) => ({ produtoId: c.produto_id, nome: c.nome_produto, quantidade: c.quantidade }));
      const item = { chave: novaChave(), produtoId: livre.id, nome: i.nome_produto, quantidade: 1, modo: i.modo, sabores: conteudo, livre: true };
      const problemas = problemasLivre({ modo: i.modo, sabores: conteudo, regras: livre.regras, maxSabores: livre.max_sabores ?? 10, saboresPorId });
      if (problemas.length === 0) itens.push(item);
      else {
        // Só as qualidades que ainda existem e saem nesse modo vão para a montagem.
        const valem = conteudo.filter((c) => {
          const sabor = saboresPorId.get(c.produtoId);
          return sabor && (i.modo === "congelado" ? sabor.vende_congelado : sabor.vende_pronto);
        });
        ajustar.push({ item: { ...item, sabores: valem }, problemas });
      }
      continue;
    }
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
    ajustar,
  };
}

export { novaChave };
