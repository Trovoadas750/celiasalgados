"use client";

import { useCallback, useEffect, useState } from "react";
import { buscarMeusPedidos } from "@/lib/conta";

// Carrega os pedidos do cliente logado. `usuarioId` null = não busca nada.
export function useMeusPedidos(usuarioId, porPagina = 20) {
  const [resultado, setResultado] = useState({ pedidos: [], erro: null, carregando: true, de: null });

  const carregar = useCallback(async () => {
    if (!usuarioId) return;
    const { pedidos, erro } = await buscarMeusPedidos(usuarioId, { porPagina });
    setResultado({ pedidos, erro, carregando: false, de: usuarioId });
  }, [usuarioId, porPagina]);

  useEffect(() => {
    if (!usuarioId) return;
    let ativo = true;
    buscarMeusPedidos(usuarioId, { porPagina }).then(({ pedidos, erro }) => {
      if (ativo) setResultado({ pedidos, erro, carregando: false, de: usuarioId });
    });
    return () => {
      ativo = false;
    };
  }, [usuarioId, porPagina]);

  // Ignora o resultado de outro usuário (troca de conta) enquanto o novo carrega.
  const doUsuario = resultado.de === usuarioId;
  return {
    pedidos: doUsuario ? resultado.pedidos : [],
    erro: doUsuario ? resultado.erro : null,
    carregando: !doUsuario,
    recarregar: carregar,
  };
}
