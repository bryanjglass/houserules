## Context

Parent authentication today is email + password (bcrypt), ending in a signed httpOnly `token` cookie produced by `signToken()` in `server/src/routes/auth.ts`. Children use a separate household-code + PIN path with trusted-device support. The `User` model already has a nullable `passwordHash`, a unique `email`, a unique `householdCode`, and a `role` discriminator. There is no shared package: server domain unions live in `server/src/types/domain.ts` and are mirrored in the client.

Google sign-in only applies to parents — children have no email. The objective is to add a parallel parent login path that produces the exact same `token` cookie, so nothing downstream (`requireAuth`, role routing, tasks, allowance) needs to change.

## Goals / Non-Goals

**Goals:**
- A parent can sign in or create a household with one Google tap on the web.
- Existing email+password parents are auto-linked by verified email, keeping both sign-in methods.
- The new path reuses the existing cookie/JWT, `signToken`, `uniqueHouseholdCode`, `COOKIE_OPTS`, and `authLimiter` — no new session machinery.
- Minimal schema change: one nullable, unique column.

**Non-Goals:**
- Native Google sign-in inside the Android Capacitor app (deferred; see Risks).
- Google sign-in for children.
- Replacing or deprecating email+password login.
- A full OAuth 2.0 authorization-code/redirect flow with a server-side client secret.

## Decisions

**1. Google Identity Services (token model), not the OAuth redirect flow.**
The client renders the GIS button, receives a Google ID token (a JWT "credential"), and POSTs it to `/api/auth/google`. The server verifies it with `google-auth-library`'s `OAuth2Client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })`. *Why:* this mirrors the existing "verify → `signToken` → set cookie" shape exactly, needs no session store, no callback URLs per environment, and no client secret. *Alternative considered:* `passport-google-oauth20` redirect flow — rejected as heavier (callback URL management, session/serialization, a client secret) for no benefit here.

**2. Identity resolution order: `googleId` → verified `email` → create.**
Look up by `googleId` first (the stable Google subject). If none, look up by the credential's verified `email` and auto-link (store `sub` as `googleId`). If still none, create a new PARENT household. *Why:* `sub` is the durable identifier (email can change); email match is the linking bridge for parents who originally registered with a password. *Alternative considered:* requiring a password to confirm before linking — rejected per the product decision to trust Google's email verification (auto-link).

**3. Hard requirement: `email_verified === true`.**
Both linking and creation are gated on the credential's `email_verified` claim. *Why:* auto-linking on an unverified email would reopen an account-takeover path. An unverified credential is rejected with `401`.

**4. Schema: add `googleId String? @unique` only.**
`passwordHash` is already nullable, so Google-only parents have no password and need no schema change there. *Why:* smallest viable delta; the unique constraint also guarantees one account per Google subject.

**5. `GOOGLE_CLIENT_ID` is the only new config, shared by both sides.**
Server uses it as the verification audience; client uses it to initialize the GIS button (exposed as a `VITE_`-prefixed var). No client secret exists in the token model. Added to `server/.env.example`, the `CLAUDE.md` env table, and Railway.

**6. New-household provisioning matches the password-register path.**
Reuse `uniqueHouseholdCode()`, set `role = PARENT`, default timezone, name/email from the credential. Keeps Google-created and password-created households structurally identical.

## Risks / Trade-offs

- **Android Capacitor webview breaks GIS** → Google blocks OAuth in embedded webviews, so the button may render but fail to complete inside the Capacitor shell. *Mitigation:* explicitly scope v1 to web; defer native sign-in (e.g. a Capacitor Google-auth plugin with its own OAuth client IDs) to a follow-up change. Document the limitation.
- **Auto-link trusts Google's `email_verified`** → if that claim were ever spoofed, an account could be linked wrongly. *Mitigation:* the claim only carries weight because the whole credential is cryptographically verified against `GOOGLE_CLIENT_ID` via `google-auth-library`; we reject anything not verified by Google.
- **`GOOGLE_CLIENT_ID` missing/misconfigured** → verification fails for everyone. *Mitigation:* document required env var; the password path is unaffected, so this degrades gracefully to "Google button doesn't work" rather than locking parents out.
- **Domain-union drift** → if any new shared type is introduced it must be mirrored client/server. *Mitigation:* this change adds no new domain union (Google is an implementation detail of one route), so no mirroring is required.

## Migration Plan

1. Add `googleId String? @unique` to `User`; run `prisma migrate dev` locally, `prisma migrate deploy` on Railway (already in the deploy step). The column is nullable, so the migration is backward-compatible with all existing rows.
2. Add `GOOGLE_CLIENT_ID` to Railway env and local `server/.env`; ship `.env.example` update.
3. Ship server route, then client button.
4. **Rollback:** the feature is additive — removing the button and route leaves email/password login fully functional; the nullable column can stay harmlessly.

## Open Questions

- **DESIGN.md button spec (needs a design decision before the UI is built):** there is no "Sign in with Google" token/placement in `docs/design/DESIGN.md`. We must either add the button spec (color tokens, divider treatment, placement relative to the primary CTA) to DESIGN.md §1 and the relevant screen section, or get an explicit decision on its visual treatment. Per repo rules we cannot invent tokens. Tracked as a task that blocks the client UI work.
