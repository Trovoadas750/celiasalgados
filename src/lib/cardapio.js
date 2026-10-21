import { cacheLife, cacheTag } from "next/cache";
import { criarSupabasePublico } from "./supabase";

// Cardápio público, lido no servidor e guardado em cache por alguns minutos para
// economizar egress do plano grátis. Mudanças no admin aparecem em até ~1 minuto
// (ou na hora, chamando revalidateTag("cardapio")).
export async function buscarCardapio() {
  "use cache";
  cacheLife("minutes");
  cacheTag("cardapio");

  const supabase = criarSupabasePublico();
  if (!supabase) return { produtos: [], erro: "sem_configuracao" };

  // Use os nomes das FKs: produtos e kit_componentes se ligam por duas colunas.
  const { data, error } = await supabase
    .from("produtos")
    .select(
      `id, categoria, nome, descricao, preco, imagem_url, salgados_a_escolher, max_sabores,
      componentes:kit_componentes!kit_componentes_kit_fk (
        quantidade,
        produto:produtos!kit_componentes_produto_fk ( id, nome, categoria ) )`,
    )
    .eq("ativo", true)
    .order("ordem")
    .order("nome");

  if (error) return { produtos: [], erro: "falha" };
  // numeric chega como string em alguns casos; normaliza para número.
  return { produtos: data.map((p) => ({ ...p, preco: Number(p.preco) })), erro: null };
}
