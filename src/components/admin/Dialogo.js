"use client";

import { useEffect, useRef, useState } from "react";
import { AlertaErro } from "@/components/cliente/Campo";
import { IconeFechar } from "@/components/icones";
import { CLASSE_BOTAO_PRINCIPAL, CLASSE_BOTAO_PERIGO_CHEIO, CLASSE_BOTAO_SECUNDARIO, CLASSE_CAMPO } from "./estilos";

/**
 * Janela modal (<dialog> nativo: foco preso, Esc fecha). `aberto` controla.
 */
export function Dialogo({ aberto, aoFechar, titulo, children, largura = "30rem" }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titulo ? "titulo-dialogo" : undefined}
      onClose={aoFechar}
      onClick={(e) => e.target === ref.current && ref.current.close()}
      style={{ width: `min(${largura}, calc(100vw - 1.5rem))` }}
      className="sheet m-auto max-h-[calc(100dvh-2rem)] rounded-3xl bg-fundo p-0 text-texto"
    >
      {aberto && (
        <div className="p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 id="titulo-dialogo" className="font-titulo text-xl text-ferrugem-hover">
              {titulo}
            </h2>
            <button
              type="button"
              onClick={() => ref.current.close()}
              aria-label="Fechar"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-superficie ring-1 ring-borda-input hover:bg-fundo"
            >
              <IconeFechar className="size-5" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

/**
 * Confirmação. `aoConfirmar` pode ser async; erros aparecem dentro da janela.
 * `exigirTexto` ("EXCLUIR"): só libera o botão depois de digitar a palavra.
 */
export function DialogoConfirmar({
  aberto,
  aoFechar,
  titulo,
  children,
  rotuloConfirmar = "Confirmar",
  perigoso = false,
  exigirTexto = null,
  aoConfirmar,
}) {
  const [digitado, setDigitado] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  function fechar() {
    setDigitado("");
    setErro(null);
    setEnviando(false);
    aoFechar();
  }

  async function confirmar(e) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      await aoConfirmar();
      fechar();
    } catch (falha) {
      setErro(falha.message);
      setEnviando(false);
    }
  }

  const liberado = !exigirTexto || digitado.trim().toUpperCase() === exigirTexto;

  return (
    <Dialogo aberto={aberto} aoFechar={fechar} titulo={titulo}>
      <form onSubmit={confirmar} className="space-y-4">
        <div className="text-[15px]">{children}</div>
        {exigirTexto && (
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">
              Para confirmar, digite <strong>{exigirTexto}</strong>
            </span>
            <input value={digitado} onChange={(e) => setDigitado(e.target.value)} autoComplete="off" className={CLASSE_CAMPO} />
          </label>
        )}
        <AlertaErro>{erro}</AlertaErro>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={fechar} className={CLASSE_BOTAO_SECUNDARIO}>
            Voltar
          </button>
          <button
            type="submit"
            disabled={!liberado || enviando}
            className={perigoso ? CLASSE_BOTAO_PERIGO_CHEIO : CLASSE_BOTAO_PRINCIPAL}
          >
            {enviando ? "Aguarde…" : rotuloConfirmar}
          </button>
        </div>
      </form>
    </Dialogo>
  );
}
