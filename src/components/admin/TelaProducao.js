"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AlertaErro } from "@/components/cliente/Campo";
import { IconeAlerta, IconeFloco, IconePronto } from "@/components/icones";
import { dataEmBrasilia, somarDias } from "@/lib/admin/datas";
import { buscarProducao } from "@/lib/admin/visao";
import { formatarDiaComSemana } from "@/lib/formatar";
import { CLASSE_BOTAO_CONTORNO, CLASSE_CAMPO, CLASSE_CHIP } from "./estilos";
import { IconeImpressora } from "./icones";
import { usePedidosMudaram } from "./TempoReal";

const dataValida = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v ?? "") ? v : null);
const numero = (v) => Number(v ?? 0);

function Tabela({ titulo, colunas, linhas, vazio }) {
  return (
    <section className="break-inside-avoid rounded-2xl bg-superficie p-4 ring-1 ring-borda-suave print:rounded-none print:p-0 print:ring-0">
      <h2 className="mb-2 text-lg font-bold">{titulo}</h2>
      {linhas.length === 0 ? (
        <p className="text-texto-suave">{vazio}</p>
      ) : (
        <table className="w-full border-collapse text-left text-[16px]">
          <thead>
            <tr className="border-b-2 border-vinho">
              {colunas.map((c) => (
                <th key={c.titulo} scope="col" className={`py-2 pr-2 text-sm font-bold uppercase tracking-wide ${c.numero ? "text-right" : ""}`}>
                  {c.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha, i) => (
              <tr key={i} className="border-b border-borda-suave last:border-0">
                {colunas.map((c) => (
                  <td key={c.titulo} className={`py-2 pr-2 ${c.numero ? "text-right tabular-nums" : ""} ${c.forte ? "text-lg font-black" : ""}`}>
                    {c.valor(linha)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

/** /admin/producao: quanto fazer de cada sabor no dia (admin_producao). */
export default function TelaProducao() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [hoje] = useState(() => dataEmBrasilia());
  const data = dataValida(sp.get("data")) ?? hoje;
  const incluirPendentes = sp.get("pendentes") === "1";
  const [versao, setVersao] = useState(0);
  usePedidosMudaram(useCallback(() => setVersao((v) => v + 1), []));
  const [dados, setDados] = useState({ chave: null, producao: null, erro: null });
  const chave = `${data}|${incluirPendentes}`;

  useEffect(() => {
    let ativo = true;
    const [d, pendentes] = chave.split("|");
    buscarProducao(d, pendentes === "true")
      .then((producao) => ativo && setDados({ chave, producao, erro: null }))
      .catch((erro) => ativo && setDados({ chave, producao: null, erro: erro.message }));
    return () => {
      ativo = false;
    };
  }, [chave, versao]);

  function ir(mudancas) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(mudancas)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
  }

  const p = dados.producao;
  const carregando = dados.chave !== chave;
  const pendentesFora = numero(p?.pedidos_pendentes_fora);
  const amanha = somarDias(hoje, 1);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="traco-vinho font-titulo text-[28px] leading-tight text-ferrugem">Produção</h1>
        <button type="button" onClick={() => window.print()} disabled={!p} className={`${CLASSE_BOTAO_CONTORNO} print:hidden`}>
          <IconeImpressora className="size-5" /> Imprimir lista de produção
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 print:hidden">
        {[
          [hoje, "Hoje"],
          [amanha, "Amanhã"],
        ].map(([d, rotulo]) => (
          <button
            key={rotulo}
            type="button"
            aria-pressed={data === d}
            onClick={() => ir({ data: d === hoje ? null : d })}
            className={`${CLASSE_CHIP} ${data === d ? "bg-ferrugem text-white" : "bg-superficie text-texto ring-1 ring-borda-input hover:ring-ferrugem"}`}
          >
            {rotulo}
          </button>
        ))}
        <label className="block">
          <span className="sr-only">Escolher data</span>
          <input type="date" value={data} onChange={(e) => e.target.value && ir({ data: e.target.value })} className={`${CLASSE_CAMPO} h-11 w-auto`} />
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-superficie px-3 font-semibold ring-1 ring-borda-input">
          <input
            type="checkbox"
            checked={incluirPendentes}
            onChange={(e) => ir({ pendentes: e.target.checked ? "1" : null })}
            className="size-5 accent-ferrugem"
          />
          Incluir agendamentos aguardando pagamento
        </label>
      </div>

      <h2 className="mt-4 text-xl font-bold first-letter:uppercase">
        {formatarDiaComSemana(`${data}T12:00:00-03:00`)}
        {p && <span className="font-semibold text-texto-suave"> · {numero(p.pedidos)} pedido(s)</span>}
      </h2>

      {!incluirPendentes && pendentesFora > 0 && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-aviso-fundo px-3 py-2.5 font-bold text-aviso-texto ring-2 ring-aviso-texto">
          <IconeAlerta className="mt-px size-5 shrink-0" />
          {pendentesFora} agendamento(s) aguardando pagamento não estão na conta.
        </p>
      )}
      {incluirPendentes && (
        <p className="mt-3 text-sm text-texto-suave">Incluindo agendamentos que ainda não foram pagos (podem ser cancelados).</p>
      )}

      <div className="mt-4 space-y-4">
        {dados.erro ? (
          <AlertaErro>{dados.erro}</AlertaErro>
        ) : carregando ? (
          <div className="h-72 animate-pulse rounded-2xl bg-borda-suave" aria-busy="true" aria-label="Carregando produção" />
        ) : (
          <>
            <Tabela
              titulo="O que fazer de cada sabor"
              vazio="Nenhum salgado para esse dia."
              linhas={p?.sabores ?? []}
              colunas={[
                { titulo: "Sabor", valor: (l) => l.nome },
                {
                  titulo: "Congelado",
                  numero: true,
                  valor: (l) => (numero(l.congelado) ? (
                    <span className="inline-flex items-center gap-1">
                      <IconeFloco className="size-4 text-info print:hidden" />
                      {numero(l.congelado)}
                    </span>
                  ) : "—"),
                },
                {
                  titulo: "Pronto",
                  numero: true,
                  valor: (l) => (numero(l.pronto) ? (
                    <span className="inline-flex items-center gap-1">
                      <IconePronto className="size-4 text-aviso-texto print:hidden" />
                      {numero(l.pronto)}
                    </span>
                  ) : "—"),
                },
                { titulo: "Total", numero: true, forte: true, valor: (l) => numero(l.total) },
              ]}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Tabela
                titulo="Pacotes"
                vazio="Nenhum pacote."
                linhas={p?.pacotes ?? []}
                colunas={[
                  { titulo: "Pacote", valor: (l) => l.nome },
                  { titulo: "Modo", valor: (l) => (l.modo === "pronto" ? "Pronto" : l.modo === "congelado" ? "Congelado" : l.modo) },
                  { titulo: "Qtd.", numero: true, forte: true, valor: (l) => numero(l.quantidade) },
                ]}
              />
              <Tabela
                titulo="Refrigerantes e adicionais"
                vazio="Nenhum."
                linhas={p?.avulsos ?? []}
                colunas={[
                  { titulo: "Item", valor: (l) => l.nome },
                  { titulo: "Qtd.", numero: true, forte: true, valor: (l) => numero(l.quantidade) },
                ]}
              />
            </div>
            <Tabela
              titulo="Pedidos por horário"
              vazio="Nenhum pedido."
              linhas={p?.por_horario ?? []}
              colunas={[
                { titulo: "Horário", valor: (l) => l.hora ?? "O quanto antes" },
                {
                  titulo: "Pedidos",
                  numero: true,
                  valor: (l) => (Array.isArray(l.pedidos) ? l.pedidos.map((n) => `nº ${n}`).join(", ") : numero(l.pedidos)),
                },
              ]}
            />
          </>
        )}
      </div>
    </div>
  );
}
