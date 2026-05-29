## ADDED Requirements

### Requirement: Capacitor project is initialized at the repo root
The repo SHALL contain a valid Capacitor project: `capacitor.config.ts` at the root and an `android/` Gradle project directory committed to version control.

#### Scenario: Fresh clone can open Android project
- **WHEN** a developer clones the repo and runs `npm install` followed by `npx cap sync android`
- **THEN** the Android project is ready to open in Android Studio without running `npx cap add android`

#### Scenario: Cap sync updates the Android project
- **WHEN** a developer runs `npm run cap:sync`
- **THEN** Capacitor copies the latest Capacitor runtime into `android/` without error

---

### Requirement: App loads from the production Railway server URL
The Capacitor WebView SHALL be configured in Server URL mode, loading from the URL specified by the `CAPACITOR_SERVER_URL` environment variable at build/sync time.

#### Scenario: WebView loads production app
- **WHEN** the APK is built with the default `CAPACITOR_SERVER_URL`
- **THEN** opening the app on an Android device loads the MilkMoney web app from the production Railway deployment

#### Scenario: Dev build can target local server
- **WHEN** a developer sets `CAPACITOR_SERVER_URL=http://10.0.2.2:3001` before running `cap sync`
- **THEN** the Android emulator WebView connects to the developer's local Express server

---

### Requirement: Auth cookies persist between app sessions
The Android WebView's cookie storage SHALL persist across app close and reopen, preserving both the `token` and `device` cookies set by the server.

#### Scenario: Remembered child can log in without PIN after app restart
- **WHEN** a child completes full login with `rememberDevice: true` in one app session, closes the app, and reopens it
- **THEN** `GET /auth/remembered` returns the child's name and the child can log in via `POST /auth/device-login` without re-entering their PIN

---

### Requirement: App is identified with MilkMoney brand metadata
The Android app SHALL use package name `com.milkmoney.app`, display name "MilkMoney", and a splash screen and launcher icon derived from the existing MilkMoney brand assets.

#### Scenario: App appears correctly on the home screen
- **WHEN** the APK is installed on an Android device
- **THEN** the launcher shows the MilkMoney icon and the label "MilkMoney"

#### Scenario: Splash screen displays on launch
- **WHEN** the app is cold-launched
- **THEN** the MilkMoney splash screen is shown while the WebView loads, before the app UI appears

---

### Requirement: Root npm scripts cover the Capacitor workflow
The root `package.json` SHALL expose scripts that wrap the common Capacitor commands so developers do not need to invoke `npx cap` directly.

#### Scenario: Developer can sync, build, and open without knowing cap CLI
- **WHEN** a developer runs `npm run cap:sync`, `npm run cap:build`, or `npm run cap:open`
- **THEN** the corresponding `npx cap sync android`, `npx cap build android`, and `npx cap open android` commands execute

---

### Requirement: Android build outputs are excluded from version control
The `android/app/build/` directory and other Gradle build outputs SHALL be listed in `.gitignore` so compiled APKs and intermediate files are not committed.

#### Scenario: Build artifacts are not staged by git
- **WHEN** a developer builds the APK and runs `git status`
- **THEN** no files under `android/app/build/` appear as untracked or modified

---

### Requirement: CLAUDE.md documents the Android build workflow
`CLAUDE.md` SHALL include a section describing the prerequisites (Android Studio, JDK 17), the required env var (`CAPACITOR_SERVER_URL`), and the standard build workflow, so that Android build instructions are discoverable alongside the existing web development instructions.

#### Scenario: New developer can find Android build instructions
- **WHEN** a developer reads `CLAUDE.md`
- **THEN** they can find the Android prerequisites, env var configuration, and step-by-step build commands without consulting external documentation
