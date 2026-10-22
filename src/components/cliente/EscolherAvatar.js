"use client";

import Image from "next/image";
import { useState } from "react";
import { AlertaErro } from "@/components/cliente/Campo";
import { IconeCheck } from "@/components/icones";
import { AVATARES, caminhoDoAvatar } from "@/lib/avatar";

/**
 * Grade com os 10 avatares (rádios). Ao clicar, já salva (trocarAvatar do ClienteProvider).
 * Selecionado: anel ferrugem + ✓ (a seleção não depende só da cor).
 */
export default function EscolherAvatar({ atual, trocarAvatar, aoFechar }) {
  const [salvando, setSalvando] = useState(null); // número sendo salvo
  const [erro, setErro] = useState(null);
  const [aviso, setAviso] = useState(null);

  async function escolher(numero) {
    if (numero === atual || salvando) return;
    setSalvando(numero);
    setErro(null);
    setAviso(null);
    const { erro: falha } = await trocarAvatar(numero);
    setSalvando(null);
    if (falha) setErro(falha);
    else setAviso("Avatar atualizado.");
  }

  return (
    <div className="space-y-3 border-t border-borda-suave p-4">
      <fieldset>
        <legend className="mb-3 font-semibold text-texto">Escolha seu avatar</legend>
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {AVATARES.map((numero) => {
            const marcado = numero === atual;
            return (
              <label
                key={numero}
                className={`relative block cursor-pointer rounded-full transition ${
                  marcado ? "ring-4 ring-ferrugem" : "ring-1 ring-borda-suave hover:ring-2 hover:ring-borda-input"
                } ${salvando === numero ? "animate-pulse" : ""}`}
              >
                <input
                  type="radio"
                  name="avatar"
                  value={numero}
                  checked={marcado}
                  onChange={() => escolher(numero)}
                  disabled={Boolean(salvando)}
                  className="sr-only"
                />
                <Image
                  src={caminhoDoAvatar(numero)}
                  alt={`Avatar ${numero}`}
                  width={64}
                  height={64}
                  unoptimized
                  className="aspect-square h-auto w-full rounded-full"
                />
                {marcado && (
                  <span className="absolute -right-0.5 -top-0.5 grid size-6 place-items-center rounded-full bg-ferrugem text-white ring-2 ring-superficie">
                    <IconeCheck className="size-4" />
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      <AlertaErro>{erro}</AlertaErro>
      {aviso && (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-sucesso-fundo px-3 py-2.5 text-sm font-medium text-sucesso">
          <IconeCheck className="size-5 shrink-0" />
          {aviso}
        </p>
      )}

      <button
        type="button"
        onClick={aoFechar}
        className="text-sm font-semibold text-link underline underline-offset-4 hover:text-ferrugem-ativo"
      >
        Fechar
      </button>
    </div>
  );
}
