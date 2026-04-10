import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { greatCirclePoints } from './greatCircle';

describe('greatCirclePoints', () => {
  const xAxis = new Vector3(1, 0, 0);
  const yAxis = new Vector3(0, 1, 0);

  it('returns segments+1 points', () => {
    const pts = greatCirclePoints(xAxis, yAxis, 8);
    expect(pts).toHaveLength(9);
  });

  it('starts at a and ends at b', () => {
    const pts = greatCirclePoints(xAxis, yAxis, 4);
    expect(pts[0].x).toBeCloseTo(1);
    expect(pts[0].y).toBeCloseTo(0);
    expect(pts[pts.length - 1].x).toBeCloseTo(0);
    expect(pts[pts.length - 1].y).toBeCloseTo(1);
  });

  it('midpoint of perpendicular unit vectors is on the bisector', () => {
    const pts = greatCirclePoints(xAxis, yAxis, 2);
    const mid = pts[1];
    expect(mid.x).toBeCloseTo(Math.SQRT1_2);
    expect(mid.y).toBeCloseTo(Math.SQRT1_2);
    expect(mid.z).toBeCloseTo(0);
  });

  it('preserves radius along the arc', () => {
    const a = new Vector3(2, 0, 0);
    const b = new Vector3(0, 0, 2);
    const pts = greatCirclePoints(a, b, 16);
    for (const p of pts) {
      expect(p.length()).toBeCloseTo(2, 5);
    }
  });

  it('handles coincident endpoints without NaN', () => {
    const pts = greatCirclePoints(xAxis, xAxis, 4);
    expect(pts).toHaveLength(5);
    for (const p of pts) {
      expect(Number.isNaN(p.x)).toBe(false);
      expect(p.x).toBeCloseTo(1);
    }
  });
});
