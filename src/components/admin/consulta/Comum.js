import { IconeCheck } from "@/components/icones";
import { IconeBloqueio, IconeLivro } from "../icones";

// Peças das telas de consulta (Cardápio, Horários, Frete, Configurações).

/** Aviso fixo: esta tela só mostra; mudanças que o cliente vê são feitas no banco/código. */
export function AvisoSoConsulta({ assunto }) {
  return (
    <p className="mt-3 flex items-start gap-2 rounded-xl bg-info-fundo px-3 py-2.5 text-sm font-semibold text-info">
      <IconeLivro className="mt-px size-5 shrink-0" />
      <span>
        Somente consulta. Mudanças em {assunto} aparecem para os clientes, por isso são feitas direto no banco/código por quem
        cuida do site.
      </span>
    </p>
  );
}

export function SeloAtivo({ ativo }) {
  return ativo ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-sucesso-fundo px-2 py-0.5 text-xs font-bold text-sucesso">
      <IconeCheck className="size-3.5" /> Ativo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-cancelado-fundo px-2 py-0.5 text-xs font-bold text-texto-sec">
      <IconeBloqueio className="size-3.5" /> Desativado
    </span>
  );
}

export function SimNao({ valor }) {
  return valor ? <span className="font-semibold text-sucesso">Sim</span> : <span className="text-texto-suave">Não</span>;
}

export function Bloco({ titulo, children, acao }) {
  return (
    <section className="rounded-2xl bg-superficie p-4 ring-1 ring-borda-suave">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{titulo}</h2>
        {acao}
      </div>
      {children}
    </section>
  );
}

export function Carregando({ altura = "h-48" }) {
  return <div className={`${altura} animate-pulse rounded-2xl bg-borda-suave`} aria-busy="true" aria-label="Carregando" />;
}
