import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PlaybackState } from './usePlayback';
import { MusicPicker } from './MusicPicker';

interface PlaybackControlsProps {
  playback: PlaybackState;
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string | null) => void;
}

const DURATION_PRESETS: number[] = [10, 20, 30, 60];

/**
 * Bottom-of-screen HUD: play/pause button, progress bar, duration presets.
 *
 * The progress bar is display-only — Phase 3 doesn't include drag-to-seek
 * (we'd need a gesture handler). Pause + replay covers the use cases the
 * user actually has for v1.
 */
export function PlaybackControls({
  playback,
  selectedTrackId,
  onSelectTrack,
}: PlaybackControlsProps) {
  const {
    status,
    time,
    totalDuration,
    plan,
    play,
    pause,
    setTotalDuration,
  } = playback;

  const hasPlan = plan.legDurations.length > 0;
  const progressFraction =
    totalDuration > 0 ? Math.min(1, time / totalDuration) : 0;

  const isPlaying = status === 'playing';
  const buttonLabel = !hasPlan
    ? '—'
    : isPlaying
    ? 'Pause'
    : status === 'ended'
    ? 'Replay'
    : 'Play';

  const onPressMain = () => {
    if (!hasPlan) return;
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progressFraction * 100}%` },
          ]}
        />
      </View>

      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{time.toFixed(1)}s</Text>
        <Text style={styles.timeText}>{totalDuration.toFixed(0)}s</Text>
      </View>

      <View style={styles.row}>
        <Pressable
          onPress={onPressMain}
          disabled={!hasPlan}
          style={({ pressed }) => [
            styles.playButton,
            !hasPlan && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.playButtonText}>{buttonLabel}</Text>
        </Pressable>
      </View>

      <View style={styles.presetRow}>
        <Text style={styles.presetLabel}>Length</Text>
        {DURATION_PRESETS.map((sec) => {
          const selected = totalDuration === sec;
          return (
            <Pressable
              key={sec}
              onPress={() => setTotalDuration(sec)}
              style={[
                styles.presetChip,
                selected && styles.presetChipSelected,
              ]}
            >
              <Text
                style={[
                  styles.presetText,
                  selected && styles.presetTextSelected,
                ]}
              >
                {sec}s
              </Text>
            </Pressable>
          );
        })}
      </View>

      <MusicPicker selectedTrackId={selectedTrackId} onSelect={onSelectTrack} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 16,
    gap: 12,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fbbf24',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -6,
  },
  timeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
    minWidth: 120,
    alignItems: 'center',
  },
  playButtonText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.85,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  presetLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginRight: 4,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  presetChipSelected: {
    backgroundColor: 'rgba(251,191,36,0.2)',
    borderColor: '#fbbf24',
  },
  presetText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
  presetTextSelected: {
    color: '#fbbf24',
    fontWeight: '700',
  },
});
