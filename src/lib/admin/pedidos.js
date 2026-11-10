// Consultas e ações de pedidos do painel (sessão do admin; o RLS garante que só admin acessa).
// Preços e totais vêm sempre do banco: nada é recalculado aqui.

import { getSupabaseAdmin } from "./supabaseAdmin";
import { JANELA_PARA_SAIR_MIN, LIMITE_LISTA_ORDENADA, POR_PAGINA } from "./config";

export const POR_PAGINA_PADRAO = POR_PAGINA;
import { dataEmBrasilia, inicioDoDia, iso, somarDias } from "./datas";
import { ordenarPorHoraAlvo, STATUS_ATIVOS } from "./status";

const db = () => getSupabaseAdmin();

// ---------------------------------------------------------------------------
// Erros
// ---------------------------------------------------------------------------
export const MSG_HORARIO_OCUPADO = "Esse horário já está ocupado.";
export const MSG_SESSAO_EXPIRADA = "Sua sessão expirou. Entre de novo.";

/** Erro do Supabase -> Error com mensagem pronta. P0001 (regra do banco) aparece exatamente como veio. */
export function erroAdmin(error) {
  let mensagem = "Não foi possível concluir agora. Confira a internet e tente de novo.";
  const erro = new Error(mensagem);
  if (error?.code === "P0001") mensagem = error.message;
  else if (error?.code === "23505") {
    mensagem = MSG_HORARIO_OCUPADO;
    erro.horarioOcupado = true;
  } else if (error?.code === "23514" || error?.code === "22P02") mensagem = "Confira os dados: algum campo está fora do formato aceito.";
  else if (error?.code === "PGRST301" || error?.code === "PGRST303" || /jwt/i.test(error?.message ?? "")) {
    mensagem = MSG_SESSAO_EXPIRADA;
    erro.sessaoExpirada = true;
  } else if (error?.code === "42501") mensagem = "Sem permissão para esta ação. Entre de novo no painel.";
  else if (error?.code === "PGRST116") mensagem = "Pedido não encontrado (ou já foi alterado).";
  erro.message = mensagem;
  return erro;
}

export function checar({ data, error, count }) {
  if (error) throw erroAdmin(error);
  return { data, count };
}

// ---------------------------------------------------------------------------
// Abas e filtros
// ---------------------------------------------------------------------------
export const ABAS = [
  { id: "para_sair", rotulo: "Para sair agora", porHoraAlvo: true },
  { id: "atrasados", rotulo: "Atrasados", porHoraAlvo: true },
  { id: "agendados", rotulo: "Agendados" },
  { id: "aguardando", rotulo: "Aguardando pagamento" },
  { id: "hoje", rotulo: "Hoje", porHoraAlvo: true },
  { id: "finalizados", rotulo: "Finalizados" },
  { id: "cancelados", rotulo: "Cancelados" },
  { id: "todos", rotulo: "Todos" },
];
export const ABA_PADRAO = "para_sair";

export const COLUNAS_LISTA = `id, criado_em, atualizado_em, status, tipo_entrega, agendado_para, nome, sobrenome, telefone,
  rua, numero, vila, total, taxa_entrega, forma_pagamento, troco_para, pagamento_status, pagamento_expira_em, origem, codigo_acompanhamento,
  itens_pedido ( nome_produto, modo, quantidade )`;

const COLUNAS_CSV = `${COLUNAS_LISTA.replace("itens_pedido ( nome_produto, modo, quantidade )", "")}
  ponto_referencia, observacao, itens_pedido ( nome_produto, modo, quantidade, itens_pedido_conteudo ( nome_produto, quantidade ) )`;

/** Pedidos cujo "dia" (pela hora-alvo) está em [dataInicio, dataFim]. */
export function filtrarDias(q, dataInicio, dataFim, tempoMin) {
  const ini = new Date(inicioDoDia(dataInicio)).getTime();
  const fim = new Date(inicioDoDia(somarDias(dataFim, 1))).getTime();
  const desloca = tempoMin * 60000;
  return q.or(
    `and(agendado_para.is.null,criado_em.gte.${iso(ini - desloca)},criado_em.lt.${iso(fim - desloca)}),` +
      `and(agendado_para.gte.${iso(ini)},agendado_para.lt.${iso(fim)})`,
  );
}

