"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BlocoPagamento, { lerValor, validarPagamento } from "@/components/checkout/BlocoPagamento";
import { OpcaoRadio } from "@/components/checkout/BlocoEntrega";
import FormEndereco, { ENDERECO_VAZIO } from "@/components/checkout/FormEndereco";
import { useFreteEntrega } from "@/components/checkout/ResumoFrete";
import Campo, { AlertaErro, MensagemErro } from "@/components/cliente/Campo";
import { IconeAlerta, IconeCheck, IconeWhatsappOficial } from "@/components/icones";
import { itensParaPedido, juntarObservacoes, LIMITE_OBSERVACAO } from "@/components/sacola/sacola-store";
import { useCalcularPedido } from "@/components/sacola/useCalcularPedido";
import { dataEmBrasilia, dataHora } from "@/lib/admin/datas";
import { linkWhatsappCliente, mensagemConfirmacaoPainel } from "@/lib/admin/mensagens";
import { carregarParaRepetir, criarPedidoAdmin } from "@/lib/admin/novoPedido";
import { buscarResumoCliente } from "@/lib/admin/pedidos";
import { listarCardapio } from "@/lib/cardapio";
import { calcularFrete } from "@/lib/frete";
import { formatarDiaComSemana, formatarHora, formatarPreco, formatarTelefone, formatarValor } from "@/lib/formatar";
import { enderecoDoSite } from "@/lib/loja";
import { linkAcompanhamento, textoFormaPagamento } from "@/lib/mensagemWhatsapp";
import { mascararTelefone, soDigitos, temErros, validar } from "@/lib/validacao";
import { useAdmin } from "../AdminProvider";
import EscolherHorario from "../EscolherHorario";
import { CLASSE_BOTAO_CONTORNO, CLASSE_BOTAO_PRINCIPAL, CLASSE_BOTAO_SECUNDARIO } from "../estilos";
import { IconeBloqueio, IconeImpressora } from "../icones";
import ItensNovoPedido from "./ItensNovoPedido";

const CLIENTE_VAZIO = { telefone: "", nome: "", sobrenome: "" };
const QUANDO_VAZIO = { tipo: "agora", data: "", inicio: "" };

function Secao({ numero, titulo, children, id }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl bg-fundo pt-2">
      <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-ferrugem-hover">
        <span className="grid size-8 place-items-center rounded-full bg-vinho text-sm font-bold text-creme">{numero}</span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

/** ?data=2026-10-23&hora=10:30 (vindo da agenda) -> já marca "Agendar" com o horário. */
function quandoDaUrl(sp) {
  const data = sp.get("data");
  const hora = sp.get("hora");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data ?? "")) return QUANDO_VAZIO;
  return { tipo: "agendar", data, inicio: /^\d{2}:\d{2}$/.test(hora ?? "") ? dataHora(data, hora) : "" };
}

/** "Ana Lima Souza" -> { nome: "Ana", sobrenome: "Lima Souza" } */
function dividirNome(completo) {
  const [nome = "", ...resto] = String(completo ?? "").trim().split(/\s+/);
  return { nome, sobrenome: resto.join(" ") };
}

function focarPrimeiroErro() {
  requestAnimationFrame(() => {
    const alvo = document.querySelector('[aria-invalid="true"], [data-erro]');
    alvo?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (alvo?.matches("input, textarea")) alvo.focus({ preventScroll: true });
  });
}

