"use client";

import { useCallback, useEffect, useState } from "react";
import { DESFAZER_MS } from "@/lib/admin/config";
import { linkWhatsappCliente, mensagemParaCliente } from "@/lib/admin/mensagens";
import { buscarEnderecoLoja, mudarStatus, mudarStatusEmLote } from "@/lib/admin/pedidos";
import { rotuloStatus } from "@/lib/admin/status";
import { enderecoDoSite } from "@/lib/loja";
import { linkAcompanhamento } from "@/lib/mensagemWhatsapp";
import { useAdmin } from "../AdminProvider";
import { useToast } from "../Toasts";

/** Endereço da loja (para "pronto para retirada na ..."). */
export function useEnderecoLojaAdmin() {
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

/** Link público de acompanhamento do pedido (ou null sem código). */
export function linkDoPedido(pedido) {
  return linkAcompanhamento(pedido.codigo_acompanhamento, enderecoDoSite());
}

/** Link do WhatsApp com a mensagem "saiu para entrega" / "pronto para retirada". */
export function linkAvisoSaida(pedido, enderecoLoja) {
  const id = pedido.tipo_entrega === "retirada" ? "pronto" : "saiu";
  return linkWhatsappCliente(pedido.telefone, mensagemParaCliente(id, pedido, { link: linkDoPedido(pedido), enderecoLoja }));
}

/**
 * Muda o status com aviso + "Desfazer" (5 s). Ao marcar "Saiu para entrega"/"Pronto para retirar",
 * oferece na hora "Avisar cliente no WhatsApp".
 * @param {() => void} aoMudar  recarrega a tela
 */
export function useMudarStatus(aoMudar) {
  const { mostrar } = useToast();
  const { sessaoExpirou } = useAdmin();
  const enderecoLoja = useEnderecoLojaAdmin();

  const falhou = useCallback(
    (erro) => {
      if (erro.sessaoExpirada) sessaoExpirou();
      mostrar({ tipo: "erro", texto: erro.message, duracao: 8000 });
    },
    [mostrar, sessaoExpirou],
  );

  const mudar = useCallback(
    async (pedido, novo) => {
      const anterior = pedido.status;
      try {
        await mudarStatus(pedido.id, novo);
      } catch (erro) {
        falhou(erro);
        return false;
      }
      aoMudar?.();
      mostrar({
        texto: `Pedido nº ${pedido.id}: ${rotuloStatus(novo, pedido.tipo_entrega)}`,
        duracao: DESFAZER_MS,
        acoes: [
          {
            rotulo: "Desfazer",
            onClick: async () => {
              try {
                await mudarStatus(pedido.id, anterior);
                mostrar({ texto: `Pedido nº ${pedido.id} voltou para "${rotuloStatus(anterior, pedido.tipo_entrega)}".` });
                aoMudar?.();
              } catch (erro) {
                falhou(erro);
              }
            },
          },
        ],
      });
      if (novo === "saiu_para_entrega") {
        mostrar({
          tipo: "aviso",
          texto: `Avisar ${pedido.nome} que o pedido nº ${pedido.id} ${pedido.tipo_entrega === "retirada" ? "está pronto" : "saiu"}?`,
          duracao: 20000,
          acoes: [{ rotulo: "Avisar cliente no WhatsApp", href: linkAvisoSaida(pedido, enderecoLoja) }],
        });
      }
      return true;
    },
    [aoMudar, enderecoLoja, falhou, mostrar],
  );

  /** Vários pedidos para o mesmo status (cada um volta ao seu status anterior no "Desfazer"). */
  const mudarVarios = useCallback(
    async (pedidos, novo) => {
      try {
        await mudarStatusEmLote(
          pedidos.map((p) => p.id),
          novo,
        );
      } catch (erro) {
        falhou(erro);
        return false;
      }
      aoMudar?.();
      mostrar({
        texto: `${pedidos.length} pedido(s): ${rotuloStatus(novo, "entrega")}`,
        duracao: DESFAZER_MS,
        acoes: [
          {
            rotulo: "Desfazer",
            onClick: async () => {
              try {
                await Promise.all(pedidos.map((p) => mudarStatus(p.id, p.status)));
                mostrar({ texto: "Status desfeito." });
                aoMudar?.();
              } catch (erro) {
                falhou(erro);
              }
            },
          },
        ],
      });
      return true;
    },
    [aoMudar, falhou, mostrar],
  );

  return { mudar, mudarVarios, enderecoLoja };
}
