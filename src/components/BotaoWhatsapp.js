"use client";

import { usePathname } from "next/navigation";
import { IconeWhatsapp } from "@/components/icones";
import { LOJA } from "@/lib/loja";

// Botão flutuante de WhatsApp (canto inferior direito).
// - Fica acima da barra fixa da sacola, para não cobri-la.
// - Some no checkout: lá ele cobriria o botão "Fazer pedido" no celular (e a confirmação já tem
//   o botão "Falar no WhatsApp").
// Cores: fundo café + ícone creme (12.55), hover laranja sobre café (7.47).
export default function BotaoWhatsapp() {
  const pathname = usePathname();
  if (pathname === "/checkout") return null;

  return (
    <a
      href={LOJA.whatsapp.link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-4 z-30 grid size-14 place-items-center rounded-full bg-cafe text-creme shadow-lg ring-2 ring-creme transition hover:text-laranja active:scale-95"
    >
      <IconeWhatsapp className="size-7" />
    </a>
  );
}
