import { ClienteProvider } from "@/components/cliente/ClienteProvider";
import BotaoWhatsapp from "@/components/BotaoWhatsapp";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import LembretePagamento from "@/components/pagamento/LembretePagamento";
import Sacola from "@/components/sacola/Sacola";

// Casca do site público (cardápio, checkout, conta). O painel /admin tem a sua própria.
export default function SiteLayout({ children }) {
  return (
    <ClienteProvider>
      <Header />
      <LembretePagamento />
      <main className="mx-auto w-full max-w-2xl flex-1 px-3 pb-10">{children}</main>
      <Footer />
      <Sacola />
      <BotaoWhatsapp />
    </ClienteProvider>
  );
}
