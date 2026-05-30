## Why

Now that MilkMoney runs as an installable Android app (Phase 1), the family loses nothing by closing the app — but they also miss the moments that matter: a kid doesn't know a chore was approved (and money credited), and a parent doesn't know a chore is waiting for approval. Push notifications close that loop, turning the app from a place you check into a system that reaches out at the right moment. This is the primary reason Phase 1 chose Capacitor over a TWA/browser shortcut.

## What Changes

- Add Firebase Cloud Messaging (FCM) as the push delivery channel for the Android app
- Add the `@capacitor/push-notifications` plugin; on app launch (when authenticated and running natively) the app requests notification permission, obtains an FCM token, and registers it with the server
- Add a `PushToken` model and a `POST /api/notifications/register` endpoint so one user can have multiple device tokens (phone + tablet)
- Send a push notification on the core chore lifecycle transitions:
  - **Parent assigns a new chore to a child** → notify the child
  - **Child marks a chore done** → notify the parent (approval needed)
  - **Parent approves a chore** → notify the child (earned amount)
  - **Parent rejects a chore** → notify the child (needs another look)
- The web build is unaffected: push registration is gated behind `Capacitor.isNativePlatform()` and silently no-ops in a browser

## Capabilities

### New Capabilities

- `push-notifications`: Device token registration and storage, plus server-side dispatch of push notifications to the right household member on chore lifecycle events. Covers the client permission/registration flow, the token model and endpoint, and the dispatch helper wired into the task routes.

### Modified Capabilities

_(none — the task lifecycle behavior is unchanged; notifications are an additive side effect. No existing spec's requirements change.)_

## Impact

- **New dependencies**: `@capacitor/push-notifications` (client/native), `firebase-admin` (server, for sending via FCM)
- **New database model**: `PushToken` (userId, token, platform, createdAt, lastUsedAt) — requires a Prisma migration
- **New server route**: `server/src/routes/notifications.ts` (`POST /api/notifications/register`); mounted in `server/src/index.ts`
- **New server lib**: a dispatch helper (e.g. `server/src/lib/push.ts`) called from the approve/reject/complete/create handlers in `server/src/routes/tasks.ts`
- **New config / secrets**: a Firebase service account credential for the server (env var) and `google-services.json` for the Android app
- **New env vars**: `FIREBASE_SERVICE_ACCOUNT` (or path), added to Railway and documented in `CLAUDE.md`
- **Android**: `google-services.json` added under `android/app/`; Gradle Google Services plugin wired in (handled by Capacitor plugin install + `cap sync`)
- **No change** to the auth/cookie model or the derived-balance logic
