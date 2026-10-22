import Link from "next/link";
import { CLASSE_BOTAO_PRINCIPAL, CLASSE_BOTAO_SECUNDARIO } from "./estilos";

// Tela mostrada em /pedidos e /perfil para quem não tem conta (visitante ou convidado).
export default function AvisoConta({ Icone, titulo, texto, volta }) {
  const destino = encodeURIComponent(volta);
  return (
    <div className="flex flex-col items-center px-2 pt-12 text-center">
      <span className="grid size-20 place-items-center rounded-full bg-superficie text-cobre ring-1 ring-borda-suave">
        <Icone className="size-10" />
      </span>
      <h1 className="mt-4 font-titulo text-[26px] leading-tight text-ferrugem">{titulo}</h1>
      <p className="mt-2 max-w-sm text-[15px] text-texto-suave">{texto}</p>
      <div className="mt-6 w-full max-w-sm space-y-2">
        <Link href={`/entrar?modo=cadastro&volta=${destino}`} className={CLASSE_BOTAO_PRINCIPAL}>
          Criar conta
        </Link>
        <Link href={`/entrar?volta=${destino}`} className={CLASSE_BOTAO_SECUNDARIO}>
          Já tenho conta
        </Link>
      </div>
    </div>
  );
}
