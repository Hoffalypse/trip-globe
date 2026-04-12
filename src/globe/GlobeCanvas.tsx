import type { RefObject } from 'react';
import { Canvas } from '@react-three/fiber/native';
import type { Stop } from '../types';
import { Earth } from './Earth';
import { Countries } from './Countries';
import { StopMarkers } from './StopMarkers';
import { AnimatedTrail } from './AnimatedTrail';
import { TransportSprite, type SpriteOverlayData } from './TransportSprite';
import { CameraRig } from './CameraRig';
import { GlobeOrbit } from './GlobeOrbit';
import type { PlaybackState } from './usePlayback';

interface GlobeCanvasProps {
  stops: Stop[];
  playback: PlaybackState;
  spriteOverlayRef: RefObject<SpriteOverlayData>;
  orbitDelta?: RefObject<{ dx: number; dy: number }>;
}

export function GlobeCanvas({ stops, playback, spriteOverlayRef, orbitDelta }: GlobeCanvasProps) {
  const defaultDelta = { current: { dx: 0, dy: 0 } };
  const delta = orbitDelta ?? defaultDelta;

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

      <GlobeOrbit enabled={playback.status === 'ended'} orbitDelta={delta}>
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
          overlayRef={spriteOverlayRef}
        />
      </GlobeOrbit>
    </Canvas>
  );
}
