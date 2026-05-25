## Context

MilkMoney is an npm-workspaces monorepo (`server`, `client`), plain JavaScript ESM throughout. The server is Express + Prisma + SQLite; the client is React + Vite + Tailwind + React Router. Key implicit contracts that this migration makes explicit:

- The single role-discriminated `User` model (`role: "PARENT" | "CHILD"`, self-relation `parentId`).
- String-typed enums on `Task` (status `PENDING | COMPLETED | APPROVED`, type, recurrence) and `Transaction` (`EARNED | ADJUSTMENT`), documented only in schema comments.
- The cookie-JWT `req.user` payload (`{ id, role, name, parentId }`) populated by `requireAuth`.
- The client `useAuth()` tri-state (`undefined` loading / `null` logged out / `User` logged in).

Prisma already generates TypeScript types from `schema.prisma`, which we should lean on rather than hand-rolling model types. The client already lists `@types/react` / `@types/react-dom` as devDependencies, so the React typing baseline exists. There is no test suite or linter, so `tsc --noEmit` becomes the primary correctness gate this change introduces.

## Goals / Non-Goals

**Goals:**
- Every source file in `server/src/` and `client/src/` is TypeScript (`.ts`/`.tsx`) and typechecks under a strict-enough config.
- A single repo-level `npm run typecheck` runs both workspaces and passes.
- Shared domain string-unions (role, task status/type/recurrence, transaction type) live in one place imported by both server and client — no divergent `string` literals.
- Server dev/start/seed and Railway deploy continue to work with no runtime behavior change.

**Non-Goals:**
- No change to Prisma schema, the database, API contracts, auth behavior, or UI.
- Not introducing a test suite, ESLint, or Prettier (separate concern).
- Not eliminating every `any` on day one — pragmatic typing is acceptable where third-party gaps exist, but app domain types must be precise.
- Not restructuring folders or renaming routes beyond the file-extension change.

## Decisions

### Decision: Run the server with `tsx`, no separate compile step in dev
Use `tsx` for `dev` (`tsx watch src/index.ts`), `start`, and `db:seed`. Rationale: preserves the current zero-build dev ergonomics (today's `node --watch`), supports ESM + TS natively, and avoids a `dist/` directory and source-map juggling.
- **Alternative considered:** `tsc` compile to `dist/` then `node dist/index.js`. More "standard" for production but adds a build artifact, complicates Prisma client path resolution, and slows the edit loop. We keep `tsc --noEmit` purely as a typecheck gate and let `tsx` run sources directly.
- **Production:** Railway `start` runs `tsx src/index.ts` (add `tsx` as a regular dependency, not devDependency, so it's present after `npm ci --omit=dev` if that's used). Revisit a compile step only if startup cost matters.

### Decision: Shared domain types in a server-owned module, mirrored for the client
Define string unions (`Role`, `TaskStatus`, `TaskType`, `Recurrence`, `TransactionType`) and the JWT/`req.user` payload shape once. Since there's no shared workspace package, place them in `server/src/types/domain.ts` and a parallel `client/src/types/domain.ts` (or copy via a tiny shared file). Prefer a single `shared/` set of `.ts` types imported by both if path mapping allows; otherwise duplicate the small union file and note it must stay in sync.
- **Alternative considered:** a third `shared` workspace package. Cleanest long-term but adds build/packaging overhead disproportionate to a handful of string unions. Defer unless the shared surface grows.

### Decision: Augment Express `Request` for `req.user`
Add a `types/express.d.ts` declaring `Request.user?: AuthUser` so `requireAuth`/`requireRole` and every route handler get a typed `req.user` instead of casts.

### Decision: `strict: true`, but `noImplicitAny` enforced only in app code
Enable `strict` in the shared base `tsconfig`. Use `skipLibCheck: true` to avoid third-party `.d.ts` noise. `moduleResolution: "bundler"` (client) / `"NodeNext"` (server ESM) as appropriate per workspace.

### Decision: Convert in dependency order, leaf-first
Server: `lib/` → middleware → routes → `index.ts`. Client: `lib/` + `api/` + `types/` → `context` → `components` → `pages` → `App`/`main`. Rationale: typing a leaf first means its consumers get real types immediately, surfacing real mismatches rather than cascading `any`.

## Risks / Trade-offs

- **Railway deploy runs unbuilt TS via `tsx`** → Mitigation: `tsx` moved to prod `dependencies`; verify the nixpacks `start` command and `railway.toml` point at `tsx src/index.ts`; smoke-test a deploy before merging.
- **Duplicated shared domain unions drift** → Mitigation: keep the union file tiny, add a comment pointing to its mirror, and a `typecheck` that would catch a literal mismatch at the boundary where both are used.
- **Prisma type/runtime mismatch for string fields** (DB stores arbitrary strings; our unions are narrower) → Mitigation: treat DB reads as the Prisma-generated type and narrow at the boundary; don't assert unions onto raw DB strings without a guard.
- **Big-bang vs incremental** — converting everything risks a large unreviewable diff → Mitigation: allow `allowJs: true` during transition so `.js` and `.ts` coexist; convert per-folder in separate commits; flip `allowJs: false` at the end.
- **Hidden runtime behavior change from `tsx`/ESM resolution** (e.g., extension handling, JSON imports) → Mitigation: keep API/auth behavior covered by manual smoke test (seed logins) after server conversion.

## Migration Plan

1. Add toolchain + base `tsconfig` + `@types/*`; set `allowJs: true`. Repo `typecheck` script wired (passes trivially).
2. Convert server leaf-first; switch scripts to `tsx`; manual smoke test (parent + child login, task approve, balance).
3. Convert client leaf-first; confirm `vite build` and dev proxy still work.
4. Introduce shared domain unions; replace bare `string` enums on both sides.
5. Flip `allowJs: false`; ensure `npm run typecheck` passes clean. Update `CLAUDE.md` and `railway.toml`. Smoke-test a Railway deploy.

**Rollback:** the change is additive until step 5; revert the branch. No data or schema migration is involved, so rollback is purely code.

## Open Questions

- Single `shared/` types module vs. duplicated union file — decide in step 4 based on whether tsconfig path mapping across workspaces is clean.
- Keep `tsx` at runtime in production, or add a `tsc` build for faster cold starts? Defer until deploy smoke test shows whether startup latency matters.
