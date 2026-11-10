import TelaHorarios from "@/components/admin/consulta/TelaHorarios";

export const metadata = { title: "Horários" };

// Tela que depende do login no navegador: fora da validação de navegação instantânea (ver admin/layout.js).
export const instant = false;

export default function Page() {
  return <TelaHorarios />;
}
