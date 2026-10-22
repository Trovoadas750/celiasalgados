"use client";

import { useSyncExternalStore } from "react";

// Pedido para abrir o montador de pacote. Fica fora dos componentes porque quem abre pode estar
// longe dele: o card do pacote (novo) ou a sacola (editar um pacote já adicionado).
//   { id, pacoteId, chave? }  -> `chave` presente = editar o item da sacola com essa chave

let pedido = null;
let contador = 0;
const ouvintes = new Set();

function avisar() {
  ouvintes.forEach((f) => f());
}

export function abrirMontador({ pacoteId, chave = null }) {
  contador += 1;
  pedido = { id: contador, pacoteId, chave };
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
