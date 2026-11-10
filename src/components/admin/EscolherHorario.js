"use client";

import { useEffect, useState } from "react";
import { AlertaErro } from "@/components/cliente/Campo";
import { dataEmBrasilia, somarDias } from "@/lib/admin/datas";
import { horariosDisponiveis } from "@/lib/admin/pedidos";
import { CLASSE_CAMPO } from "./estilos";

/**
 * Data + horário livre (horarios_disponiveis, sem p_itens). Usado no reagendar e no novo pedido.
 * `escolhido` é o `inicio` exato devolvido pelo banco (vai igual para o criar_pedido/update).
 * Mudar `recarga` busca os horários de novo (ex.: depois de "horário ocupado").
 */
export default function EscolherHorario({ data, aoMudarData, escolhido, aoEscolher, recarga = 0, erroData }) {
  const [horarios, setHorarios] = useState({ chave: null, lista: [], erro: null });
  const chave = `${data}|${recarga}`;

  useEffect(() => {
    if (!data) return;
    let ativo = true;
    horariosDisponiveis(data)
      .then((lista) => ativo && setHorarios({ chave, lista, erro: null }))
      .catch((falha) => ativo && setHorarios({ chave, lista: [], erro: falha.message }));
    return () => {
      ativo = false;
    };
  }, [data, chave]);

  const carregando = Boolean(data) && horarios.chave !== chave;

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Data</span>
        <input
          type="date"
          value={data}
          min={dataEmBrasilia()}
          max={somarDias(dataEmBrasilia(), 90)}
          onChange={(e) => {
            aoMudarData(e.target.value);
            aoEscolher("");
          }}
          aria-invalid={erroData ? true : undefined}
          className={CLASSE_CAMPO}
        />
      </label>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Horários livres</legend>
        {!data ? (
          <p className="text-sm text-texto-suave">Escolha a data para ver os horários.</p>
        ) : carregando ? (
          <div className="h-24 animate-pulse rounded-xl bg-borda-suave" aria-busy="true" aria-label="Carregando horários" />
        ) : horarios.erro ? (
          <AlertaErro>{horarios.erro}</AlertaErro>
        ) : horarios.lista.length === 0 ? (
          <p className="rounded-xl bg-aviso-fundo px-3 py-2.5 text-sm font-semibold text-aviso-texto">
            Nenhum horário livre nesse dia (fechado, fora do expediente ou tudo ocupado).
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {horarios.lista.map((h) => {
              const marcado = escolhido && new Date(escolhido).getTime() === new Date(h.inicio).getTime();
              return (
                <label
                  key={h.inicio}
                  className={`flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded-xl text-[15px] font-bold ${
                    marcado ? "bg-ferrugem text-white" : "bg-superficie ring-1 ring-borda-input hover:ring-ferrugem"
                  }`}
                >
                  <input type="radio" name="horario" value={h.inicio} checked={Boolean(marcado)} onChange={() => aoEscolher(h.inicio)} className="sr-only" />
                  {h.hora}
                </label>
              );
            })}
          </div>
        )}
      </fieldset>
    </div>
  );
}
