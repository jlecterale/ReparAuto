# Plano: Midia Aprimorada

**Prioridade:** MEDIA | **Estimativa Total:** ~8-12 dias de desenvolvimento

---

## 1. Visao Geral

### O Que Resolve

Atualmente, o ReparAuto oferece uma experiencia de midia limitada: fotos estaticas (max 6 por carro), sem zoom, sem video, e uma galeria basica (GalleryModal) com navegacao anterior/seguinte sem gestos touch. Para um marketplace de veiculos usados -- especialmente aqueles que precisam de reparacao -- a qualidade e quantidade de midia visual e decisiva para a confianca do comprador. Fotos profissionais, videos curtos mostrando o motor a funcionar, e vistas 360 graus diferenciam um anuncio confiavel de um suspeito.

### Benchmark Competitivo

- **Standvirtual/OLX**: Suportam ate 30 fotos, galeria com zoom e swipe. Nao tem 360 graus nem video.
- **AutoScout24**: Galeria avancada com zoom, thumbnails, e recentemente adicionou videos curtos.
- **Carvago/Carwow**: Oferecem visualizacao 360 graus para veiculos selecionados.
- **Facebook Marketplace**: Video nativo integrado, sem 360 graus.
- **Oportunidade**: Nenhum concorrente direto em Portugal combina 360 graus + video + galeria premium. Isto posiciona o ReparAuto como o marketplace mais visualmente rico para carros usados em Portugal.

### Historias de Usuario

1. **Como vendedor**, quero fazer upload de um video curto (ate 30s) do motor a trabalhar, para que compradores possam avaliar o estado mecanico sem visita presencial.
2. **Como vendedor**, quero carregar uma sequencia de fotos que simule uma vista 360 graus do veiculo, para destacar o meu anuncio.
3. **Como comprador**, quero ampliar (zoom) e navegar (swipe) nas fotos de um anuncio no telemovel, para ver detalhes como riscos, amolgadelas e estado do interior.
4. **Como vendedor iniciante**, quero receber dicas sobre quais angulos fotografar e como iluminar, para que as minhas fotos sejam mais profissionais.
5. **Como plataforma**, quero aplicar uma marca d'agua automatica nas fotos dos anuncios, para evitar que outros sites copiem o conteudo visual.

---

## 2. Especificacao das Funcionalidades

### Lista de Funcionalidades

| # | Funcionalidade | Descricao | Prioridade |
|---|---------------|-----------|------------|
| F1 | Galeria aprimorada | Zoom pinch/scroll, swipe touch, thumbnails, modo fullscreen, teclado (setas) | Alta |
| F2 | Upload de video curto | Upload de video ate 30s/50MB para Firebase Storage, player inline | Alta |
| F3 | Visualizacao 360 graus | Viewer de foto panoramica/esferica usando Pannellum.js | Media |
| F4 | Guia de fotos profissionais | Modal/tooltip com dicas de fotografia ao fazer upload | Media |
| F5 | Marca d'agua automatica | Canvas overlay com logo/texto "ReparAuto" antes de salvar no Storage | Baixa |

### Fluxos de Usuario

**F1 -- Galeria Aprimorada:**
1. Utilizador abre pagina de detalhes do carro (`DetalhesCarro.tsx`)
2. Clica na foto principal -> abre `GalleryModal` melhorado
3. Pode fazer zoom com pinch (touch) ou scroll (desktop)
4. Navega entre fotos com swipe horizontal (touch) ou setas do teclado
5. Thumbnails na parte inferior mostram todas as fotos; clicar salta diretamente
6. Botao fullscreen para expandir a galeria ao ecra inteiro

**F2 -- Upload de Video:**
1. Vendedor no passo 1 do wizard (`StepFotos`) ve nova opcao "Carregar Video"
2. Seleciona arquivo de video (mp4/webm, max 30s e 50MB)
3. Preview do video aparece no grid junto das fotos
4. No anuncio publicado, video aparece como primeiro item da galeria com icone de play
5. Comprador clica -> player HTML5 nativo com controles

