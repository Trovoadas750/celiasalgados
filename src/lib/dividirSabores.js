// Divisão FIXA dos sabores de um pacote (o cliente não altera as quantidades).
//
// Regra: tamanho do pacote ÷ nº de sabores, arredondado para baixo; o RESTO vai para o
// PRIMEIRO sabor escolhido (ordem de clique). Com mais de 1 pacote igual, divide 1 pacote e
// multiplica pela quantidade de pacotes.
//   50 com 3 = 18 + 16 + 16 · Cento com 3 = 34 + 33 + 33 · 30 com 2 = 15 + 15
//   Cento com 4 = 25 cada · 1 sabor = pacote inteiro · 2 × 50 com 3 = 36 + 32 + 32
//
// Não tem nada de preço: o preço vem só do banco (calcular_pedido).

/** Quantidades de UM pacote: ex. quantidadesPorPacote(50, 3) -> [18, 16, 16]. */
export function quantidadesPorPacote(tamanhoPacote, numeroDeSabores) {
  if (numeroDeSabores <= 0) return [];
  const base = Math.floor(tamanhoPacote / numeroDeSabores);
  const resto = tamanhoPacote - base * numeroDeSabores;
  return Array.from({ length: numeroDeSabores }, (_, i) => base + (i === 0 ? resto : 0));
}

/**
 * Devolve os sabores (na ordem recebida = ordem de clique) com `quantidade` = TOTAL da linha
 * (já multiplicado pelo nº de pacotes), que é o formato que o banco espera.
 *
 * @param {number} tamanhoPacote  salgados_a_escolher do pacote (30, 50, 100)
 * @param {{ produtoId: number, nome?: string }[]} sabores  escolhidos, na ordem de clique
 * @param {number} [pacotes=1]   quantidade de pacotes iguais
 */
export function dividirSabores(tamanhoPacote, sabores, pacotes = 1) {
  const partes = quantidadesPorPacote(tamanhoPacote, sabores.length);
  return sabores.map((sabor, i) => ({ ...sabor, quantidade: partes[i] * pacotes }));
}
