"use client";

import { useEffect, useRef, useState } from "react";
import { AlertaErro } from "@/components/cliente/Campo";
import { CLASSE_BOTAO_PRINCIPAL, CLASSE_BOTAO_SECUNDARIO } from "@/components/cliente/estilos";
import { IconeFechar, IconeWhatsappOficial } from "@/components/icones";
import { formatarPreco } from "@/lib/formatar";
import { gerarLinkPagamento, linkPagarPeloWhatsapp, pagamentoOnlineDisponivel } from "@/lib/pagamento";

/**
 * Modal "Pagamento" do botão "Pagar agora".
 * - Pagamento online ligado (INFINITEPAY_HANDLE no servidor): "Pagar com Pix ou cartão" leva à página
 *   segura da InfinitePay; ao voltar, o servidor confere e o pedido aparece pago em "Meus pedidos".
 * - Desligado (ou se falhar ao gerar o link): pagamento pelo WhatsApp da loja, como antes.
 *
 * @param {{ pedido: { numero: number, total: number } | null, aoFechar: () => void }} props
 */
export default function ModalPagamento({ pedido, aoFechar }) {
  const dialogo = useRef(null);
  const [disponivel, setDisponivel] = useState(null); // { numero, online } do pedido atual
  const [gerando, setGerando] = useState(false);
  const [falha, setFalha] = useState(null); // { numero, mensagem }

  useEffect(() => {
    const d = dialogo.current;
    if (pedido && !d.open) d.showModal();
    if (!pedido && d.open) d.close();
  }, [pedido]);

  useEffect(() => {
    if (!pedido) return;
    let ativo = true;
    pagamentoOnlineDisponivel().then((online) => ativo && setDisponivel({ numero: pedido.numero, online }));
    return () => {
      ativo = false;
    };
  }, [pedido]);

  const online = pedido && disponivel?.numero === pedido.numero ? disponivel.online : null; // null = verificando
  const erro = pedido && falha?.numero === pedido.numero ? falha.mensagem : null;

  async function pagarOnline() {
    if (gerando) return;
    setGerando(true);
    setFalha(null);
    const resposta = await gerarLinkPagamento(pedido.numero);
    if (resposta.url) {
      window.location.assign(resposta.url); // página da InfinitePay; o botão fica "Abrindo…" até sair
      return;
    }
    setFalha({ numero: pedido.numero, mensagem: resposta.erro });
    setGerando(false);
  }

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="titulo-pagamento"
      onClose={aoFechar}
      onClick={(e) => e.target === dialogo.current && dialogo.current.close()}
      className="sheet m-auto w-[min(26rem,calc(100vw-2rem))] rounded-3xl bg-fundo p-0 text-texto"
    >
      {pedido && (
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 id="titulo-pagamento" className="traco-vinho font-titulo text-2xl text-ferrugem">
              Pagamento
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

          <dl className="mt-4 divide-y divide-borda-suave rounded-2xl bg-superficie text-sm ring-1 ring-borda-suave">
            <div className="flex justify-between gap-3 px-4 py-3">
              <dt className="text-texto-suave">Pedido</dt>
              <dd className="font-semibold tabular-nums">nº {pedido.numero}</dd>
            </div>
            <div className="flex justify-between gap-3 px-4 py-3">
              <dt className="text-texto-suave">Valor</dt>
              <dd className="text-lg font-bold text-ferrugem tabular-nums">{formatarPreco(pedido.total)}</dd>
            </div>
          </dl>

          {online === null && <div className="mt-4 h-12 animate-pulse rounded-xl bg-borda-suave" aria-busy="true" aria-label="Carregando" />}

          {online === true && (
            <>
              <p className="mt-4 text-[15px]">
                Pague com <strong>Pix</strong> ou <strong>cartão de crédito</strong> na página segura da InfinitePay. Depois de
                pagar, você volta para o site e o agendamento é confirmado.
              </p>
              <button type="button" onClick={pagarOnline} disabled={gerando} className={`${CLASSE_BOTAO_PRINCIPAL} mt-3`}>
                {gerando ? "Abrindo o pagamento…" : "Pagar com Pix ou cartão"}
              </button>
              {erro && (
                <div className="mt-3 space-y-3">
                  <AlertaErro>{erro}</AlertaErro>
                  <a href={linkPagarPeloWhatsapp(pedido)} target="_blank" rel="noopener noreferrer" className={CLASSE_BOTAO_SECUNDARIO}>
                    Pagar pelo WhatsApp
                  </a>
                </div>
              )}
            </>
          )}

          {online === false && (
            <>
              <p className="mt-4 text-[15px]">Pague pelo WhatsApp da loja:</p>
              <a href={linkPagarPeloWhatsapp(pedido)} target="_blank" rel="noopener noreferrer" className={`${CLASSE_BOTAO_PRINCIPAL} mt-3`}>
                <IconeWhatsappOficial className="size-5" />
                Pagar pelo WhatsApp
              </a>
            </>
          )}
        </div>
      )}
    </dialog>
  );
}
