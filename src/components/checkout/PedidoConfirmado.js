"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { CLASSE_BOTAO_PRINCIPAL, CLASSE_BOTAO_SECUNDARIO, CLASSE_LINK } from "@/components/cliente/estilos";
import { IconeAlerta, IconeAmpulheta, IconeCheck, IconeMotoboy, IconeRetirada, IconeWhatsappOficial } from "@/components/icones";
import { pedirPermissaoNotificacao } from "@/components/pagamento/LembretePagamento";
import StatusPagamento, { statusEfetivo } from "@/components/pagamento/StatusPagamento";
import { usePedidosAoVivo } from "@/components/pagamento/usePedidosAoVivo";
import { limparPedidoConfirmado } from "@/lib/armazenamento-local";
import { useEnderecoLoja } from "@/lib/configLoja";
import { TIPOS_RECEBIMENTO } from "@/lib/entrega";
import { formatarDiaComSemana, formatarHora, formatarPreco, formatarTempoRestante } from "@/lib/formatar";
import { horaDoPrazo, linkWhatsapp, mensagemPedido, textoFormaPagamento } from "@/lib/mensagemWhatsapp";

// Permissão de notificação lida sem quebrar a hidratação ("indisponivel" no servidor).
function lerPermissao() {
  return typeof Notification === "undefined" ? "indisponivel" : Notification.permission;
}
const semAssinatura = () => () => {};

/** Depois do agendamento: oferece o aviso do navegador (precisa de um clique). */
function AtivarNotificacao() {
  const inicial = useSyncExternalStore(semAssinatura, lerPermissao, () => "indisponivel");
  const [permissao, setPermissao] = useState(null);
  const atual = permissao ?? inicial;
  if (atual === "indisponivel" || atual === "denied") return null;
  if (atual === "granted") {
    return (
      <p className="flex items-center justify-center gap-1.5 text-sm text-texto-suave">
        <IconeCheck className="size-4 text-sucesso" />
        Vamos lembrar você neste navegador enquanto o pagamento estiver pendente.
      </p>
    );
  }
  return (
    <button
      type="button"
      onClick={async () => setPermissao((await pedirPermissaoNotificacao()) ? "granted" : lerPermissao())}
      className={`${CLASSE_LINK} block w-full py-1 text-center text-sm`}
    >
      Avisar neste navegador para eu não esquecer de pagar
    </button>
  );
}

/** Relógio para o tempo restante do pagamento (atualiza a cada 15 s enquanto `ligado`). */
function useAgora(ligado) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    if (!ligado) return;
    const relogio = setInterval(() => setAgora(Date.now()), 15 * 1000);
    return () => clearInterval(relogio);
  }, [ligado]);
  return agora;
}

function Linha({ rotulo, children, destaque = false }) {
  return (
    <div className="flex justify-between gap-3 px-4 py-3">
      <dt className="text-texto-suave">{rotulo}</dt>
      <dd className={`text-right tabular-nums ${destaque ? "text-base font-bold text-ferrugem" : "font-semibold"}`}>{children}</dd>
    </div>
  );
}

/**
 * Tela depois de criar o pedido. O botão principal manda o pedido (com o TOTAL do banco) para o
 * WhatsApp da loja, que combina o pagamento.
 *
 * pedido: { numero, total, taxaEntrega, pagamentoStatus, pagamentoExpiraEm, codigoAcompanhamento,  ← criar_pedido
 *           subtotal,                                                                               ← calcularPedido
 *           linkAcompanhamento, tipoEntrega, agendadoPara, forma, trocoPara, endereco,
 *           comoConvidado, nome, sobrenome, telefone, itens, observacao }                           ← formulário
 */
