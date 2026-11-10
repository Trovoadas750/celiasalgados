"use client";

import { useEffect, useState } from "react";
import Campo, { AlertaErro } from "@/components/cliente/Campo";
import { IconeWhatsappOficial } from "@/components/icones";
import { buscarConta, editarNomeConta, gerarSenha, redefinirSenhaCliente } from "@/lib/admin/clientes";
import { linkWhatsappCliente, mensagemNovaSenha } from "@/lib/admin/mensagens";
import { temErros, validar } from "@/lib/validacao";
import { Dialogo } from "../Dialogo";
import { CLASSE_BOTAO_CONTORNO, CLASSE_BOTAO_PRINCIPAL, CLASSE_BOTAO_SECUNDARIO, CLASSE_CAMPO } from "../estilos";
import { IconeAtualizar, IconeCopiar } from "../icones";

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

/** Nome e sobrenome da conta (o telefone é o login e não muda). */
export function DialogoEditarConta({ clienteId, aoFechar, aoConcluir }) {
  const [valores, setValores] = useState(null);
  const [erros, setErros] = useState({});
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let ativo = true;
    buscarConta(clienteId)
      .then((c) => ativo && setValores({ nome: c?.nome ?? "", sobrenome: c?.sobrenome ?? "" }))
      .catch((e) => ativo && setErro(e.message));
    return () => {
      ativo = false;
    };
  }, [clienteId]);

  async function salvar(e) {
    e.preventDefault();
    const novos = validar(valores, ["nome", "sobrenome"]);
    setErros(novos);
    if (temErros(novos)) return;
    setEnviando(true);
    try {
      await editarNomeConta(clienteId, valores);
      aoConcluir("Nome da conta atualizado.");
    } catch (falha) {
      setErro(falha.message);
      setEnviando(false);
    }
  }

  return (
    <Dialogo aberto aoFechar={aoFechar} titulo="Editar nome da conta">
      {!valores ? (
        erro ? <AlertaErro>{erro}</AlertaErro> : <div className="h-32 animate-pulse rounded-xl bg-borda-suave" aria-busy="true" />
      ) : (
        <form noValidate onSubmit={salvar} className="space-y-4">
          <p className="text-sm text-texto-suave">Muda só o cadastro da conta. Os pedidos antigos continuam com o nome que tinham.</p>
          <Campo rotulo="Nome" maxLength={60} value={valores.nome} erro={erros.nome} onChange={(e) => setValores({ ...valores, nome: e.target.value })} />
          <Campo
            rotulo="Sobrenome"
            maxLength={80}
            value={valores.sobrenome}
            erro={erros.sobrenome}
            onChange={(e) => setValores({ ...valores, sobrenome: e.target.value })}
          />
          <AlertaErro>{erro}</AlertaErro>
          <Rodape aoFechar={aoFechar} enviando={enviando} rotulo="Salvar" />
        </form>
      )}
    </Dialogo>
  );
}

/** Senha nova para o cliente (sugestão forte gerada aqui; a troca é feita no servidor). */
export function DialogoSenha({ cliente, aoFechar, aoConcluir }) {
  const [senha, setSenha] = useState(() => gerarSenha());
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [definida, setDefinida] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const primeiroNome = String(cliente.nome ?? "").split(" ")[0];

  async function salvar(e) {
    e.preventDefault();
    if (senha.trim().length < 8) return setErro("A senha precisa ter pelo menos 8 caracteres.");
    setEnviando(true);
    setErro(null);
    try {
      await redefinirSenhaCliente(cliente.cliente_id, senha.trim());
      setDefinida(senha.trim());
    } catch (falha) {
      setErro(falha.message);
    }
    setEnviando(false);
  }

  function fechar() {
    if (definida) aoConcluir("Senha do cliente redefinida.");
    else aoFechar();
  }

  return (
    <Dialogo aberto aoFechar={fechar} titulo="Redefinir senha do cliente">
      {definida ? (
        <div className="space-y-4">
          <p className="text-[15px]">Senha trocada. Passe para o cliente (ele entra com o telefone e esta senha):</p>
          <p className="rounded-xl bg-superficie px-3 py-3 text-center font-mono text-2xl font-bold tracking-wider ring-1 ring-borda-input">{definida}</p>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(definida);
                setCopiado(true);
              } catch {
                setCopiado(false);
              }
            }}
            className={`${CLASSE_BOTAO_CONTORNO} w-full`}
          >
            <IconeCopiar className="size-5" /> {copiado ? "Copiada!" : "Copiar senha"}
          </button>
          <a
            href={linkWhatsappCliente(cliente.telefone, mensagemNovaSenha({ nome: primeiroNome, senha: definida }))}
            target="_blank"
            rel="noopener noreferrer"
            className={CLASSE_BOTAO_PRINCIPAL}
          >
            <IconeWhatsappOficial className="size-5" /> Enviar ao cliente no WhatsApp
          </a>
          <button type="button" onClick={fechar} className={CLASSE_BOTAO_SECUNDARIO}>
            Fechar
          </button>
        </div>
      ) : (
        <form onSubmit={salvar} className="space-y-4">
          <p className="text-[15px]">
            A senha atual de <strong>{cliente.nome}</strong> deixa de funcionar. Use a sugestão abaixo ou digite outra (mínimo 8 caracteres).
          </p>
          <div className="flex gap-2">
            <label className="block flex-1">
              <span className="mb-1 block text-sm font-semibold">Nova senha</span>
              <input
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className={`${CLASSE_CAMPO} font-mono text-lg`}
              />
            </label>
            <button type="button" onClick={() => setSenha(gerarSenha())} className={`${CLASSE_BOTAO_CONTORNO} self-end`} aria-label="Gerar outra sugestão">
              <IconeAtualizar className="size-5" />
            </button>
          </div>
          <AlertaErro>{erro}</AlertaErro>
          <Rodape aoFechar={aoFechar} enviando={enviando} rotulo="Trocar senha" />
        </form>
      )}
    </Dialogo>
  );
}
