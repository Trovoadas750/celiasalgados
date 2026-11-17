// Leituras das telas de consulta do painel: cardápio, frete, dados da loja e administradores.
// O painel NÃO edita cardápio, preços, horários, frete nem dados da loja: isso é feito no banco/código.

import { dividirSabores } from "@/lib/dividirSabores";
import { calcularFrete } from "@/lib/frete";
import { dividirLivre } from "@/lib/livre";
import { calcularPedido } from "@/lib/pedidos";
import { chamarRotaAdmin } from "./api";
import { checar } from "./pedidos";
import { getSupabaseAdmin } from "./supabaseAdmin";

const db = () => getSupabaseAdmin();

/** Todos os produtos (inclusive desativados), separados por categoria. Inclui o acréscimo (só no painel). */
export async function listarProdutosAdmin() {
  const { data } = checar(
    await db()
      .from("produtos")
      .select(
        "id, categoria, nome, descricao, preco, preco_so_assado, ativo, imagem_url, ordem, salgados_a_escolher, max_sabores, tipo_salgado, acrescimo_percentual, vende_congelado, vende_pronto, antecedencia_dias",
      )
      .order("ordem")
      .order("nome"),
  );
  const grupos = { pacotes: [], sabores: [], bebidas: [], adicionais: [], livre: [] };
  for (const p of data ?? []) {
    const produto = { ...p, preco: p.preco == null ? null : Number(p.preco), preco_so_assado: p.preco_so_assado == null ? null : Number(p.preco_so_assado) };
    if (p.categoria === "kit") grupos.pacotes.push(produto);
    else if (p.categoria === "salgado") grupos.sabores.push(produto);
    else if (p.categoria === "refrigerante") grupos.bebidas.push(produto);
    else if (p.categoria === "livre") grupos.livre.push(produto);
    else grupos.adicionais.push(produto);
  }
  return grupos;
}

/**
 * Quanto sairia cada pacote (30, 50, 100) só com este sabor, pelo calcular_pedido do banco.
 * Usa congelado quando o sabor permite; senão, pronto.
 * @returns {Promise<{ pacote: string, modo: string, valor: number }[]>}
 */
export async function previaPrecoSabor(sabor, pacotes) {
  const modo = sabor.vende_congelado ? "congelado" : "pronto";
  const ativos = pacotes.filter((p) => p.ativo).sort((a, b) => a.salgados_a_escolher - b.salgados_a_escolher);
  const itens = ativos.map((p) => ({
    produtoId: p.id,
    quantidade: 1,
    modo,
    sabores: [{ produtoId: sabor.id, quantidade: p.salgados_a_escolher }],
  }));
  const resumo = await calcularPedido(itens);
  return ativos.map((p, i) => ({ pacote: p.nome, modo, valor: Number(resumo.itens[i]?.subtotal) }));
}

/** Regras do "Monte do seu jeito" (no painel inclui o acréscimo por qualidade extra). */
export async function buscarRegrasLivre() {
  const { data } = checar(
    await db()
      .from("regras_livre")
      .select("acrescimo_por_qualidade_pct, quantidade_minima, quantidade_maxima, minimo_qualidades, minimo_por_sabor, multiplo")
      .eq("id", 1)
      .maybeSingle(),
  );
  return data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, Number(v)])) : null;
}

/**
 * Prévia do "Monte do seu jeito" x kit equivalente: 30, 50 e 100 salgados com 1 a 4 qualidades
 * fritas (congelado), tudo pelo calcular_pedido (uma consulta só). Combinações fora das regras
 * ficam sem preço (ex.: 1 qualidade, abaixo do mínimo).
 * @returns {Promise<{ tamanho: number, qualidades: number, livre: number | null, motivoLivre?: string,
 *                     kit: { nome: string, valor: number } | null }[]>}
 */
