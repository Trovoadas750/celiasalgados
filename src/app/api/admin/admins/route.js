import { autorizarAdmin } from "@/lib/admin/autorizarAdmin";

// GET /api/admin/admins  → { admins: [{ email, criado_em, ultimo_acesso, voce }] }
// Header: Authorization: Bearer <access_token do admin>
// Somente leitura. Novo admin é criado pelo Supabase (Authentication › Users + insert em admins).
export async function GET(request) {
  const acesso = await autorizarAdmin(request);
  if (!acesso.ok) return acesso.resposta;

  const { data: linhas, error } = await acesso.supabase.from("admins").select("user_id, criado_em").order("criado_em");
  if (error) {
    console.error("[admin/admins]", error.message);
    return Response.json({ erro: "Não foi possível carregar os administradores." }, { status: 500 });
  }

  const admins = await Promise.all(
    (linhas ?? []).map(async ({ user_id: id, criado_em }) => {
      const { data } = await acesso.supabase.auth.admin.getUserById(id);
      return {
        email: data?.user?.email ?? "(conta não encontrada)",
        criado_em,
        ultimo_acesso: data?.user?.last_sign_in_at ?? null,
        voce: id === acesso.usuario.id,
      };
    }),
  );
  return Response.json({ admins });
}
