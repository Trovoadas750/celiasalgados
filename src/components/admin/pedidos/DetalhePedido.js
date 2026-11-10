"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import LinhaDoTempo from "@/components/LinhaDoTempo";
import { AlertaErro } from "@/components/cliente/Campo";
import { IconeAlerta, IconeLapis, IconeWhatsappOficial } from "@/components/icones";
import { linkLigar, linkWhatsappCliente, resumoPedidoTexto } from "@/lib/admin/mensagens";
import { adicionarAnotacao, buscarPedido, buscarResumoCliente, desbloquearTelefone, excluirPedido, mudarStatus } from "@/lib/admin/pedidos";
import {
  finalizado,
  proximoStatus,
  rotuloAcaoProximo,
  rotuloStatus,
  statusAnterior,
  textoDiaHora,
  textoHoraAlvo,
  urgencia,
} from "@/lib/admin/status";
import { formatarDataHora, formatarPreco, formatarTelefone, formatarValor } from "@/lib/formatar";
import { textoFormaPagamento } from "@/lib/mensagemWhatsapp";
import { useAdmin } from "../AdminProvider";
import { BadgeModo, BadgeOrigem, BadgePagamento, BadgeStatus, BadgeTipo, BadgeUrgencia } from "../Badges";
import { DialogoConfirmar } from "../Dialogo";
import { CLASSE_BOTAO_ACAO, CLASSE_BOTAO_CONTORNO, CLASSE_BOTAO_PERIGO, CLASSE_BOTAO_PRINCIPAL } from "../estilos";
import {
  IconeAtualizar,
  IconeBloqueio,
  IconeCalendario,
  IconeCopiar,
  IconeDesfazer,
  IconeDinheiro,
  IconeImpressora,
  IconeLink,
  IconeLixeira,
  IconeMapa,
  IconeNota,
  IconePlay,
  IconeTelefone,
  IconeVoltar,
} from "../icones";
import { useToast } from "../Toasts";
import {
  DialogoBloquear,
  DialogoCancelar,
  DialogoConfirmarPagamento,
  DialogoEditar,
  DialogoReagendar,
  DialogoReativar,
  DialogoWhatsapp,
} from "./DialogosPedido";
import { linkDoPedido, useMudarStatus } from "./useAcoesStatus";

