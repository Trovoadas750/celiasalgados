import { Suspense } from "react";
import TelaPagamentos from "@/components/admin/TelaPagamentos";

export const metadata = { title: "Pagamentos" };

// Tela que depende do login no navegador: fora da validação de navegação instantânea (ver admin/layout.js).
export const instant = false;

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TelaPagamentos />
    </Suspense>
  );
}
