import { AdminProvider } from "@/components/admin/AdminProvider";
import ModoCozinha from "@/components/admin/ModoCozinha";
import { TempoRealProvider } from "@/components/admin/TempoReal";
import { ToastProvider } from "@/components/admin/Toasts";

export const metadata = { title: "Cozinha" };

// Tela que depende do login no navegador: fora da validação de navegação instantânea (ver admin/layout.js).
export const instant = false;

// Tela cheia, sem o menu do painel (tablet/TV na cozinha), mas com tempo real e som.
export default function Page() {
  return (
    <AdminProvider>
      <ToastProvider>
        <TempoRealProvider>
          <ModoCozinha />
        </TempoRealProvider>
      </ToastProvider>
    </AdminProvider>
  );
}
