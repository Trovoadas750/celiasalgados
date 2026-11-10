"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AlertaErro } from "@/components/cliente/Campo";
import { listarClientes } from "@/lib/admin/clientes";
import { buscarResumoCliente } from "@/lib/admin/pedidos";
import { formatarDiaMes, formatarPreco, formatarTelefone } from "@/lib/formatar";
import { CLASSE_CHIP } from "../estilos";
import { IconeBloqueio } from "../icones";
import { BuscaPedidos } from "../pedidos/FiltrosPedidos";
import DetalheCliente from "./DetalheCliente";

const ORDENS = [
  ["ultimo", "Último pedido", (a, b) => new Date(b.ultimo_pedido ?? 0) - new Date(a.ultimo_pedido ?? 0)],
  ["pedidos", "Mais pedidos", (a, b) => b.pedidos - a.pedidos],
  ["gasto", "Mais gasto", (a, b) => b.total_gasto - a.total_gasto],
];

/** /admin/clientes: com conta e convidados (agrupados pelo telefone), busca e detalhe (?telefone=). */
export default function TelaClientes() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const busca = sp.get("busca") ?? "";
  const ordem = ORDENS.find(([id]) => id === sp.get("ordem")) ?? ORDENS[0];
  const telefoneAberto = /^\d{10,11}$/.test(sp.get("telefone") ?? "") ? sp.get("telefone") : null;
  const [versao, setVersao] = useState(0);
  const [dados, setDados] = useState({ chave: null, clientes: [], erro: null });
  const [avulso, setAvulso] = useState(null); // { telefone, dados }: aberto pela URL e fora da lista atual
  const chave = `${busca}|${versao}`;

  useEffect(() => {
    let ativo = true;
    listarClientes(chave.split("|")[0])
      .then((clientes) => ativo && setDados({ chave, clientes, erro: null }))
      .catch((e) => ativo && setDados({ chave, clientes: [], erro: e.message }));
    return () => {
      ativo = false;
    };
  }, [chave]);

  const naLista = telefoneAberto ? dados.clientes.find((c) => c.telefone === telefoneAberto) : null;
  const precisaBuscar = Boolean(telefoneAberto) && dados.chave === chave && !naLista;

  useEffect(() => {
    if (!precisaBuscar) return;
    let ativo = true;
    buscarResumoCliente(telefoneAberto)
      .then(
        (c) =>
          ativo &&
          setAvulso({ telefone: telefoneAberto, dados: c ? { ...c, total_gasto: Number(c.total_gasto ?? 0), pedidos: Number(c.pedidos ?? 0) } : null }),
      )
      .catch(() => ativo && setAvulso({ telefone: telefoneAberto, dados: null }));
    return () => {
      ativo = false;
    };
  }, [precisaBuscar, telefoneAberto, versao]);

  const avulsoAtual = avulso && avulso.telefone === telefoneAberto ? avulso : null;
  const aberto = naLista ?? (avulsoAtual ? avulsoAtual.dados : null);
  const naoEncontrado = !naLista && Boolean(avulsoAtual) && !avulsoAtual.dados;


  const ir = useCallback(
    (mudancas, empurrar = false) => {
      const params = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(mudancas)) {
        if (v) params.set(k, v);
        else params.delete(k);
      }
      const url = params.size ? `${pathname}?${params}` : pathname;
      if (empurrar) router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    },
    [sp, pathname, router],
  );
  const mudarBusca = useCallback((texto) => ir({ busca: texto }), [ir]);

  // Esc fecha o detalhe (se nenhuma janela estiver aberta por cima).
  useEffect(() => {
    if (!telefoneAberto) return;
    function esc(e) {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) ir({ telefone: null });
    }
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  });

  const clientes = [...dados.clientes].sort(ordem[2]);
  const carregando = dados.chave !== chave;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="traco-vinho font-titulo text-[28px] leading-tight text-ferrugem">Clientes</h1>
      <p className="mt-1 text-sm text-texto-suave">Com conta e convidados, juntos pelo telefone.</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <BuscaPedidos valor={busca} aoMudar={mudarBusca} placeholder="Buscar por nome ou telefone" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Ordenar">
        {ORDENS.map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            aria-pressed={ordem[0] === id}
            onClick={() => ir({ ordem: id === "ultimo" ? null : id })}
            className={`${CLASSE_CHIP} ${ordem[0] === id ? "bg-ferrugem text-white" : "bg-superficie text-texto ring-1 ring-borda-input hover:ring-ferrugem"}`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {dados.erro ? (
          <AlertaErro>{dados.erro}</AlertaErro>
        ) : carregando ? (
          <div className="h-64 animate-pulse rounded-2xl bg-borda-suave" aria-busy="true" aria-label="Carregando clientes" />
        ) : clientes.length === 0 ? (
          <p className="rounded-2xl bg-superficie px-4 py-8 text-center font-semibold ring-1 ring-borda-suave">
            {busca ? "Nenhum cliente encontrado." : "Nenhum cliente ainda."}
          </p>
        ) : (
          <>
            <p className="mb-2 text-sm text-texto-suave" aria-live="polite">
              {clientes.length} cliente(s){clientes.length >= 200 ? " (mostrando os 200 primeiros; use a busca)" : ""}
            </p>
            <ul className="divide-y divide-borda-suave rounded-2xl bg-superficie ring-1 ring-borda-suave">
              {clientes.map((c) => (
                <li key={c.telefone}>
                  <button
                    type="button"
                    onClick={() => ir({ telefone: c.telefone }, !telefoneAberto)}
                    className={`flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left hover:bg-fundo ${
                      c.telefone === telefoneAberto ? "bg-fundo shadow-[inset_4px_0_0_var(--ferrugem)]" : ""
                    }`}
                  >
                    <span className="font-bold">{c.nome}</span>
                    <span className="tabular-nums text-texto-suave">{formatarTelefone(c.telefone)}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        c.cliente_id ? "bg-vinho text-creme" : "bg-superficie text-texto-suave ring-1 ring-borda-input"
                      }`}
                    >
                      {c.cliente_id ? "Com conta" : "Convidado"}
                    </span>
                    {c.bloqueado && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-erro-fundo px-2 py-0.5 text-xs font-bold text-erro">
                        <IconeBloqueio className="size-3.5" /> Bloqueado
                      </span>
                    )}
                    <span className="ml-auto text-sm">
                      <strong className="tabular-nums">{c.pedidos}</strong> pedido(s) · <strong className="tabular-nums">{formatarPreco(c.total_gasto)}</strong>
                      {c.ultimo_pedido && <span className="text-texto-suave"> · último {formatarDiaMes(c.ultimo_pedido)}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {telefoneAberto && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div aria-hidden="true" onClick={() => ir({ telefone: null })} className="hidden flex-1 bg-[rgba(0,0,0,0.45)] lg:block" />
          <aside aria-label="Detalhe do cliente" className="h-full w-full overflow-y-auto bg-fundo shadow-card lg:w-[34rem]">
            {aberto ? (
              <DetalheCliente
                key={aberto.telefone}
                cliente={aberto}
                versao={versao}
                aoFechar={() => ir({ telefone: null })}
                aoMudou={() => setVersao((v) => v + 1)}
              />
            ) : naoEncontrado ? (
              <div className="space-y-3 p-4">
                <AlertaErro>Cliente não encontrado.</AlertaErro>
                <button type="button" onClick={() => ir({ telefone: null })} className="font-semibold text-link underline underline-offset-4">
                  Fechar
                </button>
              </div>
            ) : (
              <div className="space-y-3 p-3" aria-busy="true" aria-label="Carregando cliente">
                <div className="h-40 animate-pulse rounded-2xl bg-borda-suave" />
                <div className="h-56 animate-pulse rounded-2xl bg-borda-suave" />
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
