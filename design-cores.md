# Paleta de cores: Salgadaria

Este arquivo define **as cores do site e como combiná-las**. Siga as regras abaixo em toda tela (site do cliente e painel do admin).

- Todos os contrastes foram calculados pela fórmula da WCAG 2.2.
- **Meta: nível AA.**
  - Texto normal: contraste ≥ 4.5:1.
  - Texto grande (≥ 24px, ou ≥ 18.66px em negrito) e componentes de interface (bordas de campos, ícones que funcionam como botão, anel de foco): ≥ 3:1.
- **Não use cores fora desta lista.** Também não use opacidade (`rgba`, `opacity`) em textos: isso muda o contraste calculado aqui.

---

## 1. Paleta base (extraída da imagem de referência)

| token | hex | nome | papel principal |
|---|---|---|---|
| `--creme` | `#F2DBC9` | Creme | **Fundo principal do site** |
| `--ferrugem` | `#A44A2F` | Ferrugem | Cor da marca: botão principal, destaques, títulos de seção |
| `--laranja` | `#FE914E` | Laranja | Chamadas de atenção (CTA "Adicionar", selos, preço em destaque **sobre fundo escuro**) |
| `--cobre` | `#BC6E40` | Cobre | **Somente decorativo**: ilustrações, divisores, ícones ao lado de texto |
| `--cafe` | `#251C14` | Café | **Texto principal**; fundo de header/rodapé escuro |
| `--preto` | `#000000` | Preto | Uso mínimo: sombras e sobreposição de imagens (`rgba(0,0,0,.x)`) |
| `--vinho` | `#5D1C1A` | Vinho | **Detalhes e acentos**: fios de borda (header, rodapé, sacola, montador), tracinho sob títulos, filetes laterais, capa decorativa, selos e bolinhas (com texto creme). Nunca em botão de ação: ação continua ferrugem/laranja |

## 2. Cores de apoio (derivadas, já validadas)

| token | hex | uso |
|---|---|---|
| `--creme-claro` | `#FAF0E8` | Fundo de **cards**, modais, campos de formulário |
| `--borda-suave` | `#E3C4AC` | Borda decorativa de cards e divisores (não carrega informação) |
| `--borda-input` | `#8C6A55` | Borda de **campos de formulário**, checkbox e radio (≥ 3:1) |
| `--texto-sec` | `#5C4636` | Texto secundário: descrições, legendas, placeholders, datas |
| `--ferrugem-hover` | `#8A3D26` | Hover do botão principal; **links** em texto corrido |
| `--ferrugem-ativo` | `#743320` | Estado pressionado (`:active`) do botão principal |
| `--laranja-hover` | `#F57C33` | Hover do botão laranja |
| `--cobre-esc` | `#8F5230` | Quando precisar do tom cobre **em texto** (ex.: subtítulo) |
| `--desabilitado` | `#9C8676` | Texto/borda de elemento desabilitado (isento de contraste pela WCAG; sempre com `cursor: not-allowed`) |

### Feedback e status (sempre com texto/ícone, nunca só a cor)

| token texto | token fundo | uso | contraste |
|---|---|---|---|
| `--erro` `#9F1D1D` | `--erro-fundo` `#FBE3DF` | erro de formulário, falha ao enviar | 6.43 |
| `--sucesso` `#2E6B3A` | `--sucesso-fundo` `#E2F0DF` | pedido enviado, salvo com sucesso | 5.42 |
| `--aviso-texto` `#7A3E0E` | `--aviso-fundo` `#FFE7CC` | avisos, "loja fechada" | 6.96 |
| `--info` `#2C5A7A` | `--info-fundo` `#E1ECF4` | informações neutras | 6.14 |

> O vermelho de erro (`#9F1D1D`) é **diferente** da ferrugem de propósito: o usuário não pode confundir botão da marca com mensagem de erro.

---

## 3. Tabela de contraste (combinações permitidas e proibidas)

✅ texto normal (≥ 4.5) · 🟡 só texto grande/ícone/borda (≥ 3) · ❌ proibido para texto

| texto ↓ / fundo → | creme `#F2DBC9` | creme-claro `#FAF0E8` | café `#251C14` | ferrugem `#A44A2F` | laranja `#FE914E` |
|---|---|---|---|---|---|
| **café** `#251C14` | ✅ 12.55 | ✅ 14.90 | — | ❌ 2.87 | ✅ 7.47 |
| **branco** `#FFFFFF` | — | — | ✅ 16.73 | ✅ 5.83 | ❌ 2.24 |
| **creme** `#F2DBC9` | — | — | ✅ 12.55 | 🟡 4.38 | ❌ 1.68 |
| **creme-claro** `#FAF0E8` | — | — | ✅ 14.90 | ✅ 5.19 | — |
| **ferrugem** `#A44A2F` | 🟡 4.38 | ✅ 5.19 | ❌ 2.87 | — | ❌ 2.60 |
| **ferrugem-hover** `#8A3D26` | ✅ 5.67 | ✅ 6.73 | ❌ | — | — |
| **laranja** `#FE914E` | ❌ 1.68 | ❌ | ✅ 7.47 | ❌ 2.60 | — |
| **cobre** `#BC6E40` | ❌ 2.89 | ❌ | 🟡 4.34 | — | — |
| **cobre-esc** `#8F5230` | ✅ 4.61 | ✅ 5.47 | ❌ | — | — |
| **texto-sec** `#5C4636` | ✅ 6.61 | ✅ 7.84 | ❌ | — | — |
| **preto** `#000000` | ✅ 15.75 | — | ❌ 1.25 | — | ✅ 9.37 |
| **vinho** `#5D1C1A` | ✅ 9.57 | ✅ 11.35 | ❌ 1.31 | — | — |

