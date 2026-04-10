import { describe, it, expect } from 'vitest';
import { TRANSPORT_TYPES } from '../types';
import {
  TRANSPORT_ARC_HEIGHT,
  DEFAULT_ARC_HEIGHT,
  arcHeightFor,
} from './transportArcHeights';

describe('transportArcHeights', () => {
  it('has an entry for every TransportType', () => {
    for (const t of TRANSPORT_TYPES) {
      expect(TRANSPORT_ARC_HEIGHT[t]).toBeGreaterThan(0);
    }
  });

  it('plane is the highest arc', () => {
    const heights = Object.values(TRANSPORT_ARC_HEIGHT);
    expect(TRANSPORT_ARC_HEIGHT.plane).toBe(Math.max(...heights));
  });

  it('walk is the lowest arc', () => {
    const heights = Object.values(TRANSPORT_ARC_HEIGHT);
    expect(TRANSPORT_ARC_HEIGHT.walk).toBe(Math.min(...heights));
  });

  it('arcHeightFor falls back to DEFAULT_ARC_HEIGHT for undefined', () => {
    expect(arcHeightFor(undefined)).toBe(DEFAULT_ARC_HEIGHT);
  });

  it('arcHeightFor returns the table value for a known transport', () => {
    expect(arcHeightFor('plane')).toBe(TRANSPORT_ARC_HEIGHT.plane);
    expect(arcHeightFor('train')).toBe(TRANSPORT_ARC_HEIGHT.train);
  });
});
