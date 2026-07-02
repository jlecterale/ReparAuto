# CLAUDE.md — ReparAuto

Portuguese used-car and parts marketplace. Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Firebase (Auth, Firestore, Storage). Deployed to Firebase App Hosting.

See `AGENTS.md` for full source map, implementation deviations, and feature workflow.

> 🏷️ **Brand name: the product is called RecarGarage (one word).** This is the *only* name that may appear in anything a user sees — UI text, copy, metadata, emails, chat replies, OpenGraph/JSON-LD, etc. The repository, this doc's title, the Firebase project (`reparauto-site`), and identifiers like the `favs_reparauto` storage key are named "ReparAuto" for historical reasons — that is an **internal** name only. **Never surface "ReparAuto" to users, and never invent variants like "Recar Garage" or "Repar Auto".** When in doubt, write `RecarGarage`. Public domain: `recargarage.com`.

> 🚫 **The `mobile/` folder is off-limits by default.** It holds the separate React Native / Expo app (see plan 19). Do **not** read, search, analyze, or modify anything under `mobile/` unless the user's request is *explicitly* about the mobile app. For all web/marketplace work, ignore `mobile/` entirely — don't grep it, don't touch it. (Likewise treat `functions/` as a separate Cloud Functions surface — only enter it for explicit Functions work.)

> ⚠️ **Never run `firebase deploy` (in any form) on your own.** Deploying — App Hosting, Firestore/Storage rules, Cloud Functions, indexes, anything — is **always** an explicit, user-initiated action. Do not run `npm run deploy:rules`, `npm run deploy:hosting`, `firebase deploy ...`, or `gcloud`/`firebase` deploy commands unless the user asks for that specific deploy in the current turn. Approval to deploy in one turn does **not** carry over to a later turn. When a change needs deploying, build/type-check it and then **tell the user which command to run** — let them run it.

## Commands

```sh
npm run dev          # Next.js dev server (hot reload)
npm run build        # Production build → .next/
npm run start        # Run production build locally
npx tsc --noEmit     # Type-check (strict mode)
npm test             # Run the Jest test suite
npm run test:watch   # Jest in watch mode (TDD inner loop)
npm run test:coverage# Jest with coverage report
npm run deploy:rules # Deploy Firestore rules — USER-INITIATED ONLY (see warning above)
npm run seed         # Seed demo data into empty collections (Admin SDK)
```

Verification is `npm test` + `npx tsc --noEmit` + `npm run build`. (Test suite rollout is `docs/plans/20-testes-tdd.md`; until its setup commit lands, the `test*` scripts may not exist yet.)

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
Firebase Storage for images (10MB limit, 20 max for cars, 1 for parts). Listing photos can also be external https URLs pasted by the user (stored as-is, no upload).
localStorage fallback for anonymous favorites only (`favs_reparauto` key).

Public listing queries filter `where('status' == 'aprovado')` server-side and sort by `dataCriacao` in memory (no composite index needed). Realtime car/part subscriptions are route-gated in `AppProvider` (`needsCarros`/`needsPecas`) — add the route there if a new screen reads those lists from context.

Server-side reads (SSR/ISR) go through `src/lib/db.server.ts`:
- First tries Firebase Admin SDK (uses Application Default Credentials — works automatically on App Hosting).
- Falls back to the public Firestore REST API for local dev / unauthenticated environments. Only reads the public `cars`/`parts` collections allowed by `firestore.rules` (`allow read: if true`).
- Per-id fetchers are wrapped in `React.cache` so `generateMetadata` and the page component share one fetch.

Demo seed data lives in `scripts/seed-firestore.mjs` (`npm run seed`), not in client code.

## Conventions

- **Language (strict)**: **all code is written in English** — function names, variables, parameters, types/interfaces, enum members, file names, comments and commit messages. **Only strings shown to the user** (UI labels, toasts, chat, copy, metadata) are in Portuguese. Never name a new identifier in Portuguese. Some legacy identifiers are Portuguese (`carro`, `pecas`, `oficinas`, `favoritos`, `criarNotificacao`, `descricao`, …) and Firestore field names mirror them — leave those as-is (renaming them is a data-schema change), but do **not** add more: every new symbol you introduce must be English (e.g. `createNotification`, not `criarNotificacao`).
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
- **Tests**: Jest + React Testing Library. `*.test.ts(x)` live next to the code they test. Write tests **test-first (TDD)** — see the TDD section below.

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
- `src/hooks/useImageZoom.ts` — fullscreen gallery lightbox controller (pinch/wheel/double-tap zoom, pan, swipe-to-navigate, drag-down-to-close)
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

## Workflow Protocols

### Test-Driven Development (TDD) — default for all changes

**Before implementing any feature, fix, refactor, or plan that touches testable logic, write the test first.** Use the `tdd` and `javascript-typescript-jest` skills. Follow red → green → refactor in **vertical slices** (one test → minimal code to pass → repeat). Never write all tests up front ("horizontal slicing") and never write production code for testable logic without a failing test first.

1. **RED** — write a failing test that describes the desired behavior through the public interface (not implementation details).
2. **GREEN** — write the minimum code to make it pass.
3. **REFACTOR** — clean up with the test green; never refactor while red.

