import { infinitepayConfigurado } from "@/lib/infinitepay";
import { conferirERegistrar, registrarEvento } from "@/lib/pagamentoServidor";
import { criarSupabaseServidor, supabaseServidorConfigurado } from "@/lib/supabaseServidor";

// POST /api/pagamentos/webhook: aviso da InfinitePay quando um pagamento é aprovado.
//
// O aviso NÃO é assinado: o conteúdo dele nunca confirma nada sozinho. Ele só diz QUAL cobrança
// conferir; a confirmação vem do payment_check oficial (lib/pagamentoServidor.js).
//
// Respostas: 200 = recebido (não reenviar) · 400 = a InfinitePay tenta de novo mais tarde.

export async function POST(request) {
  if (!infinitepayConfigurado || !supabaseServidorConfigurado) {
    return Response.json({ erro: "Pagamento online desligado." }, { status: 503 });
  }

  let aviso;
  try {
    aviso = await request.json();
  } catch {
    return Response.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const supabase = criarSupabaseServidor();
  // Log só com os campos esperados (nada de dados de cartão).
  const resumoAviso = {
    order_nsu: aviso?.order_nsu ?? null,
    transaction_nsu: aviso?.transaction_nsu ?? null,
    invoice_slug: aviso?.invoice_slug ?? null,
    amount: aviso?.amount ?? null,
    paid_amount: aviso?.paid_amount ?? null,
    installments: aviso?.installments ?? null,
    capture_method: aviso?.capture_method ?? null,
  };
  await registrarEvento(supabase, { origem: "webhook", payload: resumoAviso, resultado: "recebido" });

  try {
    const { resultado, pedidoId } = await conferirERegistrar(supabase, {
      orderNsu: aviso?.order_nsu,
      transactionNsu: aviso?.transaction_nsu,
      slug: aviso?.invoice_slug ?? aviso?.slug,
      receiptUrl: aviso?.receipt_url,
    });
    await registrarEvento(supabase, { origem: "webhook", resultado: `resultado: ${resultado}`, pedidoId });

    // Ainda não consta como pago na consulta oficial: pede para reenviar mais tarde.
    if (resultado === "pendente") return Response.json({ resultado }, { status: 400 });
    // Aviso que não é de uma cobrança nossa (ou incompleto): 200 para não ficar reenviando.
    return Response.json({ resultado });
  } catch (e) {
    console.error("[api/pagamentos/webhook]", e.message);
    await registrarEvento(supabase, { origem: "erro", resultado: `webhook: ${e.message}` });
    return Response.json({ erro: "Falha temporária." }, { status: 400 }); // a InfinitePay reenvia
  }
}
