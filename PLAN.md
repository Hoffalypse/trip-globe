# Trip Globe — Build Plan

An Expo / React Native app where a user enters the cities they visited on a trip and the transportation between them, and the app produces an animated 3D globe that flies between the points. The animation can be watched live in the app and exported as a shareable mp4.

---

## Locked decisions

| # | Decision | Choice |
|---|---|---|
| 1 | In-app vs export | **Both.** Live in-app r3f animation + exportable mp4. |
| 2 | Globe rendering | **react-three-fiber** (`@react-three/fiber/native` + `expo-gl`). |
| 3 | Animation features | Camera follow, moving transport icon, growing trail, stop labels, day counter, country highlight. |
| 4 | Pacing | User picks total duration **10–60s**, **distance-proportional** per leg (longer flights animate longer). 0.8s minimum per leg. |
| 5 | Music | Bundled royalty-free tracks (CC0 / Pixabay / YouTube Audio Library "no attribution"). User picks from a list. |
| 6 | Persistence | **In-memory + seed data** for now. Firestore + auth deferred to Phase 6. |
| 7 | Geocoding | **Mapbox** forward geocoding. Real API, unlimited cities. |
| 8 | Transport visual | Vary **arc height** by transport type — planes high, trains/cars low, walks flat. All paths are still great circles (no road routing). |
| 9 | Export aspect ratios | **User-selectable** at export time: 9:16 vertical, 1:1 square, 16:9. |
| 10 | Country highlight scope | **Stops-only.** Only countries that contain a stop are highlighted, not every country flown over. |
| 11 | Globe screen entry | **Fullscreen modal** opened from the existing `trip/[id]` screen, not a new tab. |

---

## Hard constraints these decisions create

