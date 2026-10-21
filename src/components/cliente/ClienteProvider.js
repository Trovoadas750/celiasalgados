"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getSupabase, supabaseConfigurado } from "@/lib/supabase";
import { atualizarNome as atualizarNomeNoBanco, buscarCliente, sair as sairDoSupabase } from "@/lib/conta";
import {
  lerConvidado,
  limparConvidado as limparConvidadoLocal,
  salvarConvidado as salvarConvidadoLocal,
} from "@/lib/armazenamento-local";

const ClienteContext = createContext(null);

/**
 * estado:
 *  - "carregando": ainda verificando sessão/localStorage
 *  - "visitante":  sem conta e sem dados de convidado salvos
 *  - "convidado":  sem conta, com nome/sobrenome/telefone salvos neste navegador
 *  - "logado":     sessão do Supabase com linha em `clientes`
 *
 * dados: { nome, sobrenome, telefone } para preencher o pedido (ou null).
 */
export function ClienteProvider({ children }) {
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState(null); // auth.users (id)
  const [cliente, setCliente] = useState(null); // linha de `clientes`
  const [convidado, setConvidado] = useState(null);
  const idAtual = useRef(undefined); // id do usuário já aplicado (undefined = ainda não verificado)

  useEffect(() => {
    let ativo = true;

    async function aplicarSessao(sessao) {
      const user = sessao?.user ?? null;
      idAtual.current = user?.id ?? null;
      const { cliente: linha } = user ? await buscarCliente(user.id) : { cliente: null };
      if (!ativo || idAtual.current !== (user?.id ?? null)) return;
      setUsuario(user);
      setCliente(linha);
      setCarregando(false);
    }

    // Lê o localStorage depois da hidratação, para o HTML do servidor bater com o do navegador.
    queueMicrotask(() => ativo && setConvidado(lerConvidado()));

    if (!supabaseConfigurado) {
      queueMicrotask(() => ativo && setCarregando(false));
      return () => {
        ativo = false;
      };
    }

    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => aplicarSessao(data.session));

    // Não chamar o Supabase direto dentro do callback (pode travar o lock da sessão).
    // Só recarrega quando o usuário muda de fato (login, cadastro, logout ou troca de conta).
    // O SIGNED_IN repetido ao voltar para a aba não faz a tela piscar.
    const { data } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (evento === "INITIAL_SESSION") return;
      if ((sessao?.user?.id ?? null) === idAtual.current) return;
      setCarregando(true);
      setTimeout(() => aplicarSessao(sessao), 0);
    });

    return () => {
      ativo = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const salvarConvidado = useCallback((dados) => {
    salvarConvidadoLocal(dados);
    setConvidado(lerConvidado() ?? dados);
  }, []);

  const limparConvidado = useCallback(() => {
    limparConvidadoLocal();
    setConvidado(null);
  }, []);

  const sair = useCallback(async () => {
    await sairDoSupabase();
    idAtual.current = null;
    setUsuario(null);
    setCliente(null);
  }, []);

  const atualizarNome = useCallback(
    async (novos) => {
      if (!usuario) return { erro: "Você não está logado." };
      const { cliente: linha, erro } = await atualizarNomeNoBanco(usuario.id, novos);
      if (linha) setCliente(linha);
      return { erro };
    },
    [usuario],
  );

  const valor = useMemo(() => {
    let estado = "visitante";
    let dados = null;
    if (carregando) estado = "carregando";
    else if (usuario && cliente) {
      estado = "logado";
      dados = { nome: cliente.nome, sobrenome: cliente.sobrenome, telefone: cliente.telefone };
    } else if (convidado) {
      estado = "convidado";
      dados = convidado;
    }
    return {
      estado,
      dados,
      usuarioId: usuario?.id ?? null,
      clienteDesde: cliente?.criado_em ?? null,
      convidado,
      salvarConvidado,
      limparConvidado,
      sair,
      atualizarNome,
    };
  }, [carregando, usuario, cliente, convidado, salvarConvidado, limparConvidado, sair, atualizarNome]);

  return <ClienteContext.Provider value={valor}>{children}</ClienteContext.Provider>;
}

export function useCliente() {
  const contexto = useContext(ClienteContext);
  if (!contexto) throw new Error("useCliente precisa estar dentro de <ClienteProvider>.");
  return contexto;
}
