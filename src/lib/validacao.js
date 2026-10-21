// Validações feitas no formulário antes de chamar o banco.
// Os limites espelham as constraints das tabelas (contextoBD.md); o banco valida de novo.

export function soDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

// Máscara progressiva: "(14", "(14) 9999", "(14) 3333-4444", "(14) 99999-9999"
export function mascararTelefone(valor) {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function tamanho(rotulo, min, max) {
  return (valor) => {
    const t = String(valor ?? "").trim().length;
    if (min > 0 && t === 0) return `Informe ${rotulo}.`;
    if (t < min) return `${rotulo[0].toUpperCase()}${rotulo.slice(1)} precisa ter pelo menos ${min} caracteres.`;
    if (t > max) return `Use no máximo ${max} caracteres.`;
    return null;
  };
}

export const REGRAS = {
  nome: tamanho("o nome", 2, 60),
  sobrenome: tamanho("o sobrenome", 2, 80),
  telefone: (valor) => {
    const d = soDigitos(valor);
    if (d.length === 0) return "Informe o celular.";
    if (d.length < 10 || d.length > 11) return "Celular com DDD: (14) 99999-9999.";
    return null;
  },
  senha: (valor) => (String(valor ?? "").length < 8 ? "A senha precisa ter pelo menos 8 caracteres." : null),
  rua: tamanho("a rua", 2, 120),
  vila: tamanho("a vila/bairro", 2, 80),
  numero: tamanho("o número", 1, 10),
  ponto_referencia: tamanho("o ponto de referência", 0, 200),
  observacao: tamanho("a observação", 0, 500),
};

// Valida só os campos listados. Retorna { campo: mensagem } apenas com os que têm erro.
export function validar(valores, campos) {
  const erros = {};
  for (const campo of campos) {
    const erro = REGRAS[campo](valores[campo]);
    if (erro) erros[campo] = erro;
  }
  return erros;
}

export function temErros(erros) {
  return Object.keys(erros).length > 0;
}
