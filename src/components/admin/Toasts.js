"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { IconeAlerta, IconeCheck, IconeFechar } from "@/components/icones";
import { IconeSino } from "./icones";

const ToastContext = createContext(null);

const ESTILOS = {
  sucesso: { classe: "bg-sucesso-fundo text-sucesso", Icone: IconeCheck },
  erro: { classe: "bg-erro-fundo text-erro", Icone: IconeAlerta },
  aviso: { classe: "bg-aviso-fundo text-aviso-texto", Icone: IconeAlerta },
  novo: { classe: "bg-superficie text-texto ring-2 ring-vinho", Icone: IconeSino },
};

/**
 * Avisos rápidos no canto da tela (região aria-live: o leitor de tela anuncia).
 * mostrar({ texto, tipo: "sucesso" | "erro" | "aviso" | "novo", duracao, acoes: [{ rotulo, onClick } | { rotulo, href }] })
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const proximo = useRef(1);

  const fechar = useCallback((id) => setToasts((lista) => lista.filter((t) => t.id !== id)), []);

  const mostrar = useCallback(
    ({ texto, tipo = "sucesso", duracao = 5000, acoes = [] }) => {
      const id = proximo.current++;
      setToasts((lista) => [...lista.slice(-3), { id, texto, tipo, acoes }]);
      if (duracao) setTimeout(() => fechar(id), duracao);
      return id;
    },
    [fechar],
  );

  const valor = useMemo(() => ({ mostrar, fechar }), [mostrar, fechar]);

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-3 print:!hidden bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-stretch gap-2 lg:inset-x-auto lg:bottom-4 lg:right-4 lg:w-[26rem]"
      >
        {toasts.map((t) => {
          const { classe, Icone } = ESTILOS[t.tipo] ?? ESTILOS.sucesso;
          return (
            <div
              key={t.id}
              role={t.tipo === "erro" ? "alert" : "status"}
              className={`pointer-events-auto flex items-start gap-2 rounded-xl px-3 py-2.5 text-[15px] font-semibold shadow-card ring-1 ring-borda-suave ${classe}`}
            >
              <Icone className="mt-0.5 size-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p>{t.texto}</p>
                {t.acoes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {t.acoes.map((a) =>
                      a.href ? (
                        <a
                          key={a.rotulo}
                          href={a.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => fechar(t.id)}
                          className="inline-flex min-h-10 items-center rounded-lg bg-ferrugem px-3 text-sm font-bold text-white hover:bg-ferrugem-hover"
                        >
                          {a.rotulo}
                        </a>
                      ) : (
                        <button
                          key={a.rotulo}
                          type="button"
                          onClick={() => {
                            fechar(t.id);
                            a.onClick();
                          }}
                          className="inline-flex min-h-10 items-center rounded-lg bg-superficie px-3 text-sm font-bold text-link ring-2 ring-link hover:text-ferrugem-ativo"
                        >
                          {a.rotulo}
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fechar(t.id)}
                aria-label="Fechar aviso"
                className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-superficie"
              >
                <IconeFechar className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const contexto = useContext(ToastContext);
  if (!contexto) throw new Error("useToast precisa estar dentro de <ToastProvider>.");
  return contexto;
}
