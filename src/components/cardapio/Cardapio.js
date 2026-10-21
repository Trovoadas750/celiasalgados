"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORIAS } from "@/lib/categorias";
import { ICONE_CATEGORIA, IconeLupa } from "@/components/icones";
import CardProduto from "./CardProduto";

function normalizar(texto) {
  return (texto ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function Cardapio({ produtos }) {
  const [busca, setBusca] = useState("");
  // Abas só para categorias que têm produto ativo.
  const categorias = CATEGORIAS.filter((c) => produtos.some((p) => p.categoria === c.id));
  const [ativa, setAtiva] = useState(categorias[0]?.id);

  const termo = normalizar(busca.trim());
  const secoes = categorias.map((categoria) => ({
    ...categoria,
    produtos: produtos.filter(
      (p) =>
        p.categoria === categoria.id &&
        (!termo || normalizar(p.nome).includes(termo) || normalizar(p.descricao).includes(termo)),
    ),
  })).filter((s) => s.produtos.length > 0);

  const barra = useRef(null); // busca + abas (fixa no topo)

  // Onde a barra termina quando está grudada no topo. Antes de grudar (topo da página) ela fica
  // mais embaixo, então a posição atual não serve para calcular o destino da rolagem.
  function fundoDaBarraFixa() {
    const el = barra.current;
    return parseFloat(getComputedStyle(el).top) + el.offsetHeight;
  }
  const rolandoPara = useRef(null); // aba clicada, travada até a rolagem terminar

  // Destaca a aba da seção que está logo abaixo da barra fixa: a última cujo topo já passou dela.
  // A altura da barra é medida na hora, então funciona em qualquer tela e tamanho de fonte.
  useEffect(() => {
    let quadro = 0;
    function atualizar() {
      quadro = 0;
      if (rolandoPara.current) return;
      const limite = fundoDaBarraFixa() + 8;
      const secoesNaTela = [...document.querySelectorAll("[data-secao]")];
      if (secoesNaTela.length === 0) return;
      // No fim da página a última seção (curta) nunca chega na barra: considera ela a ativa.
      const noFim = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      const atual = noFim
        ? secoesNaTela.at(-1)
        : secoesNaTela.findLast((s) => s.getBoundingClientRect().top <= limite) ?? secoesNaTela[0];
      setAtiva(atual.dataset.secao);
    }
    function aoRolar() {
      if (!quadro) quadro = requestAnimationFrame(atualizar);
    }
    function aoTerminarRolagem() {
      rolandoPara.current = null;
      aoRolar();
    }
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("scrollend", aoTerminarRolagem);
    aoRolar();
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("scrollend", aoTerminarRolagem);
      cancelAnimationFrame(quadro);
    };
  }, [termo]);

  function irPara(id) {
    const secao = document.getElementById(`secao-${id}`);
    if (!secao) return;
    setAtiva(id);
    rolandoPara.current = id;
    // Para o título logo abaixo da barra fixa (e não escondido atrás dela).
    const destino = window.scrollY + secao.getBoundingClientRect().top - fundoDaBarraFixa();
    window.scrollTo({ top: Math.max(0, destino), behavior: "smooth" });
    // Navegadores sem o evento "scrollend" (Safari antigo): destrava depois da animação.
    setTimeout(() => {
      if (rolandoPara.current === id) rolandoPara.current = null;
    }, 1200);
  }

  return (
    <>
      <div
        ref={barra}
        className="sticky top-16 z-10 -mx-3 bg-papel/95 px-3 pb-2 pt-3 backdrop-blur supports-[backdrop-filter]:bg-papel/80"
      >
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
          {categorias.map(({ id, titulo }) => {
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
          {termo ? <>Nada encontrado para “{busca}”.</> : "Nenhum produto disponível no momento."}
        </p>
      )}

      {secoes.map(({ id, titulo, subtitulo, produtos: lista }) => (
        <section key={id} id={`secao-${id}`} data-secao={id} className="pt-5">
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
