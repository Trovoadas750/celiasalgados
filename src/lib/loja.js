// Dados da loja. Todo o site deve importar daqui (contato, redes sociais, retirada, limites).

export const LOJA = {
  nome: "Edna & Célia Salgados",

  whatsapp: {
    texto: "(14) 99753-4514",
    link: "https://wa.me/5514997534514",
  },

  instagram: {
    texto: "@ednaeceliasalgados_",
    link: "https://www.instagram.com/ednaeceliasalgados_/",
  },

  // Endereço da loja (retirada): vem do banco, tabela config_loja (lib/configLoja.js).

  // Entrega só até 100 salgados (1 cento) no pedido inteiro; acima disso, só retirada.
  // Serve para textos e avisos na tela. Quem decide de fato é o banco
  // (`limite_entrega` / `entrega_permitida` no retorno de `calcular_pedido`).
  limiteEntrega: 100,
};

// Redes sociais na ordem em que aparecem no site. Não existe Facebook.
export const REDES_SOCIAIS = [
  { nome: "Instagram", texto: LOJA.instagram.texto, href: LOJA.instagram.link },
  { nome: "WhatsApp", texto: LOJA.whatsapp.texto, href: LOJA.whatsapp.link },
];

export const PAGINAS_LEGAIS = [
  { href: "/termos", rotulo: "Termos de uso" },
  { href: "/privacidade", rotulo: "Política de privacidade" },
];
