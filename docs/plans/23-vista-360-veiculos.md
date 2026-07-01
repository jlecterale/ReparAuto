# Plano 23 — Vista 360° dos Veículos (rotação por fotos angulares)

**Status: Implementado** (web + mobile, no mesmo PR que este documento)

## Contexto — o que resolve

Fotos estáticas não deixam o comprador "andar à volta" do carro. Os marketplaces que
oferecem rotação 360 (Carvana, Cars24, Carvago) registam mais tempo de permanência no
anúncio e mais confiança na compra à distância. O plano 05 (mídia aprimorada) previa
360 via foto panorâmica equiretangular + Pannellum.js, mas isso exige equipamento
especial do vendedor e uma dependência WebGL — nunca foi implementado.

Esta versão usa a abordagem *spin por sequência de fotos*: o criador do anúncio marca
o ângulo de cada foto normal (frente, trás, laterais, diagonais) e, quando os 4
ângulos cardeais estão marcados, o anúncio ganha um viewer de arrastar-para-rodar.
Zero fotos extra, zero dependências, funciona com as fotos que o vendedor já tira.

## Benchmark competitivo

- **Standvirtual / OLX PT / CustoJusto**: galeria com zoom/swipe; sem 360.
- **AutoScout24**: galeria avançada; 360 apenas em stands profissionais com equipamento.
- **Webmotors / iCarros / Mobiauto (BR)**: fotos estáticas; Webmotors tem 360 só em
  lojas parceiras (fotografia profissional).
- **Carvana / Cars24**: spin por sequência de fotos — o padrão que este plano adota,
  mas aqui alimentado pelo próprio vendedor (marketplace C2C).
- **Oportunidade**: nenhum marketplace generalista em PT/BR oferece 360 criado pelo
  próprio vendedor sem equipamento especial.

## Histórias de usuário

1. **Como vendedor**, quero marcar o ângulo de cada foto (frente, trás, laterais) para
   que o meu anúncio se destaque com o selo/vista 360°.
2. **Como comprador**, quero arrastar o dedo/rato para rodar o veículo e inspecioná-lo
   de todos os lados antes de contactar o vendedor.
3. **Como vendedor que edita o anúncio**, quero que as marcações sobrevivam a
   reordenar/recortar/remover fotos sem ter de refazer tudo.

## Desenho técnico

### Modelo de dados (Firestore `cars`)

- Novo campo opcional `photoAngles?: Record<string, number>` — mapa *ângulo → índice
  no array `fotos`*. Sem migração: anúncios antigos simplesmente não têm o campo.
- 8 ângulos ordenados (sentido horário): `front`, `frontRight`, `right`, `rearRight`,
  `rear`, `rearLeft`, `left`, `frontLeft`. Modo 360 ativo quando os 4 cardeais
  (`front`, `right`, `rear`, `left`) apontam para fotos válidas.
- `firestore.rules` não precisou de alterações (updates de dono não têm allowlist de
  chaves; `hasValidImageCount` só valida `fotos`).

### Lógica pura partilhada — `src/lib/spin360.ts` (espelhada em `mobile/src/lib/spin360.ts`)

- `isSpinEnabled`, `getSpinFrames`, `getSpinAngles` — validação e sequência circular
  (tags órfãs de fotos removidas são ignoradas; cardeais inválidos desativam o modo).
- `spinFrameFromDrag` — matemática arrasto→frame com wrap nos dois sentidos.
- `toPhotoAngles` / `toAngleByPhoto` — congelar/hidratar as tags entre o estado do
  formulário (keyed pela string da foto, sobrevive a reordenação) e o mapa persistido.
- Testes em `src/lib/spin360.test.ts` (TDD, 18 testes).

### Captura guiada com moldura (web + mobile)

- Fluxo "Captura guiada 360°" acessível a partir do banner 360 no passo de fotos:
  percorre os ângulos ainda por marcar na ordem física de andar à volta do carro
  (`getCaptureSequence`), com **moldura** 4:3 tracejada sobre a câmara ao vivo,
  rótulo do ângulo, indicador necessário/opcional, progresso (N/8), diagrama
  vista-de-cima com a posição onde o vendedor deve estar, e botão "Saltar".
- Cada foto é recortada ao centro para o aspecto do anúncio (4:3) e **marcada
  automaticamente** com o ângulo — sem passar pelo cropper manual.
- Web: `GuidedSpinCapture` compõe o `CameraCapture` existente (que ganhou props
  `overlay`, `cropAspect` e `keepOpenAfterCapture`).
- Mobile: `GuidedSpinCapture` com `CameraView` do **expo-camera** (dependência
  nova — a câmara do sistema via expo-image-picker não permite overlay). Exige
  rebuild nativo do dev-client/EAS; o `runtimeVersion: fingerprint` impede que
  um OTA chegue a binários sem o módulo.

### Web

- `FotosEditor` (criação + modal de edição): seletor de ângulo por foto + banner de
  progresso ("Vista 360° (2/4) — falta marcar: …" / "✓ Vista 360° ativa").
- `Anunciar.handlePublicar` e `EditarCarroModal.handleSave`: as tags seguem a foto do
  blob URL para o URL do Storage e são congeladas com `toPhotoAngles` ao gravar.
- `src/components/detalhes/Spin360Viewer.tsx`: viewer fullscreen com pointer events
  (arrastar roda; setas do teclado; Escape fecha; frames todos montados para não
  piscar; rótulo do ângulo atual; dica inicial).
- Botão "360°" sobre a foto de capa em `DetalhesCarro` quando o modo está ativo.

### Mobile (React Native / Expo)

- `PhotoPicker`: chip de ângulo por foto + BottomSheet de seleção (com "noutra foto"
  para ângulos já usados) + banner de progresso.
- `anunciar/carro.tsx`: tags seguem a foto do URI local para o URL após upload;
  hidratação no modo edição com `toAngleByPhoto`.
- `mobile/src/components/ui/Spin360Viewer.tsx`: Modal fullscreen com `Gesture.Pan`
  (gesture-handler) a fazer scrub dos frames.
- Botão "360°" na galeria de `detalhes/[id].tsx`.

## Casos extremos cobertos

- Reordenar fotos → tags keyed pela string da foto, imunes à ordem; índices só são
  calculados ao gravar.
- Remover foto marcada → tag removida; se era cardeal, o banner volta a "falta marcar".
- Recortar/re-editar foto (URL muda) → a tag segue a foto nova.
- Mesmo ângulo em duas fotos → impossível; selecionar um ângulo já usado "rouba-o".
- Emojis como foto (web) → não podem ser marcados (sem seletor).
- Dados antigos/corrompidos (índice fora do array) → cardeal inválido desativa o modo;
  ângulo opcional inválido é apenas ignorado.

## Verificação

- `npm test` (suite inclui `spin360.test.ts`), `npx tsc --noEmit`, `npm run build` na web.
- `npm run typecheck` em `mobile/`.
- Manual: criar anúncio com 4+ fotos marcadas → botão 360° na página de detalhes →
  arrastar roda o veículo; editar anúncio mantém as marcações.

## Deliberadamente fora de âmbito

- 360 para peças (têm 1 foto) e oficinas.
- Foto panorâmica equiretangular / Pannellum (abordagem antiga do plano 05).
- Interpolação/morphing entre frames (candidato a iteração futura).
