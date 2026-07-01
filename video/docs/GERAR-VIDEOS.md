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
│   ├── Root.tsx              # Regista as composições (os "vídeos") e as suas dimensões
│   ├── RecarGaragePromo.tsx  # O vídeo promo: junta as 6 cenas com transições
│   ├── theme.ts              # Cores da marca, formato (1080×1920), durações das cenas
│   ├── fonts.ts              # Tipografia da marca (Libre Franklin)
│   ├── anim.ts               # Animações reutilizáveis (fadeUp, popIn)
│   ├── scenes/               # Uma cena por ficheiro
│   │   ├── Hook.tsx          #  Gancho — "Mais do que comprar e vender" + logótipo
│   │   ├── Carros.tsx        #  Carros usados, incl. low-cost (cartões de anúncio)
│   │   ├── Pecas.tsx         #  Peças & desmonte (grelha de categorias)
│   │   ├── Oficinas.tsx      #  Oficinas & mecânicos — o ecossistema ligado
│   │   ├── Seguranca.tsx     #  Anúncios verificados, avaliações, confiança
│   │   ├── Chat.tsx          #  Mensagens diretas com o vendedor
│   │   └── CTA.tsx           #  Disponível na Web, iOS e Android + lojas
│   └── components/           # Peças reutilizáveis (Logo, Fundo, Cartão, Selos…)
├── public/brand/            # Ícone da app, logótipo e fotos de carros
├── public/images/           # Fotos de anúncios (ex.: Clio low-cost)
├── public/audio/            # Música de fundo (rockit.mp3)
├── docs/                    # Este guia + imagens de pré-visualização
└── package.json             # Comandos (studio, render, …)
```

O vídeo final tem **1080×1920 (vertical 9:16), 30 fps, ~30 s** — o formato ideal
para Instagram Reels/Stories, YouTube Shorts e TikTok, e também aceite pelo
Google Ads. Apresenta o **ecossistema automóvel** do RecarGarage (carros, peças,
oficinas e mecânicos ligados) e termina com a disponibilidade na **Web, iOS e
Android**.

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
npm run render     # gera video/out/RecarGarage-promo.mp4
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

### 📐 Criar outro formato (quadrado ou horizontal)

O promo atual é **vertical (9:16)**. Para o **feed do Instagram/Facebook** costuma
usar-se **quadrado (1:1, 1080×1080)** e para **YouTube/Google Ads** **horizontal
(16:9, 1920×1080)**. Pede assim:

```
Cria uma variante horizontal (16:9, 1920×1080) do RecarGaragePromo para o YouTube
e Google Ads. Adapta as cenas para o formato largo (títulos e cartões lado a
lado em vez de empilhados), sem cortar texto fora da área segura. Regista-a como
uma nova composição "RecarGaragePromoWide" em Root.tsx, reutilizando as cenas
sempre que possível. Renderiza um frame de cada cena para eu comparar.
```

> 💡 Dica: as cenas atuais têm posições pensadas para o formato vertical. Para
> outros formatos, o mais robusto é ler `useVideoConfig()` (largura/altura) e
> adaptar o layout, em vez de reaproveitar tal e qual.

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

| Plataforma | Formato recomendado | Composição |
|---|---|---|
| Instagram Reels / Stories | 9:16 (1080×1920) | `RecarGaragePromo` ✅ |
| YouTube Shorts / TikTok | 9:16 (1080×1920) | `RecarGaragePromo` ✅ |
| Feed Instagram / Facebook | 1:1 (1080×1080) | *a criar (ver prompt acima)* |
| YouTube / Google Ads (vídeo) | 16:9 (1920×1080) | *a criar (ver prompt acima)* |

O `RecarGaragePromo` vertical já serve a maioria dos canais. Para o feed
quadrado e para o YouTube horizontal, usa os prompts da secção "Criar outro
formato".

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
