## 1. Capacitor Installation and Project Init

- [ ] 1.1 Install `@capacitor/core`, `@capacitor/cli`, and `@capacitor/android` as dev dependencies in the root `package.json`
- [ ] 1.2 Create `capacitor.config.ts` at the repo root with app id `com.milkmoney.app`, app name `MilkMoney`, and `server.url` read from `process.env.CAPACITOR_SERVER_URL` (default to the Railway production URL placeholder)
- [ ] 1.3 Run `npx cap add android` to generate the `android/` Gradle project directory
- [ ] 1.4 Add `android/app/build/` and other Gradle build outputs to `.gitignore`

## 2. Root npm Scripts

- [ ] 2.1 Add `cap:sync` script to root `package.json`: `npx cap sync android`
- [ ] 2.2 Add `cap:build` script to root `package.json`: `npx cap build android`
- [ ] 2.3 Add `cap:open` script to root `package.json`: `npx cap open android`

## 3. Brand Assets — Icon and Splash Screen

- [ ] 3.1 Install `@capacitor/assets` as a dev dependency
- [ ] 3.2 Identify or prepare a square, high-resolution (1024×1024 minimum) MilkMoney logo PNG from `docs/design/assets/` or `client/public/images/` for use as the source icon
- [ ] 3.3 Prepare a splash screen source image (2732×2732 recommended) in the brand background color (`#FFF8F0` per design system) with centered logo
- [ ] 3.4 Run `npx @capacitor/assets generate --android` to produce all `mipmap-*` icon densities and `splash-*` drawable assets under `android/`
- [ ] 3.5 Verify generated icons appear correctly in Android Studio's resource browser (no upscaling artifacts)

## 4. Android Manifest and App Configuration

- [ ] 4.1 Confirm `android/app/src/main/AndroidManifest.xml` includes `INTERNET` permission (required for Server URL mode)
- [ ] 4.2 Set `android:label="MilkMoney"` in the manifest application element
- [ ] 4.3 Verify `capacitor.config.ts` `server.url` setting is reflected after `cap sync` (check `android/app/src/main/assets/capacitor.config.json`)

## 5. Cookie Persistence Verification

- [ ] 5.1 Run the app against the production server (or a local server via `CAPACITOR_SERVER_URL=http://10.0.2.2:3001`) in an Android emulator
- [ ] 5.2 Log in as a child with `rememberDevice: true` to set the `device` cookie
- [ ] 5.3 Close and reopen the app; confirm `GET /auth/remembered` returns the child's name (verifying cookie persistence across app sessions)
- [ ] 5.4 Confirm one-tap `device-login` completes without re-entering the PIN

## 6. CLAUDE.md Documentation

- [ ] 6.1 Add an "Android Build" section to `CLAUDE.md` covering: prerequisites (Android Studio, JDK 17), the `CAPACITOR_SERVER_URL` env var and its values for production vs emulator, and the standard workflow (`npm run cap:sync` → Android Studio build or `npm run cap:build`)
- [ ] 6.2 Document the `cap:open` script as the entry point for opening Android Studio
