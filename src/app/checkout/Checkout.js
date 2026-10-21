"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertaErro } from "@/components/cliente/Campo";
import { useCliente } from "@/components/cliente/ClienteProvider";
import { CLASSE_BOTAO_PRINCIPAL } from "@/components/cliente/estilos";
import BlocoEntrega, { agendadoPara, limitesAgendamento, validarEntrega } from "@/components/checkout/BlocoEntrega";
import BlocoIdentificacao from "@/components/checkout/BlocoIdentificacao";
import BlocoPagamento, { lerValor, validarPagamento } from "@/components/checkout/BlocoPagamento";
import FormEndereco, { ENDERECO_VAZIO } from "@/components/checkout/FormEndereco";
import PedidoConfirmado from "@/components/checkout/PedidoConfirmado";
import Campo from "@/components/cliente/Campo";
import { esvaziar, useSacola } from "@/components/sacola/sacola-store";
import { lerUltimoEndereco, salvarUltimoEndereco } from "@/lib/armazenamento-local";
import { formatarPreco } from "@/lib/formatar";
import { iniciarPagamento } from "@/lib/pagamento";
import { enviarPedido, montarItens } from "@/lib/pedidos";
import { mascararTelefone, soDigitos, temErros, validar } from "@/lib/validacao";

