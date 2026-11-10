"use client";

import { useEffect, useState } from "react";
import { AlertaErro } from "@/components/cliente/Campo";
import { IconeLojaFechada } from "@/components/icones";
import { horariosDoDiaDaSemana } from "@/lib/admin/agenda";
import { dataEmBrasilia, somarDias } from "@/lib/admin/datas";
import { listarDiasFechados, listarHorariosFuncionamento } from "@/lib/admin/visao";
import { formatarDiaComSemana } from "@/lib/formatar";
import { AvisoSoConsulta, Bloco, Carregando } from "./Comum";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const hhmm = (t) => String(t).slice(0, 5);

/** /admin/horarios: horário de atendimento, horários de agendamento gerados e dias fechados (consulta). */
export default function TelaHorarios() {
  const [dados, setDados] = useState({ carregado: false, faixas: [], fechados: [], erro: null });

  useEffect(() => {
    const hoje = dataEmBrasilia();
    Promise.all([listarHorariosFuncionamento(), listarDiasFechados(hoje, somarDias(hoje, 365))])
      .then(([faixas, fechados]) => setDados({ carregado: true, faixas, fechados: fechados.sort((a, b) => a.data.localeCompare(b.data)), erro: null }))
      .catch((e) => setDados({ carregado: true, faixas: [], fechados: [], erro: e.message }));
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="traco-vinho font-titulo text-[28px] leading-tight text-ferrugem">Horários</h1>
      <AvisoSoConsulta assunto="horários de atendimento e dias fechados" />
      <p className="mt-2 text-sm text-texto-suave">
        Para uma pausa curta (cozinha lotada), use <strong>Pausar pedidos</strong> no topo do painel.
      </p>

      <div className="mt-4 space-y-4">
        {dados.erro ? (
          <AlertaErro>{dados.erro}</AlertaErro>
        ) : !dados.carregado ? (
          <Carregando altura="h-96" />
        ) : (
          <>
            <Bloco titulo="Horário de atendimento">
              <ul className="divide-y divide-borda-suave">
                {DIAS.map((nome, dia) => {
                  const faixas = dados.faixas.filter((f) => f.dia_semana === dia);
                  const ativas = faixas.filter((f) => f.ativo);
                  const horarios = horariosDoDiaDaSemana(dados.faixas, dia);
                  return (
                    <li key={dia} className="py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-24 font-bold">{nome}</span>
                        {ativas.length === 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-cancelado-fundo px-2.5 py-0.5 text-sm font-bold text-texto-sec">
                            <IconeLojaFechada className="size-4" /> Fechado
                          </span>
                        ) : (
                          ativas.map((f) => (
                            <span key={`${f.abre}-${f.fecha}`} className="rounded-full bg-sucesso-fundo px-2.5 py-0.5 text-sm font-bold text-sucesso tabular-nums">
                              {hhmm(f.abre)} – {hhmm(f.fecha)}
                            </span>
                          ))
                        )}
                        {faixas
                          .filter((f) => !f.ativo)
                          .map((f) => (
                            <span key={`i-${f.abre}-${f.fecha}`} className="rounded-full px-2.5 py-0.5 text-sm text-texto-suave ring-1 ring-borda-input tabular-nums">
                              {hhmm(f.abre)} – {hhmm(f.fecha)} (desativada)
                            </span>
                          ))}
                      </div>
                      {horarios.length > 0 && (
                        <p className="mt-1 text-sm text-texto-suave">
                          Agendamento ({horarios.length} horários): {horarios.join(", ")}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Bloco>

            <Bloco titulo="Próximos dias fechados">
              {dados.fechados.length === 0 ? (
                <p className="text-texto-suave">Nenhum dia fechado cadastrado daqui para frente.</p>
              ) : (
                <ul className="divide-y divide-borda-suave">
                  {dados.fechados.map((d) => (
                    <li key={d.data} className="flex flex-wrap items-center gap-2 py-2.5">
                      <span className="font-bold first-letter:uppercase">{formatarDiaComSemana(`${d.data}T12:00:00-03:00`)}</span>
                      <span className="text-sm text-texto-suave">{d.data.slice(0, 4)}</span>
                      {d.motivo && <span>· {d.motivo}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </Bloco>
          </>
        )}
      </div>
    </div>
  );
}
