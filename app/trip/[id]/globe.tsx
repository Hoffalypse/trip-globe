import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTrips } from '../../../src/hooks/useTrips';
import { GlobeCanvas } from '../../../src/globe/GlobeCanvas';
import { usePlayback } from '../../../src/globe/usePlayback';
import { PlaybackControls } from '../../../src/globe/PlaybackControls';
import { DayCounter } from '../../../src/globe/DayCounter';
import { useTripAudio } from '../../../src/globe/useTripAudio';
import { getTrackById } from '../../../src/lib/music';
import { TransportOverlay } from '../../../src/globe/TransportOverlay';
import type { SpriteOverlayData } from '../../../src/globe/TransportSprite';

/**
 * Phase 3: Fullscreen modal that owns the playback state machine and
 * composes the globe canvas with the HUD overlays.
 *
 * Layout:
 *   - <GlobeCanvas /> fills the entire screen
 *   - HUD overlays sit on top via absolute fill, with `pointerEvents="box-none"`
 *     so taps on the empty middle still pass through to the canvas
 *   - Top: close button + trip name + DayCounter
 *   - Bottom: PlaybackControls (play/pause, progress, duration presets)
 */
export default function GlobeModalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getTrip } = useTrips();

  const trip = id ? getTrip(id) : undefined;
  const stops = trip?.stops ?? [];

  const playback = usePlayback(stops, 20);

  // ── Transport sprite overlay ────────────────────────────
  const spriteOverlayRef = useRef<SpriteOverlayData>({
    visible: false, x: 0, y: 0, rotation: 0, transportType: undefined,
  });

  // ── Music state ─────────────────────────────────────────
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const selectedTrack = selectedTrackId ? getTrackById(selectedTrackId) ?? null : null;
  useTripAudio(selectedTrack, playback.status, playback.time, playback.totalDuration);

  // Auto-play the moment the modal opens. We capture `play` in a ref so the
  // effect can run exactly once on mount without re-firing every render.
  const playRef = useRef(playback.play);
  playRef.current = playback.play;
  useEffect(() => {
    if (stops.length >= 2) {
      playRef.current();
    }
  }, [stops.length]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <GlobeCanvas stops={stops} playback={playback} spriteOverlayRef={spriteOverlayRef} />
        <TransportOverlay overlayRef={spriteOverlayRef} />

        <View style={styles.hud} pointerEvents="box-none">
          <View style={styles.topSection}>
            <View style={styles.topBar}>
              <Pressable
                onPress={() => router.back()}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
              <Text style={styles.title} numberOfLines={1}>
                {trip?.name ?? 'Trip'}
              </Text>
              <View style={styles.closeButton} />
            </View>
            <DayCounter stops={stops} playback={playback} />
          </View>

          <PlaybackControls
            playback={playback}
            selectedTrackId={selectedTrackId}
            onSelectTrack={setSelectedTrackId}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  hud: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topSection: {
    paddingTop: 60,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  closeButton: {
    minWidth: 64,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  closeText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
