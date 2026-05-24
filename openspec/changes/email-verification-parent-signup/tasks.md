## 1. Schema and migration

- [ ] 1.1 In `server/prisma/schema.prisma` (`User` model, ~line 14), add three nullable fields: `emailVerifiedAt` (datetime), `emailVerificationTokenHash` (string), `emailVerificationExpiresAt` (datetime). Note in the schema header comment that only the token hash is stored (mirroring `TrustedDevice.tokenHash`).
- [ ] 1.2 Run `npm run db:migrate` to create the migration; confirm `npm run db:reset` (migrate + seed) still succeeds with no email config.

## 2. Server: token + email plumbing

- [ ] 2.1 In `server/src/lib/codes.js`, add `generateEmailToken()` (256-bit random hex, like `generateDeviceToken()`); reuse the existing `hashToken()` for storage/lookup.
- [ ] 2.2 Add `nodemailer` to `server/package.json` dependencies and run `npm install`.
- [ ] 2.3 Create `server/src/lib/email.js`: lazily build a Nodemailer SMTP transport from `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`; if `SMTP_HOST` is unset, fall back to logging the link to the console. Export `sendVerificationEmail({ to, name, link })` with a plain-text + simple HTML body (no design-system UI).

## 3. Server: register, verify, resend

- [ ] 3.1 In `POST /api/auth/register` (`server/src/routes/auth.js:181`), after `prisma.user.create` and before responding: generate a token via `generateEmailToken()`, store `hashToken(token)` + `emailVerificationExpiresAt` (now + 24h) on the user, build the link `${CLIENT_URL}/verify-email?token=<raw>` (read `CLIENT_URL` as `index.js` does: `process.env.CLIENT_URL || 'http://localhost:5173'`), and call `sendVerificationEmail(...)` inside try/catch (`console.error` on failure). Keep setting the JWT cookie and the existing response unchanged.
- [ ] 3.2 Add `GET /api/auth/verify-email?token=...` (public, `authLimiter`): hash the token, find the user by `emailVerificationTokenHash`, reject if not found or `emailVerificationExpiresAt` is past; on success set `emailVerifiedAt` and null the two token fields. Redirect to `${CLIENT_URL}/verify-email?status=success`, or `?status=invalid` on bad/expired token.
- [ ] 3.3 Add `POST /api/auth/resend-verification` (`requireAuth`, `requireRole('PARENT')`, `authLimiter`): if already verified return `{ ok: true }` without sending; otherwise regenerate token + expiry, resend the email, return `{ ok: true }`.
- [ ] 3.4 In `GET /me` (`server/src/routes/auth.js:207`), add `emailVerifiedAt` to the `select`.

## 4. Server: config docs

- [ ] 4.1 In `server/.env.example`, add optional `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` with a comment "leave blank in dev to log verification links to the console". Do NOT add them to the required-env check in `index.js`.

## 5. Client

- [ ] 5.1 In `client/src/context/AuthContext.jsx`, add a `resendVerification()` helper that calls `POST /auth/resend-verification`, and expose it through the context value alongside `login`, `register`, etc. (`user.emailVerifiedAt` is already carried via `/me`.)
- [ ] 5.2 Create a verification banner component (e.g. `client/src/components/VerifyEmailBanner.jsx`) shown only when `user.role === 'PARENT'` and `user.emailVerifiedAt == null`: "verify your email" message + a "Resend" button (calls `resendVerification`, shows a sent/cooldown state). Use Tailwind tokens only per DESIGN.md; cite the relevant banner/alert section, or ask before improvising if none exists. Render it in `client/src/components/AppShell.jsx` (or atop `pages/parent/Dashboard.jsx`) so it appears across parent screens.
- [ ] 5.3 Create `client/src/pages/VerifyEmail.jsx`: read `?status=` from the URL and show a success or invalid/expired message with a link back to login/dashboard. Add a top-level `/verify-email` route in `client/src/App.jsx` that renders before the auth-based branching (so it isn't swallowed by the logged-out `*` → `/login` redirect or the parent/child route trees).

## 6. Verification (manual; no automated test suite in this repo)

- [ ] 6.1 `npm install` (picks up nodemailer) then `npm run db:migrate`; run `npm run dev`.
- [ ] 6.2 Register a new parent (Login screen, register mode) with no SMTP env set; confirm the verification link is logged to the server console and the parent is logged in (soft gate) with the banner showing.
- [ ] 6.3 Open the logged link → server redirects to `/verify-email?status=success` → page shows success; reload the app and confirm the banner is gone (`/me` returns `emailVerifiedAt`).
- [ ] 6.4 On a fresh unverified account, click "Resend" → a new link is logged; confirm the old link is now rejected as `status=invalid`, and that an expired link is also rejected.
- [ ] 6.5 (Optional) Set real `SMTP_*` env vars and confirm an actual email is delivered.
