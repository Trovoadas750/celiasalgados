// Clientes no painel: lista (admin_clientes), histórico, conta e as rotas de servidor
// (senha e exclusão usam a chave secreta, por isso passam por /api/admin/*).

import { getSupabaseAdmin } from "./supabaseAdmin";
import { chamarRotaAdmin } from "./api";
import { checar, COLUNAS_LISTA, POR_PAGINA_PADRAO } from "./pedidos";

const db = () => getSupabaseAdmin();

/** Clientes com conta e convidados, agrupados pelo telefone. Busca por nome ou parte do telefone. */
export async function listarClientes(busca = "") {
  const termo = busca.trim();
  const { data } = checar(await db().rpc("admin_clientes", { p_busca: termo || null, p_limite: 200 }));
  return (data ?? []).map((c) => ({ ...c, total_gasto: Number(c.total_gasto ?? 0), pedidos: Number(c.pedidos ?? 0) }));
}

/** Pedidos com este telefone, mais recentes primeiro (paginado). */
export async function listarPedidosDoTelefone(telefone, pagina = 0) {
  const { data, count } = checar(
    await db()
      .from("pedidos")
      .select(COLUNAS_LISTA, { count: "exact" })
      .eq("telefone", telefone)
      .order("criado_em", { ascending: false })
      .range(pagina * POR_PAGINA_PADRAO, (pagina + 1) * POR_PAGINA_PADRAO - 1),
  );
  return { pedidos: data ?? [], total: count ?? 0 };
}

/** Linha da conta do cliente (nome e sobrenome como estão no cadastro). */
export async function buscarConta(clienteId) {
  const { data } = checar(await db().from("clientes").select("id, nome, sobrenome, telefone, criado_em").eq("id", clienteId).maybeSingle());
  return data;
}

/** Nome e sobrenome da CONTA (o telefone não muda: é o login). */
export async function editarNomeConta(clienteId, { nome, sobrenome }) {
  checar(await db().from("clientes").update({ nome: nome.trim(), sobrenome: sobrenome.trim() }).eq("id", clienteId).select("id").single());
}

export function redefinirSenhaCliente(clienteId, novaSenha) {
  return chamarRotaAdmin("/api/admin/clientes/senha", { corpo: { clienteId, novaSenha } });
}

export function excluirContaCliente(clienteId) {
  return chamarRotaAdmin("/api/admin/clientes/excluir", { corpo: { clienteId } });
}

export { gerarSenha } from "./senha";
