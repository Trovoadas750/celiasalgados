// Sugestão de senha para o cliente (função pura; teste em status.test.js).

// Sem letras/números que se confundem (0/O, 1/l/I) para ditar ou digitar no celular.
const LETRAS = "abcdefghjkmnpqrstuvwxyz";
const NUMEROS = "23456789";

/**
 * Senha forte e fácil de digitar: "Kmt7-Wqr4-Hzp9" (14 caracteres).
 * @param {(n: number) => Uint32Array} [aleatorio]  troca a fonte aleatória (testes)
 */
export function gerarSenha(aleatorio = (n) => crypto.getRandomValues(new Uint32Array(n))) {
  const r = aleatorio(12);
  const letra = (v) => LETRAS[v % LETRAS.length];
  const bloco = (i) => letra(r[i]).toUpperCase() + letra(r[i + 1]) + letra(r[i + 2]) + NUMEROS[r[i + 3] % NUMEROS.length];
  return `${bloco(0)}-${bloco(4)}-${bloco(8)}`;
}
