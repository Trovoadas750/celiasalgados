// Classes de botão (receitas do paletas.md, seção 5). Ficam fora de um módulo 'use client' para
// servirem também em componentes de servidor.

const DESABILITADO =
  "disabled:cursor-not-allowed disabled:bg-superficie disabled:text-desabilitado disabled:ring-1 disabled:ring-borda-suave";

// Botão principal: ferrugem com texto branco (5.83).
export const CLASSE_BOTAO_PRINCIPAL = `flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ferrugem px-4 text-[15px] font-bold text-white transition hover:bg-ferrugem-hover active:bg-ferrugem-ativo active:scale-[0.99] ${DESABILITADO}`;

// Botão secundário: transparente, texto e borda de 2px em --ferrugem-hover.
export const CLASSE_BOTAO_SECUNDARIO = `flex h-12 w-full items-center justify-center rounded-xl bg-transparent px-4 text-[15px] font-semibold text-link ring-2 ring-link transition hover:text-ferrugem-ativo hover:ring-ferrugem-ativo ${DESABILITADO}`;

// Link em texto (ou botão com cara de link): --link sublinhado; hover --ferrugem-ativo.
export const CLASSE_LINK = "font-semibold text-link underline underline-offset-4 transition hover:text-ferrugem-ativo";
