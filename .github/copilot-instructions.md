# Copilot Instructions for i-varotra-billet

## Quick Setup

```bash
cd i-varotra-billet
npm install
npx expo start       # or: npm start
```

## Commands

- **Start dev server**: `npx expo start`
- **Lint**: `npm run lint`
- **Build (EAS)**: `eas build`
- **Run on Android**: `expo start --android`
- **Run on iOS**: `expo start --ios`
- **Run on web**: `expo start --web`
- **Reset project**: `npm run reset-project`

No test framework is configured.

## Project Overview

**iBillet** is a French event and ticket management mobile app built with Expo and React Native. It uses file-based routing via expo-router, SQLite for local data persistence, and AsyncStorage for PIN-based authentication.

## Architecture

### Routing & Entry Point
- **Framework**: Expo ~54.0.33 + expo-router ~6.0.23 (file-based routing)
- **Entry**: `app/_layout.tsx` initializes the app (calls `initDB()` on startup)
- **Main app**: `app/(tabs)/` is the primary tab-based interface
- **Auth redirect**: Root layout checks for `userRole` in AsyncStorage; redirects to login if missing

### Database
- **Engine**: SQLite via `expo-sqlite` ~16.0.10
- **File**: `database/database.ts` contains all schema and migrations
- **Schema initialization**: `initDB()` creates tables and runs auto-migrations on app startup
- **Web platform**: SQLite operations are no-ops on web (returns empty/null values)
- **Timestamps**: Use ISO text format with `DEFAULT CURRENT_TIMESTAMP`
- **Migrations**: Performed in `initDB()` checks (old schema reset, renames, column additions)

### Authentication
- **Method**: PIN-based via AsyncStorage
- **Storage key**: `userRole` (values: `admin`, `verificateur`)
- **Hook**: `hooks/useAuth.js` (currently empty; auth logic lives in components/layouts)
- **Session management**: No server-side sessions; stored locally

### Services
Business logic is separated into service modules in `services/`:
- **EventService**: Event CRUD, ticket types, event queries
- **TicketService**: Ticket CRUD, filtering, QR code handling
- **BuyerService**: Buyer data operations
- **AttendanceService**: Attendance tracking logic
- **PaymentService**: Payment-related operations
- **PdfService**: PDF generation and export

**Pattern**: Services expose object methods with try/catch error handling; they use database directly via `db.getAllSync()`, `db.runSync()`, etc.

### Components
- **Location**: `components/` for main components, `components/ui/` for reusable UI subcomponents
- **Examples**: `ConfirmModal.tsx`, `ToastMessage.tsx`, `TicketCard.tsx`, `CustomSidebar.tsx`
- **Toast notifications**: Centralized via `components/ToastMessage.tsx` and `config/toastConfig`

### Toolchain & Experiments
- **New Architecture enabled**: `app.json: newArchEnabled: true` (React Native 0.81.5)
- **React Compiler enabled**: `app.json: experiments.reactCompiler: true` (optimizations; watch for edge cases)
- **Typed Routes enabled**: `app.json: experiments.typedRoutes: true` (type-safe navigation)
- **Path alias**: `@/*` maps to project root; see `tsconfig.json`
- **Lint config**: `eslint-config-expo` ~10.0.0; ignores `dist/*`

## Key Conventions

- **Language**: All UI strings are in French (this is a French event management app)
- **File structure**: TypeScript by default; JS only where necessary (e.g., hooks)
- **Database timestamps**: ISO text format (`DEFAULT CURRENT_TIMESTAMP`)
- **Error handling**: Services catch and log errors, return empty arrays/objects on failure
- **Styled components**: Use React Native `StyleSheet.create()` for consistent styling
- **Toast messages**: Use `components/ToastMessage.tsx` for user feedback, not `alert()`

## Important Quirks

1. **Web platform**: SQLite is stubbed out (no-ops). Web build won't have persistent data.
2. **React Compiler**: Enabled but experimental; if you hit issues with memoization or stale renders, check React Compiler documentation.
3. **Migration strategy**: The `initDB()` function is the single source of truth for schema. Add migrations there; there is no separate migration tool.
4. **AsyncStorage auth**: `userRole` is checked in the root layout; guard `/` routes if they're auth-only.
5. **EAS CLI required**: For building on physical devices or distributing, you need `eas-cli` ^18.6.0.
6. **Plugin linking**: Only packages with `app.plugin.js` files should be in `app.json` plugins array. Not all Expo packages require plugin declarations—only those that configure native modules. See `EAS_BUILD_CONFIGURATION.md` for the current valid plugins list.

## Structure at a Glance

```
i-varotra-billet/
├── app/                      # File-based routing (expo-router)
│   ├── _layout.tsx           # Root layout + auth redirect
│   ├── index.tsx             # Login screen
│   ├── (tabs)/               # Main tabbed interface
│   ├── event/                # Event-related screens
│   ├── tickets/              # Ticket-related screens
│   └── assign-ticket/        # Ticket assignment flows
├── components/               # Reusable React components
│   └── ui/                   # UI subcomponents (buttons, cards, etc.)
├── services/                 # Business logic (EventService, TicketService, etc.)
├── database/                 # SQLite schema & migrations
├── hooks/                    # Custom React hooks
├── config/                   # Configuration (toastConfig, constants, etc.)
├── constants/                # App-wide constants
├── utils/                    # Utility functions
└── assets/                   # Images, icons, etc.
```

## Before Making Changes

- **Database changes**: Always update schema in `database/database.ts` under `initDB()`.
- **New services**: Create in `services/`, export object with methods.
- **UI strings**: Keep French unless a translation system is set up.
- **Routes**: Remember `/` requires no auth; `/(tabs)/*` requires `userRole` set.
- **Linting**: Run `npm run lint` before committing; config is in `eslint.config.js`.

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [expo-router Guide](https://docs.expo.dev/router/introduction/)
- [expo-sqlite API](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [React Native Docs](https://reactnative.dev/)
