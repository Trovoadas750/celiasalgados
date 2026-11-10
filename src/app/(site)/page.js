import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";
import BannerInicio from "@/components/BannerInicio";
import Cardapio from "@/components/cardapio/Cardapio";
import { CardapioCarregando, CardapioErro } from "@/components/cardapio/EstadosCardapio";
import { listarCardapio } from "@/lib/cardapio";

// Cardápio lido no servidor e guardado em cache por alguns minutos (economiza o egress
// do plano grátis). Mudanças no banco aparecem em ~1 minuto, ou na hora com revalidateTag("cardapio").
async function carregarCardapio() {
  "use cache";
  cacheLife("minutes");
  cacheTag("cardapio");
  try {
    return { cardapio: await listarCardapio(), erro: null };
  } catch (e) {
    return { cardapio: null, erro: e.message };
  }
}

async function ConteudoCardapio() {
  const { cardapio, erro } = await carregarCardapio();
  if (erro) return <CardapioErro mensagem={erro} />;
  return <Cardapio cardapio={cardapio} />;
}

export default function MenuPage() {
  return (
    <>
      <BannerInicio />

      <Suspense fallback={<CardapioCarregando />}>
        <ConteudoCardapio />
      </Suspense>
    </>
  );
}
