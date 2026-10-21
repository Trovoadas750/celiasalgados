"use client";

import { useState } from "react";
import { cadastrar } from "@/lib/conta";
import { mascararTelefone, temErros, validar } from "@/lib/validacao";
import Campo, { AlertaErro } from "./Campo";
import { CLASSE_BOTAO_PRINCIPAL } from "./estilos";

// `inicial` permite pré-preencher com os dados de convidado (nome, sobrenome, telefone).
export default function FormCadastro({ inicial, aoCadastrar }) {
  const [valores, setValores] = useState({
    nome: inicial?.nome ?? "",
    sobrenome: inicial?.sobrenome ?? "",
    telefone: mascararTelefone(inicial?.telefone ?? ""),
    senha: "",
    confirmar: "",
  });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  function mudar(campo, valor) {
    setValores((v) => ({ ...v, [campo]: valor }));
  }

  async function enviar(e) {
    e.preventDefault();
    if (enviando) return;
    const novos = validar(valores, ["nome", "sobrenome", "telefone", "senha"]);
    if (!novos.senha && valores.confirmar !== valores.senha) novos.confirmar = "As senhas não são iguais.";
    setErros(novos);
    setErroGeral(null);
    if (temErros(novos)) return;

    setEnviando(true);
    const { erro } = await cadastrar(valores);
    setEnviando(false);
    if (erro) setErroGeral(erro);
    else aoCadastrar?.();
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-3">
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
        dica="Ele será o seu login e não poderá ser trocado."
      />
      <Campo
        rotulo="Senha"
        type="password"
        autoComplete="new-password"
        value={valores.senha}
        onChange={(e) => mudar("senha", e.target.value)}
        erro={erros.senha}
        dica="Mínimo de 8 caracteres."
      />
      <Campo
        rotulo="Confirmar senha"
        type="password"
        autoComplete="new-password"
        value={valores.confirmar}
        onChange={(e) => mudar("confirmar", e.target.value)}
        erro={erros.confirmar}
      />
      <AlertaErro>{erroGeral}</AlertaErro>
      <button type="submit" disabled={enviando} className={CLASSE_BOTAO_PRINCIPAL}>
        {enviando ? "Criando conta…" : "Criar conta"}
      </button>
    </form>
  );
}
