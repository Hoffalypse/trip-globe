import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber/native';
import { Vector3 } from 'three';
import type { Stop } from '../types';
import { latLngToVec3 } from './latLngToVec3';
import { haversineMiles } from '../lib/distance';
import type { PlaybackStatus } from './usePlayback';

interface CameraRigProps {
  stops: Stop[];
  status: PlaybackStatus;
  legIndex: number;
  legProgress: number;
}

const CAMERA_DISTANCE_MIN = 2.8;
const CAMERA_DISTANCE_MAX = 4.2;
const LONG_LEG_THRESHOLD = 6000;
const LERP_FACTOR = 0.05;

export function CameraRig({
  stops,
  status,
  legIndex,
  legProgress,
}: CameraRigProps) {
  const { camera } = useThree();
  const target = useRef(new Vector3());
  const tmpFrom = useRef(new Vector3());
  const tmpTo = useRef(new Vector3());
  const initialized = useRef(false);

  const centroid = useMemo(() => {
    if (stops.length === 0) return new Vector3(0, 0, 1);
    const sum = new Vector3();
    for (const s of stops) {
      sum.add(latLngToVec3(s.lat, s.lng, 1));
    }
    return sum.multiplyScalar(1 / stops.length).normalize();
  }, [stops]);

  useFrame(() => {
    // Stop updating camera when ended — GlobeOrbit handles interaction
    if (status === 'ended') return;

    let focusDir: Vector3;
    let dist = CAMERA_DISTANCE_MIN;

    if (status === 'idle' || stops.length < 2) {
      focusDir = centroid;
    } else {
      const i = Math.max(0, Math.min(stops.length - 2, legIndex));
      tmpFrom.current
        .copy(latLngToVec3(stops[i].lat, stops[i].lng, 1))
        .normalize();
      tmpTo.current
        .copy(latLngToVec3(stops[i + 1].lat, stops[i + 1].lng, 1))
        .normalize();
      focusDir = tmpFrom.current
        .clone()
        .lerp(tmpTo.current, legProgress)
        .normalize();

      const legMiles = haversineMiles(
        { lat: stops[i].lat, lng: stops[i].lng },
        { lat: stops[i + 1].lat, lng: stops[i + 1].lng },
      );
      const t = Math.min(1, legMiles / LONG_LEG_THRESHOLD);
      dist = CAMERA_DISTANCE_MIN + t * (CAMERA_DISTANCE_MAX - CAMERA_DISTANCE_MIN);
    }

    target.current.copy(focusDir).multiplyScalar(dist);

    if (!initialized.current) {
      camera.position.copy(target.current);
      initialized.current = true;
    } else {
      camera.position.lerp(target.current, LERP_FACTOR);
    }
    camera.lookAt(0, 0, 0);
  });

  return null;
}
