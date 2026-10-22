import Image from "next/image";
import { IconeWhatsapp } from "@/components/icones";
import StatusLoja from "@/components/StatusLoja";
import { LOJA } from "@/lib/loja";

const MENSAGEM = "Olá! Gostaria de fazer um pedido de salgados.";
const LINK_PEDIDO = `${LOJA.whatsapp.link}?text=${encodeURIComponent(MENSAGEM)}`;

// Coração com um "rabisco", como no layout de referência.
function Coracao({ className }) {
  return (
    <svg
      viewBox="0 0 40 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M14 26S4 19.5 4 12a5.5 5.5 0 0 1 10-3.2A5.5 5.5 0 0 1 24 12c0 7.5-10 14-10 14z" />
      <path d="M22 24c5-2 10-6 15-12" />
    </svg>
  );
}

/**
 * Banner da página inicial (referência: layout com texto à esquerda e travessa à direita).
 * - Celular/tablet (até 1023px): foto inteira numa faixa 3:1 no topo; embaixo,
 *   só a logo (metade sobre a foto) e o parágrafo, no fundo do
 *   próprio site. O título fica só para leitores de tela; sem botão nem "Salgados de festa".
 * - Desktop (1024px+): ~2.75:1, texto alinhado à esquerda numa coluna de ~35vw; os tamanhos
 *   usam vw para o conteúdo crescer junto com a altura do banner. A foto fica alinhada à
 *   esquerda, o que empurra a travessa para a direita da coluna de texto.
 * Gradiente do desktop em globals.css (.banner-sombra).
 */
export default function BannerInicio() {
  return (
    <section
      aria-labelledby="titulo-banner"
      className="fundo-escuro relative mx-[calc(50%-50vw)] flex w-screen flex-col lg:min-h-[36vw] lg:bg-cafe lg:justify-center lg:py-[2vw]"
    >
      {/* Celular: faixa 3:1 no topo. Desktop: fundo do banner inteiro (absolute). */}
      <div className="relative aspect-[3/1] w-full lg:absolute lg:inset-0 lg:aspect-auto">
        <Image
          src="/banner.png"
          alt=""
          fill
          preload
          sizes="100vw"
          className="object-cover lg:object-left"
        />
      </div>
      <div
        aria-hidden="true"
        className="banner-sombra absolute inset-0 hidden lg:block"
      />

      <div className="relative flex flex-col max-lg:px-4 max-lg:pb-2 lg:w-[36vw] lg:items-start lg:pl-[5vw] lg:text-left lg:[box-sizing:content-box]">
        {/* Logo + "Salgados de festa". Celular: logo à esquerda, metade sobre a foto (sem a linha "Salgados de festa"). */}
        <div className="flex flex-col items-center max-lg:-mt-12 max-lg:items-start">
          {/* Celular: status da loja ao lado da logo (clique = horários da semana). Desktop: só a logo. */}
          <div className="flex items-end gap-3">
            <div className="relative shrink-0">
              {/* Só no celular: halo alaranjado (--laranja) que desfoca a foto em volta da logo, sumindo nas bordas */}
              <span
                aria-hidden="true"
                className="absolute -inset-6 rounded-full bg-[rgba(254,145,78,0.35)] backdrop-blur-lg [mask-image:radial-gradient(circle,#000_55%,transparent_72%)] lg:hidden"
              />
              <Image
                src="/logo.webp"
                alt="Edna & Célia Salgados"
                width={500}
                height={500}
                className="relative h-auto w-24 drop-shadow-lg lg:w-[max(96px,8vw)]"
              />
            </div>
            <StatusLoja className="-mb-2.5 lg:hidden" />
          </div>
          <p className="mt-2 flex items-center gap-3 max-lg:hidden text-[13px] font-semibold uppercase tracking-[0.3em] text-creme lg:text-[max(12px,0.95vw)]">
            <span
              aria-hidden="true"
              className="h-px w-8 bg-laranja lg:w-[3vw]"
            />
            Salgados de festa
            <span
              aria-hidden="true"
              className="h-px w-8 bg-laranja lg:w-[3vw]"
            />
          </p>
        </div>

        <h1
          id="titulo-banner"
          className="relative mt-3 w-fit max-lg:sr-only pr-[0.9em] lg:mt-[0.8vw]"
        >
          <span className="block font-banner text-[clamp(1.75rem,1rem+2.6vw,2.5rem)] font-bold leading-[1.12] text-creme lg:text-[2.9vw]">
            Sabor, qualidade e<br />
            muito mais para o seu
          </span>
          <span className="block font-manuscrita text-[clamp(2.4rem,1.6rem+3.4vw,3.5rem)] font-bold leading-[1.05] text-laranja lg:-mt-[0.2vw] lg:text-[4.7vw]">
            momento especial!
          </span>
          <Coracao className="absolute right-0 top-[0.1em] w-[1.6em] text-laranja lg:w-[3vw]" />
        </h1>

        {/* Traço que afina para a direita, embaixo do título */}
        <span
          aria-hidden="true"
          className="mt-2 block h-0.5 w-[85%] rounded-full max-lg:hidden bg-gradient-to-r from-laranja via-laranja to-transparent lg:mt-[0.6vw] lg:w-[30vw]"
        />

        <p className="mt-3 max-w-md text-base leading-relaxed text-texto-suave lg:mt-[1vw] lg:text-creme lg:max-w-[30vw] lg:text-[max(15px,1.2vw)] lg:leading-snug">
          Salgadinhos fresquinhos, feitos com carinho para deixar sua festa
          ainda mais gostosa!
        </p>

        <a
          href={LINK_PEDIDO}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Fazer pedido pelo WhatsApp (abre em nova aba)"
          className="mt-6 inline-flex min-h-13 max-lg:hidden items-center gap-3 rounded-full border border-laranja bg-vinho px-5 py-3 text-left font-banner font-bold leading-tight text-white shadow-lg transition hover:bg-ferrugem-hover active:scale-[0.98] lg:mt-[1.6vw] lg:min-h-[max(48px,3.4vw)] lg:gap-[1vw] lg:px-[1.8vw] lg:text-[max(15px,1.2vw)]"
        >
          <IconeWhatsapp className="size-6 shrink-0 lg:size-[max(24px,1.9vw)]" />
          <span
            aria-hidden="true"
            className="h-6 w-px shrink-0 bg-laranja lg:h-[max(24px,1.9vw)]"
          />
          <span>Faça seu pedido pelo WhatsApp</span>
          <span aria-hidden="true" className="text-xl leading-none">
            ›
          </span>
        </a>

        {/* Desktop: status da loja abaixo do botão (o do celular fica ao lado da logo) */}
        <StatusLoja sobreEscuro className="mt-[1.2vw] hidden lg:flex" />
      </div>
    </section>
  );
}
