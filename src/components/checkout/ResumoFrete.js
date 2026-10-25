"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconeAlerta, IconeAlfinete, IconeRetirada, IconeWhatsappOficial } from "@/components/icones";
import { calcularFrete, chaveEndereco } from "@/lib/frete";
import { formatarPreco } from "@/lib/formatar";
import { linkWhatsappLoja, mensagemCombinarEntrega } from "@/lib/mensagemWhatsapp";
import { REGRAS } from "@/lib/validacao";

const ESPERA_MS = 1000; // depois que a pessoa para de digitar

// Cache da visita: chave do endereço -> resultado definitivo (erro temporário não entra).
const cache = new Map();

function enderecoCompleto(e) {
  return !REGRAS.rua(e.rua) && !REGRAS.numero(e.numero) && !REGRAS.vila(e.vila);
}

/**
 * Frete automático (sem botão): calcula 1 s depois que o cliente para de digitar ou ao sair de um
 * campo (`calcularAgora`). Nunca a cada tecla; repete só se o endereço mudar (cache por chave).
 * Endereço mudou no meio: a consulta anterior é cancelada.
 *
 * @returns {null | {
 *   status: "aguardando_endereco" | "calculando" | "ok" | "nao_encontrado" | "fora_da_area" | "nao_configurado" | "erro_temporario",
 *   valor?: number, chave: string | null, calcularAgora: () => void, recalcular: () => void
 * }}  null = não é entrega.
 */
export function useFreteEntrega(ativo, endereco) {
  const chave = ativo && enderecoCompleto(endereco) ? chaveEndereco(endereco) : null;
  const [ultimo, setUltimo] = useState({ chave: null, dados: null }); // último resultado (inclui erro temporário)
  const [tentativa, setTentativa] = useState(0);
  const enderecoAtual = useRef(endereco);
  const controle = useRef(null); // { chave, abortar }
  const temporizador = useRef(null);

  useEffect(() => {
    enderecoAtual.current = endereco;
  });

  const consultar = useCallback(async (alvo) => {
    if (!alvo || cache.has(alvo) || controle.current?.chave === alvo) return;
    controle.current?.abortar.abort();
    const abortar = new AbortController();
    controle.current = { chave: alvo, abortar };
    try {
      const dados = await calcularFrete(enderecoAtual.current, { signal: abortar.signal });
      // Erro temporário e "loja sem coordenadas" não ficam no cache: podem mudar sem trocar o endereço.
      if (!["erro_temporario", "invalido", "nao_configurado"].includes(dados.status)) cache.set(alvo, dados);
      setUltimo({ chave: alvo, dados: dados.status === "invalido" ? { status: "erro_temporario" } : dados });
    } catch {
      // abortada: outro endereço entrou no lugar
    } finally {
      if (controle.current?.abortar === abortar) controle.current = null;
    }
  }, []);

  // Debounce: espera 1 s sem mudanças no endereço.
  useEffect(() => {
    if (!chave || cache.has(chave)) return;
    temporizador.current = setTimeout(() => consultar(chave), ESPERA_MS);
    return () => clearTimeout(temporizador.current);
  }, [chave, tentativa, consultar]);

  // Endereço mudou: cancela a consulta do endereço antigo.
  useEffect(() => {
    if (controle.current && controle.current.chave !== chave) {
      controle.current.abortar.abort();
      controle.current = null;
    }
  }, [chave]);

  const calcularAgora = useCallback(() => {
    if (!chave) return;
    clearTimeout(temporizador.current);
    consultar(chave);
  }, [chave, consultar]);

  const recalcular = useCallback(() => {
    if (!chave) return;
    cache.delete(chave);
    setUltimo({ chave: null, dados: null });
    setTentativa((t) => t + 1);
    clearTimeout(temporizador.current);
    consultar(chave);
  }, [chave, consultar]);

  if (!ativo) return null;
  const base = { chave, calcularAgora, recalcular };
  if (!chave) return { ...base, status: "aguardando_endereco" };
  const dados = cache.get(chave) ?? (ultimo.chave === chave ? ultimo.dados : null);
  return dados ? { ...base, ...dados } : { ...base, status: "calculando" };
}

const SEM_ENTREGA = new Set(["nao_encontrado", "fora_da_area", "nao_configurado"]);

