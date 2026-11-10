"use client";

import { useEffect, useState } from "react";
import { IconeAlerta, IconeCheck, IconeLupa } from "@/components/icones";
import { ABAS } from "@/lib/admin/pedidos";
import { STATUS_OPCOES } from "@/lib/admin/status";
import { CLASSE_CAMPO, CLASSE_CHIP } from "../estilos";
import { IconeFiltro } from "../icones";

/** Abas rápidas com contador. A ativa: ferrugem preenchida; "Atrasados" com pedido: ícone de alerta. */
export function AbasPedidos({ aba, contagens, aoEscolher }) {
  return (
    <nav aria-label="Abas de pedidos" className="-mx-3 overflow-x-auto px-3 pb-1 lg:mx-0 lg:px-0">
      <ul className="flex gap-2">
        {ABAS.map((a) => {
          const atual = a.id === aba;
          const n = contagens[a.id];
          const alerta = a.id === "atrasados" && n > 0;
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => aoEscolher(a.id)}
                aria-current={atual ? "page" : undefined}
                className={`${CLASSE_CHIP} ${
                  atual
                    ? "bg-ferrugem text-white"
                    : alerta
                      ? "bg-erro-fundo text-erro ring-2 ring-erro"
                      : "bg-superficie text-texto ring-1 ring-borda-input hover:ring-ferrugem"
                }`}
              >
                {alerta && !atual && <IconeAlerta className="size-4" />}
                {a.rotulo}
                {n != null && (
                  <span
                    className={`min-w-6 rounded-full px-1.5 text-center text-xs font-bold tabular-nums ${
                      atual ? "bg-superficie text-ferrugem" : "bg-fundo text-texto"
                    }`}
                  >
                    {n}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Busca por nº, nome ou telefone (espera parar de digitar para atualizar a URL). */
export function BuscaPedidos({ valor, aoMudar, placeholder = "Buscar nº, nome ou telefone" }) {
  const [texto, setTexto] = useState(valor);
  const [anterior, setAnterior] = useState(valor);
  if (valor !== anterior) {
    setAnterior(valor);
    setTexto(valor);
  }

  useEffect(() => {
    if (texto === valor) return;
    const espera = setTimeout(() => aoMudar(texto.trim()), 400);
    return () => clearTimeout(espera);
  }, [texto, valor, aoMudar]);

  return (
    <label className="relative block min-w-0 flex-1">
      <span className="sr-only">{placeholder}</span>
      <IconeLupa className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-texto-suave" />
      <input
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={placeholder}
        className={`${CLASSE_CAMPO} pl-10`}
      />
    </label>
  );
}

function Chip({ marcado, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={marcado}
      onClick={onClick}
      className={`${CLASSE_CHIP} ${marcado ? "bg-superficie font-bold text-texto ring-2 ring-ferrugem" : "bg-superficie text-texto ring-1 ring-borda-input hover:ring-ferrugem"}`}
    >
      {marcado && <IconeCheck className="size-4 text-ferrugem" />}
      {children}
    </button>
  );
}

function Grupo({ titulo, children }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-bold">{titulo}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

/** Opção única: tocar de novo desmarca. */
function Opcoes({ titulo, chave, opcoes, filtros, aoMudar }) {
  return (
    <Grupo titulo={titulo}>
      {opcoes.map(([valor, rotulo]) => (
        <Chip key={valor} marcado={filtros[chave] === valor} onClick={() => aoMudar({ [chave]: filtros[chave] === valor ? null : valor })}>
          {rotulo}
        </Chip>
      ))}
    </Grupo>
  );
}

/** Painel de filtros combináveis (todos guardados na URL). */
export function PainelFiltros({ filtros, aoMudar, aoLimpar }) {
  function alternarStatus(id) {
    const lista = filtros.status.includes(id) ? filtros.status.filter((s) => s !== id) : [...filtros.status, id];
    aoMudar({ status: lista });
  }

  return (
    <div id="painel-filtros" className="space-y-4 rounded-2xl bg-superficie p-4 ring-1 ring-borda-suave">
      <Grupo titulo="Período (pela hora-alvo)">
        {[
          ["hoje", "Hoje"],
          ["amanha", "Amanhã"],
          ["7dias", "Próximos 7 dias"],
          ["intervalo", "Escolher datas"],
        ].map(([valor, rotulo]) => (
          <Chip
            key={valor}
            marcado={filtros.periodo === valor}
            onClick={() => aoMudar({ periodo: filtros.periodo === valor ? null : valor, ...(valor !== "intervalo" && { de: null, ate: null }) })}
          >
            {rotulo}
          </Chip>
        ))}
      </Grupo>
      {filtros.periodo === "intervalo" && (
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">De</span>
            <input type="date" value={filtros.de} onChange={(e) => aoMudar({ de: e.target.value })} className={CLASSE_CAMPO} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Até</span>
            <input type="date" value={filtros.ate} min={filtros.de || undefined} onChange={(e) => aoMudar({ ate: e.target.value })} className={CLASSE_CAMPO} />
          </label>
        </div>
      )}

      <Grupo titulo="Status (vários)">
        {STATUS_OPCOES.map((s) => (
          <Chip key={s.id} marcado={filtros.status.includes(s.id)} onClick={() => alternarStatus(s.id)}>
            {s.rotulo}
          </Chip>
        ))}
      </Grupo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Opcoes titulo="Quando" chave="quando" filtros={filtros} aoMudar={aoMudar} opcoes={[["agora", "O quanto antes"], ["agendado", "Agendado"]]} />
        <Opcoes titulo="Recebimento" chave="tipo" filtros={filtros} aoMudar={aoMudar} opcoes={[["entrega", "Entrega"], ["retirada", "Retirada"]]} />
        <Opcoes
          titulo="Pagamento"
          chave="pagamento"
          filtros={filtros}
          aoMudar={aoMudar}
          opcoes={[
            ["pendente", "Aguardando"],
            ["pago", "Pago"],
            ["expirado", "Expirado"],
            ["nao_exigido", "Na entrega/retirada"],
          ]}
        />
        <Opcoes
          titulo="Forma de pagamento"
          chave="forma"
          filtros={filtros}
          aoMudar={aoMudar}
          opcoes={[
            ["pix", "Pix"],
            ["dinheiro", "Dinheiro"],
            ["cartao", "Cartão"],
          ]}
        />
        <Opcoes titulo="Origem" chave="origem" filtros={filtros} aoMudar={aoMudar} opcoes={[["site", "Site"], ["admin", "Painel"]]} />
        <Opcoes titulo="Modo dos pacotes" chave="modo" filtros={filtros} aoMudar={aoMudar} opcoes={[["congelado", "Congelado"], ["pronto", "Pronto"]]} />
      </div>

      <button type="button" onClick={aoLimpar} className="text-sm font-semibold text-link underline underline-offset-4 hover:text-ferrugem-ativo">
        Limpar filtros
      </button>
    </div>
  );
}

export function BotaoFiltros({ aberto, quantidade, onClick }) {
  return (
    <button
      type="button"
      aria-expanded={aberto}
      aria-controls="painel-filtros"
      onClick={onClick}
      className={`inline-flex h-12 shrink-0 items-center gap-2 rounded-xl px-3.5 text-[15px] font-semibold transition ${
        quantidade ? "bg-superficie text-texto ring-2 ring-ferrugem" : "bg-superficie text-texto ring-1 ring-borda-input hover:ring-ferrugem"
      }`}
    >
      <IconeFiltro className="size-5" />
      Filtros
      {quantidade > 0 && <span className="rounded-full bg-ferrugem px-1.5 text-xs font-bold text-white">{quantidade}</span>}
    </button>
  );
}