function aplicarAba(q, aba, agora, tempoMin) {
  switch (aba) {
    case "para_sair":
      // Pendentes de pagamento NÃO saem daqui: aparecem com o badge "Aguardando pagamento".
      return q
        .in("status", STATUS_ATIVOS)
        .neq("pagamento_status", "expirado")
        .or(`agendado_para.is.null,agendado_para.lte.${iso(agora + JANELA_PARA_SAIR_MIN * 60000)}`);
    case "atrasados":
      return q
        .in("status", STATUS_ATIVOS)
        .neq("pagamento_status", "expirado")
        .or(`and(agendado_para.is.null,criado_em.lt.${iso(agora - tempoMin * 60000)}),agendado_para.lt.${iso(agora)}`);
    case "agendados":
      return q.gt("agendado_para", iso(agora)).neq("status", "cancelado").neq("pagamento_status", "expirado").order("agendado_para");
    case "aguardando":
      return q.eq("pagamento_status", "pendente").neq("status", "cancelado").order("pagamento_expira_em");
    case "hoje": {
      const hoje = dataEmBrasilia(agora);
      return filtrarDias(q, hoje, hoje, tempoMin);
    }
    case "finalizados":
      return q.eq("status", "entregue").order("atualizado_em", { ascending: false });
    case "cancelados":
      return q.or("status.eq.cancelado,pagamento_status.eq.expirado").order("atualizado_em", { ascending: false });
    default:
      return q.order("criado_em", { ascending: false });
  }
}

