"use client";

import { useRef, useState } from "react";
import { CreditoGeoapify } from "@/components/checkout/ResumoFrete";
import FormEndereco, { ENDERECO_VAZIO } from "@/components/checkout/FormEndereco";
import { CLASSE_BOTAO_PRINCIPAL } from "@/components/cliente/estilos";
import { IconeAlerta, IconeCheck, IconeFechar, IconeMotoboy, IconeWhatsappOficial } from "@/components/icones";
import { lerUltimoEndereco, salvarUltimoEndereco } from "@/lib/armazenamento-local";
import { calcularFrete } from "@/lib/frete";
import { formatarPreco } from "@/lib/formatar";
import { linkWhatsappLoja, mensagemCombinarEntrega } from "@/lib/mensagemWhatsapp";
import { temErros, validar } from "@/lib/validacao";

const SEM_ENTREGA = new Set(["nao_encontrado", "fora_da_area", "nao_configurado"]);

function enderecoInicial() {
  const salvo = lerUltimoEndereco() ?? {};
  return Object.fromEntries(Object.keys(ENDERECO_VAZIO).map((campo) => [campo, String(salvo[campo] ?? "")]));
}

/**
 * "Simular frete" no cardápio: o cliente vê o valor da entrega antes de montar o pedido.
 * Usa o mesmo cálculo do checkout (/api/frete: o banco calcula). Deu certo: o endereço fica
 * guardado neste navegador e o checkout já abre preenchido.
 */
export default function SimularFrete() {
  const dialogo = useRef(null);
  const [endereco, setEndereco] = useState(ENDERECO_VAZIO);
  const [erros, setErros] = useState({});
  const [resultado, setResultado] = useState(null); // { status, valor?, mensagem? }
  const [calculando, setCalculando] = useState(false);

  function abrir() {
    setEndereco(enderecoInicial()); // último endereço usado (se houver)
    setErros({});
    setResultado(null);
    dialogo.current.showModal();
  }

  function mudarEndereco(novo) {
    setEndereco(novo);
    setResultado(null); // endereço mudou: o valor anterior não vale mais
    if (temErros(erros)) setErros({});
  }

  async function calcular(e) {
    e.preventDefault();
    if (calculando) return;
    const novos = validar(endereco, ["cep", "rua", "numero", "vila"]);
    setErros(novos);
    if (temErros(novos)) return;
    setCalculando(true);
    const dados = await calcularFrete(endereco);
    setCalculando(false);
    setResultado(dados);
    if (dados.status === "ok") salvarUltimoEndereco({ ...lerUltimoEndereco(), ...endereco });
  }

  return (
    <>
      {/* Borda ferrugem (cor da marca, design-cores.md); ícone branco sobre ferrugem (5.83) */}
      <button
        type="button"
        onClick={abrir}
        aria-haspopup="dialog"
        className="group mt-3 flex w-full items-center gap-3 rounded-2xl bg-superficie p-3 text-left shadow-card ring-2 ring-ferrugem transition hover:bg-creme hover:ring-ferrugem-hover active:scale-[0.99]"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ferrugem text-white transition group-hover:bg-ferrugem-hover">
          <IconeMotoboy className="size-7" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold leading-snug text-texto">Simular frete</span>
          <span className="block text-sm leading-snug text-texto-suave">Veja quanto custa a entrega no seu endereço</span>
        </span>
        <span aria-hidden="true" className="pr-1 text-2xl font-bold leading-none text-ferrugem transition group-hover:translate-x-0.5">
          ›
        </span>
      </button>

      <dialog
        ref={dialogo}
        aria-labelledby="titulo-simular-frete"
        onClick={(e) => e.target === dialogo.current && dialogo.current.close()}
        className="sheet m-auto max-h-[90dvh] w-[min(28rem,calc(100vw-2rem))] overflow-y-auto rounded-3xl bg-fundo p-0 text-texto"
      >
        <form onSubmit={calcular} noValidate className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="titulo-simular-frete" className="traco-vinho font-titulo text-2xl text-ferrugem">
                Simular frete
              </h2>
              <p className="mt-1 text-sm text-texto-suave">Entregamos em Ourinhos. Informe o endereço para ver o valor.</p>
            </div>
            <button
              type="button"
              onClick={() => dialogo.current.close()}
              aria-label="Fechar"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-superficie text-texto ring-1 ring-borda-input transition hover:bg-fundo"
            >
              <IconeFechar className="size-5" />
            </button>
          </div>

          <FormEndereco valores={endereco} setValores={mudarEndereco} erros={erros} semReferencia />

          <button type="submit" disabled={calculando} className={CLASSE_BOTAO_PRINCIPAL}>
            {calculando ? "Calculando frete..." : "Calcular frete"}
          </button>

          <div aria-live="polite">
            {resultado?.status === "ok" && (
              <div className="space-y-1 rounded-xl bg-sucesso-fundo p-3 text-sucesso">
                <p className="flex items-center justify-between gap-3 font-bold">
                  <span className="flex items-center gap-2">
                    <IconeCheck className="size-5 shrink-0" />
                    Entrega para esse endereço
                  </span>
                  <span className="text-lg tabular-nums">{formatarPreco(resultado.valor)}</span>
                </p>
                <p className="pl-7 text-sm">
                  O valor é confirmado ao finalizar o pedido. Guardamos o endereço para você não digitar de novo.
                </p>
              </div>
            )}

            {SEM_ENTREGA.has(resultado?.status) && (
              <div className="space-y-3 rounded-xl bg-aviso-fundo p-3 text-aviso-texto">
                <p className="flex items-start gap-2 text-sm font-semibold">
                  <IconeAlerta className="mt-px size-5 shrink-0" />
                  Não conseguimos calcular a entrega para esse endereço. Fale com a gente ou retire no local.
                </p>
                <a
                  href={linkWhatsappLoja(mensagemCombinarEntrega(endereco))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-ferrugem px-3 text-sm font-bold text-white transition hover:bg-ferrugem-hover active:bg-ferrugem-ativo"
                >
                  <IconeWhatsappOficial className="size-5" />
                  Combinar entrega pelo WhatsApp
                </a>
              </div>
            )}

            {(resultado?.status === "erro_temporario" || resultado?.status === "invalido") && (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-erro-fundo px-3 py-2.5 text-sm font-medium text-erro">
                <IconeAlerta className="mt-px size-5 shrink-0" />
                {resultado.mensagem ?? "Não foi possível calcular o frete agora. Tente de novo em instantes."}
              </p>
            )}
          </div>

          <p className="text-sm text-texto-suave">Pedidos acima de 100 salgados são só para retirada no local.</p>
          <CreditoGeoapify />
        </form>
      </dialog>
    </>
  );
}
