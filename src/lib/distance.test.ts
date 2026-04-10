import { describe, it, expect } from 'vitest';
import {
  haversineMiles,
  totalTripMiles,
  uniqueCountryCount,
} from './distance';

// Known reference coordinates
const JFK = { lat: 40.6413, lng: -73.7781 };
const LAX = { lat: 33.9416, lng: -118.4085 };
const LHR = { lat: 51.47, lng: -0.4543 };
const CDG = { lat: 49.0097, lng: 2.5479 };

describe('haversineMiles', () => {
  it('returns 0 for identical points', () => {
    expect(haversineMiles(JFK, JFK)).toBe(0);
  });

  it('computes JFK to LAX (~2475 miles)', () => {
    const d = haversineMiles(JFK, LAX);
    expect(d).toBeGreaterThan(2450);
    expect(d).toBeLessThan(2500);
  });

  it('computes LHR to CDG (~214 miles)', () => {
    const d = haversineMiles(LHR, CDG);
    expect(d).toBeGreaterThan(200);
    expect(d).toBeLessThan(230);
  });

  it('is symmetric', () => {
    expect(haversineMiles(JFK, LAX)).toBeCloseTo(haversineMiles(LAX, JFK), 6);
  });
});

describe('totalTripMiles', () => {
  it('returns 0 for fewer than 2 points', () => {
    expect(totalTripMiles([])).toBe(0);
    expect(totalTripMiles([JFK])).toBe(0);
  });

  it('sums consecutive leg distances', () => {
    const total = totalTripMiles([JFK, LAX, LHR]);
    const expected = haversineMiles(JFK, LAX) + haversineMiles(LAX, LHR);
    expect(total).toBeCloseTo(expected, 6);
  });
});

describe('uniqueCountryCount', () => {
  it('counts distinct country codes', () => {
    const stops = [
      { countryCode: 'US' },
      { countryCode: 'us' },
      { countryCode: 'FR' },
      { countryCode: 'GB' },
    ];
    expect(uniqueCountryCount(stops)).toBe(3);
  });

  it('ignores empty country codes', () => {
    expect(uniqueCountryCount([{ countryCode: '' }, { countryCode: 'US' }])).toBe(
      1,
    );
  });
});
