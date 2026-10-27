import "server-only"; // usa o handle da loja: nunca vai para o navegador

// Cliente da API de checkout da InfinitePay (https://www.infinitepay.io/checkout-documentacao).
//
// DESLIGADO enquanto INFINITEPAY_HANDLE não estiver definido: o "Pagar agora" continua indo
// para o WhatsApp da loja. Para ligar, basta cadastrar o handle (InfiniteTag, sem o "$").
//
// Não há ambiente de teste na InfinitePay: os testes são feitos na conta real da loja.

const HANDLE = (process.env.INFINITEPAY_HANDLE ?? "").trim().replace(/^\$/, "");
const API = (process.env.INFINITEPAY_API_URL || "https://api.checkout.infinitepay.io").replace(/\/+$/, "");
const TEMPO_LIMITE_MS = 10_000;

export const infinitepayConfigurado = Boolean(HANDLE);

async function chamar(caminho, corpo) {
  const resposta = await fetch(`${API}${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ handle: HANDLE, ...corpo }),
    signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    cache: "no-store",
  });
  const texto = await resposta.text();
  let dados = null;
  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch {
    // resposta sem JSON: tratada abaixo
  }
  if (!resposta.ok) {
    throw new Error(`InfinitePay ${caminho} respondeu ${resposta.status}: ${texto.slice(0, 300)}`);
  }
  return dados ?? {};
}

/**
 * Cria o link de pagamento (POST /links). O valor vai em CENTAVOS, num item só ("Pedido nº X").
 * @returns {Promise<{ url: string, slug: string | null }>}
 */
export async function criarLinkPagamento({ orderNsu, valorCentavos, descricao, cliente, redirectUrl, webhookUrl }) {
  const dados = await chamar("/links", {
    order_nsu: orderNsu,
    redirect_url: redirectUrl,
    webhook_url: webhookUrl,
    items: [{ quantity: 1, price: valorCentavos, description: descricao }],
    ...(cliente?.nome ? { customer: { name: cliente.nome, ...(cliente.telefone ? { phone_number: cliente.telefone } : {}) } } : {}),
  });
  const url = dados.url ?? dados.payment_url ?? dados.checkout_url;
  if (typeof url !== "string" || !url.startsWith("https://")) {
    throw new Error(`InfinitePay /links sem link na resposta: ${JSON.stringify(dados).slice(0, 300)}`);
  }
  return { url, slug: dados.slug ?? dados.invoice_slug ?? null };
}

/**
 * Consulta OFICIAL do pagamento (POST /payment_check). É a ÚNICA coisa que confirma um pagamento:
 * o webhook não é assinado e os parâmetros da URL de retorno podem ser forjados.
 * @returns {Promise<{ success?: boolean, paid?: boolean, amount?: number, paid_amount?: number,
 *   installments?: number, capture_method?: string }>}
 */
export async function consultarPagamento({ orderNsu, transactionNsu, slug }) {
  return chamar("/payment_check", { order_nsu: orderNsu, transaction_nsu: transactionNsu, slug });
}
