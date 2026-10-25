"use client";

import Link from "next/link";
import { useState } from "react";
import BlocoEntrega, { agendadoPara, hojeEmBrasilia, limitesData, validarAgendamento } from "@/components/checkout/BlocoEntrega";
import BlocoIdentificacao from "@/components/checkout/BlocoIdentificacao";
import BlocoPagamento, { lerValor, validarPagamento } from "@/components/checkout/BlocoPagamento";
import BlocoRecebimento from "@/components/checkout/BlocoRecebimento";
import { ENDERECO_VAZIO } from "@/components/checkout/FormEndereco";
import PedidoConfirmado from "@/components/checkout/PedidoConfirmado";
import { useFreteEntrega } from "@/components/checkout/ResumoFrete";
import Campo, { AlertaErro } from "@/components/cliente/Campo";
import { useCliente } from "@/components/cliente/ClienteProvider";
import { CLASSE_BOTAO_PRINCIPAL } from "@/components/cliente/estilos";
import { IconeCracha, IconeMotoboy, IconeRetirada } from "@/components/icones";
import { esvaziar, itensParaPedido, juntarObservacoes, LIMITE_OBSERVACAO, useSacola } from "@/components/sacola/sacola-store";
import { useCalcularPedido } from "@/components/sacola/useCalcularPedido";
import { lerUltimoEndereco, salvarUltimoEndereco } from "@/lib/armazenamento-local";
import { useEnderecoLoja } from "@/lib/configLoja";
import { TIPOS_RECEBIMENTO } from "@/lib/entrega";
import { calcularFrete } from "@/lib/frete";
import { formatarPreco, MODO_PACOTE } from "@/lib/formatar";
import { LOJA } from "@/lib/loja";
import { criarPedido, MSG_AGENDAR_SEM_CONTA } from "@/lib/pedidos";
import { mascararTelefone, soDigitos, temErros, validar } from "@/lib/validacao";

