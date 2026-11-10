"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertaErro } from "@/components/cliente/Campo";
import { IconeAlerta } from "@/components/icones";
import { souAdmin } from "@/lib/admin/pedidos";
import { getSupabaseAdmin } from "@/lib/admin/supabaseAdmin";
import { supabaseConfigurado, MENSAGEM_SEM_CONFIGURACAO } from "@/lib/supabase";
import { CLASSE_BOTAO_PRINCIPAL, CLASSE_CAMPO } from "./estilos";
import { IconeOlho, IconeOlhoFechado } from "./icones";

const SEM_ACESSO = "Esta conta não tem acesso ao painel.";

/** Só volta para telas do painel (evita redirecionar para outro site). */
function destinoSeguro(volta) {
  if (!volta || !volta.startsWith("/admin") || volta.startsWith("//") || volta.startsWith("/admin/login")) return "/admin";
  return volta;
}

function mensagemErroLogin(error) {
  const texto = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
  if (error?.status === 429 || texto.includes("rate") || texto.includes("too many")) return "Muitas tentativas. Espere alguns minutos.";
  if (texto.includes("invalid") || texto.includes("credentials") || error?.status === 400) return "E-mail ou senha incorretos.";
  if (texto.includes("fetch") || texto.includes("network")) return "Sem conexão. Confira a internet e tente de novo.";
  return "Não foi possível entrar agora. Tente de novo.";
}

export default function LoginAdmin() {
  const router = useRouter();
  const params = useSearchParams();
  const destino = destinoSeguro(params.get("volta"));
  const motivo = params.get("motivo");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(motivo === "sem-acesso" ? SEM_ACESSO : null);
  const [esqueci, setEsqueci] = useState(false);

  // Já logado como admin: vai direto para o painel.
  useEffect(() => {
    if (!supabaseConfigurado) return;
    let ativo = true;
    getSupabaseAdmin()
      .auth.getSession()
      .then(async ({ data }) => {
        if (data.session && ativo && (await souAdmin().catch(() => false)) && ativo) router.replace(destino);
      });
    return () => {
      ativo = false;
    };
  }, [router, destino]);

  async function entrar(e) {
    e.preventDefault();
    if (enviando) return;
    if (!email.trim() || !senha) {
      setErro("Preencha o e-mail e a senha.");
      return;
    }
    setEnviando(true);
    setErro(null);
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error) {
      setErro(mensagemErroLogin(error));
      setEnviando(false);
      return;
    }
    const admin = await souAdmin().catch(() => false);
    if (!admin) {
      await supabase.auth.signOut();
      setErro(SEM_ACESSO);
      setEnviando(false);
      return;
    }
    router.replace(destino);
  }

  if (!supabaseConfigurado) {
    return (
      <main className="mx-auto max-w-sm px-4 pt-16">
        <AlertaErro>{MENSAGEM_SEM_CONFIGURACAO}</AlertaErro>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-sm px-4 pb-16 pt-12">
      <h1 className="traco-vinho font-titulo text-[28px] leading-tight text-ferrugem">Painel da loja</h1>
      <p className="mt-1 text-[15px] text-texto-suave">Edna &amp; Célia Salgados</p>

      {motivo === "expirou" && (
        <p role="status" className="mt-5 flex items-start gap-2 rounded-xl bg-info-fundo px-3 py-2.5 text-sm font-semibold text-info">
          <IconeAlerta className="mt-px size-5 shrink-0" />
          <span>Sua sessão expirou. Entre de novo para continuar de onde parou.</span>
        </p>
      )}

      <form onSubmit={entrar} noValidate className="mt-6 space-y-4 rounded-2xl bg-superficie p-4 ring-1 ring-borda-suave">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">E-mail</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={CLASSE_CAMPO}
          />
        </label>
        <div>
          <label htmlFor="senha-admin" className="mb-1 block text-sm font-semibold">
            Senha
          </label>
          <div className="relative">
            <input
              id="senha-admin"
              type={verSenha ? "text" : "password"}
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className={`${CLASSE_CAMPO} pr-14`}
            />
            <button
              type="button"
              onClick={() => setVerSenha((v) => !v)}
              aria-label={verSenha ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={verSenha}
              className="absolute inset-y-0 right-1 my-auto grid size-11 place-items-center rounded-lg text-texto-suave hover:text-texto"
            >
              {verSenha ? <IconeOlhoFechado className="size-5" /> : <IconeOlho className="size-5" />}
            </button>
          </div>
        </div>
        <AlertaErro>{erro}</AlertaErro>
        <button type="submit" disabled={enviando} className={CLASSE_BOTAO_PRINCIPAL}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          aria-expanded={esqueci}
          onClick={() => setEsqueci((v) => !v)}
          className="text-sm font-semibold text-link underline underline-offset-4 hover:text-ferrugem-ativo"
        >
          Esqueci a senha
        </button>
        {esqueci && (
          <p className="mt-2 rounded-xl bg-info-fundo px-3 py-2.5 text-left text-sm text-info">
            Peça para outro administrador redefinir ou redefina pelo Supabase (Authentication › Users).
          </p>
        )}
      </div>
    </main>
  );
}
