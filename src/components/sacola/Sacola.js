"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";
import { abrirMontador } from "@/components/cardapio/montador-store";
import { AlertaErro } from "@/components/cliente/Campo";
import { IconeAlerta, IconeCaixaFesta, IconeFechar, IconeGarrafa, IconeMais, IconeMenos } from "@/components/icones";
import { dividirSabores } from "@/lib/dividirSabores";
import { formatarPreco, MODO_PACOTE } from "@/lib/formatar";
import { LOJA } from "@/lib/loja";
import { alterarQuantidade, esvaziar, itensParaPedido, remover, useSacola } from "./sacola-store";
import { useCalcularPedido } from "./useCalcularPedido";

function IconeSacola({ className }) {
  return <Image src="/sacola.png" alt="" width={28} height={28} className={className} />;
}

// Valor vindo do banco; enquanto calcula (ou se deu erro), mostra um traço.
function Valor({ valor, calculando, className = "" }) {
  if (calculando) return <span className={`text-texto-suave ${className}`}>…</span>;
  if (valor === undefined || valor === null) return <span className={`text-texto-suave ${className}`}>—</span>;
  return <span className={`tabular-nums ${className}`}>{formatarPreco(valor)}</span>;
}

const LINK = "text-sm font-semibold text-link underline underline-offset-4 transition hover:text-ferrugem-ativo";

function LinhaSacola({ item, subtotal, calculando, aoEditar }) {
  const pacote = Boolean(item.modo);
  const Icone = pacote ? IconeCaixaFesta : IconeGarrafa;
  return (
    <li className="py-3">
      <div className="flex gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-superficie text-cobre">
          <Icone className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug">{item.nome}</p>
          {pacote && (
            <>
              <p className="text-sm text-texto-suave">{MODO_PACOTE[item.modo]}</p>
              <p className="text-sm text-texto-suave">
                {item.quantidade > 1 ? "Cada pacote: " : ""}
                {(item.tamanho
                  ? dividirSabores(item.tamanho, item.sabores, 1)
                  : item.sabores.map((s) => ({ ...s, quantidade: s.quantidade / item.quantidade }))
                )
                  .map((s) => `${s.quantidade} ${s.nome}`)
                  .join(" · ")}
              </p>
              {item.observacao && <p className="text-sm text-texto-suave">Obs.: {item.observacao}</p>}
            </>
          )}
          <p className="mt-0.5 text-sm font-bold text-ferrugem-hover">
            <Valor valor={subtotal} calculando={calculando} />
          </p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 pl-14">
        <div className="flex gap-4">
          {pacote && (
            <button type="button" onClick={aoEditar} className={LINK} aria-label={`Editar ${item.nome}`}>
              Editar
            </button>
          )}
          <button type="button" onClick={() => remover(item.chave)} className={LINK} aria-label={`Remover ${item.nome} da sacola`}>
            Remover
          </button>
        </div>
        <div className="flex items-center rounded-full bg-superficie ring-1 ring-borda-input">
          <button
            type="button"
            onClick={() => alterarQuantidade(item.chave, item.quantidade - 1)}
            className="grid size-9 place-items-center rounded-full text-ferrugem transition hover:bg-fundo"
            aria-label={`Diminuir quantidade de ${item.nome}`}
          >
            <IconeMenos className="size-4" />
          </button>
          <span className="min-w-7 text-center text-sm font-bold tabular-nums" aria-label={`${item.quantidade} unidades`}>
            {item.quantidade}
          </span>
          <button
            type="button"
            onClick={() => alterarQuantidade(item.chave, item.quantidade + 1)}
            className="grid size-9 place-items-center rounded-full text-ferrugem transition hover:bg-fundo"
            aria-label={`Aumentar quantidade de ${item.nome}`}
          >
            <IconeMais className="size-4" />
          </button>
        </div>
      </div>
    </li>
  );
}

