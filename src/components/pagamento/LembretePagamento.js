"use client";

import { useCallback, useEffect, useState } from "react";
import { useCliente } from "@/components/cliente/ClienteProvider";
import { IconeAmpulheta, IconeFechar } from "@/components/icones";
import { fecharLembretePor, lerLembreteFechadoAte, lerUltimaNotificacao, salvarUltimaNotificacao } from "@/lib/armazenamento-local";
import { buscarPagamentosPendentes } from "@/lib/conta";
import { formatarTempoRestante } from "@/lib/formatar";
import ModalPagamento from "./ModalPagamento";
import { usePedidosAoVivo } from "./usePedidosAoVivo";

const MEIA_HORA = 30 * 60 * 1000;

/** Notificação do sistema, se o cliente permitiu e se não foi lembrado há menos de 30 min. */
function notificarSistema(pendentes) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  if (Date.now() - lerUltimaNotificacao() < MEIA_HORA) return;
  try {
    for (const p of pendentes) {
      new Notification("Edna & Célia Salgados", { body: p.mensagem, tag: `pagamento-${p.numero}`, icon: "/logo.webp" });
    }
    salvarUltimaNotificacao();
  } catch {
    // Alguns celulares só notificam via service worker: fica só o banner.
  }
}

/** Pede permissão de notificação (chamar a partir de um clique). Devolve true se ficou permitido. */
export async function pedirPermissaoNotificacao() {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission !== "default") return Notification.permission === "granted";
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

/**
 * Lembrete de pagamento (só cliente logado), montado no layout.
 * - Busca meus_pagamentos_pendentes() ao abrir, a cada 30 min, ao voltar para a aba e quando
 *   um pedido do cliente muda (realtime).
 * - Banner abaixo do header: mensagem do banco, tempo restante e "Pagar agora".
 * - "Fechar" esconde por 30 min; no próximo ciclo volta, enquanto estiver pendente.
 */
export default function LembretePagamento() {
  const { estado, usuarioId } = useCliente();
  const logado = estado === "logado";
  const [resultado, setResultado] = useState({ de: null, pendentes: [] });
  const [agora, setAgora] = useState(0); // 0 = ainda não montou no navegador
  const [fechadoAte, setFechadoAte] = useState(0);
  const [pagando, setPagando] = useState(null);

  const buscar = useCallback(async () => {
    if (!usuarioId) return;
    const { pendentes, erro } = await buscarPagamentosPendentes();
    if (erro) return; // falha de rede: tenta de novo no próximo ciclo
    setResultado({ de: usuarioId, pendentes });
    setAgora(Date.now());
    setFechadoAte(lerLembreteFechadoAte());
    if (pendentes.length > 0) notificarSistema(pendentes);
  }, [usuarioId]);

  // Ao abrir + a cada 30 min + ao voltar para a aba.
  useEffect(() => {
    if (!logado) return;
    queueMicrotask(buscar);
    const intervalo = setInterval(buscar, MEIA_HORA);
    function aoVoltar() {
      if (document.visibilityState === "visible") buscar();
    }
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [logado, buscar]);

  // Novo agendamento, pagamento confirmado ou expirado: atualiza na hora.
  usePedidosAoVivo(logado, buscar);

  // Relógio do tempo restante (a cada 30 s).
  useEffect(() => {
    if (!logado) return;
    const relogio = setInterval(() => setAgora(Date.now()), 30 * 1000);
    return () => clearInterval(relogio);
  }, [logado]);

  const pendentes = logado && resultado.de === usuarioId ? resultado.pendentes : [];
  const visiveis = agora ? pendentes.filter((p) => new Date(p.expira_em).getTime() > agora) : [];
  const fechado = fechadoAte > agora;

  function fechar() {
    fecharLembretePor(MEIA_HORA);
    setFechadoAte(Date.now() + MEIA_HORA);
  }

  return (
    <>
      {visiveis.length > 0 && !fechado && (
        <div role="region" aria-label="Pagamento pendente" className="sticky top-[68px] z-10 border-b border-borda-suave bg-aviso-fundo shadow-card">
          <div className="mx-auto max-w-2xl space-y-2 py-2.5 pl-3 pr-10">
            {visiveis.map((p) => (
              <div key={p.numero} className="flex items-center gap-3 text-aviso-texto">
                <IconeAmpulheta className="size-6 shrink-0" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold leading-snug">{p.mensagem}</p>
                  <p className="font-medium">Faltam {formatarTempoRestante(new Date(p.expira_em).getTime() - agora)} para pagar.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPagando({ numero: p.numero, total: p.total })}
                  className="shrink-0 rounded-xl bg-ferrugem px-3 py-2 text-sm font-bold text-white transition hover:bg-ferrugem-hover active:bg-ferrugem-ativo"
                >
                  Pagar agora
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar aviso de pagamento por 30 minutos"
            className="absolute right-1 top-1 grid size-7 place-items-center rounded-full text-aviso-texto transition hover:bg-superficie"
          >
            <IconeFechar className="size-4" />
          </button>
        </div>
      )}
      <ModalPagamento pedido={pagando} aoFechar={() => setPagando(null)} />
    </>
  );
}
