// Dados guardados só neste navegador. Nada aqui vai para o Supabase.
// localStorage pode falhar (aba anônima, armazenamento bloqueado), então tudo fica em try/catch.

const CHAVE_CONVIDADO = "celiasalgados:convidado";
const CHAVE_ENDERECO = "celiasalgados:ultimo-endereco";

function ler(chave) {
  try {
    const valor = JSON.parse(window.localStorage.getItem(chave));
    return valor && typeof valor === "object" ? valor : null;
  } catch {
    return null;
  }
}

function gravar(chave, valor) {
  try {
    if (valor === null) window.localStorage.removeItem(chave);
    else window.localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Sem armazenamento: o site funciona, só não lembra os dados no próximo pedido.
  }
}

// Perfil de convidado: { nome, sobrenome, telefone } (telefone só dígitos)
export function lerConvidado() {
  const c = ler(CHAVE_CONVIDADO);
  return c?.nome && c?.telefone ? { nome: c.nome, sobrenome: c.sobrenome ?? "", telefone: c.telefone } : null;
}

export function salvarConvidado({ nome, sobrenome, telefone }) {
  gravar(CHAVE_CONVIDADO, { nome, sobrenome, telefone });
}

export function limparConvidado() {
  gravar(CHAVE_CONVIDADO, null);
}

// Endereço do último pedido: { cep, rua, vila, numero, ponto_referencia }. Não é salvo na conta.
export function lerUltimoEndereco() {
  return ler(CHAVE_ENDERECO);
}

export function salvarUltimoEndereco({ cep, rua, vila, numero, ponto_referencia }) {
  gravar(CHAVE_ENDERECO, { cep: cep ?? "", rua, vila, numero, ponto_referencia });
}

// ---- Lembrete de pagamento (horários em milissegundos, Date.now()) ----
const CHAVE_ULTIMA_NOTIFICACAO = "celiasalgados:lembrete:ultima-notificacao";
const CHAVE_LEMBRETE_FECHADO_ATE = "celiasalgados:lembrete:fechado-ate";

function lerNumero(chave) {
  try {
    const n = Number(window.localStorage.getItem(chave));
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function gravarNumero(chave, valor) {
  try {
    window.localStorage.setItem(chave, String(valor));
  } catch {
    // Sem armazenamento: só não lembra entre recarregamentos.
  }
}

/** Quando o navegador mostrou a última notificação do sistema (0 = nunca). */
export function lerUltimaNotificacao() {
  return lerNumero(CHAVE_ULTIMA_NOTIFICACAO);
}

export function salvarUltimaNotificacao(quando = Date.now()) {
  gravarNumero(CHAVE_ULTIMA_NOTIFICACAO, quando);
}

/** Até quando o banner de pagamento fica fechado (0 = aberto). */
export function lerLembreteFechadoAte() {
  return lerNumero(CHAVE_LEMBRETE_FECHADO_ATE);
}

export function fecharLembretePor(ms) {
  gravarNumero(CHAVE_LEMBRETE_FECHADO_ATE, Date.now() + ms);
}
