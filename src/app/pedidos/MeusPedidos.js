"use client";

import Link from "next/link";
import { useState } from "react";
import AvisoConta from "@/components/cliente/AvisoConta";
import { useCliente } from "@/components/cliente/ClienteProvider";
import { CLASSE_BOTAO_PRINCIPAL } from "@/components/cliente/estilos";
import { IconeComanda } from "@/components/icones";
import CardPedido, { CarregandoLista } from "@/components/pedidos/CardPedido";
import { useMeusPedidos } from "@/components/pedidos/useMeusPedidos";

export default function MeusPedidos() {
  const { estado, usuarioId } = useCliente();
  const { pedidos, erro, carregando, recarregar } = useMeusPedidos(estado === "logado" ? usuarioId : null);
  const [atualizando, setAtualizando] = useState(false);

  if (estado === "carregando") {
    return (
      <div className="pt-5">
        <div className="mb-5 h-9 w-48 animate-pulse rounded-lg bg-sepia/60" />
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
          <h1 className="font-titulo text-[28px] leading-tight text-vermelho">Meus pedidos</h1>
          <p className="text-sm text-tinta/70">Acompanhe o andamento das suas encomendas.</p>
        </div>
        <button
          type="button"
          onClick={atualizar}
          disabled={atualizando || carregando}
          className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-vermelho ring-1 ring-vermelho/25 disabled:opacity-60"
        >
          {atualizando ? "Atualizando…" : "Atualizar"}
        </button>
      </div>

      {carregando ? (
        <CarregandoLista />
      ) : erro ? (
        <p role="alert" className="rounded-xl bg-vermelho/10 px-3 py-2.5 text-sm font-medium text-vermelho-escuro">
          {erro}
        </p>
      ) : pedidos.length === 0 ? (
        <div className="rounded-2xl bg-cartao px-4 py-10 text-center ring-1 ring-borda">
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
