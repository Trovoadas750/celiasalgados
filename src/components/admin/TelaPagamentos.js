"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AlertaErro } from "@/components/cliente/Campo";
import { IconeAlerta, IconeAmpulheta, IconeCheck, IconeWhatsappOficial } from "@/components/icones";
import { tempoPreparoMin } from "@/lib/admin/config";
import { agoraMs, dataEmBrasilia, somarDias } from "@/lib/admin/datas";
import { linkWhatsappCliente, mensagemExpirado, mensagemParaCliente } from "@/lib/admin/mensagens";
import {
  existemCobrancas,
  listarAguardando,
  listarEventos,
  listarExpiradosRecentes,
  listarPagos,
  listarPagosForaDoPrazo,
  PREFIXO_DEVOLVIDO,
} from "@/lib/admin/pagamentos";
import { adicionarAnotacao, POR_PAGINA_PADRAO } from "@/lib/admin/pedidos";
import { duracao, textoDiaHora } from "@/lib/admin/status";
import { formatarDataHora, formatarPreco, formatarValor } from "@/lib/formatar";
import { textoFormaPagamento } from "@/lib/mensagemWhatsapp";
import { useAdmin } from "./AdminProvider";
import { BadgeTipo } from "./Badges";
import { DialogoConfirmar } from "./Dialogo";
import { CLASSE_BOTAO_CONTORNO, CLASSE_BOTAO_ACAO, CLASSE_CAMPO, CLASSE_CHIP } from "./estilos";
import { IconeDinheiro } from "./icones";
import { DialogoConfirmarPagamento, DialogoReagendar, DialogoReativar } from "./pedidos/DialogosPedido";
import GavetaDetalhe, { usePedidoAberto } from "./pedidos/GavetaDetalhe";
import { usePedidosMudaram, useRelogio } from "./TempoReal";
import { useToast } from "./Toasts";

const ABAS = [
  { id: "aguardando", rotulo: "Aguardando" },
  { id: "expirados", rotulo: "Expirados (7 dias)" },
  { id: "pagos", rotulo: "Pagos" },
  { id: "online", rotulo: "Online (InfinitePay)", soComCobrancas: true },
];

function Vazio({ children }) {
  return <p className="rounded-2xl bg-superficie px-4 py-8 text-center font-semibold ring-1 ring-borda-suave">{children}</p>;
}

function Carregando() {
  return <div className="h-48 animate-pulse rounded-2xl bg-borda-suave" aria-busy="true" aria-label="Carregando" />;
}

/** Cabeçalho comum dos cards de pagamento. */
function Topo({ p, agora, aoAbrir }) {
  return (
    <button type="button" onClick={aoAbrir} className="w-full text-left">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-lg font-bold tabular-nums">nº {p.id}</span>
        <span className="font-semibold">
          {p.nome} {p.sobrenome}
        </span>
        <BadgeTipo tipo={p.tipo_entrega} />
        <span className="ml-auto text-xl font-bold text-ferrugem tabular-nums">{formatarPreco(Number(p.total))}</span>
      </span>
      {p.agendado_para && <span className="mt-1 block font-semibold">Agendado para {textoDiaHora(p.agendado_para, agora)}</span>}
    </button>
  );
}

