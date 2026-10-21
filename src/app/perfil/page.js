import { IconeCracha } from "@/components/icones";
import { formatarTelefone } from "@/lib/formatar";
import { CLIENTE } from "@/lib/mock";

export const metadata = { title: "Perfil" };

export default function PerfilPage() {
  const { nome, sobrenome, telefone } = CLIENTE;
  const iniciais = `${nome[0]}${sobrenome[0]}`;

  return (
    <div className="pt-5">
      <h1 className="font-titulo text-[28px] text-vermelho">Meu perfil</h1>

      <section className="mt-4 overflow-hidden rounded-2xl bg-cartao ring-1 ring-borda">
        <div className="capa flex h-20 items-end px-4" />
        <div className="-mt-9 px-4 pb-4">
          <span className="grid size-[72px] place-items-center rounded-full bg-vermelho font-titulo text-2xl text-white ring-4 ring-cartao">
            {iniciais}
          </span>
          <p className="mt-2 text-lg font-bold">
            {nome} {sobrenome}
          </p>
          <p className="flex items-center gap-1 text-sm text-tinta/70">
            <IconeCracha className="size-4" /> Cliente
          </p>
        </div>

        <dl className="divide-y divide-borda border-t border-borda text-sm">
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-tinta/70">Nome</dt>
            <dd className="text-right font-semibold">
              {nome} {sobrenome}
            </dd>
          </div>
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-tinta/70">Celular</dt>
            <dd className="font-semibold tabular-nums">{formatarTelefone(telefone)}</dd>
          </div>
        </dl>
      </section>

      <button
        type="button"
        className="mt-4 h-12 w-full rounded-xl text-sm font-semibold text-vermelho ring-1 ring-vermelho/25"
      >
        Sair da conta
      </button>
    </div>
  );
}
