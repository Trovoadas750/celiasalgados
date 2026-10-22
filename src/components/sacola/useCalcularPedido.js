"use client";

import { useEffect, useState } from "react";
import { calcularPedido } from "@/lib/pedidos";

/**
 * Chama `calcularPedido` (RPC calcular_pedido) com debounce sempre que os itens mudam.
 * `itens = null` (ou vazio) não consulta nada. O front nunca calcula preço: tudo vem daqui.
 *
 * @returns {{ resumo: object | null, erro: string | null, calculando: boolean }}
 *   Enquanto calcula, `resumo` é null (não mostramos um valor que pode estar desatualizado).
 */
export function useCalcularPedido(itens, espera = 400) {
  const chave = itens && itens.length > 0 ? JSON.stringify(itens) : null;
  const [resultado, setResultado] = useState({ chave: null, resumo: null, erro: null });

  useEffect(() => {
    if (!chave) return;
    let vigente = true;
    const temporizador = setTimeout(async () => {
      try {
        const resumo = await calcularPedido(JSON.parse(chave));
        if (vigente) setResultado({ chave, resumo, erro: null });
      } catch (e) {
        if (vigente) setResultado({ chave, resumo: null, erro: e.message });
      }
    }, espera);
    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [chave, espera]);

  if (!chave) return { resumo: null, erro: null, calculando: false };
  if (resultado.chave !== chave) return { resumo: null, erro: null, calculando: true };
  return { resumo: resultado.resumo, erro: resultado.erro, calculando: false };
}