export async function previaLivre({ livre, regras, pacotes, fritos }) {
  const linhasPedido = [];
  const tabela = [];
  const disponiveis = fritos.filter((s) => s.ativo && s.vende_congelado);
  for (const tamanho of [30, 50, 100]) {
    const kit = pacotes.find((p) => p.ativo && p.salgados_a_escolher === tamanho);
    for (let n = 1; n <= 4; n++) {
      const sabores = disponiveis.slice(0, n);
      const linha = { tamanho, qualidades: n, livre: null, kit: null };
      if (sabores.length < n) {
        linha.motivoLivre = "faltam qualidades fritas ativas";
        tabela.push(linha);
        continue;
      }
      const partes = dividirLivre(tamanho, n, regras);
      if (livre.ativo && n >= regras.minimo_qualidades && n <= (livre.max_sabores ?? 10) && partes && tamanho >= regras.quantidade_minima) {
        linha.indiceLivre = linhasPedido.length;
        linhasPedido.push({ produtoId: livre.id, quantidade: 1, modo: "congelado", sabores: sabores.map((s, i) => ({ produtoId: s.id, quantidade: partes[i] })) });
      } else {
        linha.motivoLivre = n < regras.minimo_qualidades ? `mínimo de ${regras.minimo_qualidades} qualidades` : "fora das regras";
      }
      if (kit && n <= (kit.max_sabores ?? tamanho)) {
        linha.indiceKit = linhasPedido.length;
        linha.nomeKit = kit.nome;
        linhasPedido.push({ produtoId: kit.id, quantidade: 1, modo: "congelado", sabores: dividirSabores(tamanho, sabores.map((s) => ({ produtoId: s.id })), 1) });
      }
      tabela.push(linha);
    }
  }
  if (linhasPedido.length === 0) return tabela;
  const resumo = await calcularPedido(linhasPedido);
  return tabela.map(({ indiceLivre, indiceKit, nomeKit, ...linha }) => ({
    ...linha,
    livre: indiceLivre != null ? Number(resumo.itens[indiceLivre].subtotal) : null,
    kit: indiceKit != null ? { nome: nomeKit, valor: Number(resumo.itens[indiceKit].subtotal) } : null,
  }));
}

export async function listarFaixasFrete() {
  const { data } = checar(await db().from("faixas_frete").select("id, ate_km, valor, ativo").order("ate_km", { nullsFirst: false }));
  return (data ?? []).map((f) => ({ ...f, ate_km: f.ate_km == null ? null : Number(f.ate_km), valor: Number(f.valor) }));
}

export async function buscarConfigLoja() {
  const { data } = checar(
    await db().from("config_loja").select("endereco, cidade, uf, cep, loja_lat, loja_lng, raio_maximo_km, pausado_ate").eq("id", 1).maybeSingle(),
  );
  return data;
}

/**
 * Simula o frete de um endereço como o site faz (/api/frete) e busca a distância calculada.
 * @returns {Promise<{ status: string, valor?: number, distancia_km?: number, mensagem?: string }>}
 */
export async function simularFrete({ rua, numero, vila, cep }) {
  const resultado = await calcularFrete({ rua, numero, vila, cep });
  if (resultado.status !== "ok") return resultado;
  const { data } = await db().rpc("calcular_frete", { p_rua: rua, p_numero: numero, p_vila: vila });
  return { ...resultado, distancia_km: data?.distancia_km == null ? undefined : Number(data.distancia_km) };
}

/** Administradores (somente leitura, pela rota do servidor). */
export async function listarAdmins() {
  const { admins } = await chamarRotaAdmin("/api/admin/admins", { metodo: "GET" });
  return admins ?? [];
}

/** Troca a senha do próprio admin, conferindo a senha atual antes. */
export async function alterarMinhaSenha({ email, atual, nova }) {
  const auth = db().auth;
  const { error: erroAtual } = await auth.signInWithPassword({ email, password: atual });
  if (erroAtual) throw new Error(erroAtual.status === 429 ? "Muitas tentativas. Espere alguns minutos." : "Senha atual incorreta.");
  const { error } = await auth.updateUser({ password: nova });
  if (error) {
    throw new Error(
      /different|same/i.test(error.message) ? "A senha nova precisa ser diferente da atual." : "Não foi possível trocar a senha. Tente uma senha mais forte.",
    );
  }
}
