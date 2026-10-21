"use client";

import { useEffect, useState } from "react";
import { CATEGORIAS } from "@/lib/mock";
import { ICONE_CATEGORIA, IconeLupa } from "@/components/icones";
import CardProduto from "./CardProduto";

function normalizar(texto) {
  return (texto ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function Cardapio({ produtos }) {
  const [busca, setBusca] = useState("");
  const [ativa, setAtiva] = useState(CATEGORIAS[0].id);

  const termo = normalizar(busca.trim());
  const secoes = CATEGORIAS.map((categoria) => ({
    ...categoria,
    produtos: produtos.filter(
      (p) =>
        p.categoria === categoria.id &&
        (!termo || normalizar(p.nome).includes(termo) || normalizar(p.descricao).includes(termo)),
    ),
  })).filter((s) => s.produtos.length > 0);

  // Destaca a aba da seção que está passando logo abaixo das abas.
  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => {
        const visivel = entradas.find((e) => e.isIntersecting);
        if (visivel) setAtiva(visivel.target.id.replace("secao-", ""));
      },
      { rootMargin: "-140px 0px -65% 0px" },
    );
    document.querySelectorAll("[data-secao]").forEach((el) => observador.observe(el));
    return () => observador.disconnect();
  }, [termo]);

  function irPara(id) {
    setAtiva(id);
    document.getElementById(`secao-${id}`)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <div className="sticky top-16 z-10 -mx-3 bg-papel/95 px-3 pb-2 pt-3 backdrop-blur supports-[backdrop-filter]:bg-papel/80">
        <label className="flex h-11 items-center gap-2 rounded-xl bg-cartao px-3 ring-1 ring-borda focus-within:ring-2 focus-within:ring-vermelho/40">
          <IconeLupa className="size-5 text-tinta/70" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar coxinha, kit, refrigerante…"
            className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-tinta/55"
          />
        </label>

        <nav className="mt-2 flex gap-2 overflow-x-auto [scrollbar-width:none]" aria-label="Categorias">
          {CATEGORIAS.map(({ id, titulo }) => {
            const Icone = ICONE_CATEGORIA[id];
            const selecionada = ativa === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => irPara(id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  selecionada ? "bg-vermelho text-white" : "bg-cartao text-tinta ring-1 ring-borda"
                }`}
              >
                <Icone className="size-4" />
                {titulo}
              </button>
            );
          })}
        </nav>
      </div>

      {secoes.length === 0 && (
        <p className="py-16 text-center text-sm text-tinta/70">
          Nada encontrado para “{busca}”.
        </p>
      )}

      {secoes.map(({ id, titulo, subtitulo, produtos: lista }) => (
        <section key={id} id={`secao-${id}`} data-secao className="scroll-mt-[9.5rem] pt-5">
          <h2 className="font-titulo text-[22px] text-vermelho">{titulo}</h2>
          <p className="mb-3 text-[13px] text-tinta/70">{subtitulo}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {lista.map((produto) => (
              <CardProduto key={produto.id} produto={produto} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
