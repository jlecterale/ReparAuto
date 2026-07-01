# 21 — Recorte de Fotos nos Anúncios (Web + Mobile)

## Contexto / problema

As fotos dos anúncios eram carregadas com qualquer proporção e apenas "cortadas"
visualmente no momento da exibição (`object-cover`). O resultado:

- Cards e galerias com enquadramentos inconsistentes (carros cortados na cabeça/rodas).
- O utilizador não tinha controlo sobre o enquadramento — o navegador/app decidia.
- Fotos na vertical (telemóvel) ficavam com grandes faixas cortadas.

Era preciso uma forma de **recortar as fotos para que todas tenham a mesma
proporção**, com opções de **girar, dar zoom e cortar** no momento do upload e ao
editar um anúncio — no site e na app mobile.

## Benchmark competitivo

- **Standvirtual / AutoScout24 / Webmotors / iCarros** — fotos de viaturas em **4:3**,
  o padrão de facto do setor automóvel. Galerias e thumbnails assumem esse rácio.
- **OLX / Mercado Livre** — editor com recorte + rotação no fluxo de publicação;
  utilizadores reclamam quando a app força quadrado (1:1) e corta a viatura.

Decisão: rácio fixo **4:3** (`LISTING_PHOTO_ASPECT = 4 / 3`), partilhado entre web e
mobile, com rotação em incrementos de 90° (o "girar" padrão de croppers) + zoom + arraste.

## User stories

- Como vendedor, ao carregar uma foto quero **enquadrá-la** (mover, ampliar, rodar)
  antes de publicar, para mostrar a viatura como quero.
- Como vendedor, quero que **todas as fotos fiquem com a mesma proporção**, para o
  anúncio ficar profissional.
- Como vendedor, ao **editar** um anúncio quero poder **reajustar** o recorte de uma
  foto já adicionada.

## Âmbito

Sem alterações de tipos, Firestore ou regras de segurança — o recorte acontece
no cliente, antes do upload já existente para o Storage. As fotos continuam a ser
strings (URLs/emoji) no documento.

### Web (`src/`)

- **`lib/constants.ts`** — novo `LISTING_PHOTO_ASPECT = 4 / 3`.
- **`lib/cropImage.ts`** (novo) — utilitários puros de canvas: `coverScale`,
  `clampOffset`, `rotatedSize`, `loadImage` e `cropImageToBlob` (desenha a transformação
  do utilizador num canvas de rácio fixo e exporta JPEG 0.85, máx. 1600px). Substitui a
  compressão separada (`compressImage.ts` continua a existir para outros usos).
- **`components/ui/ImageCropper.tsx`** (novo) — modal de edição: arrastar (pointer),
  zoom (roda do rato / pinça / slider), rodar 90° (esquerda/direita), repor, grelha de
  terços. O preview usa exatamente o mesmo modelo de transformação que o canvas.
- **`components/anunciar/FotosEditor.tsx`** — cada ficheiro escolhido passa por uma
  **fila** de recorte (um de cada vez); botão de **editar** (lápis) por miniatura.
  Cobre o assistente de carro, e os modais de edição admin (carro/peça) que reutilizam
  o componente.
- **`components/pecas/PecaForm.tsx`** — foto única passa pelo cropper; botão de editar.

### Mobile (`mobile/`)

- **`package.json`** — adiciona `expo-image-manipulator` (rodar/recortar/redimensionar nativo).
- **`src/lib/constants.ts`** — `LISTING_PHOTO_ASPECT = 4 / 3` (espelha a web).
- **`src/components/anunciar/ImageCropper.tsx`** (novo) — editor em ecrã inteiro com
  `react-native-gesture-handler` + `react-native-reanimated` (arrastar + pinça),
  botões de rodar/zoom/repor, moldura de rácio fixo e grelha de terços. A rotação é
  aplicada re-renderizando a imagem de trabalho (via `ImageManipulator`), de modo a que
  o recorte só lide com uma imagem "direita" — igual ao modelo da web.
- **`src/components/anunciar/PhotoPicker.tsx`** — imagens escolhidas/capturadas passam
  por uma fila de recorte antes de serem adicionadas; botão de **editar** (crop) por
  miniatura. O pipeline de upload (`uploadFotoIfLocal`) mantém-se inalterado.

## Casos extremos

- **Várias fotos de uma vez** (carro, até 6/7): processadas em fila, com título
  "Foto X de Y"; cancelar uma salta apenas essa.
- **Cancelar** um recorte de uma foto nova descarta-a; cancelar a edição de uma foto
  existente mantém a original.
- **Editar foto já enviada (URL remoto)**: a web tenta `crossOrigin="anonymous"`; se o
  bucket não tiver CORS, mostra erro e pede para remover/readicionar. No mobile, depende
  do `ImageManipulator` conseguir ler o URL remoto; caso contrário, mostra erro. O caminho
  principal (recorte no upload, ficheiros locais) funciona sempre.
- **Limpeza de memória**: object URLs temporários do cropper são revogados após cada
  item; os blobs finais continuam em `filesRef` até ao upload (comportamento já existente).

## Verificação

- Web: `npx tsc --noEmit` e `npm run build` — ambos limpos.
- Mobile: `npx tsc --noEmit` — limpo.
- Manual: carregar 1 e várias fotos (carro/peça), rodar/zoom/arrastar/recortar, reordenar,
  remover, editar uma miniatura, publicar e confirmar enquadramento 4:3 nos cards.