export default function Sacola() {
  const { itens, quantidade } = useSacola();
  const { resumo, erro, calculando } = useCalcularPedido(itensParaPedido(itens));
  const dialogo = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const vazia = itens.length === 0;

  // No checkout a própria página mostra os itens e o total.
  if (pathname === "/checkout") return null;

  function editar(item) {
    dialogo.current.close();
    abrirMontador({ pacoteId: item.produtoId, chave: item.chave });
    if (pathname !== "/") router.push("/");
  }

  return (
    <>
      {/* Rodapé fixo da sacola */}
      <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 bg-gradient-to-t from-fundo via-fundo/90 to-transparent">
        <button
          type="button"
          onClick={() => dialogo.current?.showModal()}
          className={`mx-auto flex h-14 w-full max-w-2xl items-center gap-3 rounded-2xl px-3 text-left shadow-lg transition active:scale-[0.98] ${
            vazia ? "bg-superficie text-texto ring-1 ring-borda-suave hover:ring-borda-input" : "bg-ferrugem text-white hover:bg-ferrugem-hover"
          }`}
        >
          <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-fundo">
            <IconeSacola className="size-6 object-contain" />
            {!vazia && (
              <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-laranja px-1 text-sm font-bold leading-5 text-cafe ring-2 ring-superficie">
                {quantidade}
              </span>
            )}
          </span>
          <span className="flex-1">
            <span className="block text-[15px] font-bold uppercase tracking-wide">Sacola</span>
            <span className={`block text-sm ${vazia ? "text-texto-suave" : "text-white"}`}>
              {vazia ? "Sua sacola está vazia" : "Toque para ver os itens"}
            </span>
          </span>
          {!vazia && (
            <span className="text-base font-bold tabular-nums">
              {calculando ? "…" : resumo ? formatarPreco(resumo.total) : ""}
            </span>
          )}
        </button>
      </div>

      {/* Painel da sacola (bottom sheet) */}
      <dialog
        ref={dialogo}
        aria-label="Sacola"
        onClick={(e) => e.target === dialogo.current && dialogo.current.close()}
        className="sheet m-0 mt-auto max-h-[88dvh] w-full max-w-none rounded-t-3xl bg-fundo p-0 text-texto sm:mx-auto sm:max-w-2xl"
      >
        <div className="flex max-h-[88dvh] flex-col">
          <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-borda-suave" />
          <header className="flex items-center justify-between px-5 pb-3 pt-2">
            <h2 className="font-titulo text-2xl text-ferrugem">Sua sacola</h2>
            <button
              type="button"
              onClick={() => dialogo.current.close()}
              className="grid size-10 place-items-center rounded-full bg-superficie text-texto ring-1 ring-borda-input transition hover:bg-fundo"
              aria-label="Fechar sacola"
            >
              <IconeFechar className="size-5" />
            </button>
          </header>

          {vazia ? (
            <div className="flex flex-col items-center gap-3 px-6 pb-12 pt-6 text-center">
              <span className="grid size-20 place-items-center rounded-full bg-superficie ring-1 ring-borda-suave">
                <IconeSacola className="size-10 object-contain opacity-60" />
              </span>
              <p className="font-semibold">Sacola vazia</p>
              <p className="text-sm text-texto-suave">Monte um pacote no cardápio e ele aparece aqui.</p>
              <button
                type="button"
                onClick={() => dialogo.current.close()}
                className="mt-2 rounded-full bg-ferrugem px-6 py-3 text-sm font-semibold text-white transition hover:bg-ferrugem-hover active:bg-ferrugem-ativo"
              >
                Ver o cardápio
              </button>
            </div>
          ) : (
            <>
              <ul className="flex-1 divide-y divide-borda-suave overflow-y-auto overscroll-contain px-5">
                {itens.map((item, i) => (
                  <LinhaSacola
                    key={item.chave}
                    item={item}
                    // calcular_pedido devolve os itens na mesma ordem em que foram enviados
                    subtotal={resumo?.itens[i]?.subtotal}
                    calculando={calculando}
                    aoEditar={() => editar(item)}
                  />
                ))}
              </ul>

              <footer className="space-y-3 border-t border-borda-suave bg-superficie px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
                {erro && <AlertaErro>{erro}</AlertaErro>}
                {resumo && !resumo.entrega_permitida && (
                  <p className="flex items-start gap-2 rounded-xl bg-info-fundo px-3 py-2 text-sm font-medium text-info">
                    <IconeAlerta className="mt-px size-4 shrink-0" />
                    Pedidos acima de {resumo.limite_entrega ?? LOJA.limiteEntrega} salgados são só para retirada no local.
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-texto-suave">Subtotal</span>
                  <Valor valor={resumo?.total} calculando={calculando} className="font-semibold" />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={esvaziar}
                    className="rounded-xl px-4 text-sm font-semibold text-link ring-2 ring-link transition hover:text-ferrugem-ativo hover:ring-ferrugem-ativo"
                  >
                    Limpar
                  </button>
                  <Link
                    href="/checkout"
                    onClick={() => dialogo.current.close()}
                    className="flex h-12 flex-1 items-center justify-between rounded-xl bg-ferrugem px-4 text-sm font-bold text-white hover:bg-ferrugem-hover active:bg-ferrugem-ativo"
                  >
                    <span>Continuar pedido</span>
                    <span className="tabular-nums">{calculando ? "…" : resumo ? formatarPreco(resumo.total) : ""}</span>
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
