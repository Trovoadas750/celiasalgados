import { connection } from "next/server";
import { criarLinkPagamento, infinitepayConfigurado } from "@/lib/infinitepay";
import { registrarEvento, urlDoSite } from "@/lib/pagamentoServidor";
import { criarSupabaseServidor, supabaseServidorConfigurado } from "@/lib/supabaseServidor";

// Pagamento online do agendamento (InfinitePay: Pix ou cartão de crédito).
//
// GET  /api/pagamentos                      → { online: boolean }  (o modal decide: link ou WhatsApp)
// POST /api/pagamentos  { pedidoId }        → { url }  link de pagamento da InfinitePay
//      Header: Authorization: Bearer <access_token do cliente logado>
//
// Fluxo: preparar_cobranca (banco valida dono, prazo e valor) → POST /links na InfinitePay →
// salvar_link_cobranca. Cliques repetidos reaproveitam o mesmo link.
// Quem confirma o pagamento: /api/pagamentos/webhook e /api/pagamentos/retorno (sempre via payment_check).

const online = () => infinitepayConfigurado && supabaseServidorConfigurado;

export async function GET() {
  await connection(); // responde na hora da requisição (não vira arquivo estático no build)
  return Response.json({ online: online() });
}

export async function POST(request) {
  if (!online()) {
    return Response.json({ erro: "Pagamento online ainda não está disponível." }, { status: 503 });
  }

  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  let corpo;
  try {
    corpo = await request.json();
  } catch {
    corpo = null;
  }
  const pedidoId = Number(corpo?.pedidoId);
  if (!token) return Response.json({ erro: "Entre na sua conta para pagar." }, { status: 401 });
  if (!Number.isInteger(pedidoId) || pedidoId <= 0) return Response.json({ erro: "Pedido inválido." }, { status: 400 });

  const supabase = criarSupabaseServidor();
  try {
    // Quem é o cliente: sempre pela sessão conferida no Supabase, nunca por um id enviado pelo navegador.
    const { data: sessao, error: erroSessao } = await supabase.auth.getUser(token);
    if (erroSessao || !sessao?.user) return Response.json({ erro: "Sua sessão expirou. Entre de novo para pagar." }, { status: 401 });

    const preparo = await supabase.rpc("preparar_cobranca", { p_pedido_id: pedidoId, p_cliente_id: sessao.user.id });
    if (preparo.error) {
      // P0001: regra do banco, mensagem pronta para o cliente (prazo, já pago...).
      if (preparo.error.code === "P0001") return Response.json({ erro: preparo.error.message }, { status: 400 });
      throw new Error(`preparar_cobranca: ${preparo.error.message}`);
    }
    const cobranca = preparo.data;
    if (cobranca.reaproveitada) return Response.json({ url: cobranca.checkout_url });

    const site = urlDoSite(request);
    let link;
    try {
      link = await criarLinkPagamento({
        orderNsu: cobranca.order_nsu,
        valorCentavos: cobranca.valor_centavos,
        descricao: cobranca.descricao,
        cliente: { nome: cobranca.cliente_nome, telefone: cobranca.cliente_telefone },
        redirectUrl: `${site}/api/pagamentos/retorno`,
        webhookUrl: `${site}/api/pagamentos/webhook`,
      });
    } catch (e) {
      await registrarEvento(supabase, { origem: "erro", resultado: e.message, cobrancaId: cobranca.cobranca_id, pedidoId });
      throw e;
    }

    const salvo = await supabase.rpc("salvar_link_cobranca", {
      p_cobranca_id: cobranca.cobranca_id,
      p_checkout_url: link.url,
      p_invoice_slug: link.slug,
    });
    if (salvo.error) throw new Error(`salvar_link_cobranca: ${salvo.error.message}`);
    await registrarEvento(supabase, {
      origem: "criacao",
      payload: { valor_centavos: cobranca.valor_centavos, slug: link.slug },
      resultado: "link criado",
      cobrancaId: cobranca.cobranca_id,
      pedidoId,
    });
    return Response.json({ url: link.url });
  } catch (e) {
    console.error("[api/pagamentos]", e.message);
    return Response.json({ erro: "Não foi possível gerar o link de pagamento agora. Tente de novo em instantes." }, { status: 502 });
  }
}
