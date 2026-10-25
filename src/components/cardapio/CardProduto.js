"use client";

import Image from "next/image";
import { IconeCaixaFesta } from "@/components/icones";
import { formatarPreco } from "@/lib/formatar";
import { imagemDoProduto } from "@/lib/imagens";
import { comQualidades } from "@/lib/qualidades";
import AdicionarBebida from "./AdicionarBebida";
import { abrirMontador } from "./montador-store";

// Imagem 4:3 do card (≈110×82 no celular, ≈140×105 no desktop). Sem foto: placeholder do mesmo tamanho.
function ImagemCard({ produto }) {
  const imagem = imagemDoProduto(produto);
  return (
    <div className="relative h-[82px] w-[110px] shrink-0 overflow-hidden rounded-lg bg-fundo sm:h-[105px] sm:w-[140px]">
      {imagem ? (
        <Image src={imagem} alt={produto.nome} fill sizes="(min-width: 640px) 140px, 110px" className="object-cover" />
      ) : (
        <div aria-hidden="true" className="grid size-full place-items-center text-cobre">
          <IconeCaixaFesta className="size-9" />
        </div>
      )}
    </div>
  );
}

function Textos({ titulo, descricao, preco }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col self-stretch">
      <h3 className="line-clamp-3 text-[17px] font-bold leading-snug text-texto">{titulo}</h3>
      {descricao && <p className="mt-1 line-clamp-2 text-[15px] leading-snug text-texto-suave">{descricao}</p>}
      <p className="mt-auto pt-3 text-[15px] text-texto">{preco}</p>
    </div>
  );
}

/** Card de pacote: o card inteiro é um botão que abre a montagem. */
export function CardPacote({ pacote }) {
  return (
    <button
      type="button"
      onClick={() => abrirMontador({ pacoteId: pacote.id })}
      aria-label={`Montar ${pacote.nome}, a partir de ${formatarPreco(pacote.preco)}`}
      className="flex w-full items-start gap-4 bg-superficie p-5 text-left transition hover:bg-fundo hover:shadow-[inset_3px_0_0_var(--vinho)]"
    >
      <Textos
        titulo={pacote.nome}
        descricao={comQualidades(pacote.descricao) || (pacote.max_sabores ? `Escolha até ${pacote.max_sabores} qualidades` : null)}
        preco={
          <>
            A partir de <span className="font-semibold tabular-nums">{formatarPreco(pacote.preco)}</span>
          </>
        }
      />
      <ImagemCard produto={pacote} />
    </button>
  );
}

/** Card de refrigerante: sem coluna de imagem, com botão "Adicionar" direto. */
export function CardBebida({ bebida }) {
  return (
    <div className="flex w-full items-start gap-4 bg-superficie p-5">
      <Textos
        titulo={bebida.nome}
        descricao={bebida.descricao}
        preco={
          <>
            <span className="font-semibold tabular-nums">{formatarPreco(bebida.preco)}</span> / unidade
          </>
        }
      />
      <AdicionarBebida bebida={bebida} />
    </div>
  );
}
