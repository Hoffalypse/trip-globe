import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber/native';
import type { Mesh } from 'three';
import type { Stop } from '../types';
import { buildTripLegs } from './arcGeometry';
import type { PlaybackStatus } from './usePlayback';

interface TransportSpriteProps {
  stops: Stop[];
  status: PlaybackStatus;
  legIndex: number;
  legProgress: number;
}

/**
 * A small bright sphere that rides along the active arc as it draws itself.
 * Phase 3a uses a generic glowing dot — Phase 3b will replace this with a
 * billboarded transport icon (✈️ / 🚆 / 🚗) per the leg's transport type.
 *
 * Visibility:
 *   idle             → hidden (clean preview)
 *   playing | paused → at curve.getPoint(legProgress) on the active leg
 *   ended            → at the very last stop
 */
export function TransportSprite({
  stops,
  status,
  legIndex,
  legProgress,
}: TransportSpriteProps) {
  const ref = useRef<Mesh>(null);
  const legs = useMemo(() => buildTripLegs(stops), [stops]);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;

    if (status === 'idle' || legs.length === 0) {
      mesh.visible = false;
      return;
    }

    if (status === 'ended') {
      // Park at the very last point of the last arc.
      const last = legs[legs.length - 1];
      const point = last.curve.getPoint(1);
      mesh.position.copy(point);
      mesh.visible = true;
      return;
    }

    // playing | paused
    if (legIndex < 0 || legIndex >= legs.length) {
      mesh.visible = false;
      return;
    }
    const point = legs[legIndex].curve.getPoint(legProgress);
    mesh.position.copy(point);
    mesh.visible = true;
  });

  return (
    <mesh ref={ref} visible={false}>
      <sphereGeometry args={[0.022, 16, 16]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive="#ffffff"
        emissiveIntensity={1.4}
      />
    </mesh>
  );
}
