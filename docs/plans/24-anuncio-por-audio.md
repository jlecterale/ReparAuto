# Plano 24 — Anúncio por Áudio (Web + Mobile)

## Contexto e o que resolve

Criar um anúncio completo exige preencher ~15 campos num ecrã pequeno. Muitos vendedores
sabem descrever o carro de cor ("é um Renault Clio de 2012, gasolina, caixa manual,
180 mil km, cinzento, 5 portas, quero 4500 euros…") mas desistem a meio do formulário.

Este plano adiciona um assistente de áudio à criação de anúncios (carro e peça), no site
e na app mobile:

1. O utilizador **grava na hora** (microfone) ou **envia um ficheiro de áudio** (ex.: mp3
   gravado no WhatsApp) a descrever o veículo/peça.
2. O áudio é enviado para uma **API route do Next.js** (`POST /api/listing-from-audio`),
   autenticada com o token Firebase do utilizador.
3. O servidor chama o **Gemini** (entrada de áudio multimodal + *structured output*) que
   transcreve **e** extrai os campos numa única chamada: marca, modelo, ano, cor,
   combustível, caixa, km, preço, portas, lugares, categoria, tração, extras,
   localidade, descrição, etc.
4. O formulário é pré-preenchido; o utilizador revê, ajusta e só lhe falta juntar as
   **fotos** — exatamente o fluxo pedido.

## Benchmark competitivo

- **OLX Brasil** (out/2025): primeira do mercado a preencher anúncios automaticamente por
  IA — mas **a partir de fotos**, não de voz; o vendedor ainda escreve km, cor e descrição.
- **ZAP (grupo OLX)**: busca de imóveis descrita por voz/texto — voz usada na *procura*,
  não na criação de anúncio.
- **Standvirtual / AutoScout24 / Webmotors / CustoJusto**: catálogos inteligentes por
  matrícula/placa ou marca-modelo; nenhum tem criação por áudio.

**Conclusão**: criação de anúncio por voz é um diferencial real nos dois mercados (PT e BR).

## Porquê Gemini direto (e não uma biblioteca de speech-to-text)

| Opção | Prós | Contras |
| --- | --- | --- |
| **Web Speech API** (browser) | grátis, sem backend | não existe no Firefox/alguns WebViews, qualidade irregular, só transcreve — precisaria de uma 2.ª etapa de extração na mesma |
| **STT dedicado** (Google STT, Whisper) | transcrição robusta | só devolve texto; precisa sempre de um LLM a seguir para extrair campos → 2 chamadas, 2 integrações |
| **Gemini multimodal** ✅ | uma única chamada: áudio → JSON estruturado (`responseSchema`); entende PT-PT e PT-BR; ~32 tokens/seg de áudio (barato no Flash); é a IA que o projeto já vai adotar | requer chave de API no servidor |

Formatos aceites pelo Gemini: WAV, MP3, AIFF, AAC, OGG, FLAC (webm **não** está na lista
oficial). Como o `MediaRecorder` do Chrome grava webm/opus, a web **converte a gravação
para WAV 16 kHz mono no cliente** (Web Audio API — determinístico, sem ffmpeg no servidor,
~1,9 MB/min, muito abaixo do limite de 20 MB inline). Ficheiros enviados (mp3/wav/ogg/
aac/m4a/flac) seguem como estão. No mobile, o `expo-audio` grava `.m4a` (AAC), aceite
diretamente.

## User stories

- Como vendedor, quero gravar um áudio a descrever o meu carro e ver o formulário
  preenchido, para anunciar em menos de um minuto.
- Como vendedor, quero enviar um áudio já gravado (mp3/voice note), para não ter de
  repetir a descrição.
- Como vendedor, quero rever o que a IA preencheu antes de publicar, para corrigir
  qualquer engano.
- Como utilizador da app, quero o mesmo assistente no telemóvel, onde escrever é
  ainda mais penoso.

## Âmbito / arquitetura

### Servidor (novo — primeira API route do projeto)

- `app/api/listing-from-audio/route.ts` — `POST` multipart (`audio`, `kind: carro|peca`):
  1. Verifica o token Firebase (`Authorization: Bearer`) com o Admin SDK — endpoint pago,
     só para utilizadores autenticados. Sem ADC local, o dev configura `GOOGLE_APPLICATION_CREDENTIALS`
     ou aceita 401 (o recurso fica desativado em dev sem credenciais).
  2. Valida MIME (wav/mp3/ogg/aac/m4a/flac) e tamanho (≤ 12 MB; base64 +33% < limite de 20 MB).
  3. Chama o Gemini (`@google/genai`, modelo `GEMINI_MODEL` ∈ env, default `gemini-flash-latest`)
     com `responseMimeType: application/json` + `responseSchema` (enums do domínio).
  4. Sanitiza o resultado (`src/lib/audioListing.ts`) e responde `{ fields, transcript }`.
- `src/lib/audioListing.ts` — **lógica pura, TDD**: schemas Gemini, prompts, e
  `sanitizeCarExtraction` / `sanitizePartExtraction` (clamps de ano/km/preço/portas,
  matching de enums sem acentos/caixa, interseção de extras com `EQUIPAMENTOS_CARRO`,
  matching de concelho/distrito via `geo.ts`).
- Env: `GEMINI_API_KEY` (secret; `apphosting.yaml` via Cloud Secret Manager + `.env.local`
  em dev). Sem chave → `503` e a UI esconde/desativa o assistente graciosamente.

### Web

- `src/lib/audioWav.ts` — **TDD no encoder**: `encodeWav(samples, sampleRate)` (PCM 16-bit)
  + `blobToWav(blob)` (decode + downmix mono + resample 16 kHz via `OfflineAudioContext`).
- `src/lib/audioListingClient.ts` — MIME por extensão, limites, `requestListingFromAudio()`.
- `src/components/anunciar/AudioAdAssistant.tsx` — cartão "Preencher por voz":
  gravar (com temporizador, máx. 3 min), ou escolher ficheiro; pré-escuta; botão
  "Preencher com IA" com estado de loading; erros por toast; a11y (`aria-pressed`, foco).
  - Integrado no topo de `StepDados` (carro) — preenche também `preco`/`descricao`
    do StepPreco — e no topo de `PecaForm` (peça).
- `next.config.ts`: `Permissions-Policy` microphone `()` → `(self)`.
  (`connect-src 'self'` já cobre a API route; a chamada Gemini é servidor-a-servidor.)

### Mobile (autorizado: o pedido é explicitamente web + mobile)

- Deps novas: `expo-audio` (gravação) e `expo-document-picker` (escolher ficheiro).
- `app.config.ts`: plugin `expo-audio` com `microphonePermission` em PT; retirar os
  bloqueios `microphonePermission: false` / `recordAudioAndroid: false` dos plugins
  expo-camera/expo-image-picker (senão o `RECORD_AUDIO` do expo-audio é removido do
  manifest na fusão). ⚠️ **Exige novo build nativo** (runtime fingerprint muda — OTA
  não entrega isto).
- `mobile/src/lib/audioListing.ts` — chamada à API do site
  (`EXPO_PUBLIC_WEB_API_BASE_URL`, default `https://www.recargarage.com`) com
  `auth().currentUser.getIdToken()`.
- `mobile/src/components/anunciar/AudioAdAssistant.tsx` — mesmo cartão em NativeWind,
  integrado em `app/anunciar/carro.tsx` e `peca.tsx`.

### O que fica de fora (deliberado)

- Oficinas e intenções de compra (formulários diferentes; extensão natural futura).
- Web Speech API como fallback offline (qualidade irregular; não vale a dupla manutenção).
- Guardar o áudio no Storage (o áudio é efémero — só serve para extração).

## Sequência de commits

1. `feat: add audio→listing extraction core (schemas, prompts, sanitizers)` — TDD em
   `src/lib/audioListing.ts` + `src/lib/audioWav.ts` (encoder).
2. `feat: add /api/listing-from-audio route (Gemini + Firebase auth)` + deps + env docs.
3. `feat(web): audio ad assistant in car and part forms` + Permissions-Policy.
4. `feat(mobile): audio ad assistant (record or pick audio) in car and part forms`.
5. `docs: mark plan 24 (anúncio por áudio) as shipped`.

## Casos de borda

- Áudio sem informação nenhuma / música → todos os campos `null`; toast "Não conseguimos
  perceber os detalhes — tente descrever o carro por palavras".
- Valores absurdos ("um milhão de quilómetros") → clamps dos sanitizers descartam.
- Marca dita de forma aproximada ("bê-eme-double-u") → prompt instrui normalização para o
  nome canónico; matching tolerante a acentos/caixa contra `marcas-modelos.json`.
- "Quatro mil e quinhentos" vs "4500" → o schema pede números; sanitizer valida.
- Enum fora da lista (ex. "GPL") → descartado (campo fica por preencher, nunca inventado).
- Permissão de microfone negada → mostrar só a opção de enviar ficheiro.
- Ficheiro > 12 MB ou formato não suportado → erro claro antes de qualquer upload.
- Token expirado/ausente → 401; sem `GEMINI_API_KEY` → 503 e assistente desativado.
- Utilizador já preencheu campos à mão → **só preencher campos vazios** nunca
  sobrescrever valores digitados (exceto defaults intactos como combustível/caixa).

## Verificação

1. `npm test` (novos testes: sanitizers, prompts/schemas, encoder WAV, componente web).
2. `npx tsc --noEmit` + `npm run build` (raiz) e `npm run typecheck` (mobile/).
3. Manual (com `GEMINI_API_KEY` em `.env.local`): gravar descrição em PT → campos
   preenchidos; enviar mp3 → idem; áudio vazio → toast; sem sessão → 401.
