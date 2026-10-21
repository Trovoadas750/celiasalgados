// Moldura comum das páginas de Termos e Privacidade.
export default function PaginaLegal({ titulo, atualizadoEm, children }) {
  return (
    <article className="py-6">
      <h1 className="font-titulo text-[28px] leading-tight text-vermelho">{titulo}</h1>
      <p className="mt-1 text-sm text-tinta/70">Última atualização: {atualizadoEm}</p>
      <div className="mt-5 space-y-5 rounded-2xl bg-cartao p-5 text-[15px] leading-relaxed ring-1 ring-borda [&_h2]:font-titulo [&_h2]:text-lg [&_h2]:text-vermelho [&_li]:ml-5 [&_li]:list-disc [&_p]:mt-1.5">
        {children}
      </div>
    </article>
  );
}
