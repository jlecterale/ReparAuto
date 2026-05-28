# CLAUDE.md — ReparAuto

Portuguese used-car and parts marketplace. SPA built with React 19 + TypeScript + Tailwind CSS v4 + Firebase (Auth, Firestore, Storage). Deployed to Firebase Hosting.

See `AGENTS.md` for full source map, implementation deviations, and feature workflow.

## Commands

```sh
npm run dev          # Vite dev server (hot reload)
npm run build        # Production build → dist/
npm run preview      # Preview production build
npx tsc --noEmit     # Type-check (strict mode)
npm run deploy:rules # Deploy Firestore/Storage rules
```

No test runner, linter, or formatter is configured.

## Architecture

```
src/
├── pages/           # Route-level components (Home, DetalhesCarro, Anunciar, Pecas, Perfil, Admin)
├── components/      # Feature-grouped: admin/, anunciar/, auth/, chat/, detalhes/, home/, layout/, pecas/, perfil/, ui/
├── hooks/           # useAuth, useCarros, usePecas, useFavoritos, useChat, useNotificacoes
├── providers/       # AppProvider — single context wrapping auth, carros, pecas, favoritos, chat
├── lib/             # firebase.ts, db.ts (Firestore CRUD), auth.ts, utils.ts, constants.ts
├── types/           # Shared TypeScript interfaces (carro.ts, peca.ts, usuario.ts, etc.)
├── data/            # marcas-modelos.json (car make/model database)
└── App.tsx          # HashRouter routes + AppProvider + Layout
```

## Data Layer

Firestore collections: `cars`, `parts`, `users`, `messages`, `notifications`, `services`.
Firebase Storage for images (1MB limit, 7 max for cars/services, 3 max for parts).
localStorage fallback for anonymous favorites only (`favs_reparauto` key).

## Conventions

- **Language**: code, comments, variable names, commit messages in English. Chat/UI text in Portuguese.
- **Naming**: `camelCase` for identifiers. TypeScript interfaces in `PascalCase`.
- **Imports**: always use `@/` path alias (maps to `src/`). No relative imports.
- **Styling**: Tailwind utility classes only. Theme defined in `src/index.css` via `@theme`.
- **State**: Context API + custom hooks. No Redux/Zustand. Filtering is client-side.
- **Real-time**: Firestore `onSnapshot()` for live data. Cleanup subscriptions on unmount.
- **Auth**: Firebase Auth (email/password + Google). Roles: `user`, `admin`. New listings default to `status: 'pendente'` (admin approves).
- **Commits**: conventional style (`feat:`, `fix:`) with descriptive summaries.
- **TypeScript**: strict mode enabled. Types live in `src/types/`.
- **No tests**: no test framework exists — do not attempt to run tests.

## PWA & Push Notifications

The app is a PWA with offline support via `vite-plugin-pwa` + Workbox. Firestore uses `persistentLocalCache` for offline data.

### Firebase Cloud Messaging (FCM) — VAPID Key Setup

Push notifications require a VAPID key. To obtain it:

1. Go to [Firebase Console](https://console.firebase.google.com/) → project `reparauto-site`
2. Navigate to **Project Settings** (gear icon) → **Cloud Messaging** tab
3. Under **Web Push certificates**, click **Generate key pair** (or copy existing)
4. Copy the **Key pair** value (a long base64 string)
5. Create a `.env` file in the project root:
   ```
   VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
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

- `src/lib/firebase.ts` — Firebase config (API keys are intentionally public per Firebase Web SDK convention)
- `src/lib/db.ts` — all Firestore CRUD operations and seed data
- `src/lib/constants.ts` — concelhos, fuel types, categories, policy texts
- `src/providers/AppProvider.tsx` — global state composition
- `firestore.rules` / `storage.rules` — security rules (RBAC)
