"use client";

import { usePathname } from "next/navigation";
import { IconeWhatsappOficial } from "@/components/icones";
import { LOJA } from "@/lib/loja";

const DICA = "Nosso contato, tire suas dúvidas conosco";

// Botão flutuante de WhatsApp (canto inferior direito).
// - Fica acima da barra fixa da sacola, para não cobri-la.
// - Some no checkout: lá ele cobriria o botão "Fazer pedido" no celular (e a confirmação já tem
//   o botão "Falar no WhatsApp").
// - Hover (ou foco pelo teclado) mostra uma caixinha à esquerda com a DICA.
// Cores: fundo vinho + ícone creme (9.57), hover laranja sobre vinho (5.69);
// caixinha café com texto creme (12.55).
export default function BotaoWhatsapp() {
  const pathname = usePathname();
  if (pathname === "/checkout") return null;

  return (
    <div className="group fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-4 z-30">
      <a
        href={LOJA.whatsapp.link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        aria-describedby="dica-whatsapp"
        className="grid size-14 place-items-center rounded-full bg-vinho text-creme shadow-lg ring-2 ring-creme transition hover:text-laranja active:scale-95"
      >
        <IconeWhatsappOficial className="size-7" />
      </a>

      <span
        id="dica-whatsapp"
        role="tooltip"
        className="pointer-events-none absolute right-full top-1/2 mr-3 w-max max-w-[min(18rem,calc(100vw-6rem))] -translate-y-1/2 translate-x-1 rounded-xl bg-cafe px-3 py-2 text-sm font-medium leading-snug text-creme opacity-0 shadow-lg transition group-hover:translate-x-0 group-hover:opacity-100 group-has-[:focus-visible]:translate-x-0 group-has-[:focus-visible]:opacity-100"
      >
        {DICA}
        {/* Setinha apontando para o botão */}
        <span aria-hidden="true" className="absolute -right-1.5 top-1/2 size-3 -translate-y-1/2 rotate-45 rounded-[2px] bg-cafe" />
      </span>
    </div>
  );
}
