# Repository Guidelines

## Project Structure & Module Organization

This is an Expo React Native app using `expo-router`. Route files live in `app/`; `app/_layout.tsx` is the root layout, `(tabs)/` contains main tabs, and dynamic routes use bracket names such as `app/event/[id].tsx`. Shared UI belongs in `components/`, with primitives in `components/ui/`. Business logic is in `services/`, SQLite setup and migrations are in `database/database.ts`, and reusable helpers are in `utils/` and `hooks/`. Static assets are stored in `assets/`. Native files are in `android/` and `ios/`; edit them only for native configuration changes.

## Build, Test, and Development Commands

Run commands from the repository root:

```bash
npm install          # Install dependencies
npm start            # Start the Expo development server
npm run android      # Build and run on Android
npm run ios          # Build and run on iOS
npm run web          # Start Expo for web
npm run lint         # Run expo lint
eas build            # Create an EAS build when configured locally
```

No test command is configured in `package.json`.

## Coding Style & Naming Conventions

Use TypeScript for new app code where practical (`.ts` and `.tsx`). Keep route filenames aligned with Expo Router conventions: lowercase screen names, bracketed dynamic params, and `_layout.tsx` for layouts. Components should use PascalCase filenames and exports, for example `TicketCard.tsx`; hooks should use `use...` naming. Prefer the `@/*` path alias for root-relative imports. UI strings are primarily French, so keep new user-facing copy in French unless the surrounding screen is already bilingual.

## Testing Guidelines

No automated tests are currently configured. For changes, run `npm run lint` and manually verify affected flows in Expo, especially ticket creation, event management, PIN authentication, QR scanning, image picking, PDF generation, and SQLite-backed data updates. If tests are added later, place them next to the related module or under `__tests__/`, then document the command here.

## Commit & Pull Request Guidelines

Recent commits use short, direct French messages such as `pdf correction` and `suppression sur liste`. Keep commits concise and action-oriented; include the feature or area changed when useful. Pull requests should include a summary, manual verification steps, linked issue or task when available, and screenshots or recordings for UI changes.

## Security & Configuration Tips

Do not commit private credentials, local EAS tokens, keystores, or generated build output. `dist/` is ignored by lint and should remain build output. Verify SQLite changes on a native target, not only web.
