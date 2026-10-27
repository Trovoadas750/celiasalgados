"use client";

import { useEffect, useRef, useState } from "react";
import Campo from "@/components/cliente/Campo";
import { IconeAlerta } from "@/components/icones";
import { buscarCep } from "@/lib/frete";
import { mascararCep, soDigitos } from "@/lib/validacao";

export const ENDERECO_VAZIO = { cep: "", rua: "", vila: "", numero: "", ponto_referencia: "" };

/**
 * Endereço de entrega (só Ourinhos). Não é salvo na conta.
 * - CEP opcional: com 8 dígitos consulta o ViaCEP; em Ourinhos preenche rua e vila com o endereço
 *   do CEP (substitui o que havia) e leva o foco para "Número"; outra cidade mostra o aviso; erro é ignorado.
 * - `aoSairDoCampo`: o checkout calcula o frete quando o cliente sai de rua, número ou vila.
 * - `semReferencia`: esconde o "Ponto de referência" (simulador de frete do cardápio).
 */
export default function FormEndereco({ valores, setValores, erros, aoSairDoCampo, semReferencia = false }) {
  const campoNumero = useRef(null);
  const [outraCidade, setOutraCidade] = useState(null);
  const consultaCep = useRef(null);
  const atuais = useRef(valores); // valores mais recentes (a resposta do ViaCEP chega depois)
  useEffect(() => {
    atuais.current = valores;
  });

  function mudar(campo, valor) {
    setValores({ ...valores, [campo]: valor });
  }

  async function mudarCep(texto) {
    const cep = mascararCep(texto);
    mudar("cep", cep);
    setOutraCidade(null);
    if (soDigitos(cep).length !== 8) return;

    consultaCep.current?.abort();
    const controle = new AbortController();
    consultaCep.current = controle;
    const achado = await buscarCep(cep, { signal: controle.signal });
    if (!achado || controle.signal.aborted) return;
    if (!achado.ourinhos) {
      setOutraCidade(achado.cidade);
      return;
    }
    // Rua e vila sempre seguem o CEP atual (trocar o CEP substitui o endereço do anterior)
    setValores({ ...atuais.current, rua: achado.rua, vila: achado.vila });
    campoNumero.current?.focus();
  }

  return (
    <div className="space-y-3 rounded-xl bg-superficie p-4 ring-1 ring-borda-suave">
      <div className="grid grid-cols-[9rem_1fr] items-start gap-3">
        <Campo
          rotulo="CEP"
          opcional
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="Digite o CEP "
          maxLength={9}
          value={valores.cep ?? ""}
          onChange={(e) => mudarCep(e.target.value)}
          erro={erros.cep}
        />
        <div>
          <p className="mb-1 block text-sm font-semibold text-texto">Cidade</p>
          <p className="flex h-12 items-center text-[15px] text-texto-suave">Ourinhos - SP</p>
        </div>
      </div>
      {outraCidade && (
        <p role="status" className="flex items-start gap-2 rounded-xl bg-aviso-fundo px-3 py-2 text-sm font-medium text-aviso-texto">
          <IconeAlerta className="mt-px size-5 shrink-0" />
          Entregamos apenas em Ourinhos. Esse CEP é de {outraCidade}.
        </p>
      )}
      <Campo
        rotulo="Rua"
        autoComplete="address-line1"
        maxLength={120}
        value={valores.rua}
        onChange={(e) => mudar("rua", e.target.value)}
        onBlur={aoSairDoCampo}
        erro={erros.rua}
      />
      <div className="grid grid-cols-[7rem_1fr] gap-3">
        <Campo
          ref={campoNumero}
          rotulo="Número"
          maxLength={10}
          placeholder="123 ou S/N"
          value={valores.numero}
          onChange={(e) => mudar("numero", e.target.value)}
          onBlur={aoSairDoCampo}
          erro={erros.numero}
        />
        <Campo
          rotulo="Vila / bairro"
          autoComplete="address-level3"
          maxLength={80}
          value={valores.vila}
          onChange={(e) => mudar("vila", e.target.value)}
          onBlur={aoSairDoCampo}
          erro={erros.vila}
        />
      </div>
      {!semReferencia && (
      <Campo
        rotulo="Ponto de referência"
        opcional
        maxLength={200}
        placeholder="Ex.: portão azul, perto da padaria"
        value={valores.ponto_referencia}
        onChange={(e) => mudar("ponto_referencia", e.target.value)}
        erro={erros.ponto_referencia}
      />
      )}
    </div>
  );
}
