"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CLASSE_BOTAO_PRINCIPAL } from "@/components/cliente/estilos";
import { IconeAlerta } from "@/components/icones";
import { souAdmin } from "@/lib/admin/pedidos";
import { getSupabaseAdmin } from "@/lib/admin/supabaseAdmin";
import { MENSAGEM_SEM_CONFIGURACAO, supabaseConfigurado } from "@/lib/supabase";

const AdminContext = createContext(null);

/** Endereço atual, para voltar a ele depois de entrar de novo. */
function enderecoAtual() {
  return `${window.location.pathname}${window.location.search}`;
}

/**
 * Protege as telas do painel: exige sessão + sou_admin() = true; senão vai para /admin/login
 * (com ?volta= para retornar à mesma tela). A proteção REAL é o RLS do banco; isto é para a UX.
 * Os filhos só aparecem depois da verificação (nada do painel é renderizado no servidor).
 */
export function AdminProvider({ children }) {
  const router = useRouter();
  const [estado, setEstado] = useState(supabaseConfigurado ? "carregando" : "sem-config"); // carregando | admin | erro | sem-config
  const [email, setEmail] = useState(null);
  const [tentativa, setTentativa] = useState(0);
  const saindo = useRef(false);

  const irParaLogin = useCallback(
    (motivo) => {
      const params = new URLSearchParams();
      if (!saindo.current) params.set("volta", enderecoAtual());
      if (motivo) params.set("motivo", motivo);
      router.replace(`/admin/login${params.size ? `?${params}` : ""}`);
    },
    [router],
  );

  useEffect(() => {
    if (!supabaseConfigurado) return;
    let ativo = true;
    const supabase = getSupabaseAdmin();

    async function verificar(sessao) {
      if (!sessao) return irParaLogin();
      try {
        if (!(await souAdmin())) {
          await supabase.auth.signOut();
          return irParaLogin("sem-acesso");
        }
        if (!ativo) return;
        setEmail(sessao.user.email ?? null);
        setEstado("admin");
      } catch (erro) {
        if (!ativo) return;
        if (erro.sessaoExpirada) return irParaLogin("expirou");
        setEstado("erro");
      }
    }

    supabase.auth.getSession().then(({ data }) => ativo && verificar(data.session));

    // Sessão encerrada (expirou, saiu em outra aba): volta ao login lembrando a tela atual.
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_OUT" && ativo) irParaLogin(saindo.current ? null : "expirou");
    });
    return () => {
      ativo = false;
      data.subscription.unsubscribe();
    };
  }, [irParaLogin, tentativa]);

  const sair = useCallback(async () => {
    saindo.current = true;
    await getSupabaseAdmin().auth.signOut();
    router.replace("/admin/login");
  }, [router]);

  /** Chame quando uma consulta devolver erro.sessaoExpirada. */
  const sessaoExpirou = useCallback(() => irParaLogin("expirou"), [irParaLogin]);

  const valor = useMemo(() => ({ email, sair, sessaoExpirou }), [email, sair, sessaoExpirou]);

  if (estado === "sem-config") return <TelaAviso texto={MENSAGEM_SEM_CONFIGURACAO} />;
  if (estado === "erro") {
    return (
      <TelaAviso texto="Não foi possível verificar o acesso. Confira a internet.">
        <button
          type="button"
          onClick={() => {
            setEstado("carregando");
            setTentativa((t) => t + 1);
          }}
          className={`${CLASSE_BOTAO_PRINCIPAL} mt-4`}
        >
          Tentar de novo
        </button>
      </TelaAviso>
    );
  }
  if (estado !== "admin") {
    return (
      <div className="grid min-h-dvh place-items-center" aria-busy="true">
        <p className="text-texto-suave">Verificando acesso…</p>
      </div>
    );
  }
  return <AdminContext.Provider value={valor}>{children}</AdminContext.Provider>;
}

function TelaAviso({ texto, children }) {
  return (
    <div className="mx-auto grid min-h-dvh max-w-sm place-items-center px-4">
      <div className="w-full">
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-erro-fundo px-3 py-3 text-[15px] font-medium text-erro">
          <IconeAlerta className="mt-px size-5 shrink-0" />
          <span>{texto}</span>
        </p>
        {children}
      </div>
    </div>
  );
}

export function useAdmin() {
  const contexto = useContext(AdminContext);
  if (!contexto) throw new Error("useAdmin precisa estar dentro de <AdminProvider>.");
  return contexto;
}
