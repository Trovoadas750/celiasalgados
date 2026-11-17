"use client";

import { useState } from "react";
import { AlertaErro } from "@/components/cliente/Campo";
import { CLASSE_BOTAO_PRINCIPAL } from "@/components/cliente/estilos";
import { IconeAlerta, IconeCaixaFesta, IconeCheck, IconeFechar, IconeMais, IconeMenos } from "@/components/icones";
import { adicionarPacote, atualizarPacote, itensParaPedido, LIMITE_OBSERVACAO, useSacola } from "@/components/sacola/sacola-store";
import { useCalcularPedido } from "@/components/sacola/useCalcularPedido";
import { saboresDisponiveis } from "@/lib/cardapio";
import { dividirSabores } from "@/lib/dividirSabores";
import { formatarPreco } from "@/lib/formatar";
import {
  ajustarQuantidade,
  kitParaSugerir,
  quantidadeAbaixo,
  quantidadeAcima,
  situacaoLivre,
  textoDivisao,
  totalSalgados,
} from "@/lib/livre";
import { LOJA } from "@/lib/loja";
import { comQualidades } from "@/lib/qualidades";
import { abrirMontador } from "./montador-store";
import { Aviso, GRUPOS, juntarNomes, MODOS, NOME_MODO, Opcao, Secao } from "./montador-pecas";

const BOTAO_REDONDO =
  "grid size-10 place-items-center rounded-full text-ferrugem transition hover:bg-fundo disabled:cursor-not-allowed disabled:text-desabilitado disabled:hover:bg-transparent";

/**
 * Quantidade de uma qualidade: "Adicionar" (0) → mínimo; depois − / + no múltiplo, ou digitando
 * (ao sair do campo, ajusta para o múltiplo mais próximo, respeitando o mínimo).
 */
function SeletorQuantidade({ nome, quantidade, regras, desabilitado, podeAumentar, aoMudar }) {
  const [texto, setTexto] = useState(String(quantidade));
  const [anterior, setAnterior] = useState(quantidade);
  if (quantidade !== anterior) {
    setAnterior(quantidade);
    setTexto(String(quantidade));
  }

  if (quantidade === 0) {
    return (
      <button
        type="button"
        disabled={desabilitado}
        onClick={() => aoMudar(quantidadeAcima(0, regras))}
        aria-label={`Adicionar ${nome}`}
        className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-4 text-sm font-bold text-link ring-2 ring-link transition hover:text-ferrugem-ativo hover:ring-ferrugem-ativo disabled:cursor-not-allowed disabled:text-desabilitado disabled:ring-1 disabled:ring-borda-suave"
      >
        <IconeMais className="size-4" /> Adicionar
      </button>
    );
  }

  function confirmarTexto() {
    const q = ajustarQuantidade(texto, regras);
    setTexto(String(q));
    if (q !== quantidade) aoMudar(q);
  }

  return (
    <div className="flex shrink-0 items-center rounded-full bg-superficie ring-1 ring-borda-input">
      <button type="button" onClick={() => aoMudar(quantidadeAbaixo(quantidade, regras))} aria-label={`Tirar ${regras.multiplo} de ${nome}`} className={BOTAO_REDONDO}>
        <IconeMenos className="size-4" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label={`Quantidade de ${nome}`}
        value={texto}
        onChange={(e) => setTexto(e.target.value.replace(/\D/g, ""))}
        onBlur={confirmarTexto}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="w-12 bg-transparent text-center font-bold tabular-nums text-texto"
      />
      <button
        type="button"
        onClick={() => aoMudar(quantidadeAcima(quantidade, regras))}
        disabled={!podeAumentar}
        aria-label={`Pôr mais ${regras.multiplo} de ${nome}`}
        className={BOTAO_REDONDO}
      >
        <IconeMais className="size-4" />
      </button>
    </div>
  );
}

/**
 * Montagem do "Monte do seu jeito": modo, qualidades com quantidades à vontade e observação.
 * O preço vem só do banco (calcular_pedido); aqui só se conferem as regras para guiar o cliente.
 *
 * @param {{ livre: object, kits: object[], sabores: { frito, assado, variado }, item?: object | null,
 *           aoFechar: () => void,
 *           aoConfirmar?: (item) => boolean | void,          // painel: recebe o item em vez de ir para a sacola
 *           aoTrocarParaKit?: (kit, inicial) => void }} props  // painel: abre a montagem do kit
 */
