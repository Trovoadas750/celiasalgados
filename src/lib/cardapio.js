import { criarSupabasePublico, getSupabase } from "./supabase";

// Cardápio público vindo da tabela `produtos` (contextoBD.md, seção 8).
//
// Colunas EXATAS da consulta de referência. Nunca inclua `acrescimo_percentual`:
// o site não pode mostrar percentual nem dizer que assado é mais caro.
const COLUNAS =
  "id, categoria, nome, descricao, preco, imagem_url, ordem, salgados_a_escolher, max_sabores, tipo_salgado, vende_congelado, vende_pronto, antecedencia_dias";

export const TIPOS_SABOR = ["frito", "assado", "variado"];
export const MODOS = ["congelado", "pronto"];

// No servidor usa um cliente sem sessão; no navegador, o cliente do site.
function clienteSupabase() {
  return typeof window === "undefined" ? criarSupabasePublico() : getSupabase();
}

/**
 * Lê o cardápio ativo, já separado:
 *  - pacotes:       categoria "kit" (30, 50 e 100 salgados)
 *  - sabores:       categoria "salgado", agrupados por tipo_salgado
 *  - refrigerantes: categoria "refrigerante"
 *  - adicionais:    categoria "adicional" (ex.: molho de pimenta), oferecidos na montagem do pacote
 *  - livre:         "Monte do seu jeito" (categoria "livre"; null se a loja desativar ou faltar a regra),
 *                   já com as regras de regras_livre (sem percentuais: o site nunca mostra)
 *
 * `preco` do pacote é o preço BASE (fritos). Não use como preço final: o valor real vem de
 * `calcularPedido` (lib/pedidos.js). Na tela, mostre no máximo "a partir de R$ ...".
 *
 * @returns {Promise<{ pacotes: object[], sabores: { frito: object[], assado: object[], variado: object[] }, refrigerantes: object[], adicionais: object[],
 *   livre: null | (object & { regras: { quantidade_minima, quantidade_maxima, minimo_qualidades, minimo_por_sabor, multiplo } }) }>}
 */
export async function listarCardapio() {
  const supabase = clienteSupabase();
  const [{ data, error }, regras] = await Promise.all([
    supabase.from("produtos").select(COLUNAS).eq("ativo", true).order("ordem").order("nome"),
    // Sem acrescimo_por_qualidade_pct: percentual nunca aparece no site.
    supabase.from("regras_livre").select(COLUNAS_REGRAS_LIVRE).eq("id", 1).maybeSingle(),
  ]);

  if (error) throw new Error("Não foi possível carregar o cardápio. Tente novamente.");

  const cardapio = { pacotes: [], sabores: { frito: [], assado: [], variado: [] }, refrigerantes: [], adicionais: [], livre: null };
  for (const linha of data) {
    // numeric pode chegar como string; preco_so_assado nem é selecionado (é regra interna do banco)
    const produto = { ...linha, preco: linha.preco === null ? null : Number(linha.preco) };
    if (produto.categoria === "kit") cardapio.pacotes.push(produto);
    else if (produto.categoria === "refrigerante") cardapio.refrigerantes.push(produto);
    else if (produto.categoria === "adicional") cardapio.adicionais.push(produto);
    // "Monte do seu jeito": só aparece se as regras vierem junto (sem elas não dá para montar).
    else if (produto.categoria === "livre" && !cardapio.livre && regras.data) cardapio.livre = { ...produto, regras: numerosRegras(regras.data) };
    else if (produto.categoria === "salgado" && cardapio.sabores[produto.tipo_salgado]) {
      cardapio.sabores[produto.tipo_salgado].push(produto);
    }
  }
  return cardapio;
}

/**
 * Filtra os sabores que podem ir num pacote do modo escolhido.
 *  - "congelado": vende_congelado = true (variados ficam de fora)
 *  - "pronto":    vende_pronto = true
 *
 * Aceita a lista de sabores ou o objeto agrupado { frito, assado, variado } e devolve no mesmo formato.
 */
const COLUNAS_REGRAS_LIVRE = "quantidade_minima, quantidade_maxima, minimo_qualidades, minimo_por_sabor, multiplo";

function numerosRegras(r) {
  return Object.fromEntries(Object.entries(r).map(([chave, valor]) => [chave, Number(valor)]));
}

export function saboresDisponiveis(sabores, modo) {
  if (!MODOS.includes(modo)) throw new Error(`Modo inválido: "${modo}". Use "congelado" ou "pronto".`);
  const coluna = modo === "congelado" ? "vende_congelado" : "vende_pronto";
  const filtrar = (lista) => (lista ?? []).filter((sabor) => sabor[coluna] === true);

  if (Array.isArray(sabores)) return filtrar(sabores);
  return Object.fromEntries(TIPOS_SABOR.map((tipo) => [tipo, filtrar(sabores?.[tipo])]));
}
