import { Suspense } from "react";
import TelaHoje from "@/components/admin/TelaHoje";

export const metadata = { title: "Hoje" };

// Tela que depende do login no navegador: fora da validação de navegação instantânea (ver admin/layout.js).
export const instant = false;

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TelaHoje />
    </Suspense>
  );
}
