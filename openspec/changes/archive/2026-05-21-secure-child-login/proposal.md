## Why

Child login is enumerable and brute-forceable. The unauthenticated `GET /api/users/children-public?parentEmail=` (`server/src/routes/users.js`) returns every child's name **and real `id`** for *any* valid parent email — and a parent's email is a low-entropy, frequently-known identifier, so anyone can list a family's children. Login then requires only that exposed `childId` plus a 4-digit PIN that is **stored in plaintext** (`server/src/routes/users.js`), **compared in plaintext** (`server/src/routes/auth.js`), and protected by **no rate limiting** — 10,000 guesses with no lockout. The fix must keep children from having to remember a password.

## What Changes

- **Replace the email lookup with a household code.** Each household (parent) gets a short, high-entropy, human-typable code (e.g. `BG7K2Q`). The child login screen asks for that code instead of a parent email; only a correct code reveals the household's children. The code is rotatable by the parent.
- **Hash PINs and stop storing them in plaintext.** PINs are stored as a hash (bcrypt) and verified by hash comparison. PINs remain 4 digits so kids' experience is unchanged.
- **Add per-child lockout / throttling.** Repeated wrong PINs lock that child's login for a cooldown window, defeating brute force even when the code and child are known.
- **Remember trusted devices (passwordless re-login).** After a successful child login, the device can be remembered: it stores a long-lived, server-issued device token. On a remembered device the child sees their household's remembered kids and logs in with a single tap — no code, no PIN. Parents can view and revoke remembered devices.
- **Remove the `parentEmail` enumeration path** entirely; existing parents are backfilled with a household code and existing plaintext PINs are migrated to hashes.

## Capabilities

### New Capabilities
- `child-authentication`: How children authenticate without a password — household-code-gated child lookup, hashed-PIN verification with lockout/throttling, trusted-device remembering with one-tap re-login, and parent-controlled device revocation and code rotation.

### Modified Capabilities
<!-- None. Parent email+password login is unchanged. -->

## Impact

- **Schema (Prisma, SQLite):** add `householdCode` (unique, on parents); store the PIN as a hash (replace plaintext `pin` with `pinHash`); add child lockout fields (`pinFailedAttempts`, `pinLockedUntil`); add a `TrustedDevice` model (hashed token, owning household, optional label, `lastUsedAt`, `expiresAt`) linked to the children remembered on it. Migration backfills codes for existing parents and re-hashes seed PINs.
- **API (`server/src/routes/auth.js`, `server/src/routes/users.js`):** `children-public` keyed by `householdCode` instead of `parentEmail`; child login branch takes `householdCode + childId + pin`, enforces lockout, and optionally issues a device token; new endpoints to list remembered children on the current device, do one-tap device login, rotate the household code, and list/revoke trusted devices.
- **Client (`client/`):** rework the child login screen (`client/src/pages/`) to the code → pick child → PIN flow with a "remember this device" option and a one-tap quick-login for remembered devices; a parent screen to view/rotate the household code and revoke trusted devices.
- **Specs:** new `child-authentication` capability spec.
- **Out of scope:** parent email/password login, account recovery/forgot-PIN flows.