// Tira caracteres que quebram o filtro or() do PostgREST.
const limparBusca = (t) => t.replace(/[,()*%\\:"']/g, " ").trim();

/**
 * Filtros combináveis (os mesmos da URL).
 * @param {{ periodo?: string, de?: string, ate?: string, status?: string[], quando?: string, tipo?: string,
 *           pagamento?: string, forma?: string, origem?: string, modo?: string, busca?: string }} f
 */
function aplicarFiltros(q, f, agora, tempoMin) {
  const hoje = dataEmBrasilia(agora);
  if (f.periodo === "hoje") q = filtrarDias(q, hoje, hoje, tempoMin);
  else if (f.periodo === "amanha") q = filtrarDias(q, somarDias(hoje, 1), somarDias(hoje, 1), tempoMin);
  else if (f.periodo === "7dias") q = filtrarDias(q, hoje, somarDias(hoje, 6), tempoMin);
  else if (f.periodo === "intervalo" && f.de) q = filtrarDias(q, f.de, f.ate || f.de, tempoMin);

  if (f.status?.length) q = q.in("status", f.status);
  if (f.quando === "agora") q = q.is("agendado_para", null);
  if (f.quando === "agendado") q = q.not("agendado_para", "is", null);
  if (f.tipo) q = q.eq("tipo_entrega", f.tipo);
  if (f.pagamento) q = q.eq("pagamento_status", f.pagamento);
  if (f.forma) q = q.eq("forma_pagamento", f.forma);
  if (f.origem) q = q.eq("origem", f.origem);
  if (f.modo) q = q.eq("com_modo.modo", f.modo);

  const busca = limparBusca(f.busca ?? "");
  if (/^\d+$/.test(busca)) {
    q = busca.length <= 12 ? q.or(`id.eq.${busca},telefone.like.*${busca}*`) : q.like("telefone", `*${busca}*`);
  } else if (busca) {
    for (const palavra of busca.split(/\s+/).filter(Boolean)) {
      q = q.or(`nome.ilike.*${palavra}*,sobrenome.ilike.*${palavra}*`);
    }
  }
  return q;
}

function selecionar(colunas, f, opcoes) {
  // O filtro por modo precisa de um join interno separado (não corta a lista de itens exibida).
  const extra = f.modo ? ", com_modo:itens_pedido!inner(modo)" : "";
  return db().from("pedidos").select(`${colunas}${extra}`, opcoes);
}

/**
 * Lista da aba + filtros. Abas por hora-alvo buscam tudo (até o limite) e ordenam aqui;
 * as outras paginam no banco.
 * @returns {Promise<{ pedidos: object[], total: number }>}
 */
export async function listarPedidos({ aba, filtros = {}, pagina = 0, agora, tempoMin }) {
  const config = ABAS.find((a) => a.id === aba) ?? ABAS[0];
  if (config.porHoraAlvo) {
    let q = selecionar(COLUNAS_LISTA, filtros);
    q = aplicarFiltros(aplicarAba(q, config.id, agora, tempoMin), filtros, agora, tempoMin);
    const { data } = checar(await q.order("criado_em").range(0, LIMITE_LISTA_ORDENADA - 1));
    const ordenados = ordenarPorHoraAlvo(data ?? [], tempoMin);
    return { pedidos: ordenados.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA), total: ordenados.length };
  }
  let q = selecionar(COLUNAS_LISTA, filtros, { count: "exact" });
  q = aplicarFiltros(aplicarAba(q, config.id, agora, tempoMin), filtros, agora, tempoMin);
  const { data, count } = checar(await q.order("id", { ascending: false }).range(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA - 1));
  return { pedidos: data ?? [], total: count ?? 0 };
}

/** Contador de cada aba (sem os filtros extras). Só contagem: não baixa as linhas. */
export async function contarAbas({ agora, tempoMin }) {
  const resultados = await Promise.all(
    ABAS.map(async (aba) => {
      const q = aplicarAba(db().from("pedidos").select("id", { count: "exact", head: true }), aba.id, agora, tempoMin);
      const { count, error } = await q;
      return [aba.id, error ? null : count];
    }),
  );
  return Object.fromEntries(resultados);
}

/** Tudo do filtro atual para o CSV (até 1000 pedidos). */
export async function listarParaCsv({ aba, filtros = {}, agora, tempoMin }) {
  let q = selecionar(COLUNAS_CSV, filtros);
  q = aplicarFiltros(aplicarAba(q, aba, agora, tempoMin), filtros, agora, tempoMin);
  const { data } = checar(await q.order("criado_em").range(0, 999));
  return ordenarPorHoraAlvo(data ?? [], tempoMin);
}

// ---------------------------------------------------------------------------
// Detalhe e impressão
// ---------------------------------------------------------------------------
const COLUNAS_DETALHE = `*,
  itens_pedido ( id, categoria, nome_produto, modo, quantidade, preco_unitario, subtotal,
    itens_pedido_conteudo ( id, nome_produto, quantidade ) ),
  pedido_status_historico ( status, em ),
  anotacoes_pedido ( id, texto, criado_em ),
  cobrancas ( status )`;

export async function buscarPedido(id) {
  const { data } = checar(
    await db()
      .from("pedidos")
      .select(COLUNAS_DETALHE)
      .eq("id", id)
      .order("id", { referencedTable: "itens_pedido" })
      .order("em", { referencedTable: "pedido_status_historico" })
      .order("criado_em", { referencedTable: "anotacoes_pedido", ascending: false })
      .maybeSingle(),
  );
  return data;
}

export async function buscarParaImpressao(ids) {
  const { data } = checar(
    await db()
      .from("pedidos")
      .select(
        `id, criado_em, agendado_para, tipo_entrega, nome, sobrenome, telefone, rua, numero, vila, ponto_referencia,
        observacao, total, taxa_entrega, forma_pagamento, troco_para, pagamento_status, status, origem,
        itens_pedido ( id, nome_produto, modo, quantidade, subtotal, itens_pedido_conteudo ( id, nome_produto, quantidade ) )`,
      )
      .in("id", ids)
      .order("id", { referencedTable: "itens_pedido" }),
  );
  // Mantém a ordem pedida
  return ids.map((id) => data.find((p) => p.id === id)).filter(Boolean);
}

/** Linha de admin_clientes do telefone: nº de pedidos, se tem conta, se está bloqueado. */
export async function buscarResumoCliente(telefone) {
  const { data } = checar(await db().rpc("admin_clientes", { p_busca: telefone, p_limite: 10 }));
  return (data ?? []).find((c) => c.telefone === telefone) ?? null;
}

// ---------------------------------------------------------------------------
// Ações
// ---------------------------------------------------------------------------
export async function mudarStatus(id, status) {
  checar(await db().from("pedidos").update({ status }).eq("id", id).select("id").single());
}

export async function mudarStatusEmLote(ids, status) {
  const { data } = checar(await db().from("pedidos").update({ status }).in("id", ids).select("id"));
  return data?.length ?? 0;
}

export async function confirmarPagamento(id, referencia) {
  checar(await db().rpc("confirmar_pagamento", { p_pedido_id: id, p_referencia: referencia?.trim() || null }));
}

export async function adicionarAnotacao(pedidoId, texto) {
  checar(await db().from("anotacoes_pedido").insert({ pedido_id: pedidoId, texto: texto.trim() }));
}

/** Cancela e guarda o motivo como anotação interna. */
export async function cancelarPedido(id, motivo) {
  checar(await db().from("pedidos").update({ status: "cancelado" }).eq("id", id).select("id").single());
  await adicionarAnotacao(id, `Cancelado: ${motivo.trim()}`);
}

/** Troca o horário (o índice único do banco recusa horário ocupado: erro.horarioOcupado). */
export async function reagendar(id, inicio) {
  checar(await db().from("pedidos").update({ agendado_para: inicio }).eq("id", id).select("id").single());
}

/**
 * Reativa um pedido cancelado/expirado.
 * @param {{ pago: boolean, referencia?: string, pagoEm?: string | null }} escolha
 */
export async function reativarPedido(id, { pago, referencia, pagoEm }) {
  const campos = { status: "novo", pagamento_expira_em: null, pagamento_status: pago ? "pago" : "nao_exigido" };
  if (pago) {
    campos.pagamento_referencia = referencia?.trim() || null;
    campos.pago_em = pagoEm ?? new Date().toISOString();
  }
  checar(await db().from("pedidos").update(campos).eq("id", id).select("id").single());
}

/** Edita contato, observação e (com aviso de que o frete não muda) o endereço. */
export async function editarPedido(id, campos) {
  checar(await db().from("pedidos").update(campos).eq("id", id).select("id").single());
}

export async function bloquearTelefone(telefone, motivo) {
  checar(await db().from("telefones_bloqueados").upsert({ telefone, motivo: motivo?.trim() || null }));
}

export async function desbloquearTelefone(telefone) {
  checar(await db().from("telefones_bloqueados").delete().eq("telefone", telefone));
}

/** Só cancelados/expirados. Itens, histórico e anotações saem junto (cascade). */
export async function excluirPedido(id) {
  const { data } = checar(
    await db().from("pedidos").delete().eq("id", id).or("status.eq.cancelado,pagamento_status.eq.expirado").select("id"),
  );
  if (!data?.length) throw new Error("Só é possível excluir pedidos cancelados.");
}

/** Horários livres de um dia (sem p_itens: o admin não tem a trava de antecedência dos itens). */
export async function horariosDisponiveis(data) {
  const { data: lista } = checar(await db().rpc("horarios_disponiveis", { p_data: data }));
  return lista ?? [];
}

// ---------------------------------------------------------------------------
// Loja
// ---------------------------------------------------------------------------
export async function buscarStatusLoja() {
  const { data } = checar(await db().rpc("status_loja"));
  return data;
}

/** Pausa os pedidos "agora" até `ateIso` (null = retomar). */
export async function pausarLoja(ateIso) {
  checar(await db().from("config_loja").update({ pausado_ate: ateIso }).eq("id", 1).select("id").single());
}

let enderecoLoja = null;

/** Endereço da loja (config_loja.endereco), para a mensagem de "pronto para retirada". */
export async function buscarEnderecoLoja() {
  enderecoLoja ??= db()
    .from("config_loja")
    .select("endereco")
    .eq("id", 1)
    .maybeSingle()
    .then(({ data }) => data?.endereco ?? null)
    .catch(() => null);
  const valor = await enderecoLoja;
  if (!valor) enderecoLoja = null;
  return valor;
}

export async function expirarPagamentosPendentes() {
  const { data } = checar(await db().rpc("expirar_pagamentos_pendentes"));
  return data ?? 0;
}

export async function souAdmin() {
  const { data, error } = await db().rpc("sou_admin");
  if (error) throw erroAdmin(error);
  return data === true;
}
