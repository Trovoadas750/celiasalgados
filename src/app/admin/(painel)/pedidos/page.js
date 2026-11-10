import { Suspense } from "react";
import PaginaPedidos from "@/components/admin/pedidos/PaginaPedidos";

export const metadata = { title: "Pedidos" };

// Tela que depende do login no navegador: fora da validação de navegação instantânea (ver admin/layout.js).
export const instant = false;

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PaginaPedidos />
    </Suspense>
  );
}