export default function PedidoConfirmado({ pedido }) {
  const entrega = pedido.tipoEntrega === "entrega";
  const enderecoLoja = useEnderecoLoja();
  const agendado = Boolean(pedido.agendadoPara);
  const [pagamento, setPagamento] = useState({ status: pedido.pagamentoStatus, expiraEm: pedido.pagamentoExpiraEm });
  const [confirmadoAgora, setConfirmadoAgora] = useState(false);
  const agora = useAgora(agendado && pagamento.status === "pendente");
  const status = statusEfetivo(pagamento.status, pagamento.expiraEm, agora);
  const pendente = agendado && status === "pendente" && Boolean(pagamento.expiraEm);

  // Loja confirmou o pagamento (ou o prazo venceu): atualiza na hora. O RLS só entrega pedidos do cliente.
  usePedidosAoVivo(agendado && !pedido.comoConvidado && pagamento.status === "pendente", (linha) => {
    if (linha.id !== pedido.numero || !linha.pagamento_status) return;
    setPagamento({ status: linha.pagamento_status, expiraEm: linha.pagamento_expira_em });
    if (linha.pagamento_status === "pago") setConfirmadoAgora(true);
  });

  const mensagem = mensagemPedido({ ...pedido, pagamentoStatus: status, pagamentoExpiraEm: pagamento.expiraEm }, agora);
  const momento = TIPOS_RECEBIMENTO[pedido.tipoEntrega]?.momento ?? "na entrega";

  return (
    <div className="pt-8 text-center">
      <span className="mx-auto grid size-20 place-items-center rounded-full bg-sucesso-fundo text-sucesso">
        <IconeCheck className="size-10" />
      </span>
      <h1 className="traco-vinho mt-4 font-titulo text-[28px] leading-tight text-ferrugem">
        {agendado ? `Pedido nº ${pedido.numero} agendado!` : `Pedido nº ${pedido.numero} recebido!`}
      </h1>
      <p className="mt-1 text-[15px] text-texto-suave">
        Total a pagar: <strong className="text-texto tabular-nums">{formatarPreco(pedido.total)}</strong>
      </p>

      <div className="mx-auto mt-5 max-w-sm space-y-2 text-left">
        {agendado ? (
          confirmadoAgora ? (
            <p role="status" className="flex items-start gap-2 rounded-xl bg-sucesso-fundo px-3 py-2.5 text-sm font-semibold text-sucesso">
              <IconeCheck className="mt-px size-5 shrink-0" />
              Pagamento confirmado! Seu agendamento está garantido.
            </p>
          ) : pendente ? (
            <div className="rounded-xl bg-aviso-fundo px-3 py-3 text-sm text-aviso-texto ring-1 ring-aviso-texto">
              <p className="flex items-start gap-2 font-bold">
                <IconeAlerta className="mt-px size-5 shrink-0" />
                <span>Seu agendamento só fica confirmado depois do pagamento.</span>
              </p>
              <p className="mt-1 pl-7 font-medium">
                Envie o pedido no WhatsApp e pague até <strong>{horaDoPrazo(pagamento.expiraEm, agora)}</strong>. Depois disso,
                o horário é liberado.
              </p>
              <p className="mt-2 flex items-center gap-2 pl-7 font-bold">
                <IconeAmpulheta className="size-5 shrink-0" />
                Faltam {formatarTempoRestante(new Date(pagamento.expiraEm).getTime() - agora)} para pagar.
              </p>
            </div>
          ) : (
            <StatusPagamento status={status} expiraEm={pagamento.expiraEm} />
          )
        ) : (
          <p className="flex items-start gap-2 rounded-xl bg-info-fundo px-3 py-2.5 text-sm font-semibold text-info">
            <IconeAlerta className="mt-px size-5 shrink-0" />
            <span>
              Envie o pedido no WhatsApp para a loja confirmar. O pagamento é {momento}.
            </span>
          </p>
        )}
      </div>

      <div className="mx-auto mt-4 max-w-sm">
        <a
          href={linkWhatsapp(mensagem)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${CLASSE_BOTAO_PRINCIPAL} h-14 text-base`}
        >
          <IconeWhatsappOficial className="size-6" />
          Enviar pedido para a loja no WhatsApp
        </a>
        <p className="mt-1.5 text-sm text-texto-suave">Abre o WhatsApp com o pedido e o total já escritos.</p>
      </div>

      <div className="mx-auto mt-5 flex max-w-sm items-center gap-3 rounded-2xl bg-superficie p-3 text-left ring-1 ring-borda-suave">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ferrugem text-white">
          {entrega ? <IconeMotoboy className="size-6" /> : <IconeRetirada className="size-6" />}
        </span>
        <div className="min-w-0 text-sm">
          <p className="font-bold text-texto">{entrega ? "Entrega no seu endereço" : "Retirada no local"}</p>
          <p className="text-sm text-texto-suave">
            {entrega
              ? `${pedido.endereco.rua}, ${pedido.endereco.numero} - ${pedido.endereco.vila}`
              : `Busque seu pedido em: ${enderecoLoja ?? "…"}`}
          </p>
        </div>
      </div>

      <dl className="mx-auto mt-3 max-w-sm divide-y divide-borda-suave rounded-2xl bg-superficie text-left text-sm ring-1 ring-borda-suave">
        <Linha rotulo="Pedido">nº {pedido.numero}</Linha>
        {pedido.subtotal != null && <Linha rotulo="Subtotal">{formatarPreco(pedido.subtotal)}</Linha>}
        {entrega && pedido.taxaEntrega != null && (
          <Linha rotulo="Entrega">{Number(pedido.taxaEntrega) > 0 ? formatarPreco(pedido.taxaEntrega) : "Grátis"}</Linha>
        )}
        <Linha rotulo="Total" destaque>
          {formatarPreco(pedido.total)}
        </Linha>
        <Linha rotulo="Quando">
          {agendado ? `${formatarDiaComSemana(pedido.agendadoPara)} às ${formatarHora(pedido.agendadoPara)}` : "O quanto antes"}
        </Linha>
        <Linha rotulo="Pagamento">{textoFormaPagamento(pedido)}</Linha>
      </dl>

      <div className="mx-auto mt-6 max-w-sm space-y-2">
        {pendente && <AtivarNotificacao />}
        {pedido.comoConvidado ? (
          <div className="rounded-2xl bg-superficie p-4 text-left ring-1 ring-borda-suave">
            <p className="font-bold">Criar conta para acompanhar seus próximos pedidos</p>
            <p className="mt-1 text-sm text-texto-suave">
              Com uma conta você vê o status de cada pedido e não precisa digitar seus dados de novo. Este pedido continua
              valendo normalmente, mas não aparecerá na conta.
            </p>
            <Link href="/entrar?modo=cadastro&volta=%2Fpedidos" className={`${CLASSE_BOTAO_SECUNDARIO} mt-3`}>
              Criar conta
            </Link>
          </div>
        ) : (
          // TODO: trocar para a página pública /acompanhar/[codigo] quando ela existir.
          <Link href="/pedidos" className={CLASSE_BOTAO_SECUNDARIO}>
            Acompanhar pedido
          </Link>
        )}
        <Link href="/" onClick={limparPedidoConfirmado} className={`${CLASSE_LINK} block py-2 text-center text-sm`}>
          Voltar ao cardápio
        </Link>
      </div>
    </div>
  );
}
