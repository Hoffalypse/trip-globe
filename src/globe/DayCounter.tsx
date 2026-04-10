import { StyleSheet, Text, View } from 'react-native';
import { TRANSPORT_EMOJI, type Stop } from '../types';
import type { PlaybackState } from './usePlayback';

interface DayCounterProps {
  stops: Stop[];
  playback: PlaybackState;
}

/**
 * Top-of-screen HUD showing where we are in the trip:
 *   "Day 3 · ✈️ → Paris (CDG)"
 *
 * The "current" stop during a leg is the destination of that leg — i.e. the
 * stop we're flying TO. On the very first frame (legProgress 0) we still
 * show the destination so the user immediately reads "where this leg is
 * heading", not "where we just left".
 *
 * Day number is computed from each stop's `arrivedAt` ISO date relative to
 * the first stop's date. Same-day stops collapse to the same day number.
 */
export function DayCounter({ stops, playback }: DayCounterProps) {
  const { status, legIndex, legProgress } = playback;

  if (stops.length === 0) {
    return null;
  }

  const targetStop = pickTargetStop(stops, status, legIndex, legProgress);
  if (!targetStop) return null;

  const dayNumber = computeDayNumber(stops, targetStop);
  const transport = targetStop.transportFromPrevious;
  const transportEmoji = transport ? TRANSPORT_EMOJI[transport] : '📍';

  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.dayLabel}>Day {dayNumber}</Text>
      <Text style={styles.cityLabel}>
        {transportEmoji} {targetStop.name}
      </Text>
    </View>
  );
}

function pickTargetStop(
  stops: Stop[],
  status: PlaybackState['status'],
  legIndex: number,
  legProgress: number,
): Stop | null {
  if (stops.length === 0) return null;

  if (status === 'idle') {
    return stops[0];
  }
  if (status === 'ended') {
    return stops[stops.length - 1];
  }
  // playing | paused — show the destination of the active leg
  if (legIndex < 0) return stops[0];
  const destIndex = Math.min(stops.length - 1, legIndex + 1);
  // While we're at the very start of a leg (progress < 1%), still show its
  // destination — the user expects "→ Paris" the moment the leg begins.
  void legProgress;
  return stops[destIndex];
}

function computeDayNumber(stops: Stop[], target: Stop): number {
  const first = new Date(stops[0].arrivedAt).getTime();
  const t = new Date(target.arrivedAt).getTime();
  if (Number.isNaN(first) || Number.isNaN(t)) return 1;
  const diffDays = Math.floor((t - first) / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  dayLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  cityLabel: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
});
