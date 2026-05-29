## Why

MilkMoney is used at kitchen tablets shared by the whole household and on personal phones by older kids and parents. Packaging the client as a native Android app enables push notifications (Phase 2) and provides a proper installable experience — app icon, splash screen, full-screen WebView with no browser chrome — that a browser shortcut cannot offer.

## What Changes

- Add Capacitor to the project, configured in **Server URL mode**: the Android WebView loads directly from the production Railway deployment rather than bundling local assets
- Add `capacitor.config.ts` at the repo root pointing at the production server URL
- Add `android/` project directory (committed to the repo)
- Add root-level npm scripts: `cap:sync`, `cap:build`, `cap:open`
- Add splash screen and app icon using existing MilkMoney brand assets
- Set Android package name to `com.milkmoney.app`, display name "MilkMoney"
- Update `CLAUDE.md` with Android build prerequisites and workflow

## Capabilities

### New Capabilities

- `android-app-shell`: Capacitor project configuration and Android shell that wraps the existing web app — app identity, permissions, WebView settings, splash screen, icon assets, and build scripts

### Modified Capabilities

_(none — server auth, CORS, and cookie config are unchanged; web experience is unchanged)_

## Impact

- **New dependencies**: `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` (dev/build tooling)
- **New files**: `capacitor.config.ts`, `android/` directory, icon and splash assets under `android/`
- **No server changes**: Server URL mode means the WebView is same-origin with the API — no CORS or cookie config modifications required
- **No client code changes**: The existing Vite build is untouched; Capacitor wraps it without modification
- **Build prerequisite**: Android Studio + JDK 17 required on any machine building the APK; not required for normal web development
