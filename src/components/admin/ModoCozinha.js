"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertaErro } from "@/components/cliente/Campo";
import { IconeAlerta } from "@/components/icones";
import { tempoPreparoMin } from "@/lib/admin/config";
import { agoraMs } from "@/lib/admin/datas";
import { proximoStatus, rotuloAcaoProximo, textoHoraAlvo, urgencia } from "@/lib/admin/status";
import { listarCozinha } from "@/lib/admin/visao";
import { formatarHora } from "@/lib/formatar";
import { BadgeModo, BadgeNovo, BadgePagamento, BadgeStatus, BadgeTipo, BadgeUrgencia } from "./Badges";
import { CLASSE_BOTAO_ACAO } from "./estilos";
import { IconeVoltar } from "./icones";
import { useMudarStatus } from "./pedidos/useAcoesStatus";
import { usePedidosMudaram, useRelogio, useTempoReal } from "./TempoReal";
import { BotaoSom } from "./Topo";

/** Mantém a tela acesa (Screen Wake Lock), se o navegador permitir. Volta a pedir ao voltar para a aba. */
function useTelaAcesa() {
  const [acesa, setAcesa] = useState(false);
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    let trava = null;
    let ativo = true;
    async function pedir() {
      try {
        trava = await navigator.wakeLock.request("screen");
        if (!ativo) return trava.release();
        setAcesa(true);
        trava.addEventListener("release", () => ativo && setAcesa(false));
      } catch {
        setAcesa(false); // bateria fraca, aba em segundo plano etc.
      }
    }
    function aoVoltar() {
      if (document.visibilityState === "visible") pedir();
    }
    pedir();
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      ativo = false;
      document.removeEventListener("visibilitychange", aoVoltar);
      trava?.release().catch(() => {});
    };
  }, []);
  return acesa;
}

function CardCozinha({ pedido: p, agora, tempoMin, novo, aoAvancar }) {
  const urg = urgencia(p, agora, tempoMin);
  const proximo = proximoStatus(p.status);
  return (
    <article
      className={`flex flex-col rounded-2xl border-l-8 bg-superficie p-4 ${
        urg?.tipo === "atrasado" ? "border-erro ring-2 ring-erro" : "border-vinho ring-1 ring-borda-suave"
      }`}
    >
      <header className="flex flex-wrap items-center gap-2">
        <span className="text-3xl font-black tabular-nums">nº {p.id}</span>
        {novo && <BadgeNovo />}
        <BadgeTipo tipo={p.tipo_entrega} grande />
      </header>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-xl font-bold">
        {textoHoraAlvo(p, agora)} <BadgeUrgencia urgencia={urg} grande />
      </p>
      <p className="text-lg">
        {p.nome} {p.sobrenome}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <BadgeStatus status={p.status} tipo={p.tipo_entrega} grande />
        <BadgePagamento status={p.pagamento_status} tipo={p.tipo_entrega} grande esconderNaEntrega />
      </div>

      <ul className="mt-3 flex-1 space-y-3 border-t-2 border-dashed border-borda-suave pt-3">
        {p.itens_pedido.map((item) => (
          <li key={item.id}>
            <p className="flex flex-wrap items-center gap-2 text-xl font-black">
              {item.quantidade}x {item.nome_produto}
              {item.modo && <BadgeModo modo={item.modo} grande />}
            </p>
            {item.itens_pedido_conteudo?.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {item.itens_pedido_conteudo.map((c) => (
                  <li key={c.id} className="text-xl">
                    <span className="inline-block min-w-12 font-black tabular-nums">{c.quantidade}</span>
                    {c.nome_produto}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      {p.observacao && (
        <p className="mt-3 flex items-start gap-2 whitespace-pre-line rounded-xl bg-aviso-fundo p-3 text-lg font-bold text-aviso-texto ring-2 ring-aviso-texto">
          <IconeAlerta className="mt-1 size-6 shrink-0" />
          <span>{p.observacao}</span>
        </p>
      )}

      {proximo && (
        <button type="button" onClick={aoAvancar} className={`${CLASSE_BOTAO_ACAO} mt-4 min-h-16 w-full text-xl`}>
          {rotuloAcaoProximo(p.status, p.tipo_entrega)}
        </button>
      )}
    </article>
  );
}

/** /admin/cozinha: fila "Novo" + "Em preparo" em letras grandes, para tablet/TV na cozinha. */
export default function ModoCozinha() {
  const [tempoMin] = useState(tempoPreparoMin);
  const agora = useRelogio(15000);
  const [versao, setVersao] = useState(0);
  const recarregar = useCallback(() => setVersao((v) => v + 1), []);
  usePedidosMudaram(recarregar);
  const { vistos, aoVivo } = useTempoReal();
  const { mudar } = useMudarStatus(recarregar);
  const telaAcesa = useTelaAcesa();
  const [dados, setDados] = useState({ carregado: false, pedidos: [], erro: null });

  useEffect(() => {
    let ativo = true;
    const carregar = () =>
      listarCozinha({ agora: agoraMs(), tempoMin })
        .then((pedidos) => ativo && setDados({ carregado: true, pedidos, erro: null }))
        .catch((erro) => ativo && setDados((d) => ({ ...d, carregado: true, erro: erro.message })));
    carregar();
    const intervalo = setInterval(carregar, 60000);
    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [versao, tempoMin]);

  function telaCheia() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }

  const novos = dados.pedidos.filter((p) => p.status === "novo").length;

  return (
    <div className="min-h-dvh">
      <header className="fundo-escuro sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b-4 border-vinho bg-cafe px-4 py-3 text-creme">
        <Link href="/admin" className="inline-flex min-h-11 items-center gap-1 rounded-xl px-2 font-semibold text-creme hover:bg-vinho">
          <IconeVoltar className="size-5" /> Painel
        </Link>
        <h1 className="font-titulo text-2xl">Cozinha</h1>
        <p className="text-2xl font-bold tabular-nums">{formatarHora(agora)}</p>
        <p className="text-lg">
          {novos} novo(s) · {dados.pedidos.length - novos} em preparo
        </p>
        <div className="ml-auto flex items-center gap-2">
          <span className={`fundo-claro rounded-full px-2.5 py-1 text-sm font-bold ${aoVivo ? "bg-sucesso-fundo text-sucesso" : "bg-cancelado-fundo text-texto-sec"}`}>
            {aoVivo ? "Ao vivo" : "Reconectando..."}
          </span>
          {!telaAcesa && <span className="hidden text-sm md:inline">Tela pode apagar</span>}
          <BotaoSom />
          <button type="button" onClick={telaCheia} className="min-h-11 rounded-xl bg-creme px-3 font-bold text-cafe">
            Tela cheia
          </button>
        </div>
      </header>

      <main className="p-4">
        {dados.erro && <AlertaErro>{dados.erro}</AlertaErro>}
        {!dados.carregado ? (
          <p className="py-10 text-center text-xl text-texto-suave" aria-busy="true">
            Carregando…
          </p>
        ) : dados.pedidos.length === 0 ? (
          <p className="py-16 text-center text-2xl font-bold">Nenhum pedido para preparar agora.</p>
        ) : (
          <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,22rem),1fr))]">
            {dados.pedidos.map((p) => (
              <li key={p.id} className="flex">
                <div className="w-full">
                  <CardCozinha
                    pedido={p}
                    agora={agora}
                    tempoMin={tempoMin}
                    novo={p.status === "novo" && !vistos.has(p.id)}
                    aoAvancar={() => mudar(p, proximoStatus(p.status))}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
