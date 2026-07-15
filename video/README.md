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

## 📱 Série Instagram — Reels para profissionais (oficinas & stands)

Dez Reels 9:16 (~20–22 s cada) focados em **oficinas** e **stands**, cada um a
destacar um diferencial do RecarGarage. Estrutura comum: gancho (3 s) → duas
cenas de produto (mock da UI real) → CTA final. Renderiza todos com
`npm run render:reels` (saem para `out/reels/`), ou um de cada vez com
`npx remotion render <Composition> out/<ficheiro>.mp4`.

| # | Composition | Público | Diferencial destacado |
|---|---|---|---|
| 01 | `ReelProDashboard` | Stands + oficinas | Painel Profissional: KPIs e gráfico em tempo real |
| 02 | `ReelCrm` | Oficinas | CRM de clientes + importação CSV |
| 03 | `ReelLeads` | Stands | Intenções de compra → leads qualificados |
| 04 | `ReelVerifiedSeller` | Stands | Selo Verificado + prioridade nos resultados |
| 05 | `ReelAiListing` | Stands | Anúncios com IA: descrição + sugestão de preço |
| 06 | `ReelPricing` | Stands | Price intelligence: badge de 5 níveis + mercado |
| 07 | `ReelWorkshop` | Oficinas | Visibilidade no mapa + avaliações |
| 08 | `ReelChat` | Ambos | Chat integrado + notificações push |
| 09 | `ReelParts` | Oficinas | Vender peças paradas (stock → receita) |
| 10 | `ReelEcosystem` | Ambos | Ecossistema completo, grátis para começar |
| 11 | `ReelSpin360` | Stands | Vista 360° por fotos + captura guiada (plano 23) |
| 12 | `ReelPartsFinder` | Oficinas | Encontrar peças compatíveis + confirmar no chat |
| 13 | `ReelRepairFlip` | Oficinas | Carros para restaurar: estado real + análise de danos IA |
| 14 | `ReelAudioListing` | Ambos | Anúncio por áudio: fala e a IA preenche o formulário |
| 15 | `ReelStandImport` | Stands | Importar anúncios do Standvirtual por URL (1, lote ou stand inteiro) |

### 🇧🇷 Variantes pt-BR

Cada reel (exceto o 15, específico do Standvirtual/Portugal) tem uma composição
irmã com sufixo **`BR`** (`ReelProDashboardBR`, `ReelCrmBR`, …) na pasta
"Instagram-Reels-BR" do Studio: mesma estrutura e animações, mas copy em
português do Brasil — "você" em vez de "tu", "estoque/lojista/celular/freios"
em vez de "stock/stand/telemóvel/travões", preços em **R$** e cidades
brasileiras. Renderiza todas com `npm run render:reels:br`
(saem para `out/reels/br/`).

> Nota: os Reels 01/02 (painel + CRM), 04, 05 e 06 apresentam funcionalidades
> das PRs #33, #58, #54 e #9, o Reel 13 usa a análise de danos da PR #54, o
> Reel 14 o anúncio por áudio da PR #69 e o Reel 15 a importação do
> Standvirtual da PR #78 — publica esses vídeos apenas depois de os recursos
> estarem em produção.

## Começar

```sh
npm install       # uma vez
npm run studio    # Remotion Studio (pré-visualização) → http://localhost:3000
# ou, a partir da raiz do repositório: npm run studio → http://localhost:4000
npm run render:all # exporta os três formatos para out/
```

## Estrutura

- `src/scenes/` — uma cena por ficheiro (Hook, Carros, Peças, Oficinas, Segurança, Chat, CTA)
- `src/reels/` — um Reel do Instagram por ficheiro (série para profissionais)
- `public/fonts/` — Libre Franklin local (o render não depende da rede)
- `src/components/` — peças **reutilizáveis** (Background, SceneShell, SceneHeading, Logo, ListingCard, StoreBadge, Reel, HookScene, EndCard, UiCard, Soundtrack)
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
