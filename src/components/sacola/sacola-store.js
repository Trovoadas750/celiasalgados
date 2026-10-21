"use client";

import { useSyncExternalStore } from "react";

// Sacola guardada no navegador. Cada item: { produto, quantidade }.
// O preço salvo aqui é só para exibir; o banco recalcula tudo em `criar_pedido`.

const CHAVE = "celiasalgados:sacola:v2"; // v1 guardava produtos de exemplo (mock)
const VAZIA = [];
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

export function adicionar(produto, quantidade = 1) {
  const atual = carregar();
  const existente = atual.find((i) => i.produto.id === produto.id);
  salvar(
    existente
      ? atual.map((i) => (i === existente ? { ...i, quantidade: i.quantidade + quantidade } : i))
      : [...atual, { produto, quantidade }],
  );
}

export function alterarQuantidade(produtoId, quantidade) {
  const atual = carregar();
  salvar(
    quantidade <= 0
      ? atual.filter((i) => i.produto.id !== produtoId)
      : atual.map((i) => (i.produto.id === produtoId ? { ...i, quantidade } : i)),
  );
}

export function esvaziar() {
  salvar(VAZIA);
}

export function useSacola() {
  const lista = useSyncExternalStore(assinar, carregar, () => VAZIA);
  const total = lista.reduce((soma, i) => soma + i.produto.preco * i.quantidade, 0);
  const quantidade = lista.reduce((soma, i) => soma + i.quantidade, 0);
  return { itens: lista, total, quantidade };
}

// Salgados são vendidos por unidade, mas ninguém pede 1 só: o botão soma de 10 em 10.
export function passoDaCategoria(categoria) {
  return categoria === "salgado" ? 10 : 1;
}
