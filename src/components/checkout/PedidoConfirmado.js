import Link from "next/link";
import { CLASSE_BOTAO_PRINCIPAL, CLASSE_BOTAO_SECUNDARIO } from "@/components/cliente/estilos";
import { FORMA_PAGAMENTO, formatarDataHora, formatarPreco } from "@/lib/formatar";

export default function PedidoConfirmado({ pedido }) {
  return (
    <div className="pt-8 text-center">
      <span className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-100 text-emerald-700">
        <svg viewBox="0 0 24 24" className="size-10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5l4.2 4.2L19 7" />
        </svg>
      </span>
      <h1 className="mt-4 font-titulo text-[28px] leading-tight text-vermelho">Pedido nº {pedido.numero} enviado!</h1>
      <p className="mt-1 text-[15px] text-tinta/80">
        {pedido.agendado_para
          ? `Encomenda para ${formatarDataHora(pedido.agendado_para)}.`
          : "Já recebemos e logo começamos a preparar."}
      </p>

      <dl className="mx-auto mt-5 max-w-sm divide-y divide-borda rounded-2xl bg-cartao text-left text-sm ring-1 ring-borda">
        <div className="flex justify-between px-4 py-3">
          <dt className="text-tinta/70">Total</dt>
          <dd className="font-bold text-vermelho tabular-nums">{formatarPreco(pedido.total)}</dd>
        </div>
        <div className="flex justify-between px-4 py-3">
          <dt className="text-tinta/70">Pagamento</dt>
          <dd className="font-semibold">{FORMA_PAGAMENTO[pedido.forma]}</dd>
        </div>
      </dl>

      <div className="mx-auto mt-6 max-w-sm space-y-2">
        {pedido.comoConvidado ? (
          <div className="rounded-2xl bg-vermelho/5 p-4 text-left ring-1 ring-vermelho/20">
            <p className="font-bold">Criar conta para acompanhar seus próximos pedidos</p>
            <p className="mt-1 text-[13px] text-tinta/70">
              Com uma conta você vê o status de cada pedido e não precisa digitar seus dados de novo. Este pedido continua
              valendo normalmente, mas não aparecerá na conta.
            </p>
            <Link href="/entrar?modo=cadastro&volta=%2Fpedidos" className={`${CLASSE_BOTAO_PRINCIPAL} mt-3`}>
              Criar conta
            </Link>
          </div>
        ) : (
          <Link href="/pedidos" className={CLASSE_BOTAO_PRINCIPAL}>
            Acompanhar pedido
          </Link>
        )}
        <Link href="/" className={CLASSE_BOTAO_SECUNDARIO}>
          Voltar ao menu
        </Link>
      </div>
    </div>
  );
}
