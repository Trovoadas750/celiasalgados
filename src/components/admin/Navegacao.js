"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { IconeCloche, IconeCoxinha } from "@/components/icones";
import { Dialogo } from "./Dialogo";
import {
  IconeCalendario,
  IconeCasa,
  IconeDinheiro,
  IconeEngrenagem,
  IconeGrafico,
  IconeLista,
  IconeMaisOpcoes,
  IconeMoto,
  IconePanela,
  IconePessoas,
  IconeSair,
} from "./icones";
import { IconeRelogio } from "@/components/icones";
import { useAdmin } from "./AdminProvider";

// Telas do painel. `pronta: false` = ainda não construída (aparece desabilitada, "em breve").
export const TELAS = [
  { href: "/admin", rotulo: "Hoje", Icone: IconeCasa, pronta: true, inferior: true },
  { href: "/admin/pedidos", rotulo: "Pedidos", Icone: IconeLista, pronta: true, inferior: true },
  { href: "/admin/agenda", rotulo: "Agenda", Icone: IconeCalendario, pronta: true, inferior: true },
  { href: "/admin/producao", rotulo: "Produção", Icone: IconePanela, pronta: true, inferior: true },
  { href: "/admin/cozinha", rotulo: "Modo cozinha", Icone: IconeCoxinha, pronta: true },
  { href: "/admin/pagamentos", rotulo: "Pagamentos", Icone: IconeDinheiro, pronta: true },
  { href: "/admin/clientes", rotulo: "Clientes", Icone: IconePessoas, pronta: true },
  { href: "/admin/cardapio", rotulo: "Cardápio", Icone: IconeCloche, pronta: true },
  { href: "/admin/horarios", rotulo: "Horários", Icone: IconeRelogio, pronta: true },
  { href: "/admin/frete", rotulo: "Frete", Icone: IconeMoto, pronta: true },
  { href: "/admin/relatorios", rotulo: "Relatórios", Icone: IconeGrafico, pronta: true },
  { href: "/admin/configuracoes", rotulo: "Configurações", Icone: IconeEngrenagem, pronta: true },
];

function ativa(pathname, href) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/** Computador: menu lateral fixo (fundo café, item ativo em laranja com filete). */
export function MenuLateral() {
  const pathname = usePathname();
  return (
    <nav aria-label="Painel" className="fundo-escuro fixed inset-y-0 left-0 z-30 hidden w-60 print:!hidden flex-col border-r-4 border-vinho bg-cafe text-creme lg:flex">
      <div className="px-5 pb-4 pt-5">
        <p className="font-titulo text-xl leading-tight">Edna &amp; Célia</p>
        <p className="text-sm text-creme">Painel da loja</p>
      </div>
      <ul className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {TELAS.map(({ href, rotulo, Icone, pronta }) => {
          const atual = ativa(pathname, href);
          if (!pronta) {
            return (
              <li key={href}>
                <span aria-disabled="true" className="flex min-h-11 cursor-not-allowed items-center gap-3 rounded-lg px-3 text-[15px] text-desabilitado">
                  <Icone className="size-5" />
                  {rotulo}
                  <span className="ml-auto text-xs">em breve</span>
                </span>
              </li>
            );
          }
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={atual ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] font-semibold transition ${
                  atual ? "bg-vinho text-laranja shadow-[inset_4px_0_0_var(--laranja)]" : "text-creme hover:bg-vinho"
                }`}
              >
                <Icone className="size-5" />
                {rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Celular/tablet: barra inferior com Hoje · Pedidos · Agenda · Produção · Mais. */
export function BarraInferior() {
  const pathname = usePathname();
  const { sair } = useAdmin();
  const [mais, setMais] = useState(false);
  const principais = TELAS.filter((t) => t.inferior);
  const outras = TELAS.filter((t) => !t.inferior);

  return (
    <>
      <nav
        aria-label="Painel"
        className="fundo-escuro fixed inset-x-0 bottom-0 z-30 print:!hidden border-t-4 border-vinho bg-cafe pb-[env(safe-area-inset-bottom)] text-creme lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {principais.map(({ href, rotulo, Icone, pronta }) => {
            const atual = ativa(pathname, href);
            const classe = "flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold";
            return (
              <li key={href}>
                {pronta ? (
                  <Link href={href} aria-current={atual ? "page" : undefined} className={`${classe} ${atual ? "text-laranja" : "text-creme"}`}>
                    <Icone className="size-6" />
                    {rotulo}
                  </Link>
                ) : (
                  <span aria-disabled="true" className={`${classe} cursor-not-allowed text-desabilitado`}>
                    <Icone className="size-6" />
                    {rotulo}
                  </span>
                )}
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setMais(true)} className="flex min-h-16 w-full flex-col items-center justify-center gap-0.5 text-xs font-semibold text-creme">
              <IconeMaisOpcoes className="size-6" />
              Mais
            </button>
          </li>
        </ul>
      </nav>

      <Dialogo aberto={mais} aoFechar={() => setMais(false)} titulo="Mais opções">
        <ul className="space-y-1">
          {outras.map(({ href, rotulo, Icone, pronta }) => (
            <li key={href}>
              {pronta ? (
                <Link href={href} onClick={() => setMais(false)} className="flex min-h-12 items-center gap-3 rounded-xl bg-superficie px-3 font-semibold ring-1 ring-borda-suave">
                  <Icone className="size-5" />
                  {rotulo}
                </Link>
              ) : (
                <span aria-disabled="true" className="flex min-h-12 cursor-not-allowed items-center gap-3 rounded-xl px-3 text-desabilitado">
                  <Icone className="size-5" />
                  {rotulo}
                  <span className="ml-auto text-sm">em breve</span>
                </span>
              )}
            </li>
          ))}
          <li className="pt-2">
            <button type="button" onClick={sair} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 font-semibold text-erro ring-2 ring-erro">
              <IconeSair className="size-5" />
              Sair do painel
            </button>
          </li>
        </ul>
      </Dialogo>
    </>
  );
}

