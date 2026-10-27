"use client";

import { useState } from "react";
import { IconeMais } from "@/components/icones";
import { adicionarBebida, useSacola } from "@/components/sacola/sacola-store";
import { lembrarPrecosAvulsos } from "@/components/sacola/useCalcularPedido";

// Botão de destaque (laranja + texto café). Mostra quantas já estão na sacola.
export default function AdicionarBebida({ bebida }) {
  lembrarPrecosAvulsos([bebida]); // a sacola já mostra o valor da bebida na hora
  const { itens } = useSacola();
  const [cheia, setCheia] = useState(false);
  const naSacola = itens.find((i) => !i.modo && i.produtoId === bebida.id)?.quantidade ?? 0;

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setCheia(!adicionarBebida(bebida))}
        aria-label={`Adicionar 1 ${bebida.nome} à sacola`}
        className="flex h-10 items-center gap-1 rounded-full bg-laranja px-3.5 text-sm font-bold text-cafe transition hover:bg-laranja-hover active:scale-95"
      >
        <IconeMais className="size-4" />
        Adicionar
      </button>
      <span className="text-sm font-medium text-texto-suave tabular-nums" aria-live="polite">
        {cheia ? "Sacola cheia (30 itens)" : naSacola > 0 ? `${naSacola} na sacola` : ""}
      </span>
    </div>
  );
}
