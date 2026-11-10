import { createClient } from "@supabase/supabase-js";
import { MENSAGEM_SEM_CONFIGURACAO, supabaseConfigurado } from "@/lib/supabase";

// Cliente do navegador SÓ do painel. A sessão fica numa chave própria do localStorage, separada
// da sessão do cliente do site: entrar no painel não loga a dona como cliente (e vice-versa).
// Chave publishable: a proteção real dos dados é o RLS do banco (só admin lê/edita pedidos).
const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CHAVE_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let cliente = null;

export function getSupabaseAdmin() {
  if (!supabaseConfigurado) throw new Error(MENSAGEM_SEM_CONFIGURACAO);
  cliente ??= createClient(URL_SUPABASE, CHAVE_SUPABASE, {
    auth: { storageKey: "celiasalgados-admin-auth", persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  return cliente;
}
