"use client";

import AcessoConta from "@/components/cliente/AcessoConta";
import Campo, { MensagemErro } from "@/components/cliente/Campo";
import { useCliente } from "@/components/cliente/ClienteProvider";
import { IconeCracha } from "@/components/icones";
import { formatarTelefone } from "@/lib/formatar";
import { mascararTelefone } from "@/lib/validacao";

function Opcao({ titulo, texto, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl bg-superficie p-3 text-left ring-1 ring-borda-suave transition hover:ring-borda-input"
    >
      <span className="flex-1">
        <span className="block font-bold">{titulo}</span>
        <span className="block text-sm text-texto-suave">{texto}</span>
      </span>
      <span aria-hidden="true" className="text-xl font-bold text-ferrugem">›</span>
    </button>
  );
}

/**
 * Quem está pedindo. Três situações:
 *  - logado: mostra os dados da conta (vêm da tabela `clientes`)
 *  - modo "escolha": convidado ou conta
 *  - modo "convidado": nome, sobrenome e telefone (lembrados só neste navegador)
 *  - modo "conta": entrar / criar conta sem sair do checkout
 */
export default function BlocoIdentificacao({ modo, setModo, valores, setValores, erros, erroModo }) {
  const { estado, dados, convidado, limparConvidado, sair } = useCliente();

  if (estado === "carregando") {
    return <div className="h-24 animate-pulse rounded-xl bg-borda-suave" aria-busy="true" />;
  }

  if (estado === "logado") {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-superficie p-3 ring-1 ring-borda-suave">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-fundo text-cobre">
          <IconeCracha className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">
            {dados.nome} {dados.sobrenome}
          </p>
          <p className="text-sm tabular-nums text-texto-suave">{formatarTelefone(dados.telefone)}</p>
        </div>
        <button type="button" onClick={sair} className="shrink-0 text-sm text-link underline underline-offset-4 hover:text-ferrugem-ativo">
          Não é você?
        </button>
      </div>
    );
  }

  if (modo === "conta") {
    return (
      <div className="rounded-xl bg-superficie p-4 ring-1 ring-borda-suave">
        <AcessoConta />
        <button
          type="button"
          onClick={() => setModo("convidado")}
          className="mt-4 w-full text-center text-sm text-link underline underline-offset-4 hover:text-ferrugem-ativo"
        >
          Prefiro continuar como convidado
        </button>
      </div>
    );
  }

  if (modo === "convidado") {
    function mudar(campo, valor) {
      setValores({ ...valores, [campo]: valor });
    }
    return (
      <div className="space-y-3 rounded-xl bg-superficie p-4 ring-1 ring-borda-suave">
        <div className="grid gap-3 min-[420px]:grid-cols-2">
          <Campo
            rotulo="Nome"
            autoComplete="given-name"
            maxLength={60}
            value={valores.nome}
            onChange={(e) => mudar("nome", e.target.value)}
            erro={erros.nome}
          />
          <Campo
            rotulo="Sobrenome"
            autoComplete="family-name"
            maxLength={80}
            value={valores.sobrenome}
            onChange={(e) => mudar("sobrenome", e.target.value)}
            erro={erros.sobrenome}
          />
        </div>
        <Campo
          rotulo="Celular"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="(14) 99999-9999"
          value={valores.telefone}
          onChange={(e) => mudar("telefone", mascararTelefone(e.target.value))}
          erro={erros.telefone}
          dica="Usado só para falarmos com você sobre este pedido."
        />
        <div className="flex flex-wrap justify-between gap-2 pt-1 text-sm font-semibold">
          {convidado ? (
            <button
              type="button"
              onClick={() => {
                limparConvidado();
                setValores({ nome: "", sobrenome: "", telefone: "" });
              }}
              className="text-texto-suave underline underline-offset-4 transition hover:text-texto"
            >
              Não sou eu / limpar dados
            </button>
          ) : (
            <button type="button" onClick={() => setModo("escolha")} className="text-texto-suave underline underline-offset-4 transition hover:text-texto">
              Voltar
            </button>
          )}
          <button type="button" onClick={() => setModo("conta")} className="text-link underline underline-offset-4 hover:text-ferrugem-ativo">
            Entrar ou criar conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-erro={erroModo ? true : undefined}>
      <Opcao
        titulo="Continuar como convidado"
        texto="Só nome e celular. Rápido, sem senha."
        onClick={() => setModo("convidado")}
      />
      <Opcao
        titulo="Entrar ou criar conta"
        texto="Acompanhe seus pedidos e não digite seus dados de novo."
        onClick={() => setModo("conta")}
      />
      {erroModo && <MensagemErro>{erroModo}</MensagemErro>}
    </div>
  );
}