export function FormularioLivre({ livre, kits, sabores, item = null, aoFechar, aoConfirmar, aoTrocarParaKit }) {
  const regras = livre.regras;
  const maxQualidades = livre.max_sabores ?? 10;
  const todos = [...sabores.frito, ...sabores.assado, ...sabores.variado];
  const saboresPorId = new Map(todos.map((s) => [s.id, s]));
  const idsAssados = new Set(sabores.assado.map((s) => s.id));

  // Campos do item (edição) lidos com checagem explícita: item = null num pedido novo. O React
  // Compiler pode tornar obrigatória uma leitura "item.x" que só acontece num clique (ver admin/Topo.js).
  const chaveItem = item ? item.chave : null;
  const [modo, setModo] = useState(item ? item.modo : null);
  // Escolhidas na ordem em que foram adicionadas, com a quantidade de cada (sempre > 0).
  const [lista, setLista] = useState(() => (item ? item.sabores.map(({ produtoId, nome, quantidade }) => ({ produtoId, nome, quantidade })) : []));
  const [observacao, setObservacao] = useState(item && item.observacao ? item.observacao : "");
  const [aviso, setAviso] = useState(null);
  const [erroSacola, setErroSacola] = useState(null);

  const disponiveis = modo ? saboresDisponiveis(sabores, modo) : sabores;
  const total = totalSalgados(lista);
  const noLimite = lista.length >= maxQualidades;
  const situacao = situacaoLivre({ modo, sabores: lista, regras });
  const temAssadoPronto = modo === "pronto" && lista.some((s) => idsAssados.has(s.produtoId));
  const quantidadeDe = new Map(lista.map((s) => [s.produtoId, s.quantidade]));

  // Preço do item (só quando cumpre as regras: antes disso o banco recusaria).
  const itemPedido = situacao.pronto ? { produtoId: livre.id, nome: livre.nome, quantidade: 1, modo, sabores: lista } : null;
  const preco = useCalcularPedido(itemPedido ? [itemPedido] : null, 400);
  const linhaBanco = preco.resumo && preco.resumo.itens ? preco.resumo.itens[0] : null; // valor oficial
  const linhaPrevia = preco.previa && preco.previa.itens ? preco.previa.itens[0] : null; // prévia enquanto calcula
  const subtotal = linhaBanco ? linhaBanco.subtotal : linhaPrevia ? linhaPrevia.subtotal : null;

  // Mais de 100 salgados vale para o CARRINHO inteiro (kits + "à vontade"): soma no banco.
  const { itens: sacola } = useSacola();
  const outros = aoConfirmar ? [] : sacola.filter((i) => i.chave !== chaveItem);
  const carrinho = useCalcularPedido(itemPedido && outros.length ? [...itensParaPedido(outros), itemPedido] : null, 600);
  const salgadosOutros = outros.filter((i) => i.modo).reduce((soma, i) => soma + totalSalgados(i.sabores), 0);
  const resumoCarrinho = carrinho.resumo;
  const totalCarrinho = resumoCarrinho ? resumoCarrinho.total_salgados : total + salgadosOutros;
  const limiteBanco = resumoCarrinho ? resumoCarrinho.limite_entrega : preco.resumo ? preco.resumo.limite_entrega : null;
  const limite = limiteBanco ?? LOJA.limiteEntrega;
  const acimaDoLimite = totalCarrinho > limite;

  // Sugestão de kit: mesmo tamanho, qualidades cabem e o kit sai mais barato (preços do banco).
  const kit = situacao.pronto ? kitParaSugerir({ total, sabores: lista, modo, kits, saboresPorId }) : null;
  const kitSabores = kit ? dividirSabores(kit.salgados_a_escolher, lista.map(({ produtoId, nome }) => ({ produtoId, nome })), 1) : [];
  const precoKit = useCalcularPedido(kit ? [{ produtoId: kit.id, nome: kit.nome, quantidade: 1, modo, sabores: kitSabores }] : null, 500);
  const linhaKit = precoKit.resumo && precoKit.resumo.itens ? precoKit.resumo.itens[0] : null;
  const subtotalKit = linhaKit ? linhaKit.subtotal : null;
  const sugerirKit = Boolean(kit) && linhaBanco != null && subtotalKit != null && subtotalKit < linhaBanco.subtotal;

  const bloqueado = !situacao.pronto || (Boolean(preco.erro) && !preco.calculando);

  function escolherModo(novo) {
    if (novo === modo) return;
    const validos = new Set(saboresDisponiveis(todos, novo).map((s) => s.id));
    const removidos = lista.filter((s) => !validos.has(s.produtoId));
    if (removidos.length > 0) {
      setLista(lista.filter((s) => validos.has(s.produtoId)));
      const nomes = juntarNomes(removidos.map((s) => s.nome));
      setAviso(`Tiramos ${nomes} porque ${removidos.length > 1 ? "não estão disponíveis" : "não está disponível"} na opção ${NOME_MODO[novo]}.`);
    } else {
      setAviso(null);
    }
    setModo(novo);
  }

  function mudarQuantidade(sabor, quantidade) {
    const existe = lista.some((s) => s.produtoId === sabor.id);
    if (quantidade <= 0) setLista(lista.filter((s) => s.produtoId !== sabor.id));
    else if (existe) setLista(lista.map((s) => (s.produtoId === sabor.id ? { ...s, quantidade } : s)));
    else if (!noLimite) setLista([...lista, { produtoId: sabor.id, nome: sabor.nome, quantidade }]);
  }

  function trocarParaKit() {
    const inicial = { modo, sabores: lista.map(({ produtoId, nome }) => ({ produtoId, nome })) };
    if (aoTrocarParaKit) aoTrocarParaKit(kit, inicial);
    else abrirMontador({ pacoteId: kit.id, inicial, substituir: chaveItem });
  }

  function confirmar() {
    if (!itemPedido || bloqueado) return;
    // Nome como o banco devolve ("Monte do seu jeito (70 salgados)").
    const nome = linhaBanco ? linhaBanco.nome_produto : `${livre.nome} (${total} salgados)`;
    const novo = { produtoId: livre.id, nome, quantidade: 1, modo, sabores: lista, observacao, livre: true };
    if (aoConfirmar) {
      if (aoConfirmar(novo) === false) return setErroSacola("O pedido já tem o máximo de 30 itens.");
    } else if (chaveItem) atualizarPacote(chaveItem, novo);
    else if (!adicionarPacote(novo)) {
      setErroSacola("Seu pedido já tem o máximo de 30 itens. Finalize ou remova algum item.");
      return;
    }
    aoFechar();
  }

  let rotuloBotao;
  if (!situacao.pronto) rotuloBotao = <span className="w-full text-center text-sm">{situacao.rodape}</span>;
  else {
    let valor;
    if (subtotal != null) valor = <span className="tabular-nums">{formatarPreco(subtotal)}</span>;
    else if (preco.calculando) {
      valor = (
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="sr-only">Calculando o preço</span>
        </span>
      );
    } else valor = <span>—</span>;
    rotuloBotao = (
      <>
        <span>{chaveItem ? "Salvar alterações" : "Adicionar"}</span>
        {valor}
      </>
    );
  }

  const contador = (
    <div className="mt-2 space-y-2" aria-live="polite">
      <p className="text-sm font-bold text-texto tabular-nums">
        Total: {total} salgados · {lista.length} {lista.length === 1 ? "qualidade" : "qualidades"}
      </p>
      {situacao.aviso && <p className="text-sm font-semibold text-aviso-texto">{situacao.aviso}</p>}
      {situacao.pronto && (
        <p className="flex items-center gap-1 text-sm font-semibold text-sucesso">
          <IconeCheck className="size-4" /> Pedido mínimo atingido
        </p>
      )}
      {acimaDoLimite && (
        <p role="status" className="flex items-start gap-2 rounded-xl bg-aviso-fundo px-3 py-2.5 text-sm font-bold text-aviso-texto ring-2 ring-aviso-texto">
          <IconeAlerta className="mt-px size-5 shrink-0" />
          <span>
            Pedidos com mais de {limite} salgados são apenas para RETIRADA NO LOCAL e precisam ser AGENDADOS com pelo menos 1 dia
            de antecedência (a partir de amanhã).
          </span>
        </p>
      )}
    </div>
  );

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

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <h2
          id="titulo-montador"
          className="sticky top-0 z-20 flex h-14 items-center truncate border-b-2 border-vinho bg-superficie pl-4 pr-16 text-[18px] font-bold text-texto"
        >
          <span className="truncate">{livre.nome}</span>
        </h2>
        <div className="px-4 pb-4 pt-3">
          <p className="text-texto-suave">{comQualidades(livre.descricao) || "Escolha a quantidade e as qualidades que quiser"}</p>
        </div>

        <Secao titulo="Como você quer receber?" subtitulo="Escolha 1 opção" contagem={modo ? 1 : 0} maximo={1} completa={Boolean(modo)}>
          <fieldset className="divide-y divide-borda-suave">
            <legend className="sr-only">Como você quer receber? (obrigatório)</legend>
            {MODOS.map(({ id, titulo, detalhe }) => (
              <Opcao key={id} tipo="radio" nome="modo-livre" checked={modo === id} onChange={() => escolherModo(id)} titulo={titulo} detalhe={detalhe} />
            ))}
          </fieldset>
          {aviso && <Aviso>{aviso}</Aviso>}
        </Secao>

        <Secao
          titulo="Escolha as qualidades e as quantidades"
          subtitulo={`Pedido mínimo: ${regras.quantidade_minima} salgados e ${regras.minimo_qualidades} qualidades · cada qualidade com pelo menos ${regras.minimo_por_sabor}, de ${regras.multiplo} em ${regras.multiplo} · até ${maxQualidades} qualidades`}
          contagem={lista.length}
          maximo={maxQualidades}
          completa={situacao.pronto}
          extra={contador}
        >
          {!modo && <p className="px-4 pt-3 text-sm font-medium text-texto-suave">Escolha primeiro como quer receber.</p>}
          {modo && noLimite && (
            <p className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-info-fundo px-3 py-2 text-sm font-medium text-info">
              <IconeAlerta className="size-4 shrink-0" />
              Máximo de {maxQualidades} qualidades
            </p>
          )}
          {GRUPOS.map(({ tipo, titulo }) => {
            const grupo = disponiveis[tipo] ?? [];
            if (grupo.length === 0) return null;
            return (
              <fieldset key={tipo} className="mx-4 mt-6 last:mb-4">
                <legend className="mb-2 flex w-full items-center gap-3">
                  <span className="inline-flex h-8 items-center rounded-full bg-vinho px-3.5 text-sm font-bold uppercase tracking-wide text-creme">
                    {titulo}
                  </span>
                  <span aria-hidden="true" className="h-0.5 flex-1 rounded-full bg-borda-suave" />
                </legend>
                <div className="divide-y divide-borda-suave overflow-hidden rounded-xl bg-superficie ring-1 ring-borda-suave">
                  {grupo.map((sabor) => {
                    const qtd = quantidadeDe.get(sabor.id) ?? 0;
                    const desabilitado = !modo || (qtd === 0 && noLimite);
                    return (
                      <div key={sabor.id} className="flex min-h-14 items-center justify-between gap-3 px-4 py-2.5">
                        <span className={`min-w-0 font-medium leading-snug ${desabilitado ? "text-desabilitado" : "text-texto"}`}>{sabor.nome}</span>
                        <SeletorQuantidade
                          nome={sabor.nome}
                          quantidade={qtd}
                          regras={regras}
                          desabilitado={desabilitado}
                          podeAumentar={total + regras.multiplo <= regras.quantidade_maxima}
                          aoMudar={(q) => mudarQuantidade(sabor, q)}
                        />
                      </div>
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

        {sugerirKit && (
          <div className="mx-4 mt-4 rounded-xl bg-info-fundo p-3 text-info ring-2 ring-info">
            <p className="flex items-start gap-2 text-sm font-bold">
              <IconeCaixaFesta className="mt-px size-5 shrink-0" />
              <span>
                Com essas qualidades, o kit {kit.nome} sai por {formatarPreco(subtotalKit)} (a divisão fica{" "}
                {textoDivisao(kitSabores.map((s) => s.quantidade))}).
              </span>
            </p>
            <button
              type="button"
              onClick={trocarParaKit}
              className="mt-2 ml-7 inline-flex h-10 items-center rounded-xl bg-superficie px-3 text-sm font-bold text-link ring-2 ring-link hover:text-ferrugem-ativo"
            >
              Trocar para o kit
            </button>
          </div>
        )}

        <div className="mt-4 border-t border-borda-suave px-4 py-4">
          <div className="mb-2 flex items-baseline justify-between">
            <label htmlFor="obs-livre" className="font-semibold text-texto">
              Alguma observação?
            </label>
            <span className="text-sm text-texto-suave tabular-nums" aria-live="polite">
              {observacao.length}/{LIMITE_OBSERVACAO}
            </span>
          </div>
          <textarea
            id="obs-livre"
            maxLength={LIMITE_OBSERVACAO}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex.: separar as qualidades em embalagens diferentes"
            className="min-h-24 w-full rounded-xl bg-superficie px-3 py-2.5 text-texto ring-1 ring-borda-input placeholder:text-texto-suave"
          />
        </div>
      </div>

      {(preco.erro || erroSacola) && (
        <div className="space-y-2 border-t border-borda-suave bg-superficie px-4 pt-3">
          {preco.erro && <AlertaErro>{preco.erro}</AlertaErro>}
          {erroSacola && <AlertaErro>{erroSacola}</AlertaErro>}
        </div>
      )}

      <footer className="border-t border-borda-suave bg-superficie px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3">
        <button type="button" onClick={confirmar} disabled={bloqueado} className={`${CLASSE_BOTAO_PRINCIPAL} justify-between`}>
          {rotuloBotao}
        </button>
      </footer>
    </div>
  );
}
