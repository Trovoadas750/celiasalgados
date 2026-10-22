"use client";

import { useEffect, useState } from "react";
import { IconeAlfinete } from "@/components/icones";
import { simularFrete } from "@/lib/entrega";
import { formatarPreco } from "@/lib/formatar";
import { REGRAS } from "@/lib/validacao";

function enderecoCompleto(e) {
  return !REGRAS.rua(e.rua) && !REGRAS.vila(e.vila) && !REGRAS.numero(e.numero);
}

// Consulta o frete quando o endereço fica completo (com uma pequena espera enquanto a pessoa digita).
export function useFrete(ativo, endereco) {
  const chave = ativo && enderecoCompleto(endereco) ? `${endereco.rua}|${endereco.vila}|${endereco.numero}` : null;
  const [resultado, setResultado] = useState({ chave: null, frete: null });

  useEffect(() => {
    if (!chave) return;
    let vigente = true;
    const espera = setTimeout(async () => {
      try {
        const frete = await simularFrete(endereco);
        if (vigente) setResultado({ chave, frete });
      } catch {
        if (vigente) setResultado({ chave, frete: { status: "erro" } });
      }
    }, 600);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
    // `endereco` entra pela `chave`: só recalcula quando rua/vila/número mudam.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  if (!ativo) return null;
  if (!chave) return { status: "aguardando_endereco" };
  if (resultado.chave !== chave) return { status: "calculando" };
  return resultado.frete;
}

const CONTEUDO = {
  aguardando_endereco: { titulo: "Taxa de entrega", texto: "Preencha o endereço para ver a taxa.", valor: "—" },
  calculando: { titulo: "Calculando a taxa…", texto: "Só um instante.", valor: "…" },
  a_combinar: {
    titulo: "Taxa de entrega a combinar",
    texto: "A salgadaria confirma o valor da entrega com você ao receber o pedido.",
    valor: "A combinar",
  },
  fora_da_area: {
    titulo: "Fora da área de entrega",
    texto: "Ainda não entregamos nesse endereço. Você pode retirar no local.",
    valor: "Indisponível",
    alerta: true,
  },
  erro: { titulo: "Não foi possível calcular a taxa", texto: "Ela será combinada ao confirmar o pedido.", valor: "A combinar" },
};

export default function ResumoFrete({ frete }) {
  if (!frete) return null;
  const c =
    frete.status === "disponivel"
      ? {
          titulo: "Taxa de entrega",
          texto: frete.prazoMinutos ? `Chega em cerca de ${frete.prazoMinutos} min.` : "Entrega no seu endereço.",
          valor: formatarPreco(frete.valor),
        }
      : CONTEUDO[frete.status] ?? CONTEUDO.erro;

  return (
    <div
      aria-live="polite"
      className={`flex items-center gap-3 rounded-xl p-3 ring-1 ${c.alerta ? "bg-aviso-fundo ring-aviso-texto" : "bg-superficie ring-borda-suave"}`}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-fundo text-cobre">
        <IconeAlfinete className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-bold ${c.alerta ? "text-aviso-texto" : ""}`}>{c.titulo}</p>
        <p className="text-sm text-texto-suave">{c.texto}</p>
      </div>
      <span className={`shrink-0 text-sm font-bold tabular-nums ${frete.status === "calculando" ? "animate-pulse" : ""} ${c.alerta ? "text-aviso-texto" : "text-ferrugem"}`}>
        {c.valor}
      </span>
    </div>
  );
}
