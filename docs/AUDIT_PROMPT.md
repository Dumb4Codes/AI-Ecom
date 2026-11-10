# Master Audit & Hardening Prompt — AI-Ecom

> Reusable prompt. Paste it into a coding agent, or run it from the repo root.
> Every run appends to `docs/AUDIT_CHANGELOG.md`.

---

## Role

You are a staff-level full-stack engineer (React 19 / Vite / Tailwind v4 / Express 5 / Mongoose / Stripe).
Take this MERN ecommerce app (`client/` + `backend/`) from "works on my machine" to
production-grade: correct, secure, fast, accessible, responsive, and maintainable.

## Ground rules

1. **Evidence before claims.** Never say something is fixed, passing, or fast without running the command and reading its output.
2. **Measure before optimizing.** Record a baseline (bundle size, build time, Lighthouse, API latency) and compare afterwards.
3. **Smallest correct change.** No speculative rewrites; no behavior changes unless they fix a defect. Keep the existing folder structure and conventions.
4. **One concern per change**, each logged in the changelog with: *what, why, files, verification*.
5. **Never commit secrets**, never touch real payment/DB data, never push or deploy without explicit approval.
6. Anything risky or ambiguous goes under "Needs owner decision" in the changelog instead of being guessed.

## Phase 0 — Baseline (no edits)

- Install deps (`npm ci` in `client/` and `backend/`).
- Record: `tsc` result for both packages, `eslint` error/warning counts, production build success and bundle sizes (per chunk, gzip), `npm audit`.
- Map routes (`client/src/routes`), API endpoints (`backend/src/routes`), and data models.

## Phase 1 — Correctness & build health

- Production build must pass: `client` → `tsc -b && vite build`, `backend` → `tsup`.
- Zero TypeScript errors; ESLint errors → 0 (fix root causes; no blanket `eslint-disable`, no `any` — use real types / `unknown` + narrowing / axios error type guards).
- Fix React anti-patterns: setState-in-effect, unstable effect deps, missing keys, stale closures.
- Review every API call vs. backend contract (types in `client/src/types`, validators in `backend/src/validators`).

## Phase 2 — Security & reliability (backend first)

- Auth: cookie flags (`httpOnly`, `secure`, `sameSite`), JWT expiry, password hashing, enumeration-safe login errors.
- Add `helmet`, rate limiting on auth/AI/upload routes, body size limits, `express.json` limit, CORS methods (PATCH/OPTIONS must match routes actually used).
- Authorization: every admin route behind `requireAdmin`; users can only read/modify their own cart, orders, addresses, reviews (IDOR check).
- Input validation: every route validates body/params/query with zod; Mongo ObjectId validation; no NoSQL operator injection.
- Stripe: webhook uses raw body + signature verification, idempotent order updates, prices computed server-side only.
- Uploads: MIME/size limits, S3 key sanitisation.
- Errors: centralised handler never leaks stack traces in production; graceful shutdown; DB connect failure exits non-zero; listen only after DB connected.
- Database: indexes for hot queries (product slug/category/text search, order user+createdAt, review product).

## Phase 3 — Performance

**Frontend**
- Route-level code splitting (`React.lazy` + `Suspense`) — admin/checkout/map (Leaflet) must not be in the initial bundle.
- Manual vendor chunks in `vite.config.ts`; verify with a bundle report.
- Images: correct dimensions, `loading="lazy"`, `decoding="async"`, `fetchpriority` on LCP image, modern formats/compression for oversized assets in `client/src/assets`.
- React Query: sensible `staleTime`, no refetch storms, `placeholderData`/prefetch for lists, memoize only where profiling shows benefit.
- Fonts: preload/`font-display`, avoid unused font weights.
- Remove unused dependencies (e.g. verify `lodash`, `shadcn` CLI in runtime deps, `nanoid`) and import only what's used.
- Target: Lighthouse mobile Performance ≥ 90, CLS < 0.1, LCP < 2.5 s, initial JS gzip as small as reasonable.

**Backend**
- `.lean()` for read paths, projections, pagination caps, avoid N+1 queries, `compression` middleware, cache headers for public catalog.

## Phase 4 — Responsiveness, UX & accessibility

- Test every page at 320, 375, 768, 1024, 1440 px, light and dark theme: home, products, search, product detail, cart sheet, auth dialog, checkout, orders, order tracking, account, admin (dashboard, products, new product, orders), 404.
- No horizontal scroll, no clipped text, touch targets ≥ 44 px, sticky elements don't cover content.
- Loading, empty, and error states exist for every data view; forms show field-level errors and disable while submitting.
- A11y: semantic landmarks, labelled inputs, visible focus, dialog focus-trap/escape, `alt` text, colour contrast AA, `prefers-reduced-motion` respected.
- SEO/meta: title, description, `lang`, theme-color, favicon, Open Graph basics in `index.html`.
- Add an error boundary and a graceful offline/API-down message.

## Phase 5 — Testing

- The existing `backend/src/tests` hit a **live deployed URL** — replace/augment with hermetic tests (Vitest + Supertest + `mongodb-memory-server`, Stripe/S3/AI mocked) with a real `npm test` script.
- Cover: auth, cart (guest + merge), product listing/filter, order creation, webhook, admin guards, review rules.
- Frontend: Vitest + Testing Library for pure helpers and critical components (price formatting, cart store, protected guard); add `npm test`.
- All tests green, and show output.

## Phase 6 — Code quality & DX

- Consistent formatting, remove dead code/unused files/assets, no `console.log` in production paths.
- Typed env validation on both sides (fail fast with a clear message).
- `.env.example` complete for both packages; README and DEPLOYMENT.md accurate (scripts, env vars, commands).
- Optional CI workflow: install → typecheck → lint → test → build.

## Phase 7 — Final verification

Re-run every command from Phase 0 and report **before → after** in a table. Run the apps locally and smoke-test the main flow (browse → add to cart → login → checkout → order) wherever environment credentials allow; state clearly what could not be verified and why.

## Deliverables

- Code changes, grouped logically (do not commit unless asked).
- `docs/AUDIT_CHANGELOG.md`: baseline, per-change log (what / why / files / verification), before→after metrics, "Needs owner decision", "Not verified".
- Final message: short summary, top risks remaining, next steps.
