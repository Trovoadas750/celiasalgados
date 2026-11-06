import { IconeMotoboy, IconeRetirada, IconeWhatsappOficial } from "@/components/icones";
import StatusPagamento, { statusEfetivo } from "@/components/pagamento/StatusPagamento";
import { ehRetirada } from "@/lib/entrega";
import { STATUS_PEDIDO, formatarDataHora, formatarPreco } from "@/lib/formatar";
import { textoFormaPagamento } from "@/lib/mensagemWhatsapp";
import { linkPagamento } from "@/lib/pagamento";

// Um pedido no formato da consulta de `buscarMeusPedidos` (lib/conta.js).
export default function CardPedido({ pedido }) {
  const status = STATUS_PEDIDO[pedido.status] ?? STATUS_PEDIDO.novo;
  return (
    <article className="rounded-2xl border-l-4 border-vinho bg-superficie p-4 ring-1 ring-borda-suave">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-titulo text-lg text-ferrugem">Pedido nº {pedido.id}</h2>
          <p className="text-sm text-texto-suave">{formatarDataHora(pedido.criado_em)}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-bold ${status.classe}`}>{status.rotulo}</span>
      </header>

      {pedido.rua && (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-texto-suave">
          {ehRetirada(pedido) ? (
            <>
              <IconeRetirada className="size-4 text-cobre" /> Retirada no local
            </>
          ) : (
            <>
              <IconeMotoboy className="size-4 text-cobre" />
              <span className="truncate">
                Entrega: {pedido.rua}, {pedido.numero} - {pedido.vila}
              </span>
            </>
          )}
        </p>
      )}

      {pedido.agendado_para && (
        <p className="mt-2 rounded-lg bg-info-fundo px-2.5 py-1.5 text-sm font-semibold text-info">
          Encomenda para {formatarDataHora(pedido.agendado_para)}
        </p>
      )}

      {/* Só agendamentos: aguardando / confirmado / cancelado por falta de pagamento */}
      <StatusPagamento status={pedido.pagamento_status} expiraEm={pedido.pagamento_expira_em} className="mt-2" />

      {/* Agendamento aguardando pagamento: combina pelo WhatsApp da loja (valor do banco). */}
      {statusEfetivo(pedido.pagamento_status, pedido.pagamento_expira_em) === "pendente" && pedido.status !== "cancelado" && (
        <a
          href={linkPagamento({
            numero: pedido.id,
            total: pedido.total,
            forma: pedido.forma_pagamento,
            agendadoPara: pedido.agendado_para,
            expiraEm: pedido.pagamento_expira_em,
          })}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Pagar agora o pedido nº ${pedido.id} pelo WhatsApp`}
          className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ferrugem px-4 text-sm font-bold text-white transition hover:bg-ferrugem-hover active:bg-ferrugem-ativo"
        >
          <IconeWhatsappOficial className="size-5" />
          Pagar agora
        </a>
      )}

      <ul className="mt-3 space-y-2 border-t border-dashed border-borda-suave pt-3 text-sm">
        {pedido.itens_pedido.map((item) => (
          <li key={item.id}>
            <div className="flex justify-between gap-3">
              <span>
                <span className="font-semibold tabular-nums">{item.quantidade}x</span> {item.nome_produto}
              </span>
              <span className="tabular-nums text-texto-suave">{formatarPreco(item.subtotal)}</span>
            </div>
            {item.itens_pedido_conteudo?.length > 0 && (
              <p className="mt-0.5 pl-6 text-sm text-texto-suave">
                {item.itens_pedido_conteudo.map((c) => `${c.quantidade} ${c.nome_produto}`).join(" · ")}
              </p>
            )}
          </li>
        ))}
      </ul>

      {Number(pedido.taxa_entrega) > 0 && (
        <p className="mt-2 flex justify-between gap-3 text-sm">
          <span className="text-texto-suave">Entrega</span>
          <span className="tabular-nums text-texto-suave">{formatarPreco(pedido.taxa_entrega)}</span>
        </p>
      )}

      <footer className="mt-3 flex items-center justify-between border-t border-borda-suave pt-3 text-sm">
        <span className="text-texto-suave">
          {textoFormaPagamento({
            forma: pedido.forma_pagamento,
            agendadoPara: pedido.agendado_para,
            tipoEntrega: pedido.tipo_entrega,
          })}
        </span>
        <span className="font-bold text-ferrugem tabular-nums">{formatarPreco(pedido.total)}</span>
      </footer>
    </article>
  );
}

export function CarregandoLista({ linhas = 3 }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className="h-36 animate-pulse rounded-2xl bg-borda-suave" />
      ))}
    </div>
  );
}
