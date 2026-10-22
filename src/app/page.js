import { cacheLife, cacheTag } from "next/cache";
import Image from "next/image";
import { Suspense } from "react";
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
      {/* Capa da loja, no estilo das lojas Saipos */}
      <section className="-mx-3">
        <div className="capa h-28 sm:h-36" />
        <div className="px-4">
          <Image
            src="/logo.webp"
            alt="Edna & Célia Salgados"
            width={112}
            height={112}
            priority
            className="-mt-14 size-[112px] object-contain drop-shadow-lg"
          />
          <h1 className="mt-3 font-titulo text-[28px] leading-tight text-ferrugem">Edna &amp; Célia Salgados</h1>
          <p className="mt-0.5 text-sm italic text-texto-suave">Feitos com amor, temperados com carinho!</p>
        </div>
      </section>

      <Suspense fallback={<CardapioCarregando />}>
        <ConteudoCardapio />
      </Suspense>
    </>
  );
}
