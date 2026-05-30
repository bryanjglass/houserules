## Context

Phase 1 packaged the React/Vite client as an Android app via Capacitor in Server URL mode: the WebView loads the production Railway deployment, so it is same-origin with the API and the cookie-based auth (including the 90-day `TrustedDevice` flow) works unchanged. The server is Express + Prisma + SQLite. The task lifecycle (`PENDING → COMPLETED → APPROVED`/back to `PENDING`) lives in `server/src/routes/tasks.ts`, with approval running inside a Prisma `$transaction` that also writes the `EARNED` transaction.

This change adds push notifications on top of that shell. The hard parts are: choosing a delivery mechanism that works for a Capacitor WebView app, modeling multiple devices per user, and firing notifications from the existing route handlers without coupling the lifecycle logic to delivery.

## Goals / Non-Goals

**Goals:**
- Deliver native Android push notifications for the four core chore lifecycle events
- Support multiple devices per user (a parent's phone and the kitchen tablet)
- Keep the web build working with zero behavior change (push no-ops in a browser)
- Make notification dispatch best-effort and non-blocking — a push failure must never fail or roll back a task approval

**Non-Goals:**
- iOS / APNs support (no iOS app yet)
- Web Push for the browser build (possible later; out of scope here)
- Recurring "chore due soon" reminders (needs a scheduler/cron — separate change)
- In-app notification center / history (this is OS-level push only)
- User-configurable per-event notification preferences (could follow later)

## Decisions

### Decision 1: FCM via `firebase-admin` on the server

**Chosen**: Android app registers for FCM through `@capacitor/push-notifications`; the server sends through the `firebase-admin` SDK using a service-account credential.

**Rationale**: FCM is the standard, free push transport for Android and is what `@capacitor/push-notifications` targets out of the box. `firebase-admin` is the official server SDK and handles token-based send, batching, and invalid-token error reporting (needed for pruning — see Decision 4).

**Alternatives considered**:
- *OneSignal / Pusher Beams*: less server code, but adds a third-party account and SDK for a single-purpose need; FCM is already implied by Capacitor on Android.
- *Raw FCM HTTP v1 API with manual OAuth*: avoids the `firebase-admin` dependency but reimplements token minting and retry logic for no real benefit.

### Decision 2: `PushToken` is its own model, many-per-user

```prisma
model PushToken {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token      String   @unique
  platform   String   // "android" (room for "ios"/"web" later)
  createdAt  DateTime @default(now())
  lastUsedAt DateTime @default(now())

  @@index([userId])
}
```

**Rationale**: A user can have the app on several devices, each with its own FCM token. `token` is unique so re-registration is an upsert. `onDelete: Cascade` cleans up when a user is removed. Keeping it separate from `User` avoids bloating the single role-discriminated user row and mirrors how `TrustedDevice` is modeled.

**Registration semantics**: `POST /api/notifications/register` is authenticated (uses the existing `requireAuth`); it upserts on `token`, setting `userId`/`platform` and refreshing `lastUsedAt`. Re-registering an existing token that now belongs to a different user (shared tablet, different login) reassigns it to the current user — so notifications follow whoever is actually logged in.

### Decision 3: Dispatch helper, called fire-and-forget from route handlers

A `server/src/lib/push.ts` exposes something like `notifyUser(userId, { title, body, data })`. It loads the user's tokens, sends via `firebase-admin`, and prunes dead tokens. The task route handlers call it **after** the lifecycle transaction has committed, not inside it, and do not `await` it in a way that can fail the request.

**Rationale**: Notification delivery is a side effect, not part of the chore's correctness. Approval must still credit allowance even if FCM is down. Calling after commit also guarantees we never notify "approved" for a transaction that later rolls back.

**Event → recipient mapping**:

| Trigger (handler in tasks.ts) | Recipient | Message shape |
|---|---|---|
| `POST /` creates a task assigned to a child | the assigned child | "New chore: \<title\>" |
| `POST /:id/complete` (child marks done) | the parent (`createdById`) | "\<child\> finished \<title\>" |
| `POST /:id/approve` | the assigned child | "\<title\> approved — you earned \<amount\>" |
| `POST /:id/reject` | the assigned child | "\<title\> needs another look" |

Up-for-grabs and per-unit nuances: notify the assignee where one exists; skip when there is no concrete recipient (e.g. an open-pool definition row with no assignee).

### Decision 4: Prune invalid tokens on send failure

When `firebase-admin` reports a token as unregistered/invalid (`messaging/registration-token-not-registered`), the dispatch helper deletes that `PushToken` row. This keeps the table from accumulating dead tokens from uninstalled apps without a separate cleanup job.

### Decision 5: Client registration gated on native + authed

The registration flow runs only when `Capacitor.isNativePlatform()` is true and a user is logged in (so the token is tied to the right user). It lives in a small effect in the app shell / auth context: request permission → on grant, register listeners → on `registration` event, `POST /api/notifications/register`. In a browser, the whole block is skipped, so the web build is untouched.

## Risks / Trade-offs

**A push failure rolling back an approval** → Mitigation: dispatch is called after the `$transaction` commits and is fire-and-forget; errors are logged, never propagated to the response.

**Shared tablet sends notifications to the wrong child** → Mitigation: register-on-login reassigns the token to the current user, and the kitchen-tablet flow logs in as a specific child; the token's `userId` always reflects the last login. Trade-off: a brief window where a notification could reach the tablet for the previously-logged-in child until the next registration. Acceptable for v1.

**Secret management for the Firebase service account** → Mitigation: store as a Railway env var (JSON string), never commit it; document in `CLAUDE.md`. `google-services.json` (Android) is not secret in the same way but should still be reviewed before committing.

**Notification noise** → Four events is intentionally conservative. Per-event user preferences are deferred; if families find it noisy, that becomes the next change.

**SQLite write contention** → `PushToken` writes are low-frequency (register on login, prune on dead token). No meaningful added load.

## Migration Plan

1. Add `PushToken` model; run `prisma migrate dev` locally, `prisma migrate deploy` on Railway (already in the deploy step).
2. Set `FIREBASE_SERVICE_ACCOUNT` on Railway before deploying the server code that reads it; the dispatch helper should treat a missing credential as "push disabled" and no-op (so the web/server keep working pre-config).
3. Add `google-services.json`, install the Capacitor plugin, `cap sync`, rebuild the APK.
4. Rollback: dispatch helper no-ops without the credential; the `PushToken` table and endpoint are inert if unused. No lifecycle behavior depends on any of it.

## Open Questions

- Should the dispatch helper degrade silently when `FIREBASE_SERVICE_ACCOUNT` is unset (recommended, enables incremental rollout), or fail fast at boot? Leaning silent no-op.
- Do we want a tap-through deep link (notification opens the relevant task) in this phase, or just open the app? Proposed: open the app for v1; deep links later.
- Should `google-services.json` be committed or injected at build time? Needs a call on whether the repo is private enough to hold it.
