import { infinitepayConfigurado } from "@/lib/infinitepay";
import { conferirERegistrar, registrarEvento, urlDoSite } from "@/lib/pagamentoServidor";
import { criarSupabaseServidor, supabaseServidorConfigurado } from "@/lib/supabaseServidor";

// GET /api/pagamentos/retorno: a InfinitePay devolve o cliente aqui depois do pagamento, com
// ?order_nsu, transaction_nsu, slug, capture_method e receipt_url.
//
// Esses parâmetros podem ser forjados: servem só para saber o que conferir. A confirmação vem do
// payment_check oficial. No fim, manda o cliente para "Meus pedidos" com o resultado na URL.

// Resultado do banco/conferência → aviso mostrado em /pedidos (components/pagamento/AvisoRetornoPagamento.js).
const AVISO = {
  confirmado: "confirmado",
  ja_registrado: "confirmado",
  pendente: "pendente",
  revisar: "revisar",
};

export async function GET(request) {
  const site = urlDoSite(request);
  const voltar = (aviso, pedidoId) => {
    const destino = new URL("/pedidos", site);
    destino.searchParams.set("pagamento", aviso);
    if (pedidoId) destino.searchParams.set("pedido", String(pedidoId));
    return Response.redirect(destino, 303);
  };

  if (!infinitepayConfigurado || !supabaseServidorConfigurado) return voltar("pendente");

  const params = new URL(request.url).searchParams;
  const supabase = criarSupabaseServidor();
  try {
    const { resultado, pedidoId } = await conferirERegistrar(supabase, {
      orderNsu: params.get("order_nsu"),
      transactionNsu: params.get("transaction_nsu"),
      slug: params.get("slug"),
      receiptUrl: params.get("receipt_url"),
    });
    await registrarEvento(supabase, {
      origem: "retorno",
      payload: { order_nsu: params.get("order_nsu"), capture_method: params.get("capture_method") },
      resultado: `resultado: ${resultado}`,
      pedidoId,
    });
    return voltar(AVISO[resultado] ?? "problema", pedidoId);
  } catch (e) {
    console.error("[api/pagamentos/retorno]", e.message);
    await registrarEvento(supabase, { origem: "erro", resultado: `retorno: ${e.message}` });
    // O webhook ainda pode confirmar depois; o cliente vê o status em tempo real em "Meus pedidos".
    return voltar("pendente");
  }
}
