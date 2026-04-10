import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber/native';
import { Float32BufferAttribute, Line, LineBasicMaterial } from 'three';
import type { Stop } from '../types';
import { buildTripLegs } from './arcGeometry';
import { ARC_COLOR, ARC_SEGMENTS } from './constants';
import type { PlaybackStatus } from './usePlayback';

interface AnimatedTrailProps {
  stops: Stop[];
  status: PlaybackStatus;
  legIndex: number;
  legProgress: number;
}

/**
 * Renders the trip's arcs as Lines, mutating each leg's drawRange every
 * frame so the active leg appears to "draw itself" along the arc.
 *
 * The last drawn vertex is interpolated to match the transport sprite's
 * exact position so the line always connects to the dot.
 *
 * Visibility rules per leg `i`:
 *   status idle           → no arcs drawn (clean slate)
 *   status ended          → all arcs fully drawn (final state)
 *   status playing|paused
 *     i  < legIndex       → fully drawn
 *     i == legIndex       → drawn up to legProgress
 *     i  > legIndex       → not drawn
 */
export function AnimatedTrail({
  stops,
  status,
  legIndex,
  legProgress,
}: AnimatedTrailProps) {
  const { legs, lines, originalPositions } = useMemo(() => {
    const legs = buildTripLegs(stops);
    const material = new LineBasicMaterial({
      color: ARC_COLOR,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
    });
    const lines = legs.map((leg) => new Line(leg.geometry, material));
    // Store a copy of the original vertex positions so we can restore them
    // after overwriting the tip vertex each frame.
    const originalPositions = legs.map((leg) => {
      const attr = leg.geometry.getAttribute('position') as Float32BufferAttribute;
      return new Float32Array(attr.array);
    });
    return { legs, lines, originalPositions };
  }, [stops]);

  useFrame(() => {
    for (let i = 0; i < legs.length; i++) {
      const total = legs[i].vertexCount;
      const attr = legs[i].geometry.getAttribute('position') as Float32BufferAttribute;

      if (status === 'idle') {
        legs[i].geometry.setDrawRange(0, 0);
        continue;
      }

      if (status === 'ended' || i < legIndex) {
        // Restore the last vertex to its original position
        const orig = originalPositions[i];
        const lastIdx = total - 1;
        attr.setXYZ(lastIdx, orig[lastIdx * 3], orig[lastIdx * 3 + 1], orig[lastIdx * 3 + 2]);
        attr.needsUpdate = true;
        legs[i].geometry.setDrawRange(0, total);
        continue;
      }

      if (i > legIndex) {
        legs[i].geometry.setDrawRange(0, 0);
        continue;
      }

      // Active leg: draw up to the interpolated tip vertex
      const exactIdx = legProgress * ARC_SEGMENTS;
      const drawCount = Math.floor(exactIdx) + 2; // +1 for the tip vertex, +1 because drawRange count is exclusive
      const clamped = Math.min(drawCount, total);

      // Sample the curve at the exact progress to get the tip position
      const tipPoint = legs[i].curve.getPoint(legProgress);

      // Restore the previous tip vertex to its original position
      const orig = originalPositions[i];
      const prevTip = clamped - 2;
      if (prevTip >= 0) {
        attr.setXYZ(prevTip, orig[prevTip * 3], orig[prevTip * 3 + 1], orig[prevTip * 3 + 2]);
      }

      // Overwrite the last drawn vertex with the exact interpolated position
      const tipIdx = clamped - 1;
      attr.setXYZ(tipIdx, tipPoint.x, tipPoint.y, tipPoint.z);
      attr.needsUpdate = true;

      legs[i].geometry.setDrawRange(0, clamped);
    }
  });

  return (
    <group>
      {lines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  );
}
