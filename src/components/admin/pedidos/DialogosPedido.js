"use client";

import { useState } from "react";
import Campo, { AlertaErro } from "@/components/cliente/Campo";
import { IconeAlerta, IconeWhatsappOficial } from "@/components/icones";
import { dataEmBrasilia } from "@/lib/admin/datas";
import { linkWhatsappCliente, mensagemParaCliente, mensagensParaCliente } from "@/lib/admin/mensagens";
import {
  bloquearTelefone,
  cancelarPedido,
  confirmarPagamento,
  editarPedido,
  MSG_HORARIO_OCUPADO,
  reagendar,
  reativarPedido,
} from "@/lib/admin/pedidos";
import { formatarDiaComSemana, formatarHora, formatarPreco } from "@/lib/formatar";
import { mascararCep, mascararTelefone, soDigitos, temErros, validar } from "@/lib/validacao";
import { OpcaoRadio } from "@/components/checkout/BlocoEntrega";
import { Dialogo } from "../Dialogo";
import EscolherHorario from "../EscolherHorario";
import { CLASSE_BOTAO_PRINCIPAL, CLASSE_BOTAO_SECUNDARIO } from "../estilos";
import { linkDoPedido } from "./useAcoesStatus";

/** Botões "Voltar" + ação principal no rodapé das janelas. */
function Rodape({ aoFechar, enviando, rotulo, desabilitado = false }) {
  return (
    <div className="grid gap-2 pt-1 sm:grid-cols-2">
      <button type="button" onClick={aoFechar} className={CLASSE_BOTAO_SECUNDARIO}>
        Voltar
      </button>
      <button type="submit" disabled={enviando || desabilitado} className={CLASSE_BOTAO_PRINCIPAL}>
        {enviando ? "Salvando…" : rotulo}
      </button>
    </div>
  );
}

/** Estado padrão de envio de uma janela. */
function useEnvio(aoConcluir) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  async function enviar(acao) {
    if (enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      const resultado = await acao();
      setEnviando(false);
      aoConcluir?.(resultado);
      return true;
    } catch (falha) {
      setErro(falha.message);
      setEnviando(false);
      return falha;
    }
  }
  return { enviando, erro, setErro, enviar };
}

// ---------------------------------------------------------------------------
export function DialogoConfirmarPagamento({ pedido, aberto, aoFechar, aoConcluir }) {
  const [referencia, setReferencia] = useState("");
  const { enviando, erro, enviar } = useEnvio(() => {
    setReferencia("");
    aoConcluir("Pagamento confirmado. Agendamento garantido.");
  });

  return (
    <Dialogo aberto={aberto} aoFechar={aoFechar} titulo={`Confirmar pagamento · nº ${pedido.id}`}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          enviar(() => confirmarPagamento(pedido.id, referencia));
        }}
      >
        <p className="text-[15px]">
          Valor: <strong className="tabular-nums">{formatarPreco(Number(pedido.total))}</strong>. Confirme só depois de ver o
          pagamento na conta.
        </p>
        <Campo
          rotulo="Referência"
          opcional
          maxLength={200}
          placeholder={`Ex.: Pix ${dataEmBrasilia().slice(8, 10)}/${dataEmBrasilia().slice(5, 7)}`}
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
          dica="Uma anotação para achar o pagamento depois (forma, data, comprovante)."
        />
        <AlertaErro>{erro}</AlertaErro>
        <Rodape aoFechar={aoFechar} enviando={enviando} rotulo="Confirmar pagamento" />
      </form>
    </Dialogo>
  );
}