function Secao({ id, numero, titulo, children }) {
  return (
    <section id={id} className="scroll-mt-24 pt-6">
      <h2 className="mb-3 flex items-center gap-2 font-titulo text-xl text-ferrugem-hover">
        <span className="grid size-7 place-items-center rounded-full bg-vinho font-sans text-sm font-bold text-creme">
          {numero}
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

// Agendar exige conta (banco-de-dados.md, seção 1). Os botões abrem o login/cadastro na seção
// "Seus dados", sem sair da página: sacola e escolhas continuam como estão.
function AvisoContaParaAgendar({ erro, aoEscolher }) {
  return (
    <div
      role={erro ? "alert" : "status"}
      data-erro={erro ? true : undefined}
      className={`rounded-xl bg-info-fundo p-3 text-info ${erro ? "ring-2 ring-info" : ""}`}
    >
      <p className="flex items-start gap-2 text-sm font-semibold">
        <IconeCracha className="mt-px size-5 shrink-0" />
        <span>Para agendar, entre na sua conta ou crie uma. Seu pedido fica salvo no seu perfil.</span>
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 pl-7">
        <button
          type="button"
          onClick={() => aoEscolher("entrar")}
          className="h-11 rounded-xl bg-ferrugem px-3 text-sm font-bold text-white transition hover:bg-ferrugem-hover active:bg-ferrugem-ativo"
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => aoEscolher("cadastro")}
          className="h-11 rounded-xl bg-superficie px-3 text-sm font-bold text-link ring-2 ring-link transition hover:text-ferrugem-ativo hover:ring-ferrugem-ativo"
        >
          Criar conta
        </button>
      </div>
    </div>
  );
}

function focarPrimeiroErro() {
  requestAnimationFrame(() => {
    const alvo = document.querySelector('[aria-invalid="true"], [data-erro]');
    alvo?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (alvo?.matches("input, textarea")) alvo.focus({ preventScroll: true });
  });
}

function Valor({ valor, calculando, className = "" }) {
  if (calculando) return <span className={`text-texto-suave ${className}`}>…</span>;
  if (valor === undefined || valor === null) return <span className={`text-texto-suave ${className}`}>—</span>;
  return <span className={`tabular-nums ${className}`}>{formatarPreco(valor)}</span>;
}

// Itens do carrinho; o subtotal de cada linha vem do calcularPedido (mesma ordem dos itens).
function ResumoSacola({ itens, resumo, calculando }) {
  return (
    <ul className="divide-y divide-borda-suave rounded-2xl bg-superficie px-4 ring-1 ring-borda-suave">
      {itens.map((item, i) => (
        <li key={item.chave} className="flex justify-between gap-3 py-2.5 text-sm">
          <div className="min-w-0">
            <p>
              <span className="font-semibold tabular-nums">{item.quantidade}x</span> {item.nome}
            </p>
            {item.modo && (
              <p className="text-texto-suave">
                {MODO_PACOTE[item.modo]} · {item.quantidade > 1 ? "cada: " : ""}
                {item.sabores.map((s) => `${s.quantidade / item.quantidade} ${s.nome}`).join(", ")}
              </p>
            )}
          </div>
          <Valor valor={resumo?.itens[i]?.subtotal} calculando={calculando} className="shrink-0" />
        </li>
      ))}
    </ul>
  );
}

// Montado só no navegador, depois que o useCliente terminou de carregar:
// por isso os valores iniciais podem vir do localStorage sem quebrar a hidratação.
function FormularioCheckout({ itens, resumo, calculando, erroCalculo, aoConfirmar }) {
  const cliente = useCliente();
  const logado = cliente.estado === "logado";

  const [modo, setModo] = useState(cliente.convidado ? "convidado" : "escolha");
  const [abaConta, setAbaConta] = useState("entrar"); // aba do login/cadastro dentro do checkout
  const [convidado, setConvidado] = useState(() => ({
    nome: cliente.convidado?.nome ?? "",
    sobrenome: cliente.convidado?.sobrenome ?? "",
    telefone: mascararTelefone(cliente.convidado?.telefone ?? ""),
  }));
  const [endereco, setEndereco] = useState(() => {
    const salvo = lerUltimoEndereco() ?? {};
    return Object.fromEntries(Object.keys(ENDERECO_VAZIO).map((campo) => [campo, String(salvo[campo] ?? "")]));
  });
  // Entrega x retirada: escolha obrigatória, nada vem marcado.
  const [recebimento, setRecebimento] = useState(null);
  const [trocadoAuto, setTrocadoAuto] = useState(false);
  const [quando, setQuando] = useState({ tipo: "agora", data: "", hora: "" });
  const [hoje] = useState(hojeEmBrasilia);
  const [pagamento, setPagamento] = useState({ forma: "", troco: "" });
  const [observacao, setObservacao] = useState("");
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Regras que vêm do banco (calcular_pedido). Enquanto não há resumo, nada é bloqueado à toa.
  const entregaPermitida = resumo ? resumo.entrega_permitida : true;
  const exigeAgendamento = Boolean(resumo?.exige_agendamento);
  const limites = limitesData(resumo, hoje);

  // Fora do horário de atendimento (loja_aberta do banco): "O quanto antes" fica bloqueado e
  // "Agendar" é marcado sozinho.
  const lojaFechada = resumo?.loja_aberta === false;
  if (lojaFechada && quando.tipo === "agora") setQuando({ ...quando, tipo: "agendar" });

  // Entrega não permitida (mais de 100 salgados): marca retirada sozinho e avisa.
  if (resumo && !resumo.entrega_permitida && recebimento !== "retirada") {
    setRecebimento("retirada");
    setTrocadoAuto(true);
  }

  const comEntrega = recebimento === "entrega";
  const enderecoLoja = useEnderecoLoja();

  // Frete automático (/api/frete) e, com ele calculado, o resumo do banco COM frete.
  const frete = useFreteEntrega(comEntrega, endereco);
  const freteOk = comEntrega && frete?.status === "ok";
  // Só consulta quando há frete calculado (sem entrega, o resumo dos itens já basta).
  const comFrete = useCalcularPedido(
    freteOk ? itensParaPedido(itens) : null,
    300,
    freteOk ? { rua: endereco.rua, numero: endereco.numero, vila: endereco.vila, chave: frete.chave } : null,
  );
  // Resumo que vale para os valores: com frete na entrega calculada; só itens nos outros casos.
  const resumoFinal = freteOk ? comFrete.resumo : resumo;
  const calculandoFinal = freteOk ? comFrete.calculando : calculando;
  const freteDoBanco = freteOk ? comFrete.resumo?.frete : null; // { status: "ok", valor } quando pronto
  const freteConfirmado = freteDoBanco?.status === "ok";
  // Entrega sem frete válido (calculando, endereço incompleto, sem entrega para o endereço): bloqueia o envio.
  const entregaSemFrete = comEntrega && !freteConfirmado;

  // Agendamento (escolhido ou obrigatório) sem login de cliente: precisa entrar ou criar conta.
  const vaiAgendar = exigeAgendamento || quando.tipo === "agendar";
  const precisaConta = vaiAgendar && !logado;

  // Abre o login/cadastro na seção "Seus dados" (sem trocar de página).
  function abrirConta(aba) {
    setAbaConta(aba);
    setModo("conta");
    if (erros.modo) setErros(({ modo: _modo, ...resto }) => resto);
    requestAnimationFrame(() => document.getElementById("secao-dados")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  // Ao mudar um campo, some o erro só daquele campo (os outros continuam até serem corrigidos).
  function semErroAoMudar(atual, setValor) {
    return (novo) => {
      setValor(novo);
      const mudaram = Object.keys(novo).filter((campo) => novo[campo] !== atual[campo]);
      if (mudaram.some((campo) => erros[campo])) {
        setErros((e) => Object.fromEntries(Object.entries(e).filter(([campo]) => !mudaram.includes(campo))));
      }
    };
  }

  function escolherRecebimento(tipo) {
    setRecebimento(tipo);
    setTrocadoAuto(false);
    if (erros.recebimento) setErros(({ recebimento: _r, ...resto }) => resto);
  }

  // O banco tem uma observação por pedido: junta as dos pacotes (uma por linha) com a geral.
  const observacaoFinal = juntarObservacoes(itens, observacao);
  function validarObservacaoTotal() {
    if (observacaoFinal.length <= LIMITE_OBSERVACAO) return {};
    return {
      observacao: `As observações juntas (pacotes + esta) têm ${observacaoFinal.length} caracteres; o máximo é ${LIMITE_OBSERVACAO}. Encurte alguma delas.`,
    };
  }

  function validarTudo() {
    const novos = {
      ...(comEntrega ? validar(endereco, ["cep", "rua", "vila", "numero", "ponto_referencia"]) : {}),
      ...validarAgendamento(quando, exigeAgendamento, limites),
      // Troco comparado com o total COM frete (como o banco faz).
      ...validarPagamento(pagamento, resumoFinal?.total ?? resumo?.total ?? 0),
      ...validar({ observacao }, ["observacao"]),
      ...validarObservacaoTotal(),
    };
    if (!recebimento) novos.recebimento = "Escolha entrega ou retirada no local.";
    if (comEntrega && ["nao_encontrado", "fora_da_area", "nao_configurado", "erro_temporario"].includes(frete?.status)) {
      novos.rua = "Não conseguimos calcular a entrega para esse endereço. Combine pelo WhatsApp ou escolha retirada.";
    }
    if (precisaConta) novos.conta = MSG_AGENDAR_SEM_CONTA;
    else if (!logado) {
      if (modo === "convidado") Object.assign(novos, validar(convidado, ["nome", "sobrenome", "telefone"]));
      else if (modo === "conta") novos.modo = "Entre ou crie sua conta para continuar (ou siga como convidado).";
      else novos.modo = "Escolha como quer continuar.";
    }
    return novos;
  }

  async function finalizar(e) {
    e.preventDefault();
    if (enviando || !resumoFinal || calculandoFinal) return; // evita pedido duplicado ou sem valores do banco
    const novos = validarTudo();
    setErros(novos);
    setErroGeral(null);
    if (temErros(novos)) {
      focarPrimeiroErro();
      return;
    }

    setEnviando(true);
    const dataAgendada = agendadoPara(quando, exigeAgendamento);
    const dadosPedido = {
      cliente: logado ? cliente.dados : convidado,
      tipoEntrega: recebimento,
      endereco: comEntrega ? endereco : null,
      cep: comEntrega ? endereco.cep : null,
      itens: itensParaPedido(itens),
      agendadoPara: dataAgendada,
      formaPagamento: pagamento.forma,
      trocoPara: pagamento.forma === "dinheiro" ? lerValor(pagamento.troco) : null,
      observacao: observacaoFinal,
    };
    let pedido;
    try {
      try {
        pedido = await criarPedido(dadosPedido);
      } catch (erro) {
        // O banco ainda não tinha o frete desse endereço: calcula de novo e tenta UMA vez.
        if (!erro.precisaFrete || !comEntrega) throw erro;
        await calcularFrete(endereco);
        pedido = await criarPedido(dadosPedido);
      }
    } catch (erro) {
      setEnviando(false);
      if (erro.exigeConta) {
        // O banco recusou o agendamento sem conta: mesmo caminho do aviso (abre o login).
        setErros({ conta: MSG_AGENDAR_SEM_CONTA });
        abrirConta("entrar");
        return;
      }
      setErroGeral(erro.message); // P0001 já vem em português
      return;
    }

    if (comEntrega) salvarUltimoEndereco(endereco);
    if (!logado) {
      cliente.salvarConvidado({
        nome: convidado.nome.trim(),
        sobrenome: convidado.sobrenome.trim(),
        telefone: soDigitos(convidado.telefone),
      });
    }
    // Confirma antes de esvaziar: a tela de sucesso não pode cair no estado "sacola vazia".
    // Os dados extras (cliente, itens, observação) montam a mensagem do WhatsApp do agendamento.
    const quem = logado ? cliente.dados : { ...convidado, telefone: soDigitos(convidado.telefone) };
    aoConfirmar({
      ...pedido,
      tipoEntrega: recebimento,
      agendadoPara: dataAgendada,
      forma: pagamento.forma,
      endereco: comEntrega ? endereco : null,
      comoConvidado: !logado,
      nome: quem.nome.trim(),
      sobrenome: quem.sobrenome.trim(),
      telefone: quem.telefone,
      itens: itens.map(({ quantidade, nome, modo: modoItem, sabores }) => ({
        quantidade,
        nome,
        modo: modoItem,
        sabores: sabores?.map((s) => ({ nome: s.nome, quantidade: s.quantidade })),
      })),
      observacao: observacaoFinal,
    });
    esvaziar();
  }

  const podeEnviar = !enviando && !calculandoFinal && Boolean(resumoFinal) && !erroCalculo && !comFrete.erro && !entregaSemFrete;

  return (
    <form onSubmit={finalizar} noValidate>
      <Secao id="secao-dados" numero={1} titulo="Seus dados">
        <BlocoIdentificacao
          exigeConta={precisaConta}
          abaConta={abaConta}
          modo={modo}
          setModo={(novo) => {
            setModo(novo);
            if (erros.modo) setErros(({ modo: _modo, ...resto }) => resto);
          }}
          valores={convidado}
          setValores={semErroAoMudar(convidado, setConvidado)}
          erros={erros}
          erroModo={erros.modo}
        />
      </Secao>

      <Secao numero={2} titulo="Entrega ou retirada?">
        <BlocoRecebimento
          tipo={recebimento}
          setTipo={escolherRecebimento}
          endereco={endereco}
          setEndereco={semErroAoMudar(endereco, setEndereco)}
          erros={erros}
          frete={frete}
          entregaPermitida={entregaPermitida}
          totalSalgados={resumo?.total_salgados}
          limiteEntrega={resumo?.limite_entrega ?? LOJA.limiteEntrega}
          trocadoAutomaticamente={trocadoAuto}
          totalItens={resumo?.total_itens}
          total={freteConfirmado ? resumoFinal?.total : null}
          calculandoTotal={freteOk && (calculandoFinal || !freteConfirmado)}
          aoSairDoEndereco={frete?.calcularAgora}
        />
      </Secao>

      <Secao numero={3} titulo={comEntrega ? "Quando entregar" : recebimento === "retirada" ? "Quando retirar" : "Quando"}>
        <BlocoEntrega
          valores={quando}
          setValores={semErroAoMudar(quando, setQuando)}
          erros={erros}
          limites={limites}
          exige={exigeAgendamento}
          comEntrega={comEntrega}
          lojaFechada={lojaFechada}
        />
        {precisaConta && (
          <div className="mt-3">
            <AvisoContaParaAgendar erro={Boolean(erros.conta)} aoEscolher={abrirConta} />
          </div>
        )}
      </Secao>

      <Secao numero={4} titulo="Pagamento">
        <BlocoPagamento
          valores={pagamento}
          setValores={semErroAoMudar(pagamento, setPagamento)}
          erros={erros}
          momento={recebimento ? TIPOS_RECEBIMENTO[recebimento].momento : "na entrega ou retirada"}
        />
      </Secao>

      <Secao numero={5} titulo="Observação">
        <Campo
          rotulo="Algum recado para a cozinha?"
          opcional
          textarea
          maxLength={500}
          placeholder="Ex.: tocar o interfone 2"
          value={observacao}
          onChange={(e) => semErroAoMudar({ observacao }, ({ observacao: o }) => setObservacao(o))({ observacao: e.target.value })}
          erro={erros.observacao}
          dica={
            observacaoFinal.length > observacao.trim().length
              ? `${observacaoFinal.length}/${LIMITE_OBSERVACAO} (somando as observações dos pacotes)`
              : `${observacao.length}/${LIMITE_OBSERVACAO}`
          }
        />
      </Secao>

      <div className="mt-6 space-y-3 rounded-2xl bg-superficie p-4 ring-1 ring-borda-suave">
        {/* Repete a forma de recebimento logo acima do botão: última chance de perceber a escolha */}
        {recebimento && (
          <div className="flex items-center gap-3 rounded-xl bg-fundo p-2.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ferrugem text-white">
              {comEntrega ? <IconeMotoboy className="size-6" /> : <IconeRetirada className="size-6" />}
            </span>
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-bold">{TIPOS_RECEBIMENTO[recebimento].titulo}</p>
              <p className="truncate text-sm text-texto-suave">
                {comEntrega
                  ? endereco.rua
                    ? `${endereco.rua}, ${endereco.numero || "s/n"} - ${endereco.vila}`
                    : "Endereço ainda não preenchido"
                  : (enderecoLoja ?? "Endereço da loja")}
              </p>
            </div>
            {entregaPermitida && (
              <button
                type="button"
                onClick={() => escolherRecebimento(comEntrega ? "retirada" : "entrega")}
                className="shrink-0 text-sm font-bold text-link underline underline-offset-4 hover:text-ferrugem-ativo"
              >
                Trocar
              </button>
            )}
          </div>
        )}
        <div className="space-y-1 text-sm" aria-live="polite">
          <div className="flex justify-between">
            <span className="text-texto-suave">Subtotal (itens)</span>
            <Valor valor={resumo?.total_itens} calculando={calculando} />
          </div>
          {recebimento && (
            <div className="flex justify-between gap-3">
              <span className="text-texto-suave">{comEntrega ? "Entrega" : "Retirada"}</span>
              {!comEntrega ? (
                <span>Grátis</span>
              ) : freteConfirmado ? (
                <Valor valor={freteDoBanco.valor} calculando={false} />
              ) : frete?.status === "calculando" || (freteOk && calculandoFinal) ? (
                <span className="text-texto-suave">Calculando frete...</span>
              ) : frete?.status === "aguardando_endereco" ? (
                <span className="text-texto-suave">Preencha o endereço</span>
              ) : (
                <span className="text-aviso-texto">Indisponível</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-baseline justify-between border-t border-borda-suave pt-2">
          <span className="text-sm font-bold">Total</span>
          {entregaSemFrete ? (
            <span className="text-xl font-bold text-texto-suave">—</span>
          ) : (
            <Valor valor={resumoFinal?.total} calculando={calculandoFinal} className="text-xl font-bold text-ferrugem" />
          )}
        </div>
        {comEntrega && !freteConfirmado && frete?.status !== "aguardando_endereco" && (
          <p className="text-sm text-texto-suave">O pedido com entrega é liberado assim que o frete estiver calculado.</p>
        )}
        {erroCalculo && <AlertaErro>{erroCalculo}</AlertaErro>}
        {comFrete.erro && <AlertaErro>{comFrete.erro}</AlertaErro>}
        <AlertaErro>{erroGeral}</AlertaErro>
        <button type="submit" disabled={!podeEnviar} className={CLASSE_BOTAO_PRINCIPAL}>
          {enviando
            ? "Enviando pedido…"
            : comEntrega
              ? "Fazer pedido · entrega"
              : recebimento === "retirada"
                ? "Fazer pedido · retirar no local"
                : "Fazer pedido"}
        </button>
      </div>
    </form>
  );
}

export default function Checkout() {
  const { estado } = useCliente();
  const { itens } = useSacola();
  // Total, subtotais e regras (entrega permitida, agendamento) vêm só do banco.
  const { resumo, erro, calculando } = useCalcularPedido(itensParaPedido(itens));
  const [confirmado, setConfirmado] = useState(null);
  // Mostra o esqueleto só no primeiro carregamento; um login no meio do checkout não apaga o que foi digitado.
  const [pronto, setPronto] = useState(false);
  if (!pronto && estado !== "carregando") setPronto(true);

  if (confirmado) return <PedidoConfirmado pedido={confirmado} />;

  if (itens.length === 0) {
    return (
      <div className="pt-12 text-center">
        <h1 className="traco-vinho font-titulo text-[26px] text-ferrugem">Sua sacola está vazia</h1>
        <p className="mt-1 text-sm text-texto-suave">Monte um pacote no cardápio para fazer um pedido.</p>
        <Link href="/" className={`${CLASSE_BOTAO_PRINCIPAL} mx-auto mt-5 max-w-56`}>
          Ver o cardápio
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-5">
      <h1 className="traco-vinho font-titulo text-[28px] leading-tight text-ferrugem">Finalizar pedido</h1>
      <div className="mb-2 mt-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-texto-suave">Seu pedido</h2>
        <Link href="/" className="text-sm font-semibold text-link underline underline-offset-4 hover:text-ferrugem-ativo">
          Alterar itens
        </Link>
      </div>
      <ResumoSacola itens={itens} resumo={resumo} calculando={calculando} />

      {pronto ? (
        <FormularioCheckout itens={itens} resumo={resumo} calculando={calculando} erroCalculo={erro} aoConfirmar={setConfirmado} />
      ) : (
        <div className="mt-6 space-y-3" aria-busy="true">
          <div className="h-24 animate-pulse rounded-xl bg-borda-suave" />
          <div className="h-48 animate-pulse rounded-xl bg-borda-suave" />
        </div>
      )}
    </div>
  );
}
