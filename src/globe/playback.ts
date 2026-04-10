import type { Stop } from '../types';
import { haversineMiles } from '../lib/distance';

/**
 * Pure pacing math for the trip animation. No React, no globals, no time
 * source — these functions just translate (stops, totalDuration) into a
 * schedule, and (schedule, time) into a current position.
 */

export interface PlaybackPlan {
  /** Total animation length in seconds. */
  totalDuration: number;
  /** Per-leg duration in seconds. Length = stops.length - 1. */
  legDurations: number[];
  /**
   * Cumulative leg start times in seconds. Length = stops.length.
   * legStartTimes[i] is when leg i (from stop i to stop i+1) begins.
   * legStartTimes[stops.length - 1] === totalDuration (end of last leg).
   */
  legStartTimes: number[];
}

/** Smallest leg duration we'll ever produce — keeps short hops watchable. */
export const MIN_LEG_SECONDS = 0.8;

export interface LocatedPosition {
  /**
   * Index of the active leg (-1 if no legs, or stops.length-1 with progress=1
   * once the animation ends). A leg with index `i` runs from stop `i` to
   * stop `i+1`.
   */
  legIndex: number;
  /** 0..1 progress within the active leg. */
  legProgress: number;
  /** True once we've reached the end of the last leg. */
  done: boolean;
}

/**
 * Build a playback plan with distance-proportional leg durations.
 *
 * Each leg is allocated time proportional to its great-circle distance, but
 * with a per-leg floor (MIN_LEG_SECONDS) so short hops remain watchable. The
 * floor is applied first, then the remaining time is distributed by distance
 * share, then the result is renormalized so the sum exactly equals
 * totalDuration.
 */
export function computePlaybackPlan(
  stops: Stop[],
  totalDuration: number,
): PlaybackPlan {
  if (stops.length < 2 || totalDuration <= 0) {
    return { totalDuration, legDurations: [], legStartTimes: [0] };
  }

  const distances: number[] = [];
  let totalDistance = 0;
  for (let i = 1; i < stops.length; i++) {
    const d = haversineMiles(stops[i - 1], stops[i]);
    distances.push(d);
    totalDistance += d;
  }

  let legDurations: number[];

  // Edge case: all stops at the same point — split evenly.
  if (totalDistance === 0) {
    legDurations = distances.map(() => totalDuration / distances.length);
    return finalizePlan(legDurations, totalDuration);
  }

  const minTotal = MIN_LEG_SECONDS * distances.length;
  if (totalDuration <= minTotal) {
    // Not enough budget for the floor — split the user's chosen duration evenly.
    legDurations = distances.map(() => totalDuration / distances.length);
  } else {
    const remaining = totalDuration - minTotal;
    legDurations = distances.map(
      (d) => MIN_LEG_SECONDS + (remaining * d) / totalDistance,
    );
  }

  return finalizePlan(legDurations, totalDuration);
}

function finalizePlan(
  legDurations: number[],
  totalDuration: number,
): PlaybackPlan {
  // Renormalize defensively — float drift in the math above could leave the
  // sum off by a fraction of a microsecond.
  const sum = legDurations.reduce((a, b) => a + b, 0);
  if (sum > 0 && Math.abs(sum - totalDuration) > 1e-9) {
    const scale = totalDuration / sum;
    for (let i = 0; i < legDurations.length; i++) {
      legDurations[i] *= scale;
    }
  }

  const legStartTimes: number[] = [0];
  let acc = 0;
  for (const d of legDurations) {
    acc += d;
    legStartTimes.push(acc);
  }
  return { totalDuration, legDurations, legStartTimes };
}

/**
 * Given an absolute time (seconds since playback started), find which leg
 * we're on and how far through it we are.
 */
export function locateOnPlan(
  plan: PlaybackPlan,
  time: number,
): LocatedPosition {
  if (plan.legDurations.length === 0) {
    return { legIndex: -1, legProgress: 0, done: true };
  }
  if (time <= 0) {
    return { legIndex: 0, legProgress: 0, done: false };
  }
  if (time >= plan.totalDuration) {
    return {
      legIndex: plan.legDurations.length - 1,
      legProgress: 1,
      done: true,
    };
  }
  for (let i = 0; i < plan.legDurations.length; i++) {
    const start = plan.legStartTimes[i];
    const end = plan.legStartTimes[i + 1];
    if (time < end) {
      const span = end - start;
      const progress = span > 0 ? (time - start) / span : 0;
      return { legIndex: i, legProgress: progress, done: false };
    }
  }
  return {
    legIndex: plan.legDurations.length - 1,
    legProgress: 1,
    done: true,
  };
}
