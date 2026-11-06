"use client";

import Campo, { MensagemErro } from "@/components/cliente/Campo";
import { formatarPreco } from "@/lib/formatar";
import { FORMAS_PAGAMENTO, FORMAS_PAGAMENTO_AGENDAMENTO } from "@/lib/pagamento";
import { OpcaoRadio } from "./BlocoEntrega";

// "100" / "100,50" / "1.000,00" / "100.50" -> número ; vazio -> null ; inválido -> NaN
export function lerValor(texto) {
  const limpo = String(texto ?? "").replace(/[^\d,.]/g, "");
  if (!limpo) return null;
  let numero;
  if (limpo.includes(",")) numero = Number(limpo.replace(/\./g, "").replace(",", "."));
  else if (/^\d+\.\d{1,2}$/.test(limpo)) numero = Number(limpo); // "100.50" digitado com ponto
  else numero = Number(limpo.replace(/\./g, "")); // "1.000"
  return Number.isFinite(numero) ? numero : NaN;
}

/** Agendamento aceita só Pix ou cartão (o banco recusa dinheiro e troco). */
export function formaAceitaNoAgendamento(forma) {
  return FORMAS_PAGAMENTO_AGENDAMENTO.some((f) => f.id === forma);
}

export function validarPagamento({ forma, troco }, totalEstimado, agendado = false) {
  if (agendado) return formaAceitaNoAgendamento(forma) ? {} : { forma: "Escolha Pix ou cartão de crédito." };
  if (!forma) return { forma: "Escolha a forma de pagamento." };
  if (forma !== "dinheiro") return {};
  const valor = lerValor(troco);
  if (valor === null) return {};
  if (Number.isNaN(valor) || valor <= 0) return { troco: "Informe um valor válido, ex.: 100,00." };
  if (valor < totalEstimado) return { troco: `O troco precisa ser para ${formatarPreco(totalEstimado)} ou mais.` };
  return {};
}

/**
 * Forma de pagamento.
 * - Agendado: "Como prefere pagar?" Pix ou cartão de crédito (a loja envia a chave/link pelo WhatsApp).
 * - Agora: Pix, dinheiro (com troco) ou cartão na maquininha, pagos na entrega/retirada.
 */
export default function BlocoPagamento({ valores, setValores, erros, momento = "na entrega", agendado = false }) {
  const formas = agendado ? FORMAS_PAGAMENTO_AGENDAMENTO : FORMAS_PAGAMENTO;
  return (
    <fieldset className="space-y-2" data-erro={erros.forma ? true : undefined}>
      <legend className="mb-2 text-[15px] font-bold">Como prefere pagar?</legend>
      {agendado && (
        <p className="pb-1 text-sm text-texto-suave">
          Agendamentos são pagos antes, para confirmar o horário. A loja envia a chave Pix ou o link do cartão pelo WhatsApp.
        </p>
      )}
      {formas.map((f) => (
        <OpcaoRadio
          key={f.id}
          nome="pagamento"
          valor={f.id}
          atual={valores.forma}
          onChange={(forma) => setValores({ ...valores, forma })}
          titulo={f.rotulo}
          texto={f.detalhe(momento)}
        />
      ))}
      {erros.forma && <MensagemErro>{erros.forma}</MensagemErro>}
      {!agendado && valores.forma === "dinheiro" && (
        <Campo
          rotulo="Troco para quanto?"
          opcional
          inputMode="decimal"
          placeholder="Ex.: 100,00"
          value={valores.troco}
          onChange={(e) => setValores({ ...valores, troco: e.target.value })}
          erro={erros.troco}
          dica="Deixe em branco se não precisar de troco."
          className="pt-1"
        />
      )}
    </fieldset>
  );
}
