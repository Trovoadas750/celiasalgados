import { IconeFloco, IconePronto } from "@/components/icones";

const MODOS = [
  { id: "congelado", Icone: IconeFloco, titulo: "Congelado", texto: "você frita em casa" },
  { id: "pronto", Icone: IconePronto, titulo: "Pronto para comer", texto: "entregamos fritos/assados" },
];

// Explica as duas opções que o cliente escolhe ao montar cada pacote.
export default function ModosPacote() {
  return (
    <section aria-labelledby="titulo-modos" className="pt-6">
      <h2 id="titulo-modos" className="text-sm font-bold uppercase tracking-wide text-texto-suave">
        Ao montar, você escolhe
      </h2>
      <ul className="mt-2 grid grid-cols-2 gap-3">
        {MODOS.map(({ id, Icone, titulo, texto }) => (
          <li key={id} className="flex flex-col gap-2 rounded-2xl bg-superficie p-3 ring-1 ring-borda-suave">
            <span className="grid size-10 place-items-center rounded-full bg-fundo text-cobre">
              <Icone className="size-6" />
            </span>
            <p className="text-sm leading-snug text-texto">
              <strong className="block text-[15px]">{titulo}:</strong>
              {texto}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
