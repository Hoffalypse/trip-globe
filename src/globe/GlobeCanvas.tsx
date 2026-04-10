import { Canvas } from '@react-three/fiber/native';
import type { Stop } from '../types';
import { Earth } from './Earth';
import { Countries } from './Countries';
import { StopMarkers } from './StopMarkers';
import { AnimatedTrail } from './AnimatedTrail';
import { TransportSprite } from './TransportSprite';
import { CameraRig } from './CameraRig';
import type { PlaybackState } from './usePlayback';

interface GlobeCanvasProps {
  stops: Stop[];
  playback: PlaybackState;
}

/**
 * Phase 3 globe scene. The CameraRig owns the camera (follows the active
 * leg or sits at the trip centroid when idle). AnimatedTrail draws the
 * arcs progressively, and TransportSprite rides along the active leg.
 *
 * Note: TripArcs from Phase 2 has been replaced by AnimatedTrail — the
 * static arcs are now just a special case of "all legs fully drawn".
 */
export function GlobeCanvas({ stops, playback }: GlobeCanvasProps) {
  return (
    <Canvas camera={{ position: [0, 0.6, 2.8], fov: 50 }}>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 3, 5]} intensity={1.1} />
      <directionalLight position={[-4, -2, -3]} intensity={0.25} />

      <CameraRig
        stops={stops}
        status={playback.status}
        legIndex={playback.legIndex}
        legProgress={playback.legProgress}
      />

      <Earth />
      <Countries />
      <StopMarkers stops={stops} />
      <AnimatedTrail
        stops={stops}
        status={playback.status}
        legIndex={playback.legIndex}
        legProgress={playback.legProgress}
      />
      <TransportSprite
        stops={stops}
        status={playback.status}
        legIndex={playback.legIndex}
        legProgress={playback.legProgress}
      />
    </Canvas>
  );
}
