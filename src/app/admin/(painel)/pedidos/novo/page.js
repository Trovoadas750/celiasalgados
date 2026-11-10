import { Suspense } from "react";
import NovoPedido from "@/components/admin/novo/NovoPedido";

export const metadata = { title: "Novo pedido" };

// Tela que depende do login no navegador: fora da validação de navegação instantânea (ver admin/layout.js).
export const instant = false;

export default function Page() {
  return (
    <Suspense fallback={null}>
      <NovoPedido />
    </Suspense>
  );
}
