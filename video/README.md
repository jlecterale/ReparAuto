# RecarGarage — Vídeos de Marketing (Remotion)

Projeto [Remotion](https://www.remotion.dev) para gerar vídeos promocionais do
**RecarGarage** para Instagram, Google Ads, YouTube e TikTok. É independente do
site e da app móvel.

Traz um vídeo pronto — o **promo de ~30 s** que apresenta o **ecossistema
automóvel** do RecarGarage (carros, peças, oficinas e mecânicos ligados) e termina
com a disponibilidade em **iOS, Android e Web**. Vem nos **três formatos** a
partir do mesmo código:

| Composition | Formato | Uso | Comando |
|---|---|---|---|
| `RecarGaragePromo` | 9:16 | Reels/Stories, Shorts, TikTok | `npm run render` |
| `RecarGaragePromoSquare` | 1:1 | Feed Instagram/Facebook | `npm run render:square` |
| `RecarGaragePromoWide` | 16:9 | YouTube, Google Ads | `npm run render:wide` |

![Pré-visualização das cenas](docs/preview/02-carros.png)

Os mesmos formatos, sem código duplicado (as cenas adaptam-se via `useFormat()`):

| 16:9 (YouTube/Google Ads) | 1:1 (Feed) |
|---|---|
| ![16:9](docs/preview/format-16x9.png) | ![1:1](docs/preview/format-1x1.png) |

## Começar

```sh
npm install       # uma vez
npm run studio    # Remotion Studio (pré-visualização) → http://localhost:3000
npm run render:all # exporta os três formatos para out/
```

## Estrutura

- `src/scenes/` — uma cena por ficheiro (Hook, Carros, Peças, Oficinas, Segurança, Chat, CTA)
- `src/components/` — peças **reutilizáveis** (Background, SceneShell, SceneHeading, Logo, ListingCard, StoreBadge)
- `src/format.ts` — `useFormat()` para layout responsivo por aspeto
- `src/theme.ts` — cores da marca, fps e durações
- `public/brand/` — ícone, logótipo e fotos

## 📖 Como gerar vídeos (guia completo, em português)

Para criar **vídeos novos** ou editar este — incluindo **prompts prontos a colar**
para pedir ao Claude/LLM que escreva o código Remotion por ti — lê:

👉 **[`docs/GERAR-VIDEOS.md`](docs/GERAR-VIDEOS.md)**

## Licença

O Remotion pode exigir uma licença de empresa consoante a dimensão da equipa.
[Ver os termos](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
