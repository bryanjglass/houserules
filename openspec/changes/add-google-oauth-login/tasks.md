## 1. Schema & config

- [ ] 1.1 Add `googleId String? @unique` to the `User` model in `server/prisma/schema.prisma`, and update the model's leading comments to document it.
- [ ] 1.2 Generate the migration (`npm run db:migrate`) and confirm the column is nullable/backward-compatible.
- [ ] 1.3 Add `GOOGLE_CLIENT_ID` to `server/.env.example` with a placeholder and a brief comment.
- [ ] 1.4 Add `GOOGLE_CLIENT_ID` to the env table/section in `CLAUDE.md`, and note it must be set on Railway and locally.

## 2. Server route

- [ ] 2.1 Add `google-auth-library` to the `server` workspace dependencies.
- [ ] 2.2 In `server/src/routes/auth.ts`, add `POST /api/auth/google` guarded by `authLimiter`, reading the credential from the request body.
- [ ] 2.3 Verify the credential with `google-auth-library` (`verifyIdToken`, audience = `GOOGLE_CLIENT_ID`); respond `401` on missing/invalid/wrong-audience tokens.
- [ ] 2.4 Reject (`401`) when the verified payload reports `email_verified !== true`.
- [ ] 2.5 Resolve identity in order: by `googleId` → sign in; else by verified `email` → auto-link (store `sub` as `googleId`, leave `passwordHash` intact); else create a PARENT (`uniqueHouseholdCode()`, default timezone, name/email from payload, `passwordHash = null`).
- [ ] 2.6 On success set the `token` cookie via `signToken()` and respond with `{ id, name, role }`, matching the other login paths.

## 3. Design decision (blocks client UI)

- [ ] 3.1 Decide and add the "Sign in with Google" button spec to `docs/design/DESIGN.md` (§1 tokens + the login screen section): color treatment, divider/"or" treatment, and placement relative to the primary CTA. Keep `docs/design/MilkMoney Design Specs.html` in sync. (Per repo rules, do not invent tokens — confirm the design decision first.)

## 4. Client UI

- [ ] 4.1 Expose the Google client id to the client as a `VITE_`-prefixed env var and load the Google Identity Services SDK.
- [ ] 4.2 Add a `googleLogin(credential)` method to `client/src/context/AuthContext.tsx` that POSTs to `/auth/google` and updates auth state like the other login methods.
- [ ] 4.3 Render the "Sign in with Google" button in the `parent` and `register` modes of `client/src/pages/Login.tsx` (not in child mode), wire it to `googleLogin`, handle errors, and navigate into the app on success — per the DESIGN.md spec from task 3.1.

## 5. Verification

- [ ] 5.1 Run `npm run typecheck` across both workspaces and resolve any errors.
- [ ] 5.2 Manually verify the three paths: new-household creation, auto-link to an existing email+password parent, and repeat sign-in by `googleId`; confirm an `email_verified = false` credential is rejected.
- [ ] 5.3 Confirm child PIN login and existing parent password login are unchanged.
