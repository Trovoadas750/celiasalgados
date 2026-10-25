// Frete no navegador: só envia o ENDEREÇO para /api/frete. Nunca envia distância, coordenadas
// ou valor: quem calcula é o banco (banco-de-dados.md, seção 1 "Frete").

import { soDigitos } from "./validacao";

/** Chave do endereço: "rua|numero|vila" em minúsculas, sem acento e sem espaços extras. */
export function chaveEndereco({ rua, numero, vila }) {
  const limpar = (t) =>
    String(t ?? "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  return `${limpar(rua)}|${limpar(numero)}|${limpar(vila)}`;
}

/**
 * @returns {Promise<{ status: "ok", valor: number } | { status: "nao_encontrado" | "fora_da_area" | "nao_configurado" | "erro_temporario" | "invalido", mensagem?: string }>}
 */
export async function calcularFrete({ rua, numero, vila, cep }, { signal } = {}) {
  try {
    const resposta = await fetch("/api/frete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rua, numero, vila, cep: soDigitos(cep) || null }),
      signal,
    });
    const dados = await resposta.json().catch(() => ({}));
    if (dados?.status === "ok") return { status: "ok", valor: Number(dados.valor) };
    return { status: dados?.status ?? "erro_temporario", mensagem: dados?.mensagem };
  } catch (e) {
    if (e.name === "AbortError") throw e;
    return { status: "erro_temporario" };
  }
}

/**
 * ViaCEP, direto do navegador. Erro ou CEP inexistente → null (o CEP é opcional).
 * @returns {Promise<{ ourinhos: boolean, rua: string, vila: string, cidade: string } | null>}
 */
export async function buscarCep(cep, { signal } = {}) {
  const d = soDigitos(cep);
  if (d.length !== 8) return null;
  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${d}/json/`, { signal });
    if (!resposta.ok) return null;
    const dados = await resposta.json();
    if (dados?.erro) return null;
    const cidade = String(dados.localidade ?? "");
    const ourinhos = cidade.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase() === "ourinhos";
    return { ourinhos, rua: dados.logradouro ?? "", vila: dados.bairro ?? "", cidade };
  } catch {
    return null;
  }
}
