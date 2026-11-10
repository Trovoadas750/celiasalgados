import TelaFrete from "@/components/admin/consulta/TelaFrete";

export const metadata = { title: "Frete" };

// Tela que depende do login no navegador: fora da validação de navegação instantânea (ver admin/layout.js).
export const instant = false;

export default function Page() {
  return <TelaFrete />;
}
