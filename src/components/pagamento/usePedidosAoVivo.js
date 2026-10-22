"use client";

import { useEffect, useRef } from "react";
import { getSupabase, supabaseConfigurado } from "@/lib/supabase";

let contador = 0;

/**
 * Escuta mudanças em `pedidos` em tempo real (banco-de-dados.md, seção 7).
 * O RLS já filtra: o cliente logado só recebe os próprios pedidos.
 *
 * @param {boolean} ligado          false = não assina (ex.: visitante)
 * @param {(pedido: object, evento: "INSERT" | "UPDATE" | "DELETE") => void} aoMudar  recebe a linha nova
 */
export function usePedidosAoVivo(ligado, aoMudar) {
  const callback = useRef(aoMudar);
  useEffect(() => {
    callback.current = aoMudar;
  });

  useEffect(() => {
    if (!ligado || !supabaseConfigurado) return;
    const supabase = getSupabase();
    // Nome único: vários componentes podem escutar ao mesmo tempo.
    const canal = supabase
      .channel(`pedidos-cliente-${++contador}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, (payload) => {
        callback.current(payload.new ?? {}, payload.eventType);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [ligado]);
}
