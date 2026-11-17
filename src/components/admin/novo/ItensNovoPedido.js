"use client";

import { useEffect, useRef } from "react";
import { FormularioLivre } from "@/components/cardapio/MontadorLivre";
import { FormularioPacote } from "@/components/cardapio/MontadorPacote";
import { MensagemErro } from "@/components/cliente/Campo";
import { IconeLapis, IconeMais, IconeMenos } from "@/components/icones";
import { novaChave } from "@/lib/admin/novoPedido";
import { formatarPreco, MODO_PACOTE } from "@/lib/formatar";
import { BadgeModo } from "../Badges";
import { CLASSE_BOTAO_CONTORNO } from "../estilos";
import { IconeLixeira } from "../icones";

const LIMITE_LINHAS = 30; // criar_pedido aceita de 1 a 30 linhas

/** Subtotal da linha `i` vindo do banco (ou null enquanto calcula). */
function subtotalDe(resumo, i) {
  const linha = resumo && resumo.itens ? resumo.itens[i] : null;
  return linha ? linha.subtotal : null;
}

/** Junta um avulso (refrigerante/adicional) à lista: soma se já existe. */
function somarAvulso(lista, produto, quantidade) {
  const existente = lista.find((i) => !i.modo && i.produtoId === produto.id);
  if (existente) {
    const nova = existente.quantidade + quantidade;
    return nova <= 0 ? lista.filter((i) => i !== existente) : lista.map((i) => (i === existente ? { ...i, quantidade: nova } : i));
  }
  if (quantidade <= 0) return lista;
  return [...lista, { chave: novaChave(), produtoId: produto.id, nome: produto.nome, categoria: produto.categoria, quantidade }];
}

/**
 * Montadores do site (kit ou "Monte do seu jeito") dentro de um <dialog>, entregando o item para a
 * lista do painel. montando = { id, pacote, item, inicial?, substituir? } (kit) · { id, livre: true, item } (à vontade).
 */
function MontadorAdmin({ montando, cardapio, aoFechar, aoConfirmar, aoConfirmarLivre, aoTrocarParaKit }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (montando && !d.open) d.showModal();
    if (!montando && d.open) d.close();
  }, [montando]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="titulo-montador"
      onClose={aoFechar}
      onClick={(e) => e.target === ref.current && ref.current.close()}
      className="sheet m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-superficie p-0 text-texto sm:m-auto sm:h-[min(90dvh,860px)] sm:max-w-xl sm:rounded-2xl"
    >
      {montando && montando.livre && cardapio.livre && (
        <FormularioLivre
          key={montando.id}
          livre={cardapio.livre}
          kits={cardapio.pacotes}
          sabores={cardapio.sabores}
          item={montando.item}
          aoFechar={() => ref.current?.close()}
          aoConfirmar={aoConfirmarLivre}
          aoTrocarParaKit={aoTrocarParaKit}
        />
      )}
      {montando && !montando.livre && (
        <FormularioPacote
          key={montando.id}
          pacote={montando.pacote}
          sabores={cardapio.sabores}
          adicionais={cardapio.adicionais}
          item={montando.item}
          inicial={montando.inicial ?? null}
          aoFechar={() => ref.current?.close()}
          aoConfirmar={aoConfirmar}
        />
      )}
    </dialog>
  );
}

function Contador({ valor, aoMudar, rotulo }) {
  return (
    <div className="flex shrink-0 items-center rounded-xl bg-superficie ring-1 ring-borda-input">
      <button
        type="button"
        onClick={() => aoMudar(-1)}
        disabled={valor <= 0}
        aria-label={`Tirar 1 ${rotulo}`}
        className="grid size-11 place-items-center rounded-xl text-ferrugem hover:bg-fundo disabled:cursor-not-allowed disabled:text-desabilitado"
      >
        <IconeMenos className="size-4" />
      </button>
      <span className="min-w-7 text-center font-bold tabular-nums" aria-label={`${valor} ${rotulo}`}>
        {valor}
      </span>
      <button
        type="button"
        onClick={() => aoMudar(1)}
        aria-label={`Pôr mais 1 ${rotulo}`}
        className="grid size-11 place-items-center rounded-xl text-ferrugem hover:bg-fundo"
      >
        <IconeMais className="size-4" />
      </button>
    </div>
  );
}

/**
 * Itens do pedido do painel. `itens` no mesmo formato da sacola do site
 * (pacote: { chave, produtoId, nome, quantidade, modo, sabores, tamanho, observacao? } · avulso: { chave, produtoId, nome, categoria, quantidade }).
 */
