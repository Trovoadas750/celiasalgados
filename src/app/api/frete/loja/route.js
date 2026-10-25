import { createClient } from "@supabase/supabase-js";
import { geocodificar, separarEnderecoLoja } from "@/lib/geoapify";
import { criarSupabaseServidor, supabaseServidorConfigurado } from "@/lib/supabaseServidor";

// POST /api/frete/loja  (header Authorization: Bearer <access token do admin>)
// Geocodifica o endereço da loja (config_loja) e devolve { lat, lng, formatado } SEM salvar.
// O admin confere no mapa e salva pela tela (UPDATE em config_loja, que o RLS só permite ao admin).

async function ehAdmin(token) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await supabase.rpc("sou_admin");
  return !error && data === true;
}

export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token || !(await ehAdmin(token))) {
      return Response.json({ erro: "Apenas o admin pode fazer isso." }, { status: 403 });
    }
    if (!supabaseServidorConfigurado) {
      return Response.json({ erro: "SUPABASE_SECRET_KEY não definida no servidor." }, { status: 500 });
    }

    const supabase = criarSupabaseServidor();
    const { data: config, error } = await supabase.from("config_loja").select("endereco, cep").eq("id", 1).maybeSingle();
    if (error || !config) return Response.json({ erro: "Não foi possível ler os dados da loja." }, { status: 500 });

    const { rua, numero } = separarEnderecoLoja(config.endereco);
    const geo = await geocodificar({ rua, numero, cep: config.cep });
    if (geo.status === "encontrado") return Response.json({ lat: geo.lat, lng: geo.lng, formatado: geo.formatado });
    if (geo.status === "nao_encontrado") {
      return Response.json({ erro: "A Geoapify não encontrou o endereço da loja. Preencha as coordenadas à mão." }, { status: 404 });
    }
    return Response.json({ erro: "Não foi possível consultar agora. Tente de novo em instantes." }, { status: 503 });
  } catch (e) {
    console.error("[api/frete/loja]", e.message);
    return Response.json({ erro: "Erro inesperado." }, { status: 500 });
  }
}
