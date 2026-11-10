"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertaErro } from "@/components/cliente/Campo";
import { IconeLapis, IconeMais, IconeWhatsappOficial } from "@/components/icones";
import { excluirContaCliente, listarPedidosDoTelefone } from "@/lib/admin/clientes";
import { linkLigar, linkWhatsappCliente } from "@/lib/admin/mensagens";
import { desbloquearTelefone, POR_PAGINA_PADRAO } from "@/lib/admin/pedidos";
import { resumoItens } from "@/lib/admin/status";
import { formatarDataHora, formatarPreco, formatarTelefone } from "@/lib/formatar";
import { useAdmin } from "../AdminProvider";
import { BadgePagamento, BadgeStatus } from "../Badges";
import { DialogoConfirmar } from "../Dialogo";
import { CLASSE_BOTAO_CONTORNO, CLASSE_BOTAO_PERIGO, CLASSE_BOTAO_PRINCIPAL } from "../estilos";
import { IconeBloqueio, IconeLixeira, IconeTelefone, IconeVoltar } from "../icones";
import { DialogoBloquear } from "../pedidos/DialogosPedido";
import { useToast } from "../Toasts";
import { DialogoEditarConta, DialogoSenha } from "./DialogosCliente";

function Numero({ rotulo, valor }) {
  return (
    <div className="rounded-xl bg-fundo px-3 py-2">
      <dt className="text-sm text-texto-suave">{rotulo}</dt>
      <dd className="text-lg font-bold tabular-nums">{valor}</dd>
    </div>
  );
}

/**
 * Detalhe do cliente (linha de admin_clientes): dados, totais, ações e histórico de pedidos.
 * @param {{ cliente: object, versao: number, aoFechar: () => void, aoMudou: () => void }} props
 */
