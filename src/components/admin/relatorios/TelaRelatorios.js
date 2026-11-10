"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertaErro } from "@/components/cliente/Campo";
import { baixarCsv, gerarCsv, valorCsv } from "@/lib/admin/csv";
import { dataEmBrasilia } from "@/lib/admin/datas";
import { intervaloRelatorio, normalizarResumo, PERIODOS, seriePorHora, serieFaturamento } from "@/lib/admin/relatorios";
import { resumoPeriodo } from "@/lib/admin/visao";
import { formatarDiaComSemana, formatarPreco } from "@/lib/formatar";
import { useAdmin } from "../AdminProvider";
import { CLASSE_BOTAO_CONTORNO, CLASSE_CAMPO, CLASSE_CHIP } from "../estilos";
import { IconeBaixar } from "../icones";
import { BarrasHorizontais, GraficoColunas } from "./Graficos";

const FORMA = { pix: "Pix", dinheiro: "Dinheiro", cartao: "Cartão" };
const dataCurta = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;

function Cartao({ rotulo, valor, detalhe }) {
  return (
    <div className="h-full rounded-2xl bg-superficie p-4 ring-1 ring-borda-suave">
      <p className="text-sm font-bold text-texto-suave">{rotulo}</p>
      <p className="mt-1 text-[26px] font-bold leading-tight tabular-nums">{valor}</p>
      {detalhe && <p className="text-sm text-texto-suave">{detalhe}</p>}
    </div>
  );
}

function Bloco({ children, className = "" }) {
  return <section className={`rounded-2xl bg-superficie p-4 ring-1 ring-borda-suave ${className}`}>{children}</section>;
}