### Regras que saem dessa tabela
1. **Laranja nunca é cor de texto sobre fundo claro** (1.68). No fundo claro, laranja só aparece como **fundo**, com texto **café** por cima.
2. **Nunca escreva texto branco sobre laranja** (2.24).
3. **Ferrugem sobre creme passa só para texto grande** (4.38). Para links e textos pequenos sobre creme, use `--ferrugem-hover` (5.67). Sobre `--creme-claro` (cards), a ferrugem normal passa (5.19).
4. **Botão ferrugem leva texto branco** (5.83), não creme (4.38).
5. **Cobre é só decoração.** Para texto num tom cobre, use `--cobre-esc`.
6. **Texto principal é café, não preto.** O preto puro sobre creme cansa a vista, e preto sobre café é invisível (1.25).
7. **Fundo café** (header/rodapé): texto creme ou branco; destaque em laranja (7.47). Ferrugem sobre café é proibido (2.87).
8. **Vinho é cor de detalhe e acento.** Sobre café ele quase some (1.31): use como fio de borda no header/rodapé. Sobre creme contrasta bem (9.57), em traços de 2–4px. Como **fundo** pequeno (selo, bolinha, avatar, botão flutuante do WhatsApp, capa), leva texto/ícone **creme** (9.57) ou **branco** (12.75); laranja sobre vinho passa (5.69). Nunca use vinho em botão de ação (para não competir com a ferrugem).

---

## 4. Variáveis CSS (colar em `app/globals.css`)

```css
:root {
  /* base */
  --creme: #F2DBC9;
  --ferrugem: #A44A2F;
  --laranja: #FE914E;
  --cobre: #BC6E40;
  --cafe: #251C14;
  --preto: #000000;
  --vinho: #5D1C1A;

  /* apoio */
  --creme-claro: #FAF0E8;
  --borda-suave: #E3C4AC;
  --borda-input: #8C6A55;
  --texto-sec: #5C4636;
  --ferrugem-hover: #8A3D26;
  --ferrugem-ativo: #743320;
  --laranja-hover: #F57C33;
  --cobre-esc: #8F5230;
  --desabilitado: #9C8676;

  /* feedback */
  --erro: #9F1D1D;        --erro-fundo: #FBE3DF;
  --sucesso: #2E6B3A;     --sucesso-fundo: #E2F0DF;
  --aviso-texto: #7A3E0E; --aviso-fundo: #FFE7CC;
  --info: #2C5A7A;        --info-fundo: #E1ECF4;

  /* papéis semânticos (use ESTES nos componentes) */
  --fundo: var(--creme);
  --superficie: var(--creme-claro);
  --texto: var(--cafe);
  --texto-suave: var(--texto-sec);
  --link: var(--ferrugem-hover);
  --foco: var(--cafe);

  color-scheme: light;
}

body {
  background: var(--fundo);
  color: var(--texto);
}
```

- Nos componentes, prefira os **papéis semânticos** (`--fundo`, `--texto`, `--superficie`...) às cores cruas. Assim uma troca futura muda um lugar só.
- O site é **somente tema claro**. Não crie modo escuro automático (`prefers-color-scheme`) sem pedido.
- Se o projeto usa **Tailwind**, registre os mesmos tokens no tema, com os mesmos nomes e valores. Não use as cores padrão do Tailwind (`orange-500`, `amber-*`, `gray-*` etc.).

---

## 5. Receitas por componente

