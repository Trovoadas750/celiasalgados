import { Suspense } from "react";
import TelaClientes from "@/components/admin/clientes/TelaClientes";

export const metadata = { title: "Clientes" };

// Tela que depende do login no navegador: fora da validação de navegação instantânea (ver admin/layout.js).
export const instant = false;

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TelaClientes />
    </Suspense>
  );
}
