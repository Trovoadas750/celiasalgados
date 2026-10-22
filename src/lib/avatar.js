// Avatares do perfil do cliente: 10 desenhos em public/avatares/ (avatar-1.svg … avatar-10.svg).
// Estilo "Notionists" (Zoish, CC0 1.0), gerados pelo DiceBear com fundos da paleta.
//
// O número do avatar é sorteado no cadastro e o cliente pode trocar na tela de perfil.
// Fica nos metadados da conta de login (auth.users → user_metadata.avatar); não existe coluna no banco.
// Contas antigas, sem o campo, recebem um avatar fixo calculado a partir do id.

export const AVATARES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function sortearAvatar() {
  return AVATARES[Math.floor(Math.random() * AVATARES.length)];
}

/** Número do avatar (1 a 10) de um usuário do Supabase Auth. */
export function avatarDoUsuario(usuario) {
  if (!usuario) return null;
  const salvo = Number(usuario.user_metadata?.avatar);
  if (AVATARES.includes(salvo)) return salvo;
  let soma = 0;
  for (const letra of usuario.id ?? "") soma = (soma + letra.charCodeAt(0)) % 997;
  return AVATARES[soma % AVATARES.length];
}

export function caminhoDoAvatar(numero) {
  return `/avatares/avatar-${numero}.svg`;
}
