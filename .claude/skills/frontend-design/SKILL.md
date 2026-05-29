---
name: frontend-design
description: ReparAuto frontend design system. Use whenever creating or editing any UI — components, pages, Tailwind classes, colors, text, spacing, forms. Enforces our semantic color tokens, typography, and shared UI components instead of raw hex/slate or hand-rolled markup.
---

# ReparAuto — Frontend Design System

Portuguese used-car & parts marketplace. Next.js 15 + React 19 + Tailwind v4. Tokens live in `src/index.css` (`@theme`). **Always prefer tokens + shared components over raw values.**

## Golden rules

1. **Never hardcode hex** in JSX/CSS. Use tokens (`bg-primary-600`, `text-accent`, `text-fg`).
2. **Avoid raw `slate-*`/`gray-*` for text.** Use the semantic `fg` tokens below.
3. **Reuse `src/components/ui/*`** (Button, Input, Badge, Alert, Modal, SegmentedControl) — don't re-style `<button>`/`<input>` by hand.
4. **Typography is automatic** — headings use the heading font via global CSS; just pick the right tag/size.
5. **Contrast ≥ WCAG AA.** Body text ≥ 4.5:1, large/UI ≥ 3:1. Muted text = `fg-muted` minimum, never `slate-400` for readable text.
6. **Icons:** `@phosphor-icons/react`. Any file importing them needs `'use client'` (they use context — server components crash otherwise).

## Color tokens

**Semantic scales** (50→950): `primary` (blue, brand), `secondary` (orange), `success` (green), `warning` (yellow), `danger` (red), `neutral` (gray). Use as `bg-primary-600`, `border-danger-200`, `text-success-700`, etc.

**Interactive accent** (the action orange):
- `accent` / `accent-hover` → buttons, active states, links-as-actions (contrast-safe).
- `accent-bright` → decorative/icon hover only (vibrant, lower contrast).

**Semantic text (`fg`) — use these for text color:**
| Token | Role |
|-------|------|
| `text-fg-heading` | headings / titles (deep blue) |
| `text-fg-strong` | high-emphasis body |
| `text-fg` | default body text |
| `text-fg-muted` | secondary text, captions, meta (Categoria:, location…) |
| `text-fg-subtle` | placeholders, disabled, lowest emphasis |
| `text-fg-link` | inline links |
| `text-fg-inverse` | text on dark/colored surfaces |

Status tints: use `success`/`warning`/`danger` scales (e.g. `bg-success-50 text-success-700 border-success-200`) — not raw `green/red/yellow`.

## Typography

- Single typeface (`--font-sans` / `--font-heading`). Headings (`h1`–`h6`) get the heading font + weights automatically — **do not** add `font-*` family classes.
- Titles/brand: `h1` or `.text-title` (ExtraBold 800). Subtitles: `h2`–`h6` or `.text-subtitle` (SemiBold 600).
- Non-heading element that must look like a title → add `.font-heading`.
- Sizes via Tailwind (`text-sm`/`text-base`/`text-xl`…); `text-2xl`/`text-3xl` headings are fluid-responsive already.

## Components (prefer these)

```tsx
// Button — tipo: primario|secundario|terciario|perigo|verde|ghost · tamanho: sm|md|lg
<Button tipo="primario" tamanho="md" icone={<Plus/>} iconeFim={<ArrowRight/>} blocoCompleto carregando>
  Guardar
</Button>

<Input label="Email" erro={erro} iconeFim={<Check/>} placeholder="..." />

<Badge cor="green" variante="soft">Novo</Badge>          // cor: accent|blue|green|yellow|gray · variante: soft|solid
<Alert tipo="sucesso" titulo="Feito" icone={<Check/>}>Mensagem</Alert>  // tipo: info|sucesso|aviso|erro|neutro
<Modal titulo="..." tamanho="md" onClose={...}>…</Modal>
<SegmentedControl value={v} onChange={setV} ariaLabel="..." options={[{value,label,icone}]} />
```

Don't reach for primitives when a component fits: CTA → `<Button tipo="primario">`, destructive → `tipo="perigo"`, confirm → `tipo="verde"`, on dark/photo → `tipo="ghost"`.

## Patterns

- **Surfaces/cards:** `bg-white rounded-2xl shadow-sm border border-neutral-200 p-4`.
- **Inputs/selects:** `rounded-xl border border-slate-300 focus:border-accent focus:ring-2 focus:ring-accent/30`; required label `*` in `text-accent`; disabled `bg-slate-100 text-fg-subtle cursor-not-allowed`.
- **Focus:** never remove outlines; rely on the global focus-visible ring (`accent`).
- **Empty states:** `flex flex-col items-center justify-center text-center py-16 text-fg-muted` (Phosphor icons render as block — center with flex, not just `text-center`).
- **Anchor scroll targets:** add `scroll-mt-20 sm:scroll-mt-24` so the sticky bar doesn't cover them.
- **Spacing:** prefer `gap-*`/`space-y-*`; section rhythm `mb-8 sm:mb-10`.
- **Responsive:** mobile-first; cards grids `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`; sidebar layout content offset `lg:pl-64`.

## Don't

- ❌ `text-slate-400`/`-500` for readable text → ✅ `text-fg-muted`.
- ❌ `#e55b2b`, `bg-[#0b4f9e]` → ✅ `bg-accent`, `bg-primary-600`.
- ❌ raw `green-500`/`red-500` for status → ✅ `success-*`/`danger-*`.
- ❌ `font-family`/Google-font overrides → ✅ rely on the global type system.
- ❌ custom `<button className="bg-...">` for a standard action → ✅ `<Button>`.
- ❌ Phosphor icons in a file without `'use client'`.
