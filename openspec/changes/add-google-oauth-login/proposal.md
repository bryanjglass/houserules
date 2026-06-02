## Why

Parents can only sign in with an email and password today. A "Sign in with Google" option removes the friction of remembering one more password and the risk of weak ones, and lets a parent create a household in one tap. Children are unaffected — they use the household-code + PIN flow, which has no email.

## What Changes

- Add a **"Sign in with Google" button** to the parent login and register modes on the login screen (web only for v1).
- Add a new server route **`POST /api/auth/google`** that accepts a Google ID token credential, verifies it server-side, and signs the user in by setting the existing httpOnly `token` cookie via `signToken()` — identical to every other login path's end state.
- **Find-or-create / link** logic on that route:
  - Match by `googleId` → sign in.
  - Else match by verified Google `email` → **auto-link** the Google identity to the existing email+password parent (Google has verified the email).
  - Else **auto-create a new PARENT household** silently (generate a unique `householdCode`, `role = PARENT`, default timezone, `passwordHash = null`).
- **Reject** the credential when Google reports `email_verified = false`, so an unverified email can never auto-link to an existing account.
- **Schema:** add `googleId String? @unique` to the `User` model. (`passwordHash` is already nullable, so Google-only parents simply have no password.)
- **Config:** add a `GOOGLE_CLIENT_ID` env var, used by the server to verify the token audience and by the client to render the button. No client *secret* is needed with the token model.
- Reuse the existing `authLimiter` rate limiter on the new route.
- **DESIGN.md** has no "Sign in with Google" button spec yet; adding the token/placement spec is called out as a sub-task that needs a design decision before the UI is built.
- **Out of scope (v1):** native Google sign-in inside the Android Capacitor app. The GIS web flow is unreliable in embedded webviews; a native plugin is deferred to a follow-up change.

## Capabilities

### New Capabilities
- `parent-google-auth`: Parent sign-in and household creation via a verified Google ID token, including account auto-linking, unverified-email rejection, and silent new-household provisioning.

### Modified Capabilities
<!-- None. Existing email/password and child PIN auth behavior is unchanged; this adds a parallel parent login path. -->

## Impact

- **Schema/DB:** new nullable, unique `googleId` column on `User`; one Prisma migration.
- **Server:** `server/src/routes/auth.ts` (new `/google` route, reuse `signToken`, `uniqueHouseholdCode`, `authLimiter`, `COOKIE_OPTS`); new dependency `google-auth-library`; new env var `GOOGLE_CLIENT_ID` wired through `server/.env.example` and Railway.
- **Client:** `client/src/pages/Login.tsx` (Google button in parent + register modes), `client/src/context/AuthContext.tsx` (a `googleLogin` method), Google Identity Services script/SDK, `VITE`-exposed `GOOGLE_CLIENT_ID`.
- **Docs:** `docs/design/DESIGN.md` + the spec HTML need a button spec; `CLAUDE.md` env table gains `GOOGLE_CLIENT_ID`.
- **No impact:** child authentication, trusted devices, role routing, task/allowance logic.
