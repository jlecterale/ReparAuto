# 🎬 Gerar vídeos de marketing do RecarGarage com Remotion

Este guia explica, **passo a passo e em linguagem simples**, como criar vídeos
promocionais do RecarGarage a partir deste repositório — usando o
[Remotion](https://www.remotion.dev) (vídeo feito em React) e a ajuda do Claude
(ou de outro LLM) para escrever o código por ti.

O objetivo é que **qualquer pessoa da equipa** consiga pedir um vídeo novo sem
saber programar: descreve o que queres, o LLM escreve o código Remotion, e tu
fazes o *render* para um ficheiro `.mp4` pronto para o Instagram, Google Ads ou
YouTube.

> 🏷️ A marca escreve-se sempre **RecarGarage** (uma só palavra). Nunca "Recar
> Garage" nem "Repar Auto". Todo o texto visível ao utilizador é em
> **português de Portugal**.

---

## 📁 O que já existe aqui

A pasta `video/` é um projeto Remotion **independente** do site e da app móvel.
Já traz um vídeo pronto — o *promo* de ~30 segundos do RecarGarage.

```
video/
├── src/
│   ├── Root.tsx              # Regista TODAS as composições (os "vídeos") e as suas dimensões
│   ├── RecarGaragePromo.tsx  # O vídeo promo: junta as 7 cenas com transições
│   ├── theme.ts              # Cores da marca, fps, durações das cenas
│   ├── format.ts             # useFormat() — deteta 9:16 / 1:1 / 16:9 (layout responsivo)
│   ├── fonts.ts              # Tipografia da marca (Libre Franklin)
│   ├── anim.ts               # Animações reutilizáveis (fadeUp, popIn)
│   ├── scenes/               # Uma cena por ficheiro
│   │   ├── Hook.tsx          #  Gancho — "Mais do que comprar e vender" + logótipo
│   │   ├── Carros.tsx        #  Carros usados, incl. low-cost (cartões de anúncio)
│   │   ├── Pecas.tsx         #  Peças & desmonte (grelha de categorias)
│   │   ├── Oficinas.tsx      #  Oficinas & mecânicos — o ecossistema ligado
│   │   ├── Seguranca.tsx     #  Anúncios verificados, avaliações, confiança
│   │   ├── Chat.tsx          #  Mensagens diretas com o vendedor
│   │   └── CTA.tsx           #  Disponível em iOS, Android e Web + lojas
│   └── components/           # Peças REUTILIZÁVEIS (ver tabela abaixo)
├── public/brand/            # Ícone da app, logótipo e fotos de carros
├── public/images/           # Fotos de anúncios (ex.: Clio low-cost)
├── public/audio/            # Música de fundo (rockit.mp3)
├── docs/                    # Este guia + imagens de pré-visualização
└── package.json             # Comandos (studio, render, …)
```

O mesmo promo é gerado em **três formatos** a partir do mesmo código (ver
"[Cada vídeo é uma Composition](#-cada-vídeo-é-uma-composition)"):

| Composition | Dimensões | Uso |
|---|---|---|
| `RecarGaragePromo` | 1080×1920 (9:16) | Reels/Stories, Shorts, TikTok |
| `RecarGaragePromoSquare` | 1080×1080 (1:1) | Feed Instagram/Facebook |
| `RecarGaragePromoWide` | 1920×1080 (16:9) | YouTube, Google Ads |

Todos a **30 fps, ~30 s**. Apresentam o **ecossistema automóvel** do RecarGarage
(carros, peças, oficinas e mecânicos ligados) e terminam com a disponibilidade
em **iOS, Android e Web**.

---

## 🧩 Cada vídeo é uma Composition

> 📌 **Regra de ouro deste repositório: cada vídeo é sempre uma _Composition_.**

No Remotion, um vídeo é uma **`<Composition>`** registada em `src/Root.tsx`. É aí
que se define o `id` (o nome do vídeo), o `component` (o React que o desenha), as
dimensões (`width`/`height`), os `fps` e a duração (`durationInFrames`).

**Esta pasta vai ter muitos vídeos diferentes.** Cada um deve ser uma composition
nova em `Root.tsx` — nunca "por cima" de outro. Para criar um vídeo:

1. Cria o componente do vídeo (ex.: `src/PromoPecas.tsx`).
2. **Reutiliza** os componentes partilhados (ver tabela abaixo) — não recries do zero.
3. Regista-o como uma nova `<Composition>` em `Root.tsx`.

**Vários formatos do mesmo vídeo = várias compositions com o MESMO componente**,
só a mudar `width`/`height`. É exatamente o que o promo faz: as três compositions
(`RecarGaragePromo`, `…Square`, `…Wide`) apontam todas para `RecarGaragePromo` e
as cenas adaptam-se sozinhas via **`useFormat()`** (`src/format.ts`), que deteta
se está em 9:16, 1:1 ou 16:9. Não há código de cena duplicado por formato.

```tsx
// src/Root.tsx — o mesmo componente em três formatos
const FORMATS = [
  { id: "RecarGaragePromo", width: 1080, height: 1920 },       // 9:16
  { id: "RecarGaragePromoSquare", width: 1080, height: 1080 }, // 1:1
  { id: "RecarGaragePromoWide", width: 1920, height: 1080 },   // 16:9
];
// …um <Composition> por formato, todos com component={RecarGaragePromo}
```

---

## ♻️ Componentes reutilizáveis (usa-os antes de criar markup novo)

Antes de escrever markup para um vídeo novo, **verifica se já existe uma peça
reutilizável**. Estas foram feitas para servir qualquer composition futura:

| Peça | Onde | Para que serve |
|---|---|---|
| `Background` | `components/Background.tsx` | Fundo da marca (gradiente + brilho + hexágono) |
| `SceneShell` | `components/SceneShell.tsx` | **Layout responsivo** título+visual (coluna em 9:16/1:1, 2 colunas em 16:9) |
| `SceneHeading` | `components/SceneHeading.tsx` | Bloco "eyebrow + título" consistente |
| `Logo` | `components/Logo.tsx` | Lockup da marca (ícone + "RecarGarage") |
| `ListingCard` | `components/ListingCard.tsx` | Cartão de anúncio (carro/peça) com imagem, preço e selo |
| `StoreBadge` | `components/StoreBadge.tsx` | Selos App Store / Google Play / Web App |
| `useFormat()` | `format.ts` | Deteta o formato para adaptar o layout |
| `fadeUp` / `popIn` | `anim.ts` | Animações de entrada (fade+subida / pop) |
| `colors` | `theme.ts` | Cores da marca |
| `brandFont` | `fonts.ts` | Tipografia da marca |

> ✅ Se criares algo que serve mais do que uma cena/vídeo, **coloca-o em
> `components/`** (não dentro da cena). Se for só daquela cena, mantém-no local.
> Os ficheiros em `scenes/` são um **bom ponto de partida** para copiar quando
> crias cenas novas.

---

## ⚡ Começar (setup, uma vez)

Precisas de **Node.js 18+** instalado.

```sh
cd video
npm install        # instala as dependências (só na primeira vez)
```

---

## 🖥️ Ver o vídeo e editar (Remotion Studio)

O Studio é uma pré-visualização em tempo real no browser. É aqui que vês o vídeo
e mexes nos valores.

```sh
cd video
npm run studio     # abre o Remotion Studio em http://localhost:3000
```

- Escolhe a composição **`RecarGaragePromo`** na barra lateral.
- Arrasta a linha do tempo para ver cada cena.
- Se editares um ficheiro em `src/`, o Studio atualiza sozinho.

---

## 🎞️ Exportar para `.mp4` (render)

```sh
cd video
npm run render          # 9:16  → out/RecarGarage-promo.mp4
npm run render:square   # 1:1   → out/RecarGarage-promo-1x1.mp4
npm run render:wide     # 16:9  → out/RecarGarage-promo-16x9.mp4
npm run render:all      # os três de uma vez
```

O ficheiro sai para `video/out/` (esta pasta está no `.gitignore` — o vídeo é
sempre regenerável a partir do código, por isso não vai para o Git).

Para renderizar **outra composição** ou mudar o nome do ficheiro:

```sh
npx remotion render <ID-da-composição> out/o-meu-video.mp4
```

Para testar rapidamente **só um frame** (útil para conferir o aspeto sem esperar
o render todo):

```sh
npx remotion still RecarGaragePromo out/preview.png --frame=190
```

---

## 🤖 Passo a passo: pedir um vídeo novo ao Claude (ou outro LLM)

Esta é a parte importante. Não precisas de escrever o código Remotion à mão —
descreve o que queres e deixa o LLM fazê-lo. Segue estes passos:

### 1. Dá contexto ao LLM

Se estiveres a usar o **Claude Code** dentro deste repositório, ele já tem a
skill `remotion-best-practices` instalada e conhece as regras do Remotion. Basta
pedires. Se estiveres noutra ferramenta, começa por colar isto:

> Estou a trabalhar num projeto **Remotion** (vídeo em React) dentro da pasta
> `video/`. As cenas estão em `src/scenes/`, as cores da marca em `src/theme.ts`
> e há componentes reutilizáveis em `src/components/`. A marca chama-se
> **RecarGarage** e todo o texto é em **português de Portugal**. Segue as boas
> práticas do Remotion: anima com `useCurrentFrame()` + `interpolate()`, nunca
> uses transições/animações de CSS nem classes de animação do Tailwind.

### 2. Descreve o vídeo que queres

Sê concreto: **plataforma, formato, duração, mensagem, cenas e tom**.

### 3. Pede para ver um frame

Depois de o LLM escrever o código, pede-lhe para **renderizar um frame de cada
cena** (`npx remotion still …`) e mostrar a imagem, para confirmar o aspeto
antes do render completo.

### 4. Itera

Ajusta com pedidos pequenos ("aumenta o título", "troca a cor de fundo para
laranja", "esta cena está muito rápida"). Um pedido de cada vez resulta melhor.

### 5. Render final

Quando estiver bom, `npm run render`.

---

## 💬 Prompts de exemplo (copiar e colar)

### 🆕 Criar um vídeo novo do zero

```
Cria uma nova composição Remotion chamada "PromoPecas" em video/src/, um vídeo
vertical de 1080×1920 a 30 fps, com cerca de 15 segundos, focado só nas PEÇAS e
desmonte do RecarGarage. Reutiliza o Background, o Logo e o SceneHeading que já
existem em src/components/. Estrutura em 3 cenas: (1) gancho "Precisas de uma
peça?", (2) categorias de peças com preços, (3) CTA com o logótipo e
"recargarage.com". Usa as cores da marca de src/theme.ts. Todo o texto em
português de Portugal. Regista a composição em src/Root.tsx e, no fim, renderiza
um frame de cada cena para eu ver.
```

### ✏️ Editar uma cena existente

```
Na cena src/scenes/Carros.tsx, o título está demasiado pequeno. Aumenta-o,
acrescenta um terceiro cartão de anúncio de um carro citadino barato (ex.:
"Renault Clio, 2014, 5.500 €") e faz os três cartões entrarem em cascata, um a
seguir ao outro. Mostra-me o frame 200 no fim.
```

### 🎨 Mudar cores, texto ou timing

```
No promo, a cena das Peças (src/scenes/Pecas.tsx) está a passar depressa demais.
Aumenta a duração dela em theme.ts para 6 segundos e faz as categorias
aparecerem mais devagar. Confirma que a duração total da composição em Root.tsx
continua correta.
```

### 📐 Formatos (9:16, 1:1, 16:9)

O promo **já vem nos três formatos** — `RecarGaragePromo` (9:16),
`RecarGaragePromoSquare` (1:1) e `RecarGaragePromoWide` (16:9) — todos a partir do
mesmo componente, graças ao `useFormat()`. Não precisas de criar nada para os ter;
basta `npm run render:all`.

Para um **vídeo novo teu** também ter vários formatos, o padrão é o mesmo: usa
`SceneShell` (que já faz coluna vs. duas colunas) e `useFormat()` nas cenas, e
regista uma composition por formato. Pede assim:

```
Cria um vídeo novo "PromoOficinas" e regista-o em Root.tsx em três formatos
(9:16 1080×1920, 1:1 1080×1080 e 16:9 1920×1080) usando o MESMO componente.
Reutiliza SceneShell, SceneHeading, Background e useFormat para o layout se
adaptar a cada formato. Renderiza um frame de cada formato para eu comparar.
```

> 💡 Como funciona: em vez de posições fixas, as cenas usam `SceneShell` +
> `useFormat()`. Em 9:16/1:1 o título fica em cima e o visual em baixo; em 16:9
> ficam lado a lado. Assim o mesmo código serve os três formatos.

### 🎵 Música e narração

O promo já traz música: `public/audio/rockit.mp3`. A faixa **toca desde o início
do vídeo**, mas como tem uma introdução longa (~7 s), essa introdução é cortada
com `trimBefore` para a batida entrar logo no frame 0 — com *fade-in* no início e
*fade-out* no fim. A lógica está em `src/RecarGaragePromo.tsx` (componente
`<Audio trimBefore={7 * fps}>`, com o volume controlado por `interpolate()`).

> ℹ️ `trimBefore` corta o **início da faixa** (salta a intro); não atrasa a
> música. Para em vez disso a música **começar mais tarde no vídeo** (silêncio no
> arranque), envolve o `<Audio>` num `<Sequence from={…}>`.

Para **trocar a música ou ajustar o corte da intro**:

```
No RecarGaragePromo, substitui a música por public/audio/nova.mp3 e ajusta o
trimBefore para saltar os primeiros 3 segundos de intro. Mantém o fade-in no
início e o fade-out nos últimos 1,5 segundos.
```

Para **narração (voice-over)** em português:

```
Adiciona uma narração em português de Portugal ao promo. Coloco o ficheiro em
public/audio/voz.mp3. Sincroniza cada frase com a cena correspondente usando
<Sequence from={…}> e baixa o volume da música de fundo enquanto a voz fala.
```

Para **narração (voice-over)** em português:

```
Adiciona uma narração em português de Portugal ao promo. Coloco o ficheiro em
public/audio/voz.mp3. Sincroniza cada frase com a cena correspondente usando
<Sequence from={…}> e baixa a música de fundo enquanto a voz fala.
```

### 🖼️ Trocar as fotos dos carros

```
Substitui as fotos dos carros em video/public/brand/ pelas que vou colocar lá
(car-1.png, car-2.png, car-3.png) e atualiza os títulos, quilómetros e preços
nos cartões da cena Carros para corresponderem aos carros reais.
```

### 🎬 Gerar variações para testes A/B de anúncios

```
Cria 3 variações do gancho inicial (cena Hook) com títulos diferentes para eu
testar em Google Ads: (A) "À procura do teu próximo carro?", (B) "Carros usados
ao melhor preço", (C) "Vende o teu carro em minutos". Cada uma numa composição
própria em Root.tsx, para eu renderizar as três e comparar.
```

---

## ✅ Regras de ouro do Remotion (para os prompts saírem certos)

Se pedires ao LLM para respeitar isto, evitas quase todos os erros:

1. **Animação** — sempre com `useCurrentFrame()` + `interpolate()`. **Nunca**
   `transition`/`animation` de CSS nem classes de animação do Tailwind (não
   renderizam).
2. **Ficheiros/imagens** — vão para `public/` e usam-se com `staticFile("...")`
   dentro de `<Img>`, `<Audio>` ou `<Video>`.
3. **Duração e formato** — definidos em `src/Root.tsx` (`durationInFrames`,
   `fps`, `width`, `height`).
4. **Atrasar/limitar elementos** — com `<Sequence from={…} durationInFrames={…}>`.
5. **Texto legível** — num vídeo vertical de 1080 de largura, títulos ≥ 80px e
   texto de apoio ≥ 40px; mantém margens de segurança (~80px dos lados).
6. **Marca** — cores em `src/theme.ts`, tipografia em `src/fonts.ts`, sempre
   "RecarGarage" e texto em PT-PT.

---

## 🚀 Para onde vai cada formato

| Plataforma | Formato | Composição | Comando |
|---|---|---|---|
| Instagram Reels / Stories | 9:16 (1080×1920) | `RecarGaragePromo` ✅ | `npm run render` |
| YouTube Shorts / TikTok | 9:16 (1080×1920) | `RecarGaragePromo` ✅ | `npm run render` |
| Feed Instagram / Facebook | 1:1 (1080×1080) | `RecarGaragePromoSquare` ✅ | `npm run render:square` |
| YouTube / Google Ads (vídeo) | 16:9 (1920×1080) | `RecarGaragePromoWide` ✅ | `npm run render:wide` |

Os três formatos já existem — corre `npm run render:all` para gerar todos.

---

## 🆘 Problemas comuns

- **"O texto/emoji aparece como quadrado"** — o render *headless* pode não ter a
  fonte de emojis. Evita emojis em texto que tem de renderizar, ou pede ao LLM
  uma alternativa em SVG.
- **"A animação não se mexe no render"** — quase de certeza foi usada uma
  transição de CSS. Troca por `interpolate()`.
- **"A duração total está errada depois de mexer nas cenas"** — o
  `RecarGaragePromo` calcula a duração a partir de `theme.ts` menos as
  transições; confirma os valores em `theme.ts` e `Root.tsx`.
- **Render lento** — normal na primeira vez (o Remotion prepara o Chromium). Usa
  `npx remotion still … --frame=N` para conferir depressa sem render completo.

---

## 📚 Referências

- Documentação Remotion: <https://www.remotion.dev/docs>
- Prompts oficiais do Remotion: <https://www.remotion.dev/prompts>
- Skill instalada neste repo: `.agents/skills/remotion-best-practices/`
