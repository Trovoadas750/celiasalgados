"use client";

import { useEffect, useState } from "react";
import { getSupabase, supabaseConfigurado } from "./supabase";

// Dados da loja em `config_loja` (leitura pública): endereço usado na retirada.
// As coordenadas não são lidas aqui: o navegador não precisa delas.

let promessa = null; // uma leitura por visita

export function buscarEnderecoLoja() {
  if (!supabaseConfigurado) return Promise.resolve(null);
  promessa ??= getSupabase()
    .from("config_loja")
    .select("endereco, cidade, uf, cep")
    .eq("id", 1)
    .maybeSingle()
    .then(({ data, error }) => {
      if (error || !data) {
        promessa = null; // tenta de novo na próxima vez
        return null;
      }
      const cep = String(data.cep ?? "").replace(/\D/g, "");
      const cepFormatado = cep.length === 8 ? ` · CEP ${cep.slice(0, 5)}-${cep.slice(5)}` : "";
      return `${data.endereco} · ${data.cidade}-${data.uf}${cepFormatado}`;
    });
  return promessa;
}

/** "Rua Miguel de Moraes, 377 - Jardim Europa · Ourinhos-SP · CEP 19914-300" (null enquanto carrega). */
export function useEnderecoLoja() {
  const [endereco, setEndereco] = useState(null);
  useEffect(() => {
    let ativo = true;
    buscarEnderecoLoja().then((e) => ativo && setEndereco(e));
    return () => {
      ativo = false;
    };
  }, []);
  return endereco;
}
