## 1. Firebase / FCM Setup

- [ ] 1.1 Create a Firebase project and add an Android app with package name `com.milkmoney.app`
- [ ] 1.2 Download `google-services.json` and place it under `android/app/` (decide commit vs build-time injection per design Open Question)
- [ ] 1.3 Generate a Firebase service-account key (JSON) for the server
- [ ] 1.4 Add `FIREBASE_SERVICE_ACCOUNT` to `server/.env.example`, local `server/.env`, and Railway env vars

## 2. Database — PushToken model

- [ ] 2.1 Add the `PushToken` model to `server/prisma/schema.prisma` (userId, token @unique, platform, createdAt, lastUsedAt, cascade delete, index on userId) and the back-relation on `User`
- [ ] 2.2 Run `npm run db:migrate` to create the migration
- [ ] 2.3 Add a top-of-schema comment documenting the `platform` values, consistent with existing schema comment style

## 3. Server — registration endpoint

- [ ] 3.1 Create `server/src/routes/notifications.ts` with `POST /register` behind `requireAuth`; upsert on `token`, set userId/platform, refresh `lastUsedAt`, reassign owner if the token existed under another user
- [ ] 3.2 Mount the route at `/api/notifications` in `server/src/index.ts`

## 4. Server — dispatch helper

- [ ] 4.1 Add `firebase-admin` as a server dependency
- [ ] 4.2 Create `server/src/lib/push.ts`: lazy-init `firebase-admin` from `FIREBASE_SERVICE_ACCOUNT`; export `notifyUser(userId, { title, body, data? })`
- [ ] 4.3 No-op cleanly when the credential is unset (push disabled), logging once
- [ ] 4.4 On send, prune `PushToken` rows that FCM reports as unregistered/invalid; retain valid siblings

## 5. Server — wire notifications into the task lifecycle

- [ ] 5.1 In `POST /` (create), after a task is created with an assignee, notify the assigned child ("New chore: <title>")
- [ ] 5.2 In `POST /:id/complete`, after commit, notify the parent (`createdById`) that the chore awaits approval
- [ ] 5.3 In `POST /:id/approve`, after the transaction commits, notify the assigned child of approval + amount earned
- [ ] 5.4 In `POST /:id/reject`, after commit, notify the assigned child that the chore needs another look
- [ ] 5.5 Ensure every call site is fire-and-forget and skips when there is no concrete recipient

## 6. Client/native — permission and registration

- [ ] 6.1 Install `@capacitor/push-notifications`
- [ ] 6.2 Add a registration effect (in `AuthContext` or app shell) that runs only when `Capacitor.isNativePlatform()` and a user is authenticated: request permission, add `registration`/`registrationError` listeners
- [ ] 6.3 On the `registration` event, `POST /api/notifications/register` with the token and `platform: "android"`
- [ ] 6.4 Confirm the web build skips the entire flow (no permission prompt, no registration) and still type-checks

## 7. Build, docs, verification

- [ ] 7.1 `npm run cap:sync` to wire the plugin and Google Services into the Android project
- [ ] 7.2 `npm run typecheck` passes across both workspaces
- [ ] 7.3 Update `CLAUDE.md`: document `FIREBASE_SERVICE_ACCOUNT`, `google-services.json`, and that push is Android-only and no-ops on web/when unconfigured
- [ ] 7.4 Manual: build the APK, log in on a device/emulator, approve a chore from another session, and confirm the notification arrives  *(manual — requires device + Firebase project)*
- [ ] 7.5 Manual: verify a dead/uninstalled token is pruned after a failed send  *(manual)*
