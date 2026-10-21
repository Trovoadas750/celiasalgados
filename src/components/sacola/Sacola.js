"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { formatarPreco } from "@/lib/formatar";
import { ICONE_CATEGORIA, IconeFechar, IconeMais, IconeMenos } from "@/components/icones";
import { alterarQuantidade, esvaziar, passoDaCategoria, useSacola } from "./sacola-store";

function IconeSacola({ className }) {
  return <Image src="/sacola.png" alt="" width={28} height={28} className={className} />;
}

export default function Sacola() {
  const { itens, total, quantidade } = useSacola();
  const dialogo = useRef(null);
  const vazia = itens.length === 0;
  const pathname = usePathname();

  // No checkout a própria página mostra os itens e o total.
  if (pathname === "/checkout") return null;

  return (
    <>
      {/* Rodapé fixo da sacola */}
      <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 bg-gradient-to-t from-papel via-papel/90 to-transparent">
        <button
          type="button"
          onClick={() => dialogo.current?.showModal()}
          className={`mx-auto flex h-14 w-full max-w-2xl items-center gap-3 rounded-2xl px-3 text-left shadow-lg transition active:scale-[0.98] ${
            vazia ? "bg-cartao text-tinta ring-1 ring-borda" : "bg-vermelho text-white shadow-vermelho/30"
          }`}
        >
          <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-papel">
            <IconeSacola className="size-6 object-contain" />
            {!vazia && (
              <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-cartao px-1 text-[11px] font-bold leading-5 text-vermelho ring-2 ring-vermelho">
                {quantidade}
              </span>
            )}
          </span>
          <span className="flex-1">
            <span className="block text-[15px] font-bold uppercase tracking-wide">Sacola</span>
            <span className={`block text-xs ${vazia ? "text-tinta/70" : "text-white/90"}`}>
              {vazia ? "Sua sacola está vazia" : "Toque para ver os itens"}
            </span>
          </span>
          {!vazia && <span className="text-base font-bold tabular-nums">{formatarPreco(total)}</span>}
        </button>
      </div>

      {/* Painel da sacola (bottom sheet) */}
      <dialog
        ref={dialogo}
        aria-label="Sacola"
        onClick={(e) => e.target === dialogo.current && dialogo.current.close()}
        className="sheet m-0 mt-auto max-h-[88dvh] w-full max-w-none rounded-t-3xl bg-papel p-0 text-tinta backdrop:bg-tinta/50 sm:mx-auto sm:max-w-2xl"
      >
        <div className="flex max-h-[88dvh] flex-col">
          <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-tinta/15" />
          <header className="flex items-center justify-between px-5 pb-3 pt-2">
            <h2 className="font-titulo text-2xl text-vermelho">Sua sacola</h2>
            <button
              type="button"
              onClick={() => dialogo.current.close()}
              className="grid size-10 place-items-center rounded-full bg-cartao text-tinta ring-1 ring-borda"
              aria-label="Fechar sacola"
            >
              <IconeFechar className="size-5" />
            </button>
          </header>

          {vazia ? (
            <div className="flex flex-col items-center gap-3 px-6 pb-12 pt-6 text-center">
              <span className="grid size-20 place-items-center rounded-full bg-cartao ring-1 ring-borda">
                <IconeSacola className="size-10 object-contain opacity-60" />
              </span>
              <p className="font-semibold">Sacola vazia</p>
              <p className="text-sm text-tinta/70">Escolha seus salgados no menu e eles aparecem aqui.</p>
              <button
                type="button"
                onClick={() => dialogo.current.close()}
                className="mt-2 rounded-full bg-vermelho px-6 py-3 text-sm font-semibold text-white"
              >
                Ver o menu
              </button>
            </div>
          ) : (
            <>
              <ul className="flex-1 divide-y divide-borda overflow-y-auto overscroll-contain px-5">
                {itens.map(({ produto, quantidade: qtd }) => {
                  const Icone = ICONE_CATEGORIA[produto.categoria];
                  const passo = passoDaCategoria(produto.categoria);
                  return (
                    <li key={produto.id} className="flex items-center gap-3 py-3">
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-sepia text-vermelho">
                        <Icone className="size-6" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{produto.nome}</p>
                        <p className="text-sm font-bold text-vermelho tabular-nums">
                          {formatarPreco(produto.preco * qtd)}
                        </p>
                      </div>
                      <div className="flex items-center rounded-full bg-cartao ring-1 ring-borda">
                        <button
                          type="button"
                          onClick={() => alterarQuantidade(produto.id, qtd - passo)}
                          className="grid size-9 place-items-center text-vermelho"
                          aria-label={`Remover ${passo} ${produto.nome}`}
                        >
                          <IconeMenos className="size-4" />
                        </button>
                        <span className="min-w-7 text-center text-sm font-bold tabular-nums">{qtd}</span>
                        <button
                          type="button"
                          onClick={() => alterarQuantidade(produto.id, qtd + passo)}
                          className="grid size-9 place-items-center text-vermelho"
                          aria-label={`Adicionar ${passo} ${produto.nome}`}
                        >
                          <IconeMais className="size-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <footer className="border-t border-borda bg-cartao px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-tinta/70">Subtotal</span>
                  <span className="font-semibold tabular-nums">{formatarPreco(total)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-tinta/70">Taxa de entrega</span>
                  <span className="text-tinta/70">calculada no endereço</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={esvaziar}
                    className="rounded-xl px-4 text-sm font-semibold text-tinta/70 ring-1 ring-borda"
                  >
                    Limpar
                  </button>
                  <Link
                    href="/checkout"
                    onClick={() => dialogo.current.close()}
                    className="flex h-12 flex-1 items-center justify-between rounded-xl bg-vermelho px-4 text-sm font-bold text-white hover:bg-vermelho-escuro"
                  >
                    <span>Continuar pedido</span>
                    <span className="tabular-nums">{formatarPreco(total)}</span>
                  </Link>
                </div>
              </footer>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
