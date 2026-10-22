"use client";

import { useState } from "react";
import { entrar } from "@/lib/conta";
import { mascararTelefone, temErros, validar } from "@/lib/validacao";
import Campo, { AlertaErro } from "./Campo";
import { CLASSE_BOTAO_PRINCIPAL } from "./estilos";

export default function FormLogin({ aoEntrar }) {
  const [valores, setValores] = useState({ telefone: "", senha: "" });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    if (enviando) return;
    const novos = validar(valores, ["telefone"]);
    if (!valores.senha) novos.senha = "Informe a senha.";
    setErros(novos);
    setErroGeral(null);
    if (temErros(novos)) return;

    setEnviando(true);
    const { erro } = await entrar(valores);
    setEnviando(false);
    if (erro) setErroGeral(erro);
    else aoEntrar?.();
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-3">
      <Campo
        rotulo="Celular"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="(14) 99999-9999"
        value={valores.telefone}
        onChange={(e) => setValores({ ...valores, telefone: mascararTelefone(e.target.value) })}
        erro={erros.telefone}
      />
      <Campo
        rotulo="Senha"
        type="password"
        autoComplete="current-password"
        value={valores.senha}
        onChange={(e) => setValores({ ...valores, senha: e.target.value })}
        erro={erros.senha}
      />
      <AlertaErro>{erroGeral}</AlertaErro>
      <button type="submit" disabled={enviando} className={CLASSE_BOTAO_PRINCIPAL}>
        {enviando ? "Entrando…" : "Entrar"}
      </button>
      <p className="text-center text-sm text-texto-suave">
        Esqueceu a senha? Fale com a salgadaria para redefinir a senha.
      </p>
    </form>
  );
}
