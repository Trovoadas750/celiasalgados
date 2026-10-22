"use client";

import { useState } from "react";
import { useCliente } from "./ClienteProvider";
import FormCadastro from "./FormCadastro";
import FormLogin from "./FormLogin";

// Abas Entrar / Criar conta. Usado na página /entrar e dentro do checkout.
export default function AcessoConta({ modoInicial = "entrar", aoConcluir }) {
  const [modo, setModo] = useState(modoInicial);
  const { convidado } = useCliente();

  return (
    <div>
      <div role="tablist" className="mb-4 grid grid-cols-2 rounded-xl bg-fundo p-1 ring-1 ring-borda-suave">
        {[
          ["entrar", "Entrar"],
          ["cadastro", "Criar conta"],
        ].map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={modo === id}
            onClick={() => setModo(id)}
            className={`h-10 rounded-lg text-sm font-bold transition ${
              modo === id ? "bg-superficie text-ferrugem shadow-sm ring-1 ring-borda-input" : "text-texto-suave hover:text-texto"
            }`}
          >
            {rotulo}
          </button>
        ))}
      </div>
      {modo === "entrar" ? (
        <FormLogin aoEntrar={aoConcluir} />
      ) : (
        <FormCadastro inicial={convidado} aoCadastrar={aoConcluir} />
      )}
    </div>
  );
}
