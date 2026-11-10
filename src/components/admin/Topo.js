"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconeLojaAberta, IconeLojaFechada, IconeMais } from "@/components/icones";
import { definirSom, pedirNotificacao, permissaoNotificacao, somLigado } from "@/lib/admin/alertas";
import { agoraMs, dataEmBrasilia, dataHora } from "@/lib/admin/datas";
import { buscarStatusLoja, pausarLoja } from "@/lib/admin/pedidos";
import { formatarDiaComSemana, formatarHora } from "@/lib/formatar";
import { useAdmin } from "./AdminProvider";
import { IconePausa, IconePlay, IconeSair, IconeSino, IconeSom, IconeSomMudo } from "./icones";
import { useRelogio, useTempoReal } from "./TempoReal";
import { useToast } from "./Toasts";

/** Menu que abre embaixo de um botão (fecha com Esc ou clique fora). */
function MenuSuspenso({ rotulo, classeBotao, ariaLabel, children }) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    function fora(e) {
      if (!caixa.current?.contains(e.target)) setAberto(false);
    }
    function esc(e) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  return (
    <div ref={caixa} className="relative">
      <button type="button" aria-expanded={aberto} aria-label={ariaLabel} onClick={() => setAberto((a) => !a)} className={classeBotao}>
        {rotulo}
      </button>
      {aberto && (
        <div className="fundo-claro absolute right-0 top-full z-40 mt-2 w-64 rounded-2xl bg-superficie p-2 text-texto shadow-card ring-1 ring-borda-input">
          {children(() => setAberto(false))}
        </div>
      )}
    </div>
  );
}

const CLASSE_ITEM_MENU = "flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-[15px] font-semibold hover:bg-fundo";

function textoStatusLoja(s, agora) {
  if (!s) return null;
  if (s.pausado_ate && new Date(s.pausado_ate).getTime() > agora) {
    return { tipo: "pausada", texto: `Pausada até ${formatarHora(s.pausado_ate)}` };
  }
  if (s.aberta) return { tipo: "aberta", texto: s.fecha_as ? `Aberta até ${s.fecha_as}` : "Aberta" };
  if (s.proxima_abertura) {
    const hoje = dataEmBrasilia(s.proxima_abertura) === dataEmBrasilia(agora);
    const dia = hoje ? "hoje" : formatarDiaComSemana(s.proxima_abertura).split(",")[0];
    return { tipo: "fechada", texto: `Fechada · abre ${dia} ${formatarHora(s.proxima_abertura)}` };
  }
  return { tipo: "fechada", texto: "Fechada" };
}

const ESTILO_LOJA = {
  aberta: { classe: "bg-sucesso-fundo text-sucesso", Icone: IconeLojaAberta },
  pausada: { classe: "bg-aviso-fundo text-aviso-texto", Icone: IconePausa },
  fechada: { classe: "bg-cancelado-fundo text-texto-sec", Icone: IconeLojaFechada },
};

function IconeStatusLoja({ tipo }) {
  const Icone = ESTILO_LOJA[tipo].Icone;
  return <Icone className="size-4 shrink-0" />;
}

/** Status da loja + "Pausar pedidos" (UPDATE config_loja.pausado_ate). */
function StatusEPausa() {
  const { mostrar } = useToast();
  const agora = useRelogio(30000);
  const [loja, setLoja] = useState(null);

  const carregar = useCallback(() => {
    buscarStatusLoja()
      .then(setLoja)
      .catch(() => {});
  }, []);

  useEffect(() => {
    carregar();
    const intervalo = setInterval(carregar, 60000);
    return () => clearInterval(intervalo);
  }, [carregar]);

  const status = textoStatusLoja(loja, agora);
  const pausada = status?.tipo === "pausada";

  async function pausar(ateIso, texto) {
    try {
      await pausarLoja(ateIso);
      mostrar({ texto });
      carregar();
    } catch (erro) {
      mostrar({ tipo: "erro", texto: erro.message });
    }
  }

  const minutos = (m) => new Date(agoraMs() + m * 60000).toISOString();
  // Valores lidos uma vez, com checagem explícita de null (o React Compiler pode tornar
  // obrigatória uma leitura "loja.x" usada só dentro de um clique).
  const fechaAs = loja ? loja.fecha_as : null;
  const ateFechar = loja && loja.aberta && fechaAs ? dataHora(dataEmBrasilia(), fechaAs) : null;

  return (
    <>
      {status && (
        <p className={`fundo-claro inline-flex min-w-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-bold ${ESTILO_LOJA[status.tipo].classe}`}>
          <IconeStatusLoja tipo={status.tipo} />
          <span className="truncate">{status.texto}</span>
        </p>
      )}
      <MenuSuspenso
        ariaLabel={pausada ? "Pausa dos pedidos: retomar ou mudar" : "Pausar pedidos"}
        classeBotao="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-laranja px-3 text-sm font-bold text-cafe transition hover:bg-laranja-hover"
        rotulo={
          <>
            {pausada ? <IconePlay className="size-4" /> : <IconePausa className="size-4" />}
            <span className="hidden sm:inline">{pausada ? "Pausado" : "Pausar pedidos"}</span>
            <span className="sm:hidden">{pausada ? "Pausado" : "Pausar"}</span>
          </>
        }
      >
        {(fechar) => (
          <div>
            <p className="px-3 pb-1 pt-1 text-sm text-texto-suave">
              Enquanto pausado, o site só aceita agendamentos. Pedidos pelo painel continuam liberados.
            </p>
            {pausada && (
              <button
                type="button"
                className={`${CLASSE_ITEM_MENU} text-sucesso`}
                onClick={() => {
                  fechar();
                  pausar(null, "Pedidos retomados.");
                }}
              >
                <IconePlay className="size-5" /> Retomar agora
              </button>
            )}
            {[
              [15, "15 minutos"],
              [30, "30 minutos"],
              [60, "1 hora"],
            ].map(([m, rotulo]) => (
              <button
                key={m}
                type="button"
                className={CLASSE_ITEM_MENU}
                onClick={() => {
                  fechar();
                  const ate = minutos(m);
                  pausar(ate, `Pedidos pausados até ${formatarHora(ate)}.`);
                }}
              >
                <IconePausa className="size-5" /> Pausar {rotulo}
              </button>
            ))}
            <button
              type="button"
              disabled={!ateFechar}
              className={`${CLASSE_ITEM_MENU} disabled:cursor-not-allowed disabled:text-desabilitado`}
              onClick={() => {
                fechar();
                pausar(ateFechar, `Pedidos pausados até fechar (${fechaAs}).`);
              }}
            >
              <IconePausa className="size-5" /> Até fechar{fechaAs && !pausada ? ` (${fechaAs})` : ""}
            </button>
          </div>
        )}
      </MenuSuspenso>
    </>
  );
}

