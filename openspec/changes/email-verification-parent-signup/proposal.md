## Why

Parents register via `POST /api/auth/register` (`server/src/routes/auth.js:181`), which immediately creates the account and logs them in. There is no email infrastructure in the app today — no sending library, no SMTP config, and the `User` model has no notion of a verified email. We want signup to send a welcome email containing a verification link and to track verification status, both to confirm parents own the address they signed up with and to lay the foundation we can build on later (eventually Google/Facebook/Apple SSO).

## What Changes

- **Send a welcome/verification email on parent registration.** After the account is created, generate a high-entropy verification token, store only its hash (plus a 24h expiry) on the user, and send a welcome email containing a verification link.
- **Add a provider-agnostic email transport.** A new email module builds a Nodemailer SMTP transport from env vars. When SMTP isn't configured (local dev, seed flow), it falls back to logging the verification link to the server console — zero-config dev.
- **Verify by clicking the link.** A public `GET /api/auth/verify-email?token=...` endpoint validates the token, marks the parent verified, clears the token, and redirects to a client landing page (`/verify-email?status=success` or `?status=invalid`).
- **Resend verification.** An authenticated `POST /api/auth/resend-verification` (parent only) reissues a token and resends the email; it's a no-op for already-verified accounts.
- **Soft gate, not hard gate.** The account is still created and logged in exactly as today. Unverified parents see a "please verify your email" banner across parent screens but are never blocked from using the app. `GET /me` exposes `emailVerifiedAt` so the client knows whether to show the banner.

## Capabilities

### New Capabilities
- `email-verification`: How a parent's email address is verified — a welcome email with a hashed, expiring verification link sent on signup, a public link-verification endpoint, an authenticated resend, and a soft (non-blocking) "verify your email" prompt driven by the account's verification status.

### Modified Capabilities
<!-- None. Parent registration/login behavior (account creation + immediate session) is unchanged; verification is layered on top. -->

## Impact

- **Schema (Prisma, SQLite):** add three nullable `User` fields — `emailVerifiedAt` (datetime), `emailVerificationTokenHash` (string), `emailVerificationExpiresAt` (datetime). Only the hash is stored, mirroring `TrustedDevice.tokenHash`. New migration; seed continues to work.
- **Server:** new `server/src/lib/email.js` (Nodemailer transport + `sendVerificationEmail`, console fallback); a `generateEmailToken()` helper in `server/src/lib/codes.js` reusing the existing `hashToken()`; `register` issues+sends the token (non-blocking on send failure); new `verify-email` and `resend-verification` endpoints; `GET /me` returns `emailVerifiedAt`. Adds `nodemailer` to `server/package.json`. New optional `SMTP_*` env vars documented in `server/.env.example` (not added to the required-env check).
- **Client:** `AuthContext` gains a `resendVerification()` helper; a new `VerifyEmailBanner` shown only to unverified parents (rendered in the app shell / parent screens); a new top-level `/verify-email` landing page/route reachable regardless of auth state.
- **Specs:** new `email-verification` capability spec.
- **Out of scope:** Google/Facebook/Apple SSO; hard-gating login on verification; password reset (the same token/email plumbing could be reused later, but is not built now).
