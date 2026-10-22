import { IconeMotoboy } from "@/components/icones";
import ModosPacote from "./ModosPacote";
import MontadorPacote from "./MontadorPacote";
import SecaoBebidas from "./SecaoBebidas";
import SecaoPacotes from "./SecaoPacotes";

const ATALHOS = [
  { href: "#pacotes", rotulo: "Pacotes" },
  { href: "#bebidas", rotulo: "Bebidas" },
];

export function AvisoEntrega() {
  return (
    <p className="mt-4 flex items-start gap-2.5 rounded-xl bg-info-fundo px-3 py-2.5 text-sm font-medium text-info">
      <IconeMotoboy className="mt-0.5 size-5 shrink-0" />
      <span>Entregamos até 1 cento (100 salgados) por pedido. Acima disso, retirada no local.</span>
    </p>
  );
}

function Atalhos() {
  return (
    <nav aria-label="Seções do cardápio" className="mt-4">
      <ul className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
        {ATALHOS.map(({ href, rotulo }) => (
          <li key={href}>
            <a
              href={href}
              className="block rounded-full bg-superficie px-4 py-2 text-sm font-semibold text-texto ring-1 ring-borda-suave transition hover:ring-borda-input"
            >
              {rotulo}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Cardápio montado a partir de `listarCardapio()` (lib/cardapio.js).
export default function Cardapio({ cardapio }) {
  const { pacotes, sabores, refrigerantes } = cardapio;
  const totalSabores = sabores.frito.length + sabores.assado.length + sabores.variado.length;

  if (pacotes.length === 0 && totalSabores === 0 && refrigerantes.length === 0) {
    return (
      <div className="mt-6 rounded-2xl bg-superficie px-4 py-10 text-center ring-1 ring-borda-suave">
        <p className="font-semibold text-texto">O cardápio está vazio no momento.</p>
        <p className="mt-1 text-sm text-texto-suave">Volte mais tarde ou fale com a gente pelo WhatsApp.</p>
      </div>
    );
  }

  return (
    <>
      <AvisoEntrega />
      <Atalhos />
       <ModosPacote />
      <SecaoPacotes pacotes={pacotes} />
     
      <SecaoBebidas refrigerantes={refrigerantes} />
      <MontadorPacote pacotes={pacotes} sabores={sabores} />
    </>
  );
}
