"use client";

import Campo from "@/components/cliente/Campo";

const DIA = 24 * 60 * 60 * 1000;

// "2026-10-21T15:30" no fuso do navegador, formato do <input type="datetime-local">
function paraInputLocal(data) {
  const ajustada = new Date(data.getTime() - data.getTimezoneOffset() * 60000);
  return ajustada.toISOString().slice(0, 16);
}

// O banco aceita agendamento no futuro e até 90 dias.
export function limitesAgendamento(agora = new Date()) {
  return { min: paraInputLocal(new Date(agora.getTime() + 60 * 60 * 1000)), max: paraInputLocal(new Date(agora.getTime() + 90 * DIA)) };
}

export function validarEntrega({ tipo, quando }) {
  if (tipo !== "agendar") return {};
  if (!quando) return { quando: "Escolha o dia e o horário da encomenda." };
  const data = new Date(quando);
  const agora = Date.now();
  if (Number.isNaN(data.getTime()) || data.getTime() <= agora) return { quando: "Escolha um horário no futuro." };
  if (data.getTime() > agora + 90 * DIA) return { quando: "Encomendas podem ser feitas para até 90 dias." };
  return {};
}

// ISO para `p_agendado_para`, ou null = o quanto antes.
export function agendadoPara({ tipo, quando }) {
  return tipo === "agendar" && quando ? new Date(quando).toISOString() : null;
}

function OpcaoRadio({ nome, valor, atual, onChange, titulo, texto }) {
  const marcado = atual === valor;
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl p-3 ring-1 transition ${
        marcado ? "bg-vermelho/5 ring-2 ring-vermelho" : "bg-cartao ring-borda"
      }`}
    >
      <input
        type="radio"
        name={nome}
        value={valor}
        checked={marcado}
        onChange={() => onChange(valor)}
        className="mt-1 size-4 accent-[var(--color-vermelho)]"
      />
      <span>
        <span className="block font-bold">{titulo}</span>
        {texto && <span className="block text-[13px] text-tinta/70">{texto}</span>}
      </span>
    </label>
  );
}

export { OpcaoRadio };

export default function BlocoEntrega({ valores, setValores, erros, limites }) {
  return (
    <div className="space-y-2">
      <OpcaoRadio
        nome="entrega"
        valor="agora"
        atual={valores.tipo}
        onChange={(tipo) => setValores({ ...valores, tipo })}
        titulo="O quanto antes"
        texto="Preparamos assim que o pedido chegar."
      />
      <OpcaoRadio
        nome="entrega"
        valor="agendar"
        atual={valores.tipo}
        onChange={(tipo) => setValores({ ...valores, tipo })}
        titulo="Agendar encomenda"
        texto="Para festas e eventos, até 90 dias antes."
      />
      {valores.tipo === "agendar" && (
        <Campo
          rotulo="Dia e horário"
          type="datetime-local"
          min={limites.min}
          max={limites.max}
          value={valores.quando}
          onChange={(e) => setValores({ ...valores, quando: e.target.value })}
          erro={erros.quando}
          className="pt-1"
        />
      )}
    </div>
  );
}
