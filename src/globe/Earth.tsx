import { GLOBE_RADIUS, OCEAN_COLOR } from './constants';

/**
 * The base globe sphere. No texture in Phase 2 — just a flat-shaded ocean
 * blue. Country outlines from <Countries /> sit on top.
 */
export function Earth() {
  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <meshStandardMaterial
        color={OCEAN_COLOR}
        roughness={0.85}
        metalness={0.05}
      />
    </mesh>
  );
}
