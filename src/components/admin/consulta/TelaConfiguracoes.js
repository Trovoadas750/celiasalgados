"use client";

import { useEffect, useState } from "react";
import { AlertaErro } from "@/components/cliente/Campo";
import { IconeCheck } from "@/components/icones";
import { definirSom, pedirNotificacao, permissaoNotificacao, somLigado, tocarSom } from "@/lib/admin/alertas";
import { definirTempoPreparo, TEMPO_PREPARO_PADRAO, tempoPreparoMin } from "@/lib/admin/config";
import { alterarMinhaSenha, buscarConfigLoja, listarAdmins } from "@/lib/admin/loja";
import { formatarDataHora } from "@/lib/formatar";
import { useAdmin } from "../AdminProvider";
import { CLASSE_BOTAO_CONTORNO, CLASSE_BOTAO_PRINCIPAL, CLASSE_CAMPO } from "../estilos";
import { IconeOlho, IconeOlhoFechado, IconeSino, IconeSom, IconeSomMudo } from "../icones";
import { useToast } from "../Toasts";
import { AvisoSoConsulta, Bloco, Carregando } from "./Comum";

function DadosDaLoja() {
  const [loja, setLoja] = useState({ carregado: false, dados: null, erro: null });
  useEffect(() => {
    buscarConfigLoja()
      .then((dados) => setLoja({ carregado: true, dados, erro: null }))
      .catch((e) => setLoja({ carregado: true, dados: null, erro: e.message }));
  }, []);
  const d = loja.dados;
  const cep = d ? String(d.cep ?? "").replace(/^(\d{5})(\d{3})$/, "$1-$2") : "";
  return (
    <Bloco titulo="Dados da loja">
      {loja.erro ? (
        <AlertaErro>{loja.erro}</AlertaErro>
      ) : !loja.carregado ? (
        <Carregando altura="h-20" />
      ) : d ? (
        <>
          <p className="text-[16px] font-semibold">{d.endereco}</p>
          <p>
            {d.cidade}-{d.uf} · CEP {cep}
          </p>
          <AvisoSoConsulta assunto="endereço e dados da loja (aparecem na retirada)" />
        </>
      ) : (
        <p className="text-texto-suave">Sem dados cadastrados.</p>
      )}
    </Bloco>
  );
}

function TempoPreparo() {
  const { mostrar } = useToast();
  const [valor, setValor] = useState(() => String(tempoPreparoMin()));
  const [erro, setErro] = useState(null);
  function salvar(e) {
    e.preventDefault();
    try {
      const n = definirTempoPreparo(valor);
      setValor(String(n));
      setErro(null);
      mostrar({ texto: `Tempo de preparo: ${n} min. Vale para as telas abertas a partir de agora.` });
    } catch (falha) {
      setErro(falha.message);
    }
  }
  return (
    <Bloco titulo="Tempo de preparo padrão">
      <form onSubmit={salvar} className="space-y-3">
        <p className="text-sm text-texto-suave">
          Hora-alvo dos pedidos &quot;o quanto antes&quot; = hora do pedido + este tempo. Usado em &quot;Para sair agora&quot;, &quot;Atrasados&quot; e nos
          avisos de urgência. Fica salvo neste aparelho (padrão {TEMPO_PREPARO_PADRAO} min).
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Minutos</span>
            <input type="number" inputMode="numeric" min={5} max={240} value={valor} onChange={(e) => setValor(e.target.value)} className={`${CLASSE_CAMPO} w-32`} />
          </label>
          <button type="submit" className={`${CLASSE_BOTAO_PRINCIPAL} w-auto`}>
            Salvar
          </button>
        </div>
        <AlertaErro>{erro}</AlertaErro>
      </form>
    </Bloco>
  );
}

function SomENotificacoes() {
  const { mostrar } = useToast();
  const [ligado, setLigado] = useState(somLigado);
  const [permissao, setPermissao] = useState(permissaoNotificacao);
  const textoPermissao = {
    granted: "Ativadas neste navegador.",
    denied: "Bloqueadas. Libere nas configurações do navegador (cadeado ao lado do endereço).",
    default: "Ainda não ativadas.",
    indisponivel: "Este navegador não tem notificações.",
  }[permissao];

  return (
    <Bloco titulo="Som e notificações de pedido novo">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={ligado}
            onClick={async () => {
              const tocou = await definirSom(!ligado);
              setLigado(!ligado);
              if (!ligado && !tocou) mostrar({ tipo: "aviso", texto: "O navegador bloqueou o som. Toque de novo." });
            }}
            className={CLASSE_BOTAO_CONTORNO}
          >
            {ligado ? <IconeSom className="size-5" /> : <IconeSomMudo className="size-5" />}
            {ligado ? "Som ligado (desligar)" : "Ligar som"}
          </button>
          <button
            type="button"
            onClick={async () => (await tocarSom()) || mostrar({ tipo: "aviso", texto: "O navegador bloqueou o som. Toque de novo." })}
            className={CLASSE_BOTAO_CONTORNO}
          >
            Testar som
          </button>
        </div>
        <div>
          <p className="flex items-center gap-2 font-semibold">
            <IconeSino className="size-5" /> Notificações: <span className="font-normal">{textoPermissao}</span>
          </p>
          {permissao === "default" && (
            <button type="button" onClick={async () => setPermissao(await pedirNotificacao())} className={`${CLASSE_BOTAO_CONTORNO} mt-2`}>
              Ativar notificações
            </button>
          )}
        </div>
        <p className="text-sm text-texto-suave">Valem para este aparelho. No celular, deixe o painel aberto para receber os avisos.</p>
      </div>
    </Bloco>
  );
}

