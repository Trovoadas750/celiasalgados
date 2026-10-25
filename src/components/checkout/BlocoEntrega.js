"use client";

import Campo from "@/components/cliente/Campo";
import { IconeAlerta } from "@/components/icones";

// Agendamento do pedido. Datas no horário de Brasília (o banco compara a data em Brasília).

const FUSO = "America/Sao_Paulo";
const MAX_DIAS = 90;

/** "2026-10-21" (hoje em Brasília). Chame fora do render (ex.: useState(hojeEmBrasilia)). */
export function hojeEmBrasilia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(new Date());
}

export function somarDias(dataIso, dias) {
  const [a, m, d] = dataIso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

/** "2026-10-22" -> "22/10/2026" */
export function formatarData(dataIso) {
  const [a, m, d] = dataIso.split("-");
  return `${d}/${m}/${a}`;
}

/** ISO com o fuso de Brasília, como o banco espera em p_agendado_para. */
export function paraIso(data, hora) {
  return `${data}T${hora}:00-03:00`;
}

/**
 * Datas permitidas no seletor.
 * - Com assado pronto (exige_agendamento): mínimo = data_minima_agendamento do banco.
 * - "Agendar para outro dia": a partir de amanhã.
 */
export function limitesData(resumo, hoje) {
  const amanha = somarDias(hoje, 1);
  const min = resumo?.exige_agendamento ? resumo.data_minima_agendamento ?? amanha : amanha;
  return { min, max: somarDias(hoje, MAX_DIAS) };
}

function deveAgendar(valores, exige) {
  return exige || valores.tipo === "agendar";
}

export function validarAgendamento(valores, exige, limites) {
  if (!deveAgendar(valores, exige)) return {};
  const erros = {};
  if (!valores.data) erros.data = exige ? "Escolha a data da encomenda." : "Escolha o dia.";
  else if (valores.data < limites.min) erros.data = `Escolha uma data a partir de ${formatarData(limites.min)}.`;
  else if (valores.data > limites.max) erros.data = `Agendamentos podem ser feitos para até ${MAX_DIAS} dias.`;
  if (!valores.hora) erros.hora = "Escolha o horário.";
  if (!erros.data && !erros.hora && new Date(paraIso(valores.data, valores.hora)).getTime() <= Date.now()) {
    erros.hora = "Escolha um horário no futuro.";
  }
  return erros;
}

/** Valor de p_agendado_para: ISO -03:00, ou null = o quanto antes. */
export function agendadoPara(valores, exige) {
  return deveAgendar(valores, exige) && valores.data && valores.hora ? paraIso(valores.data, valores.hora) : null;
}

export function OpcaoRadio({ nome, valor, atual, onChange, titulo, texto, desabilitado = false }) {
  const marcado = atual === valor;
  return (
    <label
      className={`flex items-start gap-3 rounded-xl p-3 transition ${
        desabilitado
          ? "cursor-not-allowed bg-superficie text-desabilitado ring-1 ring-borda-suave"
          : marcado
            ? "cursor-pointer bg-superficie ring-2 ring-ferrugem"
            : "cursor-pointer bg-superficie ring-1 ring-borda-suave hover:ring-borda-input"
      }`}
    >
      <input
        type="radio"
        name={nome}
        value={valor}
        checked={marcado}
        disabled={desabilitado}
        onChange={() => onChange(valor)}
        className="radio mt-0.5"
      />
      <span>
        <span className="block font-bold">{titulo}</span>
        {texto && <span className={`block text-sm ${desabilitado ? "" : "text-texto-suave"}`}>{texto}</span>}
      </span>
    </label>
  );
}

function CamposDataHora({ valores, setValores, erros, limites, exige }) {
  return (
    <div className="grid grid-cols-[1fr_8rem] gap-3">
      <Campo
        rotulo={exige ? "Data da encomenda" : "Dia"}
        type="date"
        required
        min={limites.min}
        max={limites.max}
        value={valores.data}
        onChange={(e) => setValores({ ...valores, data: e.target.value })}
        erro={erros.data}
      />
      <Campo
        rotulo="Horário"
        type="time"
        required
        value={valores.hora}
        onChange={(e) => setValores({ ...valores, hora: e.target.value })}
        erro={erros.hora}
      />
    </div>
  );
}

/**
 * `exige` = resumo.exige_agendamento (há assado pronto): data obrigatória a partir de
 * resumo.data_minima_agendamento. Senão: "O quanto antes" (padrão) ou "Agendar para outro dia".
 * `lojaFechada` = fora do horário de atendimento (resumo.loja_aberta === false): "O quanto antes"
 * fica desabilitado com o motivo, e o checkout já marca "Agendar".
 */
export default function BlocoEntrega({ valores, setValores, erros, limites, exige, comEntrega, lojaFechada = false }) {
  if (exige) {
    return (
      <div className="space-y-3">
        <p className="flex items-start gap-2 rounded-xl bg-aviso-fundo px-3 py-2.5 text-sm font-medium text-aviso-texto">
          <IconeAlerta className="mt-px size-5 shrink-0" />
          <span>
            Pedidos com assados prontos precisam de 1 dia de antecedência. Escolha uma data a partir de{" "}
            <strong>{formatarData(limites.min)}</strong>.
          </span>
        </p>
        <CamposDataHora valores={valores} setValores={setValores} erros={erros} limites={limites} exige />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <OpcaoRadio
        nome="quando"
        valor="agora"
        atual={valores.tipo}
        onChange={(tipo) => setValores({ ...valores, tipo })}
        titulo="O quanto antes"
        texto={lojaFechada ? "Indisponível: estamos fora do horário de atendimento." : "Preparamos assim que o pedido chegar."}
        desabilitado={lojaFechada}
      />
      {lojaFechada && (
        <p className="flex items-start gap-2 rounded-xl bg-info-fundo px-3 py-2.5 text-sm font-medium text-info">
          <IconeAlerta className="mt-px size-5 shrink-0" />
          <span>A loja está fechada agora. Agende o dia e o horário em que quer {comEntrega ? "receber" : "retirar"} seu pedido.</span>
        </p>
      )}
      <OpcaoRadio
        nome="quando"
        valor="agendar"
        atual={valores.tipo}
        onChange={(tipo) => setValores({ ...valores, tipo })}
        titulo="Agendar para outro dia"
        texto={comEntrega ? "Escolha o dia e o horário da entrega." : "Escolha o dia e o horário da retirada."}
      />
      {valores.tipo === "agendar" && (
        <div className="pt-1">
          <CamposDataHora valores={valores} setValores={setValores} erros={erros} limites={limites} />
        </div>
      )}
    </div>
  );
}