/** /admin/relatorios: admin_resumo do período em cartões, gráficos e rankings. */
export default function TelaRelatorios() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { sessaoExpirou } = useAdmin();
  const [hoje] = useState(() => dataEmBrasilia());
  const periodo = PERIODOS.some(([id]) => id === sp.get("periodo")) ? sp.get("periodo") : "7dias";
  const [de, ate] = intervaloRelatorio(periodo, hoje, sp.get("de"), sp.get("ate"));
  const chave = `${de}|${ate}`;
  const [dados, setDados] = useState({ chave: null, resumo: null, erro: null });

  useEffect(() => {
    let ativo = true;
    const [inicio, fim] = chave.split("|");
    resumoPeriodo(inicio, fim)
      .then((r) => ativo && setDados({ chave, resumo: normalizarResumo(r ?? {}), erro: null }))
      .catch((e) => {
        if (!ativo) return;
        if (e.sessaoExpirada) sessaoExpirou();
        setDados({ chave, resumo: null, erro: e.message });
      });
    return () => {
      ativo = false;
    };
  }, [chave, sessaoExpirou]);

  function ir(mudancas) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(mudancas)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
  }

  const r = dados.resumo;
  const carregando = dados.chave !== chave;
  const tituloPeriodo = de === ate ? formatarDiaComSemana(`${de}T12:00:00-03:00`) : `${dataCurta(de)} a ${dataCurta(ate)}`;
  const nomeArquivo = (tipo) => `relatorio-${tipo}-${de}-a-${ate}.csv`;

  const porDia = r ? serieFaturamento(r.porDia, de, ate).map((d) => ({ ...d, detalhe: `${d.pedidos} pedido(s)` })) : [];
  const porHora = r ? seriePorHora(r.porHora) : [];

  function exportar(tipo) {
    if (!r) return;
    if (tipo === "dias") {
      baixarCsv(
        nomeArquivo("por-dia"),
        gerarCsv(
          [
            { titulo: "Período", valor: (l) => l.rotulo },
            { titulo: "Pedidos", valor: (l) => l.pedidos },
            { titulo: "Faturamento", valor: (l) => valorCsv(l.valor) },
          ],
          porDia,
        ),
      );
    } else if (tipo === "produtos") {
      baixarCsv(
        nomeArquivo("produtos"),
        gerarCsv(
          [
            { titulo: "Produto", valor: (l) => l.nome },
            { titulo: "Quantidade", valor: (l) => l.quantidade },
            { titulo: "Valor", valor: (l) => valorCsv(l.valor) },
          ],
          r.topProdutos,
        ),
      );
    } else {
      baixarCsv(
        nomeArquivo("sabores"),
        gerarCsv(
          [
            { titulo: "Sabor", valor: (l) => l.nome },
            { titulo: "Quantidade (salgados)", valor: (l) => l.quantidade },
          ],
          r.topSabores,
        ),
      );
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="traco-vinho font-titulo text-[28px] leading-tight text-ferrugem">Relatórios</h1>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Período">
        {PERIODOS.map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            aria-pressed={periodo === id}
            onClick={() => ir({ periodo: id === "7dias" ? null : id, ...(id !== "intervalo" && { de: null, ate: null }) })}
            className={`${CLASSE_CHIP} ${periodo === id ? "bg-ferrugem text-white" : "bg-superficie text-texto ring-1 ring-borda-input hover:ring-ferrugem"}`}
          >
            {rotulo}
          </button>
        ))}
      </div>
      {periodo === "intervalo" && (
        <div className="mt-3 grid max-w-md grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">De</span>
            <input type="date" value={sp.get("de") ?? ""} max={hoje} onChange={(e) => ir({ de: e.target.value })} className={CLASSE_CAMPO} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Até</span>
            <input type="date" value={sp.get("ate") ?? ""} max={hoje} onChange={(e) => ir({ ate: e.target.value })} className={CLASSE_CAMPO} />
          </label>
        </div>
      )}

      <h2 className="mt-4 text-xl font-bold first-letter:uppercase">{tituloPeriodo}</h2>
      <p className="text-sm text-texto-suave">
        Dia do pedido = dia agendado (ou do pedido, se foi &quot;o quanto antes&quot;). Não entram cancelados nem agendamentos aguardando
        pagamento.
      </p>

      <div className="mt-4">
        {dados.erro ? (
          <AlertaErro>{dados.erro}</AlertaErro>
        ) : carregando || !r ? (
          <div className="space-y-4" aria-busy="true" aria-label="Carregando relatório">
            <div className="h-28 animate-pulse rounded-2xl bg-borda-suave" />
            <div className="h-72 animate-pulse rounded-2xl bg-borda-suave" />
          </div>
        ) : (
          <div className="space-y-4">
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <li className="col-span-2 md:col-span-1">
                <Cartao rotulo="Faturamento" valor={formatarPreco(r.faturamento)} />
              </li>
              <li>
                <Cartao rotulo="Pedidos" valor={r.pedidos} />
              </li>
              <li>
                <Cartao rotulo="Ticket médio" valor={formatarPreco(r.ticketMedio)} />
              </li>
              <li>
                <Cartao rotulo="Frete arrecadado" valor={formatarPreco(r.frete)} />
              </li>
              <li>
                <Cartao rotulo="Cancelados" valor={r.cancelados} />
              </li>
              <li>
                <Cartao rotulo="Aguardando pagamento" valor={r.aguardando.pedidos} detalhe={r.aguardando.pedidos ? formatarPreco(r.aguardando.valor) : null} />
              </li>
              <li>
                <Cartao rotulo="Clientes novos" valor={r.clientesNovos} />
              </li>
            </ul>

            <Bloco>
              <GraficoColunas
                titulo={porDia.length && porDia[0].chave.length === 7 ? "Faturamento por mês" : "Faturamento por dia"}
                dados={porDia}
                formatar={formatarPreco}
                rotuloValor="Faturamento"
                colunasExtras={[{ titulo: "Pedidos", numero: true, valor: (l) => l.pedidos }]}
              />
            </Bloco>

            <div className="grid gap-4 lg:grid-cols-2">
              <Bloco>
                <GraficoColunas
                  titulo="Pedidos por hora do dia"
                  dados={porHora}
                  formatar={(v) => `${v} pedido(s)`}
                  rotuloValor="Pedidos"
                />
              </Bloco>
              <Bloco className="space-y-6">
                <BarrasHorizontais
                  titulo="Entrega x retirada"
                  itens={[
                    ["Entrega", r.porTipo.entrega],
                    ["Retirada", r.porTipo.retirada],
                  ].map(([rotulo, c]) => ({
                    rotulo,
                    valor: c.pedidos,
                    texto: `${c.pedidos} pedido(s)`,
                    detalhe: c.valor != null ? formatarPreco(c.valor) : null,
                  }))}
                />
                <BarrasHorizontais
                  titulo="Site x painel"
                  itens={[
                    ["Pelo site", r.porOrigem.site],
                    ["Lançados no painel", r.porOrigem.admin],
                  ].map(([rotulo, c]) => ({
                    rotulo,
                    valor: c.pedidos,
                    texto: `${c.pedidos} pedido(s)`,
                    detalhe: c.valor != null ? formatarPreco(c.valor) : null,
                  }))}
                />
              </Bloco>
            </div>

            <Bloco>
              <BarrasHorizontais
                titulo="Formas de pagamento (por valor)"
                itens={r.porPagamento.map((p) => ({
                  rotulo: FORMA[p.forma] ?? "Não informada",
                  valor: p.valor,
                  texto: formatarPreco(p.valor),
                  detalhe: `${p.pedidos} pedido(s)`,
                }))}
              />
            </Bloco>

            <div className="grid gap-4 lg:grid-cols-2">
              <Bloco>
                <BarrasHorizontais
                  titulo="Sabores mais pedidos (salgados)"
                  percentual={false}
                  vazio="Nenhum sabor no período."
                  itens={r.topSabores.map((s) => ({ rotulo: s.nome, valor: s.quantidade, texto: String(s.quantidade) }))}
                />
              </Bloco>
              <Bloco>
                <BarrasHorizontais
                  titulo="Produtos que mais faturaram"
                  percentual={false}
                  vazio="Nenhum produto no período."
                  itens={r.topProdutos.map((p) => ({ rotulo: p.nome, valor: p.valor, texto: formatarPreco(p.valor), detalhe: `${p.quantidade} un.` }))}
                />
              </Bloco>
            </div>

            <Bloco>
              <p className="mb-2 font-bold">Exportar CSV</p>
              <div className="flex flex-wrap gap-2">
                {[
                  ["dias", "Faturamento por dia"],
                  ["produtos", "Produtos"],
                  ["sabores", "Sabores"],
                ].map(([tipo, rotulo]) => (
                  <button key={tipo} type="button" onClick={() => exportar(tipo)} className={CLASSE_BOTAO_CONTORNO}>
                    <IconeBaixar className="size-5" /> {rotulo}
                  </button>
                ))}
              </div>
            </Bloco>
          </div>
        )}
      </div>
    </div>
  );
}
