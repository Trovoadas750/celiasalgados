import TelaCardapio from "@/components/admin/consulta/TelaCardapio";

export const metadata = { title: "Cardápio" };

// Tela que depende do login no navegador: fora da validação de navegação instantânea (ver admin/layout.js).
export const instant = false;

export default function Page() {
  return <TelaCardapio />;
}
