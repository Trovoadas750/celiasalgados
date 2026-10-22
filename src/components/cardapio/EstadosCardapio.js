"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { AlertaErro } from "@/components/cliente/Campo";
import { CLASSE_BOTAO_SECUNDARIO } from "@/components/cliente/estilos";

// Esqueleto mostrado enquanto o cardápio carrega.
export function CardapioCarregando() {
  return (
    <div aria-busy="true" aria-label="Carregando o cardápio" className="mt-6 space-y-3">
      <div className="h-12 animate-pulse rounded-xl bg-borda-suave" />
      <div className="h-7 w-48 animate-pulse rounded-lg bg-borda-suave" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl bg-borda-suave" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-borda-suave" />
        ))}
      </div>
    </div>
  );
}

export function CardapioErro({ mensagem }) {
  const router = useRouter();
  const [tentando, iniciar] = useTransition();

  return (
    <div className="mt-6 space-y-3">
      <AlertaErro>{mensagem}</AlertaErro>
      <button
        type="button"
        disabled={tentando}
        onClick={() => iniciar(() => router.refresh())}
        className={`${CLASSE_BOTAO_SECUNDARIO} mx-auto max-w-56`}
      >
        {tentando ? "Tentando…" : "Tentar de novo"}
      </button>
    </div>
  );
}
