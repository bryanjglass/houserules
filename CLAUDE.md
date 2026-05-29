# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A family chore and allowance tracker. Parents create child accounts, assign tasks (one-off or recurring) with optional dollar amounts, and approve completed work — approval credits the child's allowance balance. Children log in with a PIN to see their tasks and balance.

## Commands

Run from the repo root (npm workspaces: `server`, `client`).

```bash
npm install                 # installs both workspaces
npm run dev                 # runs server (:3001) and client (:5173) concurrently
npm run typecheck           # tsc --noEmit across both workspaces (the only correctness gate)
npm run db:migrate          # prisma migrate dev (creates/updates dev.db)
npm run db:seed             # seed demo data (see logins below)
npm run db:reset            # drop, re-migrate, re-seed
```

The server runs TypeScript directly via `tsx` (no build step): `dev` is `tsx watch src/index.ts`, `start` is `tsx src/index.ts`. The client builds with Vite.

Single-workspace commands: `npm run <script> --workspace=server` or `--workspace=client`.
Client also has `build` and `preview`. There is no test suite or linter; `npm run typecheck` is the closest thing to CI.

First-time setup: copy `server/.env.example` to `server/.env`, then `npm run db:migrate && npm run db:seed`.

Seed logins: parent `parent@example.com` / `password123`; children Alex (PIN `1234`) and Sam (PIN `5678`).

## Architecture

**Stack:** Express + Prisma + SQLite (`server/`), React + Vite + Tailwind + React Router (`client/`). TypeScript, ESM (`"type": "module"`) throughout. Shared domain string-unions (`Role`, `TaskStatus`, `Recurrence`, `TransactionType`, `GoalStatus`, `AuthUser`) live in `server/src/types/domain.ts` and a mirrored `client/src/types/domain.ts` — there is no shared package, so keep the two in sync. Server imports keep `.js` specifiers (NodeNext resolves them to `.ts`); client imports are extensionless (Vite/bundler resolution).

**Single data model, role-discriminated.** There is one `User` model with a `role` string of `"PARENT"` or `"CHILD"`. A child's `parentId` points to its parent (self-relation named `Family`). Nearly every authorization check is "does this child's `parentId` equal the requesting parent's id" — see the repeated `child.parentId !== req.user.id` guards in the route files. Tasks and transactions belong to children; status/type/recurrence are also stored as strings (documented in comments at the top of `server/prisma/schema.prisma`), not enums.

**Auth is cookie-based JWT.** Login sets an httpOnly `token` cookie (`server/src/routes/auth.ts`). `requireAuth` middleware verifies it and populates `req.user` (typed as `AuthUser` = `{ id, role, name, parentId }` via an Express `Request` augmentation in `server/src/types/express.d.ts`); `requireRole(...roles)` gates parent-only endpoints. Two login paths: parents use email+password (bcrypt); children use `childId`+4-digit `pin` (plaintext compare). The child login screen first calls the unauthenticated `GET /api/users/children-public?parentEmail=` to list a parent's children by name.

**Task lifecycle is a status machine:** `PENDING → COMPLETED` (child marks done) `→ APPROVED` or back to `PENDING` (parent approve/reject). Approval runs in a Prisma `$transaction`: it flips status, creates an `EARNED` transaction for the dollar amount, and — if recurring — spawns the next instance with a computed due date (`nextDueDate` in `server/src/routes/tasks.ts`). Recurring tasks chain via `templateId`/`instances`.

**Allowance balance is derived, never stored.** `GET /api/allowance/:childId` sums all of a child's transactions on the fly. Transactions are either `EARNED` (from approved tasks) or `ADJUSTMENT` (manual parent correction, can be negative).

**Routing mirrors roles.** `client/src/App.tsx` reads `useAuth()` and renders an entirely different route tree for `PARENT` vs `CHILD` (parent pages under `client/src/pages/parent/`, child pages under `client/src/pages/child/`). `useAuth()` returns `user` typed `AuthUser | null | undefined`: `undefined` means auth is still loading; `null` means logged out.

