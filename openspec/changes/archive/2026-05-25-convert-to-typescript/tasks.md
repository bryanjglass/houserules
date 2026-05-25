## 1. Toolchain & base config

- [x] 1.1 Add `typescript` and `tsx` plus `@types/node` to the repo; add `@types/express`, `@types/cookie-parser`, `@types/cors`, `@types/jsonwebtoken`, `@types/bcryptjs` to the server workspace
- [x] 1.2 Create a shared base `tsconfig.base.json` at repo root with `strict: true`, `skipLibCheck: true`, `esModuleInterop`, `allowJs: true` (transitional)
- [x] 1.3 Add `server/tsconfig.json` (extends base, `module`/`moduleResolution` for NodeNext ESM) and `client/tsconfig.json` (extends base, `jsx: react-jsx`, `moduleResolution: bundler`, DOM libs)
- [x] 1.4 Add a repo-level `typecheck` script that runs `tsc --noEmit` in both workspaces; add per-workspace `typecheck` scripts; confirm it passes with sources still `.js`

## 2. Shared domain types

- [x] 2.1 Define string-literal unions (`Role`, `TaskStatus`, `TaskType`, `Recurrence`, `TransactionType`) and the `AuthUser`/JWT payload shape in a shared types module
- [x] 2.2 Make both server and client import these unions (decide single `shared/` module vs. mirrored file per design Open Questions); document the sync requirement if mirrored
- [x] 2.3 Add `server/src/types/express.d.ts` augmenting Express `Request` with `user?: AuthUser`

## 3. Server conversion (leaf-first)

- [x] 3.1 Convert `server/src/lib/` (`prisma.ts`, `balance.ts`, `codes.ts`) to TypeScript using Prisma-generated types
- [x] 3.2 Convert middleware: `auth.ts` (`requireAuth`), `requireRole.ts`, `rateLimit.ts` — type `req.user` via the augmentation
- [x] 3.3 Convert routes: `auth.ts`, `users.ts`, `tasks.ts`, `allowance.ts`, `goals.ts` — type request bodies/params and responses; narrow DB string fields to domain unions at boundaries
- [x] 3.4 Convert `server/src/index.ts` entry point
- [x] 3.5 Convert `server/prisma/seed.js` to `.ts`
- [x] 3.6 Update server scripts to use `tsx`: `dev` (`tsx watch src/index.ts`), `start` (`tsx src/index.ts`), `db:seed` (`tsx prisma/seed.ts`); move `tsx` to runtime `dependencies`
- [x] 3.7 Smoke test: parent email/password login, child PIN login, mark task complete, parent approve (verify EARNED transaction + recurring spawn), allowance balance

## 4. Client conversion (leaf-first)

- [x] 4.1 Convert `client/src/lib/money.ts` and `client/src/api/client.ts` (type the axios instance and response shapes)
- [x] 4.2 Convert `client/src/context/AuthContext.tsx`; type `useAuth()` as `User | null | undefined`
- [x] 4.3 Convert `client/src/components/*` to `.tsx` with typed props (Icons, BalanceDisplay, SavingsGoalCard, TaskCard, TopBar, BottomTabBar, AppShell, Brand, Thumb)
- [x] 4.4 Convert `client/src/pages/**` to `.tsx` (Login, Calendar, parent/*, child/*)
- [x] 4.5 Convert `client/src/App.tsx` and `client/src/main.tsx`
- [x] 4.6 Verify `vite build` succeeds and `npm run dev` (Vite proxy to :3001) works against the converted server

## 5. Finalize & gate

- [x] 5.1 Flip `allowJs: false` in the base config; confirm no `.js`/`.jsx` sources remain in `server/src/` or `client/src/`
- [x] 5.2 Run `npm run typecheck` repo-wide and resolve all errors until it exits clean
- [x] 5.3 Update `railway.toml` / nixpacks start command to `tsx src/index.ts`; smoke-test a Railway deploy (or document the verified deploy command)
- [x] 5.4 Update `CLAUDE.md`: TypeScript stack, new `typecheck` command, updated dev/start description
