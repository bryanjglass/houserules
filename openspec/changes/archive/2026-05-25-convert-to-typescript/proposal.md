## Why

The codebase is plain JavaScript (ESM) across both workspaces, so the only signal about the shape of a `User`, a task's status machine, an API response, or a `req.user` payload lives in comments and convention. The role-discriminated `User` model, the string-based status/type/recurrence fields, and the cookie-JWT `req.user` shape are exactly the kind of implicit contracts that drift and break silently. TypeScript makes these contracts explicit and checkable, catching mismatches between server and client at build time instead of at runtime in a family's hands.

## What Changes

- Add TypeScript toolchain to both workspaces: `tsconfig.json` per workspace plus a shared base config, `typescript` dev dependency, and `@types/*` for `express`, `cookie-parser`, `cors`, `jsonwebtoken`, `bcryptjs`, `node`, etc.
- Convert **server** sources (`server/src/**/*.js`) to `.ts`: routes, middleware (`requireAuth`, `requireRole`, `rateLimit`), `lib/` helpers, and `index.ts`. Type `req.user` via an Express `Request` augmentation. Adopt Prisma's generated types for models.
- Convert **client** sources (`client/src/**/*.{js,jsx}`) to `.tsx`/`.ts`: pages, components, context, `api/client`, `lib/`. Type the `useAuth()` value (`undefined | null | User`), API payloads, and component props.
- Define shared domain types (role, task status/type/recurrence string unions, transaction type) so server and client agree on the same string literals instead of bare `string`.
- Update build/run tooling: server `dev`/`start`/`db:seed` scripts to run TypeScript (via `tsx`/`ts-node` or a compile step); Vite already supports `.tsx` so the client build path is largely config-only.
- Update `CLAUDE.md` to describe the TypeScript stack and any new typecheck command.
- **BREAKING** (developer-facing only): entry points and import paths move from `.js`/`.jsx` to `.ts`/`.tsx`; the `node --watch src/index.js` dev flow is replaced. No runtime API or product behavior changes.

## Capabilities

### New Capabilities
- `typescript-tooling`: The build and type-checking contract — both workspaces compile under `tsc`/`tsx` with a strict-enough config, a repo-level typecheck command exists and passes, and shared domain types are the single source of truth for role/status/type string unions used on both server and client.

### Modified Capabilities
<!-- None. This is an implementation/tooling migration; no product requirement or runtime behavior changes. -->

## Impact

- **Code:** every source file in `server/src/` and `client/src/`; `server/package.json` and `client/package.json` (scripts + deps); new `tsconfig.json` files; possibly a shared `types/` location. `server/prisma/seed.js` if converted.
- **Build/deploy:** server start path changes (Railway `deploy` runs the server — must run compiled output or `tsx`); `railway.toml` and the nixpacks build may need a compile step. Vite client build is unaffected functionally.
- **Dependencies:** add `typescript`, `tsx` (or `ts-node`), `@types/*` packages as devDependencies.
- **No change to:** Prisma schema, the SQLite database, API routes/contracts, auth behavior, or any user-facing UI.
