"use client";

import { useEffect, useRef, useState } from "react";
import { CLASSE_BOTAO_PRINCIPAL } from "@/components/cliente/estilos";
import { IconeFechar, IconeWhatsappOficial } from "@/components/icones";
import { formatarPreco } from "@/lib/formatar";
import { iniciarPagamento } from "@/lib/pagamento";

/**
 * Modal "Pagamento" do botão "Pagar agora".
 * Hoje: valor, nº do pedido e o WhatsApp da loja. O caminho do pagamento vem de
 * iniciarPagamento (lib/pagamento.js), onde o provedor online vai ser plugado.
 *
 * @param {{ pedido: { numero: number, total: number } | null, aoFechar: () => void }} props
 */
export default function ModalPagamento({ pedido, aoFechar }) {
  const dialogo = useRef(null);
  const [caminho, setCaminho] = useState(null); // retorno de iniciarPagamento, do pedido atual

  useEffect(() => {
    const d = dialogo.current;
    if (pedido && !d.open) d.showModal();
    if (!pedido && d.open) d.close();
  }, [pedido]);

  useEffect(() => {
    if (!pedido) return;
    let ativo = true;
    iniciarPagamento(pedido).then((r) => ativo && setCaminho({ ...r, numero: pedido.numero }));
    return () => {
      ativo = false;
    };
  }, [pedido]);

  const atual = caminho?.numero === pedido?.numero ? caminho : null;

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="titulo-pagamento"
      onClose={aoFechar}
      onClick={(e) => e.target === dialogo.current && dialogo.current.close()}
      className="sheet m-auto w-[min(26rem,calc(100vw-2rem))] rounded-3xl bg-fundo p-0 text-texto"
    >
      {pedido && (
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 id="titulo-pagamento" className="traco-vinho font-titulo text-2xl text-ferrugem">
              Pagamento
            </h2>
            <button
              type="button"
              onClick={() => dialogo.current.close()}
              aria-label="Fechar"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-superficie text-texto ring-1 ring-borda-input transition hover:bg-fundo"
            >
              <IconeFechar className="size-5" />
            </button>
          </div>

          <dl className="mt-4 divide-y divide-borda-suave rounded-2xl bg-superficie text-sm ring-1 ring-borda-suave">
            <div className="flex justify-between gap-3 px-4 py-3">
              <dt className="text-texto-suave">Pedido</dt>
              <dd className="font-semibold tabular-nums">nº {pedido.numero}</dd>
            </div>
            <div className="flex justify-between gap-3 px-4 py-3">
              <dt className="text-texto-suave">Valor</dt>
              <dd className="text-lg font-bold text-ferrugem tabular-nums">{formatarPreco(pedido.total)}</dd>
            </div>
          </dl>

          <p className="mt-4 text-[15px]">Em breve pagamento online. Por enquanto, pague pelo WhatsApp:</p>

          {atual?.tipo === "whatsapp" ? (
            <a href={atual.link} target="_blank" rel="noopener noreferrer" className={`${CLASSE_BOTAO_PRINCIPAL} mt-3`}>
              <IconeWhatsappOficial className="size-5" />
              Pagar pelo WhatsApp
            </a>
          ) : (
            <div className="mt-3 h-12 animate-pulse rounded-xl bg-borda-suave" aria-busy="true" />
          )}
        </div>
      )}
    </dialog>
  );
}
