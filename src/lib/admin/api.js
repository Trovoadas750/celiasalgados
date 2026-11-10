// Chamadas às rotas /api/admin/* com o token do admin (o servidor confere: autorizarAdmin.js).

import { getSupabaseAdmin } from "./supabaseAdmin";
import { MSG_SESSAO_EXPIRADA } from "./pedidos";

/**
 * @param {string} caminho  ex.: "/api/admin/clientes/senha"
 * @param {{ metodo?: "GET" | "POST", corpo?: object }} [opcoes]
 */
export async function chamarRotaAdmin(caminho, { metodo = "POST", corpo } = {}) {
  const { data } = await getSupabaseAdmin().auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    const erro = new Error(MSG_SESSAO_EXPIRADA);
    erro.sessaoExpirada = true;
    throw erro;
  }
  let resposta;
  try {
    resposta = await fetch(caminho, {
      method: metodo,
      headers: { Authorization: `Bearer ${token}`, ...(corpo ? { "Content-Type": "application/json" } : {}) },
      body: corpo ? JSON.stringify(corpo) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new Error("Sem conexão. Confira a internet e tente de novo.");
  }
  const json = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    const erro = new Error(json?.erro ?? "Não foi possível concluir agora.");
    erro.sessaoExpirada = resposta.status === 401;
    throw erro;
  }
  return json;
}
