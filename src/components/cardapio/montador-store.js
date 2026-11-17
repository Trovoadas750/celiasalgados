"use client";

import { useSyncExternalStore } from "react";

// Pedido para abrir o montador de pacote. Fica fora dos componentes porque quem abre pode estar
// longe dele: o card do pacote (novo) ou a sacola (editar um pacote já adicionado).
//   { id, pacoteId, chave?, inicial?, substituir? }
//   - `chave`: editar o item da sacola com essa chave;
//   - `inicial`: { modo, sabores: [{ produtoId, nome }] } para já abrir preenchido ("Trocar para o kit");
//   - `substituir`: chave de um item da sacola que sai quando este for adicionado (troca do "à vontade" pelo kit).

let pedido = null;
let contador = 0;
const ouvintes = new Set();

function avisar() {
  ouvintes.forEach((f) => f());
}

export function abrirMontador({ pacoteId, chave = null, inicial = null, substituir = null }) {
  contador += 1;
  pedido = { id: contador, pacoteId, chave, inicial, substituir };
  avisar();
}

export function fecharMontador() {
  if (!pedido) return;
  pedido = null;
  avisar();
}

export function useMontador() {
  return useSyncExternalStore(
    (f) => {
      ouvintes.add(f);
      return () => ouvintes.delete(f);
    },
    () => pedido,
    () => null,
  );
}
