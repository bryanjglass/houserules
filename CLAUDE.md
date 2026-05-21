# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A family chore and allowance tracker. Parents create child accounts, assign tasks (one-off or recurring) with optional dollar amounts, and approve completed work — approval credits the child's allowance balance. Children log in with a PIN to see their tasks and balance.

## Commands

Run from the repo root (npm workspaces: `server`, `client`).

```bash
npm install                 # installs both workspaces
npm run dev                 # runs server (:3001) and client (:5173) concurrently
npm run db:migrate          # prisma migrate dev (creates/updates dev.db)
npm run db:seed             # seed demo data (see logins below)
npm run db:reset            # drop, re-migrate, re-seed
```

Single-workspace commands: `npm run <script> --workspace=server` or `--workspace=client`.
Client also has `build` and `preview`. There is no test suite or linter configured.

First-time setup: copy `server/.env.example` to `server/.env`, then `npm run db:migrate && npm run db:seed`.

Seed logins: parent `parent@example.com` / `password123`; children Alex (PIN `1234`) and Sam (PIN `5678`).

## Architecture

**Stack:** Express + Prisma + SQLite (`server/`), React + Vite + Tailwind + React Router (`client/`). Plain JavaScript, ESM (`"type": "module"`) throughout.

**Single data model, role-discriminated.** There is one `User` model with a `role` string of `"PARENT"` or `"CHILD"`. A child's `parentId` points to its parent (self-relation named `Family`). Nearly every authorization check is "does this child's `parentId` equal the requesting parent's id" — see the repeated `child.parentId !== req.user.id` guards in the route files. Tasks and transactions belong to children; status/type/recurrence are also stored as strings (documented in comments at the top of `server/prisma/schema.prisma`), not enums.

**Auth is cookie-based JWT.** Login sets an httpOnly `token` cookie (`server/src/routes/auth.js`). `requireAuth` middleware verifies it and populates `req.user` (`{ id, role, name, parentId }`); `requireRole(...roles)` gates parent-only endpoints. Two login paths: parents use email+password (bcrypt); children use `childId`+4-digit `pin` (plaintext compare). The child login screen first calls the unauthenticated `GET /api/users/children-public?parentEmail=` to list a parent's children by name.

**Task lifecycle is a status machine:** `PENDING → COMPLETED` (child marks done) `→ APPROVED` or back to `PENDING` (parent approve/reject). Approval runs in a Prisma `$transaction`: it flips status, creates an `EARNED` transaction for the dollar amount, and — if recurring — spawns the next instance with a computed due date (`nextDueDate` in `server/src/routes/tasks.js`). Recurring tasks chain via `templateId`/`instances`.

**Allowance balance is derived, never stored.** `GET /api/allowance/:childId` sums all of a child's transactions on the fly. Transactions are either `EARNED` (from approved tasks) or `ADJUSTMENT` (manual parent correction, can be negative).

**Routing mirrors roles.** `client/src/App.jsx` reads `useAuth()` and renders an entirely different route tree for `PARENT` vs `CHILD` (parent pages under `client/src/pages/parent/`, child pages under `client/src/pages/child/`). `user === undefined` means auth is still loading; `user === null` means logged out.

**Client/server wiring.** The axios instance (`client/src/api/client.js`) uses baseURL `/api` with `withCredentials: true`. In dev, Vite proxies `/api` to `localhost:3001` (`client/vite.config.js`). In production the Express server serves the built client from `client/dist` and falls back to `index.html` for SPA routes — CORS is only enabled when `NODE_ENV !== 'production'`.

## Deployment

Railway (`railway.toml`), nixpacks builder. Build runs the client build and `prisma generate`; deploy runs `prisma migrate deploy` then starts the server. Production uses a SQLite file at `/data/prod.db` (set via `DATABASE_URL`). Required env vars: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV`, `PORT`.

## OpenSpec

This repo uses OpenSpec (`openspec/`, `schema: spec-driven`) for spec-driven change management. Use the `openspec-*` / `opsx:*` skills to propose, apply, and archive changes rather than editing `openspec/` files by hand.
