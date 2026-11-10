"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { lerVistos, marcarVisto, notificar, somLigado, tocarSom } from "@/lib/admin/alertas";
import { EXPIRAR_A_CADA_MS, RECARREGAR_SEM_TEMPO_REAL_MS } from "@/lib/admin/config";
import { expirarPagamentosPendentes } from "@/lib/admin/pedidos";
import { textoDiaHora } from "@/lib/admin/status";
import { getSupabaseAdmin } from "@/lib/admin/supabaseAdmin";
import { formatarPreco } from "@/lib/formatar";
import { useToast } from "./Toasts";

const TempoRealContext = createContext(null);

function textoNovoPedido(p) {
  const tipo = p.tipo_entrega === "retirada" ? "Retirada" : "Entrega";
  const quando = p.agendado_para ? textoDiaHora(p.agendado_para, Date.now()) : "agora";
  return `Novo pedido nº ${p.id}: ${p.nome ?? ""} · ${formatarPreco(Number(p.total))} · ${tipo} ${quando}`;
}

/**
 * Tempo real dos pedidos para todo o painel:
 * - assina INSERT/UPDATE em `pedidos` (o RLS já entrega tudo ao admin);
 * - pedido novo: aviso na tela, som (se ligado), notificação do navegador e "(2) Painel" no título;
 * - avisa as telas (usePedidosMudaram) para recarregarem;
 * - sem conexão: recarrega a cada 60 s; ao voltar para a aba, recarrega;
 * - expira agendamentos vencidos ao abrir e a cada 5 min.
 */
export function TempoRealProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { mostrar } = useToast();
  const [aoVivo, setAoVivo] = useState(false);
  const [vistos, setVistos] = useState(lerVistos);
  const [chegaram, setChegaram] = useState([]); // ids que chegaram nesta sessão e ainda não foram abertos
  const ouvintes = useRef(new Set());
  const espera = useRef(null);

  const avisarTelas = useCallback(() => {
    clearTimeout(espera.current);
    espera.current = setTimeout(() => ouvintes.current.forEach((cb) => cb()), 400);
  }, []);

  // Assinatura do realtime (o supabase-js reconecta sozinho).
  useEffect(() => {
    const supabase = getSupabaseAdmin();
    const canal = supabase
      .channel("pedidos-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, (payload) => {
        if (payload.eventType === "INSERT" && payload.new?.id) {
          const p = payload.new;
          setChegaram((lista) => (lista.includes(p.id) ? lista : [...lista, p.id]));
          mostrar({
            tipo: "novo",
            texto: textoNovoPedido(p),
            duracao: 12000,
            acoes: [{ rotulo: "Abrir", onClick: () => router.push(`/admin/pedidos?pedido=${p.id}`) }],
          });
          if (somLigado()) tocarSom();
          notificar("Novo pedido", textoNovoPedido(p), `pedido-${p.id}`);
        }
        avisarTelas();
      })
      .subscribe((status) => {
        const conectado = status === "SUBSCRIBED";
        setAoVivo(conectado);
        if (conectado) avisarTelas(); // voltou: busca o que mudou enquanto estava fora
      });
    return () => {
      supabase.removeChannel(canal);
    };
  }, [mostrar, router, avisarTelas]);

  // Sem tempo real: recarrega a cada 60 s.
  useEffect(() => {
    if (aoVivo) return;
    const intervalo = setInterval(avisarTelas, RECARREGAR_SEM_TEMPO_REAL_MS);
    return () => clearInterval(intervalo);
  }, [aoVivo, avisarTelas]);

  // Voltou para a aba: recarrega.
  useEffect(() => {
    function aoVoltar() {
      if (document.visibilityState === "visible") avisarTelas();
    }
    document.addEventListener("visibilitychange", aoVoltar);
    return () => document.removeEventListener("visibilitychange", aoVoltar);
  }, [avisarTelas]);

  // Agendamentos vencidos: expira ao abrir e a cada 5 min.
  useEffect(() => {
    const expirar = () =>
      expirarPagamentosPendentes()
        .then((n) => n > 0 && avisarTelas())
        .catch(() => {});
    expirar();
    const intervalo = setInterval(expirar, EXPIRAR_A_CADA_MS);
    return () => clearInterval(intervalo);
  }, [avisarTelas]);

  const naoAbertos = chegaram.filter((id) => !vistos.has(id)).length;

  // "(2) Painel" no título da aba.
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "") || "Painel";
    document.title = naoAbertos > 0 ? `(${naoAbertos}) ${base}` : base;
  }, [naoAbertos, pathname]);

  const marcarAberto = useCallback((id) => setVistos(new Set(marcarVisto(id))), []);

  const assinar = useCallback((cb) => {
    ouvintes.current.add(cb);
    return () => ouvintes.current.delete(cb);
  }, []);

  const valor = useMemo(
    () => ({ aoVivo, vistos, marcarAberto, assinar, recarregarTudo: avisarTelas }),
    [aoVivo, vistos, marcarAberto, assinar, avisarTelas],
  );

  return <TempoRealContext.Provider value={valor}>{children}</TempoRealContext.Provider>;
}

export function useTempoReal() {
  const contexto = useContext(TempoRealContext);
  if (!contexto) throw new Error("useTempoReal precisa estar dentro de <TempoRealProvider>.");
  return contexto;
}

/** Chama `cb` quando algum pedido muda (tempo real, recarga periódica ou volta para a aba). */
export function usePedidosMudaram(cb) {
  const { assinar } = useTempoReal();
  const atual = useRef(cb);
  useEffect(() => {
    atual.current = cb;
  });
  useEffect(() => assinar(() => atual.current()), [assinar]);
}

/** Relógio para urgências ("Atrasado 15 min") e tempo restante. */
export function useRelogio(intervaloMs = 30000) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs]);
  return agora;
}
