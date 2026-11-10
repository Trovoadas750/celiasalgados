import { autorizarAdmin, conferirContaDeCliente, lerCorpo } from "@/lib/admin/autorizarAdmin";

// POST /api/admin/clientes/senha  { clienteId, novaSenha }
// Header: Authorization: Bearer <access_token do admin>
// Redefine a senha de uma conta de CLIENTE (cliente esqueceu; não há recuperação por e-mail/SMS).
export async function POST(request) {
  const acesso = await autorizarAdmin(request);
  if (!acesso.ok) return acesso.resposta;

  const corpo = await lerCorpo(request);
  const senha = typeof corpo?.novaSenha === "string" ? corpo.novaSenha : "";
  if (senha.length < 8 || senha.length > 72) {
    return Response.json({ erro: "A senha precisa ter de 8 a 72 caracteres." }, { status: 400 });
  }
  const problema = await conferirContaDeCliente(acesso.supabase, corpo?.clienteId);
  if (problema) return Response.json({ erro: problema }, { status: 400 });

  const { error } = await acesso.supabase.auth.admin.updateUserById(corpo.clienteId, { password: senha });
  if (error) {
    console.error("[admin/clientes/senha]", error.message);
    return Response.json({ erro: "Não foi possível trocar a senha. Tente outra senha (mais longa) ou tente de novo." }, { status: 400 });
  }
  return Response.json({ ok: true });
}
