// Consultas das telas de visão do painel: Hoje, Cozinha, Agenda e Produção.
// Só leitura (o RLS libera ao admin). Valores sempre do banco.

import { getSupabaseAdmin } from "./supabaseAdmin";
import { LIMITE_LISTA_ORDENADA } from "./config";
import { dataEmBrasilia, inicioDoDia, iso, somarDias } from "./datas";
import { checar, COLUNAS_LISTA, filtrarDias } from "./pedidos";
import { ordenarPorHoraAlvo, STATUS_ATIVOS } from "./status";

const db = () => getSupabaseAdmin();

/** Início de amanhã (Brasília), em ISO UTC. */
const inicioDeAmanha = (agora) => iso(new Date(inicioDoDia(somarDias(dataEmBrasilia(agora), 1))));

/**
 * Fila de atendimento: pedidos não finalizados com hora-alvo até hoje (inclui atrasados de
 * ontem), ordenados pela hora-alvo. Pagamento pendente continua na fila (com o selo).
 */
export async function listarFila({ agora, tempoMin }) {
  const { data } = checar(
    await db()
      .from("pedidos")
      .select(COLUNAS_LISTA)
      .in("status", STATUS_ATIVOS)
      .neq("pagamento_status", "expirado")
      .or(`agendado_para.is.null,agendado_para.lt.${inicioDeAmanha(agora)}`)
      .order("criado_em")
      .range(0, LIMITE_LISTA_ORDENADA - 1),
  );
  return ordenarPorHoraAlvo(data ?? [], tempoMin);
}

/** Agendamentos de amanhã em diante (não cancelados). */
export async function listarProximosAgendamentos({ agora, limite = 15 }) {
  const { data } = checar(
    await db()
      .from("pedidos")
      .select(COLUNAS_LISTA)
      .gte("agendado_para", inicioDeAmanha(agora))
      .neq("status", "cancelado")
      .neq("pagamento_status", "expirado")
      .order("agendado_para")
      .range(0, limite - 1),
  );
  return data ?? [];
}

/** Todos os agendamentos aguardando pagamento (para o cartão e o aviso de prazo vencendo). */
export async function listarAguardandoPagamento() {
  const { data } = checar(
    await db()
      .from("pedidos")
      .select("id, nome, total, pagamento_expira_em, agendado_para")
      .eq("pagamento_status", "pendente")
      .neq("status", "cancelado")
      .order("pagamento_expira_em")
      .range(0, 199),
  );
  return data ?? [];
}

/** admin_resumo de um período (aqui: um dia). */
export async function resumoPeriodo(inicio, fim = inicio) {
  const { data } = checar(await db().rpc("admin_resumo", { p_inicio: inicio, p_fim: fim }));
  return data;
}

/** Cozinha: "Novo" e "Em preparo" até hoje, com sabores e observação, pela hora-alvo. */
export async function listarCozinha({ agora, tempoMin }) {
  const { data } = checar(
    await db()
      .from("pedidos")
      .select(
        `id, criado_em, status, tipo_entrega, agendado_para, nome, sobrenome, observacao, total, pagamento_status, origem,
        itens_pedido ( id, nome_produto, modo, quantidade, itens_pedido_conteudo ( id, nome_produto, quantidade ) )`,
      )
      .in("status", ["novo", "em_preparo"])
      .neq("pagamento_status", "expirado")
      .or(`agendado_para.is.null,agendado_para.lt.${inicioDeAmanha(agora)}`)
      .order("id", { referencedTable: "itens_pedido" })
      .order("criado_em")
      .range(0, 99),
  );
  return ordenarPorHoraAlvo(data ?? [], tempoMin);
}

// ---- Agenda ----
export async function listarHorariosFuncionamento() {
  const { data } = checar(await db().from("horarios_funcionamento").select("dia_semana, abre, fecha, ativo").order("dia_semana").order("abre"));
  return data ?? [];
}

export async function listarDiasFechados(de, ate) {
  const { data } = checar(await db().from("dias_fechados").select("data, motivo").gte("data", de).lte("data", ate));
  return data ?? [];
}

/** Pedidos não cancelados cujo dia (pela hora-alvo) está entre `de` e `ate`. */
export async function listarPedidosAgenda({ de, ate, tempoMin }) {
  const q = db().from("pedidos").select(COLUNAS_LISTA).neq("status", "cancelado").neq("pagamento_status", "expirado");
  const { data } = checar(await filtrarDias(q, de, ate, tempoMin).order("agendado_para").order("criado_em").range(0, 499));
  return data ?? [];
}

// ---- Produção ----
export async function buscarProducao(data, incluirPendentes) {
  const { data: resultado } = checar(await db().rpc("admin_producao", { p_data: data, p_incluir_pendentes: incluirPendentes }));
  return resultado;
}
