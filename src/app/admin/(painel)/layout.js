import PainelAdmin from "@/components/admin/PainelAdmin";

// Telas com menu, topo e tempo real. Exigem sessão de admin (components/admin/AdminProvider).
// Tela que depende do login no navegador: fora da validação de navegação instantânea (ver admin/layout.js).
export const instant = false;

export default function PainelLayout({ children }) {
  return <PainelAdmin>{children}</PainelAdmin>;
}
