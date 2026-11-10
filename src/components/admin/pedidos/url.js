// Estado da tela de pedidos guardado na URL (aba, filtros, página e pedido aberto):
// recarregar a página ou compartilhar o link mantém tudo.

import { ABA_PADRAO, ABAS } from "@/lib/admin/pedidos";

export const CHAVES_FILTRO = ["periodo", "de", "ate", "status", "quando", "tipo", "pagamento", "forma", "origem", "modo", "busca"];

const data = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v ?? "") ? v : "");

export function lerEstado(sp) {
  const aba = ABAS.some((a) => a.id === sp.get("aba")) ? sp.get("aba") : ABA_PADRAO;
  const pagina = Math.max(0, Number.parseInt(sp.get("pagina") ?? "0", 10) || 0);
  const pedido = /^\d{1,12}$/.test(sp.get("pedido") ?? "") ? Number(sp.get("pedido")) : null;
  const filtros = {
    periodo: sp.get("periodo") ?? "",
    de: data(sp.get("de")),
    ate: data(sp.get("ate")),
    status: (sp.get("status") ?? "").split(",").filter(Boolean),
    quando: sp.get("quando") ?? "",
    tipo: sp.get("tipo") ?? "",
    pagamento: sp.get("pagamento") ?? "",
    forma: sp.get("forma") ?? "",
    origem: sp.get("origem") ?? "",
    modo: sp.get("modo") ?? "",
    busca: sp.get("busca") ?? "",
  };
  return { aba, pagina, pedido, filtros };
}

/** Quantos filtros (fora a busca) estão ligados. */
export function contarFiltros(f) {
  return ["periodo", "quando", "tipo", "pagamento", "forma", "origem", "modo"].filter((k) => f[k]).length + (f.status.length ? 1 : 0);
}

/**
 * Nova query a partir da atual. `null`/"" remove a chave; arrays viram "a,b".
 * Mudar aba ou filtro volta para a página 1.
 */
export function montarQuery(sp, mudancas) {
  const params = new URLSearchParams(sp.toString());
  for (const [chave, valor] of Object.entries(mudancas)) {
    const texto = Array.isArray(valor) ? valor.join(",") : valor === null || valor === undefined ? "" : String(valor);
    if (texto) params.set(chave, texto);
    else params.delete(chave);
  }
  if (Object.keys(mudancas).some((k) => k === "aba" || CHAVES_FILTRO.includes(k))) params.delete("pagina");
  if (params.get("aba") === ABA_PADRAO) params.delete("aba");
  return params.toString();
}
