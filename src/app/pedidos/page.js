import { FORMA_PAGAMENTO, STATUS_PEDIDO, formatarDataHora, formatarPreco } from "@/lib/formatar";
import { PEDIDOS } from "@/lib/mock";

export const metadata = { title: "Pedidos" };

function CardPedido({ pedido }) {
  const status = STATUS_PEDIDO[pedido.status];
  return (
    <article className="rounded-2xl bg-cartao p-4 ring-1 ring-borda">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-titulo text-lg text-vermelho">Pedido nº {pedido.id}</h2>
          <p className="text-xs text-tinta/70">{formatarDataHora(pedido.criado_em)}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${status.classe}`}>{status.rotulo}</span>
      </header>

      {pedido.agendado_para && (
        <p className="mt-2 rounded-lg bg-vermelho/10 px-2.5 py-1.5 text-xs font-semibold text-vermelho-escuro">
          Encomenda para {formatarDataHora(pedido.agendado_para)}
        </p>
      )}

      <ul className="mt-3 space-y-2 border-t border-dashed border-borda pt-3 text-sm">
        {pedido.itens_pedido.map((item) => (
          <li key={item.id}>
            <div className="flex justify-between gap-3">
              <span>
                <span className="font-semibold tabular-nums">{item.quantidade}x</span> {item.nome_produto}
              </span>
              <span className="tabular-nums text-tinta/70">{formatarPreco(item.subtotal)}</span>
            </div>
            {item.itens_pedido_conteudo.length > 0 && (
              <p className="mt-0.5 pl-6 text-xs text-tinta/70">
                {item.itens_pedido_conteudo.map((c) => `${c.quantidade} ${c.nome_produto}`).join(" · ")}
              </p>
            )}
          </li>
        ))}
      </ul>

      <footer className="mt-3 flex items-center justify-between border-t border-borda pt-3 text-sm">
        <span className="text-tinta/70">{FORMA_PAGAMENTO[pedido.forma_pagamento]}</span>
        <span className="font-bold text-vermelho tabular-nums">{formatarPreco(pedido.total)}</span>
      </footer>
    </article>
  );
}

export default function PedidosPage() {
  return (
    <div className="pt-5">
      <h1 className="font-titulo text-[28px] text-vermelho">Meus pedidos</h1>
      <p className="mb-4 text-sm text-tinta/70">Acompanhe o andamento das suas encomendas.</p>
      <div className="space-y-3">
        {PEDIDOS.map((pedido) => (
          <CardPedido key={pedido.id} pedido={pedido} />
        ))}
      </div>
    </div>
  );
}
