import { Vector3 } from 'three';

/**
 * Spherical linear interpolation (slerp) between two points on a sphere.
 * Both inputs must lie on the same sphere (i.e. have equal length).
 *
 * Returns `segments + 1` points from `a` (t=0) to `b` (t=1) inclusive.
 *
 * Used for:
 *  - drawing great-circle arcs between trip stops
 *  - subdividing GeoJSON polygon edges so they curve along the sphere
 *    instead of cutting straight chords through the globe.
 */
export function greatCirclePoints(
  a: Vector3,
  b: Vector3,
  segments: number,
): Vector3[] {
  if (segments < 1) return [a.clone(), b.clone()];

  const radius = a.length();
  const dot = Math.min(1, Math.max(-1, a.dot(b) / (radius * radius)));
  const omega = Math.acos(dot);

  // Endpoints are coincident — nothing to interpolate.
  if (omega < 1e-9) {
    return Array.from({ length: segments + 1 }, () => a.clone());
  }

  const sinOmega = Math.sin(omega);
  const out: Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const k1 = Math.sin((1 - t) * omega) / sinOmega;
    const k2 = Math.sin(t * omega) / sinOmega;
    out.push(
      new Vector3(
        a.x * k1 + b.x * k2,
        a.y * k1 + b.y * k2,
        a.z * k1 + b.z * k2,
      ),
    );
  }
  return out;
}
