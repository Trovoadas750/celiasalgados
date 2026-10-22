"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AvisoConta from "@/components/cliente/AvisoConta";
import Campo, { AlertaErro } from "@/components/cliente/Campo";
import { useCliente } from "@/components/cliente/ClienteProvider";
import { CLASSE_BOTAO_PRINCIPAL, CLASSE_BOTAO_SECUNDARIO } from "@/components/cliente/estilos";
import EscolherAvatar from "@/components/cliente/EscolherAvatar";
import { IconeCheck, IconeCracha, IconeLapis } from "@/components/icones";
import CardPedido, { CarregandoLista } from "@/components/pedidos/CardPedido";
import { useMeusPedidos } from "@/components/pedidos/useMeusPedidos";
import { caminhoDoAvatar } from "@/lib/avatar";
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
        <p role="status" className="flex items-center gap-2 rounded-xl bg-sucesso-fundo px-3 py-2.5 text-sm font-medium text-sucesso">
          <IconeCheck className="size-5 shrink-0" />
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
  const { estado, dados, usuarioId, avatar, trocarAvatar, atualizarNome, sair } = useCliente();
  const { pedidos, erro, carregando } = useMeusPedidos(estado === "logado" ? usuarioId : null, 3);
  const [saindo, setSaindo] = useState(false);
  const [trocandoAvatar, setTrocandoAvatar] = useState(false);

  if (estado === "carregando") {
    return (
      <div className="pt-5">
        <div className="mb-5 h-9 w-48 animate-pulse rounded-lg bg-borda-suave" />
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

  return (
    <div className="pt-5">
      <h1 className="traco-vinho font-titulo text-[28px] text-ferrugem">Minha conta</h1>

      <section className="mt-4 overflow-hidden rounded-2xl bg-superficie ring-1 ring-borda-suave">
        <div className="capa h-16" />
        {/* Avatar sobre a capa; nome e celular embaixo, no fundo claro (café sobre creme-claro: 14.90) */}
        <div className="-mt-10 px-4">
          {/* Clicar no avatar abre a grade para escolher outro */}
          <button
            type="button"
            onClick={() => setTrocandoAvatar(!trocandoAvatar)}
            aria-expanded={trocandoAvatar}
            aria-label="Trocar avatar"
            className="relative rounded-full transition hover:scale-[1.03]"
          >
            <Image
              src={caminhoDoAvatar(avatar)}
              alt=""
              width={80}
              height={80}
              unoptimized
              className="size-20 rounded-full ring-4 ring-superficie"
            />
            <span
              aria-hidden="true"
              className="absolute -bottom-0.5 -right-0.5 grid size-7 place-items-center rounded-full bg-ferrugem text-white ring-2 ring-superficie"
            >
              <IconeLapis className="size-4" />
            </span>
          </button>
          <p className="mt-2 truncate text-xl font-bold text-texto">
            {dados.nome} {dados.sobrenome}
          </p>
          <p className="text-sm tabular-nums text-texto-suave">{formatarTelefone(dados.telefone)}</p>
          {!trocandoAvatar && (
            <button
              type="button"
              onClick={() => setTrocandoAvatar(true)}
              className="mt-1 text-sm font-semibold text-link underline underline-offset-4 hover:text-ferrugem-ativo"
            >
              Trocar avatar
            </button>
          )}
        </div>
        {trocandoAvatar && (
          <EscolherAvatar atual={avatar} trocarAvatar={trocarAvatar} aoFechar={() => setTrocandoAvatar(false)} />
        )}
        {/* key: se o nome mudar em outra aba/sessão, o formulário reinicia com os dados novos */}
        <FormNome key={`${dados.nome}|${dados.sobrenome}`} dados={dados} atualizarNome={atualizarNome} />
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="traco-vinho font-titulo text-[22px] text-ferrugem-hover">Últimos pedidos</h2>
          <Link href="/pedidos" className="text-sm text-link underline underline-offset-4 hover:text-ferrugem-ativo">
            Ver todos
          </Link>
        </div>
        {carregando ? (
          <CarregandoLista linhas={2} />
        ) : erro ? (
          <AlertaErro>{erro}</AlertaErro>
        ) : pedidos.length === 0 ? (
          <p className="rounded-2xl bg-superficie px-4 py-6 text-center text-sm text-texto-suave ring-1 ring-borda-suave">
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
