import { getSupabase, supabaseConfigurado, MENSAGEM_SEM_CONFIGURACAO } from "./supabase";
import { sortearAvatar } from "./avatar";
import { soDigitos } from "./validacao";

// Autenticação do cliente: telefone + senha, sem e-mail e sem SMS (contextoBD.md, seção 3).
// O Supabase Auth recebe um e-mail fictício. O domínio está fixo no gatilho do banco: não mude.
const DOMINIO_CLIENTE = "cliente.invalid";

export function emailDoTelefone(telefone) {
  return `${soDigitos(telefone)}@${DOMINIO_CLIENTE}`;
}

const MSG_MUITAS_TENTATIVAS = "Muitas tentativas. Espere alguns minutos.";
const MSG_GENERICA = "Não foi possível concluir agora. Tente novamente.";

export function mensagemErroAuth(error) {
  if (!error) return null;
  // Em desenvolvimento, mostra o erro original do Supabase no console para facilitar o diagnóstico.
  if (process.env.NODE_ENV !== "production") console.error("[Supabase Auth]", error.status, error.code, error.message);
  const codigo = error.code ?? "";
  const texto = (error.message ?? "").toLowerCase();

  if (error.status === 429 || codigo.startsWith("over_") || texto.includes("rate limit")) return MSG_MUITAS_TENTATIVAS;
  if (codigo === "invalid_credentials" || texto.includes("invalid login credentials")) return "Telefone ou senha incorretos.";
  // "Database error saving new user": o gatilho barrou o telefone repetido em `clientes`.
  if (
    codigo === "user_already_exists" ||
    codigo === "email_exists" ||
    texto.includes("already registered") ||
    texto.includes("saving new user")
  ) {
    return "Já existe uma conta com esse telefone. Tente entrar.";
  }
  if (codigo === "weak_password") return "Senha fraca. Use pelo menos 8 caracteres.";
  // Acontece quando "Confirm email" está ligado no Supabase: ele tenta mandar e-mail para @cliente.invalid.
  if (codigo === "email_address_invalid" || texto.includes("confirmation email")) {
    return "O cadastro está temporariamente indisponível. Fale com a salgadaria.";
  }
  if (error.status === 0 || error.name === "AuthRetryableFetchError") return "Sem conexão. Confira sua internet.";
  return MSG_GENERICA;
}

function semConfiguracao() {
  return { erro: MENSAGEM_SEM_CONFIGURACAO };
}

export async function cadastrar({ nome, sobrenome, telefone, senha }) {
  if (!supabaseConfigurado) return semConfiguracao();
  const { data, error } = await getSupabase().auth.signUp({
    email: emailDoTelefone(telefone),
    password: senha,
    // avatar: sorteado aqui e guardado só nos metadados do login (lib/avatar.js)
    options: { data: { nome: nome.trim(), sobrenome: sobrenome.trim(), avatar: sortearAvatar() } },
  });
  if (error) return { erro: mensagemErroAuth(error) };
  // Com "Confirm email" desligado o signUp já devolve sessão. Se o e-mail já existia,
  // o Supabase pode responder sem erro e sem sessão: tratamos como telefone já cadastrado.
  if (!data.session) return { erro: "Já existe uma conta com esse telefone. Tente entrar." };
  return { erro: null };
}

export async function entrar({ telefone, senha }) {
  if (!supabaseConfigurado) return semConfiguracao();
  const { error } = await getSupabase().auth.signInWithPassword({
    email: emailDoTelefone(telefone),
    password: senha,
  });
  return { erro: mensagemErroAuth(error) };
}

export async function sair() {
  if (!supabaseConfigurado) return;
  await getSupabase().auth.signOut();
}

// Linha de `clientes` do usuário logado (ou null se ele não for cliente, ex.: admin).
export async function buscarCliente(userId) {
  const { data, error } = await getSupabase()
    .from("clientes")
    .select("nome, sobrenome, telefone, criado_em")
    .eq("id", userId)
    .maybeSingle();
  if (error) return { cliente: null, erro: MSG_GENERICA };
  return { cliente: data, erro: null };
}

// O cliente só pode editar nome e sobrenome; o telefone é o login.
export async function atualizarNome(userId, { nome, sobrenome }) {
  const { data, error } = await getSupabase()
    .from("clientes")
    .update({ nome: nome.trim(), sobrenome: sobrenome.trim() })
    .eq("id", userId)
    .select("nome, sobrenome, telefone, criado_em")
    .single();
  if (error) return { cliente: null, erro: error.code === "23514" ? "Confira o nome e o sobrenome." : MSG_GENERICA };
  return { cliente: data, erro: null };
}

// Pedidos do cliente logado, mais recentes primeiro. Paginado para economizar egress.
export async function buscarMeusPedidos(userId, { pagina = 0, porPagina = 20 } = {}) {
  const inicio = pagina * porPagina;
  const { data, error } = await getSupabase()
    .from("pedidos")
    .select(
      `id, criado_em, status, tipo_entrega, agendado_para, forma_pagamento, total, rua, vila, numero, ponto_referencia,
      pagamento_status, pagamento_expira_em,
      itens_pedido ( id, categoria, nome_produto, modo, quantidade, preco_unitario, subtotal,
        itens_pedido_conteudo ( nome_produto, quantidade ) )`,
    )
    .eq("cliente_id", userId)
    .order("criado_em", { ascending: false })
    .range(inicio, inicio + porPagina - 1);
  if (error) return { pedidos: [], erro: "Não foi possível carregar seus pedidos." };
  return { pedidos: data, erro: null };
}

// Troca o avatar do cliente logado. Fica em user_metadata (lib/avatar.js), não em `clientes`.
export async function atualizarAvatar(numero) {
  const { data, error } = await getSupabase().auth.updateUser({ data: { avatar: numero } });
  if (error) return { usuario: null, erro: mensagemErroAuth(error) };
  return { usuario: data.user, erro: null };
}

/**
 * Agendamentos do cliente logado aguardando pagamento, ainda no prazo.
 * @returns {Promise<{ pendentes: { numero, total, agendado_para, expira_em, mensagem }[], erro: string | null }>}
 */
export async function buscarPagamentosPendentes() {
  const { data, error } = await getSupabase().rpc("meus_pagamentos_pendentes");
  if (error) return { pendentes: [], erro: MSG_GENERICA };
  return { pendentes: (data ?? []).map((p) => ({ ...p, total: Number(p.total) })), erro: null };
}
