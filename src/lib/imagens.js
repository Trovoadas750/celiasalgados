// Imagens dos produtos, definidas no código (a coluna `produtos.imagem_url` do banco NÃO é usada).
// Arquivos em public/produtos/.

// Pacotes, pelo nº de salgados (salgados_a_escolher), que não muda se o nome do pacote mudar.
const IMAGEM_PACOTE = {
  30: "/produtos/enroladosalsisha.webp",
  50: "/produtos/pastelzinho.webp",
  100: "/produtos/kibes.webp",
};

/** Caminho da imagem do produto, ou null (o site mostra o placeholder). Refrigerantes não têm imagem. */
export function imagemDoProduto(produto) {
  if (produto?.categoria === "kit") return IMAGEM_PACOTE[produto.salgados_a_escolher] ?? null;
  return null;
}