export default function DetalheCliente({ cliente: c, versao, aoFechar, aoMudou }) {
  const { mostrar } = useToast();
  const { sessaoExpirou } = useAdmin();
  const [pagina, setPagina] = useState(0);
  const [historico, setHistorico] = useState({ chave: null, pedidos: [], total: 0, erro: null });
  const [dialogo, setDialogo] = useState(null);
  const temConta = Boolean(c.cliente_id);
  const chave = `${c.telefone}|${pagina}|${versao}`;

  useEffect(() => {
    let ativo = true;
    const [telefone, pg] = chave.split("|");
    listarPedidosDoTelefone(telefone, Number(pg))
      .then((r) => ativo && setHistorico({ chave, ...r, erro: null }))
      .catch((e) => {
        if (!ativo) return;
        if (e.sessaoExpirada) sessaoExpirou();
        setHistorico({ chave, pedidos: [], total: 0, erro: e.message });
      });
    return () => {
      ativo = false;
    };
  }, [chave, sessaoExpirou]);

  function concluir(texto) {
    setDialogo(null);
    if (texto) mostrar({ texto });
    aoMudou();
  }

  const totalPaginas = Math.max(1, Math.ceil(historico.total / POR_PAGINA_PADRAO));

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-borda-suave bg-fundo px-3 py-2">
        <button type="button" onClick={aoFechar} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-2 font-semibold text-link hover:text-ferrugem-ativo">
          <IconeVoltar className="size-5" /> <span className="lg:hidden">Voltar</span>
          <span className="hidden lg:inline">Fechar</span>
        </button>
        <h2 className="truncate font-titulo text-xl text-ferrugem-hover">{c.nome}</h2>
      </div>

      <div className="space-y-3 p-3">
        <section className="rounded-2xl bg-superficie p-4 ring-1 ring-borda-suave">
          <p className="text-lg font-bold">{c.nome}</p>
          <p className="tabular-nums">{formatarTelefone(c.telefone)}</p>
          <p className="mt-1 text-sm text-texto-suave">
            {temConta ? `Tem conta desde ${formatarDataHora(c.conta_criada_em)}` : "Sem conta (pediu como convidado)"}
          </p>
          {c.bloqueado && (
            <div className="mt-2 rounded-xl bg-erro-fundo px-3 py-2 text-sm text-erro">
              <p className="flex items-center gap-1.5 font-bold">
                <IconeBloqueio className="size-4" /> Telefone bloqueado no site
              </p>
              {c.motivo_bloqueio && <p>Motivo: {c.motivo_bloqueio}</p>}
            </div>
          )}
          <dl className="mt-3 grid grid-cols-2 gap-2">
            <Numero rotulo="Pedidos" valor={c.pedidos} />
            <Numero rotulo="Cancelados" valor={c.cancelados ?? 0} />
            <Numero rotulo="Total gasto" valor={formatarPreco(c.total_gasto)} />
            <Numero rotulo="Último pedido" valor={c.ultimo_pedido ? formatarDataHora(c.ultimo_pedido) : "—"} />
          </dl>
        </section>

        <div className="grid grid-cols-2 gap-2">
          <Link href={`/admin/pedidos/novo?telefone=${c.telefone}`} className={`${CLASSE_BOTAO_PRINCIPAL} col-span-2`}>
            <IconeMais className="size-5" /> Novo pedido para este cliente
          </Link>
          <a href={linkWhatsappCliente(c.telefone)} target="_blank" rel="noopener noreferrer" className={CLASSE_BOTAO_CONTORNO}>
            <IconeWhatsappOficial className="size-5" /> WhatsApp
          </a>
          <a href={linkLigar(c.telefone)} className={CLASSE_BOTAO_CONTORNO}>
            <IconeTelefone className="size-5" /> Ligar
          </a>
          {temConta && (
            <>
              <button type="button" onClick={() => setDialogo("nome")} className={CLASSE_BOTAO_CONTORNO}>
                <IconeLapis className="size-5" /> Editar nome
              </button>
              <button type="button" onClick={() => setDialogo("senha")} className={CLASSE_BOTAO_CONTORNO}>
                Redefinir senha
              </button>
            </>
          )}
          {c.bloqueado ? (
            <button
              type="button"
              onClick={async () => {
                try {
                  await desbloquearTelefone(c.telefone);
                  concluir("Telefone desbloqueado.");
                } catch (e) {
                  mostrar({ tipo: "erro", texto: e.message });
                }
              }}
              className={CLASSE_BOTAO_CONTORNO}
            >
              Desbloquear telefone
            </button>
          ) : (
            <button type="button" onClick={() => setDialogo("bloquear")} className={CLASSE_BOTAO_PERIGO}>
              <IconeBloqueio className="size-5" /> Bloquear telefone
            </button>
          )}
          {temConta && (
            <button type="button" onClick={() => setDialogo("excluir")} className={CLASSE_BOTAO_PERIGO}>
              <IconeLixeira className="size-5" /> Excluir conta
            </button>
          )}
        </div>

        <section className="rounded-2xl bg-superficie p-4 ring-1 ring-borda-suave">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-texto-suave">Histórico de pedidos</h3>
          {historico.erro ? (
            <AlertaErro>{historico.erro}</AlertaErro>
          ) : historico.chave !== chave ? (
            <div className="h-32 animate-pulse rounded-xl bg-borda-suave" aria-busy="true" aria-label="Carregando histórico" />
          ) : historico.pedidos.length === 0 ? (
            <p className="text-texto-suave">Nenhum pedido com este telefone.</p>
          ) : (
            <>
              <ul className="divide-y divide-borda-suave">
                {historico.pedidos.map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/pedidos?pedido=${p.id}`} className="block py-2.5 hover:bg-fundo">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-bold tabular-nums">nº {p.id}</span>
                        <span className="text-sm text-texto-suave">{formatarDataHora(p.agendado_para ?? p.criado_em)}</span>
                        <span className="ml-auto font-bold text-ferrugem tabular-nums">{formatarPreco(Number(p.total))}</span>
                      </span>
                      <span className="mt-0.5 block text-sm text-texto-suave">{resumoItens(p.itens_pedido)}</span>
                      <span className="mt-1 flex flex-wrap gap-1.5">
                        <BadgeStatus status={p.status} tipo={p.tipo_entrega} />
                        <BadgePagamento status={p.pagamento_status} tipo={p.tipo_entrega} esconderNaEntrega />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {totalPaginas > 1 && (
                <nav aria-label="Páginas do histórico" className="mt-2 flex items-center justify-between gap-2">
                  <button type="button" disabled={pagina === 0} onClick={() => setPagina((n) => n - 1)} className={CLASSE_BOTAO_CONTORNO}>
                    Anterior
                  </button>
                  <p className="text-sm text-texto-suave">
                    {pagina + 1} de {totalPaginas}
                  </p>
                  <button type="button" disabled={pagina + 1 >= totalPaginas} onClick={() => setPagina((n) => n + 1)} className={CLASSE_BOTAO_CONTORNO}>
                    Próxima
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>

      {dialogo === "nome" && <DialogoEditarConta clienteId={c.cliente_id} aoFechar={() => setDialogo(null)} aoConcluir={concluir} />}
      {dialogo === "senha" && <DialogoSenha cliente={c} aoFechar={() => setDialogo(null)} aoConcluir={concluir} />}
      {dialogo === "bloquear" && <DialogoBloquear pedido={{ telefone: c.telefone }} aberto aoFechar={() => setDialogo(null)} aoConcluir={concluir} />}
      <DialogoConfirmar
        aberto={dialogo === "excluir"}
        aoFechar={() => setDialogo(null)}
        titulo="Excluir conta do cliente"
        rotuloConfirmar="Excluir conta"
        perigoso
        exigirTexto="EXCLUIR"
        aoConfirmar={async () => {
          try {
            await excluirContaCliente(c.cliente_id);
          } catch (e) {
            if (e.sessaoExpirada) sessaoExpirou();
            throw e;
          }
          concluir("Conta excluída. Os pedidos continuam no histórico.");
        }}
      >
        A conta de login de <strong>{c.nome}</strong> é apagada (o cliente não consegue mais entrar e precisa criar outra). Os pedidos
        continuam, sem vínculo com a conta. Não dá para desfazer.
      </DialogoConfirmar>
    </div>
  );
}