// ---------------------------------------------------------------------------
export function DialogoCancelar({ pedido, aberto, aoFechar, aoConcluir }) {
  const [motivo, setMotivo] = useState("");
  const [cancelado, setCancelado] = useState(false);
  const { enviando, erro, setErro, enviar } = useEnvio(() => setCancelado(true));

  function fechar() {
    if (cancelado) aoConcluir("Pedido cancelado.");
    setMotivo("");
    setCancelado(false);
    setErro(null);
    aoFechar();
  }

  return (
    <Dialogo aberto={aberto} aoFechar={fechar} titulo={`Cancelar pedido nº ${pedido.id}`}>
      {cancelado ? (
        <div className="space-y-4">
          <p className="text-[15px] font-semibold">Pedido cancelado. O motivo ficou nas anotações internas.</p>
          <a
            href={linkWhatsappCliente(pedido.telefone, mensagemParaCliente("cancelado", pedido, { motivo }))}
            target="_blank"
            rel="noopener noreferrer"
            className={CLASSE_BOTAO_PRINCIPAL}
          >
            <IconeWhatsappOficial className="size-5" />
            Avisar cliente no WhatsApp
          </a>
          <button type="button" onClick={fechar} className={CLASSE_BOTAO_SECUNDARIO}>
            Fechar
          </button>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!motivo.trim()) return setErro("Escreva o motivo do cancelamento.");
            enviar(() => cancelarPedido(pedido.id, motivo));
          }}
        >
          <p className="text-[15px]">O horário (se agendado) fica livre de novo. O cliente não é avisado automaticamente.</p>
          <Campo
            rotulo="Motivo"
            textarea
            maxLength={900}
            placeholder="Ex.: cliente desistiu por telefone"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
          <AlertaErro>{erro}</AlertaErro>
          <Rodape aoFechar={fechar} enviando={enviando} rotulo="Cancelar pedido" />
        </form>
      )}
    </Dialogo>
  );
}

// ---------------------------------------------------------------------------
/** Escolhe data + horário livre (horarios_disponiveis) e grava agendado_para. */
export function DialogoReagendar({ pedido, aberto, aoFechar, aoConcluir }) {
  const [data, setData] = useState(() => (pedido.agendado_para ? dataEmBrasilia(pedido.agendado_para) : dataEmBrasilia()));
  const [escolhido, setEscolhido] = useState("");
  const [recarga, setRecarga] = useState(0);
  const { enviando, erro, setErro, enviar } = useEnvio(() => aoConcluir("Pedido reagendado."));

  return (
    <Dialogo aberto={aberto} aoFechar={aoFechar} titulo={`Reagendar pedido nº ${pedido.id}`}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!escolhido) return setErro("Escolha um horário.");
          const r = await enviar(() => reagendar(pedido.id, escolhido));
          if (r?.horarioOcupado) {
            setErro(`${MSG_HORARIO_OCUPADO} Escolha outro.`);
            setEscolhido("");
            setRecarga((v) => v + 1);
          }
        }}
      >
        {pedido.agendado_para && (
          <p className="text-[15px]">
            Hoje está para <strong>{formatarDiaComSemana(pedido.agendado_para)} às {formatarHora(pedido.agendado_para)}</strong>.
          </p>
        )}
        <EscolherHorario data={data} aoMudarData={setData} escolhido={escolhido} aoEscolher={setEscolhido} recarga={recarga} />
        <AlertaErro>{erro}</AlertaErro>
        <Rodape aoFechar={aoFechar} enviando={enviando} rotulo="Salvar novo horário" desabilitado={!escolhido} />
      </form>
    </Dialogo>
  );
}

