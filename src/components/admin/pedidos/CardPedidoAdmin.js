"use client";

import { formatarPreco } from "@/lib/formatar";
import { proximoStatus, resumoItens, rotuloAcaoProximo, textoHoraAlvo, urgencia } from "@/lib/admin/status";
import { BadgeNovo, BadgeOrigem, BadgePagamento, BadgeStatus, BadgeTipo, BadgeUrgencia } from "../Badges";
import { CLASSE_BOTAO_ACAO } from "../estilos";

/**
 * Um pedido na lista. Toque no corpo abre o detalhe; o botão de baixo leva ao próximo status.
 * Sem `aoSelecionar`, não mostra a caixa de seleção (fila da tela Hoje).
 */
export default function CardPedidoAdmin({ pedido, agora, tempoMin, novo, aberto, selecionado, aoSelecionar, aoAbrir, aoAvancar }) {
  const proximo = proximoStatus(pedido.status);
  const expirado = pedido.pagamento_status === "expirado";
  const rotuloProximo = !expirado && proximo ? rotuloAcaoProximo(pedido.status, pedido.tipo_entrega) : null;
  const urg = urgencia(pedido, agora, tempoMin);

  return (
    <article
      className={`rounded-2xl border-l-4 bg-superficie transition ${
        aberto ? "border-ferrugem ring-2 ring-ferrugem" : urg?.tipo === "atrasado" ? "border-erro ring-1 ring-erro" : "border-vinho ring-1 ring-borda-suave"
      }`}
    >
      <div className="flex">
        {aoSelecionar && (
          <label className="flex cursor-pointer items-start py-3.5 pl-3 pr-1">
            <input type="checkbox" checked={selecionado} onChange={aoSelecionar} className="size-5 accent-ferrugem" />
            <span className="sr-only">Selecionar pedido nº {pedido.id}</span>
          </label>
        )}
        <button type="button" onClick={aoAbrir} className={`min-w-0 flex-1 rounded-r-2xl py-3 pr-3 text-left ${aoSelecionar ? "pl-2" : "pl-3.5"}`}>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-lg font-bold tabular-nums">nº {pedido.id}</span>
            {novo && <BadgeNovo />}
            <span className="font-semibold">{textoHoraAlvo(pedido, agora)}</span>
            <BadgeUrgencia urgencia={urg} />
            <span className="ml-auto text-lg font-bold text-ferrugem tabular-nums">{formatarPreco(Number(pedido.total))}</span>
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold">
              {pedido.nome} {pedido.sobrenome}
            </span>
            <BadgeTipo tipo={pedido.tipo_entrega} />
            {pedido.tipo_entrega === "entrega" && pedido.vila && <span className="text-sm text-texto-suave">{pedido.vila}</span>}
          </span>
          <span className="mt-1 block text-sm text-texto-suave">{resumoItens(pedido.itens_pedido)}</span>
          <span className="mt-2 flex flex-wrap items-center gap-1.5">
            <BadgeStatus status={pedido.status} tipo={pedido.tipo_entrega} />
            <BadgePagamento status={pedido.pagamento_status} tipo={pedido.tipo_entrega} />
            <BadgeOrigem origem={pedido.origem} />
          </span>
        </button>
      </div>
      {rotuloProximo && (
        <div className={`px-3 pb-3 ${aoSelecionar ? "sm:pl-10" : ""}`}>
          <button type="button" onClick={aoAvancar} className={`${CLASSE_BOTAO_ACAO} w-full sm:w-auto`}>
            {rotuloProximo}
          </button>
        </div>
      )}
    </article>
  );
}

export function CarregandoCards({ linhas = 4 }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Carregando pedidos">
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className="h-40 animate-pulse rounded-2xl bg-borda-suave" />
      ))}
    </div>
  );
}
