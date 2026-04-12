import { useRef } from 'react';
import type { RefObject, ReactNode } from 'react';
import { useFrame } from '@react-three/fiber/native';
import type { Group } from 'three';

interface GlobeOrbitProps {
  enabled: boolean;
  orbitDelta: RefObject<{ dx: number; dy: number }>;
  children: ReactNode;
}

const ROTATE_SPEED = 0.005;

/**
 * Wraps the globe scene in a group that can be rotated by touch drag
 * after the animation ends. Tracks the previous delta to compute
 * frame-by-frame increments, and ignores the reset to zero on release
 * so the globe stays where the user left it.
 */
export function GlobeOrbit({ enabled, orbitDelta, children }: GlobeOrbitProps) {
  const groupRef = useRef<Group>(null);
  const prevDelta = useRef({ dx: 0, dy: 0 });
  const dragging = useRef(false);

  useFrame(() => {
    if (!enabled || !groupRef.current) return;

    const { dx, dy } = orbitDelta.current;
    const isActive = dx !== 0 || dy !== 0;

    if (isActive) {
      if (!dragging.current) {
        // Drag just started — reset baseline
        dragging.current = true;
        prevDelta.current = { dx, dy };
        return;
      }

      const ddx = dx - prevDelta.current.dx;
      const ddy = dy - prevDelta.current.dy;
      prevDelta.current = { dx, dy };

      groupRef.current.rotation.y += ddx * ROTATE_SPEED;
      groupRef.current.rotation.x += ddy * ROTATE_SPEED;
      groupRef.current.rotation.x = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, groupRef.current.rotation.x),
      );
    } else {
      // Finger lifted — stop tracking but keep current rotation
      dragging.current = false;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}
