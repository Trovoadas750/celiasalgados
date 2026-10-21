"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AvisoConta from "@/components/cliente/AvisoConta";
import Campo, { AlertaErro } from "@/components/cliente/Campo";
import { useCliente } from "@/components/cliente/ClienteProvider";
import { CLASSE_BOTAO_PRINCIPAL, CLASSE_BOTAO_SECUNDARIO } from "@/components/cliente/estilos";
import { IconeCracha } from "@/components/icones";
import CardPedido, { CarregandoLista } from "@/components/pedidos/CardPedido";
import { useMeusPedidos } from "@/components/pedidos/useMeusPedidos";
import { formatarTelefone } from "@/lib/formatar";
import { temErros, validar } from "@/lib/validacao";

function FormNome({ dados, atualizarNome }) {
  const [valores, setValores] = useState({ nome: dados.nome, sobrenome: dados.sobrenome });
  const [erros, setErros] = useState({});
  const [aviso, setAviso] = useState(null);
  const [erroGeral, setErroGeral] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const mudou = valores.nome.trim() !== dados.nome || valores.sobrenome.trim() !== dados.sobrenome;

  async function salvar(e) {
    e.preventDefault();
    if (salvando) return;
    const novos = validar(valores, ["nome", "sobrenome"]);
    setErros(novos);
    setAviso(null);
    setErroGeral(null);
    if (temErros(novos)) return;
    setSalvando(true);
    const { erro } = await atualizarNome(valores);
    setSalvando(false);
    if (erro) setErroGeral(erro);
    else setAviso("Dados salvos.");
  }

  return (
    <form onSubmit={salvar} noValidate className="space-y-3 p-4">
      <div className="grid gap-3 min-[420px]:grid-cols-2">
        <Campo
          rotulo="Nome"
          autoComplete="given-name"
          maxLength={60}
          value={valores.nome}
          onChange={(e) => setValores({ ...valores, nome: e.target.value })}
          erro={erros.nome}
        />
        <Campo
          rotulo="Sobrenome"
          autoComplete="family-name"
          maxLength={80}
          value={valores.sobrenome}
          onChange={(e) => setValores({ ...valores, sobrenome: e.target.value })}
          erro={erros.sobrenome}
        />
      </div>
      <Campo
        rotulo="Celular"
        value={formatarTelefone(dados.telefone)}
        readOnly
        disabled
        dica="O celular é o seu login e não pode ser alterado."
      />
      <AlertaErro>{erroGeral}</AlertaErro>
      {aviso && (
        <p role="status" className="rounded-xl bg-emerald-100 px-3 py-2.5 text-sm font-medium text-emerald-800">
          {aviso}
        </p>
      )}
      <button type="submit" disabled={salvando || !mudou} className={CLASSE_BOTAO_PRINCIPAL}>
        {salvando ? "Salvando…" : "Salvar alterações"}
      </button>
    </form>
  );
}

export default function MinhaConta() {
  const router = useRouter();
  const { estado, dados, usuarioId, atualizarNome, sair } = useCliente();
  const { pedidos, erro, carregando } = useMeusPedidos(estado === "logado" ? usuarioId : null, 3);
  const [saindo, setSaindo] = useState(false);

  if (estado === "carregando") {
    return (
      <div className="pt-5">
        <div className="mb-5 h-9 w-48 animate-pulse rounded-lg bg-sepia/60" />
        <CarregandoLista linhas={2} />
      </div>
    );
  }

  if (estado !== "logado") {
    return (
      <AvisoConta
        Icone={IconeCracha}
        titulo="Seu perfil"
        texto="Só é possível ter um perfil criando uma conta. Com ela, seus dados ficam salvos e você acompanha todos os seus pedidos."
        volta="/perfil"
      />
    );
  }

  async function sairDaConta() {
    setSaindo(true);
    await sair();
    router.replace("/");
  }

  const iniciais = `${dados.nome[0] ?? ""}${dados.sobrenome[0] ?? ""}`.toUpperCase();

  return (
    <div className="pt-5">
      <h1 className="font-titulo text-[28px] text-vermelho">Minha conta</h1>

      <section className="mt-4 overflow-hidden rounded-2xl bg-cartao ring-1 ring-borda">
        <div className="capa h-16" />
        <div className="-mt-8 flex items-end gap-3 px-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-vermelho font-titulo text-xl text-white ring-4 ring-cartao">
            {iniciais}
          </span>
          <div className="min-w-0 pb-1">
            <p className="truncate text-lg font-bold">
              {dados.nome} {dados.sobrenome}
            </p>
            <p className="text-sm tabular-nums text-tinta/70">{formatarTelefone(dados.telefone)}</p>
          </div>
        </div>
        {/* key: se o nome mudar em outra aba/sessão, o formulário reinicia com os dados novos */}
        <FormNome key={`${dados.nome}|${dados.sobrenome}`} dados={dados} atualizarNome={atualizarNome} />
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-titulo text-[22px] text-vermelho">Últimos pedidos</h2>
          <Link href="/pedidos" className="text-sm font-semibold text-vermelho underline-offset-4 hover:underline">
            Ver todos
          </Link>
        </div>
        {carregando ? (
          <CarregandoLista linhas={2} />
        ) : erro ? (
          <AlertaErro>{erro}</AlertaErro>
        ) : pedidos.length === 0 ? (
          <p className="rounded-2xl bg-cartao px-4 py-6 text-center text-sm text-tinta/70 ring-1 ring-borda">
            Nenhum pedido feito com esta conta ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {pedidos.map((pedido) => (
              <CardPedido key={pedido.id} pedido={pedido} />
            ))}
          </div>
        )}
      </section>

      <button type="button" onClick={sairDaConta} disabled={saindo} className={`${CLASSE_BOTAO_SECUNDARIO} mt-6`}>
        {saindo ? "Saindo…" : "Sair da conta"}
      </button>
    </div>
  );
}
