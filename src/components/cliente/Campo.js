"use client";

import { useId } from "react";
import { IconeAlerta } from "@/components/icones";

// Campo de formulário (receita "Campo de formulário" do paletas.md). Aceita `textarea` para textos longos.
export default function Campo({ rotulo, erro, dica, opcional, textarea, className = "", ...props }) {
  const id = useId();
  const idAjuda = `${id}-ajuda`;
  const Elemento = textarea ? "textarea" : "input";

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-texto">
        {rotulo}
        {opcional && <span className="font-normal text-texto-suave"> (opcional)</span>}
      </label>
      {/* Foco: anel global de :focus-visible (globals.css) */}
      <Elemento
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro || dica ? idAjuda : undefined}
        className={`w-full rounded-xl bg-superficie px-3 text-[16px] text-texto transition placeholder:text-texto-suave disabled:cursor-not-allowed disabled:text-desabilitado disabled:ring-1 disabled:ring-borda-suave ${
          textarea ? "min-h-24 py-2.5" : "h-12"
        } ${erro ? "ring-2 ring-erro" : "ring-1 ring-borda-input"}`}
        {...props}
      />
      {erro ? (
        <MensagemErro id={idAjuda}>{erro}</MensagemErro>
      ) : (
        dica && (
          <p id={idAjuda} className="mt-1 text-sm text-texto-suave">
            {dica}
          </p>
        )
      )}
    </div>
  );
}

// Erro de um campo: ícone + texto em --erro (nunca só a cor).
export function MensagemErro({ id, children }) {
  return (
    <p id={id} className="mt-1 flex items-start gap-1.5 text-sm font-medium text-erro">
      <IconeAlerta className="mt-px size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

// Erro geral (falha ao enviar, login inválido...): fundo --erro-fundo, ícone + texto.
export function AlertaErro({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-xl bg-erro-fundo px-3 py-2.5 text-sm font-medium text-erro">
      <IconeAlerta className="mt-px size-5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