function CampoSenha({ rotulo, valor, aoMudar, autoComplete }) {
  const [ver, setVer] = useState(false);
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{rotulo}</span>
      <span className="relative block">
        <input type={ver ? "text" : "password"} autoComplete={autoComplete} value={valor} onChange={(e) => aoMudar(e.target.value)} className={`${CLASSE_CAMPO} pr-14`} />
        <button
          type="button"
          onClick={() => setVer((v) => !v)}
          aria-label={ver ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={ver}
          className="absolute inset-y-0 right-1 my-auto grid size-11 place-items-center rounded-lg text-texto-suave hover:text-texto"
        >
          {ver ? <IconeOlhoFechado className="size-5" /> : <IconeOlho className="size-5" />}
        </button>
      </span>
    </label>
  );
}

function MinhaSenha() {
  const { email } = useAdmin();
  const [campos, setCampos] = useState({ atual: "", nova: "", repetir: "" });
  const [estado, setEstado] = useState({ enviando: false, erro: null, ok: false });

  async function salvar(e) {
    e.preventDefault();
    if (!campos.atual) return setEstado({ enviando: false, erro: "Digite a senha atual.", ok: false });
    if (campos.nova.length < 12) return setEstado({ enviando: false, erro: "A senha nova precisa ter pelo menos 12 caracteres.", ok: false });
    if (campos.nova !== campos.repetir) return setEstado({ enviando: false, erro: "A confirmação não bate com a senha nova.", ok: false });
    setEstado({ enviando: true, erro: null, ok: false });
    try {
      await alterarMinhaSenha({ email, atual: campos.atual, nova: campos.nova });
      setCampos({ atual: "", nova: "", repetir: "" });
      setEstado({ enviando: false, erro: null, ok: true });
    } catch (falha) {
      setEstado({ enviando: false, erro: falha.message, ok: false });
    }
  }

  return (
    <Bloco titulo="Alterar minha senha">
      <form onSubmit={salvar} className="max-w-md space-y-3">
        <p className="text-sm text-texto-suave">Conta: {email}. Use 12 ou mais caracteres, misturando letras, números e símbolos.</p>
        <CampoSenha rotulo="Senha atual" valor={campos.atual} aoMudar={(v) => setCampos({ ...campos, atual: v })} autoComplete="current-password" />
        <CampoSenha rotulo="Senha nova" valor={campos.nova} aoMudar={(v) => setCampos({ ...campos, nova: v })} autoComplete="new-password" />
        <CampoSenha rotulo="Repita a senha nova" valor={campos.repetir} aoMudar={(v) => setCampos({ ...campos, repetir: v })} autoComplete="new-password" />
        <AlertaErro>{estado.erro}</AlertaErro>
        {estado.ok && (
          <p role="status" className="flex items-center gap-2 rounded-xl bg-sucesso-fundo px-3 py-2.5 font-semibold text-sucesso">
            <IconeCheck className="size-5" /> Senha alterada.
          </p>
        )}
        <button type="submit" disabled={estado.enviando} className={CLASSE_BOTAO_PRINCIPAL}>
          {estado.enviando ? "Salvando…" : "Trocar minha senha"}
        </button>
      </form>
    </Bloco>
  );
}

function Administradores() {
  const { sessaoExpirou } = useAdmin();
  const [dados, setDados] = useState({ carregado: false, admins: [], erro: null });
  useEffect(() => {
    listarAdmins()
      .then((admins) => setDados({ carregado: true, admins, erro: null }))
      .catch((e) => {
        if (e.sessaoExpirada) sessaoExpirou();
        setDados({ carregado: true, admins: [], erro: e.message });
      });
  }, [sessaoExpirou]);

  return (
    <Bloco titulo="Administradores">
      {dados.erro ? (
        <AlertaErro>{dados.erro}</AlertaErro>
      ) : !dados.carregado ? (
        <Carregando altura="h-20" />
      ) : (
        <ul className="divide-y divide-borda-suave">
          {dados.admins.map((a) => (
            <li key={a.email} className="py-2.5">
              <p className="font-semibold">
                {a.email}
                {a.voce && <span className="ml-2 rounded-full bg-vinho px-2 py-0.5 text-xs font-bold text-creme">você</span>}
              </p>
              <p className="text-sm text-texto-suave">
                Admin desde {formatarDataHora(a.criado_em)}
                {a.ultimo_acesso ? ` · último acesso ${formatarDataHora(a.ultimo_acesso)}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-semibold text-link underline underline-offset-4">Como adicionar um administrador</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            No Supabase: <strong>Authentication › Users › Add user › Create new user</strong>, com o e-mail real e uma senha forte. Marque{" "}
            <strong>Auto Confirm User</strong>.
          </li>
          <li>
            No <strong>SQL Editor</strong>, rode (trocando o e-mail):
            <pre className="mt-1 overflow-x-auto rounded-lg bg-fundo p-2 text-xs">
              {`insert into public.admins (user_id)\nselect id from auth.users where email = 'email@exemplo.com'\non conflict do nothing;`}
            </pre>
          </li>
        </ol>
      </details>
    </Bloco>
  );
}

/** /admin/configuracoes: só o que é do painel (aparelho e conta); dados da loja em consulta. */
export default function TelaConfiguracoes() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="traco-vinho font-titulo text-[28px] leading-tight text-ferrugem">Configurações</h1>
      <div className="mt-4 space-y-4">
        <TempoPreparo />
        <SomENotificacoes />
        <MinhaSenha />
        <Administradores />
        <DadosDaLoja />
      </div>
    </div>
  );
}
