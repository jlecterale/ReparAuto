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

Firestore collections: `cars`, `parts`, `users`, `messages`, `notifications`, `services`, `reviews`, `reports`, `verifications`.
Firebase Storage for images (1MB limit, 7 max for cars/services, 3 max for parts).
localStorage fallback for anonymous favorites only (`favs_reparauto` key).

Server-side reads (SSR/ISR) go through `src/lib/db.server.ts`:
- First tries Firebase Admin SDK (uses Application Default Credentials — works automatically on App Hosting).
- Falls back to the public Firestore REST API for local dev / unauthenticated environments. Only reads the public `cars`/`parts` collections allowed by `firestore.rules` (`allow read: if true`).

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

## Key Files

- `src/lib/firebase.ts` — Firebase Web SDK config (API keys are intentionally public per Firebase Web SDK convention)
- `src/lib/firebase.admin.ts` — Firebase Admin SDK init (server-only, uses ADC in App Hosting)
- `src/lib/db.server.ts` — server fetchers (Admin SDK with REST fallback) for SSR/ISR
- `src/lib/db.ts` — all client-side Firestore CRUD and seed data
- `src/lib/constants.ts` — concelhos, fuel types, categories, policy texts
- `src/providers/AppProvider.tsx` — global state composition (client)
- `next.config.ts` — security headers (CSP, HSTS, …), image domains
- `apphosting.yaml` — Firebase App Hosting runtime config (region, memory, env vars)
- `firestore.rules` / `storage.rules` — security rules (RBAC)
