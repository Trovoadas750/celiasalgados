import Image from "next/image";
import Link from "next/link";
import { IconeInstagram, IconeWhatsapp } from "@/components/icones";
import { PAGINAS_LEGAIS, REDES_SOCIAIS } from "@/lib/loja";

const ICONES = {
  Instagram: IconeInstagram,
  WhatsApp: IconeWhatsapp,
};

const ROTULOS = {
  Instagram: "Instagram da loja",
  WhatsApp: "Falar no WhatsApp",
};

export default function Footer() {
  return (
    // O padding de baixo deixa espaço para a barra fixa da sacola
    <footer className="fundo-escuro border-t-4 border-vinho bg-cafe pb-[calc(env(safe-area-inset-bottom)+7rem)] text-creme">
      <div className="mx-auto max-w-2xl px-3 pt-6">
        <Link href="/" className="inline-flex min-w-0 items-center gap-2">
          <Image
            src="/logo.webp"
            alt="Edna & Célia Salgados"
            width={56}
            height={56}
            className="size-14 shrink-0 object-contain drop-shadow"
          />
          <span className="font-titulo text-lg leading-tight">
            Edna &amp; Célia
            <span className="block font-sans text-sm text-creme">Salgados</span>
          </span>
        </Link>

        {/* Contatos: ícone + texto, todos vindos de lib/loja.js */}
        <ul className="mt-4 flex flex-col gap-1 sm:flex-row sm:gap-6" aria-label="Contatos">
          {REDES_SOCIAIS.map(({ nome, texto, href }) => {
            const Icone = ICONES[nome];
            return (
              <li key={nome}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={ROTULOS[nome]}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg text-creme underline underline-offset-4 transition hover:text-laranja"
                >
                  <Icone className="size-6 shrink-0" />
                  <span>{texto}</span>
                </a>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-vinho pt-4 text-sm">
          <nav aria-label="Páginas legais">
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {PAGINAS_LEGAIS.map(({ href, rotulo }) => (
                <li key={href}>
                  <Link href={href} className="text-creme underline underline-offset-2 hover:text-laranja">
                    {rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="text-creme">© Edna &amp; Célia Salgados</p>
        </div>
      </div>
    </footer>
  );
}