**Client/server wiring.** The axios instance (`client/src/api/client.ts`) uses baseURL `/api` with `withCredentials: true`. API response shapes are typed in `client/src/types/models.ts`. In dev, Vite proxies `/api` to `localhost:3001` (`client/vite.config.js`). In production the Express server serves the built client from `client/dist` and falls back to `index.html` for SPA routes — CORS is only enabled when `NODE_ENV !== 'production'`.

## Deployment

Railway (`railway.toml`), nixpacks builder. Build runs the client build and `prisma generate`; deploy runs `prisma migrate deploy` then starts the server. Production uses a SQLite file at `/data/prod.db` (set via `DATABASE_URL`). Required env vars: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV`, `PORT`.

## Design

**Visual decisions are documented in `docs/design/`.** Read those files
before building or restyling any UI — do not invent tokens, colors, or
component patterns.

- **`docs/design/DESIGN.md`** — source of truth. Color tokens, typography
  scale, radii, shadows, spacing, component contracts, per-screen specs,
  Tailwind config snippet. Read this in full at the start of any UI task.
- **`docs/design/MilkMoney Design Specs.html`** — rendered visual reference
  with annotated phone mockups. Useful for spot-checking layout; open in a
  browser, don't read the source.
- **`docs/design/assets/`** — source illustrations. Runtime copies are
  served from `client/public/images/` at `/images/<file>`.

**When working on UI:**

1. Cite the relevant DESIGN.md section in your plan (e.g. "Per §5 Screen 2
   and §4 Task card…"). If something isn't covered, ask before improvising.
2. Use Tailwind tokens (`bg-brand`, `text-money-600`, `rounded-xl`) — never
   raw hex or arbitrary pixel values. If you need a new token, add it to
   `tailwind.config.js` AND to DESIGN.md §1 in the same change.
3. Never use emoji glyphs as icons. Use the outline icon set (2px stroke).
4. Dollar amounts are always `money-600` and bold. Status badges always
   pair a `*-50` background with `*-600` text — never invert.
5. Keep DESIGN.md and the spec doc in sync when you make design changes.
   Updating one without the other creates drift.

## Android Build

The Android app is a Capacitor shell that loads the web app from the production Railway server (Server URL mode). No client code changes are needed — `npm run cap:sync` is sufficient after any Capacitor config change.

**Prerequisites (one-time, not needed for web development):**
- Android Studio (latest stable)
- JDK 17 (bundled with Android Studio, or install separately)
- Android SDK platform and build tools (installed via Android Studio's SDK Manager)

**Environment variable:**

| Variable | Value | When |
|---|---|---|
| `CAPACITOR_SERVER_URL` | `https://your-app.up.railway.app` | Production build (default) |
| `CAPACITOR_SERVER_URL` | `http://10.0.2.2:3001` | Android emulator → local server |

Update the default placeholder in `capacitor.config.ts` once the Railway URL is confirmed.

**Standard workflow:**

```bash
# After any capacitor.config.ts change:
npm run cap:sync          # copies config into android/, does NOT need a client build

# Open in Android Studio (to build APK or run on device/emulator):
npm run cap:open          # opens the android/ project in Android Studio

# Or build from the command line (requires Android Studio + SDK on PATH):
npm run cap:build         # npx cap build android
```

**Regenerating icons/splash after asset changes:**

Source images live in `assets/` at the repo root (`icon-only.png` 1024×1024, `splash.png` 2732×2732). After replacing them, regenerate Android assets:

```bash
npx @capacitor/assets generate --android
```

**Notes:**
- Android build outputs (`android/app/build/`, `android/.gradle/`) are gitignored.
- The `android/` Gradle project is committed to the repo; any developer with Android Studio can build without running `npx cap add android`.
- Web deployments to Railway automatically update what the Android app loads — no app store release needed for client-only changes.

## OpenSpec

This repo uses OpenSpec (`openspec/`, `schema: spec-driven`) for spec-driven change management. Use the `openspec-*` / `opsx:*` skills to propose, apply, and archive changes rather than editing `openspec/` files by hand.
