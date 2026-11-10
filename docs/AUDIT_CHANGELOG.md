# Audit Changelog

Produced by running [`AUDIT_PROMPT.md`](./AUDIT_PROMPT.md). Nothing is committed; all changes are in the working tree.

## Before → after

| Check | Before | After |
|---|---|---|
| `client` `tsc -b` (also the first half of `npm run build`) | **fails** (2 errors, so the deploy build was broken) | passes |
| `client` ESLint | 53 errors, 6 warnings | 0 / 0 |
| `backend` `tsc --noEmit` | passes | passes |
| `npm audit --omit=dev` | backend 9 (1 critical, 3 high); client had advisories (moderate+) | 0 / 0 |
| Client JS on first load | 1 file, 924 kB (278 kB gzip), every page included | 4 shared chunks, 742 kB (234 kB gzip), plus a small chunk per page. Shared chunks are cacheable across deploys, and the home page loads only its own small chunk |
| Hero/logo images | 1.06 MB PNG | 70 kB WebP |
| Backend tests | none runnable (the existing ones hit a live URL) | 24 passing (`npm test`) |
| Client tests | none | 7 passing |
| Page-load requests to Google Fonts | 2 render-blocking | 0 (Fraunces self-hosted) |

Responsiveness was checked at 320 / 375 / 768 / 1024 / 1440 px on 14 routes (public, account, checkout, admin, 404) with Playwright and Edge, against a mocked API. Pre-fix findings are listed below; post-fix there is no horizontal overflow and no page errors on any route/width.

## Changes

### Security & correctness (high impact)
1. **Client auth guards were hard-coded stubs.** `protected-guard.tsx` and `admin-layout.tsx` ignored the real user (`data = {name:"John"}`, fake `isAdmin: true`) and showed protected/admin screens to anyone. They now use `useUser()`. The backend already enforced auth, so this was a UI exposure rather than a data leak. *Verified by build and mocked-API runs only, not against a real session.*
2. **Stripe webhook was not idempotent.** A replayed `checkout.session.completed` decremented stock again, and a late `expired` event could cancel a paid order. Transitions are now atomic compare-and-set on `paymentStatus: pending`. *Tests:* `webhook.test.ts`.
3. **Orders could oversell.** No stock check at order time, and the COD decrement could go negative. Added a stock pre-check and a guarded decrement.
4. **Ordering a product with no image returned 500** (`image` was `required` but defaulted to `""`). Now optional.
5. **Search keyword went unescaped into `$regex`** (regex injection / ReDoS). Escaped and capped at 100 chars. *Test:* `api.test.ts`.
6. **Hardening.** Added `helmet`, `compression`, JSON body limit (100 kB), rate limits (auth 30 / 15 min, AI 10 / min, API 600 / 15 min), JSON 404 for unknown `/api` routes, CORS now allows `PATCH`/`OPTIONS`, `x-powered-by` removed.
7. **Error handler** now maps Multer errors, malformed JSON, oversized bodies and bad ObjectIds to 4xx instead of 500, and no longer logs expected 4xx errors.
8. **Server startup**: connects to the DB before listening, graceful `SIGTERM`/`SIGINT` shutdown. `app.ts` split from `index.ts` so the app is testable.
9. **DB indexes** on product, order, review, address and cart hot paths.
10. **Dependencies**: `npm audit fix` (backend now 0; includes the critical `proxy-addr`), `shadcn` CLI moved to devDependencies (its transitive vulns were reaching the prod audit).

### Client correctness & type safety
- Removed all `any`: typed every API function (`lib/api.ts`), added admin/review types, added `getErrorMessage()` helper.
- Typing exposed three real contract bugs: the dashboard read `totalOutOfStock` against a mis-named type, pagination used `hasMore` while the API sends `hasNextPage`/`hasPrevPage`, and reviewable orders lacked `orderNo`.
- Axios interceptor now mutates the error rather than spreading it, so `axios.isAxiosError` keeps working.
- Cart sync error handler crashed on network errors (`response` undefined); fixed.
- Removed set-state-in-effect patterns (banner, mobile hook, checkout default address, product-detail image reset, admin edit images); `useWatch` replaces `form.watch`.
- Fixed the admin loading spinner class typo (`min-h-[70h]`).
- Fixed `next-themes` being used without a provider (toasts ignored the app theme); the app's own `useTheme` is used instead and `next-themes` removed.