1. **Expo Go works for Phases 1–4. Phase 5 needs an Expo dev client** because `ffmpeg-kit-react-native` (and possibly `expo-three`'s native bits) is a native module not in Expo Go.
2. **Country polygon highlighting on a sphere is the trickiest visual.** Naive GeoJSON projection cuts straight lines through the globe — edges must be subdivided along great circles before mapping to 3D coordinates. Plan a half-day for this alone.
3. **Mapbox needs a token** in `app.config.ts → extra → expoConstants`. Free tier = 100k geocoding requests/month, plenty for dev.
4. **Music must be hand-license-checked.** "Royalty-free" on the open web is often a lie. Each bundled track needs its source + license recorded in `assets/audio/CREDITS.md`.
5. **Video export from a live r3f canvas on-device is the highest-risk piece.** Plan a 1–2 hour spike on `gl.readPixels` performance before committing to the approach. Fallback: `react-native-view-shot` on the canvas wrapper.

---

## Phases

### Phase 0 — Foundations

- Add `MAPBOX_TOKEN` to `app.config.ts → extra`, read via `expo-constants`
- Create `assets/audio/`, `assets/textures/`, `assets/geo/`
- Install: `@react-three/fiber`, `three`, `expo-gl`, `expo-three`, `@react-three/drei` (Native subset)
- Verify a spinning cube renders in Expo Go on a real device before going further
- Add a "Play Globe" button on `app/trip/[id]/index.tsx` that opens a fullscreen modal route

### Phase 1 — Real geocoding (Mapbox)

- Replace `src/lib/geocoding.ts` stub with Mapbox forward geocoding:
  `https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json?types=place,locality&autocomplete=true&limit=8&access_token=...`
- Add `useDebouncedSearch` hook (250ms)
- Wire into the existing Add Stop screen
- Tests: mock `fetch`, assert query shape + parsing
- ✅ **Checkpoint:** user can add any city in the world to a trip

### Phase 2 — Static globe scene

```
src/globe/
  GlobeCanvas.tsx       — <Canvas> with Earth sphere + lighting
  Earth.tsx             — sphere mesh, day texture (~2k jpg, ~400KB)
  latLngToVec3.ts       — (lat, lng, radius) → THREE.Vector3
  greatCircle.ts        — interpolate N points along a great circle
  TripArcs.tsx          — quadratic-elevated arcs between consecutive stops
  StopMarkers.tsx       — small glowing pins at each stop
  Countries.tsx         — load natural-earth-110m TopoJSON, render outlines
                          subdivided along great circles (only stop countries)
```

- Reuse `src/lib/distance.ts` for arc heights — longer leg → higher arc
- Vary arc max-height by transport type (plane > train > car > walk)
- ✅ **Checkpoint:** open a trip, see a static globe with arcs, markers, and highlighted countries

### Phase 3 — Animation player

```
src/globe/
  usePlayback.ts        — state machine: idle/playing/paused/ended,
                          currentTime, currentLegIndex, legProgress
  PlaybackControls.tsx  — play/pause, scrubber, duration slider (10–60s)
  CameraRig.tsx         — animated camera; orbits the active leg's midpoint,
                          lerps to next leg on transition
  AnimatedTrail.tsx     — TubeGeometry, drawRange grows with progress
  TransportSprite.tsx   — emoji/icon billboard moving along the arc
  StopLabels.tsx        — fade-in label on arrival
  DayCounter.tsx        — "Day 3 · Paris" HUD as a plain RN view ABOVE the
                          canvas (not inside the GL context — keeps text crisp)
  CountryHighlight.tsx  — fill the active stop's country with a tinted
                          material on entry, fade out on departure
```

**Pacing math:**
- `totalDistance = sum(haversineMiles(legs))`
- `legDuration[i] = max(0.8s, userTotalDuration * legDistance[i] / totalDistance)`
- Renormalize so the sum still equals `userTotalDuration`

✅ **Checkpoint:** hit play in Expo Go, watch the animation on phone

### Phase 4 — Music

- Bundle 5–8 CC0 / Pixabay / YouTube Audio Library tracks in `assets/audio/`
- Suggested moods: uplifting, cinematic, lofi, ambient, epic
- `assets/audio/CREDITS.md` lists source + license per track (mandatory)
- `src/lib/music.ts` — track registry
- `MusicPicker.tsx` — list-based picker on the trip / globe modal
- `useTripAudio` hook — `expo-av` Audio.Sound, syncs play/pause/seek with
  the `usePlayback` state machine, fades in/out at start/end
- ✅ **Checkpoint:** animation plays with selected soundtrack

### Phase 5 — Video export (requires Expo dev client)

**Pre-spike (1–2 hours):** test `gl.readPixels` frame capture performance from a r3f canvas on a real device. If too slow, fall back to `react-native-view-shot` on the canvas wrapper.

- Switch to dev client: `npx expo prebuild` + `eas build --profile development`
- Install `ffmpeg-kit-react-native`, `expo-media-library`, `expo-sharing`

```
src/globe/export/
  captureFrames.ts      — drive the animation in "headless" mode at fixed
                          dt, call gl.readPixels each frame, write PNGs to
                          FileSystem.cacheDirectory
  encodeVideo.ts        — ffmpeg: PNG sequence + audio file → mp4
                          (-c:v libx264 -pix_fmt yuv420p -shortest)
  saveAndShare.ts       — save to camera roll + open share sheet
```

- `ExportSheet.tsx` — resolution picker (720p / 1080p), aspect picker (9:16, 1:1, 16:9), progress bar
- ✅ **Checkpoint:** tap Export → mp4 in Photos → share to Instagram

### Phase 6 — Persistence + auth (deferred)

- Firebase project, Firestore, Firebase Auth (email + Apple/Google)
- Migrate `TripsProvider` from in-memory to Firestore-backed
- Per-user trips with security rules

---

## Already built (don't rebuild)

- `src/types/index.ts` — `Trip`, `Stop`, `TransportType`, `MusicTrack`
- `src/hooks/useTrips.tsx` — in-memory `TripsProvider` with seed data
- `src/lib/distance.ts` — Haversine + total-trip miles + unique-country count (with Vitest tests)
- `src/lib/geocoding.ts` — stub to be replaced in Phase 1
- `app/(tabs)/index.tsx`, `app/(tabs)/profile.tsx`, `app/trip/[id]/...` — routes scaffolded
