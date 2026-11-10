import { Suspense } from "react";
import TelaAgenda from "@/components/admin/TelaAgenda";

export const metadata = { title: "Agenda" };

// Tela que depende do login no navegador: fora da validação de navegação instantânea (ver admin/layout.js).
export const instant = false;

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TelaAgenda />
    </Suspense>
  );
}
