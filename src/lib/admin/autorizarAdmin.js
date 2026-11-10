import "server-only"; // o build falha se algum componente do navegador importar este arquivo

import { createClient } from "@supabase/supabase-js";
import { criarSupabaseServidor, supabaseServidorConfigurado } from "@/lib/supabaseServidor";

// Rotas /api/admin/*: só seguem se o "Authorization: Bearer <access_token>" for de um admin.
// 1) auth.getUser(token) confere a sessão no Supabase;
// 2) sou_admin() roda COM O TOKEN DO USUÁRIO (auth.uid() = quem chamou);
// só depois a rota usa a chave secreta.

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CHAVE_PUBLICA = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const resposta = (erro, status) => ({ ok: false, resposta: Response.json({ erro }, { status }) });

/**
 * @returns {Promise<{ ok: true, usuario: object, supabase: object } | { ok: false, resposta: Response }>}
 *   `supabase` = cliente com a chave secreta (ignora o RLS: use com cuidado).
 */
export async function autorizarAdmin(request) {
  if (!supabaseServidorConfigurado || !URL_SUPABASE || !CHAVE_PUBLICA) {
    return resposta("O servidor ainda não está configurado (SUPABASE_SECRET_KEY).", 503);
  }
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return resposta("Entre no painel de novo.", 401);

  const supabase = criarSupabaseServidor();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return resposta("Sua sessão expirou. Entre de novo.", 401);

  const comoUsuario = createClient(URL_SUPABASE, CHAVE_PUBLICA, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: admin, error: erroAdmin } = await comoUsuario.rpc("sou_admin");
  if (erroAdmin || admin !== true) return resposta("Sem permissão.", 403);

  return { ok: true, usuario: data.user, supabase };
}

/** Lê o JSON do corpo (ou null). */
export async function lerCorpo(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Confere que `id` é uma conta de CLIENTE (tem linha em `clientes`) e não de admin.
 * As rotas de cliente nunca mexem em conta de admin.
 * @returns {Promise<string | null>} mensagem de erro, ou null se pode seguir
 */
export async function conferirContaDeCliente(supabase, id) {
  if (!UUID.test(String(id ?? ""))) return "Cliente inválido.";
  const [{ data: cliente }, { data: admin }] = await Promise.all([
    supabase.from("clientes").select("id").eq("id", id).maybeSingle(),
    supabase.from("admins").select("user_id").eq("user_id", id).maybeSingle(),
  ]);
  if (admin) return "Esta conta é de administrador: não pode ser alterada por aqui.";
  if (!cliente) return "Conta de cliente não encontrada.";
  return null;
}