// ---------------------------------------------------------------------------
/** Reativar cancelado/expirado: a dona escolhe se já está pago ou se paga na entrega/retirada. */
export function DialogoReativar({ pedido, aberto, aoFechar, aoConcluir, aoReagendar }) {
  const jaPago = Boolean(pedido.pago_em) || (pedido.cobrancas ?? []).some((c) => c.status === "paga" || c.status === "paga_fora_do_prazo");
  const [escolha, setEscolha] = useState(jaPago ? "pago" : "entrega");
  const [referencia, setReferencia] = useState(pedido.pagamento_referencia ?? "");
  const [ocupado, setOcupado] = useState(false);
  const { enviando, erro, setErro, enviar } = useEnvio(() => aoConcluir("Pedido reativado."));
  const momento = pedido.tipo_entrega === "retirada" ? "na retirada" : "na entrega";

  return (
    <Dialogo aberto={aberto} aoFechar={aoFechar} titulo={`Reativar pedido nº ${pedido.id}`}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setOcupado(false);
          const r = await enviar(() =>
            reativarPedido(pedido.id, { pago: escolha === "pago", referencia, pagoEm: pedido.pago_em }),
          );
          if (r?.horarioOcupado) {
            setErro(null);
            setOcupado(true);
          }
        }}
      >
        <p className="text-[15px]">O pedido volta como &quot;Novo&quot;. Como fica o pagamento?</p>
        <div className="space-y-2">
          <OpcaoRadio
            nome="reativar-pagamento"
            valor="pago"
            atual={escolha}
            onChange={setEscolha}
            titulo="Já está pago"
            texto={jaPago ? "Há registro de pagamento deste pedido." : "Marca como pago agora."}
          />
          <OpcaoRadio
            nome="reativar-pagamento"
            valor="entrega"
            atual={escolha}
            onChange={setEscolha}
            titulo={`Pagamento combinado ${momento}`}
            texto="O cliente paga ao receber."
          />
        </div>
        {escolha === "pago" && (
          <Campo
            rotulo="Referência do pagamento"
            opcional
            maxLength={200}
            placeholder="Ex.: Pix 23/10"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
          />
        )}
        {ocupado && (
          <div role="alert" className="space-y-3 rounded-xl bg-erro-fundo p-3 text-erro">
            <p className="flex items-start gap-2 text-sm font-semibold">
              <IconeAlerta className="mt-px size-5 shrink-0" />
              <span>{MSG_HORARIO_OCUPADO} Reagende antes de reativar.</span>
            </p>
            <button type="button" onClick={aoReagendar} className={CLASSE_BOTAO_PRINCIPAL}>
              Reagendar
            </button>
          </div>
        )}
        <AlertaErro>{erro}</AlertaErro>
        <Rodape aoFechar={aoFechar} enviando={enviando} rotulo="Reativar pedido" />
      </form>
    </Dialogo>
  );
}

// ---------------------------------------------------------------------------
/** Contato, observação e (com aviso) endereço. O frete NÃO é recalculado. */
export function DialogoEditar({ pedido, aberto, aoFechar, aoConcluir }) {
  const entrega = pedido.tipo_entrega === "entrega";
  const [valores, setValores] = useState(() => ({
    nome: pedido.nome ?? "",
    sobrenome: pedido.sobrenome ?? "",
    telefone: mascararTelefone(pedido.telefone ?? ""),
    observacao: pedido.observacao ?? "",
    rua: pedido.rua ?? "",
    numero: pedido.numero ?? "",
    vila: pedido.vila ?? "",
    ponto_referencia: pedido.ponto_referencia ?? "",
    cep: mascararCep(pedido.cep ?? ""),
  }));
  const [erros, setErros] = useState({});
  const { enviando, erro, enviar } = useEnvio(() => aoConcluir("Dados do pedido atualizados."));
  const campo = (nome) => ({
    value: valores[nome],
    erro: erros[nome],
    onChange: (e) => setValores((v) => ({ ...v, [nome]: e.target.value })),
  });

  return (
    <Dialogo aberto={aberto} aoFechar={aoFechar} titulo={`Editar pedido nº ${pedido.id}`} largura="34rem">
      <form
        noValidate
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const lista = ["nome", "sobrenome", "telefone", "observacao", ...(entrega ? ["rua", "numero", "vila", "ponto_referencia", "cep"] : [])];
          const novos = validar(valores, lista);
          setErros(novos);
          if (temErros(novos)) return;
          const campos = {
            nome: valores.nome.trim(),
            sobrenome: valores.sobrenome.trim(),
            telefone: soDigitos(valores.telefone),
            observacao: valores.observacao.trim() || null,
          };
          if (entrega) {
            Object.assign(campos, {
              rua: valores.rua.trim(),
              numero: valores.numero.trim(),
              vila: valores.vila.trim(),
              ponto_referencia: valores.ponto_referencia.trim() || null,
              cep: soDigitos(valores.cep) || null,
            });
          }
          enviar(() => editarPedido(pedido.id, campos));
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Nome" maxLength={60} {...campo("nome")} />
          <Campo rotulo="Sobrenome" maxLength={80} {...campo("sobrenome")} />
        </div>
        <Campo
          rotulo="Telefone"
          inputMode="tel"
          {...campo("telefone")}
          onChange={(e) => setValores((v) => ({ ...v, telefone: mascararTelefone(e.target.value) }))}
        />
        <Campo rotulo="Observação" opcional textarea maxLength={500} {...campo("observacao")} />
        {entrega && (
          <fieldset className="space-y-3 rounded-2xl bg-superficie p-3 ring-1 ring-borda-suave">
            <legend className="px-1 text-sm font-bold">Endereço</legend>
            <p className="flex items-start gap-2 rounded-xl bg-aviso-fundo px-3 py-2 text-sm font-semibold text-aviso-texto">
              <IconeAlerta className="mt-px size-5 shrink-0" />
              <span>O frete NÃO é recalculado. Se o endereço mudou muito, cancele e lance o pedido de novo.</span>
            </p>
            <Campo rotulo="Rua" maxLength={120} {...campo("rua")} />
            <div className="grid grid-cols-[7rem_1fr] gap-3">
              <Campo rotulo="Número" maxLength={10} {...campo("numero")} />
              <Campo rotulo="Vila/bairro" maxLength={80} {...campo("vila")} />
            </div>
            <Campo rotulo="Ponto de referência" opcional maxLength={200} {...campo("ponto_referencia")} />
            <Campo
              rotulo="CEP"
              opcional
              inputMode="numeric"
              {...campo("cep")}
              onChange={(e) => setValores((v) => ({ ...v, cep: mascararCep(e.target.value) }))}
            />
          </fieldset>
        )}
        <AlertaErro>{erro}</AlertaErro>
        <Rodape aoFechar={aoFechar} enviando={enviando} rotulo="Salvar alterações" />
      </form>
    </Dialogo>
  );
}

