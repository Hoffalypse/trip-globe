import type { MusicTrack } from '../types';

/**
 * Bundled music tracks — all CC0 / royalty-free.
 * See assets/audio/CREDITS.md for source + license per track.
 *
 * To add a track:
 *   1. Drop the .mp3 into assets/audio/
 *   2. Add an entry here with a require() call
 *   3. Update assets/audio/CREDITS.md with source + license
 */
export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'adventure',
    name: 'Adventure',
    artist: 'Unknown',
    durationSec: 120,
    source: require('../../assets/audio/adventure.mp3'),
  },
  {
    id: 'uplifting',
    name: 'Uplifting',
    artist: 'Unknown',
    durationSec: 120,
    source: require('../../assets/audio/uplifting.mp3'),
  },
];

/** "No music" sentinel — when selectedTrackId is null, audio is off. */
export function getTrackById(id: string): MusicTrack | undefined {
  return MUSIC_TRACKS.find((t) => t.id === id);
}
