"use client";

import { useSyncExternalStore } from "react";
import { dividirSabores } from "@/lib/dividirSabores";

// Sacola guardada no navegador. NÃO guarda preço: valores vêm só do `calcularPedido` (lib/pedidos.js).
//
// Cada item:
//   pacote: { chave, produtoId, nome, quantidade, modo: "congelado" | "pronto",
//             sabores: [{ produtoId, nome, quantidade }], tamanho, observacao? }
//   avulso: { chave, produtoId, nome, categoria?, quantidade }  (refrigerante ou adicional, ex.: molho)
//
// `quantidade` = nº de pacotes (ou unidades do avulso). A `quantidade` de cada sabor é o TOTAL da linha
// (já multiplicado pelo nº de pacotes), como o banco espera. Ex.: 2 pacotes de 30 com
// 15 coxinhas + 15 kibes em cada = sabores [{ coxinha, 30 }, { kibe, 30 }].
// `chave` é só um id local para editar/remover a linha; não vai para o banco.
// `tamanho` (salgados do pacote) serve para redividir os sabores ao mudar o nº de pacotes.
// `observacao` do pacote não vai no item: o checkout junta todas em p_observacao.

const CHAVE = "celiasalgados:sacola:v3"; // v2 guardava produtos avulsos com preço
const VAZIA = [];
const LIMITE_LINHAS = 30; // criar_pedido aceita de 1 a 30 linhas
const ouvintes = new Set();
let itens = null;

function carregar() {
  if (itens !== null) return itens;
  try {
    const salvo = JSON.parse(window.localStorage.getItem(CHAVE));
    itens = Array.isArray(salvo) ? salvo : VAZIA;
  } catch {
    itens = VAZIA;
  }
  return itens;
}

function salvar(novos) {
  itens = novos;
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(novos));
  } catch {
    // Sem armazenamento (aba anônima etc.): a sacola continua funcionando em memória.
  }
  ouvintes.forEach((avisar) => avisar());
}

function assinar(avisar) {
  ouvintes.add(avisar);
  return () => ouvintes.delete(avisar);
}

function novaChave() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

// Só o que o banco recebe (sem chave, tamanho e observação).
function paraPedido({ produtoId, nome, quantidade, modo, sabores }) {
  return { produtoId, nome, quantidade, ...(modo ? { modo, sabores } : {}) };
}

// O que fica guardado na sacola.
function paraGuardar({ produtoId, nome, quantidade, modo, sabores, tamanho, observacao }) {
  if (!modo) return { produtoId, nome, quantidade };
  const obs = (observacao ?? "").trim();
  return { produtoId, nome, quantidade, modo, sabores, tamanho, ...(obs ? { observacao: obs } : {}) };
}

/** Itens no formato do front aceito por calcularPedido/criarPedido (sem os campos locais). */
export function itensParaPedido(lista) {
  return lista.map(paraPedido);
}

// Soma unidades de um avulso (o mesmo produto fica numa linha só).
function somarAvulso(lista, { id, nome, categoria }, quantidade) {
  const existente = lista.find((i) => !i.modo && i.produtoId === id);
  if (existente) return lista.map((i) => (i === existente ? { ...i, quantidade: i.quantidade + quantidade } : i));
  return [...lista, { chave: novaChave(), produtoId: id, nome, categoria, quantidade }];
}

/**
 * Adiciona um pacote montado e, junto, os adicionais escolhidos na montagem
 * (`avulsos`: [{ produto, quantidade }]). Retorna false (sem mudar nada) se passar do máximo de linhas.
 */
export function adicionarPacote(pacote, avulsos = []) {
  let nova = [...carregar(), { ...paraGuardar(pacote), chave: novaChave() }];
  for (const { produto, quantidade } of avulsos) nova = somarAvulso(nova, produto, quantidade);
  if (nova.length > LIMITE_LINHAS) return false;
  salvar(nova);
  return true;
}

/** Substitui um pacote já adicionado (edição). */
export function atualizarPacote(chave, pacote) {
  salvar(carregar().map((i) => (i.chave === chave ? { ...paraGuardar(pacote), chave } : i)));
}

/** Soma 1 garrafa (a mesma bebida fica numa linha só). Retorna false se a sacola já está cheia. */
export function adicionarBebida(bebida) {
  const nova = somarAvulso(carregar(), bebida, 1);
  if (nova.length > LIMITE_LINHAS) return false;
  salvar(nova);
  return true;
}

/**
 * Muda o nº de pacotes/garrafas de uma linha. Num pacote, os sabores são redivididos pela regra
 * fixa (lib/dividirSabores.js) para a nova quantidade. 0 remove a linha.
 */
export function alterarQuantidade(chave, quantidade) {
  if (quantidade <= 0) return remover(chave);
  salvar(
    carregar().map((i) => {
      if (i.chave !== chave) return i;
      if (!i.modo) return { ...i, quantidade };
      const sabores = i.tamanho
        ? dividirSabores(i.tamanho, i.sabores, quantidade)
        : i.sabores.map((s) => ({ ...s, quantidade: (s.quantidade / i.quantidade) * quantidade })); // itens antigos
      return { ...i, quantidade, sabores };
    }),
  );
}

export function remover(chave) {
  salvar(carregar().filter((i) => i.chave !== chave));
}

export function esvaziar() {
  salvar(VAZIA);
}

export function useSacola() {
  const lista = useSyncExternalStore(assinar, carregar, () => VAZIA);
  const quantidade = lista.reduce((soma, i) => soma + i.quantidade, 0);
  return { itens: lista, quantidade };
}

export const LIMITE_OBSERVACAO = 500;

/**
 * Junta as observações dos pacotes e a observação geral num texto só (o banco tem uma
 * observação por pedido): uma linha por pacote, "Cento (100 salgados): <texto>", e a geral no fim.
 */
export function juntarObservacoes(lista, observacaoGeral = "") {
  const linhas = lista.filter((i) => i.modo && i.observacao).map((i) => `${i.nome}: ${i.observacao}`);
  const geral = observacaoGeral.trim();
  if (geral) linhas.push(geral);
  return linhas.join("\n");
}
