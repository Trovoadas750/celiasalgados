// Painel da loja. Fora do site público: sem cabeçalho, sacola ou link a partir do site,
// e nunca indexado por buscadores.
export const metadata = {
  title: { default: "Painel", template: "%s · Painel" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

// O painel só aparece depois de conferir o login no navegador (AdminProvider): fica fora da
// validação de "navegação instantânea" do Next (partialPrefetching). Docs: route-segment-config/instant.
export const instant = false;

export default function AdminLayout({ children }) {
  return <div className="min-h-dvh bg-fundo text-texto">{children}</div>;
}
