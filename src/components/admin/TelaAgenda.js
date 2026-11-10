"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AlertaErro } from "@/components/cliente/Campo";
import { IconeLojaFechada, IconeMais } from "@/components/icones";
import { horariosDoDia, semanaDe } from "@/lib/admin/agenda";
import { tempoPreparoMin } from "@/lib/admin/config";
import { dataEmBrasilia, dataHora, somarDias } from "@/lib/admin/datas";
import { horaAlvo, resumoItens } from "@/lib/admin/status";
import { listarDiasFechados, listarHorariosFuncionamento, listarPedidosAgenda } from "@/lib/admin/visao";
import { formatarDiaComSemana, formatarHora, formatarPreco } from "@/lib/formatar";
import { BadgePagamento, BadgeStatus, BadgeTipo } from "./Badges";
import { CLASSE_BOTAO_CONTORNO, CLASSE_CAMPO } from "./estilos";
import { IconeVoltar } from "./icones";
import GavetaDetalhe, { usePedidoAberto } from "./pedidos/GavetaDetalhe";
import { usePedidosMudaram, useRelogio } from "./TempoReal";

const dataValida = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v ?? "") ? v : null);

/** Dia do pedido pela hora-alvo (agendado: dia do horário; "agora": dia em que fica pronto). */
const diaDoPedido = (p, tempoMin) => dataEmBrasilia(horaAlvo(p, tempoMin));

function PedidoNaGrade({ pedido: p, aoAbrir, compacto = false }) {
  const pendente = p.pagamento_status === "pendente";
  return (
    <button
      type="button"
      onClick={aoAbrir}
      className={`w-full rounded-xl bg-superficie px-3 py-2 text-left transition hover:ring-ferrugem ${
        pendente ? "ring-2 ring-aviso-texto" : "ring-1 ring-borda-input"
      }`}
    >
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-bold tabular-nums">nº {p.id}</span>
        <span className="font-semibold">
          {p.nome}
          {!compacto && ` ${p.sobrenome}`}
        </span>
        {!compacto && <BadgeTipo tipo={p.tipo_entrega} />}
        {!compacto && <span className="ml-auto font-bold text-ferrugem tabular-nums">{formatarPreco(Number(p.total))}</span>}
      </span>
      {!compacto && <span className="mt-0.5 block text-sm text-texto-suave">{resumoItens(p.itens_pedido)}</span>}
      <span className="mt-1 flex flex-wrap gap-1.5">
        {pendente || !compacto ? <BadgePagamento status={p.pagamento_status} tipo={p.tipo_entrega} esconderNaEntrega={compacto} /> : null}
        {!compacto && <BadgeStatus status={p.status} tipo={p.tipo_entrega} />}
      </span>
    </button>
  );
}

function AvisoFechado({ motivo }) {
  return (
    <p className="flex items-center gap-2 rounded-xl bg-cancelado-fundo px-3 py-2.5 font-bold text-texto-sec">
      <IconeLojaFechada className="size-5 shrink-0" />
      Fechado{motivo ? `: ${motivo}` : ""}
    </p>
  );
}

