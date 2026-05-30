## 1. Firebase / FCM Setup

- [ ] 1.1 Create a Firebase project and add an Android app with package name `com.milkmoney.app`  *(manual — requires Firebase account)*
- [ ] 1.2 Download `google-services.json` and place it under `android/app/` (decide commit vs build-time injection per design Open Question)  *(manual)*
- [ ] 1.3 Generate a Firebase service-account key (JSON) for the server  *(manual)*
- [ ] 1.4 Add `FIREBASE_SERVICE_ACCOUNT` to `server/.env.example`, local `server/.env`, and Railway env vars  *(manual)*

## 2. Database — PushToken model

- [x] 2.1 Add the `PushToken` model to `server/prisma/schema.prisma` (userId, token @unique, platform, createdAt, lastUsedAt, cascade delete, index on userId) and the back-relation on `User`
- [x] 2.2 Run `npm run db:migrate` to create the migration
- [x] 2.3 Add a top-of-schema comment documenting the `platform` values, consistent with existing schema comment style

## 3. Server — registration endpoint

- [x] 3.1 Create `server/src/routes/notifications.ts` with `POST /register` behind `requireAuth`; upsert on `token`, set userId/platform, refresh `lastUsedAt`, reassign owner if the token existed under another user
- [x] 3.2 Mount the route at `/api/notifications` in `server/src/index.ts`

## 4. Server — dispatch helper

- [x] 4.1 Add `firebase-admin` as a server dependency
- [x] 4.2 Create `server/src/lib/push.ts`: lazy-init `firebase-admin` from `FIREBASE_SERVICE_ACCOUNT`; export `notifyUser(userId, { title, body, data? })`
- [x] 4.3 No-op cleanly when the credential is unset (push disabled), logging once
- [x] 4.4 On send, prune `PushToken` rows that FCM reports as unregistered/invalid; retain valid siblings

## 5. Server — wire notifications into the task lifecycle

- [x] 5.1 In `POST /` (create), after a task is created with an assignee, notify the assigned child ("New chore: <title>")
- [x] 5.2 In `POST /:id/complete`, after commit, notify the parent (`createdById`) that the chore awaits approval
- [x] 5.3 In `POST /:id/approve`, after the transaction commits, notify the assigned child of approval + amount earned
- [x] 5.4 In `POST /:id/reject`, after commit, notify the assigned child that the chore needs another look
- [x] 5.5 Ensure every call site is fire-and-forget and skips when there is no concrete recipient

## 6. Client/native — permission and registration

- [x] 6.1 Install `@capacitor/push-notifications`
- [x] 6.2 Add a registration effect (in `AuthContext` or app shell) that runs only when `Capacitor.isNativePlatform()` and a user is authenticated: request permission, add `registration`/`registrationError` listeners
- [x] 6.3 On the `registration` event, `POST /api/notifications/register` with the token and `platform: "android"`
- [x] 6.4 Confirm the web build skips the entire flow (no permission prompt, no registration) and still type-checks

## 7. Build, docs, verification

- [x] 7.1 `npm run cap:sync` to wire the plugin and Google Services into the Android project
- [x] 7.2 `npm run typecheck` passes across both workspaces
- [x] 7.3 Update `CLAUDE.md`: document `FIREBASE_SERVICE_ACCOUNT`, `google-services.json`, and that push is Android-only and no-ops on web/when unconfigured
- [ ] 7.4 Manual: build the APK, log in on a device/emulator, approve a chore from another session, and confirm the notification arrives  *(manual — requires device + Firebase project)*
- [ ] 7.5 Manual: verify a dead/uninstalled token is pruned after a failed send  *(manual)*
