import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber/native';
import { Line, LineBasicMaterial } from 'three';
import type { Stop } from '../types';
import { buildTripLegs } from './arcGeometry';
import { ARC_COLOR } from './constants';
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
  const { legs, lines } = useMemo(() => {
    const legs = buildTripLegs(stops);
    const material = new LineBasicMaterial({
      color: ARC_COLOR,
      transparent: true,
      opacity: 0.95,
    });
    const lines = legs.map((leg) => new Line(leg.geometry, material));
    return { legs, lines };
  }, [stops]);

  useFrame(() => {
    for (let i = 0; i < legs.length; i++) {
      const total = legs[i].vertexCount;
      let count: number;
      if (status === 'idle') {
        count = 0;
      } else if (status === 'ended') {
        count = total;
      } else if (i < legIndex) {
        count = total;
      } else if (i === legIndex) {
        count = Math.floor(total * legProgress);
      } else {
        count = 0;
      }
      legs[i].geometry.setDrawRange(0, count);
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
