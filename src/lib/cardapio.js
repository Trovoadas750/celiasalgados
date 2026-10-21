// Cardápio do site, mantido direto no código.
//
// IMPORTANTE: os pedidos são criados pela RPC `criar_pedido`, que recebe só `produto_id` + `quantidade`
// e busca nome, categoria e preço na tabela `produtos` do Supabase. Por isso:
//  - cada `id` aqui PRECISA ser o mesmo `produtos.id` do banco (e o produto precisa estar `ativo`);
//  - o `preco` daqui é só para exibir; o valor cobrado é sempre o do banco.
//    Ao mudar um preço, mude nos dois lugares para o cliente não ver um total diferente.
//
// Formato igual ao da consulta do cardápio em contextoBD.md (seção 7):
//  - categoria: "kit" | "salgado" | "refrigerante"
//  - preco: valor de 1 unidade (1 salgado, 1 kit, 1 garrafa)
//  - imagem_url: caminho dentro de /public (ex.: "/produtos/coxinha.jpg") ou null
//  - salgados_a_escolher / max_sabores / componentes: só para kits

export const PRODUTOS = [
  {
    id: 7,
    categoria: "kit",
    nome: "Kit Festa 100",
    descricao: "100 salgados fritos para você montar com seus sabores preferidos. Acompanha refrigerante 2L.",
    preco: 109.9,
    imagem_url: null,
    salgados_a_escolher: 100,
    max_sabores: 4,
    componentes: [{ quantidade: 1, produto: { id: 12, nome: "Coca-Cola 2L", categoria: "refrigerante" } }],
  },
  {
    id: 8,
    categoria: "kit",
    nome: "Kit Festa 50",
    descricao: "50 salgados fritos, ideal para aniversários pequenos e cafés da tarde.",
    preco: 54.9,
    imagem_url: null,
    salgados_a_escolher: 50,
    max_sabores: 3,
    componentes: [],
  },
  {
    id: 9,
    categoria: "kit",
    nome: "Kit Lanche",
    descricao: "Combinação pronta para dividir com a família.",
    preco: 32.0,
    imagem_url: null,
    salgados_a_escolher: 0,
    max_sabores: null,
    componentes: [
      { quantidade: 10, produto: { id: 1, nome: "Coxinha de frango", categoria: "salgado" } },
      { quantidade: 10, produto: { id: 2, nome: "Kibe", categoria: "salgado" } },
      { quantidade: 1, produto: { id: 13, nome: "Guaraná Antarctica 2L", categoria: "refrigerante" } },
    ],
  },
  {
    id: 1,
    categoria: "salgado",
    nome: "Coxinha de frango",
    descricao: "Massa macia e recheio cremoso de frango com catupiry.",
    preco: 1.0,
    imagem_url: null,
  },
  {
    id: 2,
    categoria: "salgado",
    nome: "Kibe",
    descricao: "Trigo temperado com hortelã e carne moída.",
    preco: 1.0,
    imagem_url: null,
  },
  {
    id: 3,
    categoria: "salgado",
    nome: "Bolinha de queijo",
    descricao: "Recheada com muçarela que puxa.",
    preco: 1.0,
    imagem_url: null,
  },
  {
    id: 4,
    categoria: "salgado",
    nome: "Risole de carne",
    descricao: "Meia-lua empanada com carne moída temperada.",
    preco: 1.1,
    imagem_url: null,
  },
  {
    id: 5,
    categoria: "salgado",
    nome: "Enroladinho de salsicha",
    descricao: "Massa leve envolvendo salsicha.",
    preco: 1.0,
    imagem_url: null,
  },
  {
    id: 6,
    categoria: "salgado",
    nome: "Croquete de calabresa",
    descricao: "Calabresa moída com cebola e tempero da casa.",
    preco: 1.1,
    imagem_url: null,
  },
  { id: 12, categoria: "refrigerante", nome: "Coca-Cola 2L", descricao: null, preco: 14.0, imagem_url: null },
  { id: 13, categoria: "refrigerante", nome: "Guaraná Antarctica 2L", descricao: null, preco: 11.0, imagem_url: null },
  { id: 14, categoria: "refrigerante", nome: "Coca-Cola lata 350ml", descricao: null, preco: 6.0, imagem_url: null },
  { id: 15, categoria: "refrigerante", nome: "Fanta Laranja 2L", descricao: null, preco: 11.0, imagem_url: null },
];
