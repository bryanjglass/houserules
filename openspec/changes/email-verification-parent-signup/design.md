## Context

Auth is cookie-based JWT. The single `User` model is role-discriminated (`PARENT`/`CHILD`). Parents register at `POST /api/auth/register` (`server/src/routes/auth.js:181`) with name + email + bcrypt password; registration creates the user and immediately sets the `token` session cookie. There is no email infrastructure today: no sending library, no SMTP config, and no notion of a verified email on the model.

We want signup to send a welcome email with a verification link and to record whether the email has been verified — confirming address ownership and giving us a foundation to extend later (eventually external identity providers). Two project conventions shape the design: secrets are stored hashed, never raw (e.g. `TrustedDevice.tokenHash`, hashed PINs/passwords), and high-entropy tokens use a fast SHA-256 hash via the existing `hashToken()` in `server/src/lib/codes.js` (bcrypt is reserved for low-entropy secrets). Required env vars are validated in `index.js`; `CLIENT_URL` is read as `process.env.CLIENT_URL || 'http://localhost:5173'`.

## Goals / Non-Goals

**Goals:**
- A welcome email containing a verification link is sent when a parent registers.
- The app records whether a parent's email is verified, exposed to the client via `GET /me`.
- The verification token is stored hashed and expires; clicking the link verifies the account.
- Parents can resend the verification email.
- Local dev and the seed flow work with zero email config (link logged to console).
- Verification is a soft gate: it never blocks account creation, login, or app usage.

**Non-Goals:**
- Google/Facebook/Apple SSO (future work this lays groundwork for).
- Hard-gating login or any feature on verification status.
- Password reset / account recovery (could reuse this plumbing later, not built now).
- Designing a polished marketing email or applying the in-app design system to email bodies.

## Decisions

### Decision: Store a single hashed, expiring verification token on the user
Add three nullable fields to `User`: `emailVerifiedAt` (datetime, null until verified), `emailVerificationTokenHash` (string), and `emailVerificationExpiresAt` (datetime). On registration, generate a 256-bit token, store `hashToken(token)` and an expiry of now + 24h, and embed the **raw** token only in the emailed link. Verification hashes the incoming token, looks the user up by `emailVerificationTokenHash`, checks expiry, then sets `emailVerifiedAt` and nulls the two token fields.

- **Why:** mirrors `TrustedDevice.tokenHash` — never persist the raw secret. A single active token per user keeps it simple; a separate table isn't warranted for one token. Reusing the existing `hashToken()` (SHA-256) is correct here because the token is high-entropy, exactly the documented rationale in `codes.js`.
- **Alternative — separate `EmailVerification` table:** rejected as premature; one nullable token slot per user covers the need and matches how device tokens evolved (started simple).
- **Alternative — bcrypt the token:** unnecessary; bcrypt is for low-entropy secrets (PINs/passwords). A 256-bit token doesn't need slow hashing and SHA-256 keeps lookup a simple indexed query.

### Decision: Nodemailer + SMTP, with a console fallback when unconfigured
A new `server/src/lib/email.js` lazily builds a Nodemailer transport from `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`. If `SMTP_HOST` is unset, it falls back to a transport that logs the verification link to the console instead of sending. It exports `sendVerificationEmail({ to, name, link })` with a plain-text + simple HTML body.

- **Why:** provider-agnostic via env vars (no vendor lock-in), and the console fallback means local dev, the seed flow, and CI need zero email config. Email bodies are not in-app UI, so the design system / DESIGN.md does not apply.
- **Why optional env vars:** the `SMTP_*` vars are documented in `server/.env.example` but deliberately **not** added to the required-env check in `index.js` — the app must run without them (console fallback). Adding them as required would break local dev and deploys that don't send email.
- **Alternative — a hosted email API SDK (SendGrid/SES/etc.):** rejected for now; SMTP via Nodemailer is provider-agnostic and any of those can be pointed at via SMTP credentials without a code change.

### Decision: Soft gate — never block on verification
Registration still creates the user and sets the session cookie exactly as today; the email send is wrapped in try/catch and only `console.error`s on failure so signup always succeeds. Unverified parents are logged in and fully functional; the client shows a dismissible-style "verify your email" banner (rendered only when `user.role === 'PARENT'` and `user.emailVerifiedAt == null`) with a "Resend" action. `GET /me` adds `emailVerifiedAt` to its select so the client can decide whether to show the banner.

- **Why:** matches the confirmed product decision and avoids coupling a new, externally-dependent step (email delivery) to the critical signup path. A flaky SMTP provider must never lock parents out.
- **Alternative — hard gate (block until verified):** explicitly out of scope; would harm onboarding and create a hard dependency on email delivery.

### Decision: Verify via a public redirecting endpoint + a client landing route
`GET /api/auth/verify-email?token=...` is public (rate-limited with the existing `authLimiter`) and, after processing, **redirects** the browser to `${CLIENT_URL}/verify-email?status=success` (or `?status=invalid` for a bad/expired token). A new top-level client route `/verify-email` renders a landing page that reads `?status=` and shows success or invalid/expired messaging, with a link back to login/dashboard. This route is registered before the auth-based branching in `client/src/App.jsx` so it isn't swallowed by the logged-out `*` → `/login` redirect or the parent/child route trees.

- **Why:** the link is opened from an email in a plain browser, possibly on a different device while logged out, so the endpoint must be reachable pre-auth and a redirect to a friendly client page is the right UX (not a raw JSON response).
- **Resend** is `POST /api/auth/resend-verification` (`requireAuth`, `requireRole('PARENT')`, `authLimiter`): regenerate token + expiry, resend, return `{ ok: true }`; a no-op (still `{ ok: true }`) if already verified, so the UI needn't special-case it.

## Risks / Trade-offs

- **SMTP misconfiguration / delivery failure silently swallowed at signup.** → Intentional (soft gate): failures are `console.error`'d and the parent can use Resend. Operators get logs; the console fallback makes the dev/seed path observable.
- **Verification link leaks (forwarded email, shared screenshot).** → The token is single-use and expires in 24h; verifying nulls the token. Worst case is a third party marking the address verified — low impact under a soft gate, and the link is high-entropy so it can't be guessed.
- **Reissuing a token must invalidate the old one.** → Resend/register overwrite `emailVerificationTokenHash`, so only the latest link works; older links fail as `invalid`. Verification must look up strictly by the stored hash.
- **Token never expires if expiry not checked.** → `verify-email` rejects when `emailVerificationExpiresAt` is past, returning `status=invalid`.
- **Adding a dependency (`nodemailer`).** → Single, widely-used, well-maintained library; lazy transport construction keeps it inert when unconfigured.

## Open Questions

- Token lifetime: 24h default — acceptable, or longer (e.g. 72h) to be friendlier to parents who verify later? (Default: 24h.)
- Resend cooldown: rely on the existing `authLimiter` only, or add a client-side cooldown/disabled state on the button to discourage spamming? (Default: `authLimiter` + a simple client "sent" state.)
- Banner placement: render inside `client/src/components/AppShell.jsx` (appears across all parent screens) vs. atop `pages/parent/Dashboard.jsx` only. (Default: AppShell, pending confirmation that a shared shell wraps parent screens; cite DESIGN.md banner/alert styling when implementing, or ask if no banner pattern exists.)
