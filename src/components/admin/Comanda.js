import { horaAlvo } from "@/lib/admin/status";
import { formatarDiaComSemana, formatarHora, formatarPreco, formatarTelefone } from "@/lib/formatar";
import { textoFormaPagamento } from "@/lib/mensagemWhatsapp";

/**
 * Comanda para a cozinha/entrega. Letras grandes; uma por página na impressão.
 * formato: "80mm" (impressora térmica) ou "a4".
 */
export default function Comanda({ pedido: p, formato = "80mm", tempoMin }) {
  const a4 = formato === "a4";
  const entrega = p.tipo_entrega === "entrega";
  const alvo = horaAlvo(p, tempoMin);
  const troco = p.forma_pagamento === "dinheiro" && Number(p.troco_para) > 0 ? Number(p.troco_para) - Number(p.total) : null;

  return (
    <article
      className={`comanda mx-auto bg-superficie text-cafe print:bg-transparent ${a4 ? "max-w-[180mm] p-8 text-[18px]" : "w-[72mm] p-2 text-[14px]"}`}
    >
      <header className="border-b-2 border-dashed border-cafe pb-2">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`font-black ${a4 ? "text-5xl" : "text-3xl"}`}>Nº {p.id}</p>
          <p className={`font-black uppercase ${a4 ? "text-3xl" : "text-xl"}`}>{entrega ? "Entrega" : "Retirada"}</p>
        </div>
        <p className={`mt-1 font-bold ${a4 ? "text-2xl" : "text-lg"}`}>
          {p.agendado_para ? `${formatarDiaComSemana(alvo)} às ${formatarHora(alvo)}` : `AGORA · até ${formatarHora(alvo)}`}
        </p>
        {p.origem === "admin" && <p>Lançado no painel</p>}
      </header>

      <section className="border-b-2 border-dashed border-cafe py-2">
        <p className="font-bold">
          {p.nome} {p.sobrenome}
        </p>
        <p>{formatarTelefone(p.telefone)}</p>
        {entrega && (
          <>
            <p className="font-bold">
              {p.rua}, {p.numero} - {p.vila}
            </p>
            {p.ponto_referencia && <p>Ref.: {p.ponto_referencia}</p>}
          </>
        )}
      </section>

      <section className="border-b-2 border-dashed border-cafe py-2">
        {p.itens_pedido.map((item) => (
          <div key={item.id} className="py-1">
            <p className={`font-black ${a4 ? "text-2xl" : "text-lg"}`}>
              {item.quantidade}x {item.nome_produto}
              {item.modo && <span className="ml-1 border-2 border-cafe px-1 uppercase">{item.modo === "pronto" ? "Pronto" : "Congelado"}</span>}
            </p>
            {item.itens_pedido_conteudo?.map((c) => (
              <p key={c.id} className={`pl-2 font-bold ${a4 ? "text-xl" : "text-base"}`}>
                {c.quantidade} {c.nome_produto}
              </p>
            ))}
          </div>
        ))}
      </section>

      {p.observacao && (
        <section className="my-2 border-2 border-cafe p-2">
          <p className="font-black uppercase">Observação</p>
          <p className={`whitespace-pre-line font-bold ${a4 ? "text-xl" : "text-base"}`}>{p.observacao}</p>
        </section>
      )}

      <section className="py-2">
        {Number(p.taxa_entrega) > 0 && <p>Frete: {formatarPreco(Number(p.taxa_entrega))}</p>}
        <p className={`font-black ${a4 ? "text-3xl" : "text-xl"}`}>TOTAL {formatarPreco(Number(p.total))}</p>
        <p className="font-bold">
          {textoFormaPagamento({ forma: p.forma_pagamento, trocoPara: p.troco_para, agendadoPara: p.agendado_para, tipoEntrega: p.tipo_entrega })}
          {p.pagamento_status === "pago" && " · PAGO"}
          {p.pagamento_status === "pendente" && " · AGUARDANDO PAGAMENTO"}
        </p>
        {troco != null && <p className="font-bold">Levar troco: {formatarPreco(troco)}</p>}
      </section>
    </article>
  );
}