/** Tela de sucesso depois de lançar. */
function Lancado({ pedido, aoLancarOutro }) {
  const quandoTexto = pedido.agendadoPara
    ? `${formatarDiaComSemana(pedido.agendadoPara)} às ${formatarHora(pedido.agendadoPara)}`
    : "o quanto antes";
  const pagamentoTexto = textoFormaPagamento({ forma: pedido.forma, trocoPara: pedido.trocoPara, agendadoPara: null, tipoEntrega: pedido.tipoEntrega });
  const mensagem = mensagemConfirmacaoPainel({
    numero: pedido.numero,
    total: pedido.total,
    tipoEntrega: pedido.tipoEntrega,
    quandoTexto,
    pagamentoTexto,
    link: linkAcompanhamento(pedido.codigoAcompanhamento, enderecoDoSite()),
  });

  return (
    <div className="mx-auto max-w-md pt-6 text-center">
      <span className="mx-auto grid size-20 place-items-center rounded-full bg-sucesso-fundo text-sucesso">
        <IconeCheck className="size-10" />
      </span>
      <h1 className="traco-vinho mt-4 font-titulo text-[28px] text-ferrugem">Pedido nº {pedido.numero} lançado!</h1>
      <p className="mt-1 text-[15px]">
        {pedido.nome} · Total <strong className="tabular-nums">{formatarPreco(pedido.total)}</strong> · {quandoTexto}
      </p>
      <div className="mt-6 space-y-2 text-left">
        <a href={linkWhatsappCliente(pedido.telefone, mensagem)} target="_blank" rel="noopener noreferrer" className={CLASSE_BOTAO_PRINCIPAL}>
          <IconeWhatsappOficial className="size-5" /> Enviar confirmação ao cliente no WhatsApp
        </a>
        <button type="button" onClick={() => window.open(`/admin/imprimir?ids=${pedido.numero}`, "_blank")} className={`${CLASSE_BOTAO_CONTORNO} w-full`}>
          <IconeImpressora className="size-5" /> Imprimir comanda
        </button>
        <Link href={`/admin/pedidos?pedido=${pedido.numero}`} className={`${CLASSE_BOTAO_CONTORNO} w-full`}>
          Ver o pedido
        </Link>
        <button type="button" onClick={aoLancarOutro} className={CLASSE_BOTAO_SECUNDARIO}>
          Lançar outro pedido
        </button>
      </div>
    </div>
  );
}

/**
 * /admin/pedidos/novo — pedido por telefone, WhatsApp ou balcão. Preenche por URL:
 * ?repetir=42 (copia um pedido antigo) · ?data=2026-10-23&hora=10:30 (horário da agenda) · ?telefone=14999990001
 */
