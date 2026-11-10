import TelaConfiguracoes from "@/components/admin/consulta/TelaConfiguracoes";

export const metadata = { title: "Configurações" };

// Tela que depende do login no navegador: fora da validação de navegação instantânea (ver admin/layout.js).
export const instant = false;

export default function Page() {
  return <TelaConfiguracoes />;
}
