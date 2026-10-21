import { Figtree, Young_Serif } from "next/font/google";
import { ClienteProvider } from "@/components/cliente/ClienteProvider";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Sacola from "@/components/sacola/Sacola";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const youngSerif = Young_Serif({
  variable: "--font-young-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata = {
  title: {
    default: "Edna & Célia Salgados",
    template: "%s · Edna & Célia Salgados",
  },
  description: "Cardápio e pedidos de salgados, kits para festa e refrigerantes.",
};

export const viewport = {
  themeColor: "#d0121b",
  colorScheme: "only light",
  viewportFit: "cover",
  // Tela fixa: sem zoom de pinça nem zoom automático ao focar campos
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${figtree.variable} ${youngSerif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ClienteProvider>
          <Header />
          <main className="mx-auto w-full max-w-2xl flex-1 px-3 pb-10">{children}</main>
          <Footer />
          <Sacola />
        </ClienteProvider>
      </body>
    </html>
  );
}