function Secao({ titulo, children, className = "" }) {
  return (
    <section className={`rounded-2xl bg-superficie p-4 ring-1 ring-borda-suave ${className}`}>
      {titulo && <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-texto-suave">{titulo}</h3>}
      {children}
    </section>
  );
}

function linkMapa(p) {
  const endereco = `${p.rua}, ${p.numero} - ${p.vila}, Ourinhos - SP${p.cep ? `, ${p.cep}` : ""}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
}

async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detalhe do pedido: painel ao lado no computador, tela cheia no celular.
 * @param {{ id: number, versao: number, agora: number, tempoMin: number, aoFechar: () => void, aoMudou: () => void }} props
 */
export default function DetalhePedido({ id, versao, agora, tempoMin, aoFechar, aoMudou }) {
  const { mostrar } = useToast();
  const { sessaoExpirou } = useAdmin();
  const [dados, setDados] = useState({ id: null, pedido: null, cliente: null, erro: null });
  const [recarga, setRecarga] = useState(0);
  const [dialogo, setDialogo] = useState(null);
  const [anotacao, setAnotacao] = useState("");
  const [salvandoNota, setSalvandoNota] = useState(false);

  const recarregar = useCallback(() => {
    setRecarga((r) => r + 1);
    aoMudou();
  }, [aoMudou]);
  const { mudar, enderecoLoja } = useMudarStatus(recarregar);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const pedido = await buscarPedido(id);
        const cliente = pedido ? await buscarResumoCliente(pedido.telefone).catch(() => null) : null;
        if (ativo) setDados({ id, pedido, cliente, erro: pedido ? null : "Pedido não encontrado." });
      } catch (erro) {
        if (!ativo) return;
        if (erro.sessaoExpirada) sessaoExpirou();
        setDados({ id, pedido: null, cliente: null, erro: erro.message });
      }
    })();
    return () => {
      ativo = false;
    };
  }, [id, versao, recarga, sessaoExpirou]);

  const concluir = (texto) => {
    setDialogo(null);
    if (texto) mostrar({ texto });
    recarregar();
  };

  const cabecalho = (
    <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-borda-suave bg-fundo px-3 py-2 lg:rounded-t-2xl">
      <button
        type="button"
        onClick={aoFechar}
        className="inline-flex min-h-11 items-center gap-1 rounded-xl px-2 font-semibold text-link hover:text-ferrugem-ativo"
      >
        <IconeVoltar className="size-5" />
        <span className="lg:hidden">Voltar</span>
        <span className="hidden lg:inline">Fechar</span>
      </button>
      <h2 className="font-titulo text-xl text-ferrugem-hover">Pedido nº {id}</h2>
    </div>
  );

  if (dados.id !== id) {
    return (
      <div>
        {cabecalho}
        <div className="space-y-3 p-3" aria-busy="true" aria-label="Carregando pedido">
          <div className="h-28 animate-pulse rounded-2xl bg-borda-suave" />
          <div className="h-40 animate-pulse rounded-2xl bg-borda-suave" />
          <div className="h-56 animate-pulse rounded-2xl bg-borda-suave" />
        </div>
      </div>
    );
  }

  if (!dados.pedido) {
    return (
      <div>
        {cabecalho}
        <div className="p-3">
          <AlertaErro>{dados.erro}</AlertaErro>
        </div>
      </div>
    );
  }

  const p = dados.pedido;
  const cliente = dados.cliente;
  // Lidos com checagem explícita de null (ver Topo.js: React Compiler).
  const bloqueado = Boolean(cliente && cliente.bloqueado);
  const motivoBloqueio = cliente ? cliente.motivo_bloqueio : null;
  const pedidosDoTelefone = cliente ? cliente.pedidos : null;
  const entrega = p.tipo_entrega === "entrega";
  const cancelado = p.status === "cancelado" || p.pagamento_status === "expirado";
  const encerrado = finalizado(p);
  const proximo = !cancelado ? proximoStatus(p.status) : null;
  const anterior = !cancelado ? statusAnterior(p.status) : null;
  const urg = urgencia(p, agora, tempoMin);
  const link = linkDoPedido(p);
  const pagamentoTexto = textoFormaPagamento({
    forma: p.forma_pagamento,
    trocoPara: p.troco_para,
    agendadoPara: p.agendado_para,
    tipoEntrega: p.tipo_entrega,
  });
  const subtotalItens = Number(p.total) - Number(p.taxa_entrega ?? 0);
  const troco = p.forma_pagamento === "dinheiro" && Number(p.troco_para) > 0 ? Number(p.troco_para) - Number(p.total) : null;

  async function salvarAnotacao(e) {
    e.preventDefault();
    if (!anotacao.trim() || salvandoNota) return;
    setSalvandoNota(true);
    try {
      await adicionarAnotacao(p.id, anotacao);
      setAnotacao("");
      setRecarga((r) => r + 1);
    } catch (erro) {
      mostrar({ tipo: "erro", texto: erro.message });
    }
    setSalvandoNota(false);
  }

  async function copiarTexto(texto, aviso) {
    mostrar((await copiar(texto)) ? { texto: aviso } : { tipo: "erro", texto: "Não foi possível copiar. Copie manualmente." });
  }

  return (
    <div>
      {cabecalho}
      <div className="space-y-3 p-3">
        {/* Cabeçalho do pedido */}
        <Secao>
          <div className="flex flex-wrap items-center gap-2">
            <BadgeStatus status={p.status} tipo={p.tipo_entrega} grande />
            <BadgePagamento status={p.pagamento_status} tipo={p.tipo_entrega} grande />
            <BadgeTipo tipo={p.tipo_entrega} grande />
          </div>
          <p className="mt-3 text-lg font-bold">
            {textoHoraAlvo(p, agora)} {urg && <BadgeUrgencia urgencia={urg} />}
          </p>
          {p.pagamento_status === "pendente" && p.pagamento_expira_em && (
            <p className="mt-1 text-sm font-semibold text-aviso-texto">Prazo para pagar: {textoDiaHora(p.pagamento_expira_em, agora)}</p>
          )}
          <p className="mt-1 text-sm text-texto-suave">
            Feito em {formatarDataHora(p.criado_em)} · {p.origem === "admin" ? "pelo painel" : "pelo site"}
          </p>
          <div className="mt-1">
            <BadgeOrigem origem={p.origem} />
          </div>
          <button
            type="button"
            disabled={!link}
            onClick={() => copiarTexto(link, "Link de acompanhamento copiado.")}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-link underline underline-offset-4 hover:text-ferrugem-ativo disabled:cursor-not-allowed disabled:text-desabilitado"
          >
            <IconeLink className="size-4" />
            Copiar link de acompanhamento
          </button>
        </Secao>

        {/* Ações principais */}
        <div className="space-y-2">
          {proximo && (
            <button type="button" onClick={() => mudar(p, proximo)} className={`${CLASSE_BOTAO_ACAO} min-h-14 w-full text-lg`}>
              {rotuloAcaoProximo(p.status, p.tipo_entrega)}
            </button>
          )}
          {p.pagamento_status === "pendente" && !cancelado && (
            <button type="button" onClick={() => setDialogo("pagamento")} className={`${CLASSE_BOTAO_CONTORNO} w-full`}>
              <IconeDinheiro className="size-5" /> Confirmar pagamento
            </button>
          )}
          {cancelado && (
            <button type="button" onClick={() => setDialogo("reativar")} className={`${CLASSE_BOTAO_PRINCIPAL}`}>
              <IconePlay className="size-5" /> Reativar pedido
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setDialogo("whatsapp")} className={CLASSE_BOTAO_CONTORNO}>
              <IconeWhatsappOficial className="size-5" /> WhatsApp
            </button>
            <button type="button" onClick={() => window.open(`/admin/imprimir?ids=${p.id}`, "_blank")} className={CLASSE_BOTAO_CONTORNO}>
              <IconeImpressora className="size-5" /> Imprimir
            </button>
            <button
              type="button"
              onClick={() => copiarTexto(resumoPedidoTexto(p, { horaAlvoTexto: textoHoraAlvo(p, agora), pagamentoTexto }), "Resumo copiado.")}
              className={CLASSE_BOTAO_CONTORNO}
            >
              <IconeCopiar className="size-5" /> Copiar resumo
            </button>
            <Link href={`/admin/pedidos/novo?repetir=${p.id}`} className={CLASSE_BOTAO_CONTORNO}>
              <IconeAtualizar className="size-5" /> Repetir pedido
            </Link>
            <button type="button" onClick={() => setDialogo("editar")} className={CLASSE_BOTAO_CONTORNO}>
              <IconeLapis className="size-5" /> Editar dados
            </button>
            {p.agendado_para && !encerrado && (
              <button type="button" onClick={() => setDialogo("reagendar")} className={CLASSE_BOTAO_CONTORNO}>
                <IconeCalendario className="size-5" /> Reagendar
              </button>
            )}
            {anterior && (
              <button type="button" onClick={() => setDialogo("voltar")} className={CLASSE_BOTAO_CONTORNO}>
                <IconeDesfazer className="size-5" /> Voltar status
              </button>
            )}
            {!cancelado && (
              <button type="button" onClick={() => setDialogo("cancelar")} className={CLASSE_BOTAO_PERIGO}>
                <IconeBloqueio className="size-5" /> Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Cliente */}
        <Secao titulo="Cliente">
          <p className="text-lg font-bold">
            {p.nome} {p.sobrenome}
          </p>
          <p className="tabular-nums">{formatarTelefone(p.telefone)}</p>
          <p className="mt-1 text-sm text-texto-suave">
            {p.cliente_id ? "Tem conta no site" : "Pediu sem conta (convidado)"}
            {pedidosDoTelefone != null && ` · ${pedidosDoTelefone} pedido(s) com este telefone`}
          </p>
          {bloqueado && (
            <div className="mt-2 rounded-xl bg-erro-fundo px-3 py-2 text-sm text-erro">
              <p className="flex items-center gap-1.5 font-bold">
                <IconeBloqueio className="size-4" /> Telefone bloqueado no site
              </p>
              {motivoBloqueio && <p>Motivo: {motivoBloqueio}</p>}
              <button
                type="button"
                onClick={async () => {
                  try {
                    await desbloquearTelefone(p.telefone);
                    concluir("Telefone desbloqueado.");
                  } catch (erro) {
                    mostrar({ tipo: "erro", texto: erro.message });
                  }
                }}
                className="mt-1 font-semibold underline underline-offset-4"
              >
                Desbloquear
              </button>
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a href={linkLigar(p.telefone)} className={CLASSE_BOTAO_CONTORNO}>
              <IconeTelefone className="size-5" /> Ligar
            </a>
            <a href={linkWhatsappCliente(p.telefone)} target="_blank" rel="noopener noreferrer" className={CLASSE_BOTAO_CONTORNO}>
              <IconeWhatsappOficial className="size-5" /> WhatsApp
            </a>
          </div>
        </Secao>

        {/* Entrega ou retirada */}
        <Secao titulo={entrega ? "Entrega" : "Retirada"}>
          {entrega ? (
            <>
              <p className="text-[15px] font-semibold">
                {p.rua}, {p.numero} - {p.vila}
              </p>
              {p.ponto_referencia && <p className="text-[15px]">Referência: {p.ponto_referencia}</p>}
              <p className="mt-1 text-sm text-texto-suave">
                {p.cep && `CEP ${String(p.cep).replace(/^(\d{5})(\d{3})$/, "$1-$2")} · `}
                {p.distancia_km != null && `${formatarValor(p.distancia_km)} km · `}
                Frete {formatarPreco(Number(p.taxa_entrega ?? 0))}
              </p>
              <a href={linkMapa(p)} target="_blank" rel="noopener noreferrer" className={`${CLASSE_BOTAO_CONTORNO} mt-3 w-full`}>
                <IconeMapa className="size-5" /> Abrir no mapa
              </a>
            </>
          ) : (
            <p className="text-[15px] font-semibold">Retirada no local</p>
          )}
        </Secao>

        {/* Observação do cliente em destaque */}
        {p.observacao && (
          <section className="rounded-2xl bg-aviso-fundo p-4 text-aviso-texto ring-2 ring-aviso-texto">
            <h3 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide">
              <IconeAlerta className="size-4" /> Observação do cliente
            </h3>
            <p className="mt-1 whitespace-pre-line text-[16px] font-semibold">{p.observacao}</p>
          </section>
        )}

        {/* Itens */}
        <Secao titulo="Itens">
          <ul className="divide-y divide-borda-suave">
            {p.itens_pedido.map((item) => (
              <li key={item.id} className="py-2.5 first:pt-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[16px] font-bold">
                    {item.quantidade}x {item.nome_produto}
                  </p>
                  <span className="shrink-0 tabular-nums text-texto-suave">{formatarPreco(Number(item.subtotal))}</span>
                </div>
                {item.modo && (
                  <div className="mt-1">
                    <BadgeModo modo={item.modo} grande />
                  </div>
                )}
                {item.itens_pedido_conteudo?.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5 pl-1">
                    {item.itens_pedido_conteudo.map((c) => (
                      <li key={c.id} className="text-[16px]">
                        <span className="inline-block min-w-10 font-bold tabular-nums">{c.quantidade}</span> {c.nome_produto}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-1 border-t border-borda-suave pt-2 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-texto-suave">Subtotal</dt>
              <dd className="tabular-nums">{formatarPreco(subtotalItens)}</dd>
            </div>
            {entrega && (
              <div className="flex justify-between">
                <dt className="text-texto-suave">Frete</dt>
                <dd className="tabular-nums">{formatarPreco(Number(p.taxa_entrega ?? 0))}</dd>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold">
              <dt>TOTAL</dt>
              <dd className="text-ferrugem tabular-nums">{formatarPreco(Number(p.total))}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-texto-suave">Pagamento</dt>
              <dd className="text-right font-semibold">{pagamentoTexto}</dd>
            </div>
            {troco != null && (
              <p className="rounded-lg bg-info-fundo px-3 py-2 font-semibold text-info">
                Levar troco para {formatarPreco(Number(p.troco_para))} → {formatarPreco(troco)} de troco
              </p>
            )}
            {p.pagamento_referencia && <p className="text-sm text-texto-suave">Referência: {p.pagamento_referencia}</p>}
          </dl>
        </Secao>

        {/* Linha do tempo */}
        <Secao titulo="Linha do tempo">
          <LinhaDoTempo status={p.status} tipo_entrega={p.tipo_entrega} historico={p.pedido_status_historico} />
        </Secao>

        {/* Anotações internas */}
        <Secao titulo="Anotações internas (o cliente não vê)">
          {p.anotacoes_pedido?.length > 0 ? (
            <ul className="mb-3 space-y-2">
              {p.anotacoes_pedido.map((a) => (
                <li key={a.id} className="rounded-xl bg-fundo px-3 py-2">
                  <p className="whitespace-pre-line text-[15px]">{a.texto}</p>
                  <p className="text-sm text-texto-suave">{formatarDataHora(a.criado_em)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-3 text-sm text-texto-suave">Nenhuma anotação ainda.</p>
          )}
          <form onSubmit={salvarAnotacao} className="space-y-2">
            <label className="block">
              <span className="sr-only">Nova anotação</span>
              <textarea
                value={anotacao}
                onChange={(e) => setAnotacao(e.target.value)}
                maxLength={1000}
                placeholder="Ex.: Ligou pedindo para caprichar"
                className="min-h-20 w-full rounded-xl bg-fundo px-3 py-2.5 text-[16px] ring-1 ring-borda-input placeholder:text-texto-suave"
              />
            </label>
            <button type="submit" disabled={!anotacao.trim() || salvandoNota} className={`${CLASSE_BOTAO_CONTORNO} w-full`}>
              <IconeNota className="size-5" /> {salvandoNota ? "Salvando…" : "Adicionar anotação"}
            </button>
          </form>
        </Secao>

        {/* Ações raras e destrutivas */}
        <div className="grid grid-cols-2 gap-2 pb-4">
          {!bloqueado && (
            <button type="button" onClick={() => setDialogo("bloquear")} className={CLASSE_BOTAO_PERIGO}>
              <IconeBloqueio className="size-5" /> Bloquear telefone
            </button>
          )}
          {cancelado && (
            <button type="button" onClick={() => setDialogo("excluir")} className={CLASSE_BOTAO_PERIGO}>
              <IconeLixeira className="size-5" /> Excluir de vez
            </button>
          )}
        </div>
      </div>

      {/* Janelas: montadas só quando abertas (começam sempre com os dados atuais) */}
      {dialogo === "pagamento" && <DialogoConfirmarPagamento pedido={p} aberto aoFechar={() => setDialogo(null)} aoConcluir={concluir} />}
      {dialogo === "cancelar" && <DialogoCancelar pedido={p} aberto aoFechar={() => setDialogo(null)} aoConcluir={concluir} />}
      {dialogo === "reagendar" && <DialogoReagendar pedido={p} aberto aoFechar={() => setDialogo(null)} aoConcluir={concluir} />}
      {dialogo === "reativar" && (
        <DialogoReativar pedido={p} aberto aoFechar={() => setDialogo(null)} aoConcluir={concluir} aoReagendar={() => setDialogo("reagendar")} />
      )}
      {dialogo === "editar" && <DialogoEditar pedido={p} aberto aoFechar={() => setDialogo(null)} aoConcluir={concluir} />}
      {dialogo === "bloquear" && <DialogoBloquear pedido={p} aberto aoFechar={() => setDialogo(null)} aoConcluir={concluir} />}
      {dialogo === "whatsapp" && <DialogoWhatsapp pedido={p} aberto aoFechar={() => setDialogo(null)} enderecoLoja={enderecoLoja} />}
      <DialogoConfirmar
        aberto={dialogo === "voltar"}
        aoFechar={() => setDialogo(null)}
        titulo="Voltar status"
        rotuloConfirmar={anterior ? `Voltar para "${rotuloStatus(anterior, p.tipo_entrega)}"` : "Voltar"}
        aoConfirmar={async () => {
          await mudarStatus(p.id, anterior);
          concluir(`Pedido nº ${p.id} voltou para "${rotuloStatus(anterior, p.tipo_entrega)}".`);
        }}
      >
        Use para corrigir um engano. O pedido está como <strong>{rotuloStatus(p.status, p.tipo_entrega)}</strong>.
      </DialogoConfirmar>
      <DialogoConfirmar
        aberto={dialogo === "excluir"}
        aoFechar={() => setDialogo(null)}
        titulo={`Excluir pedido nº ${p.id}`}
        rotuloConfirmar="Excluir definitivamente"
        perigoso
        exigirTexto="EXCLUIR"
        aoConfirmar={async () => {
          await excluirPedido(p.id);
          mostrar({ texto: `Pedido nº ${p.id} excluído.` });
          aoMudou();
          aoFechar();
        }}
      >
        O pedido, os itens, a linha do tempo e as anotações somem para sempre. Não dá para desfazer.
      </DialogoConfirmar>
    </div>
  );
}
