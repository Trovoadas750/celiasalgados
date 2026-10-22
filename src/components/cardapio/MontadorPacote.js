"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { AlertaErro } from "@/components/cliente/Campo";
import { CLASSE_BOTAO_PRINCIPAL } from "@/components/cliente/estilos";
import { IconeAlerta, IconeCaixaFesta, IconeCheck, IconeFechar, IconeMais, IconeMenos } from "@/components/icones";
import { adicionarPacote, atualizarPacote, LIMITE_OBSERVACAO, useSacola } from "@/components/sacola/sacola-store";
import { useCalcularPedido } from "@/components/sacola/useCalcularPedido";
import { saboresDisponiveis } from "@/lib/cardapio";
import { dividirSabores } from "@/lib/dividirSabores";
import { formatarPreco } from "@/lib/formatar";
import { imagemDoProduto } from "@/lib/imagens";
import { fecharMontador, useMontador } from "./montador-store";

const MODOS = [
  { id: "congelado", titulo: "Congelado", detalhe: "Você frita em casa" },
  { id: "pronto", titulo: "Pronto para comer", detalhe: null },
];
const NOME_MODO = { congelado: "congelado", pronto: "pronto para comer" };
const GRUPOS = [
  { tipo: "frito", titulo: "Fritos" },
  { tipo: "assado", titulo: "Assados" },
  { tipo: "variado", titulo: "Variados" },
];
const MAX_PACOTES = 99;

function juntarNomes(nomes) {
  return nomes.length <= 1 ? nomes.join("") : `${nomes.slice(0, -1).join(", ")} e ${nomes.at(-1)}`;
}

const BADGE = "inline-flex h-7 items-center rounded-md px-2 text-sm font-bold tabular-nums";

