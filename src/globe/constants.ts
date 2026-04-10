/**
 * Globe-wide constants. Keep all magic numbers here so the visual look
 * is tunable in one place.
 */
export const GLOBE_RADIUS = 1;

// Lift offsets above the sphere surface to avoid z-fighting with the Earth mesh.
export const COUNTRY_OUTLINE_LIFT = 1.001;
export const ARC_BASE_LIFT = 1.015;
export const MARKER_LIFT = 1.02;

// Visual style
export const OCEAN_COLOR = '#0b3a5e';
export const COUNTRY_OUTLINE_COLOR = '#7fb8e0';
export const COUNTRY_OUTLINE_OPACITY = 0.55;

export const STOP_MARKER_COLOR = '#fbbf24';
export const STOP_MARKER_RADIUS = 0.018;

export const ARC_COLOR = '#fbbf24';
export const ARC_SEGMENTS = 64;

// Subdivisions per polygon edge when projecting GeoJSON to the sphere.
// 110m world-atlas already has dense vertices; 2 is enough to hide chord
// artifacts on the few long edges (e.g. Antarctica, Russia).
export const COUNTRY_EDGE_SUBDIVISIONS = 2;
