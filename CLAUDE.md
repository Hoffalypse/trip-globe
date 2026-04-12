# CLAUDE.md

Guidance for Claude Code when working in the **trip-globe** repo.

## What this app is

An Expo / React Native app where a user enters the cities they visited on a trip and the transportation between each leg, and the app produces an animated 3D globe (react-three-fiber) that flies between the points. The animation can be watched live in-app and exported as an mp4 to share.

**Read [PLAN.md](PLAN.md) first** — it has the full phased build plan, all locked decisions, and which constraints those decisions create. Don't re-litigate decisions that PLAN.md already settled.

## Stack

- **Expo SDK 54** with **expo-router 6** (file-based routing under `app/`)
- **React 19**, **React Native 0.81**
- **TypeScript strict mode**
- **Vitest** for tests (NOT Jest)
- **react-three-fiber** for the globe (Phase 2+, not yet installed)
- **Mapbox** for geocoding (Phase 1, not yet installed)
- **Firebase / Firestore** is deferred to Phase 6 — for now trips live in-memory in `TripsProvider` with seed data

## Project layout

```
app/                           expo-router routes
  _layout.tsx                  root Stack + TripsProvider + SafeAreaProvider
  (tabs)/
    _layout.tsx
    index.tsx                  trips list
    profile.tsx
  trip/[id]/
    index.tsx                  trip detail
    add-stop.tsx               modal route

src/
  types/index.ts               Trip, Stop, TransportType, MusicTrack
  hooks/useTrips.tsx           in-memory TripsProvider (will become Firestore in Phase 6)
  lib/
    distance.ts                Haversine + totalTripMiles + uniqueCountryCount
    distance.test.ts
    geocoding.ts               STUB — replace with Mapbox in Phase 1
  components/                  (empty)

assets/                        images, fonts; will gain textures/, audio/, geo/ in later phases
```

## Data model (don't change without good reason)

- `Trip` has an ordered `Stop[]`
- Each `Stop` has `lat`, `lng`, `countryCode` (ISO-3166 alpha-2), `arrivedAt` (ISO date), and `transportFromPrevious` (plane/car/train/boat/walk/bike/other) — null on the first stop
- `MusicTrack` exists in `types/index.ts` already, ready for Phase 4

## Path imports

The repo uses **relative imports** (e.g. `'../src/hooks/useTrips'`), not a `@/` alias. Don't introduce a `@/` alias without updating `tsconfig.json` and `babel.config.js` consistently.

## Installing packages — peer dep gotcha

This repo requires `--legacy-peer-deps` for any `npm install`. Two known harmless conflicts:

1. `expo-three@8` pins `three@^0.166.0` while `@react-three/fiber@9` wants `three>=0.156`. We pinned `three@0.166.1` to satisfy expo-three. **Don't bump three above 0.166** until expo-three releases a newer version.
2. `@react-three/fiber@9` pulls in `react-dom@19.2.5` (for its web renderer), which peer-requires `react@^19.2.5`. Expo 54 ships `react@19.1.0`. We don't use the web renderer — we import from `@react-three/fiber/native` — so this peer conflict is cosmetic.

```bash
npm install <pkg> --legacy-peer-deps
```

## Running the app

```bash
npm start                      # Expo dev server, scan QR with Expo Go
npm run ios                    # iOS simulator (requires Xcode)
npm run android                # Android emulator
npx expo start --tunnel        # if phone and Mac aren't on the same Wi-Fi
```

Phases 1–4 of PLAN.md are designed to work in **plain Expo Go**. Phase 5 (video export) needs an **Expo dev client** because `ffmpeg-kit-react-native` is a native module.

## Testing — IMPORTANT memory rules

- **Use Vitest only.** Never import from `jest`. Use `import { describe, it, expect, vi, beforeEach } from 'vitest'`.
- Use `vi.fn()`, `vi.spyOn()`, `vi.clearAllMocks()`.
- Test files: `*.test.ts` / `*.test.tsx`.

**Never run the full suite.** Always run targeted:

```bash
npx vitest run src/path/to/specific.test.ts --no-file-parallelism --bail=1 --testTimeout=60000
```

- **Always** include `--no-file-parallelism` and `--testTimeout=60000`
  (Vitest 2.1+ rejects `--maxWorkers=1` due to a min/max threads conflict —
  `--no-file-parallelism` is the modern equivalent.)
- **Never** use `--watch` or bare `vitest`
- If something gets stuck: `pkill -f vitest || true`

## TypeScript rules

- Strict mode is on
- **Never use `any`.** Use specific interfaces, union types, `unknown`, generics, or type guards.

## Code standards

- Don't add features, abstractions, or "improvements" beyond what's asked
- Don't add error handling, fallbacks, or validation for scenarios that can't happen
- Trust internal code; only validate at system boundaries (user input, external APIs)
- Three similar lines of code is better than a premature abstraction
- Only add comments where the logic isn't self-evident
- Fix root causes, not symptoms

## Working on a phase from PLAN.md

When implementing a phase:

1. Re-read PLAN.md for that phase's checklist and checkpoint
2. Don't start a later phase before the current phase's ✅ checkpoint passes on a real device
3. If a decision in PLAN.md turns out to be wrong, **update PLAN.md** in the same change — don't let it drift from reality
4. The "Already built (don't rebuild)" section at the bottom of PLAN.md lists existing code — read those files before recreating anything

## Color Scheme & Styling

All screens use a dark theme. Apply these colors consistently to every page:

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#0f0d23` | Screen / page background |
| Card / Input | `#1c1a36` | Cards, inputs, list rows |
| Border | `#2d2b50` | Card borders, input borders, dividers |
| Primary accent | `#10b981` | Buttons, active tab, links, selected chips |
| Highlight text | `#34d399` | Dates, secondary accent text |
| Soft accent | `#6ee7b7` | Tertiary text on dark backgrounds |
| Dark accent tint | `#0d3326` | Selected-state card backgrounds (e.g. selected place) |
| Primary text | `#fff` | Headings, values, card titles |
| Secondary text | `#8b8fa3` | Labels, stat labels, muted info |
| Muted text | `#6b7280` | Placeholders, empty-state hints |
| Tab bar bg | `#13112b` | Bottom tab bar background |
| Tab inactive | `#555770` | Inactive tab icon color |
| Destructive | `#ef4444` | Sign out, error text |

- Navigation headers: `backgroundColor: '#0f0d23'`, `headerTintColor: '#fff'`
- StatusBar style: `light`
- Border radius: `14` for cards/inputs/buttons, `20` for pill badges
- Press feedback: `opacity: 0.8, transform: [{ scale: 0.98 }]`

## Secrets

- `MAPBOX_TOKEN` will live in `app.config.ts → extra`, read at runtime via `expo-constants`. Never commit a real token. Use `.env` + `app.config.ts` reading `process.env.MAPBOX_TOKEN`.