function AoVivo() {
  const { aoVivo } = useTempoReal();
  return (
    <p
      role="status"
      className={`fundo-claro inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-bold ${
        aoVivo ? "bg-sucesso-fundo text-sucesso" : "bg-cancelado-fundo text-texto-sec"
      }`}
    >
      <span aria-hidden="true" className={`size-2 rounded-full ${aoVivo ? "bg-sucesso" : "bg-texto-sec"}`} />
      <span className={aoVivo ? "hidden sm:inline" : ""}>{aoVivo ? "Ao vivo" : "Reconectando..."}</span>
      {aoVivo && <span className="sr-only sm:hidden">Ao vivo</span>}
    </p>
  );
}

/** Liga o som de pedido novo (precisa de um clique: o navegador bloqueia áudio automático). */
export function BotaoSom() {
  const { mostrar } = useToast();
  const [ligado, setLigado] = useState(somLigado);
  async function alternar() {
    const novo = !ligado;
    const tocou = await definirSom(novo);
    setLigado(novo);
    if (novo && !tocou) mostrar({ tipo: "aviso", texto: "O navegador bloqueou o som. Toque de novo para tentar." });
    else mostrar({ texto: novo ? "Som de pedido novo ligado." : "Som desligado." });
  }
  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={ligado}
      aria-label={ligado ? "Som de pedido novo ligado. Desligar" : "Ativar som de pedido novo"}
      className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-sm font-bold transition ${
        ligado ? "text-creme hover:bg-vinho" : "bg-creme text-cafe ring-2 ring-laranja"
      }`}
    >
      {ligado ? <IconeSom className="size-5" /> : <IconeSomMudo className="size-5" />}
      {!ligado && <span className="hidden md:inline">Ativar som</span>}
    </button>
  );
}

function MenuUsuario() {
  const { email, sair } = useAdmin();
  const [permissao, setPermissao] = useState(permissaoNotificacao);
  return (
    <MenuSuspenso
      ariaLabel="Menu da conta"
      classeBotao="grid size-10 shrink-0 place-items-center rounded-full bg-vinho font-bold uppercase text-creme ring-2 ring-creme"
      rotulo={(email ?? "?").slice(0, 1)}
    >
      {(fechar) => (
        <div>
          <p className="truncate px-3 py-2 text-sm text-texto-suave">{email}</p>
          {permissao === "default" && (
            <button
              type="button"
              className={CLASSE_ITEM_MENU}
              onClick={async () => {
                setPermissao(await pedirNotificacao());
                fechar();
              }}
            >
              <IconeSino className="size-5" /> Ativar notificações
            </button>
          )}
          <button type="button" className={`${CLASSE_ITEM_MENU} text-erro`} onClick={sair}>
            <IconeSair className="size-5" /> Sair
          </button>
        </div>
      )}
    </MenuSuspenso>
  );
}

/** Topo fixo do painel: status da loja, pausar, tempo real, som e conta. */
export default function Topo() {
  return (
    <header className="fundo-escuro sticky top-0 z-20 print:!hidden border-b-4 border-vinho bg-cafe text-creme">
      <div className="flex min-h-16 items-center gap-2 px-3 lg:px-6">
        <p className="mr-1 font-titulo text-lg lg:hidden">Painel</p>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <StatusEPausa />
        </div>
        <Link
          href="/admin/pedidos/novo"
          aria-label="Novo pedido"
          className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-xl bg-creme px-3 text-sm font-bold text-cafe transition hover:ring-2 hover:ring-laranja"
        >
          <IconeMais className="size-4" />
          <span className="hidden md:inline">Novo pedido</span>
        </Link>
        <AoVivo />
        <BotaoSom />
        <MenuUsuario />
      </div>
    </header>
  );
}