/** Visão de um dia: faixa "o quanto antes" + grade de 30 em 30 min. */
function VisaoDia({ data, faixas, fechado, pedidos, agora, tempoMin, aoAbrir }) {
  const horas = horariosDoDia(faixas, data);
  const doDia = pedidos.filter((p) => diaDoPedido(p, tempoMin) === data);
  const quantoAntes = doDia.filter((p) => !p.agendado_para);
  const agendados = doDia.filter((p) => p.agendado_para);
  const porHora = new Map(agendados.map((p) => [formatarHora(p.agendado_para), p]));
  const foraDaGrade = agendados.filter((p) => !horas.includes(formatarHora(p.agendado_para)));

  return (
    <div className="space-y-4">
      {fechado && <AvisoFechado motivo={fechado.motivo} />}

      {quantoAntes.length > 0 && (
        <section aria-label="Pedidos o quanto antes" className="rounded-2xl bg-info-fundo p-3">
          <h2 className="mb-2 font-bold text-info">O quanto antes ({quantoAntes.length})</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {quantoAntes.map((p) => (
              <li key={p.id}>
                <PedidoNaGrade pedido={p} aoAbrir={() => aoAbrir(p.id)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {horas.length === 0 ? (
        !fechado && <p className="rounded-2xl bg-superficie px-4 py-6 text-center font-semibold ring-1 ring-borda-suave">Sem horário de funcionamento neste dia.</p>
      ) : (
        <ol className="divide-y divide-borda-suave rounded-2xl bg-superficie ring-1 ring-borda-suave">
          {horas.map((hora) => {
            const pedido = porHora.get(hora);
            const futuro = new Date(dataHora(data, hora)).getTime() > agora;
            return (
              <li key={hora} className="flex items-start gap-3 px-3 py-2">
                <span className="w-14 shrink-0 pt-2 text-lg font-bold tabular-nums">{hora}</span>
                <div className="min-w-0 flex-1">
                  {pedido ? (
                    <PedidoNaGrade pedido={pedido} aoAbrir={() => aoAbrir(pedido.id)} />
                  ) : futuro && !fechado ? (
                    <Link
                      href={`/admin/pedidos/novo?data=${data}&hora=${hora}`}
                      className="flex min-h-11 items-center gap-2 rounded-xl border-2 border-dashed border-borda-input px-3 font-semibold text-link hover:border-ferrugem"
                    >
                      <IconeMais className="size-4" /> Livre · novo pedido neste horário
                    </Link>
                  ) : (
                    <p className="flex min-h-11 items-center px-3 text-texto-suave">Livre</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {foraDaGrade.length > 0 && (
        <section aria-label="Fora da grade" className="rounded-2xl bg-aviso-fundo p-3">
          <h2 className="mb-2 font-bold text-aviso-texto">Agendados fora da grade atual de horários</h2>
          <ul className="space-y-2">
            {foraDaGrade.map((p) => (
              <li key={p.id} className="flex items-start gap-3">
                <span className="w-14 shrink-0 pt-2 font-bold tabular-nums text-aviso-texto">{formatarHora(p.agendado_para)}</span>
                <div className="flex-1">
                  <PedidoNaGrade pedido={p} aoAbrir={() => aoAbrir(p.id)} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** Visão da semana: por dia, só os horários ocupados + quantos estão livres. */
function VisaoSemana({ dias, faixas, fechados, pedidos, tempoMin, hoje, aoAbrir, aoVerDia }) {
  return (
    <div className="grid gap-3 lg:grid-cols-7">
      {dias.map((d) => {
        const fechado = fechados.find((f) => f.data === d);
        const horas = horariosDoDia(faixas, d);
        const doDia = pedidos.filter((p) => diaDoPedido(p, tempoMin) === d);
        const agendados = doDia.filter((p) => p.agendado_para);
        const quantoAntes = doDia.length - agendados.length;
        const livres = fechado ? 0 : horas.filter((h) => !agendados.some((p) => formatarHora(p.agendado_para) === h)).length;
        return (
          <section key={d} aria-label={formatarDiaComSemana(`${d}T12:00:00-03:00`)} className="rounded-2xl bg-superficie p-2 ring-1 ring-borda-suave">
            <button
              type="button"
              onClick={() => aoVerDia(d)}
              className={`mb-2 w-full rounded-xl px-2 py-1.5 text-left font-bold ${d === hoje ? "bg-vinho text-creme" : "hover:bg-fundo"}`}
            >
              {formatarDiaComSemana(`${d}T12:00:00-03:00`)}
              {d === hoje && " · hoje"}
            </button>
            {fechado ? (
              <AvisoFechado motivo={fechado.motivo} />
            ) : (
              <>
                {quantoAntes > 0 && <p className="mb-1 px-1 text-sm font-semibold text-info">+ {quantoAntes} o quanto antes</p>}
                <ul className="space-y-1.5">
                  {agendados.map((p) => (
                    <li key={p.id} className="flex items-start gap-2">
                      <span className="w-11 shrink-0 pt-2 text-sm font-bold tabular-nums">{formatarHora(p.agendado_para)}</span>
                      <div className="min-w-0 flex-1">
                        <PedidoNaGrade pedido={p} aoAbrir={() => aoAbrir(p.id)} compacto />
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 px-1 text-sm text-texto-suave">
                  {horas.length === 0 ? "Sem expediente" : `${livres} horário(s) livre(s)`}
                </p>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default function TelaAgenda() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const agora = useRelogio(60000);
  const hoje = dataEmBrasilia(agora);
  const data = dataValida(sp.get("data")) ?? hoje;
  const semana = sp.get("visao") === "semana";
  const dias = semana ? semanaDe(data) : [data];
  const [tempoMin] = useState(tempoPreparoMin);
  const [versao, setVersao] = useState(0);
  const recarregar = useCallback(() => setVersao((v) => v + 1), []);
  usePedidosMudaram(recarregar);
  const detalhe = usePedidoAberto();
  const [faixas, setFaixas] = useState(null);
  const [dados, setDados] = useState({ chave: null, pedidos: [], fechados: [], erro: null });
  const chave = `${dias[0]}|${dias.at(-1)}`;

  useEffect(() => {
    listarHorariosFuncionamento()
      .then(setFaixas)
      .catch(() => setFaixas([]));
  }, []);

  useEffect(() => {
    let ativo = true;
    const [de, ate] = chave.split("|");
    Promise.all([listarPedidosAgenda({ de, ate, tempoMin }), listarDiasFechados(de, ate)])
      .then(([pedidos, fechados]) => ativo && setDados({ chave, pedidos, fechados, erro: null }))
      .catch((erro) => ativo && setDados({ chave, pedidos: [], fechados: [], erro: erro.message }));
    return () => {
      ativo = false;
    };
  }, [chave, versao, tempoMin]);

  function ir(mudancas) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(mudancas)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete("pedido");
    router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
  }

  const passo = semana ? 7 : 1;
  const carregando = dados.chave !== chave || faixas === null;
  const titulo = semana
    ? `${formatarDiaComSemana(`${dias[0]}T12:00:00-03:00`)} a ${formatarDiaComSemana(`${dias[6]}T12:00:00-03:00`)}`
    : formatarDiaComSemana(`${data}T12:00:00-03:00`);

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="traco-vinho font-titulo text-[28px] leading-tight text-ferrugem">Agenda</h1>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Visão" className="flex rounded-xl bg-superficie p-1 ring-1 ring-borda-input">
          {[
            [false, "Dia"],
            [true, "Semana"],
          ].map(([valor, rotulo]) => (
            <button
              key={rotulo}
              type="button"
              aria-pressed={semana === valor}
              onClick={() => ir({ visao: valor ? "semana" : null })}
              className={`min-h-10 rounded-lg px-4 font-bold ${semana === valor ? "bg-ferrugem text-white" : "text-texto"}`}
            >
              {rotulo}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => ir({ data: null })} className={CLASSE_BOTAO_CONTORNO}>
          Hoje
        </button>
        <button type="button" onClick={() => ir({ data: somarDias(data, -passo) })} aria-label={semana ? "Semana anterior" : "Dia anterior"} className={CLASSE_BOTAO_CONTORNO}>
          <IconeVoltar className="size-5" />
        </button>
        <button type="button" onClick={() => ir({ data: somarDias(data, passo) })} aria-label={semana ? "Próxima semana" : "Próximo dia"} className={CLASSE_BOTAO_CONTORNO}>
          <IconeVoltar className="size-5 rotate-180" />
        </button>
        <label className="block">
          <span className="sr-only">Escolher data</span>
          <input type="date" value={data} onChange={(e) => e.target.value && ir({ data: e.target.value })} className={`${CLASSE_CAMPO} h-11 w-auto`} />
        </label>
      </div>
      <h2 className="mt-3 text-xl font-bold first-letter:uppercase">{titulo}</h2>

      <div className="mt-3">
        {dados.erro ? (
          <AlertaErro>{dados.erro}</AlertaErro>
        ) : carregando ? (
          <div className="h-72 animate-pulse rounded-2xl bg-borda-suave" aria-busy="true" aria-label="Carregando agenda" />
        ) : semana ? (
          <VisaoSemana
            dias={dias}
            faixas={faixas}
            fechados={dados.fechados}
            pedidos={dados.pedidos}
            tempoMin={tempoMin}
            hoje={hoje}
            aoAbrir={detalhe.abrir}
            aoVerDia={(d) => ir({ data: d, visao: null })}
          />
        ) : (
          <VisaoDia
            data={data}
            faixas={faixas}
            fechado={dados.fechados.find((f) => f.data === data)}
            pedidos={dados.pedidos}
            agora={agora}
            tempoMin={tempoMin}
            aoAbrir={detalhe.abrir}
          />
        )}
      </div>

      <GavetaDetalhe id={detalhe.id} aoFechar={detalhe.fechar} versao={versao} agora={agora} tempoMin={tempoMin} aoMudou={recarregar} />
    </div>
  );
}