// ---------------------------------------------------------------------------
export function DialogoBloquear({ pedido, aberto, aoFechar, aoConcluir }) {
  const [motivo, setMotivo] = useState("");
  const { enviando, erro, enviar } = useEnvio(() => aoConcluir("Telefone bloqueado no site."));
  return (
    <Dialogo aberto={aberto} aoFechar={aoFechar} titulo="Bloquear telefone">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          enviar(() => bloquearTelefone(pedido.telefone, motivo));
        }}
      >
        <p className="text-[15px]">
          O site vai recusar pedidos de <strong>{mascararTelefone(pedido.telefone)}</strong>. Pelo painel você ainda consegue
          lançar.
        </p>
        <Campo rotulo="Motivo" opcional maxLength={200} placeholder="Ex.: trote, não pagou" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        <AlertaErro>{erro}</AlertaErro>
        <Rodape aoFechar={aoFechar} enviando={enviando} rotulo="Bloquear telefone" />
      </form>
    </Dialogo>
  );
}

// ---------------------------------------------------------------------------
/** Mensagens prontas para o cliente (abre o WhatsApp com o texto). */
export function DialogoWhatsapp({ pedido, aberto, aoFechar, enderecoLoja }) {
  const motivo = (pedido.anotacoes_pedido ?? []).find((a) => a.texto.startsWith("Cancelado: "))?.texto.slice(11) ?? "";
  const mensagens = mensagensParaCliente(pedido, { link: linkDoPedido(pedido), enderecoLoja, motivo });
  return (
    <Dialogo aberto={aberto} aoFechar={aoFechar} titulo={`WhatsApp · ${pedido.nome}`} largura="34rem">
      <ul className="space-y-2">
        {mensagens.map((m) => (
          <li key={m.id}>
            <a
              href={linkWhatsappCliente(pedido.telefone, m.texto)}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl bg-superficie p-3 ring-1 ring-borda-input hover:ring-ferrugem"
            >
              <span className="flex items-center gap-2 font-bold text-texto">
                <IconeWhatsappOficial className="size-5 text-sucesso" />
                {m.rotulo}
              </span>
              <span className="mt-1 block whitespace-pre-line text-sm text-texto-suave">{m.texto}</span>
            </a>
          </li>
        ))}
        <li>
          <a
            href={linkWhatsappCliente(pedido.telefone)}
            target="_blank"
            rel="noopener noreferrer"
            className="block py-2 text-center text-sm font-semibold text-link underline underline-offset-4"
          >
            Abrir conversa sem mensagem
          </a>
        </li>
      </ul>
    </Dialogo>
  );
}
