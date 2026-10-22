import { timingSafeEqual } from "node:crypto";
import { mensagemLembretePagamento } from "@/lib/mensagemWhatsapp";
import { enviarLembrete } from "@/lib/notificacoes";
import { criarSupabaseServidor, supabaseServidorConfigurado } from "@/lib/supabase-servidor";

// Lembretes de pagamento enviados pelo SERVIDOR (WhatsApp/SMS no futuro).
// ESTRUTURA DESLIGADA: só funciona com CRON_SECRET e SUPABASE_SECRET_KEY definidos, e só envia de
// verdade quando lib/notificacoes.js tiver um provedor. Precisa de um cron externo a cada 30 min
// (ver README). Não vai no vercel.json: o plano grátis da Vercel só roda cron 1x/dia.
//
// Chamada: GET ou POST com o header  Authorization: Bearer <CRON_SECRET>

function autorizado(request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return false;
  const recebido = Buffer.from(request.headers.get("authorization") ?? "");
  const esperado = Buffer.from(`Bearer ${segredo}`);
  return recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
}

async function processar(request) {
  if (!process.env.CRON_SECRET || !supabaseServidorConfigurado) {
    return Response.json({ erro: "Lembretes do servidor desligados (faltam variáveis)." }, { status: 503 });
  }
  if (!autorizado(request)) {
    return Response.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const supabase = criarSupabaseServidor();
  const { data: pedidos, error } = await supabase.rpc("pedidos_para_lembrete");
  if (error) {
    console.error("[lembretes-pagamento] pedidos_para_lembrete:", error.message);
    return Response.json({ erro: "Falha ao buscar pedidos." }, { status: 500 });
  }

  const resultado = { encontrados: pedidos?.length ?? 0, enviados: 0, nao_enviados: 0, falhas: 0 };
  for (const pedido of pedidos ?? []) {
    try {
      const mensagem = mensagemLembretePagamento({ numero: pedido.numero, total: pedido.total });
      const { enviado } = await enviarLembrete(pedido.telefone, mensagem);
      if (!enviado) {
        resultado.nao_enviados += 1;
        continue;
      }
      const { error: erroRegistro } = await supabase.rpc("registrar_lembrete", { p_pedido_id: pedido.numero });
      if (erroRegistro) throw new Error(erroRegistro.message);
      resultado.enviados += 1;
    } catch (e) {
      resultado.falhas += 1;
      console.error(`[lembretes-pagamento] pedido ${pedido.numero}:`, e.message);
    }
  }
  return Response.json(resultado);
}

export async function GET(request) {
  return processar(request);
}

export async function POST(request) {
  return processar(request);
}
