import { CardPacote } from "./CardProduto";

// "Escolha seu pacote": lista vertical de cards (30, 50 e Cento). O preço é o BASE (fritos),
// por isso "A partir de": o valor final vem do banco (calcular_pedido) na montagem.
export default function SecaoPacotes({ pacotes }) {
  return (
    <section id="pacotes" aria-labelledby="titulo-pacotes" className="scroll-mt-20 pt-6">
      <h2 id="titulo-pacotes" className="traco-vinho font-titulo text-[24px] leading-tight text-ferrugem">
        Monte do seu jeito
      </h2>
      <p className="mt-1 text-sm text-texto-suave">Os salgados são vendidos em pacotes. Você escolhe as qualidades.</p>

      {pacotes.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-superficie px-4 py-6 text-center text-texto-suave ring-1 ring-borda-suave">
          Nenhum pacote disponível no momento.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-borda-suave overflow-hidden rounded-2xl ring-1 ring-borda-suave">
          {pacotes.map((pacote) => (
            <li key={pacote.id}>
              <CardPacote pacote={pacote} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
