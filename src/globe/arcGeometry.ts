import {
  BufferGeometry,
  Float32BufferAttribute,
  QuadraticBezierCurve3,
  Vector3,
} from 'three';
import type { Stop } from '../types';
import { latLngToVec3 } from './latLngToVec3';
import { arcHeightFor } from './transportArcHeights';
import { ARC_BASE_LIFT, ARC_SEGMENTS } from './constants';

/**
 * Build a quadratic-bezier arc curve between two surface points. The control
 * point is the midpoint of the chord pushed outward along the surface normal
 * by `arcHeight` (a fraction of the radius). Planes get a tall arc, walks
 * get a flat one — see transportArcHeights.ts.
 *
 * Returned QuadraticBezierCurve3 can be reused for both rendering (sample N
 * points → BufferGeometry) and runtime sampling (e.g. positioning the
 * transport sprite at curve.getPoint(t)).
 */
export function buildArcCurve(
  from: Vector3,
  to: Vector3,
  arcHeight: number,
): QuadraticBezierCurve3 {
  const mid = new Vector3().addVectors(from, to).multiplyScalar(0.5);
  const surfaceMid = mid.clone().normalize().multiplyScalar(ARC_BASE_LIFT);
  const control = surfaceMid.clone().multiplyScalar(1 + arcHeight);
  return new QuadraticBezierCurve3(from, control, to);
}

/**
 * Sample an arc curve into a BufferGeometry suitable for THREE.Line.
 */
export function arcCurveToGeometry(
  curve: QuadraticBezierCurve3,
  segments: number = ARC_SEGMENTS,
): BufferGeometry {
  const points = curve.getPoints(segments);
  const positions = new Float32Array(points.length * 3);
  for (let i = 0; i < points.length; i++) {
    positions[i * 3 + 0] = points[i].x;
    positions[i * 3 + 1] = points[i].y;
    positions[i * 3 + 2] = points[i].z;
  }
  const geom = new BufferGeometry();
  geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return geom;
}

export interface TripLeg {
  fromIndex: number;
  toIndex: number;
  curve: QuadraticBezierCurve3;
  geometry: BufferGeometry;
  /** Number of vertices in `geometry`. */
  vertexCount: number;
}

/**
 * Build per-leg curves and geometries for a trip. Used by AnimatedTrail
 * (renders the lines + mutates drawRange) and by TransportSprite (samples
 * curve.getPoint(t) to position the moving dot).
 */
export function buildTripLegs(stops: Stop[]): TripLeg[] {
  if (stops.length < 2) return [];
  const result: TripLeg[] = [];
  for (let i = 1; i < stops.length; i++) {
    const prev = stops[i - 1];
    const curr = stops[i];
    const from = latLngToVec3(prev.lat, prev.lng, ARC_BASE_LIFT);
    const to = latLngToVec3(curr.lat, curr.lng, ARC_BASE_LIFT);
    const curve = buildArcCurve(from, to, arcHeightFor(curr.transportFromPrevious));
    const geometry = arcCurveToGeometry(curve);
    result.push({
      fromIndex: i - 1,
      toIndex: i,
      curve,
      geometry,
      vertexCount: ARC_SEGMENTS + 1,
    });
  }
  return result;
}
