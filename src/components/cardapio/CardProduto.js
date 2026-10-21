"use client";

import Image from "next/image";
import { formatarPreco } from "@/lib/formatar";
import { ICONE_CATEGORIA, IconeMais } from "@/components/icones";
import { adicionar, passoDaCategoria, useSacola } from "@/components/sacola/sacola-store";

function DetalhesKit({ produto }) {
  const { salgados_a_escolher, max_sabores, componentes } = produto;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {salgados_a_escolher > 0 && (
        <span className="rounded-md bg-vermelho/10 px-1.5 py-0.5 text-[11px] font-semibold text-vermelho-escuro">
          {salgados_a_escolher} salgados
          {max_sabores ? ` · até ${max_sabores} sabores` : ""}
        </span>
      )}
      {componentes.map(({ quantidade, produto: p }) => (
        <span key={p.id} className="rounded-md bg-sepia/70 px-1.5 py-0.5 text-[11px] font-medium text-tinta">
          {quantidade}x {p.nome}
        </span>
      ))}
    </div>
  );
}

export default function CardProduto({ produto }) {
  const { itens } = useSacola();
  const naSacola = itens.find((i) => i.produto.id === produto.id)?.quantidade ?? 0;
  const passo = passoDaCategoria(produto.categoria);
  const Icone = ICONE_CATEGORIA[produto.categoria];
  const porUnidade = produto.categoria === "salgado";

  return (
    <article className="flex gap-3 rounded-2xl bg-cartao p-3 shadow-[0_1px_2px_rgb(43_29_20/0.06)] ring-1 ring-borda">
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-semibold leading-snug">{produto.nome}</h3>
        {produto.descricao && (
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-tinta/70">{produto.descricao}</p>
        )}
        {produto.categoria === "kit" && <DetalhesKit produto={produto} />}
        <p className="mt-auto pt-2 text-[15px] font-bold text-vermelho tabular-nums">
          {formatarPreco(produto.preco)}
          {porUnidade && <span className="text-xs font-medium text-tinta/70"> / unidade</span>}
        </p>
      </div>

      <div className="relative shrink-0">
        <div className="grid size-24 place-items-center overflow-hidden rounded-xl bg-sepia text-vermelho">
          {produto.imagem_url ? (
            <Image src={produto.imagem_url} alt={produto.nome} width={96} height={96} className="size-full object-cover" />
          ) : (
            <Icone className="size-10" />
          )}
        </div>
        {naSacola > 0 && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-vermelho px-1.5 text-[11px] font-bold leading-5 text-white tabular-nums">
            {naSacola}
          </span>
        )}
        <button
          type="button"
          onClick={() => adicionar(produto, passo)}
          aria-label={`Adicionar ${passo} ${produto.nome} à sacola`}
          className="absolute -bottom-1.5 -right-1.5 flex h-9 min-w-9 items-center justify-center gap-0.5 rounded-full bg-vermelho px-2 text-sm font-bold text-white shadow-md ring-[3px] ring-cartao transition hover:bg-vermelho-escuro active:scale-90"
        >
          <IconeMais className="size-4" />
          {passo > 1 && <span className="pr-0.5 tabular-nums">{passo}</span>}
        </button>
      </div>
    </article>
  );
}
