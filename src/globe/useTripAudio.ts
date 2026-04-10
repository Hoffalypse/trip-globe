import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import type { MusicTrack } from '../types';
import type { PlaybackStatus } from './usePlayback';

const FADE_MS = 800;
const FADE_STEPS = 20;

/**
 * Syncs an expo-av Audio.Sound with the globe playback state machine.
 *
 * - Loads the selected track when it changes
 * - Plays/pauses/resets in lockstep with the animation
 * - Fades volume in at the start and out near the end
 * - Loops the track if the animation is longer than the audio
 */
export function useTripAudio(
  track: MusicTrack | null,
  status: PlaybackStatus,
  time: number,
  totalDuration: number,
) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [loaded, setLoaded] = useState(false);

  // ── Configure audio mode (required for iOS) ─────────────

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    }).catch(() => {});
  }, []);

  // ── Helpers ──────────────────────────────────────────────

  const clearFade = useCallback(() => {
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  const fadeVolume = useCallback(
    (from: number, to: number, onDone?: () => void) => {
      clearFade();
      const sound = soundRef.current;
      if (!sound) return;

      let step = 0;
      const stepMs = FADE_MS / FADE_STEPS;
      const delta = (to - from) / FADE_STEPS;

      fadeTimerRef.current = setInterval(() => {
        step++;
        const vol = Math.min(1, Math.max(0, from + delta * step));
        sound.setStatusAsync({ volume: vol }).catch(() => {});
        if (step >= FADE_STEPS) {
          clearFade();
          onDone?.();
        }
      }, stepMs);
    },
    [clearFade],
  );

  // ── Load / unload when track changes ────────────────────

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Unload previous
      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
        setLoaded(false);
      }

      if (!track) return;

      const { sound } = await Audio.Sound.createAsync(track.source, {
        isLooping: true,
        volume: 0,
        shouldPlay: false,
      });

      if (cancelled) {
        await sound.unloadAsync().catch(() => {});
        return;
      }

      soundRef.current = sound;
      setLoaded(true);
    }

    load();

    return () => {
      cancelled = true;
      clearFade();
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
        setLoaded(false);
      }
    };
  }, [track, clearFade]);

  // ── Sync play / pause / reset with animation status ─────

  useEffect(() => {
    const sound = soundRef.current;
    if (!sound || !loaded) return;

    if (status === 'playing') {
      sound
        .setStatusAsync({ positionMillis: 0, shouldPlay: true, volume: 1 })
        .catch(() => {});
    } else if (status === 'paused') {
      clearFade();
      sound.setStatusAsync({ shouldPlay: false }).catch(() => {});
    } else if (status === 'idle') {
      clearFade();
      sound
        .setStatusAsync({ shouldPlay: false, positionMillis: 0, volume: 0 })
        .catch(() => {});
    } else if (status === 'ended') {
      fadeVolume(1, 0, () => {
        sound
          .setStatusAsync({ shouldPlay: false, positionMillis: 0 })
          .catch(() => {});
      });
    }
  }, [status, loaded, fadeVolume, clearFade]);

  // ── Fade out near the end of the animation ──────────────

  const fadingOutRef = useRef(false);

  useEffect(() => {
    if (status !== 'playing') {
      fadingOutRef.current = false;
      return;
    }

    const fadeOutStart = totalDuration - FADE_MS / 1000;
    if (time >= fadeOutStart && !fadingOutRef.current) {
      fadingOutRef.current = true;
      fadeVolume(1, 0);
    }
  }, [time, totalDuration, status, fadeVolume]);

  return { loaded };
}
