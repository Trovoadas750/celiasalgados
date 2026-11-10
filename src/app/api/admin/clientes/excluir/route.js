import { autorizarAdmin, conferirContaDeCliente, lerCorpo } from "@/lib/admin/autorizarAdmin";

// POST /api/admin/clientes/excluir  { clienteId }
// Header: Authorization: Bearer <access_token do admin>
// Apaga a conta de login do CLIENTE. A linha em `clientes` sai junto (cascade);
// os pedidos continuam, sem vínculo com a conta.
export async function POST(request) {
  const acesso = await autorizarAdmin(request);
  if (!acesso.ok) return acesso.resposta;

  const corpo = await lerCorpo(request);
  const problema = await conferirContaDeCliente(acesso.supabase, corpo?.clienteId);
  if (problema) return Response.json({ erro: problema }, { status: 400 });

  const { error } = await acesso.supabase.auth.admin.deleteUser(corpo.clienteId);
  if (error) {
    console.error("[admin/clientes/excluir]", error.message);
    return Response.json({ erro: "Não foi possível excluir a conta agora. Tente de novo." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
