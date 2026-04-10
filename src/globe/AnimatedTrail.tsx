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

  // Track which vertex was last overwritten per leg so we can restore it.
  const dirtyVertex = useMemo(() => new Int32Array(legs.length).fill(-1), [legs]);

  useFrame(() => {
    for (let i = 0; i < legs.length; i++) {
      const total = legs[i].vertexCount;
      const attr = legs[i].geometry.getAttribute('position') as Float32BufferAttribute;
      const orig = originalPositions[i];

      // Always restore the previously overwritten vertex first
      if (dirtyVertex[i] >= 0) {
        const d = dirtyVertex[i];
        attr.setXYZ(d, orig[d * 3], orig[d * 3 + 1], orig[d * 3 + 2]);
        dirtyVertex[i] = -1;
        attr.needsUpdate = true;
      }

      if (status === 'idle') {
        legs[i].geometry.setDrawRange(0, 0);
        continue;
      }

      if (status === 'ended' || i < legIndex) {
        legs[i].geometry.setDrawRange(0, total);
        continue;
      }

      if (i > legIndex) {
        legs[i].geometry.setDrawRange(0, 0);
        continue;
      }

      // Active leg: draw up to the interpolated tip vertex
      const exactIdx = legProgress * ARC_SEGMENTS;
      const drawCount = Math.floor(exactIdx) + 2;
      const clamped = Math.min(drawCount, total);

      // Sample the curve at the exact progress to get the tip position
      const tipPoint = legs[i].curve.getPoint(legProgress);

      // Overwrite the last drawn vertex with the exact interpolated position
      const tipIdx = clamped - 1;
      attr.setXYZ(tipIdx, tipPoint.x, tipPoint.y, tipPoint.z);
      attr.needsUpdate = true;
      dirtyVertex[i] = tipIdx;

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
