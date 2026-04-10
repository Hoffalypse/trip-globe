import { describe, it, expect } from 'vitest';
import { latLngToVec3 } from './latLngToVec3';

function expectVec(actual: { x: number; y: number; z: number }, x: number, y: number, z: number) {
  expect(actual.x).toBeCloseTo(x, 6);
  expect(actual.y).toBeCloseTo(y, 6);
  expect(actual.z).toBeCloseTo(z, 6);
}

describe('latLngToVec3', () => {
  it('places (0,0) on the +X axis', () => {
    expectVec(latLngToVec3(0, 0, 1), 1, 0, 0);
  });

  it('places the north pole on +Y', () => {
    expectVec(latLngToVec3(90, 0, 1), 0, 1, 0);
  });

  it('places the south pole on -Y', () => {
    expectVec(latLngToVec3(-90, 0, 1), 0, -1, 0);
  });

  it('places (0, 90) on -Z (east is into the screen from +Z camera)', () => {
    expectVec(latLngToVec3(0, 90, 1), 0, 0, -1);
  });

  it('places (0, -90) on +Z (west is toward the +Z camera)', () => {
    expectVec(latLngToVec3(0, -90, 1), 0, 0, 1);
  });

  it('places east longitudes to the camera-right of west longitudes', () => {
    // Camera at +Z looking at origin: +X is screen-right.
    // Florida (lng=-80) should appear right of California (lng=-120) when
    // both are visible, since Florida is east of California.
    const florida = latLngToVec3(27, -80, 1);
    const california = latLngToVec3(37, -120, 1);
    expect(florida.x).toBeGreaterThan(california.x);
  });

  it('places (0, 180) on -X (antimeridian)', () => {
    expectVec(latLngToVec3(0, 180, 1), -1, 0, 0);
  });

  it('scales by radius', () => {
    const v = latLngToVec3(0, 0, 5);
    expectVec(v, 5, 0, 0);
  });

  it('produces unit-length vectors on a unit sphere for arbitrary points', () => {
    const v = latLngToVec3(40.7128, -74.006, 1); // NYC
    expect(v.length()).toBeCloseTo(1, 6);
  });
});
