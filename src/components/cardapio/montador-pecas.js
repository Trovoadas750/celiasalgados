"use client";

import { useId } from "react";
import { IconeAlerta, IconeCheck } from "@/components/icones";

// Peças visuais da montagem (kits e "Monte do seu jeito"): as duas telas ficam iguais.

export const MODOS = [
  { id: "congelado", titulo: "Congelado", detalhe: "Você frita em casa" },
  { id: "pronto", titulo: "Pronto para comer", detalhe: null },
];
export const NOME_MODO = { congelado: "congelado", pronto: "pronto para comer" };
export const GRUPOS = [
  { tipo: "frito", titulo: "Fritos" },
  { tipo: "assado", titulo: "Assados" },
  { tipo: "variado", titulo: "Variados" },
];

export function juntarNomes(nomes) {
  return nomes.length <= 1 ? nomes.join("") : `${nomes.slice(0, -1).join(", ")} e ${nomes.at(-1)}`;
}

const BADGE = "inline-flex h-7 items-center rounded-md px-2 text-sm font-bold tabular-nums";

// Cabeçalho de seção (fica grudado logo abaixo do título enquanto a seção é rolada).
// `opcional`: troca o contador e o "OBRIGATÓRIO" por um selo "OPCIONAL".
export function Secao({ titulo, subtitulo, contagem, maximo, completa, opcional = false, extra = null, children }) {
  const id = useId();
  return (
    <section aria-labelledby={id}>
      <div className="sticky top-14 z-10 border-y border-l-4 border-borda-suave border-l-vinho bg-fundo px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 id={id} className="font-bold leading-snug text-texto">
              {titulo}
            </h3>
            <p className="text-sm text-texto-suave">{subtitulo}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {!opcional && (
              <span className={`${BADGE} ${completa ? "bg-sucesso-fundo text-sucesso" : "bg-vinho text-creme"}`}>
                {contagem}/{maximo}
              </span>
            )}
            {opcional ? (
              <span className={`${BADGE} bg-superficie text-texto-suave ring-1 ring-borda-input`}>OPCIONAL</span>
            ) : completa ? (
              <span className={`${BADGE} bg-sucesso-fundo text-sucesso`}>
                <IconeCheck className="size-4" />
                <span className="sr-only">Completo</span>
              </span>
            ) : (
              <span className={`${BADGE} bg-vinho text-creme`}>OBRIGATÓRIO</span>
            )}
          </div>
        </div>
        {extra}
      </div>
      {children}
    </section>
  );
}

export function Aviso({ children }) {
  return (
    <p role="status" className="mx-4 my-3 flex items-start gap-2 rounded-xl bg-aviso-fundo px-3 py-2.5 text-sm font-medium text-aviso-texto">
      <IconeAlerta className="mt-px size-5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

// Linha de opção: texto à esquerda, radio/checkbox real (estilizado redondo) à direita, linha inteira clicável.
export function Opcao({ tipo, nome, checked, disabled, onChange, titulo, detalhe }) {
  return (
    <label
      className={`flex min-h-14 items-center justify-between gap-3 px-4 py-3 transition ${
        disabled ? "cursor-not-allowed text-desabilitado" : "cursor-pointer text-texto hover:bg-fundo"
      }`}
    >
      <span className="min-w-0">
        <span className="block font-medium leading-snug">{titulo}</span>
        {detalhe && <span className={`block text-sm ${disabled ? "" : "text-texto-suave"}`}>{detalhe}</span>}
      </span>
      <input type={tipo} name={nome} checked={checked} disabled={disabled} onChange={onChange} className="radio" />
    </label>
  );
}
