"use client";

import { useState } from "react";

// Gráficos simples do painel, sem biblioteca. Uma série só por gráfico, na cor da marca (ferrugem;
// validada: contraste 5.19 sobre --superficie). O título nomeia a série, então não há legenda.
// Barras finas (até 24px), ponta arredondada de 4px e base reta; 2px de ar entre barras;
// valor no toque/hover/foco; toda informação também numa tabela ("Ver em tabela").

function TabelaDados({ titulo, linhas, colunas }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer font-semibold text-link underline underline-offset-4">Ver em tabela</summary>
      <div className="mt-2 max-h-72 overflow-auto">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{titulo}</caption>
          <thead>
            <tr className="border-b-2 border-vinho">
              {colunas.map((c) => (
                <th key={c.titulo} scope="col" className={`py-1.5 pr-2 font-bold ${c.numero ? "text-right" : ""}`}>
                  {c.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i} className="border-b border-borda-suave last:border-0">
                {colunas.map((c) => (
                  <td key={c.titulo} className={`py-1.5 pr-2 ${c.numero ? "text-right tabular-nums" : ""}`}>
                    {c.valor(l)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/**
 * Colunas verticais (série no tempo: faturamento por dia, pedidos por hora).
 * @param {{ titulo: string, dados: { chave: string, rotulo: string, valor: number, detalhe?: string }[],
 *           formatar: (v: number) => string, rotuloValor: string, colunasExtras?: object[] }} props
 */
export function GraficoColunas({ titulo, dados, formatar, rotuloValor, colunasExtras = [] }) {
  const [ativo, setAtivo] = useState(null);
  const maximo = Math.max(0, ...dados.map((d) => d.valor));
  const temDados = maximo > 0;
  // No máximo ~8 rótulos no eixo, para não colidir.
  const passo = Math.max(1, Math.ceil(dados.length / 8));
  const atual = ativo != null ? dados[ativo] : null;
  const posicao = ativo != null ? ((ativo + 0.5) / dados.length) * 100 : 0;

  return (
    <figure>
      <figcaption className="mb-2 font-bold">{titulo}</figcaption>
      {!temDados ? (
        <p className="rounded-xl bg-fundo px-3 py-8 text-center text-texto-suave">Sem dados no período.</p>
      ) : (
        <>
          <div className="relative">
            {/* Grade recessiva: topo (máximo) e meio */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-48">
              <div className="absolute inset-x-0 top-0 border-t border-dashed border-borda-suave" />
              <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-borda-suave" />
              <span className="absolute right-0 top-0 -translate-y-full bg-superficie pl-1 text-sm text-texto-suave tabular-nums">
                {formatar(maximo)}
              </span>
            </div>

            {/* relative: as barras ficam por cima da grade tracejada */}
            <div className="relative flex h-48 items-end gap-[2px] border-b border-borda-input pt-5" onMouseLeave={() => setAtivo(null)}>
              {dados.map((d, i) => (
                <button
                  key={d.chave}
                  type="button"
                  aria-label={`${d.rotulo}: ${formatar(d.valor)}${d.detalhe ? `, ${d.detalhe}` : ""}`}
                  onMouseEnter={() => setAtivo(i)}
                  onFocus={() => setAtivo(i)}
                  onBlur={() => setAtivo(null)}
                  onClick={() => setAtivo(ativo === i ? null : i)}
                  className="group flex h-full min-w-0 flex-1 items-end justify-center rounded-t-[4px] focus-visible:outline-offset-0"
                >
                  <span
                    className={`block w-full max-w-6 rounded-t-[4px] transition-colors ${ativo === i ? "bg-ferrugem-ativo" : "bg-ferrugem group-hover:bg-ferrugem-hover"}`}
                    style={{ height: `${(d.valor / maximo) * 100}%` }}
                  />
                </button>
              ))}
            </div>

            {atual && (
              <div
                role="status"
                className={`pointer-events-none absolute top-0 z-10 rounded-lg bg-cafe px-2.5 py-1.5 text-sm text-creme shadow-card ${
                  posicao < 15 ? "translate-x-0" : posicao > 85 ? "-translate-x-full" : "-translate-x-1/2"
                }`}
                style={{ left: `${posicao}%` }}
              >
                <p className="font-bold">{atual.rotulo}</p>
                <p className="tabular-nums">{formatar(atual.valor)}</p>
                {atual.detalhe && <p>{atual.detalhe}</p>}
              </div>
            )}
          </div>

          <div aria-hidden="true" className="mt-1 flex gap-[2px]">
            {dados.map((d, i) => (
              <span key={d.chave} className="min-w-0 flex-1 text-center text-sm text-texto-suave">
                {i % passo === 0 ? d.rotulo : ""}
              </span>
            ))}
          </div>

          <TabelaDados
            titulo={titulo}
            linhas={dados}
            colunas={[{ titulo: "Período", valor: (l) => l.rotulo }, { titulo: rotuloValor, numero: true, valor: (l) => formatar(l.valor) }, ...colunasExtras]}
          />
        </>
      )}
    </figure>
  );
}

/**
 * Barras horizontais com o nome e o valor escritos (comparações e rankings).
 * `percentual`: mostra a parte de cada item no total (desligue em rankings, que são só os primeiros).
 * @param {{ titulo: string, itens: { rotulo: string, valor: number, texto: string, detalhe?: string }[], vazio?: string, percentual?: boolean }} props
 */
export function BarrasHorizontais({ titulo, itens, vazio = "Sem dados no período.", percentual = true }) {
  const maximo = Math.max(0, ...itens.map((i) => i.valor));
  const total = itens.reduce((s, i) => s + i.valor, 0);
  return (
    <figure>
      <figcaption className="mb-2 font-bold">{titulo}</figcaption>
      {maximo <= 0 ? (
        <p className="rounded-xl bg-fundo px-3 py-6 text-center text-texto-suave">{vazio}</p>
      ) : (
        <ul className="space-y-2.5">
          {itens.map((item) => (
            <li key={item.rotulo}>
              <div className="flex items-baseline justify-between gap-3 text-[15px]">
                <span className="min-w-0 truncate font-semibold">{item.rotulo}</span>
                <span className="shrink-0 tabular-nums">
                  <strong>{item.texto}</strong>
                  {percentual && <span className="text-texto-suave"> · {Math.round((item.valor / total) * 100)}%</span>}
                  {item.detalhe && <span className="text-texto-suave"> · {item.detalhe}</span>}
                </span>
              </div>
              <div aria-hidden="true" className="mt-1 h-3 rounded-r-[4px] bg-fundo">
                <div className="h-3 rounded-r-[4px] bg-ferrugem" style={{ width: `${(item.valor / maximo) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
