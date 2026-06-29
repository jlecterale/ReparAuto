# ReparAuto

Portuguese marketplace for used cars, parts, workshops and purchase intents. Next.js 15 (App Router) + React 19 + TypeScript (strict) + Tailwind CSS v4 + Firebase (Auth, Firestore, Storage). Deployed to Firebase App Hosting.

`CLAUDE.md` holds the day-to-day conventions and architecture summary; this file adds the source map, implementation notes and the feature workflow.

> 🏷️ **Brand name: the product is called RecarGarage (one word).** It is the only name allowed in anything users see — UI copy, metadata, emails, chat, OpenGraph/JSON-LD. "ReparAuto" (this file's title, the repo, the `reparauto-site` Firebase project, the `favs_reparauto` key) is an **internal** historical name only — never show it to users, and never write variants like "Recar Garage" or "Repar Auto". Default to `RecarGarage`. Public domain: `recargarage.com`.

> 🚫 **The `mobile/` folder is off-limits by default.** It holds the separate React Native / Expo app (see `docs/plans/19-app-react-native.html`). Do **not** read, search, analyze, or modify anything under `mobile/` unless the user's request is *explicitly* about the mobile app. For all web/marketplace work, ignore `mobile/` entirely — don't grep it, don't touch it. (Likewise treat `functions/` as a separate Cloud Functions surface — only enter it for explicit Functions work.)

> ⚠️ **Never run `firebase deploy` (in any form) on your own.** Deploying — App Hosting, Firestore/Storage rules, Cloud Functions, indexes, anything — is **always** an explicit, user-initiated action. Do not run `npm run deploy:rules`, `npm run deploy:hosting`, `firebase deploy ...`, or any `firebase`/`gcloud` deploy command unless the user asks for that specific deploy in the current turn. Approval to deploy in one turn does **not** carry over to a later turn. When a change is ready to ship, build/type-check it and then **tell the user which command to run** — let them run it.

> 🌿 **Never commit or push directly to `main`.** All changes land via a Pull Request. Create a `feat/`/`fix/`/`tech/`/`chore/` branch, commit there, and open a PR for the user to review and merge — even when the user just says "commit". Never `git push` to `main`. See **Git workflow** in `CLAUDE.md`.

## Structure

- `app/` — Next.js App Router routes (SSR/ISR per route), sitemap, robots.
- `src/` — all application source code (screens, components, hooks, lib, types).
- `public/` — static assets + `firebase-messaging-sw.js` (FCM service worker).
- `scripts/` — Node maintenance scripts (Admin SDK): `seed-firestore.mjs`, `importar-pecas.mjs`.
- `docs/` — prose docs and analysis; `docs/plans/` holds numbered feature plans (`NN-<slug>.md`/`.html`) + the canonical `index.html` roadmap. Not executable.
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
npm run deploy:rules # deploy Firestore rules — USER-INITIATED ONLY (see warning at top)
npm run seed         # seed demo data into empty collections (Admin SDK / ADC)
npm run seed:dry     # report what would be seeded
```

## Feature Workflow

### 1. Investigation & planning (research first)

When asked to investigate a feature, scope a change, or generate a plan, **do online research before writing any plan or code**:

1. **Competitor analysis** — research how relevant marketplaces implement the feature, across both target markets. **Portugal:** OLX Portugal, Standvirtual, CustoJusto, AutoScout24. **Brazil (now a launch market):** Webmotors, OLX Brasil, Mercado Livre / Mercado Livre Veículos, iCarros, Mobiauto, and (for parts) Connectparts/Jocar. Note what works and what users complain about in each market.
2. **UX best practices** — search design patterns, web/mobile UX guidelines, and accessibility (WCAG) considerations for the feature domain.
3. **Feasibility & scalability** — check Next.js / React 19 / Firebase support, relevant libraries, and Firestore limits (composite indexes, query constraints, security-rule provability). Document strengths and weaknesses of the chosen approach (performance, maintainability, bundle size).
4. **User sentiment** — look for Reddit threads, app-store/Trustpilot reviews, and community discussions about what users want and hate here.

### 2. Plans

Plans live in `docs/plans/` — numbered Markdown files (`NN-<slug>.md`) for full written analysis, optionally paired with a self-contained interactive HTML page (`NN-<slug>.html`) that visually summarizes the proposal. Each plan should cover: context/what it solves, competitive benchmark, user stories, scope (types/db/UI/rules changes), commit sequence, edge cases, and verification steps.

- **Number new plans sequentially** (continue from the highest existing `NN`).
- **Register the plan** in the `plans` array in `docs/plans/index.html` (`id`, `title`, `priority`, `implemented`, `effort`, …) so the roadmap dashboard picks it up.
- `docs/plans/index.html` is the **canonical roadmap** (shipped vs. queued) — keep it the source of truth.

### 3. UI/UX excellence

New interfaces must follow modern UI/UX standards: visual feedback, micro-interactions, accessibility (WCAG), responsiveness, and consistency with the existing design system. Use the `frontend-design` skill (semantic Tailwind tokens, shared `src/components/ui/` primitives) for any UI work.

### 4. Closing out a plan (after it ships)

A plan isn't done until the roadmap says so. **When the implementing work lands, mark the plan shipped in the same pass:** flip its `implemented` flag (and any status badge) in the `docs/plans/index.html` `plans` registry, noting anything deliberately deferred. Commit it alongside (or right after) the feature, e.g. `docs: mark plan NN (<feature>) as shipped`.

### 5. Pre-PR / pre-completion review checklist

Before opening a PR or marking a task done, **always do a self-review pass** — go through every item:

- **Code quality** — re-read the diff as a reviewer; prefer the simplest version that reads well (DRY, componentization, separation of concerns). Match surrounding idioms.
- **Code reuse** — grep for existing utilities/components/patterns before adding new ones (`src/components/ui/`, `src/hooks/`, `src/lib/`).
- **No duplication or redundant logic.**
- **Bug scan** — off-by-one errors, missing null checks at system boundaries, race conditions in async/`onSnapshot` flows, stale/inconsistent state.
- **Error handling & edge cases** covered; props validated with sensible fallbacks.
- **Performance** — unnecessary re-renders, memoization (cards/context values), bundle size.
- **Firestore-rules provability** — any new query is provable against `firestore.rules` (rules are not filters); cross-doc counter bumps need an explicit `affectedKeys` exception.
- **Type safety** — run `npx tsc --noEmit` and `npm run build`; fix every error before reporting done.

Only after this pass is clean should you open the PR (when the user asks) or report the task complete.

## Conventions

- `camelCase` for identifiers; `PascalCase` for TypeScript interfaces.
- Chat responses in Portuguese only.
- **All code in English** (strict): identifiers — functions, variables, params, types, enum members, file names — plus comments and commit messages. **Only user-facing strings** are Portuguese. Never introduce a new Portuguese identifier; prefer `createNotification` over `criarNotificacao`. Legacy Portuguese names (`carro`, `pecas`, `oficinas`, `descricao`, … and the Firestore fields that mirror them) stay as-is — renaming them is a data-schema change — but no new ones.
- Imports always via the `@/` alias (maps to `src/`).
- Navigation via `next/navigation` and `next/link` — never `react-router-dom`.
- Firebase API keys are public (expected for Firebase Web SDKs).
