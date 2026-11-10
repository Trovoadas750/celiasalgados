import { IconeCheck, IconeFechar } from "@/components/icones";
import { etapasAcompanhamento } from "@/lib/acompanhamento";
import { formatarDiaMes, formatarHora, mesmoDiaEmBrasilia } from "@/lib/formatar";

// Linha do tempo do pedido (painel admin e página pública de acompanhamento).
// Cada etapa tem ícone + texto (nunca só a cor). design-cores.md: vinho em detalhes, ferrugem no atual.

const ESTILO = {
  feita: { bolinha: "bg-vinho text-creme", texto: "text-texto", linha: "border-vinho" },
  atual: { bolinha: "bg-superficie text-ferrugem ring-2 ring-ferrugem", texto: "font-bold text-texto", linha: "border-borda-suave" },
  futura: { bolinha: "bg-superficie ring-1 ring-borda-input", texto: "text-texto-suave", linha: "border-borda-suave" },
  cancelada: { bolinha: "bg-erro-fundo text-erro ring-1 ring-erro", texto: "font-bold text-erro", linha: "border-borda-suave" },
};

const SITUACAO_LEITOR = { feita: "concluída", atual: "etapa atual", futura: "ainda não", cancelada: "" };

/**
 * @param {{ status: string, tipo_entrega: "entrega" | "retirada",
 *           historico?: { status: string, em: string }[], className?: string }} props
 */
export default function LinhaDoTempo({ status, tipo_entrega, historico = [], className = "" }) {
  const etapas = etapasAcompanhamento({ status, tipo_entrega, historico });
  const primeira = etapas[0]?.em;

  return (
    <ol className={`space-y-0 ${className}`}>
      {etapas.map((etapa, i) => {
        const estilo = ESTILO[etapa.situacao];
        const ultima = i === etapas.length - 1;
        return (
          <li key={etapa.status} className="relative flex gap-3 pb-4 last:pb-0">
            {!ultima && <span aria-hidden="true" className={`absolute left-[13px] top-7 bottom-0 border-l-2 ${estilo.linha}`} />}
            <span className={`relative grid size-7 shrink-0 place-items-center rounded-full ${estilo.bolinha}`}>
              {etapa.situacao === "feita" && <IconeCheck className="size-4" />}
              {etapa.situacao === "atual" && <span className="size-2.5 rounded-full bg-ferrugem" />}
              {etapa.situacao === "cancelada" && <IconeFechar className="size-4" />}
            </span>
            <div className="min-w-0 pt-0.5 text-[15px] leading-snug">
              <p className={estilo.texto}>
                {etapa.rotulo}
                {SITUACAO_LEITOR[etapa.situacao] && <span className="sr-only"> ({SITUACAO_LEITOR[etapa.situacao]})</span>}
              </p>
              {etapa.em && (
                <p className="text-sm text-texto-suave">
                  {primeira && !mesmoDiaEmBrasilia(etapa.em, primeira) ? `${formatarDiaMes(etapa.em)} · ` : ""}
                  {formatarHora(etapa.em)}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
