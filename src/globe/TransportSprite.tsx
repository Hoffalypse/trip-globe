import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber/native';
import { Vector3, type Mesh } from 'three';
import type { Stop } from '../types';
import { buildTripLegs } from './arcGeometry';
import type { PlaybackStatus } from './usePlayback';

export interface SpriteOverlayData {
  visible: boolean;
  x: number;
  y: number;
  /** Rotation in degrees — 0 = pointing right, 90 = pointing down. */
  rotation: number;
  transportType: string | undefined;
}

interface TransportSpriteProps {
  stops: Stop[];
  status: PlaybackStatus;
  legIndex: number;
  legProgress: number;
  /** Shared ref — written every frame with screen-space position + transport type. */
  overlayRef: React.RefObject<SpriteOverlayData>;
}

const _projected = new Vector3();
const _ahead = new Vector3();

/**
 * Invisible 3D anchor that tracks the active arc position and projects
 * its world coordinates to screen space each frame. The actual visible
 * icon is rendered as a React Native overlay in globe.tsx using the
 * shared overlayRef — this gives crisp emoji rendering instead of
 * blurry WebGL text.
 */
export function TransportSprite({
  stops,
  status,
  legIndex,
  legProgress,
  overlayRef,
}: TransportSpriteProps) {
  const ref = useRef<Mesh>(null);
  const legs = useMemo(() => buildTripLegs(stops), [stops]);
  const { camera, size } = useThree();

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;

    const hidden: SpriteOverlayData = {
      visible: false, x: 0, y: 0, rotation: 0, transportType: undefined,
    };

    if (status === 'idle' || legs.length === 0) {
      mesh.visible = false;
      overlayRef.current = hidden;
      return;
    }

    let point: Vector3;
    let aheadPoint: Vector3;
    let transportType: string | undefined;

    if (status === 'ended') {
      const last = legs[legs.length - 1];
      point = last.curve.getPoint(1);
      aheadPoint = last.curve.getPoint(0.99);
      transportType = stops[stops.length - 1].transportFromPrevious;
    } else if (legIndex < 0 || legIndex >= legs.length) {
      mesh.visible = false;
      overlayRef.current = hidden;
      return;
    } else {
      point = legs[legIndex].curve.getPoint(legProgress);
      const aheadT = Math.min(1, legProgress + 0.01);
      aheadPoint = legs[legIndex].curve.getPoint(aheadT);
      transportType = stops[legIndex + 1]?.transportFromPrevious;
    }

    mesh.position.copy(point);
    mesh.visible = false;

    // Project current position to screen
    _projected.copy(point).project(camera);
    const x = ((_projected.x + 1) / 2) * size.width;
    const y = ((1 - _projected.y) / 2) * size.height;

    // Project a point slightly ahead to compute travel direction
    _ahead.copy(aheadPoint).project(camera);
    const ax = ((_ahead.x + 1) / 2) * size.width;
    const ay = ((1 - _ahead.y) / 2) * size.height;

    // Angle in degrees from current to ahead point
    const rotation = Math.atan2(ay - y, ax - x) * (180 / Math.PI);

    const visible = _projected.z < 1;
    overlayRef.current = { visible, x, y, rotation, transportType };
  });

  return (
    <mesh ref={ref} visible={false}>
      <sphereGeometry args={[0.001, 4, 4]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}
