// Dados mockados no mesmo formato da consulta do cardápio em contextoBD.md (seção 7).
// Quando o Supabase entrar, basta trocar estas constantes pelas consultas reais.

export const CATEGORIAS = [
  { id: "kit", titulo: "Kits", subtitulo: "Para festas e reuniões" },
  { id: "salgado", titulo: "Salgados", subtitulo: "Preço por unidade · fritos na hora" },
  { id: "refrigerante", titulo: "Refrigerantes", subtitulo: "Bem gelados" },
];

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
  {
    id: 12,
    categoria: "refrigerante",
    nome: "Coca-Cola 2L",
    descricao: null,
    preco: 14.0,
    imagem_url: null,
  },
  {
    id: 13,
    categoria: "refrigerante",
    nome: "Guaraná Antarctica 2L",
    descricao: null,
    preco: 11.0,
    imagem_url: null,
  },
  {
    id: 14,
    categoria: "refrigerante",
    nome: "Coca-Cola lata 350ml",
    descricao: null,
    preco: 6.0,
    imagem_url: null,
  },
  {
    id: 15,
    categoria: "refrigerante",
    nome: "Fanta Laranja 2L",
    descricao: null,
    preco: 11.0,
    imagem_url: null,
  },
];

// Linha de `clientes` do usuário logado.
export const CLIENTE = {
  nome: "Maria",
  sobrenome: "Aparecida da Silva",
  telefone: "14999990001",
  criado_em: "2026-08-12T15:20:00-03:00",
};

// Formato da consulta de pedidos em contextoBD.md (seção 7).
export const PEDIDOS = [
  {
    id: 42,
    criado_em: "2026-10-20T18:42:00-03:00",
    status: "em_preparo",
    agendado_para: null,
    forma_pagamento: "pix",
    total: 123.9,
    itens_pedido: [
      {
        id: 101,
        categoria: "kit",
        nome_produto: "Kit Festa 100",
        quantidade: 1,
        subtotal: 109.9,
        itens_pedido_conteudo: [
          { nome_produto: "Coxinha de frango", quantidade: 50, escolhido_pelo_cliente: true },
          { nome_produto: "Kibe", quantidade: 30, escolhido_pelo_cliente: true },
          { nome_produto: "Bolinha de queijo", quantidade: 20, escolhido_pelo_cliente: true },
          { nome_produto: "Coca-Cola 2L", quantidade: 1, escolhido_pelo_cliente: false },
        ],
      },
      { id: 102, categoria: "refrigerante", nome_produto: "Coca-Cola 2L", quantidade: 1, subtotal: 14.0, itens_pedido_conteudo: [] },
    ],
  },
  {
    id: 37,
    criado_em: "2026-10-11T11:05:00-03:00",
    status: "entregue",
    agendado_para: "2026-10-12T15:00:00-03:00",
    forma_pagamento: "dinheiro",
    total: 41.0,
    itens_pedido: [
      { id: 90, categoria: "salgado", nome_produto: "Coxinha de frango", quantidade: 20, subtotal: 20.0, itens_pedido_conteudo: [] },
      { id: 91, categoria: "salgado", nome_produto: "Risole de carne", quantidade: 10, subtotal: 11.0, itens_pedido_conteudo: [] },
      { id: 92, categoria: "refrigerante", nome_produto: "Guaraná Antarctica 2L", quantidade: 1, subtotal: 11.0, itens_pedido_conteudo: [] },
    ],
  },
  {
    id: 29,
    criado_em: "2026-09-28T19:30:00-03:00",
    status: "cancelado",
    agendado_para: null,
    forma_pagamento: "cartao",
    total: 32.0,
    itens_pedido: [
      { id: 80, categoria: "kit", nome_produto: "Kit Lanche", quantidade: 1, subtotal: 32.0, itens_pedido_conteudo: [] },
    ],
  },
];
