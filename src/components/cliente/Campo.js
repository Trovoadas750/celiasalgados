"use client";

import { useId } from "react";

// Campo de formulário no padrão do IDENTIDADE.md. Aceita `textarea` para textos longos.
export default function Campo({ rotulo, erro, dica, opcional, textarea, className = "", ...props }) {
  const id = useId();
  const idAjuda = `${id}-ajuda`;
  const Elemento = textarea ? "textarea" : "input";

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {rotulo}
        {opcional && <span className="font-normal text-tinta/70"> (opcional)</span>}
      </label>
      <Elemento
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro || dica ? idAjuda : undefined}
        className={`w-full rounded-xl bg-cartao px-3 text-[16px] outline-none ring-1 transition placeholder:text-tinta/55 focus:ring-2 disabled:opacity-60 ${
          textarea ? "min-h-24 py-2.5" : "h-12"
        } ${erro ? "ring-2 ring-vermelho focus:ring-vermelho" : "ring-borda focus:ring-vermelho/50"}`}
        {...props}
      />
      {(erro || dica) && (
        <p id={idAjuda} className={`mt-1 text-[13px] ${erro ? "font-medium text-vermelho-escuro" : "text-tinta/70"}`}>
          {erro || dica}
        </p>
      )}
    </div>
  );
}

export function AlertaErro({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-xl bg-vermelho/10 px-3 py-2.5 text-sm font-medium text-vermelho-escuro">
      {children}
    </p>
  );
}
