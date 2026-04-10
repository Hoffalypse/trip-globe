import { useMemo } from 'react';
import type { Stop } from '../types';
import { latLngToVec3 } from './latLngToVec3';
import {
  MARKER_LIFT,
  STOP_MARKER_COLOR,
  STOP_MARKER_RADIUS,
} from './constants';

interface StopMarkersProps {
  stops: Stop[];
}

export function StopMarkers({ stops }: StopMarkersProps) {
  const positions = useMemo(
    () => stops.map((s) => latLngToVec3(s.lat, s.lng, MARKER_LIFT)),
    [stops],
  );

  return (
    <group>
      {positions.map((p, i) => (
        <mesh key={stops[i].id} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[STOP_MARKER_RADIUS, 16, 16]} />
          <meshStandardMaterial
            color={STOP_MARKER_COLOR}
            emissive={STOP_MARKER_COLOR}
            emissiveIntensity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}
