"use client";

import { useEffect, useState } from "react";
import { calcularPedido } from "@/lib/pedidos";

/**
 * Chama `calcularPedido` (RPC calcular_pedido) com debounce sempre que os itens (ou o endereço) mudam.
 * `itens = null` (ou vazio) não consulta nada. O front nunca calcula preço: tudo vem daqui.
 *
 * @param {object[] | null} itens
 * @param {number} [espera]
 * @param {{ rua: string, numero: string, vila: string, chave: string } | null} [entrega]
 *   Endereço de entrega com o frete JÁ calculado pelo /api/frete: o resumo passa a incluir o frete.
 * @returns {{ resumo: object | null, erro: string | null, calculando: boolean }}
 *   Enquanto calcula, `resumo` é null (não mostramos um valor que pode estar desatualizado).
 */
export function useCalcularPedido(itens, espera = 400, entrega = null) {
  const chave =
    itens && itens.length > 0
      ? JSON.stringify({ itens, entrega: entrega ? [entrega.rua, entrega.numero, entrega.vila, entrega.chave] : null })
      : null;
  const [resultado, setResultado] = useState({ chave: null, resumo: null, erro: null });

  useEffect(() => {
    if (!chave) return;
    let vigente = true;
    const temporizador = setTimeout(async () => {
      try {
        const { itens: lista, entrega: e } = JSON.parse(chave);
        const resumo = e ? await calcularPedido(lista, "entrega", e[0], e[1], e[2]) : await calcularPedido(lista);
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
