"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AlertaErro } from "@/components/cliente/Campo";
import { POR_PAGINA, tempoPreparoMin } from "@/lib/admin/config";
import { baixarCsv, gerarCsv, valorCsv } from "@/lib/admin/csv";
import { agoraMs, dataEmBrasilia } from "@/lib/admin/datas";
import { ABAS, contarAbas, listarParaCsv, listarPedidos } from "@/lib/admin/pedidos";
import { horaAlvo, proximoStatus, rotuloPagamento, rotuloStatus, STATUS_OPCOES } from "@/lib/admin/status";
import { formatarTelefone } from "@/lib/formatar";
import { textoFormaPagamento } from "@/lib/mensagemWhatsapp";
import { useAdmin } from "../AdminProvider";
import { CLASSE_BOTAO_CONTORNO, CLASSE_CAMPO } from "../estilos";
import { IconeAtualizar, IconeBaixar, IconeImpressora } from "../icones";
import { usePedidosMudaram, useRelogio, useTempoReal } from "../TempoReal";
import { useToast } from "../Toasts";
import CardPedidoAdmin, { CarregandoCards } from "./CardPedidoAdmin";
import DetalhePedido from "./DetalhePedido";
import { AbasPedidos, BotaoFiltros, BuscaPedidos, PainelFiltros } from "./FiltrosPedidos";
import { contarFiltros, lerEstado, montarQuery, CHAVES_FILTRO } from "./url";
import { useMudarStatus } from "./useAcoesStatus";

const VAZIO = {
  para_sair: "Nada para sair agora.",
  atrasados: "Nenhum pedido atrasado.",
  agendados: "Nenhum agendamento futuro.",
  aguardando: "Nenhum agendamento aguardando pagamento.",
  hoje: "Nenhum pedido hoje.",
  finalizados: "Nenhum pedido finalizado.",
  cancelados: "Nenhum pedido cancelado.",
  todos: "Nenhum pedido ainda.",
};

const dataHoraCsv = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

function colunasCsv(tempoMin) {
  return [
    { titulo: "Nº", valor: (p) => p.id },
    { titulo: "Feito em", valor: (p) => dataHoraCsv.format(new Date(p.criado_em)) },
    { titulo: "Hora-alvo", valor: (p) => dataHoraCsv.format(horaAlvo(p, tempoMin)) },
    { titulo: "Quando", valor: (p) => (p.agendado_para ? "Agendado" : "O quanto antes") },
    { titulo: "Cliente", valor: (p) => `${p.nome} ${p.sobrenome}` },
    { titulo: "Telefone", valor: (p) => formatarTelefone(p.telefone) },
    { titulo: "Tipo", valor: (p) => (p.tipo_entrega === "retirada" ? "Retirada" : "Entrega") },
    {
      titulo: "Endereço",
      valor: (p) =>
        p.tipo_entrega === "entrega" ? `${p.rua}, ${p.numero} - ${p.vila}${p.ponto_referencia ? ` (ref.: ${p.ponto_referencia})` : ""}` : "",
    },
    {
      titulo: "Itens",
      valor: (p) =>
        (p.itens_pedido ?? [])
          .map(
            (i) =>
              `${i.quantidade}x ${i.nome_produto}${i.modo ? ` [${i.modo}]` : ""}${
                i.itens_pedido_conteudo?.length ? `: ${i.itens_pedido_conteudo.map((c) => `${c.quantidade} ${c.nome_produto}`).join(", ")}` : ""
              }`,
          )
          .join(" | "),
    },
    { titulo: "Frete", valor: (p) => valorCsv(p.taxa_entrega) },
    { titulo: "Total", valor: (p) => valorCsv(p.total) },
    {
      titulo: "Pagamento",
      valor: (p) =>
        `${textoFormaPagamento({ forma: p.forma_pagamento, trocoPara: p.troco_para, agendadoPara: p.agendado_para, tipoEntrega: p.tipo_entrega })} · ${rotuloPagamento(p.pagamento_status, p.tipo_entrega) ?? ""}`,
    },
    { titulo: "Status", valor: (p) => rotuloStatus(p.status, p.tipo_entrega) },
    { titulo: "Origem", valor: (p) => (p.origem === "admin" ? "Painel" : "Site") },
  ];
}

