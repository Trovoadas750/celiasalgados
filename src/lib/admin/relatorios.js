// Relatórios: períodos e séries para os gráficos (funções puras; testes em relatorios.test.js).
// Os números vêm do admin_resumo (banco); aqui só se organiza para exibir.

import { somarDias } from "./datas.js";

export const PERIODOS = [
  ["hoje", "Hoje"],
  ["ontem", "Ontem"],
  ["7dias", "Últimos 7 dias"],
  ["mes", "Este mês"],
  ["mes_passado", "Mês passado"],
  ["intervalo", "Escolher datas"],
];

const DATA = /^\d{4}-\d{2}-\d{2}$/;

/** Primeiro dia do mês de `data` ("2026-10-23" -> "2026-10-01"). */
const inicioDoMes = (data) => `${data.slice(0, 8)}01`;

/**
 * [de, ate] (inclusive) do período. Intervalo inválido cai em "últimos 7 dias".
 * O banco aceita até 1 ano; um intervalo maior é cortado no último ano.
 */
export function intervaloRelatorio(periodo, hoje, de, ate) {
  switch (periodo) {
    case "hoje":
      return [hoje, hoje];
    case "ontem":
      return [somarDias(hoje, -1), somarDias(hoje, -1)];
    case "mes":
      return [inicioDoMes(hoje), hoje];
    case "mes_passado": {
      const fim = somarDias(inicioDoMes(hoje), -1);
      return [inicioDoMes(fim), fim];
    }
    case "intervalo":
      if (DATA.test(de ?? "")) {
        let fim = DATA.test(ate ?? "") && ate >= de ? ate : de;
        if (fim > somarDias(de, 365)) fim = somarDias(de, 365);
        return [de, fim];
      }
      return [somarDias(hoje, -6), hoje];
    default:
      return [somarDias(hoje, -6), hoje];
  }
}

const n = (v) => Number(v ?? 0) || 0;
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/**
 * Faturamento ao longo do período, com os dias sem venda em zero.
 * Até 62 dias: uma barra por dia ("23/10"); acima disso, uma por mês ("out/26").
 * @returns {{ chave: string, rotulo: string, valor: number, pedidos: number }[]}
 */
export function serieFaturamento(porDia = [], de, ate) {
  const doBanco = new Map(porDia.map((d) => [String(d.dia).slice(0, 10), d]));
  const dias = [];
  for (let d = de; d <= ate; d = somarDias(d, 1)) {
    const linha = doBanco.get(d);
    dias.push({ chave: d, rotulo: `${d.slice(8, 10)}/${d.slice(5, 7)}`, valor: n(linha?.faturamento), pedidos: n(linha?.pedidos) });
  }
  if (dias.length <= 62) return dias;
  const meses = new Map();
  for (const d of dias) {
    const chave = d.chave.slice(0, 7);
    const atual = meses.get(chave) ?? { chave, rotulo: `${MESES[Number(chave.slice(5, 7)) - 1]}/${chave.slice(2, 4)}`, valor: 0, pedidos: 0 };
    atual.valor += d.valor;
    atual.pedidos += d.pedidos;
    meses.set(chave, atual);
  }
  return [...meses.values()];
}

/** Pedidos por hora do dia, da primeira à última hora com pedido (horas vazias no meio em zero). */
export function seriePorHora(porHora = []) {
  const com = porHora.map((h) => ({ hora: Number(h.hora), pedidos: n(h.pedidos) })).filter((h) => h.pedidos > 0);
  if (com.length === 0) return [];
  const min = Math.min(...com.map((h) => h.hora));
  const max = Math.max(...com.map((h) => h.hora));
  const mapa = new Map(com.map((h) => [h.hora, h.pedidos]));
  const serie = [];
  for (let h = min; h <= max; h++) serie.push({ chave: String(h), rotulo: `${String(h).padStart(2, "0")}h`, valor: mapa.get(h) ?? 0 });
  return serie;
}

/** { site: 3, admin: 1 } ou { site: { pedidos, valor } } -> { pedidos, valor } */
export function contagem(valor) {
  if (valor && typeof valor === "object") return { pedidos: n(valor.pedidos), valor: n(valor.valor ?? valor.faturamento) };
  return { pedidos: n(valor), valor: null };
}

/** Deixa o retorno do admin_resumo com números (o Postgres manda numeric como texto). */
export function normalizarResumo(r = {}) {
  return {
    pedidos: n(r.pedidos),
    faturamento: n(r.faturamento),
    frete: n(r.frete),
    ticketMedio: n(r.ticket_medio),
    cancelados: n(r.cancelados),
    aguardando: { pedidos: n(r.aguardando_pagamento?.pedidos), valor: n(r.aguardando_pagamento?.valor) },
    clientesNovos: n(r.clientes_novos),
    porDia: r.por_dia ?? [],
    porHora: r.por_hora ?? [],
    porTipo: { entrega: contagem(r.por_tipo_entrega?.entrega), retirada: contagem(r.por_tipo_entrega?.retirada) },
    porPagamento: (r.por_pagamento ?? []).map((p) => ({ forma: p.forma, pedidos: n(p.pedidos), valor: n(p.valor) })),
    porOrigem: { site: contagem(r.por_origem?.site), admin: contagem(r.por_origem?.admin) },
    topProdutos: (r.top_produtos ?? []).map((p) => ({ nome: p.nome, quantidade: n(p.quantidade), valor: n(p.valor) })),
    topSabores: (r.top_sabores ?? []).map((p) => ({ nome: p.nome, quantidade: n(p.quantidade) })),
  };
}