/** Crédito exigido pelo plano grátis da Geoapify. */
export function CreditoGeoapify() {
  return (
    <p className="text-[12px] text-texto-suave">
      Powered by{" "}
      <a href="https://www.geoapify.com/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-texto">
        Geoapify
      </a>
    </p>
  );
}

function Linha({ rotulo, children, forte = false }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${forte ? "border-t border-borda-suave pt-1.5 font-bold" : ""}`}>
      <span className={forte ? "" : "text-texto-suave"}>{rotulo}</span>
      <span className="tabular-nums">{children}</span>
    </div>
  );
}

/**
 * Frete logo abaixo do endereço: Subtotal (itens) · Entrega · Total, ou o aviso com WhatsApp/retirada.
 * `totalItens` e `total` vêm do calcular_pedido (o total já inclui o frete quando ele está ok).
 */
export default function ResumoFrete({ frete, endereco, totalItens, total, calculandoTotal, aoEscolherRetirada }) {
  if (!frete) return null;

  const semEntrega = SEM_ENTREGA.has(frete.status);
  const erro = frete.status === "erro_temporario";

  if (semEntrega || erro) {
    const mensagem = mensagemCombinarEntrega(endereco);
    return (
      <div aria-live="polite" className="space-y-3 rounded-xl bg-aviso-fundo p-3 text-aviso-texto">
        <p className="flex items-start gap-2 text-sm font-semibold">
          <IconeAlerta className="mt-px size-5 shrink-0" />
          {erro ? "Não foi possível calcular o frete agora." : "Não conseguimos calcular a entrega para esse endereço."}
        </p>
        <div className="grid gap-2 pl-7 min-[420px]:grid-cols-2">
          {(erro || frete.status === "nao_configurado") && (
            <button
              type="button"
              onClick={frete.recalcular}
              className="h-11 rounded-xl bg-superficie px-3 text-sm font-bold text-link ring-2 ring-link transition hover:text-ferrugem-ativo hover:ring-ferrugem-ativo min-[420px]:col-span-2"
            >
              Tentar de novo
            </button>
          )}
          <a
            href={linkWhatsappLoja(mensagem)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-ferrugem px-3 text-sm font-bold text-white transition hover:bg-ferrugem-hover active:bg-ferrugem-ativo"
          >
            <IconeWhatsappOficial className="size-5" />
            Combinar entrega pelo WhatsApp
          </a>
          <button
            type="button"
            onClick={aoEscolherRetirada}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-superficie px-3 text-sm font-bold text-link ring-2 ring-link transition hover:text-ferrugem-ativo hover:ring-ferrugem-ativo"
          >
            <IconeRetirada className="size-5" />
            Prefiro retirar no local
          </button>
        </div>
        <div className="pl-7">
          <CreditoGeoapify />
        </div>
      </div>
    );
  }

  const calculando = frete.status === "calculando";
  const ok = frete.status === "ok";

  return (
    <div className="rounded-xl bg-superficie p-3 ring-1 ring-borda-suave">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-fundo text-cobre">
          <IconeAlfinete className="size-5" />
        </span>
        <div className="min-w-0 flex-1 space-y-1 text-sm" aria-live="polite">
          {frete.status === "aguardando_endereco" ? (
            <p className="pt-2 text-texto-suave">Preencha rua, número e vila para ver o valor da entrega.</p>
          ) : (
            <>
              <Linha rotulo="Subtotal (itens)">{totalItens == null ? "…" : formatarPreco(totalItens)}</Linha>
              <Linha rotulo="Entrega">
                {calculando ? (
                  <span className="inline-flex items-center gap-1.5 text-texto-suave">
                    <span aria-hidden="true" className="size-3 animate-spin rounded-full border-2 border-borda-input border-t-transparent" />
                    Calculando frete...
                  </span>
                ) : (
                  <span className="font-semibold text-ferrugem">{formatarPreco(frete.valor)}</span>
                )}
              </Linha>
              <Linha rotulo="Total" forte>
                {ok && !calculandoTotal && total != null ? formatarPreco(total) : "…"}
              </Linha>
            </>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 pl-[3.25rem]">
        <CreditoGeoapify />
        {ok && (
          <button type="button" onClick={frete.recalcular} className="text-[13px] text-link underline underline-offset-2 hover:text-ferrugem-ativo">
            Recalcular frete
          </button>
        )}
      </div>
    </div>
  );
}
