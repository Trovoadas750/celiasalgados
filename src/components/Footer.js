import Image from "next/image";
import Link from "next/link";
import { IconeFacebook, IconeInstagram, IconeWhatsapp } from "@/components/icones";
import { PAGINAS_LEGAIS, REDES_SOCIAIS } from "@/lib/contato";

const ICONES = {
  Instagram: IconeInstagram,
  WhatsApp: IconeWhatsapp,
  Facebook: IconeFacebook,
};

export default function Footer() {
  return (
    // O padding de baixo deixa espaço para a barra fixa da sacola
    <footer className="bg-vermelho pb-[calc(env(safe-area-inset-bottom)+7rem)] text-white">
      <div className="mx-auto max-w-2xl px-3 pt-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <Image
              src="/logo.png"
              alt="Edna & Célia Salgados"
              width={56}
              height={56}
              className="size-14 shrink-0 object-contain drop-shadow"
            />
            <span className="font-titulo text-lg leading-tight">
              Edna &amp; Célia
              <span className="block font-sans text-xs text-white/80">Salgados</span>
            </span>
          </Link>

          <ul className="ml-auto flex items-center gap-1" aria-label="Redes sociais">
            {REDES_SOCIAIS.map(({ nome, href }) => {
              const Icone = ICONES[nome];
              return (
                <li key={nome}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={nome}
                    className="grid size-11 place-items-center rounded-full text-white/90 transition hover:bg-white/10 hover:text-white"
                  >
                    <Icone className="size-6" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-white/20 pt-4 text-sm">
          <nav aria-label="Páginas legais">
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {PAGINAS_LEGAIS.map(({ href, rotulo }) => (
                <li key={href}>
                  <Link href={href} className="text-white/90 underline-offset-2 hover:text-white hover:underline">
                    {rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="text-white/80">© Edna &amp; Célia Salgados</p>
        </div>
      </div>
    </footer>
  );
}
