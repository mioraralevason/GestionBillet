# ImagePicker Runtime Error - Comprehensive Fix

## Problem
Production builds failed when trying to import/pick images during event creation or update:
```
Error importing: call to function 'ExponentImagePicker.launchImageLibraryAsync' has been rejected.
Caused by: Module 'ImageLoader' not found.
```

## Root Causes

### 1. **Missing Android Permissions** ❌
Android requires explicit permissions for image library access. The app.json was missing:
- `android.permission.READ_EXTERNAL_STORAGE` – Legacy (Android < 13)
- `android.permission.READ_MEDIA_IMAGES` – Modern (Android 13+)

### 2. **No Error Handling for Module Availability** ❌
The code directly called `ImagePicker.launchImageLibraryAsync()` without checking if:
- The native module was loaded
- Permissions were granted before opening picker
- The picker module was available

### 3. **Inconsistent Permission Flow** ❌
Permissions were requested inline in `add-event.tsx` without proper checks for the system's module availability.

## Solutions Applied

### 1. **Added Missing Android Permissions**
Updated `app.json` android permissions:
```json
"permissions": [
  "android.permission.CAMERA",
  "android.permission.RECORD_AUDIO",
  "android.permission.READ_EXTERNAL_STORAGE",    // Added
  "android.permission.WRITE_EXTERNAL_STORAGE",   // Added
  "android.permission.READ_MEDIA_IMAGES",        // Added (Android 13+)
  "android.permission.INTERNET"                  // Added
]
```

### 2. **Created Robust ImagePicker Helper** (`utils/imagePickerHelper.ts`)
```typescript
export const pickImageFromLibrary = async (): Promise<string | null> {
  // ✓ Verify module is available
  // ✓ Request permissions safely
  // ✓ Handle all error cases
  // ✓ Convert to base64 with validation
  // ✓ Return null on failure instead of throwing
}
```

Features:
- Checks if `ImagePicker.launchImageLibraryAsync` exists before use
- Separate permission request function
- Comprehensive error handling for:
  - Module not available
  - Permissions denied
  - Base64 conversion failures
  - Image size validation
  - User cancellation
- Graceful fallback with user-friendly error messages

### 3. **Refactored add-event.tsx**
- Replaced inline ImagePicker logic with helper
- Removed unnecessary imports (`ImagePicker`, `FileSystem`)
- Simplified `pickImage()` function to single line:
```typescript
const pickImage = async () => {
  const base64Uri = await pickImageFromLibrary();
  if (base64Uri) {
    setImage(base64Uri);
  }
};
```

## Files Changed

### Modified
- **app.json** – Added missing Android permissions
- **app/add-event.tsx** – Refactored to use helper

### Created
- **utils/imagePickerHelper.ts** – Robust ImagePicker wrapper

## How It Works

### Permission Flow
1. User taps "Import Image"
2. `pickImage()` calls `pickImageFromLibrary()`
3. Helper checks current permissions
4. If denied, requests permission with user-friendly message
5. If granted, launches image picker
6. Converts selected image to base64
7. Returns base64 URI or null

### Error Handling
- Module not available → Clear error message about build configuration
- Permission denied → Guides user to settings
- Conversion failed → Shows specific error
- User cancels → Returns null, no error

## Deployment Steps

### 1. Clean rebuild for Android
```bash
cd i-varotra-billet
export EAS_BUILD_NO_EXPO_GO_WARNING=true
eas build --platform android --profile production --clean
```

### 2. Clean rebuild for iOS
```bash
cd i-varotra-billet
export EAS_BUILD_NO_EXPO_GO_WARNING=true
eas build --platform ios --profile production --clean
```

### 3. After Build
1. Download APK/IPA from https://expo.dev/accounts/ralevasonmiora/projects/i-varotra-billet/builds
2. Install on physical device
3. Launch app
4. Go to "Add Event" → "Add Image"
5. Test image import flow
6. Verify no "Module not found" errors

## Testing Checklist

- [ ] App builds without errors
- [ ] Create new event with image import
- [ ] Update existing event with new image
- [ ] Permission prompt appears on first use
- [ ] Can deny permissions and see appropriate message
- [ ] Can grant permissions and use image picker
- [ ] Image converts to base64 correctly
- [ ] Large images show size warning
- [ ] Canceling picker doesn't crash app

## Why This Works

1. **Module availability check** – Fails gracefully if native module isn't loaded
2. **Permission flow** – Requests permissions before attempting to access media
3. **Error boundaries** – Catches all errors and shows user-friendly messages
4. **Android 13+ compliance** – Includes `READ_MEDIA_IMAGES` for modern devices
5. **Fallback logic** – Doesn't throw exceptions, returns null on failure

## If Problems Persist

### Symptom: Still getting module errors
1. Ensure `--clean` flag is used in build command
2. Check that `expo-image-picker` is in `app.json` plugins (it is)
3. Verify Android permissions are present in `app.json`

### Symptom: Permission still denied
1. Check app settings on device for iBillet permissions
2. Revoke permission manually and re-test app
3. Ensure app has just been installed (not upgraded from old version)

### Symptom: Image picker doesn't launch
1. Check console logs for specific error
2. Verify `imagePickerHelper.ts` is correctly imported
3. Test on different device/emulator

---

**Fixed:** May 2026
**By:** GitHub Copilot
