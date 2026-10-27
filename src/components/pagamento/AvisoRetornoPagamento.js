"use client";

import { useSearchParams } from "next/navigation";
import { IconeAlerta, IconeCheck } from "@/components/icones";

// Aviso em "Meus pedidos" quando o cliente volta da InfinitePay (/api/pagamentos/retorno manda
// ?pagamento=<resultado>&pedido=<nº>). Só informa: quem confirma é o servidor, e o status do
// pedido abaixo atualiza sozinho (realtime). Use dentro de <Suspense> (useSearchParams).

const AVISOS = {
  confirmado: {
    classe: "bg-sucesso-fundo text-sucesso",
    Icone: IconeCheck,
    texto: (n) => `Pagamento confirmado! Seu agendamento está garantido.${n ? ` (Pedido nº ${n})` : ""}`,
  },
  pendente: {
    classe: "bg-info-fundo text-info",
    Icone: IconeAlerta,
    texto: (n) =>
      `Estamos aguardando a confirmação da InfinitePay${n ? ` para o pedido nº ${n}` : ""}. Assim que ela chegar, o pedido aparece como pago aqui, sem precisar recarregar.`,
  },
  revisar: {
    classe: "bg-aviso-fundo text-aviso-texto",
    Icone: IconeAlerta,
    texto: (n) => `O pagamento${n ? ` do pedido nº ${n}` : ""} chegou depois do prazo do agendamento. A loja vai verificar e falar com você.`,
  },
  problema: {
    classe: "bg-aviso-fundo text-aviso-texto",
    Icone: IconeAlerta,
    texto: (n) => `Não conseguimos confirmar o pagamento automaticamente. Fale com a loja pelo WhatsApp${n ? ` informando o pedido nº ${n}` : ""}.`,
  },
};

export default function AvisoRetornoPagamento() {
  const params = useSearchParams();
  const aviso = AVISOS[params.get("pagamento")];
  if (!aviso) return null;
  const numero = /^\d{1,10}$/.test(params.get("pedido") ?? "") ? params.get("pedido") : null;
  const { classe, Icone, texto } = aviso;
  return (
    <p role="status" className={`mb-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${classe}`}>
      <Icone className="mt-px size-5 shrink-0" />
      <span>{texto(numero)}</span>
    </p>
  );
}
