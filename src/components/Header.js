"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconeCloche, IconeComanda, IconeCracha } from "@/components/icones";

const LINKS = [
  { href: "/", rotulo: "Menu", Icone: IconeCloche },
  { href: "/pedidos", rotulo: "Pedidos", Icone: IconeComanda },
  { href: "/perfil", rotulo: "Perfil", Icone: IconeCracha },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 fundo-escuro border-b-4 border-vinho bg-cafe text-creme shadow-md">
      <div className="mx-auto flex h-16 max-w-2xl items-center gap-2 px-3">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/logo2.png"
            alt="Edna & Célia Salgados"
            width={726}
            height={344}
            preload
            className="h-10 w-auto object-contain md:h-12"
          />
        </Link>

        <nav className="ml-auto flex items-stretch" aria-label="Principal">
          {LINKS.map(({ href, rotulo, Icone }) => {
            const ativo = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={`relative flex w-[4.75rem] flex-col items-center gap-0.5 rounded-xl py-1.5 text-sm font-bold uppercase tracking-wide transition-colors ${
                  ativo ? "text-laranja" : "text-creme hover:text-laranja"
                }`}
              >
                <Icone className="size-6" />
                {rotulo}
                <span
                  className={`absolute -bottom-[7px] h-[3px] w-8 rounded-full bg-laranja transition-opacity ${
                    ativo ? "opacity-100" : "opacity-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
