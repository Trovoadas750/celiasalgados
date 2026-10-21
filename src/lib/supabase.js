import { createClient } from "@supabase/supabase-js";

// Chave publishable (sb_publishable_...). NUNCA use a chave secreta aqui: este código vai para o navegador.
// As variáveis precisam ser lidas com o nome literal para o Next embuti-las no bundle.
const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CHAVE_SUPABASE =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigurado = Boolean(URL_SUPABASE && CHAVE_SUPABASE);

export const MENSAGEM_SEM_CONFIGURACAO =
  "O site ainda não está conectado ao banco. Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.local.";

let clienteNavegador = null;

// Cliente do navegador, com sessão salva no localStorage. Use só em componentes 'use client'.
export function getSupabase() {
  if (!supabaseConfigurado) throw new Error(MENSAGEM_SEM_CONFIGURACAO);
  clienteNavegador ??= createClient(URL_SUPABASE, CHAVE_SUPABASE);
  return clienteNavegador;
}
