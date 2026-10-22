"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { CLASSE_BOTAO_PRINCIPAL, CLASSE_BOTAO_SECUNDARIO, CLASSE_LINK } from "@/components/cliente/estilos";
import { IconeCheck, IconeMotoboy, IconeRetirada, IconeWhatsapp, IconeWhatsappOficial } from "@/components/icones";
import { pedirPermissaoNotificacao } from "@/components/pagamento/LembretePagamento";
import ModalPagamento from "@/components/pagamento/ModalPagamento";
import StatusPagamento from "@/components/pagamento/StatusPagamento";
import { usePedidosAoVivo } from "@/components/pagamento/usePedidosAoVivo";
import { FORMA_PAGAMENTO, formatarDataHora, formatarPreco } from "@/lib/formatar";
import { LOJA } from "@/lib/loja";
import { linkWhatsappLoja, mensagemPedidoAgendado } from "@/lib/mensagemWhatsapp";

// Permissão de notificação lida sem quebrar a hidratação ("indisponivel" no servidor).
function lerPermissao() {
  return typeof Notification === "undefined" ? "indisponivel" : Notification.permission;
}
const semAssinatura = () => () => {};

/** Depois do primeiro agendamento: oferece o aviso do navegador (precisa de um clique). */
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

/**
 * pedido: { numero, total, pagamentoStatus, pagamentoExpiraEm, tipoEntrega, agendadoPara, forma,
 *           endereco, comoConvidado, nome, sobrenome, telefone, itens, observacao }
 * `numero`, `total` e o pagamento vêm do criar_pedido; o resto é o que o cliente preencheu.
 */
export default function PedidoConfirmado({ pedido }) {
  const entrega = pedido.tipoEntrega === "entrega";
  const agendado = Boolean(pedido.agendadoPara);
  const [pagamento, setPagamento] = useState({ status: pedido.pagamentoStatus, expiraEm: pedido.pagamentoExpiraEm });
  const [confirmadoAgora, setConfirmadoAgora] = useState(false);
  const [pagando, setPagando] = useState(null);

  // Admin confirmou (ou o prazo venceu): atualiza na hora. O RLS só entrega pedidos do cliente.
  usePedidosAoVivo(agendado && !pedido.comoConvidado && pagamento.status === "pendente", (linha) => {
    if (linha.id !== pedido.numero || !linha.pagamento_status) return;
    setPagamento({ status: linha.pagamento_status, expiraEm: linha.pagamento_expira_em });
    if (linha.pagamento_status === "pago") setConfirmadoAgora(true);
  });

  const mensagemLoja = agendado
    ? mensagemPedidoAgendado({ ...pedido, pagamentoStatus: pagamento.status })
    : `Olá! Fiz o pedido nº ${pedido.numero} pelo site.`;

  return (
    <div className="pt-8 text-center">
      <span className="mx-auto grid size-20 place-items-center rounded-full bg-sucesso-fundo text-sucesso">
        <IconeCheck className="size-10" />
      </span>
      <h1 className="traco-vinho mt-4 font-titulo text-[28px] leading-tight text-ferrugem">
        {agendado ? `Pedido nº ${pedido.numero} agendado!` : `Pedido nº ${pedido.numero} enviado!`}
      </h1>
      <p className="mt-1 text-[15px] text-texto-suave">
        {agendado ? "Recebemos sua encomenda." : "Já recebemos e logo começamos a preparar."}
      </p>

      {agendado && (
        <div className="mx-auto mt-5 max-w-sm space-y-2 text-left">
          {confirmadoAgora ? (
            <p role="status" className="flex items-start gap-2 rounded-xl bg-sucesso-fundo px-3 py-2.5 text-sm font-semibold text-sucesso">
              <IconeCheck className="mt-px size-5 shrink-0" />
              Pagamento confirmado! Seu agendamento está garantido.
            </p>
          ) : (
            <StatusPagamento status={pagamento.status} expiraEm={pagamento.expiraEm} />
          )}
          {pagamento.status === "pendente" && (
            <p className="text-sm text-texto-suave">
              O agendamento só é confirmado depois do pagamento. Sem pagamento no prazo, o pedido é cancelado e o
              horário fica livre.
            </p>
          )}
        </div>
      )}

      <div className="mx-auto mt-5 flex max-w-sm items-center gap-3 rounded-2xl bg-superficie p-3 text-left ring-1 ring-borda-suave">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ferrugem text-white">
          {entrega ? <IconeMotoboy className="size-6" /> : <IconeRetirada className="size-6" />}
        </span>
        <div className="min-w-0 text-sm">
          <p className="font-bold text-texto">{entrega ? "Entrega no seu endereço" : "Retirada no local"}</p>
          <p className="text-sm text-texto-suave">
            {entrega
              ? `${pedido.endereco.rua}, ${pedido.endereco.numero} - ${pedido.endereco.vila}`
              : `Busque seu pedido em: ${LOJA.enderecoRetirada}`}
          </p>
        </div>
      </div>

      <dl className="mx-auto mt-3 max-w-sm divide-y divide-borda-suave rounded-2xl bg-superficie text-left text-sm ring-1 ring-borda-suave">
        <div className="flex justify-between gap-3 px-4 py-3">
          <dt className="text-texto-suave">Total</dt>
          <dd className="font-bold text-ferrugem tabular-nums">{formatarPreco(pedido.total)}</dd>
        </div>
        <div className="flex justify-between gap-3 px-4 py-3">
          <dt className="text-texto-suave">{entrega ? "Entrega" : "Retirada"}</dt>
          <dd className="text-right font-semibold">{agendado ? formatarDataHora(pedido.agendadoPara) : "O quanto antes"}</dd>
        </div>
        <div className="flex justify-between gap-3 px-4 py-3">
          <dt className="text-texto-suave">Pagamento</dt>
          <dd className="font-semibold">{FORMA_PAGAMENTO[pedido.forma] ?? "A combinar"}</dd>
        </div>
      </dl>

      <div className="mx-auto mt-6 max-w-sm space-y-2">
        <a href={linkWhatsappLoja(mensagemLoja)} target="_blank" rel="noopener noreferrer" className={CLASSE_BOTAO_PRINCIPAL}>
          {agendado ? <IconeWhatsappOficial className="size-5" /> : <IconeWhatsapp className="size-5" />}
          {agendado ? "Enviar pedido para a loja no WhatsApp" : "Falar no WhatsApp"}
        </a>
        {agendado && pagamento.status === "pendente" && (
          <>
            <button type="button" onClick={() => setPagando({ numero: pedido.numero, total: pedido.total })} className={CLASSE_BOTAO_SECUNDARIO}>
              Pagar agora
            </button>
            <AtivarNotificacao />
          </>
        )}
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
          <Link href="/pedidos" className={agendado && pagamento.status === "pendente" ? `${CLASSE_LINK} block py-2 text-center text-sm` : CLASSE_BOTAO_SECUNDARIO}>
            Acompanhar pedido
          </Link>
        )}
        <Link href="/" className={`${CLASSE_LINK} block py-2 text-center text-sm`}>
          Voltar ao cardápio
        </Link>
      </div>

      <ModalPagamento pedido={pagando} aoFechar={() => setPagando(null)} />
    </div>
  );
}
