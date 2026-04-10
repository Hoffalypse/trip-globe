/**
 * Great-circle (Haversine) distance between two lat/lng points.
 * Returns distance in miles.
 */

const EARTH_RADIUS_MILES = 3958.7613;

export interface LatLng {
  lat: number;
  lng: number;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineMiles(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return EARTH_RADIUS_MILES * c;
}

/**
 * Total great-circle distance along an ordered sequence of points, in miles.
 */
export function totalTripMiles(points: LatLng[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineMiles(points[i - 1], points[i]);
  }
  return total;
}

/**
 * Count unique country codes in a list of stops (ignores empty strings).
 */
export function uniqueCountryCount(
  stops: { countryCode: string }[],
): number {
  const set = new Set<string>();
  for (const s of stops) {
    if (s.countryCode) set.add(s.countryCode.toUpperCase());
  }
  return set.size;
}
