"use client";

import Campo from "@/components/cliente/Campo";
import { formatarPreco } from "@/lib/formatar";
import { FORMAS_PAGAMENTO } from "@/lib/pagamento";
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

export function validarPagamento({ forma, troco }, totalEstimado) {
  if (!forma) return { forma: "Escolha a forma de pagamento." };
  if (forma !== "dinheiro") return {};
  const valor = lerValor(troco);
  if (valor === null) return {};
  if (Number.isNaN(valor) || valor <= 0) return { troco: "Informe um valor válido, ex.: 100,00." };
  if (valor < totalEstimado) return { troco: `O troco precisa ser para ${formatarPreco(totalEstimado)} ou mais.` };
  return {};
}

export default function BlocoPagamento({ valores, setValores, erros }) {
  return (
    <div className="space-y-2" data-erro={erros.forma ? true : undefined}>
      {FORMAS_PAGAMENTO.map((f) => (
        <OpcaoRadio
          key={f.id}
          nome="pagamento"
          valor={f.id}
          atual={valores.forma}
          onChange={(forma) => setValores({ ...valores, forma })}
          titulo={f.rotulo}
          texto={f.detalhe}
        />
      ))}
      {erros.forma && <p className="text-[13px] font-medium text-vermelho-escuro">{erros.forma}</p>}
      {valores.forma === "dinheiro" && (
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
    </div>
  );
}
