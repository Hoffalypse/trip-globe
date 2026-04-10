import { Vector3 } from 'three';

/**
 * Convert geographic (lat, lng in degrees) to a 3D position on a sphere.
 *
 * Right-handed coordinates, viewed from a camera at +Z looking at origin
 * (Y up). This matches the standard three.js "earth from outside" convention
 * — east longitudes appear on the RIGHT of the screen, north pole UP.
 *
 *   (lat=0,  lng=0)    → (+r,  0,  0)   // equator at prime meridian
 *   (lat=90, lng=0)    → ( 0, +r,  0)   // north pole
 *   (lat=0,  lng=90)   → ( 0,  0, -r)   // 90° east (Indian Ocean)
 *   (lat=0,  lng=-90)  → ( 0,  0, +r)   // 90° west (central Pacific)
 *   (lat=0,  lng=180)  → (-r,  0,  0)   // antimeridian
 *
 * The negative Z on sin(lng) is what makes east-on-the-right work — without
 * it, the globe appears mirrored (Florida west of California).
 */
export function latLngToVec3(
  lat: number,
  lng: number,
  radius: number = 1,
): Vector3 {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const cosLat = Math.cos(latRad);
  return new Vector3(
    radius * cosLat * Math.cos(lngRad),
    radius * Math.sin(latRad),
    -radius * cosLat * Math.sin(lngRad),
  );
}
