"use client";

import Campo from "@/components/cliente/Campo";

export const ENDERECO_VAZIO = { rua: "", vila: "", numero: "", ponto_referencia: "" };

// Endereço de entrega. Obrigatório em todo pedido; não é salvo na conta.
export default function FormEndereco({ valores, setValores, erros }) {
  function mudar(campo, valor) {
    setValores({ ...valores, [campo]: valor });
  }

  return (
    <div className="space-y-3 rounded-xl bg-superficie p-4 ring-1 ring-borda-suave">
      <Campo
        rotulo="Rua"
        autoComplete="address-line1"
        maxLength={120}
        value={valores.rua}
        onChange={(e) => mudar("rua", e.target.value)}
        erro={erros.rua}
      />
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <Campo
          rotulo="Vila / bairro"
          autoComplete="address-level3"
          maxLength={80}
          value={valores.vila}
          onChange={(e) => mudar("vila", e.target.value)}
          erro={erros.vila}
        />
        <Campo
          rotulo="Número"
          maxLength={10}
          placeholder="123 ou S/N"
          value={valores.numero}
          onChange={(e) => mudar("numero", e.target.value)}
          erro={erros.numero}
        />
      </div>
      <Campo
        rotulo="Ponto de referência"
        opcional
        maxLength={200}
        placeholder="Ex.: portão azul, perto da padaria"
        value={valores.ponto_referencia}
        onChange={(e) => mudar("ponto_referencia", e.target.value)}
        erro={erros.ponto_referencia}
      />
    </div>
  );
}
