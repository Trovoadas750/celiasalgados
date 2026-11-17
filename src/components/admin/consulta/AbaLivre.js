"use client";

import { useEffect, useState } from "react";
import { AlertaErro } from "@/components/cliente/Campo";
import { IconeAlerta } from "@/components/icones";
import { buscarRegrasLivre, previaLivre } from "@/lib/admin/loja";
import { formatarPreco, formatarValor } from "@/lib/formatar";
import { Bloco, Carregando, SeloAtivo } from "./Comum";

function Info({ rotulo, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-texto-suave">{rotulo}</dt>
      <dd className="font-semibold">{children}</dd>
    </div>
  );
}

/**
 * Aba "Monte do seu jeito" do Cardápio (consulta): produto, regras e prévia de preços comparada
 * com o kit do mesmo tamanho. Tudo calculado pelo banco.
 */
export default function AbaLivre({ grupos }) {
  const livre = grupos.livre[0] ?? null;
  const [regras, setRegras] = useState({ carregado: false, dados: null, erro: null });
  const [previa, setPrevia] = useState({ carregado: false, linhas: [], erro: null });

  useEffect(() => {
    buscarRegrasLivre()
      .then((dados) => setRegras({ carregado: true, dados, erro: null }))
      .catch((e) => setRegras({ carregado: true, dados: null, erro: e.message }));
  }, []);

  const dadosRegras = regras.dados;
  useEffect(() => {
    if (!livre || !dadosRegras) return;
    let ativo = true;
    const fritos = grupos.sabores.filter((s) => s.tipo_salgado === "frito");
    previaLivre({ livre, regras: dadosRegras, pacotes: grupos.pacotes, fritos })
      .then((linhas) => ativo && setPrevia({ carregado: true, linhas, erro: null }))
      .catch((e) => ativo && setPrevia({ carregado: true, linhas: [], erro: e.message }));
    return () => {
      ativo = false;
    };
  }, [livre, dadosRegras, grupos]);

  if (!livre) {
    return <p className="rounded-2xl bg-superficie px-4 py-8 text-center font-semibold ring-1 ring-borda-suave">O produto &quot;Monte do seu jeito&quot; não está cadastrado.</p>;
  }

  const maisBaratos = previa.linhas.filter((l) => l.livre != null && l.kit && l.livre < l.kit.valor);

  return (
    <div className="space-y-4">
      <Bloco titulo={livre.nome} acao={<SeloAtivo ativo={livre.ativo} />}>
        {livre.descricao && <p className="text-sm text-texto-suave">{livre.descricao}</p>}
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          <Info rotulo="Preço por salgado">{livre.preco != null ? formatarPreco(livre.preco) : "—"}</Info>
          <Info rotulo="Máximo de qualidades">{livre.max_sabores ?? "—"}</Info>
          <Info rotulo="Ordem">{livre.ordem ?? "—"}</Info>
        </dl>
        <p className="mt-3 text-sm text-texto-suave">
          No site, o preço aparece só calculado (nunca por salgado nem em %). Os acréscimos de assados e variados valem igual aos kits.
        </p>
      </Bloco>

      <Bloco titulo="Regras (regras_livre)">
        {regras.erro ? (
          <AlertaErro>{regras.erro}</AlertaErro>
        ) : !regras.carregado ? (
          <Carregando altura="h-20" />
        ) : !dadosRegras ? (
          <p className="text-texto-suave">Sem regras cadastradas: o &quot;Monte do seu jeito&quot; não aparece no site.</p>
        ) : (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            <Info rotulo="Acréscimo por qualidade extra (só no painel)">{formatarValor(dadosRegras.acrescimo_por_qualidade_pct)}%</Info>
            <Info rotulo="Mínimo de salgados">{dadosRegras.quantidade_minima}</Info>
            <Info rotulo="Máximo de salgados">{dadosRegras.quantidade_maxima}</Info>
            <Info rotulo="Mínimo de qualidades">{dadosRegras.minimo_qualidades}</Info>
            <Info rotulo="Mínimo por qualidade">{dadosRegras.minimo_por_sabor}</Info>
            <Info rotulo="De quantos em quantos">{dadosRegras.multiplo}</Info>
          </dl>
        )}
      </Bloco>

      <Bloco titulo="Prévia: à vontade x kit (qualidades fritas, congelado)">
        {!livre.ativo ? (
          <p className="text-texto-suave">Produto desativado: sem prévia.</p>
        ) : previa.erro ? (
          <AlertaErro>{previa.erro}</AlertaErro>
        ) : !previa.carregado ? (
          <Carregando altura="h-40" />
        ) : (
          <>
            {maisBaratos.length > 0 && (
              <p role="alert" className="mb-3 flex items-start gap-2 rounded-xl bg-erro-fundo px-3 py-2.5 text-sm font-bold text-erro ring-2 ring-erro">
                <IconeAlerta className="mt-px size-5 shrink-0" />
                <span>
                  Atenção: em {maisBaratos.length} combinação(ões) o &quot;à vontade&quot; sai mais barato que o kit. Confira o preço por salgado e o
                  acréscimo.
                </span>
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[15px]">
                <caption className="sr-only">Preço do Monte do seu jeito comparado ao kit do mesmo tamanho</caption>
                <thead>
                  <tr className="border-b-2 border-vinho">
                    <th scope="col" className="py-2 pr-3 text-sm font-bold">Salgados</th>
                    <th scope="col" className="py-2 pr-3 text-sm font-bold">Qualidades</th>
                    <th scope="col" className="py-2 pr-3 text-right text-sm font-bold">Monte do seu jeito</th>
                    <th scope="col" className="py-2 pr-3 text-right text-sm font-bold">Kit</th>
                  </tr>
                </thead>
                <tbody>
                  {previa.linhas.map((l) => {
                    const alerta = l.livre != null && l.kit && l.livre < l.kit.valor;
                    return (
                      <tr key={`${l.tamanho}-${l.qualidades}`} className={`border-b border-borda-suave last:border-0 ${alerta ? "bg-erro-fundo text-erro" : ""}`}>
                        <td className="py-2 pr-3 tabular-nums">{l.tamanho}</td>
                        <td className="py-2 pr-3 tabular-nums">{l.qualidades}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">
                          {l.livre != null ? (
                            <span className="inline-flex items-center gap-1 font-semibold">
                              {alerta && <IconeAlerta className="size-4" />}
                              {formatarPreco(l.livre)}
                              {alerta && <span className="sr-only"> (mais barato que o kit)</span>}
                            </span>
                          ) : (
                            <span className="text-sm text-texto-suave">— {l.motivoLivre}</span>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">{l.kit ? formatarPreco(l.kit.valor) : <span className="text-sm text-texto-suave">—</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Bloco>
    </div>
  );
}
