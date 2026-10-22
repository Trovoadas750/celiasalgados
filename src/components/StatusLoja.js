"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconeFechar, IconeLojaAberta, IconeLojaFechada, IconeRelogio } from "@/components/icones";
import { formatarDiaComSemana, formatarDiaMes, formatarHora } from "@/lib/formatar";
import { buscarHorariosSemana, buscarStatusLoja, DIAS_SEMANA } from "@/lib/horarios";

const FUSO = "America/Sao_Paulo";
const CINCO_MIN = 5 * 60 * 1000;
const ORDEM_SEMANA = [1, 2, 3, 4, 5, 6, 0]; // segunda a domingo

function hojeIso() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(new Date());
}

function diaDaSemanaHoje() {
  const [a, m, d] = hojeIso().split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}

// "hoje às 13:30" · "amanhã às 08:00" · "sex, 23/10 às 08:00"
function textoProximaAbertura(iso) {
  const data = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(new Date(iso));
  const hoje = hojeIso();
  const [a, m, d] = hoje.split("-").map(Number);
  const amanha = new Date(Date.UTC(a, m - 1, d + 1)).toISOString().slice(0, 10);
  const dia = data === hoje ? "hoje" : data === amanha ? "amanhã" : formatarDiaComSemana(iso);
  return `abre ${dia} às ${formatarHora(iso)}`;
}

/**
 * Selo "Aberto agora / Fechado" (ícones diferentes). Clicar abre a caixa com os horários da semana.
 * Aberto: sucesso (5.42) · Fechado: erro (6.43). Atualiza a cada 5 min e ao voltar para a aba.
 * `sobreEscuro`: o selo fica sobre fundo escuro (banner do desktop), então o anel de foco do botão
 * continua laranja; a caixa de horários (fundo claro) sempre usa o anel café.
 */
export default function StatusLoja({ className = "", sobreEscuro = false }) {
  const [status, setStatus] = useState(undefined); // undefined = carregando · null = falhou
  const [semana, setSemana] = useState(null);
  const [hojeDia, setHojeDia] = useState(null);
  const dialogo = useRef(null);

  const atualizar = useCallback(async () => {
    const novo = await buscarStatusLoja();
    setStatus((atual) => novo ?? (atual === undefined ? null : atual)); // falha: mantém o último status
    setHojeDia(diaDaSemanaHoje());
  }, []);

  useEffect(() => {
    queueMicrotask(atualizar);
    const intervalo = setInterval(atualizar, CINCO_MIN);
    function aoVoltar() {
      if (document.visibilityState === "visible") atualizar();
    }
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [atualizar]);

  async function abrir() {
    dialogo.current.showModal();
    const dados = await buscarHorariosSemana(hojeIso());
    if (dados) setSemana(dados);
  }

  if (status === null) return null; // sem conexão com o banco: não mostra nada
  if (status === undefined) {
    return <span aria-hidden="true" className={`h-12 w-40 animate-pulse rounded-2xl bg-borda-suave ${className}`} />;
  }

  const aberta = status.aberta;
  const Icone = aberta ? IconeLojaAberta : IconeLojaFechada;
  const detalhe = aberta
    ? status.fecha_as
      ? `até ${status.fecha_as}`
      : null
    : status.proxima_abertura
      ? textoProximaAbertura(status.proxima_abertura)
      : "sem horário nos próximos dias";

  return (
    <>
      <span className={sobreEscuro ? "contents" : "fundo-claro contents"}>
      <button
        type="button"
        onClick={abrir}
        aria-haspopup="dialog"
        className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-left shadow-card ring-1 transition active:scale-[0.98] ${
          aberta ? "bg-sucesso-fundo text-sucesso ring-sucesso/30" : "bg-erro-fundo text-erro ring-erro/30"
        } ${className}`}
      >
        <Icone className="size-6 shrink-0" />
        <span className="min-w-0 leading-tight">
          <span className="block text-sm font-bold">{aberta ? "Aberto agora" : "Fechado"}</span>
          {detalhe && <span className="block text-sm font-medium">{detalhe}</span>}
        </span>
        <span className="sr-only">: ver horários da semana</span>
        <span aria-hidden="true" className="ml-auto pl-1 text-xl leading-none">
          ›
        </span>
      </button>
      </span>

      <span className="fundo-claro contents">

      <dialog
        ref={dialogo}
        aria-labelledby="titulo-horarios"
        onClick={(e) => e.target === dialogo.current && dialogo.current.close()}
        className="sheet m-auto w-[min(24rem,calc(100vw-2rem))] rounded-3xl bg-fundo p-0 text-texto"
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 id="titulo-horarios" className="traco-vinho font-titulo text-2xl text-ferrugem">
              <IconeRelogio className="mr-2 inline-block size-6 align-[-3px] text-cobre" />
              Horários
            </h2>
            <button
              type="button"
              onClick={() => dialogo.current.close()}
              aria-label="Fechar"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-superficie text-texto ring-1 ring-borda-input transition hover:bg-fundo"
            >
              <IconeFechar className="size-5" />
            </button>
          </div>

          <p className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${aberta ? "bg-sucesso-fundo text-sucesso" : "bg-erro-fundo text-erro"}`}>
            <Icone className="size-5 shrink-0" />
            {aberta ? "Aberto agora" : "Fechado agora"}
            {detalhe ? ` · ${detalhe}` : ""}
          </p>

          {semana ? (
            <ul className="mt-3 divide-y divide-borda-suave rounded-2xl bg-superficie text-sm ring-1 ring-borda-suave">
              {ORDEM_SEMANA.map((dia) => {
                const faixas = semana.dias[dia];
                const hoje = dia === hojeDia;
                const folgas = semana.fechados.filter((f) => new Date(`${f.data}T12:00:00-03:00`).getUTCDay() === dia);
                return (
                  <li key={dia} className={`px-4 py-2.5 ${hoje ? "bg-fundo" : ""}`}>
                    <div className="flex justify-between gap-3">
                      <span className={hoje ? "font-bold text-texto" : "text-texto-suave"}>
                        {DIAS_SEMANA[dia]}
                        {hoje && <span className="ml-2 rounded-full bg-vinho px-2 py-0.5 text-xs font-bold text-creme">Hoje</span>}
                      </span>
                      <span className={`text-right tabular-nums ${hoje ? "font-bold" : ""}`}>
                        {faixas.length ? faixas.map((f) => `${f.abre} – ${f.fecha}`).join(" · ") : "Fechado"}
                      </span>
                    </div>
                    {folgas.map((f) => (
                      <p key={f.data} className="mt-0.5 text-right text-sm font-semibold text-erro">
                        Fechado em {formatarDiaMes(`${f.data}T12:00:00-03:00`)}
                        {f.motivo ? ` (${f.motivo})` : ""}
                      </p>
                    ))}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-3 h-64 animate-pulse rounded-2xl bg-borda-suave" aria-busy="true" />
          )}
          <p className="mt-3 text-sm text-texto-suave">Fora do horário, você ainda pode agendar seu pedido.</p>
        </div>
      </dialog>
      </span>
    </>
  );
}
