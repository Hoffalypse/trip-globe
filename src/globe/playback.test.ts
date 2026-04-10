import { describe, it, expect } from 'vitest';
import {
  computePlaybackPlan,
  locateOnPlan,
  MIN_LEG_SECONDS,
} from './playback';
import type { Stop } from '../types';

function stop(name: string, lat: number, lng: number): Stop {
  return {
    id: name,
    name,
    lat,
    lng,
    countryCode: 'XX',
    arrivedAt: '2025-01-01T00:00:00.000Z',
  };
}

const NYC = stop('NYC', 40.7128, -74.006);
const LON = stop('LON', 51.5074, -0.1278);
const PAR = stop('PAR', 48.8566, 2.3522);
// LON→PAR is ~213 miles; NYC→LON is ~3463 miles. So leg 0 should get ~16x
// more time than leg 1 in distance-proportional pacing.

describe('computePlaybackPlan', () => {
  it('returns an empty plan for fewer than 2 stops', () => {
    const plan = computePlaybackPlan([NYC], 30);
    expect(plan.legDurations).toEqual([]);
    expect(plan.legStartTimes).toEqual([0]);
  });

  it('legDurations sum exactly equals totalDuration', () => {
    const plan = computePlaybackPlan([NYC, LON, PAR], 30);
    const sum = plan.legDurations.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(30, 9);
  });

  it('legStartTimes is cumulative and ends at totalDuration', () => {
    const plan = computePlaybackPlan([NYC, LON, PAR], 30);
    expect(plan.legStartTimes[0]).toBe(0);
    expect(plan.legStartTimes[plan.legStartTimes.length - 1]).toBeCloseTo(30, 9);
    for (let i = 1; i < plan.legStartTimes.length; i++) {
      expect(plan.legStartTimes[i]).toBeGreaterThan(plan.legStartTimes[i - 1]);
    }
  });

  it('longer legs get proportionally more time (NYC→LON >> LON→PAR)', () => {
    const plan = computePlaybackPlan([NYC, LON, PAR], 30);
    expect(plan.legDurations[0]).toBeGreaterThan(plan.legDurations[1] * 5);
  });

  it('respects the per-leg floor when budget allows', () => {
    const plan = computePlaybackPlan([NYC, LON, PAR], 30);
    for (const d of plan.legDurations) {
      expect(d).toBeGreaterThanOrEqual(MIN_LEG_SECONDS - 1e-9);
    }
  });

  it('falls back to even split when totalDuration is below the floor sum', () => {
    const plan = computePlaybackPlan([NYC, LON, PAR], 0.5);
    expect(plan.legDurations[0]).toBeCloseTo(0.25);
    expect(plan.legDurations[1]).toBeCloseTo(0.25);
  });

  it('handles coincident stops (zero distance) by splitting evenly', () => {
    const same = stop('SAME', 0, 0);
    const plan = computePlaybackPlan([same, same, same], 10);
    expect(plan.legDurations).toHaveLength(2);
    expect(plan.legDurations[0]).toBeCloseTo(5);
    expect(plan.legDurations[1]).toBeCloseTo(5);
  });
});

describe('locateOnPlan', () => {
  const plan = computePlaybackPlan([NYC, LON, PAR], 30);

  it('time <= 0 returns leg 0 at progress 0', () => {
    const pos = locateOnPlan(plan, 0);
    expect(pos.legIndex).toBe(0);
    expect(pos.legProgress).toBe(0);
    expect(pos.done).toBe(false);
  });

  it('time >= totalDuration returns the last leg at progress 1, done=true', () => {
    const pos = locateOnPlan(plan, 100);
    expect(pos.legIndex).toBe(1);
    expect(pos.legProgress).toBe(1);
    expect(pos.done).toBe(true);
  });

  it('time at exactly the boundary lands on the next leg at progress 0', () => {
    const boundary = plan.legStartTimes[1];
    const pos = locateOnPlan(plan, boundary);
    expect(pos.legIndex).toBe(1);
    expect(pos.legProgress).toBeCloseTo(0);
  });

  it('time mid-leg returns the right progress fraction', () => {
    const start = plan.legStartTimes[0];
    const end = plan.legStartTimes[1];
    const mid = start + (end - start) / 2;
    const pos = locateOnPlan(plan, mid);
    expect(pos.legIndex).toBe(0);
    expect(pos.legProgress).toBeCloseTo(0.5);
  });

  it('returns done=true with no legs when stops < 2', () => {
    const empty = computePlaybackPlan([NYC], 10);
    const pos = locateOnPlan(empty, 5);
    expect(pos.done).toBe(true);
    expect(pos.legIndex).toBe(-1);
  });
});
