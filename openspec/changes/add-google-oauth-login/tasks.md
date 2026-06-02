## 1. Schema & config

- [x] 1.1 Add `googleId String? @unique` to the `User` model in `server/prisma/schema.prisma`, and update the model's leading comments to document it.
- [x] 1.2 Generate the migration (`npm run db:migrate`) and confirm the column is nullable/backward-compatible.
- [x] 1.3 Add `GOOGLE_CLIENT_ID` to `server/.env.example` with a placeholder and a brief comment.
- [x] 1.4 Add `GOOGLE_CLIENT_ID` to the env table/section in `CLAUDE.md`, and note it must be set on Railway and locally.

## 2. Server route

- [x] 2.1 Add `google-auth-library` to the `server` workspace dependencies.
- [x] 2.2 In `server/src/routes/auth.ts`, add `POST /api/auth/google` guarded by `authLimiter`, reading the credential from the request body.
- [x] 2.3 Verify the credential with `google-auth-library` (`verifyIdToken`, audience = `GOOGLE_CLIENT_ID`); respond `401` on missing/invalid/wrong-audience tokens.
- [x] 2.4 Reject (`401`) when the verified payload reports `email_verified !== true`.
- [x] 2.5 Resolve identity in order: by `googleId` → sign in; else by verified `email` → auto-link (store `sub` as `googleId`, leave `passwordHash` intact); else create a PARENT (`uniqueHouseholdCode()`, default timezone, name/email from payload, `passwordHash = null`).
- [x] 2.6 On success set the `token` cookie via `signToken()` and respond with `{ id, name, role }`, matching the other login paths.

## 3. Design decision (blocks client UI)

- [x] 3.1 Decide and add the "Sign in with Google" button spec to `docs/design/DESIGN.md` (§1 tokens + the login screen section): color treatment, divider/"or" treatment, and placement relative to the primary CTA. Keep `docs/design/MilkMoney Design Specs.html` in sync. (Per repo rules, do not invent tokens — confirm the design decision first.) → Decision: official Google GIS button, below the stack, "or" divider on the `line` token; spec added to DESIGN.md §4/§5 and mirrored in `spec/screens.jsx` + `spec/spec-app.jsx`.

## 4. Client UI

- [x] 4.1 Expose the Google client id to the client as a `VITE_`-prefixed env var and load the Google Identity Services SDK.
- [x] 4.2 Add a `googleLogin(credential)` method to `client/src/context/AuthContext.tsx` that POSTs to `/auth/google` and updates auth state like the other login methods.
- [x] 4.3 Render the "Sign in with Google" button in the `parent` and `register` modes of `client/src/pages/Login.tsx` (not in child mode), wire it to `googleLogin`, handle errors, and navigate into the app on success — per the DESIGN.md spec from task 3.1.

## 5. Verification

- [x] 5.1 Run `npm run typecheck` across both workspaces and resolve any errors.
- [~] 5.2 Manually verify the three paths: new-household creation, auto-link to an existing email+password parent, and repeat sign-in by `googleId`; confirm an `email_verified = false` credential is rejected. → Error paths verified at runtime: unconfigured → 503, missing credential → 401, invalid token → 401. Happy paths + the `email_verified=false` rejection require a real `GOOGLE_CLIENT_ID` and Google account (cannot be exercised in this sandbox); needs manual verification in a configured environment.
- [x] 5.3 Confirm child PIN login and existing parent password login are unchanged. → Parent password login returns 200 against seed data; child PIN code paths untouched; both workspaces typecheck and the client builds.
