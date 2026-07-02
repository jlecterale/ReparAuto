---
name: run-web
description: Run the RecarGarage web app (Next.js) inside a headless container and screenshot it with Playwright to verify visual changes. Use when asked to run the site, preview a UI change, or take desktop/mobile screenshots of pages or components.
---

# Run the web app in a headless container

Verified cold-start recipe for this repo (Next.js 15, port 3000). Firestore is
**not reachable** from the container's headless browser, so live listing data
never loads — see "Previewing data-driven UI" below for the workaround.

## 1. Install & start

```bash
npm ci                       # only if node_modules is missing
npm run dev > /tmp/dev.log 2>&1 &
timeout 60 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done'
```

Stop with `pkill -f "next dev"`. First compile of a route takes a few seconds —
poll or retry, don't trust the first 404/timeout.

## 2. Screenshot with Playwright

Chromium is pre-installed at `/opt/pw-browsers/chromium` — never run
`playwright install`. Install `playwright-core` in the scratchpad (NOT in this
repo), then run the bundled driver:

```bash
cd "$SCRATCHPAD" && npm init -y && npm i playwright-core
node <skill-dir>/screenshot.mjs http://localhost:3000/dev-preview out.png 1440x900
node <skill-dir>/screenshot.mjs http://localhost:3000/dev-preview out-mobile.png 390x844
```

`screenshot.mjs` (in this skill's folder) launches with
`{ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }`,
waits for a selector, and saves a full-page screenshot. **Look at the
screenshot** — a blank frame means the page didn't render.

## 3. Previewing data-driven UI (no Firestore access)

Outbound HTTPS goes through a proxy the browser doesn't use, so client
Firestore subscriptions time out and feeds render empty/skeletons. Do **not**
disable TLS or proxy the browser. Instead:

- **Static routes work as-is**: `/termos`, `/faq`, layout, header/footer.
- **For components that need data** (cards, grids): create a **temporary**
  route `app/dev-preview/page.tsx` (`'use client'`) that renders the real
  components with hardcoded sample objects (`as unknown as Carro`), plus local
  sample photos curled into `public/dev-preview/` (e.g. from
  `https://picsum.photos/seed/x/1600/1200`). AppProvider wraps every route, so
  context hooks (favoritos etc.) work offline.
- **Delete `app/dev-preview/` and `public/dev-preview/` before committing.**
  They are screenshot scaffolding, never part of a change.

## Gotchas actually hit

- `app/` folders starting with `_` (e.g. `__preview`) are **private in the App
  Router** and 404 — don't use an underscore prefix for the preview route.
- A brand-new route 404s on the first request while Turbopack compiles it;
  retry after ~2s.
- `LazyImage` lazy-loads via IntersectionObserver + fade-in: wait ~3s after
  the selector appears, and expect shimmer placeholders for below-the-fold
  images in full-page screenshots (scroll first if you need them painted).
- The cookie-consent banner overlays the bottom of every page; click
  `button:has-text("Aceitar Todos")` if it blocks what you're capturing.
- Standard viewports: desktop `1440x900`, mobile `390x844`.
