# CLAUDE.md — ReparAuto

Portuguese used-car and parts marketplace. Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Firebase (Auth, Firestore, Storage). Deployed to Firebase App Hosting.

See `AGENTS.md` for full source map, implementation deviations, and feature workflow.

## Commands

```sh
npm run dev          # Next.js dev server (hot reload)
npm run build        # Production build → .next/
npm run start        # Run production build locally
npx tsc --noEmit     # Type-check (strict mode)
npm run deploy:rules # Deploy Firestore/Storage rules
npm run seed         # Seed demo data into empty collections (Admin SDK)
```

No test runner or formatter is configured.

## Architecture

```
app/                 # Next.js App Router — file-based routing, SSR/ISR per route
├── layout.tsx       # Root layout, base metadata, JSON-LD Organization, Providers
├── providers.tsx    # Client wrapper (AppProvider + ToastProvider)
├── page.tsx         # Home (ISR 60s) → renders <Home />
├── detalhes/[id]/   # Server-side fetch + generateMetadata + Vehicle JSON-LD
├── pecas/           # ISR 60s
├── [tipo]/          # Static: termos|privacidade|cookies|seguranca (generateStaticParams)
├── anunciar/        # Client-rendered
├── perfil/          # Client-rendered (noindex)
├── admin/           # Client-rendered (noindex)
├── setup-perfil/    # Client-rendered (noindex)
├── sitemap.ts       # Dynamic sitemap.xml from approved cars
├── robots.ts        # robots.txt
└── not-found.tsx    # Global 404

src/
├── screens/         # Page-level client components imported by app/*/page.tsx
├── components/      # admin/, anunciar/, auth/, chat/, detalhes/, home/, layout/, pecas/, perfil/, trust/, ui/
├── hooks/           # useAuth, useCarros, usePecas, useFavoritos, useChat, etc.
├── providers/       # AppProvider (client) — uses next/navigation
├── lib/
│   ├── firebase.ts        # Web SDK (client + auth + onSnapshot)
│   ├── firebase.admin.ts  # Admin SDK (server-only) — used by db.server.ts
│   ├── db.server.ts       # Server fetchers for SSR/ISR (Admin SDK or Firestore REST fallback)
│   ├── db.ts              # All client Firestore CRUD
│   ├── auth.ts, utils.ts, constants.ts
├── types/
└── data/            # marcas-modelos.json
```

## Data Layer

Firestore collections: `cars`, `parts`, `users`, `messages`, `notifications`, `services`, `reviews`, `reports`, `verifications`, `intencoes_compra`, `contatos_intencao`, `denuncias_intencao`.
Firebase Storage for images (1MB limit, 7 max for cars/services, 3 max for parts).
localStorage fallback for anonymous favorites only (`favs_reparauto` key).

Public listing queries filter `where('status' == 'aprovado')` server-side and sort by `dataCriacao` in memory (no composite index needed). Realtime car/part subscriptions are route-gated in `AppProvider` (`needsCarros`/`needsPecas`) — add the route there if a new screen reads those lists from context.

Server-side reads (SSR/ISR) go through `src/lib/db.server.ts`:
- First tries Firebase Admin SDK (uses Application Default Credentials — works automatically on App Hosting).
- Falls back to the public Firestore REST API for local dev / unauthenticated environments. Only reads the public `cars`/`parts` collections allowed by `firestore.rules` (`allow read: if true`).
- Per-id fetchers are wrapped in `React.cache` so `generateMetadata` and the page component share one fetch.

Demo seed data lives in `scripts/seed-firestore.mjs` (`npm run seed`), not in client code.

## Conventions