// Cabeçalho de seção (fica grudado logo abaixo do título enquanto a seção é rolada).
function Secao({ titulo, subtitulo, contagem, maximo, completa, children }) {
  const id = useId();
  return (
    <section aria-labelledby={id}>
      <div className="sticky top-14 z-10 flex items-center justify-between gap-3 border-y border-borda-suave bg-fundo px-4 py-3">
        <div className="min-w-0">
          <h3 id={id} className="font-bold leading-snug text-texto">
            {titulo}
          </h3>
          <p className="text-sm text-texto-suave">{subtitulo}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className={`${BADGE} ${completa ? "bg-sucesso-fundo text-sucesso" : "bg-cafe text-creme"}`}>
            {contagem}/{maximo}
          </span>
          {completa ? (
            <span className={`${BADGE} bg-sucesso-fundo text-sucesso`}>
              <IconeCheck className="size-4" />
              <span className="sr-only">Completo</span>
            </span>
          ) : (
            <span className={`${BADGE} bg-cafe text-creme`}>OBRIGATÓRIO</span>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function Aviso({ children }) {
  return (
    <p role="status" className="mx-4 my-3 flex items-start gap-2 rounded-xl bg-aviso-fundo px-3 py-2.5 text-sm font-medium text-aviso-texto">
      <IconeAlerta className="mt-px size-5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

// Linha de opção: texto à esquerda, radio/checkbox real (estilizado redondo) à direita, linha inteira clicável.
function Opcao({ tipo, nome, checked, disabled, onChange, titulo, detalhe }) {
  return (
    <label
      className={`flex min-h-14 items-center justify-between gap-3 px-4 py-3 transition ${
        disabled ? "cursor-not-allowed text-desabilitado" : "cursor-pointer text-texto hover:bg-fundo"
      }`}
    >
      <span className="min-w-0">
        <span className="block font-medium leading-snug">{titulo}</span>
        {detalhe && <span className={`block text-sm ${disabled ? "" : "text-texto-suave"}`}>{detalhe}</span>}
      </span>
      <input type={tipo} name={nome} checked={checked} disabled={disabled} onChange={onChange} className="radio" />
    </label>
  );
}

function Formulario({ pacote, sabores, item, aoFechar }) {
  const total = pacote.salgados_a_escolher;
  const maximo = pacote.max_sabores ?? total;
  const todos = [...sabores.frito, ...sabores.assado, ...sabores.variado];
  const idsAssados = new Set(sabores.assado.map((s) => s.id));

  // `escolhidos` guarda só quem foi escolhido, na ordem de clique. As quantidades saem da regra fixa.
  const [modo, setModo] = useState(item?.modo ?? null);
  const [escolhidos, setEscolhidos] = useState(() => item?.sabores.map(({ produtoId, nome }) => ({ produtoId, nome })) ?? []);
  const [pacotes, setPacotes] = useState(item?.quantidade ?? 1);
  const [observacao, setObservacao] = useState(item?.observacao ?? "");
  const [aviso, setAviso] = useState(null);
  const [erroSacola, setErroSacola] = useState(null);

  const disponiveis = modo ? saboresDisponiveis(sabores, modo) : sabores;
  const divididos = dividirSabores(total, escolhidos, pacotes);
  const quantidadeDe = new Map(divididos.map((s) => [s.produtoId, s.quantidade]));
  const noLimite = escolhidos.length >= maximo;
  const valido = Boolean(modo) && escolhidos.length > 0;
  const temAssadoPronto = modo === "pronto" && escolhidos.some((s) => idsAssados.has(s.produtoId));

  const itemSacola = valido
    ? { produtoId: pacote.id, nome: pacote.nome, quantidade: pacotes, modo, sabores: divididos, tamanho: total, observacao }
    : null;
  // Preço só do banco. A observação não muda o preço, então não entra na consulta.
  const itemPreco = itemSacola && { produtoId: itemSacola.produtoId, nome: itemSacola.nome, quantidade: pacotes, modo, sabores: divididos };
  const { resumo, erro, calculando } = useCalcularPedido(itemPreco ? [itemPreco] : null);

  function escolherModo(novo) {
    if (novo === modo) return;
    const validos = new Set(saboresDisponiveis(todos, novo).map((s) => s.id));
    const removidos = escolhidos.filter((s) => !validos.has(s.produtoId));
    if (removidos.length > 0) {
      setEscolhidos(escolhidos.filter((s) => validos.has(s.produtoId)));
      const nomes = juntarNomes(removidos.map((s) => s.nome));
      setAviso(
        `Desmarcamos ${nomes} porque ${removidos.length > 1 ? "não estão disponíveis" : "não está disponível"} na opção ${NOME_MODO[novo]}.`,
      );
    } else {
      setAviso(null);
    }
    setModo(novo);
  }

  function alternarSabor(sabor) {
    const marcado = escolhidos.some((s) => s.produtoId === sabor.id);
    if (marcado) setEscolhidos(escolhidos.filter((s) => s.produtoId !== sabor.id));
    else if (!noLimite) setEscolhidos([...escolhidos, { produtoId: sabor.id, nome: sabor.nome }]);
  }

  function confirmar() {
    if (!itemSacola || !resumo || calculando) return;
    if (item) atualizarPacote(item.chave, itemSacola);
    else if (!adicionarPacote(itemSacola)) {
      setErroSacola("Seu pedido já tem o máximo de 30 itens. Finalize ou remova algum item.");
      return;
    }
    aoFechar();
  }

  let preco;
  if (!valido) preco = <span>A partir de {formatarPreco(pacote.preco)}</span>;
  else if (calculando || !resumo) {
    preco = (
      <span className="flex items-center gap-2">
        <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span className="sr-only">Calculando o preço</span>
      </span>
    );
  } else preco = <span className="tabular-nums">{formatarPreco(resumo.total)}</span>;

  return (
    <div className="relative flex h-full flex-col">
      <button
        type="button"
        onClick={aoFechar}
        aria-label="Fechar"
        className="absolute right-3 top-2 z-30 grid size-10 place-items-center rounded-full bg-superficie text-texto shadow-md ring-1 ring-borda-input transition hover:bg-fundo"
      >
        <IconeFechar className="size-5" />
      </button>

      {/* Única área com rolagem: cabeçalho e rodapé ficam sempre visíveis */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="relative h-[260px] w-full bg-fundo">
          {imagemDoProduto(pacote) ? (
            <Image src={imagemDoProduto(pacote)} alt={pacote.nome} fill sizes="(min-width: 640px) 576px, 100vw" className="object-cover" />
          ) : (
            <div aria-hidden="true" className="grid size-full place-items-center bg-[radial-gradient(var(--borda-suave)_1.5px,transparent_2px)] bg-[length:14px_14px] text-cobre">
              <IconeCaixaFesta className="size-16" />
            </div>
          )}
        </div>

        <h2
          id="titulo-montador"
          className="sticky top-0 z-20 flex h-14 items-center truncate bg-superficie pl-4 pr-16 text-[18px] font-bold text-texto"
        >
          <span className="truncate">{pacote.nome}</span>
        </h2>
        <div className="px-4 pb-4">
          <p className="text-texto-suave">{pacote.descricao || `Escolha até ${maximo} sabores`}</p>
          <p className="mt-1 text-texto">
            A partir de <span className="font-semibold tabular-nums">{formatarPreco(pacote.preco)}</span>
          </p>
        </div>

        <Secao titulo="Como você quer receber?" subtitulo="Escolha 1 opção" contagem={modo ? 1 : 0} maximo={1} completa={Boolean(modo)}>
          <fieldset className="divide-y divide-borda-suave">
            <legend className="sr-only">Como você quer receber? (obrigatório)</legend>
            {MODOS.map(({ id, titulo, detalhe }) => (
              <Opcao
                key={id}
                tipo="radio"
                nome="modo"
                checked={modo === id}
                onChange={() => escolherModo(id)}
                titulo={titulo}
                detalhe={detalhe}
              />
            ))}
          </fieldset>
          {aviso && <Aviso>{aviso}</Aviso>}
        </Secao>

        <Secao
          titulo="Sabores"
          subtitulo={`Escolha até ${maximo} ${maximo === 1 ? "opção" : "opções"}`}
          contagem={escolhidos.length}
          maximo={maximo}
          completa={escolhidos.length > 0}
        >
          {!modo && <p className="px-4 pt-3 text-sm font-medium text-texto-suave">Escolha primeiro como quer receber.</p>}
          {modo && noLimite && (
            <p className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-info-fundo px-3 py-2 text-sm font-medium text-info">
              <IconeAlerta className="size-4 shrink-0" />
              Máximo de {maximo} sabores
            </p>
          )}
          {GRUPOS.map(({ tipo, titulo }) => {
            const lista = disponiveis[tipo] ?? [];
            if (lista.length === 0) return null;
            return (
              <fieldset key={tipo}>
                <legend className="w-full px-4 pb-1 pt-4 text-sm font-bold uppercase tracking-wide text-texto-suave">{titulo}</legend>
                <div className="divide-y divide-borda-suave">
                  {lista.map((sabor) => {
                    const marcado = escolhidos.some((s) => s.produtoId === sabor.id);
                    const qtd = quantidadeDe.get(sabor.id);
                    return (
                      <Opcao
                        key={sabor.id}
                        tipo="checkbox"
                        checked={marcado}
                        disabled={!modo || (!marcado && noLimite)}
                        onChange={() => alternarSabor(sabor)}
                        titulo={sabor.nome}
                        detalhe={marcado ? `${qtd} unidades` : null}
                      />
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
          {temAssadoPronto && (
            <Aviso>Assados prontos são por encomenda: você escolhe a data (a partir de amanhã) ao finalizar o pedido.</Aviso>
          )}
        </Secao>

        <div className="border-t border-borda-suave px-4 py-4">
          <div className="mb-2 flex items-baseline justify-between">
            <label htmlFor="obs-pacote" className="font-semibold text-texto">
              Alguma observação?
            </label>
            <span className="text-sm text-texto-suave tabular-nums" aria-live="polite">
              {observacao.length}/{LIMITE_OBSERVACAO}
            </span>
          </div>
          <textarea
            id="obs-pacote"
            maxLength={LIMITE_OBSERVACAO}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex.: separar os sabores em embalagens diferentes"
            className="min-h-24 w-full rounded-xl bg-superficie px-3 py-2.5 text-texto ring-1 ring-borda-input placeholder:text-texto-suave"
          />
        </div>
      </div>

      {(erro || erroSacola) && (
        <div className="space-y-2 border-t border-borda-suave bg-superficie px-4 pt-3">
          {erro && <AlertaErro>{erro}</AlertaErro>}
          {erroSacola && <AlertaErro>{erroSacola}</AlertaErro>}
        </div>
      )}

      {/* Rodapé fixo */}
      <footer className="flex items-center gap-3 border-t border-borda-suave bg-superficie px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3">
        <div className="flex shrink-0 items-center rounded-xl bg-superficie ring-1 ring-borda-input">
          <button
            type="button"
            onClick={() => setPacotes(Math.max(1, pacotes - 1))}
            disabled={pacotes <= 1}
            aria-label="Diminuir quantidade de pacotes"
            className="grid size-11 place-items-center rounded-xl text-ferrugem transition hover:bg-fundo disabled:cursor-not-allowed disabled:text-desabilitado disabled:hover:bg-transparent"
          >
            <IconeMenos className="size-4" />
          </button>
          <span className="min-w-6 text-center font-bold tabular-nums" aria-live="polite" aria-label={`${pacotes} pacotes`}>
            {pacotes}
          </span>
          <button
            type="button"
            onClick={() => setPacotes(Math.min(MAX_PACOTES, pacotes + 1))}
            disabled={pacotes >= MAX_PACOTES}
            aria-label="Aumentar quantidade de pacotes"
            className="grid size-11 place-items-center rounded-xl text-ferrugem transition hover:bg-fundo disabled:cursor-not-allowed disabled:text-desabilitado disabled:hover:bg-transparent"
          >
            <IconeMais className="size-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={confirmar}
          disabled={!valido || !resumo || calculando}
          className={`${CLASSE_BOTAO_PRINCIPAL} justify-between`}
        >
          <span>{item ? "Salvar alterações" : "Adicionar ao pedido"}</span>
          {preco}
        </button>
      </footer>
    </div>
  );
}

/**
 * Tela "Montar pacote". Modal no desktop, tela inteira no celular. Uma instância só, na página
 * do cardápio; abre por `abrirMontador` (card do pacote ou "Editar" na sacola).
 * <dialog> com showModal: aria-modal, foco preso, Esc fecha e o foco volta para quem abriu.
 */
export default function MontadorPacote({ pacotes, sabores }) {
  const pedido = useMontador();
  const { itens } = useSacola();
  const dialogo = useRef(null);

  useEffect(() => {
    const d = dialogo.current;
    if (pedido && !d.open) d.showModal();
    if (!pedido && d.open) d.close();
  }, [pedido]);

  const pacote = pedido ? pacotes.find((p) => p.id === pedido.pacoteId) : null;
  const item = pedido?.chave ? itens.find((i) => i.chave === pedido.chave) : null;
  const fechar = () => dialogo.current?.close();

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="titulo-montador"
      onClose={fecharMontador}
      onClick={(e) => e.target === dialogo.current && fechar()}
      className="sheet m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-superficie p-0 text-texto sm:m-auto sm:h-[min(90dvh,860px)] sm:max-w-xl sm:rounded-2xl"
    >
      {pedido && pacote && (pedido.chave ? item : true) ? (
        <Formulario key={pedido.id} pacote={pacote} sabores={sabores} item={item} aoFechar={fechar} />
      ) : (
        pedido && (
          <div className="p-6">
            <p id="titulo-montador" className="font-bold text-texto">
              Este pacote não está mais disponível no cardápio.
            </p>
            <button type="button" onClick={fechar} className={`${CLASSE_BOTAO_PRINCIPAL} mt-4`}>
              Fechar
            </button>
          </div>
        )
      )}
    </dialog>
  );
}
