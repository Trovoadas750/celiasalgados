"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertaErro } from "@/components/cliente/Campo";
import { tempoPreparoMin } from "@/lib/admin/config";
import { buscarParaImpressao } from "@/lib/admin/pedidos";
import Comanda from "./Comanda";
import { CLASSE_BOTAO_PRINCIPAL } from "./estilos";
import { IconeImpressora } from "./icones";

/** /admin/imprimir?ids=1,2,3&formato=80mm|a4 — uma comanda por página. */
export default function ImprimirComandas() {
  const params = useSearchParams();
  const router = useRouter();
  const ids = (params.get("ids") ?? "")
    .split(",")
    .map((n) => Number.parseInt(n, 10))
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 50);
  const chave = ids.join(",");
  const formato = params.get("formato") === "a4" ? "a4" : "80mm";
  const [dados, setDados] = useState({ chave: null, pedidos: [], erro: null });
  const [tempoMin] = useState(tempoPreparoMin);
  const imprimiu = useRef(false);

  useEffect(() => {
    if (!chave) return;
    let ativo = true;
    buscarParaImpressao(chave.split(",").map(Number))
      .then((pedidos) => ativo && setDados({ chave, pedidos, erro: null }))
      .catch((erro) => ativo && setDados({ chave, pedidos: [], erro: erro.message }));
    return () => {
      ativo = false;
    };
  }, [chave]);

  // Abre a janela de impressão uma vez, quando as comandas chegam.
  useEffect(() => {
    if (dados.chave === chave && dados.pedidos.length && !imprimiu.current) {
      imprimiu.current = true;
      setTimeout(() => window.print(), 300);
    }
  }, [dados, chave]);

  const regraPagina =
    formato === "a4"
      ? "@page { size: A4; margin: 12mm; }"
      : "@page { size: 80mm auto; margin: 3mm; }";

  return (
    <div className="min-h-dvh py-4 print:py-0">
      <style>{`${regraPagina}
        @media print {
          body { background: none !important; }
          .comanda { break-after: page; }
          .comanda:last-child { break-after: auto; }
        }`}</style>

      <div className="mx-auto mb-4 flex max-w-xl flex-wrap items-center gap-2 px-3 print:hidden">
        <h1 className="mr-auto font-titulo text-xl text-ferrugem-hover">
          {ids.length === 1 ? `Comanda nº ${ids[0]}` : `${ids.length} comandas`}
        </h1>
        <div role="group" aria-label="Tamanho do papel" className="flex gap-1 rounded-xl bg-superficie p-1 ring-1 ring-borda-input">
          {[
            ["80mm", "80 mm"],
            ["a4", "A4"],
          ].map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              aria-pressed={formato === valor}
              onClick={() => {
                const p = new URLSearchParams(params.toString());
                p.set("formato", valor);
                router.replace(`/admin/imprimir?${p}`);
              }}
              className={`min-h-10 rounded-lg px-3 text-sm font-bold ${formato === valor ? "bg-ferrugem text-white" : "text-texto"}`}
            >
              {rotulo}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => window.print()} className={`${CLASSE_BOTAO_PRINCIPAL} w-auto`}>
          <IconeImpressora className="size-5" /> Imprimir
        </button>
      </div>

      {!chave ? (
        <div className="mx-auto max-w-xl px-3">
          <AlertaErro>Nenhum pedido escolhido para imprimir.</AlertaErro>
        </div>
      ) : dados.erro ? (
        <div className="mx-auto max-w-xl px-3">
          <AlertaErro>{dados.erro}</AlertaErro>
        </div>
      ) : dados.chave !== chave ? (
        <p className="text-center text-texto-suave" aria-busy="true">
          Carregando comandas…
        </p>
      ) : (
        <div className="space-y-6 print:space-y-0">
          {dados.pedidos.map((p) => (
            <Comanda key={p.id} pedido={p} formato={formato} tempoMin={tempoMin} />
          ))}
        </div>
      )}
    </div>
  );
}
