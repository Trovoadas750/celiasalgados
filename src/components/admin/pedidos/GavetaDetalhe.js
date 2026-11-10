"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useTempoReal } from "../TempoReal";
import DetalhePedido from "./DetalhePedido";

/** Pedido aberto pela URL (?pedido=42): abrir empurra no histórico (o "voltar" do celular fecha). */
export function usePedidoAberto() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { marcarAberto } = useTempoReal();
  const id = /^\d{1,12}$/.test(sp.get("pedido") ?? "") ? Number(sp.get("pedido")) : null;

  const mudar = useCallback(
    (novo, empurrar) => {
      const params = new URLSearchParams(sp.toString());
      if (novo) params.set("pedido", String(novo));
      else params.delete("pedido");
      const url = params.size ? `${pathname}?${params}` : pathname;
      if (empurrar) router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    },
    [sp, pathname, router],
  );

  useEffect(() => {
    if (id) marcarAberto(id);
  }, [id, marcarAberto]);

  return {
    id,
    abrir: useCallback((novo) => mudar(novo, !id), [mudar, id]),
    fechar: useCallback(() => mudar(null, false), [mudar]),
  };
}

/**
 * Detalhe do pedido por cima da tela (Hoje, Agenda): tela cheia no celular, gaveta à direita no
 * computador. Esc ou clique fora fecha.
 */
export default function GavetaDetalhe({ id, aoFechar, versao, agora, tempoMin, aoMudou }) {
  useEffect(() => {
    function esc(e) {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) aoFechar();
    }
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [aoFechar]);

  if (!id) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Sobreposição com preto (design-cores.md: preto só em sombras e sobreposições) */}
      <div aria-hidden="true" onClick={aoFechar} className="hidden flex-1 bg-[rgba(0,0,0,0.45)] lg:block" />
      <aside aria-label={`Detalhe do pedido nº ${id}`} className="h-full w-full overflow-y-auto bg-fundo shadow-card lg:w-[34rem]">
        <DetalhePedido key={id} id={id} versao={versao} agora={agora} tempoMin={tempoMin} aoFechar={aoFechar} aoMudou={aoMudou} />
      </aside>
    </div>
  );
}
