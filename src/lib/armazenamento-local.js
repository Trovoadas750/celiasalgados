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

// Endereço do último pedido: { rua, vila, numero, ponto_referencia }. Não é salvo na conta.
export function lerUltimoEndereco() {
  return ler(CHAVE_ENDERECO);
}

export function salvarUltimoEndereco({ rua, vila, numero, ponto_referencia }) {
  gravar(CHAVE_ENDERECO, { rua, vila, numero, ponto_referencia });
}
