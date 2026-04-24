# AGENTS.md

## Project Structure

- Main app lives in `i-varotra-billet/` (Expo/React Native)
- Workspace root contains only this AGENTS.md and a top-level README
- The `i-varotra-billet/` directory is the working directory for all commands

## Commands

```bash
cd i-varotra-billet
npm install          # Install dependencies
npx expo start       # Start dev server (or: npm start)
npm run lint         # Lint (runs expo lint)
eas build            # Build via EAS CLI (eas-cli ^18.6.0)
```

No test framework is configured.

## Architecture

- **Framework**: Expo ~54.0.33 with expo-router ~6.0.23 (file-based routing)
- **Entry**: `app/_layout.tsx` → `expo-router/entry` (set in package.json `main`)
- **Routing**: Files in `app/` define routes; `(tabs)/` is the main tab group
- **Database**: SQLite via `expo-sqlite` ~16.0.10; schema in `database/database.ts`
- **Migrations**: Handled automatically in `initDB()` at app startup (no separate migration tool)
- **Auth**: PIN-based via AsyncStorage (`hooks/useAuth.js`); roles: `admin`, `verificateur`
- **Services**: Business logic in `services/` (EventService, TicketService, etc.)

## Toolchain Quirks

- **New Architecture enabled** (`app.json: newArchEnabled: true`) — React Native 0.81.5
- **React Compiler enabled** (`app.json: experiments.reactCompiler: true`)
- **Typed Routes enabled** (`app.json: experiments.typedRoutes: true`)
- **Path alias**: `@/*` maps to project root (see `tsconfig.json`)
- **Web platform**: SQLite operations are no-ops on web (see `database/database.ts`)
- **Lint config**: Uses `eslint-config-expo` ~10.0.0; ignores `dist/*`

## Conventions

- French language UI strings (this is a French event/ticket management app)
- Database timestamps use ISO text (`DEFAULT CURRENT_TIMESTAMP`)
- Components in `components/`; UI subcomponents in `components/ui/`
- The `dist/` directory is gitignored and lint-ignored (build output)
