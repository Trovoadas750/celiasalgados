import { geocodificar } from "@/lib/geoapify";
import { criarSupabaseServidor, supabaseServidorConfigurado } from "@/lib/supabaseServidor";
import { REGRAS, soDigitos } from "@/lib/validacao";

// POST /api/frete  { rua, numero, vila, cep? }  →  { status, valor?, distancia_km? }
//
// 1. Cache do banco (buscar_geocodificacao). Se o endereço já foi visto, o frete sai do banco
//    (calcular_frete) sem gastar requisição da Geoapify.
// 2. Senão, geocodifica UMA vez e grava (registrar_geocodificacao), que já devolve o frete.
// O BANCO calcula distância e valor. A resposta nunca leva coordenadas, endereço formatado nem chaves.
// (Sem `runtime`/`dynamic`: com cacheComponents o Next 16 não aceita esses exports; POST já é dinâmico.)

const LIMITE_POR_MINUTO = 10;
const chamadasPorIp = new Map(); // ip -> horários (ms) das chamadas do último minuto

// Limite simples em memória. Na Vercel cada instância tem o seu Map: é proteção básica, não garantia.
function excedeuLimite(ip) {
  const agora = Date.now();
  const recentes = (chamadasPorIp.get(ip) ?? []).filter((t) => agora - t < 60_000);
  recentes.push(agora);
  chamadasPorIp.set(ip, recentes);
  if (chamadasPorIp.size > 5000) {
    for (const [chave, tempos] of chamadasPorIp) if (tempos.every((t) => agora - t >= 60_000)) chamadasPorIp.delete(chave);
  }
  return recentes.length > LIMITE_POR_MINUTO;
}

function ipDe(request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "local";
}

function validarCorpo(corpo) {
  const endereco = {
    rua: String(corpo?.rua ?? "").trim(),
    numero: String(corpo?.numero ?? "").trim(),
    vila: String(corpo?.vila ?? "").trim(),
    cep: soDigitos(corpo?.cep),
  };
  const erro = REGRAS.rua(endereco.rua) || REGRAS.numero(endereco.numero) || REGRAS.vila(endereco.vila) || REGRAS.cep(endereco.cep);
  return { endereco, erro };
}

// Só o que o navegador pode ver.
function respostaFrete(frete) {
  const status = frete?.status ?? "erro_temporario";
  if (status !== "ok") return { status };
  return { status, valor: Number(frete.valor), distancia_km: Number(frete.distancia_km) };
}

export async function POST(request) {
  try {
    if (excedeuLimite(ipDe(request))) {
      return Response.json({ status: "erro_temporario", mensagem: "Muitas tentativas, aguarde um minuto." }, { status: 429 });
    }

    let corpo;
    try {
      corpo = await request.json();
    } catch {
      return Response.json({ status: "invalido", mensagem: "Envie rua, número e vila." }, { status: 400 });
    }
    const { endereco, erro } = validarCorpo(corpo);
    if (erro) return Response.json({ status: "invalido", mensagem: erro }, { status: 400 });

    if (!supabaseServidorConfigurado) {
      console.error("[api/frete] SUPABASE_SECRET_KEY não definida.");
      return Response.json({ status: "erro_temporario" }, { status: 500 });
    }
    const supabase = criarSupabaseServidor();
    const chave = { p_rua: endereco.rua, p_numero: endereco.numero, p_vila: endereco.vila };

    // 1. Já está no cache? O frete sai direto do banco.
    const cache = await supabase.rpc("buscar_geocodificacao", chave);
    if (cache.error) throw new Error(`buscar_geocodificacao: ${cache.error.message}`);
    if (cache.data?.existe) {
      const frete = await supabase.rpc("calcular_frete", chave);
      if (frete.error) throw new Error(`calcular_frete: ${frete.error.message}`);
      return Response.json(respostaFrete(frete.data));
    }

    // 2. Primeira vez: geocodifica (com a loja como referência de proximidade) e grava.
    const { data: config } = await supabase.from("config_loja").select("loja_lat, loja_lng").eq("id", 1).maybeSingle();
    const geo = await geocodificar(endereco, { lat: config?.loja_lat, lng: config?.loja_lng });
    if (geo.status === "erro_temporario") return Response.json({ status: "erro_temporario" });

    const encontrado = geo.status === "encontrado";
    const registro = await supabase.rpc("registrar_geocodificacao", {
      ...chave,
      p_encontrado: encontrado,
      p_lat: encontrado ? geo.lat : null,
      p_lng: encontrado ? geo.lng : null,
      p_endereco_formatado: encontrado ? geo.formatado : null,
    });
    if (registro.error) throw new Error(`registrar_geocodificacao: ${registro.error.message}`);
    return Response.json(respostaFrete(registro.data));
  } catch (e) {
    console.error("[api/frete]", e.message);
    return Response.json({ status: "erro_temporario" }, { status: 500 });
  }
}
