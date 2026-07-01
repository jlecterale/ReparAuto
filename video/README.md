# RecarGarage — Vídeos de Marketing (Remotion)

Projeto [Remotion](https://www.remotion.dev) para gerar vídeos promocionais do
**RecarGarage** para Instagram, Google Ads, YouTube e TikTok. É independente do
site e da app móvel.

Traz um vídeo pronto: o **promo vertical de ~30 s** (`RecarGaragePromo`,
1080×1920, 30 fps) que apresenta o **ecossistema automóvel** do RecarGarage —
carros, peças, oficinas e mecânicos ligados num só lugar — e termina com a
disponibilidade na **Web, iOS e Android**.

![Pré-visualização das cenas](docs/preview/02-carros.png)

## Começar

```sh
npm install      # uma vez
npm run studio   # Remotion Studio (pré-visualização) → http://localhost:3000
npm run render   # exporta out/RecarGarage-promo.mp4
```

## Estrutura

- `src/scenes/` — uma cena por ficheiro (Hook, Carros, Peças, Oficinas, Segurança, Chat, CTA)
- `src/components/` — peças reutilizáveis (Logo, Background, ListingCard, …)
- `src/theme.ts` — cores da marca, formato e durações
- `public/brand/` — ícone, logótipo e fotos

## 📖 Como gerar vídeos (guia completo, em português)

Para criar **vídeos novos** ou editar este — incluindo **prompts prontos a colar**
para pedir ao Claude/LLM que escreva o código Remotion por ti — lê:

👉 **[`docs/GERAR-VIDEOS.md`](docs/GERAR-VIDEOS.md)**

## Licença

O Remotion pode exigir uma licença de empresa consoante a dimensão da equipa.
[Ver os termos](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
