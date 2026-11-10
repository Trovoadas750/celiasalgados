import { Suspense } from "react";
import TelaProducao from "@/components/admin/TelaProducao";

export const metadata = { title: "Produção" };

// Tela que depende do login no navegador: fora da validação de navegação instantânea (ver admin/layout.js).
export const instant = false;

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TelaProducao />
    </Suspense>
  );
}
