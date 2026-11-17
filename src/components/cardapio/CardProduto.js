"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { IconeCaixaFesta } from "@/components/icones";
import { formatarPreco } from "@/lib/formatar";
import { dividirLivre } from "@/lib/livre";
import { calcularPedido } from "@/lib/pedidos";
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

function Textos({ titulo, subtitulo, descricao, preco }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col self-stretch">
      <h3 className="line-clamp-3 text-[17px] font-bold leading-snug text-texto">{titulo}</h3>
      {subtitulo && <p className="mt-0.5 text-[15px] font-semibold leading-snug text-cobre-esc">{subtitulo}</p>}
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

/**
 * "A partir de" do "Monte do seu jeito": preço do banco para o PEDIDO MÍNIMO (quantidade mínima
 * dividida entre o mínimo de qualidades fritas, congelado). Calcula uma vez; se falhar, não mostra.
 */
function usePrecoMinimoLivre(livre, fritos) {
  const [preco, setPreco] = useState(null);
  useEffect(() => {
    const { regras } = livre;
    const escolhidos = fritos.filter((s) => s.vende_congelado).slice(0, regras.minimo_qualidades);
    const partes = dividirLivre(regras.quantidade_minima, regras.minimo_qualidades, regras);
    if (!partes || escolhidos.length < regras.minimo_qualidades) return;
    let ativo = true;
    calcularPedido([
      {
        produtoId: livre.id,
        quantidade: 1,
        modo: "congelado",
        sabores: escolhidos.map((s, i) => ({ produtoId: s.id, quantidade: partes[i] })),
      },
    ])
      .then((resumo) => ativo && setPreco(resumo.total_itens))
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [livre, fritos]);
  return preco;
}

/** Card "Monte do seu jeito": abre a montagem livre (quantidade e qualidades à vontade). */
export function CardLivre({ livre, fritos }) {
  const precoMinimo = usePrecoMinimoLivre(livre, fritos);
  return (
    <button
      type="button"
      onClick={() => abrirMontador({ pacoteId: livre.id })}
      aria-label={`Montar ${livre.nome}${precoMinimo != null ? `, a partir de ${formatarPreco(precoMinimo)}` : ""}`}
      className="flex w-full items-start gap-4 bg-superficie p-5 text-left transition hover:bg-fundo hover:shadow-[inset_3px_0_0_var(--vinho)]"
    >
      <Textos
        titulo={livre.nome}
        subtitulo="Escolha a quantidade e as qualidades que quiser"
        descricao={comQualidades(livre.descricao)}
        preco={
          precoMinimo != null ? (
            <>
              A partir de <span className="font-semibold tabular-nums">{formatarPreco(precoMinimo)}</span>
            </>
          ) : null
        }
      />
      <ImagemCard produto={livre} />
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
