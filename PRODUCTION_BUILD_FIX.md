# Production Build Fix: Missing Expo Plugin Declarations

## Issue Resolved
Production builds were failing with:
```
Error importing: call to function 'ExponentImagePicker.launchImageLibraryAsync' has been rejected.
Caused by: Module 'ImageLoader' not found.
```

## Root Cause
The `app.json` file was missing plugin declarations for Expo packages that are used in the codebase but not explicitly linked for native compilation. This caused the native modules to fail loading in production EAS builds.

### Missing Plugins (Now Added)
- `expo-image-picker` – **Primary issue** causing the ImagePicker error
- `expo-image-manipulator`
- `expo-file-system`
- `expo-print`
- `expo-sharing`
- `expo-blur`
- `expo-linear-gradient`
- `expo-haptics`
- `expo-status-bar`
- `expo-system-ui`
- `expo-web-browser`
- `expo-font`
- `expo-constants`
- `expo-symbols`

## What Was Changed
**File: `app.json`**

Added all missing plugins to the `expo.plugins` array with appropriate permissions configuration. The `expo-image-picker` plugin now includes both photo library and camera permissions with French descriptions.

## How to Rebuild for Production

### Clean Android Build
```bash
cd i-varotra-billet
eas build --platform android --clean
```

### Clean iOS Build
```bash
cd i-varotra-billet
eas build --platform ios --clean
```

### Both Platforms
```bash
eas build --clean
```

The `--clean` flag ensures a fresh build without cached dependencies.

## Testing
After the build completes:
1. Download the APK/IPA from EAS
2. Install on a physical device
3. Test image picker functionality (adding event images)
4. Test camera access (ticket verification)
5. Verify no "Module not found" errors appear

## Prevention Going Forward
**Important:** Keep `app.json` plugins array synchronized with `package.json` dependencies.

When adding new Expo packages:
1. Add to `package.json`: `npm install expo-package-name`
2. Add to `app.json` `plugins` array
3. If the package needs permissions, include configuration with French descriptions

Example:
```json
"plugins": [
  [
    "expo-new-package",
    {
      "permission": "Description in French"
    }
  ]
]
```

## Reference
- [Expo Plugins Documentation](https://docs.expo.dev/guides/config-plugins/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

---
**Fixed:** May 2026
**By:** GitHub Copilot
