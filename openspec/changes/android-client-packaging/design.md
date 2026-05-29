## Context

MilkMoney is a React + Vite SPA served by an Express server on Railway. The client already has a mobile-first layout (bottom tab bar, 44px touch targets, safe-area padding). The server uses cookie-based JWT auth with a two-cookie system: a short-lived `token` cookie (24h) and a long-lived `device` cookie (90d) that backs the `TrustedDevice` trusted-device flow.

The goal is to produce an Android APK that wraps the existing web app with minimal code change, enabling a proper installable experience (icon, splash, full-screen WebView) as the foundation for future native capabilities (push notifications, haptics).

## Goals / Non-Goals

**Goals:**
- Ship an installable Android APK that wraps the existing Railway-hosted web app
- Preserve the full `TrustedDevice` / device cookie flow (kitchen tablet one-tap login) with no auth changes
- Establish the Capacitor project structure in the repo for future native plugin work
- Add brand splash screen and icon

**Non-Goals:**
- iOS support (separate future effort)
- Push notifications (Phase 2)
- Offline support or local asset bundling
- Play Store submission (manual step outside this change)
- Any changes to the server, its CORS config, or cookie settings

## Decisions

### Decision 1: Server URL mode over local asset bundling

**Chosen**: Configure `capacitor.config.ts` with `server.url` pointing at the production Railway deployment.

**Rationale**: The app uses `httpOnly` cookies for auth. In standard Capacitor mode the WebView origin is `http://localhost` (Android) — a different origin from the Railway API. This creates two compounding problems: CORS must be extended to allow the mobile origin, and `sameSite: 'lax'` cookies are blocked on cross-origin requests (requiring `sameSite: 'none'` + `secure`, which `http://localhost` cannot satisfy). Server URL mode makes the WebView same-origin with the API, so both problems vanish without touching the server.

**Alternatives considered**:
- *Local assets + CORS patch*: Requires server changes (`sameSite: 'none'`), complicates the cookie security model, and adds ongoing maintenance surface. Rejected for Phase 1.
- *`@capacitor/http` native plugin*: Routes HTTP through the native layer, bypassing CORS. Requires rewriting the axios client. Rejected as disproportionate for Phase 1.
- *TWA (Trusted Web Activity)*: Zero code changes, but no path to native plugins (push notifications). Ruled out because Phase 2 requires FCM.

### Decision 2: `capacitor.config.ts` at repo root, `android/` committed to repo

**Rationale**: Capacitor's `npx cap add android` generates the `android/` Gradle project. Committing it means any developer with Android Studio can build the APK without running `cap add` themselves, and the project is source-controlled. Generated files that don't change (Gradle wrappers, boilerplate) are acceptable to commit.

### Decision 3: Splash screen and icon from existing brand assets

The design system (`docs/design/`) and `client/public/images/` contain the MilkMoney logo and color palette. These will be adapted to the required Android asset sizes using Capacitor's `@capacitor/assets` tool, which generates all required `mipmap-*` and `splash-*` densities from a single source image.

### Decision 4: `CAPACITOR_SERVER_URL` env var controls the target

The production Railway URL is not hardcoded in `capacitor.config.ts`. Instead, the config reads it from an environment variable at build time, defaulting to the production URL. This allows pointing a dev build at a local server for native plugin testing.

```
CAPACITOR_SERVER_URL=https://your-app.railway.app  (production default)
CAPACITOR_SERVER_URL=http://10.0.2.2:3001          (Android emulator → host)
```

## Risks / Trade-offs

**Always-online requirement** → The app requires network to load. Acceptable because the app already requires the server for all data operations; there is no meaningful offline mode to lose. Mitigation: Capacitor's WebView will show a standard "no connection" error if offline.

**Client deploys affect the app immediately** → A broken web deployment breaks the Android app with no release buffer. Mitigation: same discipline as today (test before Railway deploy). The upside is the same: hotfixes reach all clients instantly without an app store release.

**App icon / splash asset quality** → Source assets must be high enough resolution for `@capacitor/assets` to generate all densities without upscaling artifacts. Mitigation: verify source image dimensions during implementation; use SVG if raster is insufficient.

**`capacitor.config.ts` env var at build time** → The server URL is baked into the config when `cap sync` is run, not at APK runtime. This is standard Capacitor behavior. Mitigation: document the env var clearly in CLAUDE.md so future builds target the right server.

## Open Questions

- What is the final Railway production URL? Needed to set the default `CAPACITOR_SERVER_URL`. (Can be a placeholder until Railway deployment is confirmed; the config reads from env.)
- Should the `android/` directory use `.gitignore` to exclude build outputs (`android/app/build/`)? Yes — standard practice.