- **Language**: code, comments, variable names, commit messages in English. Chat/UI text in Portuguese.
- **Naming**: `camelCase` for identifiers. TypeScript interfaces in `PascalCase`.
- **Imports**: always use `@/` path alias (maps to `src/`). No relative imports.
- **Styling**: Tailwind utility classes only. Theme defined in `src/index.css` via `@theme`. PostCSS pipeline via `@tailwindcss/postcss`.
- **State**: Context API + custom hooks. No Redux/Zustand. Filtering is client-side.
- **Real-time**: Firestore `onSnapshot()` for live data (client only). Cleanup subscriptions on unmount.
- **Server vs. client**: SEO-critical routes (`/`, `/pecas`, `/detalhes/[id]`, `/[tipo]`) use Server Components with `generateMetadata` + ISR. Auth-gated and interactive routes are client-rendered. Components needing hooks have `'use client'` directive at top.
- **Navigation**: use `next/navigation` (`useRouter`, `usePathname`, `useParams`) and `next/link`. Never import `react-router-dom`.
- **Auth**: Firebase Auth (email/password + Google). Roles: `user`, `admin`. New listings default to `status: 'pendente'` (admin approves).
- **Commits**: conventional style (`feat:`, `fix:`) with descriptive summaries.
- **TypeScript**: strict mode enabled. Types live in `src/types/`.
- **No tests**: no test framework exists — do not attempt to run tests.

## SEO

Per-route metadata is the responsibility of each `app/**/page.tsx`:
- `metadata` or `generateMetadata` exports define `<title>`, description, canonical, OpenGraph, Twitter Card.
- `/detalhes/[id]` emits a Schema.org `Vehicle` JSON-LD block via `<Script type="application/ld+json">` with brand, model, year, mileage, fuel, transmission, color and an `Offer` containing price/currency/availability.
- `app/sitemap.ts` lists all approved cars + static routes; regenerated every hour (`revalidate = 3600`).
- `app/robots.ts` disallows `/admin`, `/perfil`, `/setup-perfil` and points to the sitemap.
- The root `app/layout.tsx` declares site-wide `metadataBase`, default OG image, and the `Organization` JSON-LD.

## PWA & Push Notifications

Push messaging and offline assets are wired for client routes. Firestore uses `persistentLocalCache` for offline data when running in the browser. Workbox/`vite-plugin-pwa` was used in the previous SPA — under Next.js, offline shell is handled by Next's default static caching and the service worker at `public/firebase-messaging-sw.js`.

### Firebase Cloud Messaging (FCM) — VAPID Key Setup

Push notifications require a VAPID key. To obtain it:

1. Go to [Firebase Console](https://console.firebase.google.com/) → project `reparauto-site`
2. Navigate to **Project Settings** (gear icon) → **Cloud Messaging** tab
3. Under **Web Push certificates**, click **Generate key pair** (or copy existing)
4. Copy the **Key pair** value (a long base64 string)
5. Create a `.env.local` file in the project root:
   ```
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here
   ```
6. Restart the dev server (`npm run dev`)

Without the VAPID key, `requestNotificationPermission()` in `src/lib/fcm.ts` returns `null` gracefully — the app works fine, just without push notifications.

### PWA Files

- `src/lib/fcm.ts` — FCM token request + foreground message listener
- `src/lib/lqip.ts` — LQIP blur-up placeholder generation + cache
- `src/lib/offlineQueue.ts` — localStorage action queue for offline writes
- `src/hooks/useInstallPrompt.ts` — PWA install prompt (engagement-based)
- `src/hooks/useOnlineStatus.ts` — online/offline detection
- `src/hooks/useNetworkStatus.ts` — Network Information API (speed detection)
- `src/hooks/useSwipe.ts` — touch swipe with drag feedback
- `src/hooks/usePinchZoom.ts` — two-finger zoom for gallery
- `public/firebase-messaging-sw.js` — FCM background message service worker

## Key Files

- `src/lib/firebase.ts` — Firebase Web SDK config (API keys are intentionally public per Firebase Web SDK convention)
- `src/lib/firebase.admin.ts` — Firebase Admin SDK init (server-only, uses ADC in App Hosting)
- `src/lib/db.server.ts` — server fetchers (Admin SDK with REST fallback) for SSR/ISR
- `src/lib/db.ts` — all client-side Firestore CRUD and realtime subscriptions
- `src/lib/constants.ts` — concelhos, fuel types, categories, policy texts
- `src/providers/AppProvider.tsx` — global state composition (client)
- `next.config.ts` — security headers (CSP, HSTS, …), image domains
- `apphosting.yaml` — Firebase App Hosting runtime config (region, memory, env vars)
- `firestore.rules` / `storage.rules` — security rules (RBAC)
