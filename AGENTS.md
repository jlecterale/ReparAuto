# ReparAuto

Static SPA marketplace for used cars / parts in Portugal. Refactored from monolithic HTML to Vite + React + Tailwind v4.

## Structure

- `src/` — all application source code.
- `public/` — static assets (images, legacy Next.js files that can be cleaned).
- `public/index.html` — **legacy** original monolithic app (~3100 lines). Kept for reference.
- `projeto pagina de carro low cost.html` — older prototype with fake auth. Do not edit unless told.
- `docs/` — roadmap, design system, security, legal docs. Prose only, not executable.
- `images/` — sample car listing images.
- `plans/` — migration/refactor plans.
- `.next/`, `out/` — **legacy** Next.js build artifacts (can be deleted).

## Tech

- **Vite 8.x** — bundler / dev server.
- **React 19.2.x** — UI library.
- **React Router 7.x** (HashRouter) — SPA routing.
- **Tailwind CSS 4.x** — styling via `@tailwindcss/vite` plugin (no PostCSS config).
- **Firebase 11.7.x** — Auth + Firestore (not localStorage). Config hardcoded in `src/lib/firebase.js`.
- **lucide-react 0.510.x** — icons.
- **No build system beyond Vite, no test/lint/format tools.**

## Data Layer

- **Firestore** — primary data store. Collections: `cars`, `parts`, `users` (favorites). Used by all hooks.
- **localStorage fallback** — favorites only, when user is not logged in (`favs_reparauto` key).
- **Seed data** — 7 carros + 3 peças (migrated from original HTML), auto-populated on first Firestore init.
- **DB version** tracked as `reparauto_db_version` in localStorage (`'2.2'`), but data lives in Firestore, not localStorage.

## Source Map

```
src/
├── main.jsx                  # Entry: ReactDOM.createRoot
├── App.jsx                   # HashRouter + AppProvider + Layout
├── index.css                 # Tailwind v4 @import + custom @theme + global styles
├── pages/
│   ├── Home.jsx              # HeroBanner + CarGrid
│   ├── DetalhesCarro.jsx     # /detalhes/:id — full detail page
│   ├── Anunciar.jsx          # Multi-step form (Fotos → Dados → Preço)
│   ├── Pecas.jsx             # Peças grid + modals
│   ├── Perfil.jsx            # Auth-gated profile
│   └── PoliticaPage.jsx      # /:tipo — Termos/Privacidade/Cookies/Segurança
├── components/
│   ├── layout/
│   │   ├── Header.jsx        # Logo, nav desktop, busca, favoritos, perfil, filter chips
│   │   ├── Footer.jsx        # Copyright + policy links (modal)
│   │   └── BottomNav.jsx     # Mobile bottom nav
│   ├── home/
│   │   ├── HeroBanner.jsx    # Main hero banner
│   │   ├── CarGrid.jsx       # Car grid container with filters
│   │   ├── CarCard.jsx       # Individual car card
│   │   └── FilterChips.jsx   # Quick filter chips
│   ├── detalhes/
│   │   ├── TechnicalSheet.jsx  # Technical specs table
│   │   ├── StatusPanel.jsx     # Pronto/Manutenção status + orçamento
│   │   └── GalleryModal.jsx    # Photo gallery modal
│   ├── anunciar/
│   │   ├── StepIndicator.jsx   # Step 1/2/3 indicator
│   │   ├── StepFotos.jsx       # Step 1: Photos
│   │   ├── StepDados.jsx       # Step 2: Technical data
│   │   └── StepPreco.jsx       # Step 3: Price + condition
│   ├── pecas/
│   │   ├── PecasGrid.jsx       # Parts grid
│   │   ├── PecasCard.jsx       # Individual part card
│   │   ├── PecasFilter.jsx     # Parts filter chips
│   │   ├── CriarPecaModal.jsx  # Create part listing modal
│   │   └── DetalhesPecaModal.jsx # Part detail modal
│   ├── perfil/
│   │   ├── ProfileLoggedOut.jsx # Login/register prompt
│   │   └── ProfileLoggedIn.jsx  # User info + my listings
│   ├── auth/
│   │   └── LoginModal.jsx       # Login/register/Google auth modal
│   ├── ui/
│   │   ├── Toast.jsx            # Toast notifications (success/warning/error)
│   │   ├── Modal.jsx            # Generic modal with focus trap
│   │   ├── Button.jsx           # Reusable button (primary/secondary/danger/ghost)
│   │   └── Badge.jsx            # Status badge (Pronto/Reparos/Negociável/Low-Cost)
│   └── CarAutocomplete.js       # Legacy component (from Next.js scaffold)
├── lib/
│   ├── firebase.js            # Firebase init (app, auth, db, storage)
│   ├── db.js                  # Firestore CRUD + seed data (7 cars + 3 parts)
│   ├── auth.js                # Firebase Auth (email/password + Google)
│   ├── utils.js               # formatarPreco, renderDescricao, gerarId, validators
│   └── constants.js           # Theme, limits, lists, policy texts
├── hooks/
│   ├── useAuth.js             # Auth state + login/logout/register
│   ├── useCarros.js           # Cars with filters (price, search, location, sort)
│   ├── usePecas.js            # Parts with type filter
│   └── useFavoritos.js        # Favorites (Firestore for auth'd, localStorage fallback)
└── providers/
    └── AppProvider.jsx        # Global context: auth, carros, pecas, favoritos
```

## Commands

```sh
npm run dev      # Vite dev server
npm run build    # Vite build → dist/
npm run preview  # Preview production build
firebase deploy --only hosting --project reparauto-site
```

## Key Implementation Deviations from Plan

- **Firestore instead of localStorage**: The plan (`plans/plano-refactor-reparauto.md`) specified localStorage CRUD. The implementation uses Firestore collections (`cars`, `parts`, `users.favoritos`). The constants file still defines localStorage keys, but they are unused except as fallback for favorites.
- **Extra page**: `PoliticaPage.jsx` renders legal policies via route `/:tipo` (termos, privacidade, cookies, seguranca).
- **AdvancedSearch**: Not a separate component; advanced search (price range, location) is integrated into `CarGrid.jsx`.
- **MyListings**: Not a separate component; inline in `ProfileLoggedIn.jsx`.
- **AuthProvider**: Not in `components/auth/`; auth is integrated into `AppProvider.jsx` (global context).
- **Legacy artifacts**: `.next/`, `out/`, and `public/` (Next.js assets) still present but unused.

## Conventions

- `camelCase` for JS identifiers, `snake_case` for a few vehicle fields (`anoFabricacao`, `estadoVeiculo`).
- Portuguese only — code comments, variable names, UI text, commit messages.
- Firebase API keys are public (expected for Firebase Web SDKs).
