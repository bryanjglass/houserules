## Context

Auth is cookie-based JWT. The single `User` model is role-discriminated (`PARENT`/`CHILD`), a child's `parentId` points to its parent, and child login today is `childId + pin` against a plaintext `pin` column, with the child list fetched from an unauthenticated `GET /api/users/children-public?parentEmail=`. Parents log in with email + bcrypt password; that path is fine and is **not** changing.

Three weaknesses compound: (1) the parent email is a public-ish key that enumerates a family's children and leaks real `childId`s; (2) the PIN is plaintext at rest and in transit-compare; (3) there is no throttling, so the 4-digit space is trivially brute-forced once a `childId` is known. The constraint is to fix all three **without** giving children a password to memorize.

## Goals / Non-Goals

**Goals:**
- The child list is only obtainable with a high-entropy, parent-controlled secret, not the parent's email.
- PINs are never stored or compared in plaintext.
- Brute-forcing a known child's PIN is throttled/locked out.
- A child can log in on a previously-trusted device with no code and no PIN (one tap).
- Parents can rotate the household code and revoke trusted devices.

**Non-Goals:**
- Changing parent email/password login.
- A forgot-PIN / account-recovery flow (parent can already reset a child's PIN via the existing update endpoint).
- Multi-factor auth, biometric login, or external identity providers.
- Replacing the JWT session mechanism; trusted-device tokens *feed into* the existing session, they don't replace it.

## Decisions

### Decision: Gate the child list behind a per-household code, not the parent email
Add a `householdCode` to each parent: a short, high-entropy string drawn from an unambiguous alphabet (Crockford-style base32, excluding `0/O/1/I/L`), ~6 characters. `GET /api/users/children-public` takes `householdCode` instead of `parentEmail` and returns `{ id, name }` only on an exact match (404 otherwise, with a generic message). The parent can rotate the code, which immediately invalidates the old one.

- **Why:** the email is knowable/guessable and doubles as the parent's login id; a dedicated random code decouples "who the parent is" from "the key that lists the kids," and rotation gives a recovery lever if the code leaks.
- **Alternative — keep email but require the parent to be logged in:** rejected; the child logs in on their own device where no parent session exists, so the lookup must be reachable pre-auth.
- **Alternative — no public list; child types their own name:** rejected; name typing is error-prone for young kids and names still enumerate. The pick-from-list UX is the point.

### Decision: Store PINs hashed; keep the 4-digit UX
Replace the plaintext `pin` column with `pinHash` (bcrypt, as parents already use). Child-create/update hash before persisting; login compares with `bcrypt.compare`. PIN stays 4 digits so nothing changes for the child.

- **Why:** a leaked DB should not expose usable PINs.
- **Note:** bcrypt over a 4-digit space is not itself a brute-force defense (10k hashes is cheap) — lockout (below) is what actually stops guessing. Hashing is for at-rest protection.

### Decision: Per-child lockout to defeat PIN brute force
Track `pinFailedAttempts` and `pinLockedUntil` on the child. After N consecutive failures (e.g. 5) lock that child's PIN login for a cooldown (e.g. 15 min); a correct PIN resets the counter. While locked, login returns a clear "locked, try later" error without revealing the PIN.

- **Why:** the 4-digit space is small; throttling, not hashing, is the real defense. Per-child state keeps it simple (no extra table, no IP plumbing) and matches the threat (guessing one kid's PIN).
- **Alternative — IP/global rate limit:** complementary but weaker alone (NAT, rotating IPs) and needs middleware; per-child lockout is the minimum that directly addresses the threat. Household-code lookups should also be loosely throttled to discourage code-guessing, but the code's entropy is the primary defense there.

### Decision: Trusted devices via a long-lived server-issued token, separate from the session
Add a `TrustedDevice` model: `{ id, tokenHash, parentId (owning household), label?, createdAt, lastUsedAt, expiresAt }`, related many-to-many to the child `User`s remembered on that device. On a successful child login with "remember this device" checked, the server mints a random opaque device token, stores its hash, links the child, and sets it in a long-lived httpOnly cookie (e.g. 90-day expiry, separate from the 24h `token` session cookie). 

Re-login flow on a remembered device:
1. Client sends the device cookie to `GET /api/auth/remembered` → server validates the token, returns the list of remembered children `{ id, name }` for that device (and refreshes `lastUsedAt`).
2. Child taps their avatar → `POST /api/auth/device-login { childId }` with the device cookie → server verifies the child is linked to that valid device and issues the normal 24h session cookie. **No PIN.**

Parents get `GET /api/auth/devices` (list trusted devices with label + last-used) and `DELETE /api/auth/devices/:id` to revoke; rotating the household code does **not** revoke devices (already-trusted devices stay trusted). A device token is single-secret and hashed at rest, mirroring how PIN/password hashing is handled.

- **Why a separate token, not a longer session:** the session must stay short (24h) for least privilege; the device token is a *re-authentication* credential that lets the child mint a fresh session by tapping, so a stolen 24h cookie still expires fast.
- **Why household-scoped with linked children:** siblings share a tablet; one trusted device should let each opted-in sibling one-tap in, without re-entering the code per child.
- **Alternative — just extend the JWT to 90 days:** rejected; long-lived bearer sessions can't be revoked server-side and over-privilege a possibly-shared family device.

### Decision: Migrate existing data in the same change
A Prisma migration adds the columns/model and backfills: generate a unique `householdCode` for every existing parent, and hash existing plaintext PINs into `pinHash`. The seed (`server/prisma/seed`) is updated to set codes and hashed PINs, so `npm run db:reset` continues to work; seed output documents each family's code alongside the existing demo logins.

- **Why in-change:** the column rename and hashing would otherwise break existing rows and the seed.

## Risks / Trade-offs

- **Household code leaks (written down, shared in a screenshot).** → It only exposes names + the *gated* ability to attempt PINs (still hashed + locked out), not balances or tasks; parent can rotate the code instantly. Code lookups are loosely throttled to discourage guessing.
- **Lockout becomes a self-inflicted DoS** (kid fat-fingers and locks out). → Short cooldown (~15 min), clear messaging, and the parent can reset the PIN (which clears the lock) at any time.
- **Shared/family device is lost or handed on** while trusted. → Device tokens expire (≈90 days), refresh `lastUsedAt` so stale devices age out, and the parent can revoke any device explicitly; tokens are hashed at rest.
- **PIN-hash migration must not strand existing rows.** → Migration backfills `pinHash` from current plaintext and seed is updated; dev path is `db:reset`. Verify no code path still reads the old plaintext column.
- **Two cookies (session + device) interacting.** → Keep responsibilities crisp: device cookie only feeds `remembered`/`device-login`; everything else uses the existing `token` session. Both httpOnly, `secure` in production, `sameSite=lax` like the current cookie.

## Open Questions

- Code length/alphabet: is 6 Crockford-base32 chars (~1B combos) the right balance of typability vs. entropy, or go to 8? (Default: 6, with loose lookup throttling.)
- Lockout thresholds: 5 attempts / 15-minute cooldown — acceptable defaults? (Default: yes, configurable constant.)
- Device token lifetime: 90 days with sliding refresh on use, or fixed? (Default: 90-day expiry, refresh `lastUsedAt` but not expiry.)
- Should rotating the household code optionally also revoke all trusted devices (panic button), or stay independent? (Default: independent; offer "revoke all devices" separately.)
