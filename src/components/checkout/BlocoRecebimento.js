"use client";

import { MensagemErro } from "@/components/cliente/Campo";
import { IconeAlerta, IconeCheck, IconeMotoboy, IconeRetirada } from "@/components/icones";
import { TIPOS_RECEBIMENTO } from "@/lib/entrega";
import { useEnderecoLoja } from "@/lib/configLoja";
import FormEndereco from "./FormEndereco";
import ResumoFrete from "./ResumoFrete";

const ICONES = { retirada: IconeRetirada, entrega: IconeMotoboy };

function CartaoOpcao({ tipo, selecionado, onEscolher, desabilitado }) {
  const Icone = ICONES[tipo];
  const { titulo, resumo } = TIPOS_RECEBIMENTO[tipo];
  return (
    <label
      className={`relative flex flex-col items-center gap-1.5 rounded-2xl px-2 pb-3 pt-4 text-center transition ${
        desabilitado
          ? "cursor-not-allowed bg-superficie text-desabilitado ring-1 ring-borda-suave"
          : selecionado
            ? "cursor-pointer bg-ferrugem text-white shadow-lg"
            : "cursor-pointer bg-superficie text-texto ring-1 ring-borda-suave hover:ring-borda-input"
      }`}
    >
      <input
        type="radio"
        name="recebimento"
        value={tipo}
        checked={selecionado}
        disabled={desabilitado}
        onChange={() => onEscolher(tipo)}
        className="sr-only"
      />
      {/* Marcador redondo: deixa claro qual está escolhido mesmo sem depender só da cor */}
      <span
        aria-hidden="true"
        className={`absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full ring-2 ${
          selecionado ? "bg-superficie ring-superficie" : desabilitado ? "ring-borda-suave" : "ring-borda-input"
        }`}
      >
        {selecionado && <IconeCheck className="size-3.5 text-ferrugem" />}
      </span>
      <span
        className={`grid size-16 place-items-center rounded-full ${
          selecionado ? "bg-ferrugem-hover text-white" : desabilitado ? "bg-fundo" : "bg-fundo text-cobre"
        }`}
      >
        <Icone className="size-10" />
      </span>
      <span className="text-[15px] font-bold leading-tight">{titulo}</span>
      <span className={`text-sm leading-snug ${selecionado ? "text-white" : desabilitado ? "" : "text-texto-suave"}`}>
        {desabilitado ? "Indisponível para este pedido" : resumo}
      </span>
    </label>
  );
}

/**
 * Entrega x retirada (escolha obrigatória: nenhuma vem marcada).
 * Na entrega: endereço + frete automático (ResumoFrete). Na retirada: endereço da loja (config_loja).
 * `entregaPermitida` e `totalSalgados` vêm do calcularPedido; quando a entrega não é permitida,
 * o cartão fica desabilitado e o checkout marca a retirada sozinho (`trocadoAutomaticamente`).
 */
export default function BlocoRecebimento({
  tipo,
  setTipo,
  endereco,
  setEndereco,
  erros,
  frete,
  entregaPermitida,
  totalSalgados,
  limiteEntrega,
  trocadoAutomaticamente,
  totalItens,
  total,
  calculandoTotal,
  aoSairDoEndereco,
}) {
  const enderecoLoja = useEnderecoLoja();
  return (
    <div className="space-y-3">
      <fieldset data-erro={erros.recebimento ? true : undefined}>
        <legend className="sr-only">Como você quer receber o pedido? (obrigatório)</legend>
        <div className="grid grid-cols-2 gap-3">
          <CartaoOpcao tipo="retirada" selecionado={tipo === "retirada"} onEscolher={setTipo} />
          <CartaoOpcao tipo="entrega" selecionado={tipo === "entrega"} onEscolher={setTipo} desabilitado={!entregaPermitida} />
        </div>
      </fieldset>
      {erros.recebimento && <MensagemErro>{erros.recebimento}</MensagemErro>}

      {!entregaPermitida && (
        <div role="status" className="rounded-xl bg-aviso-fundo p-3 text-sm text-aviso-texto">
          <p className="flex items-start gap-2 font-medium">
            <IconeAlerta className="mt-px size-5 shrink-0" />
            <span>
              A entrega só é possível para pedidos de até {limiteEntrega} salgados (1 cento). Seu pedido tem {totalSalgados}{" "}
              salgados: escolha retirada no local ou diminua a quantidade.
            </span>
          </p>
          {trocadoAutomaticamente && <p className="mt-1 pl-7 font-bold">Marcamos “Retirar no local” para você.</p>}
        </div>
      )}

      {tipo === "retirada" && (
        <div className="rounded-xl border-l-4 border-aviso-texto bg-aviso-fundo p-3 text-aviso-texto">
          <p className="flex items-center gap-1.5 text-sm font-bold">
            <IconeAlerta className="size-4 shrink-0" />
            Atenção: você vai buscar o pedido na salgadaria.
          </p>
          <p className="mt-0.5 text-sm">
            Com essa opção o pedido <strong>não é entregue</strong> no seu endereço.
          </p>
          <p className="mt-2 text-sm">
            Endereço para retirada: <strong>{enderecoLoja ?? "carregando…"}</strong>
          </p>
          {entregaPermitida && (
            <button
              type="button"
              onClick={() => setTipo("entrega")}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-superficie px-3 py-1.5 text-sm font-bold text-link ring-2 ring-link transition hover:text-ferrugem-ativo hover:ring-ferrugem-ativo"
            >
              <IconeMotoboy className="size-4" />
              Quero receber em casa
            </button>
          )}
        </div>
      )}

      {tipo === "entrega" && (
        <>
          <FormEndereco valores={endereco} setValores={setEndereco} erros={erros} aoSairDoCampo={aoSairDoEndereco} />
          <ResumoFrete
            frete={frete}
            endereco={endereco}
            totalItens={totalItens}
            total={total}
            calculandoTotal={calculandoTotal}
            aoEscolherRetirada={() => setTipo("retirada")}
          />
        </>
      )}
    </div>
  );
}