/** Barra das ações em lote (aparece com pedidos selecionados). */
function AcoesLote({ selecionados, aoMudarStatus, aoLimpar }) {
  const [novo, setNovo] = useState("");
  const ids = selecionados.map((p) => p.id);
  return (
    <div
      role="region"
      aria-label="Ações em lote"
      className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-cafe p-3 text-creme shadow-card lg:bottom-4"
    >
      <p className="mr-auto font-bold">{ids.length} selecionado(s)</p>
      <div className="fundo-claro flex gap-2">
        <label className="sr-only" htmlFor="lote-status">
          Mudar status dos selecionados para
        </label>
        <select id="lote-status" value={novo} onChange={(e) => setNovo(e.target.value)} className={`${CLASSE_CAMPO} h-11 w-44`}>
          <option value="">Mudar status…</option>
          {STATUS_OPCOES.filter((s) => s.id !== "cancelado").map((s) => (
            <option key={s.id} value={s.id}>
              {s.rotulo}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!novo}
          onClick={async () => {
            if (await aoMudarStatus(novo)) setNovo("");
          }}
          className="h-11 rounded-xl bg-laranja px-3 text-sm font-bold text-cafe hover:bg-laranja-hover disabled:cursor-not-allowed disabled:bg-superficie disabled:text-desabilitado"
        >
          Aplicar
        </button>
      </div>
      <button
        type="button"
        onClick={() => window.open(`/admin/imprimir?ids=${ids.join(",")}`, "_blank")}
        className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-creme px-3 text-sm font-bold text-cafe"
      >
        <IconeImpressora className="size-5" /> Imprimir comandas
      </button>
      <button type="button" onClick={aoLimpar} className="h-11 px-2 text-sm font-semibold text-creme underline underline-offset-4">
        Limpar seleção
      </button>
    </div>
  );
}

export default function PaginaPedidos() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { aba, pagina, pedido: pedidoAberto, filtros } = lerEstado(sp);
  const { vistos, marcarAberto } = useTempoReal();
  const { sessaoExpirou } = useAdmin();
  const { mostrar } = useToast();
  const [tempoMin] = useState(tempoPreparoMin);
  const agora = useRelogio(30000);

  const [versao, setVersao] = useState(0);
  const recarregar = useCallback(() => setVersao((v) => v + 1), []);
  usePedidosMudaram(recarregar);
  const { mudar, mudarVarios } = useMudarStatus(recarregar);

  const [lista, setLista] = useState({ chave: null, pedidos: [], total: 0, erro: null });
  const [contagens, setContagens] = useState({});
  const [selecionados, setSelecionados] = useState({}); // id -> pedido
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [exportando, setExportando] = useState(false);

  const chave = JSON.stringify([aba, filtros, pagina]);

  // Lista da aba atual (recarrega com o tempo real).
  useEffect(() => {
    let ativo = true;
    const [abaAtual, filtrosAtuais, paginaAtual] = JSON.parse(chave);
    listarPedidos({ aba: abaAtual, filtros: filtrosAtuais, pagina: paginaAtual, agora: agoraMs(), tempoMin })
      .then((r) => ativo && setLista({ chave, ...r, erro: null }))
      .catch((erro) => {
        if (!ativo) return;
        if (erro.sessaoExpirada) sessaoExpirou();
        setLista((atual) => ({ ...atual, chave, erro: erro.message }));
      });
    return () => {
      ativo = false;
    };
  }, [chave, versao, tempoMin, sessaoExpirou]);

  // Contadores das abas (e a cada minuto, para "Atrasados" subir sozinho).
  useEffect(() => {
    let ativo = true;
    const contar = () =>
      contarAbas({ agora: agoraMs(), tempoMin })
        .then((c) => ativo && setContagens(c))
        .catch(() => {});
    contar();
    const intervalo = setInterval(contar, 60000);
    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [versao, tempoMin]);

  // Pedido aberto pela URL (ex.: "Abrir" no aviso de pedido novo) conta como visto.
  useEffect(() => {
    if (pedidoAberto) marcarAberto(pedidoAberto);
  }, [pedidoAberto, marcarAberto]);

  const navegar = useCallback(
    (mudancas, { empurrar = false } = {}) => {
      const query = montarQuery(sp, mudancas);
      const url = query ? `${pathname}?${query}` : pathname;
      if (empurrar) router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    },
    [sp, pathname, router],
  );

  const mudarBusca = useCallback((busca) => navegar({ busca }), [navegar]);

  function limparFiltros() {
    navegar(Object.fromEntries(CHAVES_FILTRO.map((k) => [k, null])));
  }

  async function exportar() {
    setExportando(true);
    try {
      const pedidos = await listarParaCsv({ aba, filtros, agora: agoraMs(), tempoMin });
      baixarCsv(`pedidos-${aba}-${dataEmBrasilia()}.csv`, gerarCsv(colunasCsv(tempoMin), pedidos));
      mostrar({ texto: `${pedidos.length} pedido(s) exportado(s).` });
    } catch (erro) {
      mostrar({ tipo: "erro", texto: erro.message });
    }
    setExportando(false);
  }

  const carregando = lista.chave !== chave;
  const totalPaginas = Math.max(1, Math.ceil(lista.total / POR_PAGINA));
  const qtdFiltros = contarFiltros(filtros);
  const listaSelecionados = Object.values(selecionados);

  function alternarSelecao(p) {
    setSelecionados((atual) => {
      const novo = { ...atual };
      if (novo[p.id]) delete novo[p.id];
      else novo[p.id] = p;
      return novo;
    });
  }

  return (
    <div className="lg:flex lg:items-start lg:gap-5">
      <section className="min-w-0 flex-1">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h1 className="traco-vinho font-titulo text-[28px] leading-tight text-ferrugem">Pedidos</h1>
          <div className="flex gap-2">
            <button type="button" onClick={recarregar} className={CLASSE_BOTAO_CONTORNO} aria-label="Atualizar lista">
              <IconeAtualizar className="size-5" />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button type="button" onClick={exportar} disabled={exportando} className={CLASSE_BOTAO_CONTORNO}>
              <IconeBaixar className="size-5" />
              <span className="hidden sm:inline">{exportando ? "Exportando…" : "Exportar CSV"}</span>
              <span className="sm:hidden">CSV</span>
            </button>
          </div>
        </div>

        <AbasPedidos aba={aba} contagens={contagens} aoEscolher={(id) => navegar({ aba: id })} />

        <div className="mt-3 flex gap-2">
          <BuscaPedidos valor={filtros.busca} aoMudar={mudarBusca} />
          <BotaoFiltros aberto={filtrosAbertos} quantidade={qtdFiltros} onClick={() => setFiltrosAbertos((v) => !v)} />
        </div>
        {filtrosAbertos && (
          <div className="mt-3">
            <PainelFiltros filtros={filtros} aoMudar={navegar} aoLimpar={limparFiltros} />
          </div>
        )}

        <p className="sr-only" aria-live="polite">
          {carregando ? "Carregando pedidos" : `${lista.total} pedido(s) em ${ABAS.find((a) => a.id === aba)?.rotulo}`}
        </p>

        <div className="mt-4">
          {lista.erro && !carregando ? (
            <AlertaErro>{lista.erro}</AlertaErro>
          ) : carregando ? (
            <CarregandoCards />
          ) : lista.pedidos.length === 0 ? (
            <div className="rounded-2xl bg-superficie px-4 py-10 text-center ring-1 ring-borda-suave">
              <p className="font-semibold">{qtdFiltros || filtros.busca ? "Nenhum pedido com esses filtros." : VAZIO[aba]}</p>
              {(qtdFiltros > 0 || filtros.busca) && (
                <button type="button" onClick={limparFiltros} className="mt-2 text-sm font-semibold text-link underline underline-offset-4">
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <ul className="space-y-3">
              {lista.pedidos.map((p) => (
                <li key={p.id}>
                  <CardPedidoAdmin
                    pedido={p}
                    agora={agora}
                    tempoMin={tempoMin}
                    novo={p.status === "novo" && !vistos.has(p.id)}
                    aberto={p.id === pedidoAberto}
                    selecionado={Boolean(selecionados[p.id])}
                    aoSelecionar={() => alternarSelecao(p)}
                    aoAbrir={() => {
                      marcarAberto(p.id);
                      navegar({ pedido: p.id }, { empurrar: !pedidoAberto });
                    }}
                    aoAvancar={() => mudar(p, proximoStatus(p.status))}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {!carregando && totalPaginas > 1 && (
          <nav aria-label="Páginas" className="mt-4 flex items-center justify-between gap-2">
            <button type="button" disabled={pagina === 0} onClick={() => navegar({ pagina: pagina - 1 || null })} className={CLASSE_BOTAO_CONTORNO}>
              Anterior
            </button>
            <p className="text-sm text-texto-suave">
              Página {pagina + 1} de {totalPaginas} · {lista.total} pedidos
            </p>
            <button type="button" disabled={pagina + 1 >= totalPaginas} onClick={() => navegar({ pagina: pagina + 1 })} className={CLASSE_BOTAO_CONTORNO}>
              Próxima
            </button>
          </nav>
        )}

        {listaSelecionados.length > 0 && (
          <AcoesLote
            selecionados={listaSelecionados}
            aoLimpar={() => setSelecionados({})}
            aoMudarStatus={async (novo) => {
              const ok = await mudarVarios(listaSelecionados, novo);
              if (ok) setSelecionados({});
              return ok;
            }}
          />
        )}
      </section>

      {pedidoAberto && (
        <aside
          aria-label={`Detalhe do pedido nº ${pedidoAberto}`}
          className="fixed inset-0 z-40 overflow-y-auto bg-fundo lg:sticky lg:top-20 lg:z-auto lg:max-h-[calc(100dvh-6rem)] lg:w-[30rem] lg:shrink-0 lg:rounded-2xl lg:ring-1 lg:ring-borda-suave xl:w-[34rem]"
        >
          <DetalhePedido
            key={pedidoAberto}
            id={pedidoAberto}
            versao={versao}
            agora={agora}
            tempoMin={tempoMin}
            aoMudou={recarregar}
            aoFechar={() => navegar({ pedido: null })}
          />
        </aside>
      )}
    </div>
  );
}
