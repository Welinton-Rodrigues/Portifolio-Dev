# Dev.Portfolio — Portfólio técnico em HTML/CSS/JS puro

Portfólio estático com foco em UX responsiva, performance e manutenção simples, usando padrões de mercado. Sem frameworks no front (apenas Three.js via CDN para o visual 3D).

## Visão Geral
- Stack: `HTML`, `CSS`, `JavaScript` + `Three.js` (visual 3D), sem bundler.
- Objetivos: carregamento leve, navegação clara, responsividade real, e showcase dos projetos.
- Organização: `index.html`, `style.css`, `script.js`, `assets/` (imagens).

## Arquitetura de UI e Responsividade
- Mobile-first com refinamentos progressivos em breakpoints.
- Tipografia e espaçamentos responsivos via `clamp()`.
- Conteúdo quebra naturalmente com `overflow-wrap:anywhere`, `word-break` e `hyphens:auto`.
- Cards de projetos usam truncamento controlado por viewport:
  - `style.css:659-663, 665-668` controlam `--desc-lines` (2 linhas em mobile, 4 em telas grandes).
  - `style.css:430-444` aplica `-webkit-line-clamp`, mantendo legibilidade sem estourar layout.

## Menu Hambúrguer (Mobile)
- Estado e comportamento:
  - Esconde hambúrguer ao abrir e mostra apenas o botão de fechar posicionado no header.
  - Alinha itens à esquerda e mantém o título `Dev.Portfolio` no topo.
- Implementação:
  - Estilos: `style.css:78-106, 114-129` (layout, alinhamento, botão fechar).
  - Lógica: `script.js:310-334` injeta o botão fechar no `header` ao abrir e remove ao fechar; ESC fecha; clique em link fecha.
- Decisões de UX:
  - Sem overlay global; o fundo do menu é sólido, não vaza conteúdo por trás.
  - `body.nav-open` mantém `overflow:auto` para evitar travas de rolagem.

## Carrossel de Projetos
- Objetivo: um card por vez, alinhado pela borda esquerda, sem cortes.
- Técnicas:
  - `scroll-snap` para travar o item; navegação por índice com base na largura do container.
  - Remoção de padding lateral e centralizações que criavam espaços “fantasma”.
- Implementação:
  - JS: `script.js:404-425` calcula índice por `scrollLeft / cardWidth`, rola para `index * cardWidth` e mantém alinhamento em `resize`.
  - CSS: `style.css:562-580` remove `padding-inline` e centralização; cards com `flex:0 0 100%` e `scroll-snap-align:start`.

## Visual 3D (Hero)
- Modos ativos: `Partículas` e `Monograma`. O modo `Rede` foi removido por decisão de design.
- Persistência: guarda modo em `localStorage` (com fallback para `particles`).
- Implementação:
  - JS:
    - Inicialização e troca: `script.js:22-33, 175-185, 211-225`.
    - Remoção do modo `network`: `script.js:23-29, 175-183` (sanitiza estado e build).

## Galáxia de Projetos (Canvas 2D)
- A cápsula da galáxia é opaca e sobrepõe o fundo 3D.
- Implementação:
  - CSS: `style.css:539-540` define `background:#151a2b` e `z-index:2` na `.projects-galaxy`.

## Correções e Polimento
- Texto solto “aCO” removido: limpeza de nós de texto fora de tags em `#sobre`.
  - `script.js:372-384` remove qualquer nó de texto acidental antes do título.
- Acessibilidade
  - Botão fechar com `aria-label`; ESC fecha; foco preservado no primeiro link ao entrar no carrossel (`script.js:386-389`).

## Padrões de Mercado aplicados
- Responsividade verdadeira com `clamp()` e `line-clamp` para conteúdo.
- Navegação previsível e indexada no carrossel; evita offsets baseados em DOM que variam por layout.
- UX de menu mobile sem overlay global intrusivo; botão de fechar alinhado ao trigger.
- Layering explícito com `z-index` e containers opacos para não vazar conteúdo de background.
- Progressive enhancement: comportamentos JS adicionados sem quebrar o HTML base.

## Rodando localmente
- Simples: abra `index.html` no navegador.
- Alternativa com servidor estático:
  - `npx serve` (se tiver Node instalado) e acesse `http://localhost:3000`.

## Publicação (GitHub Pages)
1. Crie o repositório no GitHub (ex.: `portfolio`).
2. Conecte e envie:
   - `git remote add origin https://github.com/<usuario>/portfolio.git`
   - `git push -u origin main`
3. Habilite Pages em Settings → Pages → Deploy from a branch (branch `main`, `/root`).

## Próximos passos sugeridos
- Otimização de imagens (WebP/AVIF) e lazy-loading.
- Preloading seletivo de fontes; `font-display:swap`.
- Testes de acessibilidade (axe, Lighthouse) e foco em contraste.
- CSP básica e `rel=noopener`/`noreferrer` consistente.

