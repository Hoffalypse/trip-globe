import { requireMapboxToken } from './config';
import type { TransportType } from '../types';

/**
 * Mapbox forward geocoding (v5 places endpoint).
 * Docs: https://docs.mapbox.com/api/search/geocoding-v5/
 *
 * `types=place` returns ONLY cities/towns/villages — never airports (those
 * are `poi`), never districts (`locality`), never states (`region`),
 * never street addresses (`address`). The user travels city-to-city by any
 * mode of transport, not airport-to-airport, so the autocomplete must
 * surface cities exclusively.
 */

export interface PlaceResult {
  id: string;
  name: string;
  lat: number;
  lng: number;
  countryCode: string;
}

interface MapboxContextEntry {
  id: string;
  short_code?: string;
  text?: string;
}

interface MapboxFeature {
  id: string;
  /** Bare city name, e.g. "Tokyo". */
  text: string;
  /** Full hierarchical label, e.g. "Tokyo, Tokyo Prefecture, Japan". Too verbose for our UI. */
  place_name: string;
  center: [number, number]; // [lng, lat]
  context?: MapboxContextEntry[];
}

interface MapboxResponse {
  features?: MapboxFeature[];
}

const ENDPOINT = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

function findCountry(feature: MapboxFeature): MapboxContextEntry | undefined {
  return feature.context?.find((c) => c.id.startsWith('country.'));
}

function findRegion(feature: MapboxFeature): MapboxContextEntry | undefined {
  return feature.context?.find((c) => c.id.startsWith('region.'));
}

function extractCountryCode(feature: MapboxFeature): string {
  return findCountry(feature)?.short_code?.toUpperCase() ?? '';
}

/**
 * Build a clean display label.
 * - US cities include state: "Springfield, Illinois, US"
 * - Other cities use short country code: "Tokyo, JP"
 */
function extractDisplayName(feature: MapboxFeature): string {
  const countryCode = extractCountryCode(feature);
  const region = findRegion(feature);

  if (countryCode === 'US' && region?.text) {
    return `${feature.text}, ${region.text}, US`;
  }

  return countryCode ? `${feature.text}, ${countryCode}` : feature.text;
}

export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceResult[]> {
  const q = query.trim();
  if (!q) return [];

  const token = requireMapboxToken();
  const url =
    `${ENDPOINT}/${encodeURIComponent(q)}.json` +
    `?types=place` +
    `&autocomplete=true` +
    `&limit=8` +
    `&language=en` +
    `&access_token=${encodeURIComponent(token)}`;

  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Mapbox geocoding failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as MapboxResponse;
  return (data.features ?? []).map((f) => ({
    id: f.id,
    name: extractDisplayName(f),
    lat: f.center[1],
    lng: f.center[0],
    countryCode: extractCountryCode(f),
  }));
}

export type { TransportType };
