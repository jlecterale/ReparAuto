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
- **Firebase 11.7.x** — Auth + Firestore (not localStorage). Config hardcoded in `src/lib/firebase.ts`.
- **lucide-react 0.510.x** — icons.
- **TypeScript 5.8** — strict mode, types in `src/types/`.
- **No test/lint/format tools.**

## Data Layer

- **Firestore** — primary data store. Collections: `cars`, `parts`, `users` (favorites). Used by all hooks.
- **localStorage fallback** — favorites only, when user is not logged in (`favs_reparauto` key).
- **Seed data** — 7 carros + 3 peças (migrated from original HTML), auto-populated on first Firestore init.
- **DB version** tracked as `reparauto_db_version` in localStorage (`'2.2'`), but data lives in Firestore, not localStorage.

## Source Map

```
src/
├── main.tsx                  # Entry: ReactDOM.createRoot
├── App.tsx                   # HashRouter + AppProvider + Layout
├── index.css                 # Tailwind v4 @import + custom @theme + global styles
├── types/                    # Shared TypeScript interfaces
│   ├── index.ts
│   ├── app.ts                # AppContextValue, CarrosContextValue, PecasContextValue
│   ├── carro.ts              # Carro, CarroFormData, EstadoVeiculo, etc.
│   ├── peca.ts               # Peca, PecaFormData, TipoPeca
│   ├── usuario.ts            # Usuario, AuthContextValue
│   ├── favoritos.ts          # FavoritosContextValue
│   └── ui.ts                 # ButtonProps, BadgeProps, ModalProps, ToastContextValue
├── pages/
│   ├── Home.tsx              # HeroBanner + CarGrid
│   ├── DetalhesCarro.tsx     # /detalhes/:id — full detail page
│   ├── Anunciar.tsx          # Multi-step form (Fotos → Dados → Preço)
│   ├── Pecas.tsx             # Peças grid + modals
│   ├── Perfil.tsx            # Auth-gated profile
│   └── PoliticaPage.tsx      # /:tipo — Termos/Privacidade/Cookies/Segurança
├── components/
│   ├── layout/
│   │   ├── Header.tsx        # Logo, nav desktop, busca, favoritos, perfil, filter chips
│   │   ├── Footer.tsx        # Copyright + policy links (modal)
│   │   └── BottomNav.tsx     # Mobile bottom nav
│   ├── home/
│   │   ├── HeroBanner.tsx    # Main hero banner
│   │   ├── CarGrid.tsx       # Car grid container with filters
│   │   ├── CarCard.tsx       # Individual car card
│   │   └── FilterChips.tsx   # Quick filter chips
│   ├── detalhes/
│   │   ├── TechnicalSheet.tsx  # Technical specs table
│   │   ├── StatusPanel.tsx     # Pronto/Manutenção status + orçamento
│   │   └── GalleryModal.tsx    # Photo gallery modal
│   ├── anunciar/
│   │   ├── StepIndicator.tsx   # Step 1/2/3 indicator
│   │   ├── StepFotos.tsx       # Step 1: Photos
│   │   ├── StepDados.tsx       # Step 2: Technical data
│   │   └── StepPreco.tsx       # Step 3: Price + condition
│   ├── pecas/
│   │   ├── PecasGrid.tsx       # Parts grid
│   │   ├── PecasCard.tsx       # Individual part card
│   │   ├── PecasFilter.tsx     # Parts filter chips
│   │   ├── CriarPecaModal.tsx  # Create part listing modal
│   │   └── DetalhesPecaModal.tsx # Part detail modal
│   ├── perfil/
│   │   ├── ProfileLoggedOut.tsx # Login/register prompt
│   │   └── ProfileLoggedIn.tsx  # User info + my listings
│   ├── auth/
│   │   └── LoginModal.tsx       # Login/register/Google auth modal
│   ├── ui/
│   │   ├── Toast.tsx            # Toast notifications (success/warning/error)
│   │   ├── Modal.tsx            # Generic modal with focus trap
│   │   ├── Button.tsx           # Reusable button (primary/secondary/danger/ghost)
│   │   └── Badge.tsx            # Status badge (Pronto/Reparos/Negociável/Low-Cost)
│   └── CarAutocomplete.tsx      # Legacy component (from Next.js scaffold)
├── lib/
│   ├── firebase.ts           # Firebase init (app, auth, db, storage)
│   ├── db.ts                 # Firestore CRUD + seed data (7 cars + 3 parts)
│   ├── auth.ts               # Firebase Auth (email/password + Google)
│   ├── utils.ts              # formatarPreco, renderDescricao, gerarId, validators
│   └── constants.ts          # Theme, limits, lists, policy texts
├── hooks/
│   ├── useAuth.ts            # Auth state + login/logout/register
│   ├── useCarros.ts          # Cars with filters (price, search, location, sort)
│   ├── usePecas.ts           # Parts with type filter
│   └── useFavoritos.ts       # Favorites (Firestore for auth'd, localStorage fallback)
└── providers/
    └── AppProvider.tsx       # Global context: auth, carros, pecas, favoritos
```

## Commands

```sh
npm run dev        # Vite dev server
npm run build      # Vite build → dist/
npm run preview    # Preview production build
npx tsc --noEmit   # TypeScript type check
firebase deploy --only hosting --project reparauto-site
```

## Key Implementation Deviations from Plan

- **Firestore instead of localStorage**: The plan (`plans/plano-refactor-reparauto.md`) specified localStorage CRUD. The implementation uses Firestore collections (`cars`, `parts`, `users.favoritos`). The constants file still defines localStorage keys, but they are unused except as fallback for favorites.
- **Extra page**: `PoliticaPage.tsx` renders legal policies via route `/:tipo` (termos, privacidade, cookies, seguranca).
- **AdvancedSearch**: Not a separate component; advanced search (price range, location) is integrated into `CarGrid.tsx`.
- **MyListings**: Not a separate component; inline in `ProfileLoggedIn.tsx`.
- **AuthProvider**: Not in `components/auth/`; auth is integrated into `AppProvider.tsx` (global context).
- **TypeScript migration**: All source files migrated from `.js`/`.jsx` to `.ts`/`.tsx` with strict mode and shared types in `src/types/`.
- **Legacy artifacts**: `.next/`, `out/`, and `public/` (Next.js assets) still present but unused.

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

- `camelCase` for JS identifiers.
- `snake_case` for a few vehicle fields (`anoFabricacao`, `estadoVeiculo`).
- Chat responses in Portuguese only.
- Code (comments, variable names, UI text, commit messages) in English only.
- Firebase API keys are public (expected for Firebase Web SDKs).
