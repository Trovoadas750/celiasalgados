import Image from "next/image";
import Cardapio from "@/components/cardapio/Cardapio";
import { IconeAlfinete, IconeAmpulheta } from "@/components/icones";
import { PRODUTOS } from "@/lib/mock";

export default function MenuPage() {
  return (
    <>
      {/* Capa da loja, no estilo das lojas Saipos */}
      <section className="-mx-3">
        <div className="capa h-28 sm:h-36" />
        <div className="px-4">
          <div className="-mt-14 flex items-end gap-3">
            <Image
              src="/logo.png"
              alt="Edna & Célia Salgados"
              width={112}
              height={112}
              priority
              className="size-[112px] shrink-0 rounded-full object-contain drop-shadow-lg"
            />
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
              <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
              Aberto agora
            </span>
          </div>
          <h1 className="mt-3 font-titulo text-[28px] leading-tight text-vermelho">Edna &amp; Célia Salgados</h1>
          <p className="mt-0.5 text-sm italic text-tinta/70">Feitos com amor, temperados com carinho!</p>

          <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-tinta/80">
            <div className="flex items-center gap-1.5">
              <IconeAmpulheta className="size-4 text-vermelho" />
              <dt className="sr-only">Tempo de preparo</dt>
              <dd>40–60 min</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <IconeAlfinete className="size-4 text-vermelho" />
              <dt className="sr-only">Entrega</dt>
              <dd>Entrega na sua vila</dd>
            </div>
          </dl>
        </div>
      </section>

      <Cardapio produtos={PRODUTOS} />
    </>
  );
}
