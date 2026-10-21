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
    <header className="sticky top-0 z-20 bg-vermelho text-white shadow-md shadow-vermelho-escuro/20">
      <div className="mx-auto flex h-16 max-w-2xl items-center gap-2 px-3">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <Image
            src="/logo.png"
            alt="Edna & Célia Salgados"
            width={48}
            height={48}
            priority
            className="size-12 shrink-0 object-contain drop-shadow"
          />
          <span className="hidden font-titulo text-lg leading-tight text-white min-[400px]:block">
            Edna &amp; Célia
          </span>
        </Link>

        <nav className="ml-auto flex items-stretch" aria-label="Principal">
          {LINKS.map(({ href, rotulo, Icone }) => {
            const ativo = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={`relative flex w-[4.25rem] flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  ativo ? "text-white" : "text-white/80 hover:text-white"
                }`}
              >
                <Icone className="size-6" />
                {rotulo}
                <span
                  className={`absolute -bottom-[7px] h-[3px] w-8 rounded-full bg-white transition-opacity ${
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
