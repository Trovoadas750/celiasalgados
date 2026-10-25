import "server-only"; // o build falha se algum componente do navegador importar este arquivo

import { createClient } from "@supabase/supabase-js";

// Cliente com a CHAVE SECRETA (sb_secret_...). Ignora o RLS: use SÓ em rotas de servidor (app/api).
// A variável NÃO tem prefixo NEXT_PUBLIC_, então o Next nunca a coloca no código do navegador.
const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CHAVE_SECRETA = process.env.SUPABASE_SECRET_KEY;

export const supabaseServidorConfigurado = Boolean(URL_SUPABASE && CHAVE_SECRETA);

export function criarSupabaseServidor() {
  if (!supabaseServidorConfigurado) {
    throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY nas variáveis do servidor.");
  }
  return createClient(URL_SUPABASE, CHAVE_SECRETA, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