Test files are `*.test.ts(x)` next to the code they test. Mock Firebase/Storage at the boundary (`jest.mock`), use the factories/helpers in `src/test/`, and assert observable behavior. Prioritize critical paths and complex logic (`src/lib/utils.ts`, `compatibility.ts`, `db.ts` business logic, `offlineQueue.ts`, key hooks) — see `docs/plans/20-testes-tdd.md` for the full testable-surface map.

**TDD exceptions** (verify with `tsc --noEmit` + `build` + manual review instead): purely visual/Tailwind changes, static content, async Server Components / `db.server.ts` (Jest can't run them), and thin SDK wrappers (`auth.ts`, `upload.ts`, `fcm.ts`).

### Investigation & planning (research first)

When asked to investigate a feature, scope a change, or generate a plan, **do online research before writing any plan or code**:

1. **Competitor analysis** — search how relevant marketplaces handle the feature, across both target markets. **Portugal:** OLX Portugal, Standvirtual, CustoJusto, AutoScout24. **Brazil (now a launch market):** Webmotors, OLX Brasil, Mercado Livre / Mercado Livre Veículos, iCarros, Mobiauto, and (for parts) Connectparts/Jocar. Note what works and what users complain about in each market.
2. **UX best practices** — search for design patterns, web/mobile UX guidelines, and accessibility (WCAG) considerations for the feature domain.
3. **Feasibility** — check Next.js / React 19 / Firebase support, relevant libraries, Firestore limits (composite indexes, query constraints, security-rule provability), and performance/bundle implications.
4. **User sentiment** — look for Reddit threads, app-store/Trustpilot reviews, and community discussions about what users want and hate in this area.

Consolidate findings into the plan — don't jump straight to code on non-trivial work.

### Plans

Plans live in `docs/plans/` — numbered Markdown files (`NN-<slug>.md`) for full written analysis, optionally paired with a self-contained interactive HTML page (`NN-<slug>.html`) that visually summarizes the proposal. Each plan should cover: context/what it solves, competitive benchmark, user stories, scope (types/db/UI/rules changes), the commit sequence, edge cases, and verification steps.

- **Number new plans sequentially** (continue from the highest existing `NN`).
- **Register the plan** in the `plans` array in `docs/plans/index.html` (`id`, `title`, `priority`, `implemented`, `effort`, …) so the roadmap dashboard picks it up.
- `docs/plans/index.html` is the **canonical roadmap** (shipped vs. queued) — keep it the source of truth, trust it over prose scattered elsewhere.

### Closing out a plan (after it ships)

A plan isn't done until the roadmap says so. **When the work implementing a plan lands, mark it shipped in the same pass:** flip its `implemented` flag (and any status badge) in the `docs/plans/index.html` `plans` registry, and note anything deliberately deferred. Commit the roadmap update alongside (or right after) the feature, e.g. `docs: mark plan NN (<feature>) as shipped`.

### Pre-PR / pre-completion review checklist

Before opening a PR or reporting a task as done, **always do a self-review pass** — go through every item:

1. **Code quality** — re-read the diff as a reviewer. Prefer the simplest version that reads well; question every abstraction, dead branch, and clever bit. Match the surrounding code's idioms.
2. **Code reuse** — grep for existing utilities/components/patterns before adding new ones. Check `src/components/ui/`, `src/hooks/`, `src/lib/` first.
3. **No duplication** — extract shared logic only when it genuinely reduces repetition (3+ call sites or complex logic).
4. **Bug scan** — off-by-one errors, missing null checks at system boundaries, race conditions in async/`onSnapshot` flows, stale state.
5. **UI/UX** — loading/empty/error states, visual feedback/micro-interactions, responsiveness, accessibility (WCAG), and consistency with the existing design system. Use the `frontend-design` skill for any UI change.
6. **Design-system compliance** — semantic Tailwind tokens (no raw hex/`slate-*`), shared `src/components/ui/` primitives over hand-rolled markup (enforced by `frontend-design`).
7. **Firestore-rules provability** — any new query must be provable against `firestore.rules` (rules are not filters); cross-doc counter bumps need an explicit `affectedKeys` exception.
8. **Tests** — tests were written test-first (TDD) for any new/changed logic; `npm test` is green. New behavior has a test that would fail without the change.
9. **Type safety** — run `npx tsc --noEmit` and `npm run build`. Fix every error before reporting done.

Only after this pass is clean should you open the PR or report the task complete.

### Git workflow

- Branches start with `feat/`, `fix/`, `tech/`, or `chore/` (e.g. `feat/<short-slug>`).
- **Never commit or push directly to `main`.** All changes land via a Pull Request: create a branch, commit there, and open a PR for the user to review and merge. Never `git push` to `main` — even when the user asks to "commit", branch first and open a PR.
- Conventional commits (`feat:`, `fix:`, `docs:`, …), imperative present, English, short subject + a body explaining the *why*.
- **Never add Claude/Anthropic as a co-author** — no `Co-Authored-By: Claude` trailer, no "Generated with Claude Code" line. Commits are authored by the user only.
- **Commit/push only when the user asks.** As with deploys, never push or open PRs unprompted.
