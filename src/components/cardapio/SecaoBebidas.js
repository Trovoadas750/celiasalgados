import { CardBebida } from "./CardProduto";

// Refrigerantes: mesmo card dos pacotes, sem coluna de imagem, com "Adicionar" direto.
export default function SecaoBebidas({ refrigerantes }) {
  return (
    <section id="bebidas" aria-labelledby="titulo-bebidas" className="scroll-mt-20 pt-8">
      <h2 id="titulo-bebidas" className="traco-vinho font-titulo text-[24px] leading-tight text-ferrugem">
        Bebidas
      </h2>

      {refrigerantes.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-superficie px-4 py-6 text-center text-texto-suave ring-1 ring-borda-suave">
          Nenhuma bebida disponível no momento.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-borda-suave overflow-hidden rounded-2xl ring-1 ring-borda-suave">
          {refrigerantes.map((bebida) => (
            <li key={bebida.id}>
              <CardBebida bebida={bebida} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
