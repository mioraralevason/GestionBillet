# Build Guide for iBillet

## Prerequisites

```bash
npm install
eas login  # One-time only, if not already logged in
```

## Development Build

```bash
npm start
# or
npx expo start
```

Then select:
- `a` for Android emulator
- `i` for iOS simulator
- `w` for web
- `j` for direct Android device

## Production Build via EAS

### Android APK
```bash
cd i-varotra-billet
export EAS_BUILD_NO_EXPO_GO_WARNING=true
eas build --platform android --profile production --clean
```

### iOS
```bash
cd i-varotra-billet
export EAS_BUILD_NO_EXPO_GO_WARNING=true
eas build --platform ios --profile production --clean
```

### Both Platforms
```bash
cd i-varotra-billet
export EAS_BUILD_NO_EXPO_GO_WARNING=true
eas build --profile production --clean
```

Build artifacts will be available at: https://expo.dev/accounts/ralevasonmiora/projects/i-varotra-billet/builds

## Linting

```bash
npm run lint        # Check for issues
npm run lint --fix  # Auto-fix issues
```

## Resetting Project

If the project gets into a broken state:

```bash
npm run reset-project
```

This clears the development state and gives you a fresh app directory.

## Common Issues

### "Module not found" errors in production
- Check `app.json` plugins array
- Verify all native modules are declared
- See `EAS_BUILD_CONFIGURATION.md`

### "Config plugin validation failed"
- Package might not have `app.plugin.js` file
- Remove it from `app.json` plugins
- It's automatically linked if needed

### Build times too long
- Use `--clean` flag to avoid incremental builds (sometimes slower)
- Skip it on subsequent builds: `eas build --platform android --profile production`

## Env Variables for EAS

### Suppress Expo Go Warning
```bash
export EAS_BUILD_NO_EXPO_GO_WARNING=true
```

### Use Specific EAS Profile
```bash
eas build --profile production    # Uses production config in eas.json
eas build --profile preview       # Uses preview config in eas.json
eas build --profile development   # Uses development config in eas.json
```

## Database & Schema

Database migrations run automatically on app startup via `app/_layout.tsx` → `initDB()`.

No manual migration steps needed; schema changes are in `database/database.ts`.

## Permissions

French permission strings are configured in `app.json`:
- Camera: For ticket QR scanning and event photos
- Photo Library: For event images
- Microphone: Required by camera plugin (not actively used)

Users will be prompted on first app launch.

---

For detailed info, see: `PRODUCTION_BUILD_FIX.md` and `EAS_BUILD_CONFIGURATION.md`
