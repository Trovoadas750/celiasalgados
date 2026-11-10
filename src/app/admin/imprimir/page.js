import { Suspense } from "react";
import { AdminProvider } from "@/components/admin/AdminProvider";
import ImprimirComandas from "@/components/admin/ImprimirComandas";

export const metadata = { title: "Imprimir comandas" };

// Fora da casca do painel (sem menu): só as comandas, prontas para a impressora.
// Tela que depende do login no navegador: fora da validação de navegação instantânea (ver admin/layout.js).
export const instant = false;

export default function Page() {
  return (
    <AdminProvider>
      <Suspense fallback={null}>
        <ImprimirComandas />
      </Suspense>
    </AdminProvider>
  );
}
