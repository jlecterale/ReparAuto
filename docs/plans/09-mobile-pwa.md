# Plano 09 — Mobile e PWA

> **Status:** IMPLEMENTADO (PR #4)
> **Prioridade:** ALTA
> **Estimativa total:** 5-7 dias de desenvolvimento
> **Dependencias:** Nenhuma (pode ser implementado de forma independente)

### Resumo da Implementacao

Todas as 8 funcionalidades foram implementadas em PR #4 com melhorias adicionais baseadas em code review e pesquisa competitiva (OLX, Standvirtual, AutoScout24).

| Funcionalidade | Status | Notas |
|---|---|---|
| PWA Manifest + Service Worker | Feito | vite-plugin-pwa + Workbox (generateSW), precache de 15 entries |
| Prompt de Instalacao | Feito | Engagement-based (3+ page views), dismiss expira em 14 dias |
| Push Notifications (FCM) | Feito | fcm.ts + firebase-messaging-sw.js com deep-linking no click |
| Cache Offline | Feito | Firestore persistentLocalCache + Workbox runtime caching |
| Skeleton Screens | Feito | Shimmer animation, CarCardSkeleton + PecaCardSkeleton |
| Lazy Loading Imagens | Feito | IntersectionObserver + error fallback + decoding="async" |
| Swipe na Galeria | Feito | Visual drag feedback (translateX) + keyboard arrows |
| Share API | Feito | Web Share API + desktop dropdown (WhatsApp, Facebook, Copy) |

**Arquivos criados:** `useInstallPrompt.ts`, `useOnlineStatus.ts`, `useSwipe.ts`, `InstallBanner.tsx`, `OfflineBanner.tsx`, `Skeleton.tsx`, `LazyImage.tsx`, `ShareButton.tsx`, `FotoRender.tsx`, `fcm.ts`, `firebase-messaging-sw.js`, `pwa-icon.svg`, `favicon.svg`, `vite-env.d.ts`

**Arquivos modificados:** `vite.config.ts`, `index.html`, `package.json`, `App.tsx`, `firebase.ts`, `index.css`, `GalleryModal.tsx`, `CarCard.tsx`, `CarGrid.tsx`, `PecasCard.tsx`, `PecasGrid.tsx`, `DetalhesCarro.tsx`

---

## 1. Visao Geral

### O Que Resolve

O ReparAuto atualmente funciona como uma SPA (Single Page Application) acessada exclusivamente pelo navegador. Isso significa que os usuarios precisam abrir o browser, digitar a URL, e nao recebem notificacoes quando um novo anuncio relevante aparece ou quando recebem uma mensagem. Em Portugal, onde o acesso mobile domina o mercado de classificados automotivos (70%+ do trafego), essa limitacao impacta diretamente o engajamento e a retencao de usuarios.

Transformar o ReparAuto em uma Progressive Web App (PWA) resolve esses problemas ao permitir instalacao na tela inicial, funcionamento offline, notificacoes push e uma experiencia nativa no celular — tudo sem os custos e complexidade de desenvolver apps nativos para iOS e Android.

### Benchmark Competitivo

| Plataforma | PWA | Push | Offline | Share API | Swipe Gallery |
|---|---|---|---|---|---|
| **OLX Portugal** | Sim | Sim | Parcial | Sim | Sim |
| **Standvirtual** | Nao (app nativo) | Sim | Nao | Sim | Sim |
| **Custojusto** | Parcial | Nao | Nao | Nao | Sim |
| **AutoScout24** | Sim | Sim | Parcial | Sim | Sim |
| **ReparAuto (atual)** | Nao | Nao | Nao | Nao | Nao |
| **ReparAuto (proposto)** | Sim | Sim | Sim | Sim | Sim |

### Historias de Usuario

1. **Como usuario mobile**, quero instalar o ReparAuto na minha tela inicial para acessar rapidamente sem precisar abrir o navegador e digitar a URL.
2. **Como vendedor**, quero receber notificacoes push quando alguem envia uma mensagem sobre o meu anuncio, mesmo com o app fechado.
3. **Como comprador**, quero ser notificado quando novos carros que correspondem aos meus criterios de busca sao publicados.
4. **Como usuario**, quero consultar anuncios que ja visitei mesmo sem conexao com a internet (ex: no metro, em zonas sem rede).
5. **Como comprador mobile**, quero fazer swipe nas fotos do carro na galeria de forma natural e intuitiva.
6. **Como usuario**, quero compartilhar um anuncio interessante com amigos via WhatsApp, Telegram ou outras apps do meu celular.

---

## 2. Especificacao das Funcionalidades

### Lista de Funcionalidades

| # | Funcionalidade | Descricao | Complexidade |
|---|---|---|---|
| F1 | PWA Manifest + Service Worker | Configuracao completa de manifest.json, icons, service worker via vite-plugin-pwa | Media |
| F2 | Prompt de instalacao | Banner customizado "Adicionar a tela inicial" com logica de deferimento | Baixa |
| F3 | Push Notifications (FCM) | Integracao Firebase Cloud Messaging para notificacoes de mensagens e anuncios | Alta |
| F4 | Cache offline | Estrategia de cache para paginas visitadas, assets estaticos e dados de anuncios | Media |
| F5 | Skeleton screens | Componentes de loading skeleton para cards, detalhes e listas | Baixa |
| F6 | Lazy loading de imagens | IntersectionObserver para carregamento sob demanda de fotos nos cards | Baixa |
| F7 | Swipe na galeria | Gestos touch para navegar entre fotos no GalleryModal | Media |
| F8 | Share API nativa | Botao de compartilhar usando navigator.share() com fallback | Baixa |

### Fluxos de Usuario

**Fluxo 1 — Instalacao PWA:**
1. Usuario acessa o ReparAuto pelo navegador mobile
2. Apos 2+ visitas, aparece um banner discreto "Instalar ReparAuto"
3. Usuario clica em "Instalar" → prompt nativo do navegador aparece
4. App e adicionada a tela inicial com icone e splash screen
5. Proximas aberturas sao em modo standalone (sem barra do navegador)

**Fluxo 2 — Push Notification:**
1. Usuario faz login no ReparAuto
2. App solicita permissao para notificacoes (uma unica vez)
3. Token FCM e salvo no Firestore vinculado ao uid do usuario
4. Quando outro usuario envia mensagem, Cloud Function dispara push
5. Usuario recebe notificacao mesmo com app fechado
6. Ao clicar na notificacao, app abre na conversa relevante

**Fluxo 3 — Modo Offline:**
1. Usuario navega por varios anuncios enquanto tem conexao
2. Service worker faz cache das paginas e dados visitados
3. Ao perder conexao, usuario ve banner "Modo offline"
4. Anuncios previamente visitados continuam acessiveis
5. Acoes de escrita (mensagens, favoritos) ficam em fila
6. Ao retornar online, acoes na fila sao sincronizadas

**Fluxo 4 — Compartilhar Anuncio:**
1. Na pagina de detalhes do carro, usuario clica no botao "Compartilhar"
2. Se navigator.share() disponivel → abre share sheet nativa do SO
3. Se nao disponivel → mostra opcoes: copiar link, WhatsApp, Facebook
4. Link compartilhado inclui titulo do anuncio e URL direta

### Requisitos de UI/UX

- **Banner de instalacao:** aparece na parte inferior da tela, estilo toast, com icone do app, texto e botoes "Instalar" / "Agora nao". Dismissivel. Reaparece apos 7 dias se nao instalado.
- **Skeleton screens:** devem replicar a forma exata do componente final (CarCard, detalhes). Usar animacao pulse do Tailwind (`animate-pulse`).
- **Indicador offline:** banner amarelo fixo no topo "Sem conexao — a mostrar dados guardados" com icone de wifi cortado.
- **Swipe gallery:** suportar swipe horizontal com feedback visual (momentum). Indicador de posicao (dots) na parte inferior. Deve ser suave em dispositivos de gama baixa.
- **Share button:** icone de share (lucide-react `Share2`) ao lado do botao de favorito na pagina de detalhes.
- **Splash screen:** fundo brand-800 (#243b53) com logo ReparAuto centralizado.

---

## 3. Implementacao Tecnica

### Novos Arquivos a Criar

| Arquivo | Descricao |
|---|---|
| `src/components/pwa/InstallPrompt.tsx` | Banner de instalacao PWA com logica beforeinstallprompt |
| `src/components/pwa/OfflineBanner.tsx` | Indicador de estado offline |
| `src/components/ui/Skeleton.tsx` | Componente base de skeleton loading |
| `src/components/ui/CarCardSkeleton.tsx` | Skeleton especifico para CarCard |
| `src/components/ui/LazyImage.tsx` | Componente de imagem com lazy loading e placeholder |
| `src/components/ui/ShareButton.tsx` | Botao de compartilhar com Web Share API |
| `src/hooks/useSwipe.ts` | Hook customizado para gestos de swipe touch |
| `src/hooks/useOnlineStatus.ts` | Hook para monitorar estado da conexao |
| `src/hooks/usePWAInstall.ts` | Hook para logica de instalacao PWA |
| `src/lib/fcm.ts` | Configuracao e helpers do Firebase Cloud Messaging |
| `src/sw-custom.ts` | Logica customizada do service worker (cache strategies) |
| `public/manifest.json` | Manifesto PWA com icones, cores, display mode |
| `public/icons/icon-192.png` | Icone PWA 192x192 |
| `public/icons/icon-512.png` | Icone PWA 512x512 |
| `public/icons/maskable-512.png` | Icone maskable para Android |

### Modificacoes em Arquivos Existentes

| Arquivo | Modificacao |
|---|---|
| `vite.config.ts` | Adicionar vite-plugin-pwa com configuracao Workbox |
| `package.json` | Adicionar dependencias: vite-plugin-pwa, workbox-* |
| `index.html` | Adicionar link para manifest.json, meta theme-color, apple-touch-icon |
| `src/lib/firebase.ts` | Exportar getMessaging() para FCM |
| `src/App.tsx` | Adicionar InstallPrompt e OfflineBanner no layout |
| `src/providers/AppProvider.tsx` | Adicionar online status e FCM token management ao contexto |
| `src/components/detalhes/GalleryModal.tsx` | Integrar hook useSwipe para navegacao por gestos |
| `src/components/home/CarCard.tsx` | Substituir img por LazyImage, adicionar skeleton |
| `src/components/home/CarGrid.tsx` | Usar skeletons durante loading |
| `src/pages/DetalhesCarro.tsx` | Adicionar ShareButton, skeletons no loading |
| `src/types/usuario.ts` | Adicionar campo `fcmTokens: string[]` na interface Usuario |
| `firestore.rules` | Regra para colecao `fcm_tokens` |

### Colecoes Firestore

**Colecao `fcm_tokens`** (nova):
```typescript
interface FcmToken {
  id: string;          // auto-generated
  uid: string;         // referencia ao usuario
  token: string;       // token FCM do dispositivo
  platform: string;    // 'web' | 'android' | 'ios'
  createdAt: Timestamp;
  lastUsed: Timestamp;
}
```

**Colecao `push_preferences`** (nova):
```typescript
interface PushPreference {
  uid: string;           // document ID = uid do usuario
  novosAnuncios: boolean;  // notificar sobre novos anuncios
  mensagens: boolean;      // notificar sobre novas mensagens
  statusAnuncio: boolean;  // notificar quando anuncio aprovado/rejeitado
}
```

### Regras de Seguranca Firestore

```
match /fcm_tokens/{tokenId} {
  allow read: if isAuthenticated() && request.auth.uid == resource.data.uid;
  allow create: if isAuthenticated() && request.auth.uid == request.resource.data.uid;
  allow update: if isAuthenticated() && request.auth.uid == resource.data.uid;
  allow delete: if isAuthenticated() && request.auth.uid == resource.data.uid;
}

match /push_preferences/{uid} {
  allow read, write: if isOwner(uid);
}
```

### APIs/Servicos Externos

| Servico | Uso | Custo |
|---|---|---|
| **Firebase Cloud Messaging** | Push notifications | Gratuito (ilimitado) |
| **Workbox (via vite-plugin-pwa)** | Service worker + cache | Gratuito (biblioteca local) |
| **Web Share API** | Compartilhamento nativo | Gratuito (API do navegador) |

### Componentes React Principais

**InstallPrompt.tsx:**
- Escuta evento `beforeinstallprompt`
- Mostra banner apos criteria (2+ visitas, nao dismissado recentemente)
- Armazena estado de dismiss em localStorage
- Chama `prompt()` no evento deferido ao clicar "Instalar"

**ShareButton.tsx:**
- Props: `titulo: string`, `texto: string`, `url: string`
- Usa `navigator.share()` quando disponivel
- Fallback: dropdown com opcoes (copiar link, WhatsApp, Facebook)
- Copia link via `navigator.clipboard.writeText()`

**useSwipe.ts:**
- Retorna `{ onTouchStart, onTouchMove, onTouchEnd, swipeDirection }`
- Threshold configuravel (default: 50px)
- Suporta swipe horizontal (left/right) com callback
- Previne scroll vertical durante swipe horizontal

---

## 4. Analise Esforco vs Valor

### Detalhamento do Esforco

| Funcionalidade | Esforco (dias) | Complexidade | Risco |
|---|---|---|---|
| PWA manifest + service worker | 1 | Media | Baixo |
| Prompt de instalacao | 0.5 | Baixa | Baixo |
| Push notifications (FCM) | 2 | Alta | Medio |
| Cache offline | 1 | Media | Medio |
| Skeleton screens | 0.5 | Baixa | Baixo |
| Lazy loading imagens | 0.5 | Baixa | Baixo |
| Swipe na galeria | 0.5 | Media | Baixo |
| Share API | 0.5 | Baixa | Baixo |
| **Total** | **6.5** | | |

### Avaliacao de Valor

- **Impacto no usuario:** Muito alto. PWA + push transformam completamente a experiencia mobile. Instalacao na tela inicial aumenta retencao em 2-3x segundo benchmarks da industria.
- **Diferencial competitivo:** Alto. A maioria dos concorrentes portugueses menores (Custojusto) ainda nao oferece PWA completa.
- **Retorno de investimento:** Excelente. Custo zero de infraestrutura (FCM gratuito, Workbox gratuito) com grande ganho de UX.
- **Risco tecnico:** Baixo a medio. vite-plugin-pwa abstrai a complexidade do service worker. FCM ja esta no ecossistema Firebase do projeto.

### Posicao na Matriz

```
         ALTO VALOR
              |
   Quick Win  |  ★ Mobile/PWA
              |
  BAIXO ------+------ ALTO ESFORCO
              |
  Descartavel |  Projeto Grande
              |
         BAIXO VALOR
```

**Posicao: Quick Win tendendo a Projeto Estrategico** — valor muito alto com esforco moderado. A maior parte do esforco vem da integracao FCM, que ja e parte do ecossistema Firebase existente.

---

## 5. Decisoes de Arquitetura

### Decisao 1: vite-plugin-pwa (Workbox) vs Service Worker Manual

**Contexto:** O projeto precisa de um service worker para cache de assets, suporte offline e instalacao PWA. Existem duas abordagens: usar o plugin vite-plugin-pwa que abstrai o Workbox, ou escrever um service worker manual.

| Opcao | Pros | Contras |
|---|---|---|
| **vite-plugin-pwa** | Integracao nativa com Vite; gera manifest automaticamente; Workbox precaching out-of-the-box; atualizacao automatica do SW; tipagem TypeScript | Mais uma dependencia; menos controle fino sobre estrategias de cache |
| **Service Worker manual** | Controle total; sem dependencias extras; mais leve | Muito mais codigo boilerplate; precisa lidar manualmente com versionamento de cache; propenso a bugs de cache |

**Recomendacao:** **vite-plugin-pwa.** O projeto ja usa Vite 8 como bundler e o plugin se integra perfeitamente. A complexidade de gerenciar um service worker manual nao se justifica para o escopo do ReparAuto. O Workbox oferece estrategias de cache battle-tested (StaleWhileRevalidate para API, CacheFirst para assets) que seriam muito trabalhosas de reimplementar.

### Decisao 2: Firebase Cloud Messaging vs OneSignal vs Web Push API Direto

**Contexto:** O projeto precisa enviar notificacoes push para usuarios web/mobile quando recebem mensagens ou quando novos anuncios sao publicados.

| Opcao | Pros | Contras |
|---|---|---|
| **Firebase Cloud Messaging (FCM)** | Ja faz parte do Firebase SDK usado no projeto; gratuito e ilimitado; integracao trivial com Cloud Functions; suporta topics para segmentacao | Requer Cloud Functions para envio server-side; setup inicial do VAPID key |
| **OneSignal** | Dashboard visual; segmentacao avancada; analytics de delivery; facil setup | Dependencia externa; plano gratuito limitado (10k subscribers); adiciona SDK pesado (~50KB) |
| **Web Push API direto** | Sem dependencias; maximo controle; mais leve | Requer servidor proprio para VAPID; muito codigo boilerplate; sem analytics; sem topics |

**Recomendacao:** **Firebase Cloud Messaging.** O projeto ja usa Firebase Auth, Firestore e Storage. Adicionar FCM e natural e mantem o ecossistema coeso. Custo zero, integracao direta com Cloud Functions para disparar notificacoes quando documentos Firestore mudam (ex: nova mensagem → trigger → push). A unica desvantagem (precisar de Cloud Functions) e na verdade uma vantagem, pois Cloud Functions ja seria necessario para qualquer logica server-side futura.

---

## 6. Prompt de Implementacao

```
You are implementing PWA and mobile optimization features for ReparAuto, a Portuguese
used-car and parts marketplace built with React 19 + TypeScript + Tailwind CSS v4 + Firebase.

PROJECT CONTEXT:
- Vite 8 bundler with config at vite.config.ts (uses @tailwindcss/vite plugin, @/ alias)
- React Router 7 with HashRouter in src/App.tsx
- Firebase SDK (Auth, Firestore, Storage) configured in src/lib/firebase.ts
- Firebase project ID: reparauto-site, messagingSenderId: 707836120678
- Global state via Context API in src/providers/AppProvider.tsx
- All UI text must be in Portuguese (PT-PT). Code, comments, variables in English.
- Import alias: always use @/ (maps to src/). No relative imports.
- Styling: Tailwind utility classes only. Theme colors defined in src/index.css (@theme block).
  Brand colors: brand-50 to brand-900. Accent: #e55b2b. Font: Inter.
- Icons: lucide-react (already installed). Also uses Font Awesome via CDN.
- Types in src/types/. Key types: Carro (src/types/carro.ts), Peca (src/types/peca.ts),
  Usuario (src/types/usuario.ts), Notificacao (src/types/notificacao.ts).
- Existing components: src/components/detalhes/GalleryModal.tsx (photo gallery with
  prev/next buttons, uses Modal from src/components/ui/Modal.tsx),
  src/components/home/CarCard.tsx, src/components/home/CarGrid.tsx.
- Entry point: index.html (lang="pt-PT", loads /src/main.tsx)

TASK 1 — PWA Setup with vite-plugin-pwa:
1. Install vite-plugin-pwa: add to package.json devDependencies
2. Update vite.config.ts: import VitePWA from 'vite-plugin-pwa' and add to plugins array with:
   - registerType: 'autoUpdate'
   - includeAssets: ['favicon.svg']
   - manifest: { name: 'ReparAuto', short_name: 'ReparAuto', description: 'Marketplace de
     carros usados e pecas em Portugal', theme_color: '#243b53', background_color: '#f0f4f8',
     display: 'standalone', start_url: './', scope: './', icons: [...] }
   - workbox: { runtimeCaching with StaleWhileRevalidate for Firestore, CacheFirst for
     images and fonts, NetworkFirst for API calls }
3. Update index.html: add <link rel="manifest" href="./manifest.webmanifest">,
   <meta name="theme-color" content="#243b53">,
   <meta name="apple-mobile-web-app-capable" content="yes">,
   <link rel="apple-touch-icon" href="./icons/icon-192.png">
4. Create placeholder icon files in public/icons/ (192x192 and 512x512 PNGs)

TASK 2 — Install Prompt Component:
1. Create src/hooks/usePWAInstall.ts:
   - Listen for 'beforeinstallprompt' event, store deferredPrompt in ref
   - Track install state: 'idle' | 'prompted' | 'installed' | 'dismissed'
   - Expose: canInstall (boolean), promptInstall() function, dismissInstall()
   - Check localStorage key 'pwa_dismiss_until' to avoid re-prompting for 7 days
2. Create src/components/pwa/InstallPrompt.tsx:
   - Fixed bottom banner (above BottomNav which is h-16 on mobile)
   - Show ReparAuto icon, text "Instalar ReparAuto no seu dispositivo", buttons
   - Use Tailwind: bg-brand-800 text-white rounded-xl shadow-lg, animate-slide-up
   - Only render when usePWAInstall().canInstall is true

TASK 3 — Online Status & Offline Banner:
1. Create src/hooks/useOnlineStatus.ts:
   - Use navigator.onLine + 'online'/'offline' event listeners
   - Return { isOnline: boolean }
2. Create src/components/pwa/OfflineBanner.tsx:
   - Fixed top banner: "Sem conexao — a mostrar dados guardados"
   - bg-amber-500 text-white, icon WifiOff from lucide-react
   - Only shows when !isOnline
3. Add OfflineBanner to src/App.tsx inside the flex container, above Header

TASK 4 — Push Notifications (Firebase Cloud Messaging):
1. Update src/lib/firebase.ts: add getMessaging export (lazy init, only in browser)
2. Create src/lib/fcm.ts with functions:
   - requestNotificationPermission(): asks user, gets FCM token, saves to Firestore
   - saveFcmToken(uid: string, token: string): writes to 'fcm_tokens' collection
   - removeFcmToken(uid: string, token: string): deletes token on logout
   - onForegroundMessage(callback): listens for messages when app is open
3. Create public/firebase-messaging-sw.js: service worker for background FCM messages
   (importScripts firebase-app and firebase-messaging compat SDKs)
4. Update src/providers/AppProvider.tsx: after auth login, call requestNotificationPermission()
   and register foreground message handler that creates in-app toast via ToastProvider
5. Update firestore.rules: add rules for fcm_tokens collection (user can only manage own tokens)
6. Add TipoNotificacao 'push' to src/types/notificacao.ts if needed

TASK 5 — Skeleton Screens:
1. Create src/components/ui/Skeleton.tsx: base component with animate-pulse, configurable
   height/width/rounded via className prop. Renders a div with bg-slate-200.
2. Create src/components/ui/CarCardSkeleton.tsx: matches exact layout of CarCard
   (src/components/home/CarCard.tsx) — image area (h-40), title line, price line, location line
3. Update src/components/home/CarGrid.tsx: when loading is true, render 6 CarCardSkeleton
   components instead of empty state or spinner

TASK 6 — Lazy Loading Images:
1. Create src/components/ui/LazyImage.tsx:
   - Uses IntersectionObserver (or native loading="lazy") to defer image loading
   - Shows a Skeleton placeholder until image loads
   - Props: src, alt, className (pass-through), fallback (optional emoji/icon)
   - Handles image load errors gracefully (show fallback)
2. Update src/components/home/CarCard.tsx: replace <img> with <LazyImage>
3. Update src/pages/DetalhesCarro.tsx: use LazyImage for main photo

TASK 7 — Swipe Gestures for Gallery:
1. Create src/hooks/useSwipe.ts:
   - Track touchstart, touchmove, touchend events
   - Calculate horizontal delta, apply threshold (50px minimum)
   - Return: { handlers: { onTouchStart, onTouchMove, onTouchEnd }, direction }
   - Call onSwipeLeft / onSwipeRight callbacks
   - Prevent vertical scroll interference during horizontal swipe
2. Update src/components/detalhes/GalleryModal.tsx:
   - Import and use useSwipe hook on the photo container div
   - onSwipeLeft → next photo (increment indice)
   - onSwipeRight → previous photo (decrement indice)
   - Add CSS transition for smooth slide effect between photos
   - Keep existing button navigation as fallback for desktop

TASK 8 — Web Share API:
1. Create src/components/ui/ShareButton.tsx:
   - Props: { titulo: string; texto: string; url: string }
   - Primary action: navigator.share({ title, text, url }) if available
   - Fallback: dropdown menu with options:
     a) "Copiar link" → navigator.clipboard.writeText(url)
     b) "WhatsApp" → open https://wa.me/?text={encoded title + url}
     c) "Facebook" → open https://www.facebook.com/sharer/sharer.php?u={url}
   - Use Share2 icon from lucide-react
   - Tailwind styling matching existing button patterns in the project
2. Add ShareButton to src/pages/DetalhesCarro.tsx near the favorites/contact area
   - titulo: `${carro.marca} ${carro.modelo} - ${carro.preco}€`
   - url: window.location.href

IMPORTANT CONSTRAINTS:
- Do NOT install any library not mentioned above. The only new dependency is vite-plugin-pwa.
- All new components must use the @/ import alias, never relative imports.
- All UI text in Portuguese (PT-PT). Variable names and comments in English.
- Follow existing code patterns: functional components, hooks, Tailwind classes.
- The app uses HashRouter — URLs will be like https://reparauto.pt/#/detalhes/abc123.
  Ensure shared URLs work correctly with hash routing.
- Existing GalleryModal is in src/components/detalhes/GalleryModal.tsx and uses a state
  variable `indice` for current photo index with prev/next buttons.
- Test PWA features with Chrome DevTools > Application > Service Workers and Lighthouse.
```