### Performance
- Route-level code splitting (`React.lazy` + `Suspense`), vendor chunk groups, React Query defaults (`staleTime` 60 s, no refetch on focus).
- Images: WebP + explicit dimensions, `eager`/`fetchpriority=high` for the first hero slide, `lazy`/`async` decoding elsewhere.
- Fraunces self-hosted via `@fontsource-variable/fraunces` (no third-party render-blocking CSS).
- Removed unused deps (`nanoid`, `leaflet`, `react-leaflet`, `@types/leaflet`, `@radix-ui/react-use-controllable-state`, `motion`, `next-themes`), and `lodash` is now imported per-function.
- Removed dead assets (`hero.png`, `react.svg`, `vite.svg`, unused product images).
- Server: gzip, immutable caching for hashed assets in production.

### Responsiveness & accessibility
- Mobile header: search moved to its own row below 768 px (it was squeezed to a sliver at 375 px).
- Logged-in account button opened the **login dialog** on click; fixed. It now shows the user's name.
- Fixed horizontal scroll: home at 1024 px (16 px overflow; most likely the carousel arrows, since the layout padding was removed at `lg`, which I changed) and account/checkout/orders at 320 px.
- Labelled icon-only buttons (cart, quantity, close, row actions, back); `role="search"` and an input label on search; one `h1` on the home page; real 404 page; router error boundary and Suspense fallbacks.
- `index.html`: description, theme-color, Open Graph basics.

### Tooling & docs
- Backend: Vitest + Supertest + `mongodb-memory-server` (`npm test`, `npm run typecheck`).
- Client: Vitest (`npm test`).
- GitHub Actions CI (typecheck, lint, test, build).
- `.env.example` for both packages (the README referenced files that did not exist); README testing section rewritten.
- ESLint: shadcn `ui/` files exempt from two rules that conflict with vendored code.

## Decisions made (project is on a resume with a live demo)
- **Real auth stays.** The hard-coded fake admin is removed for good. To keep the admin dashboard demoable, `npm run seed:demo-admin` (new) creates or promotes a demo admin from `DEMO_ADMIN_EMAIL` / `DEMO_ADMIN_PASSWORD`, so no password is committed. Run it once against the production DB and put those credentials on your resume/README demo line. Use a throwaway password, since anyone with it can edit demo data. AI generation is rate-limited to 10 requests/min to cap cost.
- **Legacy smoke scripts** in `backend/src/tests/` now use `API_BASE_URL` (default `http://localhost:8000/api`). They previously pointed at the original author's server, which a reviewer could mistake for yours.
- **Rate-limit numbers** kept as shipped (generous enough not to affect a reviewer clicking around).
- **`client/src/assets/cats-img/`** kept (unused by the app, possibly seed material).
- Deferred as low value for a demo: shared order-status enum, cart merge-on-login strategy.

## Before you deploy
Nothing is committed. Suggested order: commit on a branch, push, check the Vercel/Render preview (log in, add to cart, place a COD order, open `/admin`), then merge to `master`. Make sure the Render service has `FRONTEND_ORIGIN` set to the exact Vercel URL, because CORS and cookies depend on it.

## Not verified
- No run against real MongoDB Atlas, Stripe, S3 or the AI gateway; Stripe and S3 are mocked or untouched, the AI route was only checked for auth/limits.
- The full browse → cart → login → checkout → order flow was not run end to end in a browser (UI only against a mocked API; checkout logic via API tests).
- **Lighthouse / Core Web Vitals not measured**, so there is no performance score to report, only bundle and asset sizes.
- Dark mode was not visually reviewed per page.
- Multi-instance deployments: the rate limiter uses in-memory counters.
