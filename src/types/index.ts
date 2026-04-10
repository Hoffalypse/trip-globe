export type TransportType =
  | 'plane'
  | 'car'
  | 'train'
  | 'boat'
  | 'walk'
  | 'bike'
  | 'other';

export const TRANSPORT_TYPES: TransportType[] = [
  'plane',
  'car',
  'train',
  'boat',
  'walk',
  'bike',
  'other',
];

export const TRANSPORT_LABELS: Record<TransportType, string> = {
  plane: 'Plane',
  car: 'Car',
  train: 'Train',
  boat: 'Boat',
  walk: 'Walking',
  bike: 'Bike',
  other: 'Other',
};

export const TRANSPORT_EMOJI: Record<TransportType, string> = {
  plane: '✈️',
  car: '🚗',
  train: '🚆',
  boat: '⛵',
  walk: '🚶',
  bike: '🚲',
  other: '📍',
};

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  countryCode: string; // ISO 3166-1 alpha-2, e.g. "US"
  arrivedAt: string; // ISO date string
  /**
   * Transportation used to get to this stop FROM the previous stop.
   * Null/undefined for the first stop of a trip (origin).
   */
  transportFromPrevious?: TransportType;
}

export interface Trip {
  id: string;
  name: string;
  createdAt: string;
  stops: Stop[];
}

export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  durationSec: number;
  /** Asset module returned by require() for bundled tracks. */
  source: number;
}
