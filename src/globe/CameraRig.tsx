import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber/native';
import { Vector3 } from 'three';
import type { Stop } from '../types';
import { latLngToVec3 } from './latLngToVec3';
import type { PlaybackStatus } from './usePlayback';

interface CameraRigProps {
  stops: Stop[];
  status: PlaybackStatus;
  legIndex: number;
  legProgress: number;
}

const CAMERA_DISTANCE = 2.8;
/** How aggressively the camera lerps toward its target each frame. */
const LERP_FACTOR = 0.05;

/**
 * Animated camera that orbits the globe to keep the active leg in view.
 *
 * Strategy:
 *   - In idle/ended, sit slightly above the globe's centroid of stops so the
 *     whole trip is visible at once.
 *   - In playing/paused, smoothly track the active leg by interpolating
 *     between the previous stop's surface position and the next stop's, then
 *     pulling the camera back along that point's surface normal.
 *
 * The camera is lerped toward the target each frame rather than snapped, so
 * leg transitions are visually smooth even though the playback state machine
 * snaps cleanly between legs.
 */
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

  // Centroid of all stops on the surface — used as the resting view target
  // when the trip isn't actively playing.
  const centroid = useMemo(() => {
    if (stops.length === 0) return new Vector3(0, 0, 1);
    const sum = new Vector3();
    for (const s of stops) {
      sum.add(latLngToVec3(s.lat, s.lng, 1));
    }
    return sum.multiplyScalar(1 / stops.length).normalize();
  }, [stops]);

  useFrame(() => {
    let focusDir: Vector3;

    if (status === 'idle' || stops.length < 2) {
      focusDir = centroid;
    } else if (status === 'ended') {
      // Park looking at the final stop.
      const last = stops[stops.length - 1];
      focusDir = latLngToVec3(last.lat, last.lng, 1).normalize();
    } else {
      // playing | paused — interpolate along the active leg.
      const i = Math.max(0, Math.min(stops.length - 2, legIndex));
      tmpFrom.current
        .copy(latLngToVec3(stops[i].lat, stops[i].lng, 1))
        .normalize();
      tmpTo.current
        .copy(latLngToVec3(stops[i + 1].lat, stops[i + 1].lng, 1))
        .normalize();
      // Slerp via lerp + renormalize is fine for the small angles per frame.
      focusDir = tmpFrom.current
        .clone()
        .lerp(tmpTo.current, legProgress)
        .normalize();
    }

    target.current.copy(focusDir).multiplyScalar(CAMERA_DISTANCE);

    if (!initialized.current) {
      // First frame: snap directly to the target so we don't lerp from the
      // Canvas's default starting position. Without this snap the user sees
      // a one-time pan from (0, 0.6, 2.8) to the active leg, which reads as
      // "the globe moved weirdly when I opened it".
      camera.position.copy(target.current);
      initialized.current = true;
    } else {
      camera.position.lerp(target.current, LERP_FACTOR);
    }
    camera.lookAt(0, 0, 0);
  });

  return null;
}
