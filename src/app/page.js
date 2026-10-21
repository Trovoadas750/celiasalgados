import Image from "next/image";
import Cardapio from "@/components/cardapio/Cardapio";
import { buscarCardapio } from "@/lib/cardapio";

const AVISOS = {
  sem_configuracao: "O cardápio ainda não está conectado ao banco de dados.",
  falha: "Não foi possível carregar o cardápio agora. Tente de novo em instantes.",
};

export default async function MenuPage() {
  const { produtos, erro } = await buscarCardapio();

  return (
    <>
      {/* Capa da loja, no estilo das lojas Saipos */}
      <section className="-mx-3">
        <div className="capa h-28 sm:h-36" />
        <div className="px-4">
          <Image
            src="/logo.png"
            alt="Edna & Célia Salgados"
            width={112}
            height={112}
            priority
            className="-mt-14 size-[112px] object-contain drop-shadow-lg"
          />
          <h1 className="mt-3 font-titulo text-[28px] leading-tight text-vermelho">Edna &amp; Célia Salgados</h1>
          <p className="mt-0.5 text-sm italic text-tinta/70">Feitos com amor, temperados com carinho!</p>
        </div>
      </section>

      {erro ? (
        <p role="alert" className="mt-6 rounded-xl bg-vermelho/10 px-3 py-3 text-sm font-medium text-vermelho-escuro">
          {AVISOS[erro]}
        </p>
      ) : (
        <Cardapio produtos={produtos} />
      )}
    </>
  );
}
