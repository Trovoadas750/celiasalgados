"use client";

import { AdminProvider } from "./AdminProvider";
import { BarraInferior, MenuLateral } from "./Navegacao";
import { TempoRealProvider } from "./TempoReal";
import { ToastProvider } from "./Toasts";
import Topo from "./Topo";

/** Casca do painel: proteção de acesso, avisos, tempo real, topo e menus. */
export default function PainelAdmin({ children }) {
  return (
    <AdminProvider>
      <ToastProvider>
        <TempoRealProvider>
          <MenuLateral />
          <div className="lg:pl-60 print:!pl-0">
            <Topo />
            <main className="px-3 pb-28 pt-4 lg:px-6 lg:pb-10 print:!p-0">{children}</main>
          </div>
          <BarraInferior />
        </TempoRealProvider>
      </ToastProvider>
    </AdminProvider>
  );
}
