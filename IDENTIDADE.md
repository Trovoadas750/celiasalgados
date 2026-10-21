# Identidade visual: Edna & Célia Salgados

Esta é a identidade **fixa** do site. Telas e componentes novos devem usar só estes tokens. Não crie cores novas nem use as cores padrão do Tailwind (`zinc`, `gray`, `red-500` etc.) para fundo, texto ou destaque.

Os tokens ficam em [`src/app/globals.css`](src/app/globals.css), no bloco `@theme`. Para mudar uma cor no site todo, altere o valor ali **e** neste arquivo.

---

## Paleta

| Token | Hex | Classe Tailwind | Uso |
|---|---|---|---|
| `papel` | `#f5ecdc` | `bg-papel` | Fundo das páginas (off-white sépia) |
| `cartao` | `#fcf7ee` | `bg-cartao` | Cards, campos de busca, painéis. Fica um pouco mais claro que o fundo; **nunca use branco puro** em superfícies |
| `sepia` | `#ead9bb` | `bg-sepia` | Espaço reservado das fotos, chips neutros, áreas de apoio |
| `borda` | `#dcc8a6` | `ring-borda`, `border-borda`, `divide-borda` | Bordas, divisórias e contorno dos cards |
| `tinta` | `#2b1d14` | `text-tinta` | Texto principal (marrom quase preto) |
| `vermelho` | `#d0121b` | `bg-vermelho`, `text-vermelho` | Destaque: header, capa, botões, preços, títulos, aba ativa |
| `vermelho-escuro` | `#a50d15` | `text-vermelho-escuro`, `hover:bg-vermelho-escuro` | Hover dos botões vermelhos e texto sobre `bg-vermelho/10` |

O branco (`text-white`) aparece **só como texto ou ícone sobre o vermelho**.

### Contraste (WCAG)

| Combinação | Razão | Resultado |
|---|---|---|
| `tinta` sobre `papel` | 14:1 | AAA |
| `vermelho` sobre `papel` | 4,9:1 | AA |
| branco sobre `vermelho` | 5,6:1 | AA |
| `tinta/70` sobre `papel` | ≈ 4,6:1 | AA, é o **mínimo** para texto secundário |

Regras:
- Texto secundário usa `text-tinta/70`. Não use opacidade menor que `/70` em texto; o placeholder do campo de busca (`/55`) é a única exceção.
- Sobre o vermelho, use `text-white` ou `text-white/80` no mínimo (itens inativos do menu).
- Chips de destaque: `bg-vermelho/10` com `text-vermelho-escuro`.

### Cores de status (exceção permitida)

Os selos de status do pedido e o "Aberto agora" usam cores semânticas do Tailwind, definidas em [`src/lib/formatar.js`](src/lib/formatar.js) (`STATUS_PEDIDO`): azul = recebido, âmbar = em preparo, violeta = saiu para entrega, verde = entregue, pedra = cancelado. Use sempre a dupla `bg-*-100` + `text-*-800`.

---

## Modo claro apenas

O site **não tem modo escuro**. `color-scheme: only light` (em `globals.css`) e `colorScheme: "only light"` (no `viewport` de `layout.js`) impedem que o modo escuro forçado de alguns navegadores inverta as cores. Não adicione `@media (prefers-color-scheme: dark)` nem classes `dark:`.

A cor da barra do navegador no celular (`themeColor`) é o `vermelho`.

---

## Tipografia

| Papel | Fonte | Classe |
|---|---|---|
| Títulos (nome da loja, títulos de seção, "Pedido nº") | **Young Serif** | `font-titulo` |
| Todo o resto | **Figtree** | padrão (`font-sans`) |

Valores e tabelas usam `tabular-nums`.

---

## Logo

- Arquivo: `public/logo.png` (fundo transparente, desenho claro em tons de creme).
- Fica bem sobre o vermelho (header e capa). Use `object-contain`, **sem** borda ou círculo em volta.
- Arquivo da sacola: `public/sacola.png`, sempre sobre um quadrado `bg-papel`.

---

## Componentes-padrão

- **Header:** `bg-vermelho`, texto branco; o item ativo ganha um traço branco embaixo.
- **Capa** (classe `.capa`): gradiente vermelho com bolinhas brancas suaves.
- **Card:** `rounded-2xl bg-cartao ring-1 ring-borda`.
- **Botão principal:** `bg-vermelho text-white`, com `hover:bg-vermelho-escuro`.
- **Botão secundário:** fundo transparente, `text-vermelho ring-1 ring-vermelho/25`.
- **Aba/chip inativo:** `bg-cartao text-tinta ring-1 ring-borda`. Ativo: `bg-vermelho text-white`.
- **Ícones:** SVGs próprios em [`src/components/icones.js`](src/components/icones.js), traço de 1.7 e `currentColor`. Não use `react-icons`; prefira desenhos menos comuns (cloche, comanda, crachá).

## Layout

- **Mobile-first:** cerca de 90% dos acessos vêm do celular. O conteúdo fica em `max-w-2xl` centralizado, com `px-3`.
- A barra **Sacola** fica fixa embaixo da tela. Quem dá o espaço para ela é o **Footer** (`src/components/Footer.js`), com padding inferior extra; o `main` tem só `pb-10`.
- **Footer:** `bg-vermelho`, logo à esquerda, ícones de redes sociais à direita e links das páginas legais (`/termos`, `/privacidade`). Os links das redes ficam em `src/lib/contato.js`.
