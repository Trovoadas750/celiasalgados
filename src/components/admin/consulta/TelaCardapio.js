"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AlertaErro } from "@/components/cliente/Campo";
import { listarProdutosAdmin, previaPrecoSabor } from "@/lib/admin/loja";
import { formatarPreco, formatarValor } from "@/lib/formatar";
import { imagemDoProduto } from "@/lib/imagens";
import { CLASSE_BOTAO_CONTORNO, CLASSE_CHIP } from "../estilos";
import { AvisoSoConsulta, Carregando, SeloAtivo, SimNao } from "./Comum";

const ABAS = [
  ["pacotes", "Pacotes"],
  ["sabores", "Sabores"],
  ["bebidas", "Bebidas"],
  ["adicionais", "Adicionais"],
];

const TIPO = { frito: "Frito", assado: "Assado", variado: "Variado" };

function Miniatura({ produto }) {
  const src = imagemDoProduto(produto);
  if (!src) return <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-fundo text-xs text-texto-suave">sem foto</span>;
  return <Image src={src} alt="" width={56} height={56} className="size-14 shrink-0 rounded-lg object-cover" />;
}

function Info({ rotulo, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-texto-suave">{rotulo}</dt>
      <dd className="font-semibold">{children}</dd>
    </div>
  );
}

/** Prévia: quanto sai cada pacote só com este sabor (calcular_pedido, sob demanda). */
function PreviaSabor({ sabor, pacotes }) {
  const [estado, setEstado] = useState({ carregando: false, linhas: null, erro: null });
  async function calcular() {
    setEstado({ carregando: true, linhas: null, erro: null });
    try {
      setEstado({ carregando: false, linhas: await previaPrecoSabor(sabor, pacotes), erro: null });
    } catch (e) {
      setEstado({ carregando: false, linhas: null, erro: e.message });
    }
  }
  if (!sabor.ativo) return <p className="text-sm text-texto-suave">Sabor desativado: sem prévia.</p>;
  if (estado.linhas) {
    return (
      <p className="text-sm">
        Só com este sabor ({estado.linhas[0]?.modo === "pronto" ? "pronto" : "congelado"}):{" "}
        {estado.linhas.map((l) => (
          <span key={l.pacote} className="mr-2 inline-block font-semibold tabular-nums">
            {l.pacote} = {formatarPreco(l.valor)}
          </span>
        ))}
      </p>
    );
  }
  return (
    <div>
      <button type="button" onClick={calcular} disabled={estado.carregando} className={`${CLASSE_BOTAO_CONTORNO} min-h-10`}>
        {estado.carregando ? "Calculando…" : "Ver prévia de preço"}
      </button>
      {estado.erro && <p className="mt-1 text-sm text-erro">{estado.erro}</p>}
    </div>
  );
}

/** /admin/cardapio: consulta do cardápio (inclui desativados e o acréscimo, que o site nunca mostra). */
export default function TelaCardapio() {
  const [aba, setAba] = useState("pacotes");
  const [dados, setDados] = useState({ carregado: false, grupos: null, erro: null });

  useEffect(() => {
    listarProdutosAdmin()
      .then((grupos) => setDados({ carregado: true, grupos, erro: null }))
      .catch((e) => setDados({ carregado: true, grupos: null, erro: e.message }));
  }, []);

  const g = dados.grupos;
  const lista = g ? g[aba] : [];
  const pacotes = g ? g.pacotes : [];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="traco-vinho font-titulo text-[28px] leading-tight text-ferrugem">Cardápio</h1>
      <AvisoSoConsulta assunto="preços, produtos e fotos" />

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Categorias">
        {ABAS.map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            aria-pressed={aba === id}
            onClick={() => setAba(id)}
            className={`${CLASSE_CHIP} ${aba === id ? "bg-ferrugem text-white" : "bg-superficie text-texto ring-1 ring-borda-input hover:ring-ferrugem"}`}
          >
            {rotulo}
            {g && <span className={`rounded-full px-1.5 text-xs font-bold ${aba === id ? "bg-superficie text-ferrugem" : "bg-fundo"}`}>{g[id].length}</span>}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {dados.erro ? (
          <AlertaErro>{dados.erro}</AlertaErro>
        ) : !dados.carregado ? (
          <Carregando />
        ) : lista.length === 0 ? (
          <p className="rounded-2xl bg-superficie px-4 py-8 text-center font-semibold ring-1 ring-borda-suave">Nada nesta categoria.</p>
        ) : (
          <ul className="space-y-3">
            {lista.map((p) => (
              <li key={p.id} className={`rounded-2xl bg-superficie p-4 ring-1 ring-borda-suave ${p.ativo ? "" : "border-l-4 border-desabilitado"}`}>
                <div className="flex items-start gap-3">
                  {aba === "pacotes" && <Miniatura produto={p} />}
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="text-[16px] font-bold">{p.nome}</span>
                      <SeloAtivo ativo={p.ativo} />
                      <span className="text-sm text-texto-suave">ordem {p.ordem ?? "—"}</span>
                    </p>
                    {p.descricao && <p className="text-sm text-texto-suave">{p.descricao}</p>}
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                      {aba === "pacotes" && (
                        <>
                          <Info rotulo="Preço base (fritos)">{p.preco != null ? formatarPreco(p.preco) : "—"}</Info>
                          <Info rotulo="Só assados">{p.preco_so_assado != null ? formatarPreco(p.preco_so_assado) : "regra de mistura"}</Info>
                          <Info rotulo="Salgados">{p.salgados_a_escolher}</Info>
                          <Info rotulo="Máx. sabores">{p.max_sabores}</Info>
                        </>
                      )}
                      {aba === "sabores" && (
                        <>
                          <Info rotulo="Tipo">{TIPO[p.tipo_salgado] ?? p.tipo_salgado}</Info>
                          <Info rotulo="Acréscimo (só no painel)">{formatarValor(p.acrescimo_percentual ?? 0)}%</Info>
                          <Info rotulo="Congelado">
                            <SimNao valor={p.vende_congelado} />
                          </Info>
                          <Info rotulo="Pronto">
                            <SimNao valor={p.vende_pronto} />
                          </Info>
                          <Info rotulo="Antecedência (pronto)">{p.antecedencia_dias ? `${p.antecedencia_dias} dia(s)` : "nenhuma"}</Info>
                        </>
                      )}
                      {(aba === "bebidas" || aba === "adicionais") && <Info rotulo="Preço">{p.preco != null ? formatarPreco(p.preco) : "—"}</Info>}
                    </dl>
                    {aba === "sabores" && (
                      <div className="mt-3">
                        <PreviaSabor sabor={p} pacotes={pacotes} />
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
