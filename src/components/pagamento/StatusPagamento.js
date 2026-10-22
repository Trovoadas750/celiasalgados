import { IconeAlerta, IconeAmpulheta, IconeCheck } from "@/components/icones";
import { formatarDiaMes, formatarHora, mesmoDiaEmBrasilia } from "@/lib/formatar";

// Status de pagamento do agendamento: selo com ícone + texto (nunca só cor). design-cores.md, seção 2.
//   pendente → aviso (6.96) · pago → sucesso (5.42) · expirado → erro (6.43) · nao_exigido → nada
const ESTILOS = {
  pendente: { Icone: IconeAmpulheta, classe: "bg-aviso-fundo text-aviso-texto", rotulo: "Aguardando pagamento" },
  pago: { Icone: IconeCheck, classe: "bg-sucesso-fundo text-sucesso", rotulo: "Agendamento confirmado" },
  expirado: { Icone: IconeAlerta, classe: "bg-erro-fundo text-erro", rotulo: "Cancelado: pagamento não realizado no prazo" },
};

/**
 * Pendente com o prazo já vencido conta como expirado na tela (o banco expira sozinho no
 * próximo pedido ou quando o admin abre o painel).
 */
export function statusEfetivo(status, expiraEm, agora = Date.now()) {
  if (status === "pendente" && expiraEm && new Date(expiraEm).getTime() <= agora) return "expirado";
  return status;
}

/** "pague até 21:37" (ou "pague até 23/10 às 21:37" se não for hoje) */
export function textoPrazo(expiraEm, agora = Date.now()) {
  const hora = formatarHora(expiraEm);
  return mesmoDiaEmBrasilia(expiraEm, agora) ? `pague até ${hora}` : `pague até ${formatarDiaMes(expiraEm)} às ${hora}`;
}

export default function StatusPagamento({ status, expiraEm, className = "" }) {
  const efetivo = statusEfetivo(status, expiraEm);
  const estilo = ESTILOS[efetivo];
  if (!estilo) return null; // nao_exigido: pedido "agora", paga na entrega/retirada
  const { Icone, classe, rotulo } = estilo;
  return (
    <p className={`flex items-start gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${classe} ${className}`}>
      <Icone className="mt-px size-5 shrink-0" />
      <span>
        {rotulo}
        {efetivo === "pendente" && expiraEm && <span className="font-medium"> · {textoPrazo(expiraEm)}</span>}
      </span>
    </p>
  );
}
