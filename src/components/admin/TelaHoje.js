"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertaErro } from "@/components/cliente/Campo";
import { IconeAlerta, IconeAmpulheta, IconeRelogio } from "@/components/icones";
import { tempoPreparoMin } from "@/lib/admin/config";
import { agoraMs, dataEmBrasilia } from "@/lib/admin/datas";
import { horaAlvo, proximoStatus, resumoItens, rotuloStatus, textoDiaHora, urgencia } from "@/lib/admin/status";
import { listarAguardandoPagamento, listarFila, listarProximosAgendamentos, resumoPeriodo } from "@/lib/admin/visao";
import { formatarHora, formatarPreco } from "@/lib/formatar";
import { BadgePagamento, BadgeTipo } from "./Badges";
import { IconeDinheiro, IconeLista } from "./icones";
import CardPedidoAdmin from "./pedidos/CardPedidoAdmin";
import GavetaDetalhe, { usePedidoAberto } from "./pedidos/GavetaDetalhe";
import { useMudarStatus } from "./pedidos/useAcoesStatus";
import { usePedidosMudaram, useRelogio, useTempoReal } from "./TempoReal";

const DUAS_HORAS = 2 * 60 * 60000;
const MEIA_HORA = 30 * 60000;

const COLUNAS = [
  { status: "novo", titulo: "Novo" },
  { status: "em_preparo", titulo: "Em preparo" },
  { status: "saiu_para_entrega", titulo: "Saiu para entrega / Pronto" },
];

function Cartao({ rotulo, valor, detalhe, Icone, href, alerta = false }) {
  const conteudo = (
    <>
      <span className="flex items-center gap-2 text-sm font-bold">
        <Icone className="size-5 shrink-0" />
        {rotulo}
      </span>
      <span className="mt-1 block text-[28px] font-bold leading-tight tabular-nums">{valor}</span>
      {detalhe && <span className="block text-sm">{detalhe}</span>}
    </>
  );
  const classe = `block h-full rounded-2xl p-4 ${alerta ? "bg-erro-fundo text-erro ring-2 ring-erro" : "bg-superficie text-texto ring-1 ring-borda-suave"}`;
  return href ? (
    <Link href={href} className={`${classe} transition hover:shadow-card`}>
      {conteudo}
    </Link>
  ) : (
    <div className={classe}>{conteudo}</div>
  );
}