**F3 -- Visualizacao 360 graus:**
1. Vendedor carrega uma foto panoramica/equiretangular no StepFotos
2. Sistema deteta proporcao 2:1 e oferece opcao "Usar como 360 graus"
3. No anuncio, foto 360 graus aparece com viewer interativo (arrastar para rodar)

**F4 -- Guia de Fotos:**
1. Ao entrar no StepFotos, um banner "Dicas para fotos profissionais" aparece
2. Clicar expande um modal com 8 dicas ilustradas (angulos recomendados, iluminacao, etc.)
3. Checklist: frente, traseira, lateral esquerda, lateral direita, painel, motor, interior, detalhe de dano

**F5 -- Marca d'Agua:**
1. Ao fazer upload de foto, antes de enviar para Firebase Storage:
2. Imagem e desenhada num canvas HTML5 offscreen
3. Logo/texto "ReparAuto" e aplicado no canto inferior direito com opacidade 30%
4. Resultado e exportado como JPEG e enviado ao Storage

### Requisitos de UI/UX

- Galeria deve funcionar perfeitamente em dispositivos moveis (touch gestures)
- Video player deve ser leve (HTML5 nativo, sem player externo)
- 360 graus viewer deve ter fallback para imagem estatica em browsers sem suporte WebGL
- Marca d'agua nao deve obstruir mais de 5% da area da foto
- Guia de fotos deve ser acessivel mas nao intrusivo (mostrar uma vez, com opcao de fechar)

---

## 3. Implementacao Tecnica

### Novos Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/ui/EnhancedGallery.tsx` | Galeria com zoom, swipe, fullscreen e suporte a video |
| `src/components/ui/VideoPlayer.tsx` | Player de video inline com controles customizados |
| `src/components/ui/Viewer360.tsx` | Wrapper para Pannellum.js com lazy loading |
| `src/components/anunciar/PhotoGuide.tsx` | Modal com dicas de fotografia profissional |
| `src/components/anunciar/VideoUpload.tsx` | Componente de upload de video com validacao e preview |
| `src/lib/watermark.ts` | Funcao utilitaria para aplicar marca d'agua via Canvas API |
| `src/lib/media.ts` | Utilitarios de midia: validacao video, detecao 360, compressao |
| `src/types/media.ts` | Tipos para MediaItem, VideoMetadata, GalleryConfig |

