"use client";

import { useEffect, useState } from "react";
import { calcularPedido } from "@/lib/pedidos";

// Preço unitário que o banco já devolveu, por tipo de linha (produto + modo + qualidades de 1 pacote).
// Compartilhado entre a montagem, a sacola e o checkout: um pacote calculado na montagem
// já tem prévia na sacola. Serve SÓ para a prévia instantânea; o valor oficial é sempre o do banco.
const precosDoBanco = new Map();

// Qualidades por pacote (a quantidade de cada uma muda o preço; a de pacotes, não).
function tipoDaLinha({ produtoId, modo, sabores, quantidade }) {
  const qualidades = (sabores ?? [])
    .filter((s) => Number(s.quantidade) > 0)
    .map((s) => `${s.produtoId}:${Number(s.quantidade) / quantidade}`)
    .sort()
    .join(",");
  return `${produtoId}|${modo ?? ""}|${qualidades}`;
}

function guardarPrecos(itens, resumo) {
  itens.forEach((item, i) => {
    const preco = resumo.itens?.[i]?.preco_unitario; // o banco devolve os itens na mesma ordem
    if (typeof preco === "number") precosDoBanco.set(tipoDaLinha(item), preco);
  });
}

/**
 * Avulsos (refrigerante, adicional) têm preço fixo por unidade em `produtos.preco`, que já veio do
 * banco com o cardápio: registra para a prévia funcionar desde o primeiro clique.
 */
export function lembrarPrecosAvulsos(produtos) {
  for (const p of produtos) {
    const tipo = tipoDaLinha({ produtoId: p.id });
    if (typeof p.preco === "number" && !precosDoBanco.has(tipo)) precosDoBanco.set(tipo, p.preco);
  }
}

// Prévia = preço unitário do banco × quantidade (em centavos, sem erro de arredondamento).
// null se alguma linha ainda não tem preço conhecido (ex.: qualidades recém-escolhidas).
function calcularPrevia(itens) {
  let totalCentavos = 0;
  const linhas = [];
  for (const item of itens) {
    const preco = precosDoBanco.get(tipoDaLinha(item));
    if (preco === undefined) return null;
    const centavos = Math.round(preco * 100) * item.quantidade;
    totalCentavos += centavos;
    linhas.push({ subtotal: centavos / 100 });
  }
  return { total_itens: totalCentavos / 100, itens: linhas };
}

/**
 * Chama `calcularPedido` (RPC calcular_pedido) com debounce sempre que os itens (ou o endereço) mudam.
 * `itens = null` (ou vazio) não consulta nada. O preço oficial vem sempre daqui (do banco).
 *
 * Para a tela não "travar" a cada +/−, enquanto o banco responde há:
 *  - `previa`: { total_itens, itens: [{ subtotal }] } montada com os preços unitários que o banco já
 *    devolveu antes (null se algum item ainda não tem preço conhecido). Use só para EXIBIR valores;
 *  - `anterior`: o último resumo confirmado pelo banco (ex.: manter avisos sem piscar).
 *
 * @param {object[] | null} itens
 * @param {number} [espera]
 * @param {{ rua: string, numero: string, vila: string, chave: string } | null} [entrega]
 *   Endereço de entrega com o frete JÁ calculado pelo /api/frete: o resumo passa a incluir o frete.
 * @returns {{ resumo: object | null, erro: string | null, calculando: boolean, previa: object | null, anterior: object | null }}
 *   Enquanto calcula, `resumo` é null: regras e envio do pedido esperam o valor do banco.
 */
export function useCalcularPedido(itens, espera = 400, entrega = null) {
  const chave =
    itens && itens.length > 0
      ? JSON.stringify({ itens, entrega: entrega ? [entrega.rua, entrega.numero, entrega.vila, entrega.chave] : null })
      : null;
  const [resultado, setResultado] = useState({ chave: null, resumo: null, erro: null, anterior: null });

  useEffect(() => {
    if (!chave) return;
    let vigente = true;
    const temporizador = setTimeout(async () => {
      try {
        const { itens: lista, entrega: e } = JSON.parse(chave);
        const resumo = e ? await calcularPedido(lista, "entrega", e[0], e[1], e[2]) : await calcularPedido(lista);
        guardarPrecos(lista, resumo);
        if (vigente) setResultado({ chave, resumo, erro: null, anterior: resumo });
      } catch (e) {
        if (vigente) setResultado((atual) => ({ chave, resumo: null, erro: e.message, anterior: atual.anterior }));
      }
    }, espera);
    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [chave, espera]);

  const { anterior } = resultado;
  if (!chave) return { resumo: null, erro: null, calculando: false, previa: null, anterior };
  if (resultado.chave !== chave) return { resumo: null, erro: null, calculando: true, previa: calcularPrevia(itens), anterior };
  return { resumo: resultado.resumo, erro: resultado.erro, calculando: false, previa: null, anterior };
}
