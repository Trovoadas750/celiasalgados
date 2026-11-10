import { Suspense } from "react";
import TelaRelatorios from "@/components/admin/relatorios/TelaRelatorios";

export const metadata = { title: "Relatórios" };

// Tela que depende do login no navegador: fora da validação de navegação instantânea (ver admin/layout.js).
export const instant = false;

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TelaRelatorios />
    </Suspense>
  );
}
