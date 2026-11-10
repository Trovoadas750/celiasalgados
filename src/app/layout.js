import { Dancing_Script, Figtree, Playfair_Display, Young_Serif } from "next/font/google";
import { COR_CAFE } from "@/lib/cores";
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

// Só no banner da home: título serifado e linha manuscrita.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: "700",
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  weight: "700",
});

export const metadata = {
  title: {
    default: "Edna & Célia Salgados",
    template: "%s · Edna & Célia Salgados",
  },
  description: "Cardápio e pedidos de salgados, kits para festa e refrigerantes.",
};

export const viewport = {
  themeColor: COR_CAFE,
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
    <html lang="pt-BR" className={`${figtree.variable} ${youngSerif.variable} ${playfair.variable} ${dancingScript.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* Site: app/(site)/layout.js · Painel: app/admin/layout.js */}
        {children}
      </body>
    </html>
  );
}