/** Tela inicial do painel: números do dia, fila de atendimento e próximos agendamentos. */
export default function TelaHoje() {
  const [tempoMin] = useState(tempoPreparoMin);
  const agora = useRelogio(30000);
  const [versao, setVersao] = useState(0);
  const recarregar = useCallback(() => setVersao((v) => v + 1), []);
  usePedidosMudaram(recarregar);
  const { vistos } = useTempoReal();
  const { mudar } = useMudarStatus(recarregar);
  const detalhe = usePedidoAberto();
  const [dados, setDados] = useState({ carregado: false, fila: [], proximos: [], aguardando: [], resumo: null, erro: null });

  useEffect(() => {
    let ativo = true;
    const carregar = async () => {
      const momento = agoraMs();
      const [fila, proximos, aguardando, resumo] = await Promise.allSettled([
        listarFila({ agora: momento, tempoMin }),
        listarProximosAgendamentos({ agora: momento }),
        listarAguardandoPagamento(),
        resumoPeriodo(dataEmBrasilia(momento)),
      ]);
      if (!ativo) return;
      const falha = [fila, proximos, aguardando, resumo].find((r) => r.status === "rejected");
      setDados({
        carregado: true,
        fila: fila.value ?? [],
        proximos: proximos.value ?? [],
        aguardando: aguardando.value ?? [],
        resumo: resumo.value ?? null,
        erro: falha ? falha.reason.message : null,
      });
    };
    carregar();
    const intervalo = setInterval(carregar, 60000);
    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [versao, tempoMin]);

  const { fila, proximos, aguardando, resumo } = dados;
  const atrasados = fila.filter((p) => urgencia(p, agora, tempoMin)?.tipo === "atrasado");
  const proximas2h = fila.filter((p) => {
    const alvo = horaAlvo(p, tempoMin).getTime();
    return alvo >= agora && alvo <= agora + DUAS_HORAS;
  });
  const vencendo = aguardando.filter((p) => {
    const prazo = new Date(p.pagamento_expira_em).getTime();
    return prazo > agora && prazo - agora <= MEIA_HORA;
  });
  const valorAguardando = aguardando.reduce((soma, p) => soma + Number(p.total), 0);

  const card = (p) => (
    <CardPedidoAdmin
      key={p.id}
      pedido={p}
      agora={agora}
      tempoMin={tempoMin}
      novo={p.status === "novo" && !vistos.has(p.id)}
      aberto={p.id === detalhe.id}
      aoAbrir={() => detalhe.abrir(p.id)}
      aoAvancar={() => mudar(p, proximoStatus(p.status))}
    />
  );

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="traco-vinho font-titulo text-[28px] leading-tight text-ferrugem">Hoje</h1>

      {/* Avisos que precisam de ação já */}
      {(atrasados.length > 0 || vencendo.length > 0) && (
        <div className="mt-4 space-y-2">
          {atrasados.length > 0 && (
            <Link
              href="/admin/pedidos?aba=atrasados"
              className="flex items-start gap-2 rounded-xl bg-erro-fundo px-3 py-3 font-bold text-erro ring-2 ring-erro"
            >
              <IconeAlerta className="mt-px size-5 shrink-0" />
              <span>
                {atrasados.length} pedido(s) atrasado(s): {atrasados.slice(0, 5).map((p) => `nº ${p.id}`).join(", ")}
                {atrasados.length > 5 ? "…" : ""}
              </span>
            </Link>
          )}
          {vencendo.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => detalhe.abrir(p.id)}
              className="flex w-full items-start gap-2 rounded-xl bg-aviso-fundo px-3 py-3 text-left font-bold text-aviso-texto ring-2 ring-aviso-texto"
            >
              <IconeAmpulheta className="mt-px size-5 shrink-0" />
              <span>
                Pagamento do pedido nº {p.id} ({p.nome}, {formatarPreco(Number(p.total))}) vence às {formatarHora(p.pagamento_expira_em)}. Depois
                disso o horário é liberado.
              </span>
            </button>
          ))}
        </div>
      )}

      {dados.erro && (
        <div className="mt-4">
          <AlertaErro>{dados.erro}</AlertaErro>
        </div>
      )}

      {/* Números do dia */}
      <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <li>
          <Cartao
            rotulo="Pedidos de hoje"
            Icone={IconeLista}
            valor={resumo ? resumo.pedidos : "—"}
            detalhe="sem cancelados e pendentes"
            href="/admin/pedidos?aba=hoje"
          />
        </li>
        <li>
          <Cartao rotulo="Faturamento de hoje" Icone={IconeDinheiro} valor={resumo ? formatarPreco(Number(resumo.faturamento)) : "—"} />
        </li>
        <li>
          <Cartao
            rotulo="Aguardando pagamento"
            Icone={IconeAmpulheta}
            valor={dados.carregado ? aguardando.length : "—"}
            detalhe={aguardando.length ? formatarPreco(valorAguardando) : null}
            href="/admin/pagamentos"
          />
        </li>
        <li>
          <Cartao
            rotulo="Atrasados"
            Icone={IconeAlerta}
            valor={dados.carregado ? atrasados.length : "—"}
            alerta={atrasados.length > 0}
            href="/admin/pedidos?aba=atrasados"
          />
        </li>
        <li className="col-span-2 lg:col-span-1">
          <Cartao rotulo="Próximas 2 horas" Icone={IconeRelogio} valor={dados.carregado ? proximas2h.length : "—"} href="/admin/pedidos" />
        </li>
      </ul>

      {/* Fila de atendimento */}
      <section className="mt-6" aria-labelledby="titulo-fila">
        <h2 id="titulo-fila" className="text-xl font-bold">
          Fila de atendimento <span className="text-texto-suave">({fila.length})</span>
        </h2>
        <p className="text-sm text-texto-suave">Pedidos de hoje ainda não finalizados, pela hora-alvo.</p>
        {!dados.carregado ? (
          <div className="mt-3 h-40 animate-pulse rounded-2xl bg-borda-suave" aria-busy="true" aria-label="Carregando fila" />
        ) : fila.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-superficie px-4 py-8 text-center font-semibold ring-1 ring-borda-suave">Nenhum pedido na fila agora.</p>
        ) : (
          <>
            {/* Celular/tablet: uma lista só */}
            <ul className="mt-3 space-y-3 lg:hidden">
              {fila.map((p) => (
                <li key={p.id}>{card(p)}</li>
              ))}
            </ul>
            {/* Computador: colunas por status */}
            <div className="mt-3 hidden gap-4 lg:grid lg:grid-cols-3">
              {COLUNAS.map((col) => {
                const lista = fila.filter((p) => p.status === col.status);
                return (
                  <section key={col.status} aria-label={col.titulo} className="rounded-2xl bg-fundo">
                    <h3 className="mb-2 flex items-center justify-between border-b-2 border-vinho pb-1 font-bold">
                      {col.titulo}
                      <span className="rounded-full bg-vinho px-2 text-sm text-creme">{lista.length}</span>
                    </h3>
                    {lista.length === 0 ? (
                      <p className="py-4 text-center text-sm text-texto-suave">Nada aqui.</p>
                    ) : (
                      <ul className="space-y-3">
                        {lista.map((p) => (
                          <li key={p.id}>{card(p)}</li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Próximos agendamentos */}
      <section className="mt-8" aria-labelledby="titulo-proximos">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="titulo-proximos" className="text-xl font-bold">
            Próximos agendamentos
          </h2>
          <Link href="/admin/agenda" className="text-sm font-semibold text-link underline underline-offset-4 hover:text-ferrugem-ativo">
            Ver agenda
          </Link>
        </div>
        {!dados.carregado ? (
          <div className="mt-3 h-24 animate-pulse rounded-2xl bg-borda-suave" aria-busy="true" />
        ) : proximos.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-superficie px-4 py-6 text-center font-semibold ring-1 ring-borda-suave">
            Nenhum agendamento para amanhã em diante.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {proximos.map((p) => {
              const pendente = p.pagamento_status === "pendente";
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => detalhe.abrir(p.id)}
                    className={`flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-superficie px-3 py-2.5 text-left ${
                      pendente ? "ring-2 ring-aviso-texto" : "ring-1 ring-borda-suave hover:ring-ferrugem"
                    }`}
                  >
                    <span className="font-bold">{textoDiaHora(p.agendado_para, agora)}</span>
                    <span className="font-semibold tabular-nums">nº {p.id}</span>
                    <span>
                      {p.nome} {p.sobrenome}
                    </span>
                    <BadgeTipo tipo={p.tipo_entrega} />
                    <span className="text-sm text-texto-suave">{resumoItens(p.itens_pedido)}</span>
                    <span className="ml-auto font-bold text-ferrugem tabular-nums">{formatarPreco(Number(p.total))}</span>
                    <BadgePagamento status={p.pagamento_status} tipo={p.tipo_entrega} esconderNaEntrega />
                    <span className="sr-only">Status: {rotuloStatus(p.status, p.tipo_entrega)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <GavetaDetalhe id={detalhe.id} aoFechar={detalhe.fechar} versao={versao} agora={agora} tempoMin={tempoMin} aoMudou={recarregar} />
    </div>
  );
}
