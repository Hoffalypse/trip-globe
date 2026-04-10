import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Stop } from '../types';
import {
  computePlaybackPlan,
  locateOnPlan,
  type PlaybackPlan,
} from './playback';

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'ended';

export interface PlaybackState {
  status: PlaybackStatus;
  /** Current animation time in seconds. */
  time: number;
  /** Active leg index. -1 if no legs. */
  legIndex: number;
  /** 0..1 within the active leg. */
  legProgress: number;
  /** User-chosen total animation length. */
  totalDuration: number;
  /** Resolved playback plan derived from stops + totalDuration. */
  plan: PlaybackPlan;
  play: () => void;
  pause: () => void;
  reset: () => void;
  setTotalDuration: (seconds: number) => void;
}

const DEFAULT_DURATION = 20;

/**
 * React hook that owns the playback state machine for a trip animation.
 *
 * Time advances via `requestAnimationFrame` while status === 'playing'.
 * Updates state at ~60Hz, which is fine for the small number of subscribers
 * we have. If perf becomes an issue we can move time into a ref + useFrame
 * subscription pattern, but the simple state approach is plenty for v1.
 */
export function usePlayback(
  stops: Stop[],
  initialDuration: number = DEFAULT_DURATION,
): PlaybackState {
  const [totalDuration, setTotalDurationState] = useState(initialDuration);
  const [time, setTime] = useState(0);
  const [status, setStatus] = useState<PlaybackStatus>('idle');

  const plan = useMemo(
    () => computePlaybackPlan(stops, totalDuration),
    [stops, totalDuration],
  );

  // RAF loop — only runs while status === 'playing'.
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (status !== 'playing') return;

    let cancelled = false;
    let lastTimestamp: number | null = null;

    const tick = (timestamp: number) => {
      if (cancelled) return;
      if (lastTimestamp === null) {
        lastTimestamp = timestamp;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      setTime((prev) => {
        const next = prev + delta;
        if (next >= plan.totalDuration) {
          setStatus('ended');
          return plan.totalDuration;
        }
        return next;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [status, plan.totalDuration]);

  const play = useCallback(() => {
    setStatus((s) => {
      if (s === 'idle' || s === 'ended') {
        setTime(0);
        return 'playing';
      }
      if (s === 'paused') return 'playing';
      return s;
    });
  }, []);

  const pause = useCallback(() => {
    setStatus((s) => (s === 'playing' ? 'paused' : s));
  }, []);

  const reset = useCallback(() => {
    setTime(0);
    setStatus('idle');
  }, []);

  const setTotalDuration = useCallback((seconds: number) => {
    setTotalDurationState(seconds);
    // Changing the duration always re-plays from the start at the new pace —
    // the user picked a new length specifically to see how it looks.
    setTime(0);
    setStatus('playing');
  }, []);

  const { legIndex, legProgress } = locateOnPlan(plan, time);

  return {
    status,
    time,
    legIndex,
    legProgress,
    totalDuration,
    plan,
    play,
    pause,
    reset,
    setTotalDuration,
  };
}
