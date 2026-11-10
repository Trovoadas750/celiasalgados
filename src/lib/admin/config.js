// Configurações do painel admin.

/** Minutos para um pedido "o quanto antes" ficar pronto (hora-alvo = criado_em + isto). */
export const TEMPO_PREPARO_PADRAO = 40;
const CHAVE_TEMPO_PREPARO = "celiasalgados:admin:tempo-preparo";

/**
 * Tempo de preparo em uso. ÚNICA fonte: os filtros do banco (abas "Para sair agora",
 * "Atrasados", "Hoje") e os badges de urgência leem daqui, para os números baterem.
 * A tela Configurações grava outro valor neste navegador (definirTempoPreparo).
 */
export function tempoPreparoMin() {
  try {
    const n = Number(window.localStorage.getItem(CHAVE_TEMPO_PREPARO));
    if (Number.isInteger(n) && n >= 5 && n <= 240) return n;
  } catch {
    // servidor ou armazenamento bloqueado: usa o padrão
  }
  return TEMPO_PREPARO_PADRAO;
}

export const POR_PAGINA = 30;

/** "Para sair agora" inclui os agendados das próximas 2 horas. */
export const JANELA_PARA_SAIR_MIN = 120;

/** Badge "Em X min" quando a hora-alvo está a menos disto. */
export const URGENTE_MIN = 30;

/** Abas ordenadas pela hora-alvo buscam tudo de uma vez (limite de segurança). */
export const LIMITE_LISTA_ORDENADA = 300;

/** expirar_pagamentos_pendentes ao abrir e a cada 5 min. */
export const EXPIRAR_A_CADA_MS = 5 * 60 * 1000;

/** Sem tempo real, recarrega a lista a cada 60 s. */
export const RECARREGAR_SEM_TEMPO_REAL_MS = 60 * 1000;

/** "Desfazer" depois de mudar o status. */
export const DESFAZER_MS = 5000;

/** Grava o tempo de preparo neste navegador (Configurações). Devolve o valor em uso. */
export function definirTempoPreparo(minutos) {
  const n = Math.round(Number(minutos));
  if (!Number.isInteger(n) || n < 5 || n > 240) throw new Error("Use um tempo entre 5 e 240 minutos.");
  try {
    if (n === TEMPO_PREPARO_PADRAO) window.localStorage.removeItem(CHAVE_TEMPO_PREPARO);
    else window.localStorage.setItem(CHAVE_TEMPO_PREPARO, String(n));
  } catch {
    throw new Error("Este navegador não deixou salvar (armazenamento bloqueado).");
  }
  return n;
}
