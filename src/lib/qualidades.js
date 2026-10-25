// Para o cliente, os sabores dos pacotes se chamam "qualidades".
// Textos que vêm do banco (descrição dos pacotes, mensagens de erro) ainda podem dizer "sabor(es)";
// esta função troca a palavra antes de mostrar na tela.
export function comQualidades(texto) {
  if (!texto) return texto;
  return texto
    .replace(/\bUm dos sabores escolhidos\b/g, "Uma das qualidades escolhidas")
    .replace(/\bum dos sabores escolhidos\b/g, "uma das qualidades escolhidas")
    .replace(/\bsabores escolhidos\b/g, "qualidades escolhidas")
    .replace(/\bSabores\b/g, "Qualidades")
    .replace(/\bsabores\b/g, "qualidades")
    .replace(/\bSabor\b/g, "Qualidade")
    .replace(/\bsabor\b/g, "qualidade");
}
