import { Suspense } from "react";
import LoginAdmin from "@/components/admin/LoginAdmin";

export const metadata = { title: "Entrar" };

// Tela que depende do login no navegador: fora da validação de navegação instantânea (ver admin/layout.js).
export const instant = false;

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginAdmin />
    </Suspense>
  );
}
