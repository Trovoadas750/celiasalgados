import "server-only"; // usa GEOAPIFY_API_KEY: nunca pode ir para o navegador

// Geocodificação de endereços de Ourinhos-SP pela Geoapify (plano grátis: 3.000 requisições/dia).
// Só a rota /api/frete chama, e só quando o endereço não está no cache do banco.

const URL_GEOAPIFY = "https://api.geoapify.com/v1/geocode/search";
const TIMEOUT_MS = 5000;
const CIDADE = "Ourinhos";
// "city", "postcode", "suburb", "district"... = resultado vago demais para calcular distância.
const TIPOS_ACEITOS = new Set(["building", "amenity", "street"]);

function semAcento(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * @param {{ rua: string, numero: string, vila: string, cep?: string | null }} endereco
 * @param {{ lat?: number | null, lng?: number | null }} [loja]  coordenadas da loja (só para o "bias")
 * @returns {Promise<
 *   { status: "encontrado", lat: number, lng: number, formatado: string } |
 *   { status: "nao_encontrado" } |
 *   { status: "erro_temporario" }
 * >}
 * O bairro devolvido NÃO é comparado com a vila digitada (os nomes variam): valida só cidade e tipo.
 */
export async function geocodificar({ rua, numero, cep }, loja = {}) {
  const chave = process.env.GEOAPIFY_API_KEY;
  if (!chave) {
    console.error("[geoapify] GEOAPIFY_API_KEY não definida.");
    return { status: "erro_temporario" };
  }

  const params = new URLSearchParams({ street: rua.trim(), housenumber: numero.trim() });
  const digitosCep = String(cep ?? "").replace(/\D/g, "");
  if (digitosCep.length === 8) params.set("postcode", `${digitosCep.slice(0, 5)}-${digitosCep.slice(5)}`);
  params.set("city", CIDADE);
  params.set("state", "São Paulo");
  params.set("country", "Brazil");
  params.set("filter", "countrycode:br");
  if (loja.lat != null && loja.lng != null) params.set("bias", `proximity:${loja.lng},${loja.lat}`);
  params.set("lang", "pt");
  params.set("limit", "1");
  params.set("format", "json");
  params.set("apiKey", chave);

  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), TIMEOUT_MS);
  try {
    const resposta = await fetch(`${URL_GEOAPIFY}?${params}`, { signal: controle.signal, cache: "no-store" });
    if (resposta.status === 429 || resposta.status >= 500) return { status: "erro_temporario" };
    if (!resposta.ok) {
      // 400/401/403: chave ou parâmetro errado. Tratado como temporário para não gravar "não encontrado".
      console.error("[geoapify] HTTP", resposta.status);
      return { status: "erro_temporario" };
    }
    const dados = await resposta.json();
    const r = dados?.results?.[0];
    if (!r || typeof r.lat !== "number" || typeof r.lon !== "number") return { status: "nao_encontrado" };
    if (semAcento(r.city) !== semAcento(CIDADE)) return { status: "nao_encontrado" };
    if (!TIPOS_ACEITOS.has(r.result_type)) return { status: "nao_encontrado" };
    return { status: "encontrado", lat: r.lat, lng: r.lon, formatado: r.formatted ?? "" };
  } catch (e) {
    if (e.name !== "AbortError") console.error("[geoapify] falha de rede:", e.message);
    return { status: "erro_temporario" };
  } finally {
    clearTimeout(limite);
  }
}

/** "Rua Miguel de Moraes, 377 - Jardim Europa" -> { rua: "Rua Miguel de Moraes", numero: "377" } */
export function separarEnderecoLoja(endereco) {
  const [antesDoTraco] = String(endereco ?? "").split(" - ");
  const partes = antesDoTraco.split(",");
  const numero = partes.length > 1 ? partes.pop().trim() : "";
  return { rua: partes.join(",").trim(), numero };
}
