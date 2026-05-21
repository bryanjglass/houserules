## 1. Schema and data migration

- [x] 1.1 In `server/prisma/schema.prisma`, add `householdCode` (unique, nullable for non-parents) to `User`; replace plaintext `pin` with `pinHash`; add `pinFailedAttempts` (int, default 0) and `pinLockedUntil` (datetime, nullable) to `User`.
- [x] 1.2 Add a `TrustedDevice` model (`id`, `tokenHash` unique, `parentId` → owning parent, `label` optional, `createdAt`, `lastUsedAt`, `expiresAt`) with a many-to-many relation to the child `User`s remembered on it. Document new string/relation conventions in the schema header comment.
- [x] 1.3 Create the Prisma migration; in it (or a one-time backfill) generate a unique `householdCode` for every existing parent and populate `pinHash` from existing plaintext PINs.
- [x] 1.4 Update `server/prisma/seed` to set a household code per demo parent and store hashed PINs; print each family's code with the existing demo logins. Confirm `npm run db:reset` succeeds.

## 2. Server: household-code child lookup

- [x] 2.1 Add a `generateHouseholdCode()` helper (unambiguous Crockford-style base32, ~6 chars) and use it on parent registration in `server/src/routes/auth.js`.
- [x] 2.2 Change `GET /api/users/children-public` in `server/src/routes/users.js` to take `householdCode` instead of `parentEmail`, returning `{ id, name }` only on exact match (generic 404 otherwise); remove the email-based path. Apply loose throttling to discourage code guessing.
- [x] 2.3 Add `GET /api/users/household-code` (parent, auth) to read the current code and `POST /api/users/household-code/rotate` (parent, auth) to regenerate it.

## 3. Server: hashed PIN + lockout

- [x] 3.1 Hash the PIN with bcrypt on child create and update in `server/src/routes/users.js`; store to `pinHash`. Keep the 4-digit validation.
- [x] 3.2 In the child login branch of `POST /api/auth/login` (`server/src/routes/auth.js`), accept `householdCode + childId + pin`; verify the code resolves to the child's parent, then `bcrypt.compare` the PIN.
- [x] 3.3 Enforce lockout: increment `pinFailedAttempts` on wrong PIN, lock via `pinLockedUntil` after the threshold (constant, e.g. 5) for a cooldown (e.g. 15 min); reset the counter on success; return a clear "locked, try later" error while locked. Resetting a child's PIN clears the lock.

## 4. Server: trusted devices

- [x] 4.1 On successful child login with `rememberDevice` true, mint a random device token, store its hash in a `TrustedDevice` (creating or reusing the device for that household), link the child, and set a long-lived httpOnly device cookie (≈90-day expiry) alongside the normal session cookie.
- [x] 4.2 Add `GET /api/auth/remembered`: validate the device cookie, refresh `lastUsedAt`, and return the remembered children `{ id, name }` for that device (empty/none if no valid cookie).
- [x] 4.3 Add `POST /api/auth/device-login { childId }`: verify the child is linked to the valid device from the cookie and issue the normal session cookie — no PIN.
- [x] 4.4 Add `GET /api/auth/devices` (parent) listing trusted devices (label, `lastUsedAt`, remembered children) and `DELETE /api/auth/devices/:id` (parent) to revoke; scope both to the parent's household.

## 5. Client: child login flow

- [x] 5.1 On the child login screen (`client/src/pages/`), on load call `GET /api/auth/remembered`; if it returns children, show one-tap avatar quick-login that calls `device-login` (no code/PIN).
- [x] 5.2 Implement the full flow for unremembered devices: enter household code → fetch & pick child → enter PIN; surface "wrong PIN" and "locked, try later" states clearly.
- [x] 5.3 Add a "remember this device" option that sets `rememberDevice` on login. Update the login API call(s) in `client/src/api/` accordingly.

## 6. Client: parent management

- [x] 6.1 Add a parent screen (or section) to view and rotate the household code, with copy-to-share affordance.
- [x] 6.2 Add a trusted-devices list with last-used info and a revoke action; wire to `GET/DELETE /api/auth/devices`.

## 7. Verification

- [x] 7.1 Confirm `GET /api/users/children-public?parentEmail=` no longer works and a wrong household code returns a generic 404; a correct code lists only that household's children.
- [x] 7.2 As a child, log in with code + PIN; enter a wrong PIN past the threshold and confirm lockout, then confirm a parent PIN reset clears it.
- [x] 7.3 Check the database/seed to confirm PINs are stored hashed, not plaintext.
- [x] 7.4 Log in with "remember this device", reload the login screen, and confirm one-tap login works without code or PIN; confirm a sibling can also be remembered on the same device.
- [x] 7.5 As the parent, rotate the household code (old code stops working) and revoke a trusted device (its one-tap login stops working, falling back to code + PIN).
