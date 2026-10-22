# Identidade visual: Edna & Célia Salgados

## Cores

**A única fonte de cores é o [`paletas.md`](paletas.md).** Ele traz a paleta, a tabela de contraste, as receitas por componente, as regras de foco e o checklist. Não crie cores fora dele nem use as cores padrão do Tailwind (`zinc`, `gray`, `red-500` etc.).

- Os tokens ficam em [`src/app/globals.css`](src/app/globals.css): as variáveis CSS da seção 4 do `paletas.md` no `:root`, registradas no tema do Tailwind com os mesmos nomes (`bg-fundo`, `bg-superficie`, `text-texto`, `text-texto-suave`, `text-link`, `ring-borda-input`, `bg-ferrugem`, `bg-laranja`...).
- Nos componentes, prefira os **papéis semânticos** (`fundo`, `superficie`, `texto`, `texto-suave`, `link`, `foco`).
- Classes de botão e link prontas: [`src/components/cliente/estilos.js`](src/components/cliente/estilos.js) (`CLASSE_BOTAO_PRINCIPAL`, `CLASSE_BOTAO_SECUNDARIO`, `CLASSE_LINK`).
- Erros: use `MensagemErro` e `AlertaErro` de [`Campo.js`](src/components/cliente/Campo.js), que já vêm com ícone + texto.
- Selos de status do pedido: `STATUS_PEDIDO` em [`src/lib/formatar.js`](src/lib/formatar.js), seguindo a tabela da seção 5.
- Cor que precisa ser texto literal fora do CSS (ex.: `themeColor`): [`src/lib/cores.js`](src/lib/cores.js).
- **Foco:** há uma regra global de `:focus-visible` (contorno café de 3px). Dentro de um contêiner com a classe `fundo-escuro` (header e rodapé), o contorno vira laranja.
- **Rádios:** use a classe `radio` (borda `--borda-input`, marcador ferrugem).
- **Texto:** mínimo de 14px; não use opacidade (`/70`, `opacity-*`) em texto.

---

## Modo claro apenas

O site **não tem modo escuro**. `color-scheme: only light` (em `globals.css`) e `colorScheme: "only light"` (no `viewport` de `layout.js`) impedem que o modo escuro forçado de alguns navegadores inverta as cores. Não adicione `@media (prefers-color-scheme: dark)` nem classes `dark:`.

---

## Tipografia

| Papel | Fonte | Classe |
|---|---|---|
| Títulos (nome da loja, títulos de seção, "Pedido nº") | **Young Serif** | `font-titulo` |
| Todo o resto | **Figtree** | padrão (`font-sans`) |

Valores e tabelas usam `tabular-nums`. Títulos em ferrugem sobre o creme só a partir de 24px; os menores usam `text-ferrugem-hover`.

---

## Logo

- Arquivo: `public/logo.webp` (WebP com fundo transparente, desenho claro em tons de creme).
- Fica sobre o café (header, rodapé e capa). Use `object-contain`, **sem** borda ou círculo em volta.
- Arquivo da sacola: `public/sacola.png`, sempre sobre um quadrado `bg-fundo`.

---

## Componentes-padrão

- **Header e rodapé:** `fundo-escuro bg-cafe text-creme`; o item ativo do menu fica laranja, com um traço laranja embaixo.
- **Capa** (classe `.capa`): café com bolinhas cobre (decorativo, sem texto em cima).
- **Card:** `rounded-2xl bg-superficie ring-1 ring-borda-suave`, sombra `shadow-card`.
- **Botão de destaque** ("+" de adicionar e contador da sacola): `bg-laranja text-cafe`.
- **Ícones:** SVGs próprios em [`src/components/icones.js`](src/components/icones.js), traço de 1.7 e `currentColor`. Não use `react-icons`; prefira desenhos menos comuns (cloche, comanda, crachá). Ícones decorativos ao lado de texto usam `text-cobre`.
  - Exceção: as figuras de pessoa (`IconeRetirada`, pessoa com sacolas; `IconeMotoboy`, pessoa de capacete na moto) são preenchidas e vêm do conjunto [Pinhead](https://github.com/waysidemapping/pinhead) (CC0, uso livre). Para novas figuras de pessoa, use o mesmo conjunto, para manter o estilo.

## Layout

- **Mobile-first:** cerca de 90% dos acessos vêm do celular. O conteúdo fica em `max-w-2xl` centralizado, com `px-3`.
- A barra **Sacola** fica fixa embaixo da tela. Quem dá o espaço para ela é o **Footer** (`src/components/Footer.js`), com padding inferior extra; o `main` tem só `pb-10`.
- **Footer:** logo à esquerda, ícones de redes sociais à direita e links das páginas legais (`/termos`, `/privacidade`). Os links das redes ficam em `src/lib/contato.js`.
