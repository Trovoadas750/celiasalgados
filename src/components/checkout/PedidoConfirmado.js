import Link from "next/link";
import { CLASSE_BOTAO_PRINCIPAL, CLASSE_BOTAO_SECUNDARIO } from "@/components/cliente/estilos";
import { IconeCheck, IconeMotoboy, IconeRetirada, IconeWhatsapp } from "@/components/icones";
import { FORMA_PAGAMENTO, formatarDataHora, formatarPreco } from "@/lib/formatar";
import { LOJA } from "@/lib/loja";

function linkWhatsapp(numero) {
  return `${LOJA.whatsapp.link}?text=${encodeURIComponent(`Olá! Fiz o pedido nº ${numero} pelo site.`)}`;
}

/**
 * pedido: { numero, total, tipoEntrega, agendadoPara, forma, endereco, comoConvidado }
 * `numero` e `total` vêm do criar_pedido.
 */
export default function PedidoConfirmado({ pedido }) {
  const entrega = pedido.tipoEntrega === "entrega";

  return (
    <div className="pt-8 text-center">
      <span className="mx-auto grid size-20 place-items-center rounded-full bg-sucesso-fundo text-sucesso">
        <IconeCheck className="size-10" />
      </span>
      <h1 className="mt-4 font-titulo text-[28px] leading-tight text-ferrugem">Pedido nº {pedido.numero} enviado!</h1>
      <p className="mt-1 text-[15px] text-texto-suave">
        {pedido.agendadoPara ? "Recebemos sua encomenda." : "Já recebemos e logo começamos a preparar."}
      </p>

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
          <dd className="text-right font-semibold">
            {pedido.agendadoPara ? formatarDataHora(pedido.agendadoPara) : "O quanto antes"}
          </dd>
        </div>
        <div className="flex justify-between gap-3 px-4 py-3">
          <dt className="text-texto-suave">Pagamento</dt>
          <dd className="font-semibold">{FORMA_PAGAMENTO[pedido.forma]}</dd>
        </div>
      </dl>

      <div className="mx-auto mt-6 max-w-sm space-y-2">
        <a href={linkWhatsapp(pedido.numero)} target="_blank" rel="noopener noreferrer" className={CLASSE_BOTAO_PRINCIPAL}>
          <IconeWhatsapp className="size-5" />
          Falar no WhatsApp
        </a>
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
          <Link href="/pedidos" className={CLASSE_BOTAO_SECUNDARIO}>
            Acompanhar pedido
          </Link>
        )}
        <Link
          href="/"
          className="block py-2 text-center text-sm font-semibold text-link underline underline-offset-4 transition hover:text-ferrugem-ativo"
        >
          Voltar ao cardápio
        </Link>
      </div>
    </div>
  );
}
