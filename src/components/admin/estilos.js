// Classes de botão do painel. Base nas receitas do site (components/cliente/estilos.js);
// o painel usa botões maiores (uso no celular, no meio da cozinha).

export { CLASSE_BOTAO_PRINCIPAL, CLASSE_BOTAO_SECUNDARIO, CLASSE_LINK } from "@/components/cliente/estilos";

const DESABILITADO =
  "disabled:cursor-not-allowed disabled:bg-superficie disabled:text-desabilitado disabled:ring-1 disabled:ring-borda-suave";

// Botão de ação do card/detalhe ("Iniciar preparo"): ferrugem, texto branco, alto.
export const CLASSE_BOTAO_ACAO = `inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ferrugem px-4 text-[15px] font-bold text-white transition hover:bg-ferrugem-hover active:bg-ferrugem-ativo ${DESABILITADO}`;

// Botão de contorno (ações secundárias no detalhe).
export const CLASSE_BOTAO_CONTORNO = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-superficie px-3 text-sm font-semibold text-link ring-2 ring-link transition hover:text-ferrugem-ativo hover:ring-ferrugem-ativo ${DESABILITADO}`;

// Ação destrutiva (cancelar, excluir, bloquear): contorno no vermelho de erro, nunca ferrugem.
export const CLASSE_BOTAO_PERIGO = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-superficie px-3 text-sm font-semibold text-erro ring-2 ring-erro transition hover:bg-erro-fundo ${DESABILITADO}`;

// Confirmação destrutiva dentro do diálogo: preenchido em vermelho de erro, texto branco.
export const CLASSE_BOTAO_PERIGO_CHEIO = `inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-erro px-4 text-[15px] font-bold text-white transition hover:ring-2 hover:ring-erro hover:ring-offset-2 ${DESABILITADO}`;

// Campo de formulário (mesma receita do site).
export const CLASSE_CAMPO =
  "h-12 w-full rounded-xl bg-superficie px-3 text-[16px] text-texto ring-1 ring-borda-input transition placeholder:text-texto-suave";

// Chip de filtro/aba: marcado = ring ferrugem + ✓ no texto (nunca só a cor).
export const CLASSE_CHIP =
  "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition";
