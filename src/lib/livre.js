// "Monte do seu jeito" (categoria 'livre'): regras de quantidade da montagem, sem nada de preço.
// O preço vem SÓ do banco (calcular_pedido); o banco também revalida todas estas regras.
// Testes em livre.test.js (npm test).
//
// regras = { quantidade_minima, quantidade_maxima, minimo_qualidades, minimo_por_sabor, multiplo }
//          (tabela regras_livre) + maxSabores (produtos.max_sabores do produto 'livre').

/** Mínimo por qualidade já no múltiplo (ex.: mínimo 10, múltiplo 5 -> 10; mínimo 12 -> 15). */
function minimoValido({ minimo_por_sabor: minimo, multiplo }) {
  return Math.max(multiplo, Math.ceil(minimo / multiplo) * multiplo);
}

/**
 * Quantidade digitada -> válida: múltiplo mais próximo, nunca abaixo do mínimo nem acima do
 * máximo do pedido. Vazio, 0 ou negativo -> 0 (remove a qualidade).
 */
export function ajustarQuantidade(valor, regras) {
  const n = Number(String(valor ?? "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return 0;
  const { multiplo, quantidade_maxima: maxima } = regras;
  const teto = Math.floor(maxima / multiplo) * multiplo;
  const arredondado = Math.round(n / multiplo) * multiplo;
  return Math.min(teto, Math.max(minimoValido(regras), arredondado));
}

/** Botão "+": de "Adicionar" (0) vai direto ao mínimo; depois soma o múltiplo. */
export function quantidadeAcima(atual, regras) {
  return atual <= 0 ? minimoValido(regras) : atual + regras.multiplo;
}

/** Botão "−": tira o múltiplo; abaixo do mínimo volta para 0 (remove). */
export function quantidadeAbaixo(atual, regras) {
  const nova = atual - regras.multiplo;
  return nova < minimoValido(regras) ? 0 : nova;
}

/** Total de salgados das qualidades escolhidas. */
export function totalSalgados(sabores = []) {
  return sabores.reduce((soma, s) => soma + (Number(s.quantidade) || 0), 0);
}

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

/**
 * Situação da montagem.
 * @returns {{ pronto: boolean, aviso: string | null, rodape: string | null }}
 *   aviso  = texto do contador ("Faltam 10 para o mínimo de 30");
 *   rodape = texto do botão desabilitado ("Escolha pelo menos 30 salgados e 2 qualidades").
 */
export function situacaoLivre({ modo, sabores, regras }) {
  const total = totalSalgados(sabores);
  const qualidades = sabores.filter((s) => s.quantidade > 0).length;
  const { quantidade_minima: minima, quantidade_maxima: maxima, minimo_qualidades: minQualidades } = regras;
  const pedidoMinimo = `Escolha pelo menos ${minima} salgados e ${plural(minQualidades, "qualidade", "qualidades")}`;

  if (!modo) return { pronto: false, aviso: null, rodape: "Escolha como quer receber" };
  if (total > maxima) return { pronto: false, aviso: `Máximo de ${maxima} salgados`, rodape: `Máximo de ${maxima} salgados` };
  if (qualidades === 0) return { pronto: false, aviso: null, rodape: pedidoMinimo };
  if (total < minima) {
    const aviso = `Faltam ${minima - total} para o mínimo de ${minima}`;
    return { pronto: false, aviso, rodape: qualidades < minQualidades ? pedidoMinimo : aviso };
  }
  if (qualidades < minQualidades) {
    const falta = minQualidades - qualidades;
    const aviso = `Escolha pelo menos mais ${plural(falta, "qualidade", "qualidades")}`;
    return { pronto: false, aviso, rodape: aviso };
  }
  return { pronto: true, aviso: null, rodape: null };
}

/**
 * Divide `total` salgados entre `n` qualidades seguindo as regras (múltiplo e mínimo por
 * qualidade), as maiores primeiro. Ex.: 30 em 2 -> [15, 15]; 100 em 3 -> [35, 35, 30].
 * @returns {number[] | null}  null se não der (ex.: 30 em 4 com mínimo 10)
 */
export function dividirLivre(total, n, regras) {
  const { multiplo } = regras;
  if (n <= 0 || total % multiplo !== 0) return null;
  const unidades = total / multiplo;
  const base = Math.floor(unidades / n);
  const resto = unidades % n;
  const partes = Array.from({ length: n }, (_, i) => (base + (i < resto ? 1 : 0)) * multiplo);
  return partes.every((q) => q >= minimoValido(regras)) ? partes : null;
}

/** O sabor pode ir num pacote deste modo? (mesma regra dos kits) */
const permitidoNoModo = (sabor, modo) => (modo === "congelado" ? sabor?.vende_congelado === true : sabor?.vende_pronto === true);

/**
 * Kit ativo do mesmo tamanho que comporta estas qualidades (para sugerir trocar, se sair mais barato).
 * @param {{ total: number, sabores: { produtoId: number }[], modo: string,
 *           kits: { id, ativo?, salgados_a_escolher, max_sabores }[], saboresPorId: Map<number, object> }} p
 * @returns {object | null}
 */
export function kitParaSugerir({ total, sabores, modo, kits, saboresPorId }) {
  const escolhidos = sabores.filter((s) => s.quantidade > 0);
  if (!modo || escolhidos.length === 0) return null;
  if (!escolhidos.every((s) => permitidoNoModo(saboresPorId.get(s.produtoId), modo))) return null;
  return (
    kits.find(
      (k) => k.ativo !== false && k.salgados_a_escolher === total && escolhidos.length <= (k.max_sabores ?? k.salgados_a_escolher),
    ) ?? null
  );
}

/** "25 de cada" ou "34, 33 e 33". */
export function textoDivisao(quantidades) {
  if (quantidades.length === 0) return "";
  if (quantidades.every((q) => q === quantidades[0])) return quantidades.length === 1 ? `${quantidades[0]}` : `${quantidades[0]} de cada`;
  return quantidades.length === 1 ? `${quantidades[0]}` : `${quantidades.slice(0, -1).join(", ")} e ${quantidades.at(-1)}`;
}

/**
 * Confere uma montagem "à vontade" (ex.: pedido repetido): sabores ativos e do modo, quantidades
 * válidas e regras do pedido. Devolve a lista de problemas (vazia = válida).
 */
export function problemasLivre({ modo, sabores, regras, maxSabores, saboresPorId }) {
  const problemas = [];
  for (const s of sabores) {
    const sabor = saboresPorId.get(s.produtoId);
    if (!sabor) problemas.push(`${s.nome ?? "Uma qualidade"} não está mais no cardápio`);
    else if (!permitidoNoModo(sabor, modo)) problemas.push(`${sabor.nome} não sai ${modo === "pronto" ? "pronto para comer" : "congelado"}`);
    else if (ajustarQuantidade(s.quantidade, regras) !== Number(s.quantidade)) problemas.push(`${sabor.nome}: quantidade fora da regra`);
  }
  if (sabores.length > maxSabores) problemas.push(`Mais de ${maxSabores} qualidades`);
  const situacao = situacaoLivre({ modo, sabores, regras });
  if (!situacao.pronto && situacao.rodape) problemas.push(situacao.rodape);
  return problemas;
}