| componente | fundo | texto | borda / extra |
|---|---|---|---|
| Página | `--creme` | `--cafe` | — |
| Título de seção (h2) | — | `--ferrugem` (texto grande) | tracinho `--vinho` embaixo (3px × 40px): classe `.traco-vinho`, também nos h1 das páginas |
| Cabeçalho de etapa no montador | `--creme` | `--cafe` | `border-left 4px --vinho`; selos "OBRIGATÓRIO" e contagem: fundo `--vinho`, texto `--creme`; nome do pacote com `border-bottom 2px --vinho` |
| Capa (home e perfil) | `--vinho` com bolinhas `--cobre` | sem texto | — |
| Sacola (bottom sheet) | `--creme` | `--cafe` | `border-top 4px --vinho`; alça `--vinho` |
| Card de pedido | `--creme-claro` | `--cafe` | `border-left 4px --vinho` + `1px --borda-suave` |
| Bolinhas de destaque (nº da etapa no checkout, avatar, botão do WhatsApp) | `--vinho` | `--creme` | — |
| Card de produto | `--creme-claro` | `--cafe`; descrição `--texto-sec` | `1px solid --borda-suave`; sombra opcional `0 2px 8px rgba(37,28,20,.08)`; hover: filete `inset 3px 0 0 --vinho` à esquerda |
| Preço (no card claro) | — | `--ferrugem` **em negrito ≥ 18.66px** ou `--cafe` | — |
| **Botão principal** ("Finalizar pedido", "Entrar") | `--ferrugem` → hover `--ferrugem-hover` → active `--ferrugem-ativo` | **branco** | — |
| **Botão de destaque** ("Adicionar ao carrinho", selo "Mais vendido") | `--laranja` → hover `--laranja-hover` | **`--cafe`** | — |
| Botão secundário ("Continuar comprando") | transparente | `--ferrugem-hover` | `2px solid --ferrugem-hover` |
| Link em texto | — | `--ferrugem-hover`, **sublinhado** | hover: `--ferrugem-ativo` |
| Campo de formulário | `--creme-claro` | `--cafe`; placeholder `--texto-sec` | `1px solid --borda-input`; erro: `2px solid --erro` + mensagem em `--erro` |
| Label | — | `--cafe` | — |
| Header / rodapé escuro | `--cafe` | `--creme` | links `--creme` sublinhados; destaque/ícone ativo `--laranja`; fio `--vinho` (header `border-bottom 4px`, rodapé `border-top 4px` e divisor interno 1px) |
| Contador do carrinho (bolinha) | `--laranja` | `--cafe` | — |
| Elemento desabilitado | `--creme-claro` | `--desabilitado` | `1px solid --borda-suave`; nunca use só a cor: adicione `disabled`/`aria-disabled` |
| Mensagens | `--*-fundo` | `--erro` / `--sucesso` / `--aviso-texto` / `--info` | ícone + texto; `role="alert"` para erro |

### Status do pedido (painel do admin e "Minha conta")
Cada badge mostra **sempre o nome do status por escrito**. Nunca use só uma bolinha colorida.

| status | fundo | texto | contraste |
|---|---|---|---|
| Novo | `--laranja` | `--cafe` | 7.47 |
| Em preparo | `--aviso-fundo` | `--aviso-texto` | 6.96 |
| Saiu para entrega | `--info-fundo` | `--info` | 6.14 |
| Entregue | `--sucesso-fundo` | `--sucesso` | 5.42 |
| Cancelado | `#E6DDD6` | `--texto-sec` (+ texto riscado opcional) | 6.58 |

---

## 6. Foco, acessibilidade e boas práticas

- **Anel de foco visível em todo elemento interativo**, usando `:focus-visible`. Nunca `outline: none` sem substituto.
  - Sobre fundo claro: `outline: 3px solid var(--cafe); outline-offset: 2px;` (12.55).
  - Sobre fundo café ou ferrugem: `outline: 3px solid var(--laranja);` (7.47 sobre café).
- **Informação nunca só pela cor.** Erro tem ícone + texto, status tem nome, item selecionado tem ✓ ou borda mais grossa, e link tem sublinhado.
- **Imagens com texto por cima** (banner): sobreposição `linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.55))` e texto branco ou creme. Confira se o texto continua legível na parte mais clara da foto.
- **Hierarquia de cor:** no máximo **um** botão ferrugem e **um** destaque laranja por área visível. Se tudo chama atenção, nada chama.
- **Proporção sugerida (60-30-10):**
  - ~60% creme/creme-claro (fundos);
  - ~30% café (textos, header, rodapé);
  - ~10% ferrugem + laranja (ações e destaques). O cobre entra só em detalhes.
- **Tamanho mínimo de texto:** 16px no corpo, e 14px só para legendas em `--texto-sec`.
- **Daltonismo:** ferrugem, laranja e cobre ficam parecidos para quem tem deuteranopia/protanopia. Por isso a diferença entre botões vem também da **forma** (preenchido × contorno) e do **texto**, não só da cor.
- Respeite `prefers-reduced-motion` em transições de cor ou animações.

---

## 7. Checklist antes de entregar uma tela

- [ ] Nenhum texto laranja ou cobre sobre fundo claro.
- [ ] Nenhum texto branco sobre laranja.
- [ ] Texto pequeno ferrugem só sobre `--creme-claro`; sobre `--creme`, use `--ferrugem-hover`.
- [ ] Todos os botões e links têm hover **e** foco visível.
- [ ] Bordas de inputs usam `--borda-input` (não `--borda-suave`).
- [ ] Status, erros e seleção comunicados com texto/ícone além da cor.
- [ ] Nenhuma cor fora deste arquivo (procure por `#` e por classes de cor do Tailwind).
- [ ] Testado no Lighthouse/axe sem erro de contraste.