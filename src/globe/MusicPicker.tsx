import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MusicTrack } from '../types';
import { MUSIC_TRACKS } from '../lib/music';

interface MusicPickerProps {
  selectedTrackId: string | null;
  onSelect: (trackId: string | null) => void;
}

/**
 * Horizontal chip row for picking a music track.
 * Sits inside PlaybackControls alongside the duration presets.
 * Selecting the active track again toggles music off (null).
 */
export function MusicPicker({ selectedTrackId, onSelect }: MusicPickerProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>Music</Text>
      <Pressable
        onPress={() => onSelect(null)}
        style={[
          styles.chip,
          selectedTrackId === null && styles.chipSelected,
        ]}
      >
        <Text
          style={[
            styles.chipText,
            selectedTrackId === null && styles.chipTextSelected,
          ]}
        >
          Off
        </Text>
      </Pressable>
      {MUSIC_TRACKS.map((track: MusicTrack) => {
        const selected = selectedTrackId === track.id;
        return (
          <Pressable
            key={track.id}
            onPress={() => onSelect(track.id)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {track.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  label: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginRight: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  chipSelected: {
    backgroundColor: 'rgba(251,191,36,0.2)',
    borderColor: '#fbbf24',
  },
  chipText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fbbf24',
    fontWeight: '700',
  },
});
