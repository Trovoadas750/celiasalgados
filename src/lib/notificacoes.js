import "server-only";

// Envio de lembretes ao cliente (WhatsApp/SMS). SÓ SERVIDOR: a chave do provedor fica aqui.
//
// TODO(provedor): integrar um provedor de WhatsApp/SMS (ex.: API oficial do WhatsApp Business, Twilio,
// Z-API). Ler a chave de uma variável SEM NEXT_PUBLIC_, enviar e devolver { enviado: true }.
// Enquanto não houver provedor, nada é enviado e a rota não registra o lembrete no banco
// (assim `lembretes_enviados` só conta envios de verdade).

/**
 * @param {string} telefone  só dígitos, com DDD (ex.: "14999990001")
 * @param {string} mensagem
 * @returns {Promise<{ enviado: boolean, motivo?: string }>}
 */
export async function enviarLembrete(telefone, mensagem) {
  console.log(`[lembrete-pagamento] (sem provedor) para ${telefone}: ${mensagem}`);
  return { enviado: false, motivo: "sem_provedor" };
}
