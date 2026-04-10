import { TRANSPORT_TYPES, type TransportType } from '../types';

/**
 * Arc max-height as a fraction of the globe radius. Higher = more dramatic
 * curve above the surface. Planes arc highest; ground transport hugs the
 * surface. All paths are still great circles on the sphere — only the
 * elevation of the arc midpoint changes.
 */
export const TRANSPORT_ARC_HEIGHT: Record<TransportType, number> = {
  plane: 0.4,
  boat: 0.12,
  train: 0.06,
  car: 0.04,
  bike: 0.03,
  walk: 0.02,
  other: 0.08,
};

/**
 * Default arc height when a stop has no `transportFromPrevious` set
 * (e.g. legacy data, or you want to draw an arc anyway).
 */
export const DEFAULT_ARC_HEIGHT = 0.1;

export function arcHeightFor(transport: TransportType | undefined): number {
  if (!transport) return DEFAULT_ARC_HEIGHT;
  return TRANSPORT_ARC_HEIGHT[transport];
}

// Compile-time guarantee that every TransportType has a height entry.
// If you add a new TransportType to src/types and forget to extend
// TRANSPORT_ARC_HEIGHT, this assignment will fail to typecheck.
const _exhaustive: readonly TransportType[] = TRANSPORT_TYPES;
void _exhaustive;
