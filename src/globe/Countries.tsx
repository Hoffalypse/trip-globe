import { useMemo } from 'react';
import {
  BufferGeometry,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  Vector3,
} from 'three';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import type {
  Feature,
  FeatureCollection,
  Geometry,
  Polygon,
  MultiPolygon,
  Position,
} from 'geojson';
import countries110m from 'world-atlas/countries-110m.json';
import { latLngToVec3 } from './latLngToVec3';
import { greatCirclePoints } from './greatCircle';
import {
  COUNTRY_EDGE_SUBDIVISIONS,
  COUNTRY_OUTLINE_COLOR,
  COUNTRY_OUTLINE_LIFT,
  COUNTRY_OUTLINE_OPACITY,
} from './constants';

type Ring = Position[];

/**
 * Project a single GeoJSON linear ring (array of [lng, lat] pairs) onto the
 * sphere, subdividing each edge along its great circle so long edges curve
 * properly instead of cutting straight chords through the globe.
 */
function projectRingToSphere(ring: Ring, radius: number): Vector3[] {
  const out: Vector3[] = [];
  for (let i = 0; i < ring.length - 1; i++) {
    const [lngA, latA] = ring[i];
    const [lngB, latB] = ring[i + 1];
    const a = latLngToVec3(latA, lngA, radius);
    const b = latLngToVec3(latB, lngB, radius);
    const segment = greatCirclePoints(a, b, COUNTRY_EDGE_SUBDIVISIONS);
    // Skip the last point of every segment except the last edge — the next
    // edge starts there, so we'd otherwise duplicate vertices.
    const isLastEdge = i === ring.length - 2;
    const slice = isLastEdge ? segment : segment.slice(0, -1);
    out.push(...slice);
  }
  return out;
}

function ringToGeometry(ring: Ring): BufferGeometry {
  const points = projectRingToSphere(ring, COUNTRY_OUTLINE_LIFT);
  const positions = new Float32Array(points.length * 3);
  for (let i = 0; i < points.length; i++) {
    positions[i * 3 + 0] = points[i].x;
    positions[i * 3 + 1] = points[i].y;
    positions[i * 3 + 2] = points[i].z;
  }
  const geom = new BufferGeometry();
  geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return geom;
}

function extractRings(geom: Geometry): Ring[] {
  if (geom.type === 'Polygon') {
    return (geom as Polygon).coordinates;
  }
  if (geom.type === 'MultiPolygon') {
    return (geom as MultiPolygon).coordinates.flat();
  }
  return [];
}

/**
 * Renders all country outlines from natural-earth-110m as Lines on the sphere.
 * Phase 3 will add a CountryHighlight overlay that fills the active stop's
 * country with a tinted material.
 *
 * Implementation note: we build THREE.Line instances imperatively and render
 * them via <primitive>. The JSX intrinsic <line> would collide with React's
 * SVGLineElement type from @types/react.
 */
export function Countries() {
  const lines = useMemo(() => {
    const topology = countries110m as unknown as Topology;
    const collection = feature(
      topology,
      topology.objects.countries,
    ) as unknown as FeatureCollection<Geometry>;

    const material = new LineBasicMaterial({
      color: COUNTRY_OUTLINE_COLOR,
      transparent: true,
      opacity: COUNTRY_OUTLINE_OPACITY,
    });

    const result: Line[] = [];
    for (const f of collection.features as Feature<Geometry>[]) {
      const rings = extractRings(f.geometry);
      for (const ring of rings) {
        if (ring.length < 2) continue;
        result.push(new Line(ringToGeometry(ring), material));
      }
    }
    return result;
  }, []);

  return (
    <group>
      {lines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  );
}