export default function ItensNovoPedido({ cardapio, itens, setItens, montando, setMontando, resumo, erro }) {
  const avulsos = [...cardapio.refrigerantes, ...cardapio.adicionais];
  const qtdAvulso = (id) => itens.find((i) => !i.modo && i.produtoId === id)?.quantidade ?? 0;

  function confirmarPacote(item, adicionais) {
    const editando = montando?.item;
    const substituir = montando?.substituir; // "Trocar para o kit": o "à vontade" sai
    const base = itens.filter((i) => i.chave !== substituir);
    let lista = editando ? base.map((i) => (i.chave === editando.chave ? { ...item, chave: editando.chave } : i)) : [...base, { ...item, chave: novaChave() }];
    for (const { produto, quantidade } of adicionais) lista = somarAvulso(lista, produto, quantidade);
    if (lista.length > LIMITE_LINHAS) return false;
    setItens(lista);
    return true;
  }

  /** "Monte do seu jeito": edita (mesma chave) ou entra como novo (inclusive o rascunho do "Repetir pedido"). */
  function confirmarLivre(item) {
    const chave = montando?.item?.chave ?? novaChave();
    const existe = itens.some((i) => i.chave === chave);
    const lista = existe ? itens.map((i) => (i.chave === chave ? { ...item, chave } : i)) : [...itens, { ...item, chave }];
    if (lista.length > LIMITE_LINHAS) return false;
    setItens(lista);
    return true;
  }

  /** Do "à vontade" para o kit sugerido, já com o modo e as qualidades; o "à vontade" sai ao confirmar. */
  function trocarParaKit(kit, inicial) {
    const chave = montando?.item?.chave ?? null;
    setMontando({ id: novaChave(), pacote: kit, item: null, inicial, substituir: itens.some((i) => i.chave === chave) ? chave : null });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-bold">Pacotes</p>
        <div className="flex flex-wrap gap-2">
          {cardapio.pacotes.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setMontando({ id: novaChave(), pacote: p, item: null })}
              className={`${CLASSE_BOTAO_CONTORNO} min-h-12 px-4 text-[15px]`}
            >
              <IconeMais className="size-4" /> {p.nome}
            </button>
          ))}
          {cardapio.livre && (
            <button
              type="button"
              onClick={() => setMontando({ id: novaChave(), livre: true, item: null })}
              className={`${CLASSE_BOTAO_CONTORNO} min-h-12 px-4 text-[15px]`}
            >
              <IconeMais className="size-4" /> {cardapio.livre.nome}
            </button>
          )}
        </div>
      </div>

      {avulsos.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-bold">Bebidas e adicionais</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {avulsos.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-superficie px-3 py-1.5 ring-1 ring-borda-suave">
                <span className="min-w-0">
                  <span className="block font-semibold">{p.nome}</span>
                  {p.preco != null && <span className="text-sm text-texto-suave tabular-nums">{formatarPreco(p.preco)} cada</span>}
                </span>
                <Contador valor={qtdAvulso(p.id)} rotulo={p.nome} aoMudar={(d) => setItens((lista) => somarAvulso(lista, p, d))} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-bold">No pedido</p>
        {itens.length === 0 ? (
          <p className="rounded-xl bg-superficie px-3 py-4 text-center text-texto-suave ring-1 ring-borda-suave">Nenhum item ainda.</p>
        ) : (
          <ul className="divide-y divide-borda-suave rounded-2xl bg-superficie px-3 ring-1 ring-borda-suave">
            {itens.map((item, i) => (
              <li key={item.chave} className="flex items-start gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    {item.livre ? "" : `${item.quantidade}x `}
                    {item.nome}
                    {item.modo && <BadgeModo modo={item.modo} />}
                  </p>
                  {item.modo && (
                    <p className="text-sm text-texto-suave">
                      {MODO_PACOTE[item.modo]} · {item.quantidade > 1 ? "cada: " : ""}
                      {item.sabores.map((s) => `${s.quantidade / item.quantidade} ${s.nome}`).join(", ")}
                    </p>
                  )}
                  {item.observacao && <p className="text-sm">Obs.: {item.observacao}</p>}
                </div>
                <span className="shrink-0 pt-0.5 tabular-nums text-texto-suave">
                  {subtotalDe(resumo, i) != null ? formatarPreco(subtotalDe(resumo, i)) : "…"}
                </span>
                <div className="flex shrink-0 gap-1">
                  {item.modo && (
                    <button
                      type="button"
                      onClick={() => {
                        if (item.livre) return setMontando({ id: novaChave(), livre: true, item });
                        const pacote = cardapio.pacotes.find((p) => p.id === item.produtoId);
                        if (pacote) setMontando({ id: novaChave(), pacote, item });
                      }}
                      aria-label={`Editar ${item.nome}`}
                      className="grid size-10 place-items-center rounded-lg text-link ring-1 ring-borda-input hover:ring-ferrugem"
                    >
                      <IconeLapis className="size-5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setItens((lista) => lista.filter((x) => x.chave !== item.chave))}
                    aria-label={`Remover ${item.nome}`}
                    className="grid size-10 place-items-center rounded-lg text-erro ring-1 ring-erro hover:bg-erro-fundo"
                  >
                    <IconeLixeira className="size-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {erro && <MensagemErro>{erro}</MensagemErro>}
      </div>

      <MontadorAdmin
        montando={montando}
        cardapio={cardapio}
        aoFechar={() => setMontando(null)}
        aoConfirmar={confirmarPacote}
        aoConfirmarLivre={confirmarLivre}
        aoTrocarParaKit={trocarParaKit}
      />
    </div>
  );
}