export default function NovoPedido() {
  const sp = useSearchParams();
  const router = useRouter();
  const { sessaoExpirou } = useAdmin();

  const [cardapio, setCardapio] = useState(null);
  const [erroCardapio, setErroCardapio] = useState(null);
  // Telefone e horário vindos da URL (?telefone= · ?data=&hora= da agenda) já entram no valor inicial.
  const [cliente, setCliente] = useState(() => ({ ...CLIENTE_VAZIO, telefone: mascararTelefone(sp.get("telefone") ?? "") }));
  const [conhecido, setConhecido] = useState(null); // { telefone, dados }
  const [itens, setItens] = useState([]);
  const [montando, setMontando] = useState(null);
  const [recebimento, setRecebimento] = useState(null);
  const [endereco, setEndereco] = useState(ENDERECO_VAZIO);
  const [quando, setQuando] = useState(() => quandoDaUrl(sp));
  const [recargaHorarios, setRecargaHorarios] = useState(0);
  const [pagamento, setPagamento] = useState({ forma: "", troco: "" });
  const [observacao, setObservacao] = useState("");
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [lancado, setLancado] = useState(null);
  const preenchido = useRef(false);

  // Cardápio ativo (mesma leitura pública do site).
  useEffect(() => {
    listarCardapio()
      .then(setCardapio)
      .catch((e) => setErroCardapio(e.message));
  }, []);

  // "Repetir pedido" (?repetir=42): copia o pedido antigo uma vez, depois que o cardápio chega.
  useEffect(() => {
    if (!cardapio || preenchido.current) return;
    preenchido.current = true;
    const repetir = sp.get("repetir");
    if (/^\d+$/.test(repetir ?? "")) {
      carregarParaRepetir(Number(repetir), cardapio)
        .then((r) => {
          setCliente({ ...r.cliente, telefone: mascararTelefone(r.cliente.telefone) });
          setItens(r.itens);
          setRecebimento(r.tipoEntrega);
          if (r.endereco) setEndereco(r.endereco);
          setPagamento({ forma: r.forma, troco: "" });
          setObservacao(r.observacao);
          setAviso(
            r.ignorados.length
              ? `Copiado do pedido nº ${repetir}. Ficaram de fora (não estão mais no cardápio): ${r.ignorados.join(", ")}.`
              : `Copiado do pedido nº ${repetir}. Confira tudo antes de lançar.`,
          );
        })
        .catch((e) => {
          if (e.sessaoExpirada) sessaoExpirou();
          setAviso(`Não foi possível copiar o pedido nº ${repetir}: ${e.message}`);
        });
    }
  }, [cardapio, sp, sessaoExpirou]);

  // Telefone conhecido: mostra o histórico e preenche o nome (se ainda vazio).
  const digitos = soDigitos(cliente.telefone);
  useEffect(() => {
    if (digitos.length < 10) return;
    let ativo = true;
    const espera = setTimeout(() => {
      buscarResumoCliente(digitos)
        .then((dados) => {
          if (!ativo) return;
          setConhecido({ telefone: digitos, dados });
          if (dados) setCliente((c) => (c.nome || c.sobrenome ? c : { ...c, ...dividirNome(dados.nome) }));
        })
        .catch(() => {});
    }, 400);
    return () => {
      ativo = false;
      clearTimeout(espera);
    };
  }, [digitos]);
  const clienteConhecido = conhecido && conhecido.telefone === digitos ? conhecido.dados : null;

  // Valores: só do banco (calcular_pedido), com frete quando é entrega.
  const comEntrega = recebimento === "entrega";
  const itensPedido = itens.length ? itensParaPedido(itens) : null;
  const { resumo, erro: erroCalculo, calculando } = useCalcularPedido(itensPedido);
  const frete = useFreteEntrega(comEntrega, endereco);
  // Campos do frete lidos com checagem explícita (frete = null fora da entrega; ver admin/Topo.js: React Compiler).
  const freteStatus = frete ? frete.status : null;
  const freteValor = frete ? frete.valor : null;
  const freteChave = frete ? frete.chave : null;
  const calcularFreteAgora = frete ? frete.calcularAgora : undefined;
  const freteOk = comEntrega && freteStatus === "ok";
  const comFrete = useCalcularPedido(
    freteOk ? itensPedido : null,
    300,
    freteOk ? { rua: endereco.rua, numero: endereco.numero, vila: endereco.vila, chave: freteChave } : null,
  );
  const resumoFinal = comEntrega ? (freteOk ? comFrete.resumo : null) : resumo;
  const calculandoFinal = comEntrega ? freteOk && comFrete.calculando : calculando;
  const observacaoFinal = juntarObservacoes(itens, observacao);

  function limparErro(campo) {
    if (erros[campo]) setErros(({ [campo]: _x, ...resto }) => resto);
  }

  function validarTudo() {
    const novos = {
      ...validar(cliente, ["nome", "sobrenome", "telefone"]),
      ...(comEntrega ? validar(endereco, ["cep", "rua", "vila", "numero", "ponto_referencia"]) : {}),
      ...validarPagamento(pagamento, resumoFinal?.total ?? 0, false),
      ...validar({ observacao }, ["observacao"]),
    };
    if (itens.length === 0) novos.itens = "Adicione pelo menos um item.";
    if (!recebimento) novos.recebimento = "Escolha entrega ou retirada.";
    if (comEntrega && freteStatus && !["ok", "calculando", "aguardando_endereco"].includes(freteStatus)) {
      novos.rua = "Não foi possível calcular o frete deste endereço. Confira o endereço ou lance como retirada.";
    }
    if (quando.tipo === "agendar" && !quando.inicio) novos.horario = "Escolha a data e um horário livre.";
    if (observacaoFinal.length > LIMITE_OBSERVACAO) novos.observacao = `As observações juntas passam de ${LIMITE_OBSERVACAO} caracteres.`;
    return novos;
  }

  async function lancar(e) {
    e.preventDefault();
    if (enviando || calculandoFinal) return;
    const novos = validarTudo();
    setErros(novos);
    setErroGeral(null);
    if (temErros(novos)) return focarPrimeiroErro();
    if (!resumoFinal) {
      setErroGeral(comEntrega ? "Aguarde o cálculo do frete e do total." : "Aguarde o cálculo do total.");
      return;
    }

    setEnviando(true);
    const dados = {
      cliente: { nome: cliente.nome.trim(), sobrenome: cliente.sobrenome.trim(), telefone: digitos },
      tipoEntrega: recebimento,
      endereco: comEntrega ? endereco : null,
      cep: comEntrega ? endereco.cep : null,
      itens: itensPedido,
      agendadoPara: quando.tipo === "agendar" ? quando.inicio : null,
      formaPagamento: pagamento.forma,
      trocoPara: pagamento.forma === "dinheiro" ? lerValor(pagamento.troco) : null,
      observacao: observacaoFinal,
    };
    try {
      let criado;
      try {
        criado = await criarPedidoAdmin(dados);
      } catch (erro) {
        if (!erro.precisaFrete || !comEntrega) throw erro;
        await calcularFrete(endereco);
        criado = await criarPedidoAdmin(dados);
      }
      setLancado({
        ...criado,
        nome: dados.cliente.nome,
        telefone: digitos,
        tipoEntrega: recebimento,
        agendadoPara: dados.agendadoPara,
        forma: dados.formaPagamento,
        trocoPara: dados.trocoPara,
      });
      window.scrollTo({ top: 0 });
    } catch (erro) {
      if (erro.sessaoExpirada) sessaoExpirou();
      setErroGeral(erro.message);
      if (/horário/i.test(erro.message)) setRecargaHorarios((r) => r + 1);
    }
    setEnviando(false);
  }

  function lancarOutro() {
    setLancado(null);
    setCliente(CLIENTE_VAZIO);
    setConhecido(null);
    setItens([]);
    setRecebimento(null);
    setEndereco(ENDERECO_VAZIO);
    setQuando(QUANDO_VAZIO);
    setPagamento({ forma: "", troco: "" });
    setObservacao("");
    setErros({});
    setErroGeral(null);
    setAviso(null);
    router.replace("/admin/pedidos/novo");
  }

  if (lancado) return <Lancado pedido={lancado} aoLancarOutro={lancarOutro} />;

  return (
    <form onSubmit={lancar} noValidate className="mx-auto max-w-3xl space-y-6 pb-8">
      <div>
        <h1 className="traco-vinho font-titulo text-[28px] leading-tight text-ferrugem">Novo pedido</h1>
        <p className="mt-1 text-[15px] text-texto-suave">
          Pedido por telefone, WhatsApp ou balcão. Pelo painel vale agendar sem conta, lançar com a loja fechada ou pausada e
          receber em dinheiro no agendamento. O pagamento fica combinado com a loja (não expira).
        </p>
      </div>

      {aviso && (
        <p role="status" className="flex items-start gap-2 rounded-xl bg-info-fundo px-3 py-2.5 text-sm font-semibold text-info">
          <IconeAlerta className="mt-px size-5 shrink-0" />
          <span>{aviso}</span>
        </p>
      )}

      <Secao numero={1} titulo="Cliente">
        <div className="space-y-3 rounded-2xl bg-superficie p-4 ring-1 ring-borda-suave">
          <Campo
            rotulo="Telefone"
            inputMode="tel"
            autoComplete="off"
            placeholder="(14) 99999-0000"
            value={cliente.telefone}
            erro={erros.telefone}
            onChange={(e) => {
              setCliente({ ...cliente, telefone: mascararTelefone(e.target.value) });
              limparErro("telefone");
            }}
          />
          {clienteConhecido && (
            <div className="rounded-xl bg-fundo px-3 py-2 text-sm">
              <p className="font-semibold">
                Já conhecido: {clienteConhecido.nome} · {clienteConhecido.pedidos} pedido(s)
                {clienteConhecido.cliente_id ? " · tem conta" : ""}
              </p>
              {clienteConhecido.bloqueado && (
                <p className="mt-1 flex items-start gap-1.5 font-bold text-erro">
                  <IconeBloqueio className="mt-px size-4 shrink-0" />
                  Telefone bloqueado no site{clienteConhecido.motivo_bloqueio ? ` (${clienteConhecido.motivo_bloqueio})` : ""}. Pelo
                  painel você ainda pode lançar.
                </p>
              )}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo
              rotulo="Nome"
              maxLength={60}
              value={cliente.nome}
              erro={erros.nome}
              onChange={(e) => {
                setCliente({ ...cliente, nome: e.target.value });
                limparErro("nome");
              }}
            />
            <Campo
              rotulo="Sobrenome"
              maxLength={80}
              value={cliente.sobrenome}
              erro={erros.sobrenome}
              onChange={(e) => {
                setCliente({ ...cliente, sobrenome: e.target.value });
                limparErro("sobrenome");
              }}
            />
          </div>
        </div>
      </Secao>

      <Secao numero={2} titulo="Itens">
        {erroCardapio ? (
          <AlertaErro>{erroCardapio}</AlertaErro>
        ) : !cardapio ? (
          <div className="h-40 animate-pulse rounded-2xl bg-borda-suave" aria-busy="true" aria-label="Carregando cardápio" />
        ) : (
          <div data-erro={erros.itens ? true : undefined}>
            <ItensNovoPedido
              cardapio={cardapio}
              itens={itens}
              setItens={(valor) => {
                setItens(valor);
                limparErro("itens");
              }}
              montando={montando}
              setMontando={setMontando}
              resumo={resumo}
              erro={erros.itens}
            />
          </div>
        )}
        {erroCalculo && (
          <div className="mt-2">
            <AlertaErro>{erroCalculo}</AlertaErro>
          </div>
        )}
        {resumo && !resumo.entrega_permitida && (
          <p className="mt-2 text-sm font-semibold text-aviso-texto">
            Mais de {resumo.limite_entrega} salgados: no site seria só retirada. Pelo painel a entrega é permitida.
          </p>
        )}
      </Secao>

      <Secao numero={3} titulo="Entrega ou retirada">
        <div className="space-y-3" data-erro={erros.recebimento ? true : undefined}>
          <div className="grid gap-2 sm:grid-cols-2">
            <OpcaoRadio
              nome="recebimento"
              valor="retirada"
              atual={recebimento}
              onChange={(v) => {
                setRecebimento(v);
                limparErro("recebimento");
              }}
              titulo="Retirada no local"
              texto="Sem frete"
            />
            <OpcaoRadio
              nome="recebimento"
              valor="entrega"
              atual={recebimento}
              onChange={(v) => {
                setRecebimento(v);
                limparErro("recebimento");
              }}
              titulo="Entrega"
              texto="Frete calculado pelo endereço"
            />
          </div>
          {erros.recebimento && <MensagemErro>{erros.recebimento}</MensagemErro>}
          {comEntrega && (
            <div className="space-y-3 rounded-2xl bg-superficie p-4 ring-1 ring-borda-suave">
              <FormEndereco valores={endereco} setValores={setEndereco} erros={erros} aoSairDoCampo={calcularFreteAgora} />
              <p className="text-[15px] font-semibold" aria-live="polite">
                Frete:{" "}
                {freteStatus === "ok" ? (
                  <span className="tabular-nums">{formatarPreco(freteValor)}</span>
                ) : freteStatus === "calculando" ? (
                  <span className="text-texto-suave">calculando…</span>
                ) : freteStatus === "aguardando_endereco" ? (
                  <span className="text-texto-suave">preencha rua, número e vila</span>
                ) : (
                  <span className="text-erro">não foi possível calcular para este endereço</span>
                )}
              </p>
            </div>
          )}
        </div>
      </Secao>

      <Secao numero={4} titulo="Quando">
        <div className="space-y-3" data-erro={erros.horario ? true : undefined}>
          <div className="grid gap-2 sm:grid-cols-2">
            <OpcaoRadio
              nome="quando"
              valor="agora"
              atual={quando.tipo}
              onChange={() => setQuando({ ...quando, tipo: "agora" })}
              titulo="O quanto antes"
              texto="Vale mesmo com a loja fechada ou pausada"
            />
            <OpcaoRadio
              nome="quando"
              valor="agendar"
              atual={quando.tipo}
              onChange={() => setQuando({ ...quando, tipo: "agendar", data: quando.data || dataEmBrasilia() })}
              titulo="Agendar"
              texto="Escolha um horário livre"
            />
          </div>
          {quando.tipo === "agendar" && (
            <div className="rounded-2xl bg-superficie p-4 ring-1 ring-borda-suave">
              <EscolherHorario
                data={quando.data}
                aoMudarData={(data) => setQuando((q) => ({ ...q, data }))}
                escolhido={quando.inicio}
                aoEscolher={(inicio) => {
                  setQuando((q) => ({ ...q, inicio }));
                  limparErro("horario");
                }}
                recarga={recargaHorarios}
              />
            </div>
          )}
          {erros.horario && <MensagemErro>{erros.horario}</MensagemErro>}
        </div>
      </Secao>

      <Secao numero={5} titulo="Pagamento e observação">
        <div className="space-y-4">
          <BlocoPagamento
            valores={pagamento}
            setValores={(v) => {
              setPagamento(v);
              limparErro("forma");
              limparErro("troco");
            }}
            erros={erros}
            momento={recebimento === "retirada" ? "na retirada" : "na entrega"}
          />
          <Campo
            rotulo="Observação"
            opcional
            textarea
            maxLength={500}
            placeholder="Ex.: tocar o interfone 2"
            value={observacao}
            erro={erros.observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />
        </div>
      </Secao>

      {/* Resumo e lançar */}
      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 space-y-2 rounded-2xl bg-superficie p-4 shadow-card ring-1 ring-borda-suave lg:bottom-4">
        <dl className="space-y-1 text-[15px]" aria-live="polite">
          <div className="flex justify-between">
            <dt className="text-texto-suave">Subtotal</dt>
            <dd className="tabular-nums">{calculando ? "…" : resumo ? formatarPreco(resumo.total_itens) : "—"}</dd>
          </div>
          {comEntrega && (
            <div className="flex justify-between">
              <dt className="text-texto-suave">Frete</dt>
              <dd className="tabular-nums">{freteOk ? formatarPreco(freteValor) : "—"}</dd>
            </div>
          )}
          <div className="flex items-baseline justify-between border-t border-borda-suave pt-1">
            <dt className="font-bold">Total</dt>
            <dd className="text-xl font-bold text-ferrugem tabular-nums">
              {calculandoFinal ? "…" : resumoFinal ? formatarPreco(resumoFinal.total) : "—"}
            </dd>
          </div>
          {pagamento.forma === "dinheiro" && lerValor(pagamento.troco) > 0 && resumoFinal && (
            <p className="text-sm text-texto-suave">
              Troco: R$ {formatarValor(lerValor(pagamento.troco) - resumoFinal.total)} (para R$ {formatarValor(lerValor(pagamento.troco))})
            </p>
          )}
        </dl>
        {comFrete.erro && <AlertaErro>{comFrete.erro}</AlertaErro>}
        <AlertaErro>{erroGeral}</AlertaErro>
        <button type="submit" disabled={enviando} className={`${CLASSE_BOTAO_PRINCIPAL} h-14 text-base`}>
          {enviando ? "Lançando…" : `Lançar pedido${cliente.nome ? ` de ${cliente.nome}` : ""}${digitos.length >= 10 ? ` · ${formatarTelefone(digitos)}` : ""}`}
        </button>
      </div>
    </form>
  );
}
