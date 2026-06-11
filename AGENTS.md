# ReparAuto

Portuguese marketplace for used cars, parts, workshops and purchase intents. Next.js 15 (App Router) + React 19 + TypeScript (strict) + Tailwind CSS v4 + Firebase (Auth, Firestore, Storage). Deployed to Firebase App Hosting.

`CLAUDE.md` holds the day-to-day conventions and architecture summary; this file adds the source map, implementation notes and the feature workflow.

## Structure

- `app/` — Next.js App Router routes (SSR/ISR per route), sitemap, robots.
- `src/` — all application source code (screens, components, hooks, lib, types).
- `public/` — static assets + `firebase-messaging-sw.js` (FCM service worker).
- `scripts/` — Node maintenance scripts (Admin SDK): `seed-firestore.mjs`, `importar-pecas.mjs`.
- `docs/`, `plans/` — prose docs and feature plans, not executable.
- `firestore.rules` / `storage.rules` — security rules (RBAC); deploy with `npm run deploy:rules`.

## Tech

- **Next.js 15+** — App Router; ISR on SEO routes, client rendering on auth-gated routes.
- **React 19** — hooks + Context API only (no Redux/Zustand).
- **Tailwind CSS 4** — tokens in `src/index.css` via `@theme`; design system in `.claude/skills/frontend-design`.
- **Firebase Web SDK** — Auth (email/password + Google), Firestore (`persistentLocalCache`), Storage.
- **firebase-admin** — server-only, used by `src/lib/db.server.ts` and `scripts/`.
- **@phosphor-icons/react** — icons (files importing them need `'use client'`).
- **leaflet / react-leaflet** — maps; always loaded via `dynamic(..., { ssr: false })`.
- **No test/lint/format tooling** — verification is `npx tsc --noEmit` + `npm run build`.

## Data Layer

- **Firestore collections**: `cars`, `parts`, `services` (workshops), `users`, `messages`, `notifications`, `reviews`, `reports`, `verifications`, `intencoes_compra`, `contatos_intencao`, `denuncias_intencao`.
- **Public listing queries** (`getCarros`/`subscribeCarros`, `getPecas`/`subscribePecas`, `getOficinas`/`subscribeOficinas`) filter `where('status' == 'aprovado')` server-side and sort by `dataCriacao` in memory — keep it that way to avoid composite indexes and to keep pending/rejected docs off the wire.
- **Realtime subscriptions are route-gated**: `AppProvider` only activates `useCarros`/`usePecas` streaming on routes that render those lists (see `needsCarros`/`needsPecas`). If a new screen reads `carros`/`pecas` data from context, add its route there.
- **Server-side reads** (SSR/ISR) go through `src/lib/db.server.ts`: Admin SDK first (ADC on App Hosting), public Firestore REST API as local-dev fallback. Per-id fetchers are wrapped in `React.cache` so `generateMetadata` + page share one fetch.
- **Demo seed data** lives in `scripts/seed-firestore.mjs` (`npm run seed`), never in client code.
- **localStorage**: anonymous favourites (`favs_reparauto`), offline action queue (`offline_queue`), LQIP cache (`lqip_cache`).

## Source Map (high level)

```
app/                       # routes; thin page.tsx files that render src/screens/*
src/
├── screens/               # page-level client components (Home, DetalhesCarro, Admin, …)
├── components/            # admin/ anunciar/ auth/ chat/ detalhes/ home/ intencao/
│                          # layout/ pecas/ perfil/ trust/ ui/
├── hooks/                 # useAuth, useCarros, usePecas, useFavoritos, useChat,
│                          # useIntencoes, useNotificacoes (onSnapshot), …
├── providers/AppProvider  # global context (memoized value; route-gated subscriptions)
├── lib/
│   ├── firebase.ts        # Web SDK init (public config by design)
│   ├── firebase.admin.ts  # Admin SDK init (server-only)
│   ├── db.ts              # client Firestore CRUD + realtime subscriptions
│   ├── db.server.ts       # SSR/ISR fetchers (Admin SDK → REST fallback)
│   ├── utils.ts           # formatters, renderDescricao (escapes HTML — keep it that way)
│   └── constants.ts, geo.ts, profanity.ts, lqip.ts, offlineQueue.ts, fcm.ts
├── types/                 # shared TypeScript interfaces
└── data/                  # marcas-modelos.json
```

## Implementation Notes (read before touching)

- **`renderDescricao`** escapes user HTML before converting the mini-markdown (bold, lists). Its output feeds `dangerouslySetInnerHTML` — never weaken the escaping.
- **Firestore rules vs. client writes**: rules are not filters. Any new query must be provable against `firestore.rules` (e.g. messages queries filter on `toUid`/`participants`); counter bumps on other users' docs need an explicit `affectedKeys` exception (see `cars`, `parts`, `intencoes_compra.stats`).
- **Notifications**: users may create `tipo in ['mensagem','info']` notifications for others (chat + pending-listing alerts to admins); everything else is admin/self only.
- **Images**: `LazyImage` renders through `next/image` for whitelisted hosts (`firebasestorage.googleapis.com`, `googleusercontent.com`) and local paths, with a plain `<img>` fallback for `data:`/`blob:`/unknown hosts. New remote hosts must be added both in `next.config.ts` and in `OPTIMIZABLE_HOSTS`.
- **FotosEditor blob URLs** intentionally outlive the component: later wizard steps preview/upload them via `filesRef`. Do not revoke them on unmount.
- **Cards in grids** (`CarCard`, `PecasCard`) are `React.memo`-wrapped; keep callback props stable (pass setters or `useCallback`).
- **Hook returns and the context value are memoized** — when adding fields to a hook's return, add them to the `useMemo` deps too.

## Commands

```sh
npm run dev          # Next.js dev server
npm run build        # production build
npx tsc --noEmit     # type-check (strict)
npm run deploy:rules # deploy Firestore rules
npm run seed         # seed demo data into empty collections (Admin SDK / ADC)
npm run seed:dry     # report what would be seeded
```

## Feature Workflow

When asked to implement a new feature:

1. **Competitor research** — Before coding, research how competitors (OLX, Standvirtual, CustoJusto, eBay Motors) implement the same feature. Analyze UX, flows, and patterns used.
2. **Best practices** — Define the best technical and UX approach before coding.
3. **Scalability analysis** — Document strengths and weaknesses of the chosen implementation (performance, maintainability, Firestore limits, etc.).
4. **Plans** — Generate `.md` files in `plans/` with full analysis. Optionally generate an interactive HTML (in the same folder) that visually summarizes the proposal.
5. **UI/UX excellence** — New interfaces must follow modern UI/UX standards: visual feedback, micro-interactions, accessibility (WCAG), responsiveness, consistency with the existing design system.
6. **Final review** — Before marking a task as done, verify:
   - Code follows best practices (DRY, componentization, separation of concerns)
   - No duplicated code or redundant logic
   - Possible bugs, race conditions, state errors
   - Error handling and edge cases
   - Performance (unnecessary re-renders, bundle size)
   - Consistency with the rest of the codebase
   - Implicit typing (validated props, fallbacks)

## Conventions

- `camelCase` for identifiers; `PascalCase` for TypeScript interfaces.
- Chat responses in Portuguese only.
- Code (comments, variable names, commit messages) in English; UI text in Portuguese.
- Imports always via the `@/` alias (maps to `src/`).
- Navigation via `next/navigation` and `next/link` — never `react-router-dom`.
- Firebase API keys are public (expected for Firebase Web SDKs).