### Modificacoes em Arquivos Existentes

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/detalhes/GalleryModal.tsx` | Substituir pelo novo `EnhancedGallery` ou refatorar completamente com zoom/swipe |
| `src/components/anunciar/StepFotos.tsx` | Adicionar upload de video, botao de guia, logica de marca d'agua no `processarFotos` |
| `src/types/carro.ts` | Adicionar campo `videos?: string[]` e `foto360?: string` na interface `Carro` |
| `src/types/peca.ts` | Adicionar campo `fotos?: string[]` (atualmente so tem `foto?: string` singular) |
| `src/lib/constants.ts` | Adicionar `MAX_VIDEO_SIZE_MB = 50`, `MAX_VIDEO_DURATION_S = 30`, `MAX_FOTOS_CARRO = 7` |
| `src/pages/DetalhesCarro.tsx` | Integrar EnhancedGallery e VideoPlayer, exibir botao 360 se disponivel |
| `src/lib/db.ts` | Nenhuma alteracao estrutural (videos sao URLs no Storage como fotos) |
| `storage.rules` | Adicionar regra para `video/*` content type, limite de 50MB |
| `src/lib/utils.ts` | Atualizar `renderFoto` para distinguir fotos, videos e 360 |

### Colecoes Firestore (schema)

Nenhuma nova colecao necessaria. Os campos de midia sao adicionados aos documentos existentes:

```
// Collection: cars (documento existente)
{
  ...campos_existentes,
  videos: string[],        // URLs do Firebase Storage (max 1-2 videos)
  foto360: string | null,  // URL da foto panoramica 360
  fotosComWatermark: boolean // Indica se as fotos ja tem marca d'agua
}

// Collection: parts (documento existente)
{
  ...campos_existentes,
  fotos: string[],         // Expandir de foto singular para array (max 3)
}
```

### Regras de Seguranca Firestore

As regras existentes em `firestore.rules` ja cobrem o cenario (campos sao parte do documento `cars`/`parts`). A funcao `hasValidImageCount` precisa de ser atualizada para considerar videos separadamente.

```
// storage.rules -- adicionar regra para videos
function isValidVideo() {
  return request.resource.contentType.matches('video/.*')
         && request.resource.size < 50 * 1024 * 1024;
}

match /ads/{userId}/{allMedia=**} {
  allow write: if (isAuthenticated() && request.auth.uid == userId && (isValidImage() || isValidVideo())) || isAdmin();
}
```

### APIs/Servicos Externos

| Servico | Uso | Custo |
|---------|-----|-------|
| Pannellum.js | Visualizador 360 (open source, MIT) | Gratuito |
| Firebase Storage | Armazenamento de videos e fotos panoramicas | Pay-as-you-go (~$0.026/GB/mes) |
| Canvas API (nativa) | Marca d'agua client-side | Gratuito (nativo do browser) |

### Componentes React Principais

**EnhancedGallery** (substitui GalleryModal):
- Props: `items: MediaItem[]`, `initialIndex: number`, `onClose: () => void`
- Funcionalidades: zoom (useGesture/CSS transform), swipe (touch events), fullscreen (Fullscreen API), teclado
- Estado interno: `currentIndex`, `zoomLevel`, `panOffset`, `isFullscreen`

**VideoPlayer**:
- Props: `src: string`, `poster?: string`, `autoPlay?: boolean`
- HTML5 `<video>` com controles nativos + overlay de play/pause customizado

**Viewer360**:
- Props: `src: string`, `width?: number`, `height?: number`
- Lazy load do Pannellum via `React.lazy` + `Suspense`

---

## 4. Analise Esforco vs Valor

### Detalhamento do Esforco

| Funcionalidade | Frontend | Backend/Storage | Total |
|---------------|----------|----------------|-------|
| F1: Galeria aprimorada | 3 dias | 0 | 3 dias |
| F2: Upload de video | 2 dias | 0.5 dia (storage rules) | 2.5 dias |
| F3: Visualizacao 360 | 2 dias | 0 | 2 dias |
| F4: Guia de fotos | 1 dia | 0 | 1 dia |
| F5: Marca d'agua | 1.5 dias | 0 | 1.5 dias |
| **Total** | **9.5 dias** | **0.5 dia** | **~10 dias** |

### Avaliacao de Valor

- **Impacto no utilizador:** ALTO. Midia e o fator #1 na decisao de compra de veiculos online. Galeria melhorada e video aumentam significativamente a confianca.
- **Diferenciacao competitiva:** ALTO. Nenhum concorrente em Portugal oferece 360 + video + galeria premium combinados.
- **Retencao de vendedores:** MEDIO. Vendedores profissionais (stands) valorizam ferramentas que destaquem os seus anuncios.
- **Custo operacional:** BAIXO. Videos aumentam custo de Storage, mas o limite de 30s/50MB mantem custos controlados.

### Posicao na Matriz

**Quadrante: Alto Valor / Esforco Medio**

A galeria aprimorada (F1) deve ser priorizada por ter o melhor ratio valor/esforco. Video (F2) e o segundo por importancia. 360 graus (F3) e marca d'agua (F5) podem ser implementados em fases posteriores.

---

## 5. Decisoes de Arquitetura

### Decisao 1: Biblioteca 360 graus

**Contexto:** Necessidade de um viewer 360 graus para fotos panoramicas equiretangulares.

| Opcao | Pros | Contras |
|-------|------|---------|
| **Pannellum.js** | Leve (~30KB gzip), maduro, boa documentacao, MIT license, suporta hotspots | Nao tem React wrapper oficial (precisa de wrapper manual) |
| **Photo Sphere Viewer** | API moderna, suporte nativo a React, muitos plugins | Mais pesado (~80KB), menos exemplos em producao |
| **A-Frame** | Framework WebVR completo, suporta VR headsets | Muito pesado (~200KB+), overkill para fotos estaticas 360 |

**Recomendacao:** **Pannellum.js**. E a opcao mais leve e madura. O wrapper React e simples de criar (apenas 20-30 linhas). A-Frame e excessivo para o caso de uso. Photo Sphere Viewer e uma boa alternativa se o peso extra for aceitavel.

### Decisao 2: Estrategia de Video

**Contexto:** Permitir que vendedores publiquem videos curtos do veiculo (motor a trabalhar, interior, etc.).

| Opcao | Pros | Contras |
|-------|------|---------|
| **Firebase Storage direto** | Infraestrutura ja existente, sem dependencia externa, URLs diretas para `<video>` | Sem transcoding automatico, custo de bandwidth elevado para videos grandes, sem adaptive streaming |
| **YouTube/Vimeo embed** | Transcoding gratuito, adaptive streaming, CDN global, zero custo de storage | Dependencia externa, experiencia "sai da plataforma", ads (YouTube), API rate limits |
| **Streaming service (Mux/Cloudflare Stream)** | Transcoding automatico, HLS/DASH, thumbnails automaticos | Custo adicional ($0.025/min armazenado + $0.005/min entregue), complexidade de integracao |

**Recomendacao:** **Firebase Storage direto** para a fase inicial. Com o limite de 30 segundos e 50MB, os videos serao suficientemente pequenos para download direto via `<video>`. O HTML5 video player nativo suporta MP4/WebM em todos os browsers modernos. Se o volume de videos crescer significativamente (>1000 videos), migrar para Cloudflare Stream (R2) pelo custo-beneficio.

---

## 6. Prompt de Implementacao

```
You are implementing the "Enhanced Media" feature set for ReparAuto, a Portuguese used-car marketplace built with React 19 + TypeScript + Tailwind CSS v4 + Firebase. All UI text must be in Portuguese (PT-PT). Code, comments, and variable names in English. Use @/ import alias (maps to src/).

## Context

The project uses:
- React 19 with Context API + custom hooks (no Redux)
- Tailwind CSS v4 with theme defined in src/index.css via @theme
- Firebase Storage for images (currently 1MB limit per image, 6 max photos per car)
- HashRouter for navigation
- Existing gallery: src/components/detalhes/GalleryModal.tsx (basic prev/next navigation, thumbnails, uses Modal wrapper)
- Photo upload: src/components/anunciar/StepFotos.tsx (file input, FileReader base64, max 6 photos, emoji fallback)
- Photo rendering utility: src/lib/utils.ts -> renderFoto() function distinguishes img vs emoji
- Car type: src/types/carro.ts -> Carro interface with fotos: string[] field
- Part type: src/types/peca.ts -> Peca interface with foto?: string (single photo)
- Constants: src/lib/constants.ts -> MAX_FOTOS_CARRO = 6, MAX_FOTO_SIZE_MB = 2
- Storage rules: storage.rules -> isValidImage() checks image/* content type and 1MB limit
- Details page: src/pages/DetalhesCarro.tsx -> uses GalleryModal with galeriaAberta state
- Firestore rules: firestore.rules -> hasValidImageCount() validates photo array size

## Task 1: Enhanced Gallery (replace GalleryModal)

Refactor src/components/detalhes/GalleryModal.tsx into a full-featured gallery:

1. Add pinch-to-zoom on touch devices and scroll-to-zoom on desktop using CSS transform (scale + translate). Track zoomLevel and panOffset in state.
2. Add swipe navigation between photos using touch events (touchstart/touchmove/touchend). Detect horizontal swipe > 50px threshold.
3. Add keyboard navigation: ArrowLeft/ArrowRight to navigate, Escape to close, +/- to zoom.
4. Add fullscreen mode using the Fullscreen API (document.documentElement.requestFullscreen).
5. Keep the existing thumbnail strip at the bottom but make the active thumbnail scroll into view automatically.
6. The component currently uses the Modal wrapper from src/components/ui/Modal.tsx. You may bypass Modal for fullscreen mode but keep it for normal mode.
7. Support a new MediaItem type that can be 'image' | 'video' | '360'. For video items, render an HTML5 <video> element with controls. For 360 items, lazy-load the Pannellum viewer.
8. Add a counter overlay showing "3 / 7" in the top-right corner.

## Task 2: Video Upload Support

Modify src/components/anunciar/StepFotos.tsx to support video upload:

1. Add a new button "Carregar Video (max 30s)" next to the existing "Carregar Imagens Reais" button.
2. Accept video/mp4 and video/webm files. Validate: max 50MB file size, max 30 seconds duration (use HTMLVideoElement to check duration before upload).
3. Store video as a separate field. Update src/types/carro.ts to add: videos?: string[] to the Carro interface and CarroInput type.
4. In the photo grid, show video thumbnails with a play icon overlay. Use the first frame as thumbnail (draw video frame to canvas).
5. Add MAX_VIDEO_SIZE_MB = 50 and MAX_VIDEO_DURATION_S = 30 to src/lib/constants.ts.
6. Update storage.rules to allow video/* content type with 50MB limit in the /ads/ path. Add a new isValidVideo() function alongside the existing isValidImage().
7. When submitting the car listing, upload videos to Firebase Storage at path ads/{userId}/videos/{timestamp}.mp4 and store the download URL in the videos[] array.

## Task 3: 360-Degree Photo Viewer

1. Install pannellum: npm install pannellum (or load via CDN in index.html).
2. Create src/components/ui/Viewer360.tsx: a React wrapper that initializes pannellum.viewer() on a div ref. Props: src (string URL), width/height (optional). Use useEffect for init/cleanup. Lazy load with React.lazy + Suspense.
3. In StepFotos, after a user uploads a photo, check if its aspect ratio is approximately 2:1 (equirectangular). If yes, show a toggle: "Usar como foto 360?" that sets a flag.
4. Add foto360?: string field to Carro interface in src/types/carro.ts.
5. In DetalhesCarro.tsx (src/pages/DetalhesCarro.tsx), if carro.foto360 exists, show a "Ver em 360" button that opens the Viewer360 in a modal.

## Task 4: Professional Photo Guide

1. Create src/components/anunciar/PhotoGuide.tsx: a modal/expandable panel with photography tips.
2. Content (in Portuguese): 8 recommended angles with icons (frente, traseira, lateral esquerda, lateral direita, painel/tablier, motor, interior/bancos, detalhe de dano). Tips on lighting (natural light, avoid flash), background (clean area), and resolution.
3. In StepFotos.tsx, add a small banner at the top: "Dicas para fotos profissionais" with a camera icon. Clicking it opens the PhotoGuide modal.
4. Use localStorage key 'reparauto_photo_guide_seen' to show the banner prominently only on first visit, then collapse it.

## Task 5: Automatic Watermark

1. Create src/lib/watermark.ts with function applyWatermark(imageDataUrl: string): Promise<string>.
2. Implementation: create an offscreen canvas, draw the image, draw "ReparAuto" text in the bottom-right corner at 30% opacity using a semi-bold font, export as JPEG (quality 0.85).
3. In StepFotos.tsx, call applyWatermark() on each photo after FileReader completes and before adding to the fotos array. Only apply to real images (not emojis).
4. The watermark should be subtle: white text with a dark shadow, approximately 3% of image width for font size, positioned 2% from bottom-right edges.

## Important Implementation Notes

- All new components must use Tailwind CSS utility classes only (no CSS modules or styled-components)
- Use @/ import alias for all imports (e.g., import { ... } from '@/lib/watermark')
- Follow existing patterns: use useState/useCallback for state, cleanup effects with return in useEffect
- Portuguese UI text examples: "Galeria de Fotos", "Video do Veiculo", "Vista 360", "Dicas de Fotografia"
- Maintain backward compatibility: existing cars without videos/360 must render correctly
- The EnhancedGallery must gracefully handle the existing emoji-based photos (rendered as centered text, not images)
- Do NOT add any npm packages beyond pannellum (use native browser APIs for zoom, swipe, fullscreen, canvas)
```