function Secao({ numero, titulo, children }) {
  return (
    <section className="pt-6">
      <h2 className="mb-3 flex items-center gap-2 font-titulo text-xl text-vermelho">
        <span className="grid size-7 place-items-center rounded-full bg-vermelho font-sans text-sm font-bold text-white">
          {numero}
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function focarPrimeiroErro() {
  requestAnimationFrame(() => {
    const alvo = document.querySelector('[aria-invalid="true"], [data-erro]');
    alvo?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (alvo?.matches("input, textarea")) alvo.focus({ preventScroll: true });
  });
}

// Montado só no navegador, depois que o useCliente terminou de carregar:
// por isso os valores iniciais podem vir do localStorage sem quebrar a hidratação.
function FormularioCheckout({ itens, total, aoConfirmar }) {
  const cliente = useCliente();
  const logado = cliente.estado === "logado";

  const [modo, setModo] = useState(cliente.convidado ? "convidado" : "escolha");
  const [convidado, setConvidado] = useState(() => ({
    nome: cliente.convidado?.nome ?? "",
    sobrenome: cliente.convidado?.sobrenome ?? "",
    telefone: mascararTelefone(cliente.convidado?.telefone ?? ""),
  }));
  const [endereco, setEndereco] = useState(() => {
    const salvo = lerUltimoEndereco() ?? {};
    return Object.fromEntries(Object.keys(ENDERECO_VAZIO).map((campo) => [campo, String(salvo[campo] ?? "")]));
  });
  const [entrega, setEntrega] = useState({ tipo: "agora", quando: "" });
  const [limites] = useState(() => limitesAgendamento());
  const [pagamento, setPagamento] = useState({ forma: "", troco: "" });
  const [observacao, setObservacao] = useState("");
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  function validarTudo() {
    const novos = {
      ...validar(endereco, ["rua", "vila", "numero", "ponto_referencia"]),
      ...validarEntrega(entrega),
      ...validarPagamento(pagamento, total),
      ...validar({ observacao }, ["observacao"]),
    };
    if (!logado) {
      if (modo === "convidado") Object.assign(novos, validar(convidado, ["nome", "sobrenome", "telefone"]));
      else if (modo === "conta") novos.modo = "Entre ou crie sua conta para continuar (ou siga como convidado).";
      else novos.modo = "Escolha como quer continuar.";
    }
    return novos;
  }

  async function finalizar(e) {
    e.preventDefault();
    if (enviando) return; // evita pedido duplicado
    const novos = validarTudo();
    setErros(novos);
    setErroGeral(null);
    if (temErros(novos)) {
      focarPrimeiroErro();
      return;
    }

    setEnviando(true);
    const dadosCliente = logado ? cliente.dados : convidado;
    const { pedido, erro } = await enviarPedido({
      cliente: dadosCliente,
      endereco,
      entrega: { agendado_para: agendadoPara(entrega) },
      pagamento: { forma: pagamento.forma, troco_para: lerValor(pagamento.troco) },
      observacao,
      itens: montarItens(itens),
    });

    if (erro) {
      setEnviando(false);
      setErroGeral(erro);
      return;
    }

    salvarUltimoEndereco(endereco);
    if (!logado) {
      cliente.salvarConvidado({
        nome: convidado.nome.trim(),
        sobrenome: convidado.sobrenome.trim(),
        telefone: soDigitos(convidado.telefone),
      });
    }
    const pagamentoIniciado = await iniciarPagamento({ ...pedido, forma: pagamento.forma });
    // Confirma antes de esvaziar: a tela de sucesso não pode cair no estado "sacola vazia".
    aoConfirmar({
      ...pedido,
      forma: pagamento.forma,
      agendado_para: agendadoPara(entrega),
      comoConvidado: !logado,
      pagamento: pagamentoIniciado,
    });
    esvaziar();
  }

  return (
    <form onSubmit={finalizar} noValidate>
      <Secao numero={1} titulo="Seus dados">
        <BlocoIdentificacao
          modo={modo}
          setModo={setModo}
          valores={convidado}
          setValores={setConvidado}
          erros={erros}
          erroModo={erros.modo}
        />
      </Secao>

      <Secao numero={2} titulo="Endereço de entrega">
        <FormEndereco valores={endereco} setValores={setEndereco} erros={erros} />
      </Secao>

      <Secao numero={3} titulo="Quando entregar">
        <BlocoEntrega valores={entrega} setValores={setEntrega} erros={erros} limites={limites} />
      </Secao>

      <Secao numero={4} titulo="Pagamento">
        <BlocoPagamento valores={pagamento} setValores={setPagamento} erros={erros} />
      </Secao>

      <Secao numero={5} titulo="Observação">
        <Campo
          rotulo="Algum recado para a cozinha?"
          opcional
          textarea
          maxLength={500}
          placeholder="Ex.: sem cebola no kibe, tocar o interfone 2"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          erro={erros.observacao}
          dica={`${observacao.length}/500`}
        />
      </Secao>

      <div className="mt-6 space-y-3 rounded-2xl bg-cartao p-4 ring-1 ring-borda">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-tinta/70">Total dos itens</span>
          <span className="text-xl font-bold text-vermelho tabular-nums">{formatarPreco(total)}</span>
        </div>
        <p className="text-[13px] text-tinta/70">O valor final é confirmado pela salgadaria ao receber o pedido.</p>
        <AlertaErro>{erroGeral}</AlertaErro>
        <button type="submit" disabled={enviando} className={CLASSE_BOTAO_PRINCIPAL}>
          {enviando ? "Enviando pedido…" : "Fazer pedido"}
        </button>
      </div>
    </form>
  );
}

function ResumoSacola({ itens }) {
  return (
    <ul className="divide-y divide-borda rounded-2xl bg-cartao px-4 ring-1 ring-borda">
      {itens.map(({ produto, quantidade }) => (
        <li key={produto.id} className="flex justify-between gap-3 py-2.5 text-sm">
          <span>
            <span className="font-semibold tabular-nums">{quantidade}x</span> {produto.nome}
          </span>
          <span className="tabular-nums text-tinta/70">{formatarPreco(produto.preco * quantidade)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Checkout() {
  const { estado } = useCliente();
  const { itens, total } = useSacola();
  const [confirmado, setConfirmado] = useState(null);
  // Mostra o esqueleto só no primeiro carregamento; um login no meio do checkout não apaga o que foi digitado.
  const [pronto, setPronto] = useState(false);
  if (!pronto && estado !== "carregando") setPronto(true);

  if (confirmado) return <PedidoConfirmado pedido={confirmado} />;

  if (itens.length === 0) {
    return (
      <div className="pt-12 text-center">
        <h1 className="font-titulo text-[26px] text-vermelho">Sua sacola está vazia</h1>
        <p className="mt-1 text-sm text-tinta/70">Escolha seus salgados no menu para fazer um pedido.</p>
        <Link href="/" className={`${CLASSE_BOTAO_PRINCIPAL} mx-auto mt-5 max-w-56`}>
          Ver o menu
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-5">
      <h1 className="font-titulo text-[28px] leading-tight text-vermelho">Finalizar pedido</h1>
      <div className="mb-2 mt-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-tinta/70">Seu pedido</h2>
        <Link href="/" className="text-sm font-semibold text-vermelho">
          Adicionar itens
        </Link>
      </div>
      <ResumoSacola itens={itens} />

      {pronto ? (
        <FormularioCheckout itens={itens} total={total} aoConfirmar={setConfirmado} />
      ) : (
        <div className="mt-6 space-y-3" aria-busy="true">
          <div className="h-24 animate-pulse rounded-xl bg-sepia/60" />
          <div className="h-48 animate-pulse rounded-xl bg-sepia/60" />
        </div>
      )}
    </div>
  );
}
