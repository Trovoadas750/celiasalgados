"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import AvisoConta from "@/components/cliente/AvisoConta";
import { useCliente } from "@/components/cliente/ClienteProvider";
import { AlertaErro } from "@/components/cliente/Campo";
import { CLASSE_BOTAO_PRINCIPAL } from "@/components/cliente/estilos";
import { IconeCheck, IconeComanda } from "@/components/icones";
import CardPedido, { CarregandoLista } from "@/components/pedidos/CardPedido";
import { useMeusPedidos } from "@/components/pedidos/useMeusPedidos";
import AvisoRetornoPagamento from "@/components/pagamento/AvisoRetornoPagamento";
import { usePedidosAoVivo } from "@/components/pagamento/usePedidosAoVivo";

export default function MeusPedidos() {
  const { estado, usuarioId } = useCliente();
  const { pedidos, erro, carregando, recarregar } = useMeusPedidos(estado === "logado" ? usuarioId : null);
  const [atualizando, setAtualizando] = useState(false);
  const [confirmado, setConfirmado] = useState(null); // nº do pedido que acabou de ser pago

  // Tempo real: o admin confirmou o pagamento (ou o pedido mudou): recarrega e avisa.
  usePedidosAoVivo(estado === "logado", (linha) => {
    const antes = pedidos.find((p) => p.id === linha.id);
    if (linha.pagamento_status === "pago" && antes?.pagamento_status === "pendente") setConfirmado(linha.id);
    recarregar();
  });

  if (estado === "carregando") {
    return (
      <div className="pt-5">
        <div className="mb-5 h-9 w-48 animate-pulse rounded-lg bg-borda-suave" />
        <CarregandoLista />
      </div>
    );
  }

  if (estado !== "logado") {
    return (
      <AvisoConta
        Icone={IconeComanda}
        titulo="Acompanhe seus pedidos"
        texto="Só é possível ver seus pedidos criando uma conta. Com ela, cada pedido que você fizer aparece aqui com o status atualizado."
        volta="/pedidos"
      />
    );
  }

  async function atualizar() {
    setAtualizando(true);
    await recarregar();
    setAtualizando(false);
  }

  return (
    <div className="pt-5">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="traco-vinho font-titulo text-[28px] leading-tight text-ferrugem">Meus pedidos</h1>
          <p className="text-sm text-texto-suave">Acompanhe o andamento das suas encomendas.</p>
        </div>
        <button
          type="button"
          onClick={atualizar}
          disabled={atualizando || carregando}
          className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-link ring-2 ring-link transition hover:text-ferrugem-ativo hover:ring-ferrugem-ativo disabled:cursor-not-allowed disabled:text-desabilitado disabled:ring-1 disabled:ring-borda-suave"
        >
          {atualizando ? "Atualizando…" : "Atualizar"}
        </button>
      </div>

      <Suspense fallback={null}>
        <AvisoRetornoPagamento />
      </Suspense>

      {confirmado && (
        <p role="status" className="mb-3 flex items-start gap-2 rounded-xl bg-sucesso-fundo px-3 py-2.5 text-sm font-semibold text-sucesso">
          <IconeCheck className="mt-px size-5 shrink-0" />
          <span>Pagamento confirmado! Seu agendamento está garantido. (Pedido nº {confirmado})</span>
        </p>
      )}

      {carregando ? (
        <CarregandoLista />
      ) : erro ? (
        <AlertaErro>{erro}</AlertaErro>
      ) : pedidos.length === 0 ? (
        <div className="rounded-2xl bg-superficie px-4 py-10 text-center ring-1 ring-borda-suave">
          <p className="font-semibold">Você ainda não fez nenhum pedido com esta conta.</p>
          <Link href="/" className={`${CLASSE_BOTAO_PRINCIPAL} mx-auto mt-4 max-w-56`}>
            Ver o menu
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidos.map((pedido) => (
            <CardPedido key={pedido.id} pedido={pedido} />
          ))}
        </div>
      )}
    </div>
  );
}