function AbaAguardando({ lista, agora, aoAbrir, aoConfirmar }) {
  if (lista.length === 0) return <Vazio>Nenhum agendamento aguardando pagamento.</Vazio>;
  return (
    <ul className="space-y-3">
      {lista.map((p) => {
        const restante = Math.round((new Date(p.pagamento_expira_em).getTime() - agora) / 60000);
        const urgente = restante <= 30;
        return (
          <li key={p.id} className={`rounded-2xl bg-superficie p-4 ${urgente ? "ring-2 ring-erro" : "ring-1 ring-borda-suave"}`}>
            <Topo p={p} agora={agora} aoAbrir={() => aoAbrir(p.id)} />
            <p className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-bold ${urgente ? "bg-erro-fundo text-erro" : "bg-aviso-fundo text-aviso-texto"}`}>
              {urgente ? <IconeAlerta className="size-4" /> : <IconeAmpulheta className="size-4" />}
              {restante > 0 ? `Expira em ${duracao(restante)}` : "Prazo vencido (expira na próxima verificação)"}
              <span className="font-semibold"> · até {textoDiaHora(p.pagamento_expira_em, agora)}</span>
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <a
                href={linkWhatsappCliente(p.telefone, mensagemParaCliente("cobranca", p))}
                target="_blank"
                rel="noopener noreferrer"
                className={CLASSE_BOTAO_CONTORNO}
              >
                <IconeWhatsappOficial className="size-5" /> Cobrar no WhatsApp
              </a>
              <button type="button" onClick={() => aoConfirmar(p)} className={CLASSE_BOTAO_ACAO}>
                <IconeDinheiro className="size-5" /> Confirmar pagamento
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function AbaExpirados({ lista, agora, aoAbrir, aoReativar }) {
  if (lista.length === 0) return <Vazio>Nenhum agendamento expirou nos últimos 7 dias.</Vazio>;
  return (
    <ul className="space-y-3">
      {lista.map((p) => (
        <li key={p.id} className="rounded-2xl bg-superficie p-4 ring-1 ring-borda-suave">
          <Topo p={p} agora={agora} aoAbrir={() => aoAbrir(p.id)} />
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-erro-fundo px-2.5 py-1 text-sm font-bold text-erro">
            <IconeAlerta className="size-4" /> Expirou em {formatarDataHora(p.pagamento_expira_em)}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <a href={linkWhatsappCliente(p.telefone, mensagemExpirado(p))} target="_blank" rel="noopener noreferrer" className={CLASSE_BOTAO_CONTORNO}>
              <IconeWhatsappOficial className="size-5" /> Avisar cliente
            </a>
            <button type="button" onClick={() => aoReativar(p)} className={CLASSE_BOTAO_CONTORNO}>
              Reativar
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

const PERIODOS = [
  ["hoje", "Hoje"],
  ["7dias", "Últimos 7 dias"],
  ["mes", "Este mês"],
  ["intervalo", "Escolher datas"],
];

function intervaloDoPeriodo(periodo, de, ate, hoje) {
  if (periodo === "7dias") return [somarDias(hoje, -6), hoje];
  if (periodo === "mes") return [`${hoje.slice(0, 8)}01`, hoje];
  if (periodo === "intervalo" && de) return [de, ate || de];
  return [hoje, hoje];
}

function AbaPagos({ sp, ir, agora, aoAbrir, versao }) {
  const hoje = dataEmBrasilia(agora);
  const periodo = PERIODOS.some(([id]) => id === sp.get("periodo")) ? sp.get("periodo") : "7dias";
  const [de, ate] = intervaloDoPeriodo(periodo, sp.get("de"), sp.get("ate"), hoje);
  const pagina = Math.max(0, Number.parseInt(sp.get("pagina") ?? "0", 10) || 0);
  const [dados, setDados] = useState({ chave: null, pedidos: [], total: 0, erro: null });
  const chave = `${de}|${ate}|${pagina}|${versao}`;

  useEffect(() => {
    let ativo = true;
    const [d, a, pg] = chave.split("|");
    listarPagos({ de: d, ate: a, pagina: Number(pg) })
      .then((r) => ativo && setDados({ chave, ...r, erro: null }))
      .catch((e) => ativo && setDados({ chave, pedidos: [], total: 0, erro: e.message }));
    return () => {
      ativo = false;
    };
  }, [chave]);

  const totalPaginas = Math.max(1, Math.ceil(dados.total / POR_PAGINA_PADRAO));
  const soma = dados.pedidos.reduce((s, p) => s + Number(p.total), 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PERIODOS.map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            aria-pressed={periodo === id}
            onClick={() => ir({ periodo: id, pagina: null })}
            className={`${CLASSE_CHIP} ${periodo === id ? "bg-ferrugem text-white" : "bg-superficie text-texto ring-1 ring-borda-input hover:ring-ferrugem"}`}
          >
            {rotulo}
          </button>
        ))}
      </div>
      {periodo === "intervalo" && (
        <div className="grid max-w-md grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">De</span>
            <input type="date" value={sp.get("de") ?? ""} onChange={(e) => ir({ de: e.target.value, pagina: null })} className={CLASSE_CAMPO} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Até</span>
            <input type="date" value={sp.get("ate") ?? ""} onChange={(e) => ir({ ate: e.target.value, pagina: null })} className={CLASSE_CAMPO} />
          </label>
        </div>
      )}
      {dados.erro ? (
        <AlertaErro>{dados.erro}</AlertaErro>
      ) : dados.chave !== chave ? (
        <Carregando />
      ) : dados.pedidos.length === 0 ? (
        <Vazio>Nenhum pagamento confirmado nesse período.</Vazio>
      ) : (
        <>
          <p className="text-sm text-texto-suave">
            {dados.total} pagamento(s){totalPaginas === 1 ? ` · ${formatarPreco(soma)}` : ""}
          </p>
          <ul className="divide-y divide-borda-suave rounded-2xl bg-superficie ring-1 ring-borda-suave">
            {dados.pedidos.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => aoAbrir(p.id)} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left hover:bg-fundo">
                  <span className="inline-flex items-center gap-1 font-bold text-sucesso">
                    <IconeCheck className="size-4" /> nº {p.id}
                  </span>
                  <span className="font-semibold">
                    {p.nome} {p.sobrenome}
                  </span>
                  <span className="text-sm text-texto-suave">
                    {textoFormaPagamento({ forma: p.forma_pagamento, trocoPara: p.troco_para, agendadoPara: p.agendado_para, tipoEntrega: p.tipo_entrega })}
                    {p.pagamento_referencia ? ` · ${p.pagamento_referencia}` : ""}
                  </span>
                  <span className="text-sm text-texto-suave">pago em {formatarDataHora(p.pago_em)}</span>
                  <span className="ml-auto font-bold text-ferrugem tabular-nums">{formatarPreco(Number(p.total))}</span>
                </button>
              </li>
            ))}
          </ul>
          {totalPaginas > 1 && (
            <nav aria-label="Páginas" className="flex items-center justify-between gap-2">
              <button type="button" disabled={pagina === 0} onClick={() => ir({ pagina: pagina - 1 || null })} className={CLASSE_BOTAO_CONTORNO}>
                Anterior
              </button>
              <p className="text-sm text-texto-suave">
                Página {pagina + 1} de {totalPaginas}
              </p>
              <button type="button" disabled={pagina + 1 >= totalPaginas} onClick={() => ir({ pagina: pagina + 1 })} className={CLASSE_BOTAO_CONTORNO}>
                Próxima
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

/** Pagamento online (InfinitePay): pagos fora do prazo, erros e log. Só leitura + devolução por anotação. */
function AbaOnline({ agora, aoAbrir, aoReativar, versao, aoMudou }) {
  const { mostrar } = useToast();
  const [dados, setDados] = useState({ versao: null, fora: [], erros: [], erro: null });
  const [log, setLog] = useState({ pagina: 0, eventos: [], total: 0, carregado: false });
  const [devolvendo, setDevolvendo] = useState(null);

  useEffect(() => {
    let ativo = true;
    Promise.all([listarPagosForaDoPrazo(), listarEventos({ soErros: true })])
      .then(([fora, erros]) => ativo && setDados({ versao, fora, erros: erros.eventos.slice(0, 10), erro: null }))
      .catch((e) => ativo && setDados({ versao, fora: [], erros: [], erro: e.message }));
    return () => {
      ativo = false;
    };
  }, [versao]);

  useEffect(() => {
    let ativo = true;
    listarEventos({ pagina: log.pagina })
      .then((r) => ativo && setLog((l) => ({ ...l, ...r, carregado: true })))
      .catch(() => ativo && setLog((l) => ({ ...l, carregado: true })));
    return () => {
      ativo = false;
    };
  }, [log.pagina]);

  if (dados.erro) return <AlertaErro>{dados.erro}</AlertaErro>;
  if (dados.versao !== versao) return <Carregando />;
  const totalPaginasLog = Math.max(1, Math.ceil(log.total / POR_PAGINA_PADRAO));

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-lg font-bold">Pagos fora do prazo</h2>
        <p className="mb-3 text-sm text-texto-suave">
          O cliente pagou depois que o agendamento expirou. O pedido não volta sozinho: reative ou devolva o dinheiro.
        </p>
        {dados.fora.length === 0 ? (
          <Vazio>Nenhum.</Vazio>
        ) : (
          <ul className="space-y-3">
            {dados.fora.map((c) => {
              const p = c.pedidos;
              const devolvido = (p?.anotacoes_pedido ?? []).some((a) => a.texto.startsWith(PREFIXO_DEVOLVIDO));
              return (
                <li key={c.id} className="rounded-2xl bg-superficie p-4 ring-2 ring-aviso-texto">
                  {p && <Topo p={p} agora={agora} aoAbrir={() => aoAbrir(p.id)} />}
                  <p className="mt-1 text-sm">
                    Pago em {formatarDataHora(c.paga_em)} · R$ {formatarValor(c.valor_pago_centavos / 100)} ·{" "}
                    {c.capture_method === "pix" ? "Pix" : "Cartão de crédito"}
                    {c.receipt_url && (
                      <>
                        {" · "}
                        <a href={c.receipt_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-link underline underline-offset-4">
                          comprovante
                        </a>
                      </>
                    )}
                  </p>
                  {devolvido ? (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sucesso-fundo px-2.5 py-1 text-sm font-bold text-sucesso">
                      <IconeCheck className="size-4" /> Marcado como devolvido
                    </p>
                  ) : (
                    p && (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <button type="button" onClick={() => aoReativar(p)} className={CLASSE_BOTAO_CONTORNO}>
                          Reativar
                        </button>
                        <button type="button" onClick={() => setDevolvendo(c)} className={CLASSE_BOTAO_CONTORNO}>
                          Marcar como devolvido
                        </button>
                      </div>
                    )
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Avisos de erro (ex.: valor divergente)</h2>
        {dados.erros.length === 0 ? (
          <Vazio>Nenhum erro registrado.</Vazio>
        ) : (
          <ul className="space-y-2">
            {dados.erros.map((e) => (
              <li key={e.id} className="flex items-start gap-2 rounded-xl bg-erro-fundo px-3 py-2.5 text-sm text-erro">
                <IconeAlerta className="mt-px size-5 shrink-0" />
                <span>
                  <strong>{formatarDataHora(e.recebido_em)}</strong>
                  {e.pedido_id ? ` · pedido nº ${e.pedido_id}` : ""} · {e.resultado ?? "erro"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Log de pagamento (somente leitura)</h2>
        {!log.carregado ? (
          <Carregando />
        ) : log.eventos.length === 0 ? (
          <Vazio>Nenhum evento.</Vazio>
        ) : (
          <>
            <ul className="divide-y divide-borda-suave rounded-2xl bg-superficie ring-1 ring-borda-suave">
              {log.eventos.map((e) => (
                <li key={e.id} className="px-4 py-2.5 text-sm">
                  <details>
                    <summary className="cursor-pointer">
                      <strong>{formatarDataHora(e.recebido_em)}</strong> · {e.origem}
                      {e.pedido_id ? ` · nº ${e.pedido_id}` : ""} · {e.resultado ?? "—"}
                    </summary>
                    <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-fundo p-2 text-xs">{JSON.stringify(e.payload, null, 2)}</pre>
                  </details>
                </li>
              ))}
            </ul>
            {totalPaginasLog > 1 && (
              <nav aria-label="Páginas do log" className="mt-2 flex items-center justify-between gap-2">
                <button type="button" disabled={log.pagina === 0} onClick={() => setLog((l) => ({ ...l, pagina: l.pagina - 1 }))} className={CLASSE_BOTAO_CONTORNO}>
                  Anterior
                </button>
                <p className="text-sm text-texto-suave">
                  Página {log.pagina + 1} de {totalPaginasLog}
                </p>
                <button
                  type="button"
                  disabled={log.pagina + 1 >= totalPaginasLog}
                  onClick={() => setLog((l) => ({ ...l, pagina: l.pagina + 1 }))}
                  className={CLASSE_BOTAO_CONTORNO}
                >
                  Próxima
                </button>
              </nav>
            )}
          </>
        )}
      </section>

      <DialogoConfirmar
        aberto={Boolean(devolvendo)}
        aoFechar={() => setDevolvendo(null)}
        titulo="Marcar como devolvido"
        rotuloConfirmar="Marcar como devolvido"
        aoConfirmar={async () => {
          const c = devolvendo;
          if (!c) return;
          await adicionarAnotacao(c.pedido_id, `${PREFIXO_DEVOLVIDO} ao cliente (R$ ${formatarValor(c.valor_pago_centavos / 100)}, cobrança ${c.id}).`);
          mostrar({ texto: "Devolução anotada no pedido." });
          aoMudou();
        }}
      >
        Confirme só depois de devolver o dinheiro pela InfinitePay. Fica uma anotação interna no pedido.
      </DialogoConfirmar>
    </div>
  );
}

export default function TelaPagamentos() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { sessaoExpirou } = useAdmin();
  const { mostrar } = useToast();
  const agora = useRelogio(30000);
  const [tempoMin] = useState(tempoPreparoMin);
  const [versao, setVersao] = useState(0);
  const recarregar = useCallback(() => setVersao((v) => v + 1), []);
  usePedidosMudaram(recarregar);
  const detalhe = usePedidoAberto();
  const [comCobrancas, setComCobrancas] = useState(false);
  const [dados, setDados] = useState({ versao: null, aguardando: [], expirados: [], erro: null });
  const [dialogo, setDialogo] = useState(null); // { tipo: "pagamento" | "reativar" | "reagendar", pedido }

  const aba = ABAS.some((a) => a.id === sp.get("aba")) ? sp.get("aba") : "aguardando";

  useEffect(() => {
    existemCobrancas().then(setComCobrancas);
  }, []);

  useEffect(() => {
    let ativo = true;
    Promise.all([listarAguardando(), listarExpiradosRecentes(agoraMs())])
      .then(([aguardando, expirados]) => ativo && setDados({ versao, aguardando, expirados, erro: null }))
      .catch((e) => {
        if (!ativo) return;
        if (e.sessaoExpirada) sessaoExpirou();
        setDados({ versao, aguardando: [], expirados: [], erro: e.message });
      });
    return () => {
      ativo = false;
    };
  }, [versao, sessaoExpirou]);

  function ir(mudancas) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(mudancas)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
  }

  function concluir(texto) {
    setDialogo(null);
    if (texto) mostrar({ texto });
    recarregar();
  }

  // Lidos com checagem explícita (dialogo = null quando fechado; ver admin/Topo.js: React Compiler).
  const dialogoTipo = dialogo ? dialogo.tipo : null;
  const dialogoPedido = dialogo ? dialogo.pedido : null;
  const carregando = dados.versao === null;
  const contagem = { aguardando: dados.aguardando.length, expirados: dados.expirados.length };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="traco-vinho font-titulo text-[28px] leading-tight text-ferrugem">Pagamentos</h1>
      <p className="mt-1 text-sm text-texto-suave">Agendamentos são pagos antes, combinados pelo WhatsApp. Confirme aqui quando o dinheiro cair.</p>

      <nav aria-label="Abas de pagamentos" className="-mx-3 mt-4 overflow-x-auto px-3 pb-1 lg:mx-0 lg:px-0">
        <ul className="flex gap-2">
          {ABAS.filter((a) => !a.soComCobrancas || comCobrancas).map((a) => (
            <li key={a.id}>
              <button
                type="button"
                aria-current={aba === a.id ? "page" : undefined}
                onClick={() => ir({ aba: a.id === "aguardando" ? null : a.id, pagina: null, periodo: null, de: null, ate: null })}
                className={`${CLASSE_CHIP} ${aba === a.id ? "bg-ferrugem text-white" : "bg-superficie text-texto ring-1 ring-borda-input hover:ring-ferrugem"}`}
              >
                {a.rotulo}
                {contagem[a.id] != null && !carregando && (
                  <span className={`min-w-6 rounded-full px-1.5 text-center text-xs font-bold ${aba === a.id ? "bg-superficie text-ferrugem" : "bg-fundo"}`}>
                    {contagem[a.id]}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-4">
        {dados.erro && <AlertaErro>{dados.erro}</AlertaErro>}
        {aba === "aguardando" &&
          (carregando ? (
            <Carregando />
          ) : (
            <AbaAguardando lista={dados.aguardando} agora={agora} aoAbrir={detalhe.abrir} aoConfirmar={(p) => setDialogo({ tipo: "pagamento", pedido: p })} />
          ))}
        {aba === "expirados" &&
          (carregando ? (
            <Carregando />
          ) : (
            <AbaExpirados lista={dados.expirados} agora={agora} aoAbrir={detalhe.abrir} aoReativar={(p) => setDialogo({ tipo: "reativar", pedido: p })} />
          ))}
        {aba === "pagos" && <AbaPagos sp={sp} ir={ir} agora={agora} aoAbrir={detalhe.abrir} versao={versao} />}
        {aba === "online" && comCobrancas && (
          <AbaOnline agora={agora} aoAbrir={detalhe.abrir} aoReativar={(p) => setDialogo({ tipo: "reativar", pedido: p })} versao={versao} aoMudou={recarregar} />
        )}
      </div>

      {dialogoTipo === "pagamento" && (
        <DialogoConfirmarPagamento pedido={dialogoPedido} aberto aoFechar={() => setDialogo(null)} aoConcluir={concluir} />
      )}
      {dialogoTipo === "reativar" && (
        <DialogoReativar
          pedido={dialogoPedido}
          aberto
          aoFechar={() => setDialogo(null)}
          aoConcluir={concluir}
          aoReagendar={() => setDialogo({ tipo: "reagendar", pedido: dialogoPedido })}
        />
      )}
      {dialogoTipo === "reagendar" && <DialogoReagendar pedido={dialogoPedido} aberto aoFechar={() => setDialogo(null)} aoConcluir={concluir} />}

      <GavetaDetalhe id={detalhe.id} aoFechar={detalhe.fechar} versao={versao} agora={agora} tempoMin={tempoMin} aoMudou={recarregar} />
    </div>
  );
}
