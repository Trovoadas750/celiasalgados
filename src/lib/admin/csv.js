// CSV para abrir no Excel/Planilhas em português: separador ";", vírgula decimal e BOM UTF-8.

import { formatarValor } from "../formatar.js";

function celula(valor) {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor);
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/**
 * @param {{ titulo: string, valor: (linha: any) => any }[]} colunas
 * @param {any[]} linhas
 */
export function gerarCsv(colunas, linhas) {
  const cabecalho = colunas.map((c) => celula(c.titulo)).join(";");
  const corpo = linhas.map((l) => colunas.map((c) => celula(c.valor(l))).join(";"));
  return `﻿${[cabecalho, ...corpo].join("\r\n")}`;
}

/** 113.8 -> "113,80" (número para planilha, sem "R$") */
export const valorCsv = (v) => (v === null || v === undefined || v === "" ? "" : formatarValor(v));

/** Baixa o texto como arquivo (só no navegador). */
export function baixarCsv(nomeArquivo, texto) {
  const url = URL.createObjectURL(new Blob([texto], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
