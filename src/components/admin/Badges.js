import { IconeAlerta, IconeAmpulheta, IconeCheck, IconeFloco, IconeMotoboy, IconePronto, IconeRelogio, IconeRetirada } from "@/components/icones";
import { rotuloPagamento, rotuloStatus } from "@/lib/admin/status";
import { IconeBloqueio, IconeDinheiro, IconePanela, IconeSino } from "./icones";

// Selos do painel: SEMPRE texto + ícone (design-cores.md, seção 5 "Status do pedido").

function Selo({ classe, Icone, children, grande = false }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full font-bold ${grande ? "px-3 py-1.5 text-[15px]" : "px-2.5 py-1 text-sm"} ${classe}`}
    >
      {Icone && <Icone className={grande ? "size-5" : "size-4"} />}
      {children}
    </span>
  );
}

const STATUS = {
  novo: { classe: "bg-laranja text-cafe", Icone: IconeSino },
  em_preparo: { classe: "bg-aviso-fundo text-aviso-texto", Icone: IconePanela },
  saiu_para_entrega: { classe: "bg-info-fundo text-info", Icone: IconeMotoboy },
  entregue: { classe: "bg-sucesso-fundo text-sucesso", Icone: IconeCheck },
  cancelado: { classe: "bg-cancelado-fundo text-texto-sec line-through decoration-1", Icone: IconeBloqueio },
};

export function BadgeStatus({ status, tipo, grande }) {
  const estilo = STATUS[status] ?? STATUS.novo;
  const Icone = status === "saiu_para_entrega" && tipo === "retirada" ? IconeRetirada : estilo.Icone;
  return (
    <Selo classe={estilo.classe} Icone={Icone} grande={grande}>
      {rotuloStatus(status, tipo)}
    </Selo>
  );
}

const PAGAMENTO = {
  // Pendente bem visível: a dona não pode começar a preparar sem perceber.
  pendente: { classe: "bg-aviso-fundo text-aviso-texto ring-2 ring-aviso-texto", Icone: IconeAmpulheta },
  pago: { classe: "bg-sucesso-fundo text-sucesso", Icone: IconeCheck },
  expirado: { classe: "bg-erro-fundo text-erro", Icone: IconeAlerta },
  nao_exigido: { classe: "bg-superficie text-texto-suave ring-1 ring-borda-suave", Icone: IconeDinheiro },
};

export function BadgePagamento({ status, tipo, grande, esconderNaEntrega = false }) {
  if (esconderNaEntrega && status === "nao_exigido") return null;
  const estilo = PAGAMENTO[status];
  const rotulo = rotuloPagamento(status, tipo);
  if (!estilo || !rotulo) return null;
  return (
    <Selo classe={estilo.classe} Icone={estilo.Icone} grande={grande}>
      {rotulo}
    </Selo>
  );
}

/** "Atrasado 15 min" (erro) ou "Em 20 min" (aviso). */
export function BadgeUrgencia({ urgencia, grande }) {
  if (!urgencia) return null;
  const atrasado = urgencia.tipo === "atrasado";
  return (
    <Selo
      classe={atrasado ? "bg-erro-fundo text-erro ring-2 ring-erro" : "bg-aviso-fundo text-aviso-texto"}
      Icone={atrasado ? IconeAlerta : IconeRelogio}
      grande={grande}
    >
      {urgencia.texto}
    </Selo>
  );
}

/** Pedido que chegou e ainda não foi aberto. Selo vinho com texto creme. */
export function BadgeNovo() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-vinho px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-creme">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-laranja" />
      Novo
    </span>
  );
}

/** ENTREGA (preenchido café) × RETIRADA (contorno café): diferença na forma e no texto, não só na cor. */
export function BadgeTipo({ tipo, grande }) {
  const entrega = tipo === "entrega";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg font-bold uppercase tracking-wide ${
        grande ? "px-3 py-1.5 text-[15px]" : "px-2 py-0.5 text-sm"
      } ${entrega ? "bg-cafe text-creme" : "bg-superficie text-cafe ring-2 ring-cafe"}`}
    >
      {entrega ? <IconeMotoboy className={grande ? "size-5" : "size-4"} /> : <IconeRetirada className={grande ? "size-5" : "size-4"} />}
      {entrega ? "Entrega" : "Retirada"}
    </span>
  );
}

/** CONGELADO × PRONTO bem visível no item. */
export function BadgeModo({ modo, grande }) {
  const pronto = modo === "pronto";
  return (
    <Selo classe={pronto ? "bg-aviso-fundo text-aviso-texto" : "bg-info-fundo text-info"} Icone={pronto ? IconePronto : IconeFloco} grande={grande}>
      <span className="uppercase tracking-wide">{pronto ? "Pronto" : "Congelado"}</span>
    </Selo>
  );
}

export function BadgeOrigem({ origem }) {
  if (origem !== "admin") return null;
  return <Selo classe="bg-superficie text-texto-suave ring-1 ring-borda-input">Lançado no painel</Selo>;
}
