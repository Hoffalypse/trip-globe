import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Stop, Trip, TransportType } from '../types';

/**
 * In-memory trips store. This will be replaced with Firestore
 * in Phase 1b once the Firebase project is set up.
 */

interface TripsContextValue {
  trips: Trip[];
  getTrip: (id: string) => Trip | undefined;
  createTrip: (name: string) => Trip;
  addStop: (
    tripId: string,
    stop: Omit<Stop, 'id' | 'arrivedAt'> & { arrivedAt?: string },
  ) => void;
  updateStop: (
    tripId: string,
    stopId: string,
    updates: Partial<Omit<Stop, 'id'>>,
  ) => void;
  removeStop: (tripId: string, stopId: string) => void;
}

const TripsContext = createContext<TripsContextValue | null>(null);

function generateId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

// Seed data so the app shows something useful before Firestore is wired up.
// Coordinates are city centers, not airports — the app is city-to-city by
// any transport mode, not airport-to-airport.
const SEED_TRIPS: Trip[] = [
  {
    id: 'seed-europe-2025',
    name: 'Europe 2025',
    createdAt: new Date('2025-06-01').toISOString(),
    stops: [
      {
        id: 'seed-1',
        name: 'New York',
        lat: 40.7128,
        lng: -74.006,
        countryCode: 'US',
        arrivedAt: new Date('2025-06-01').toISOString(),
      },
      {
        id: 'seed-2',
        name: 'London',
        lat: 51.5074,
        lng: -0.1278,
        countryCode: 'GB',
        arrivedAt: new Date('2025-06-02').toISOString(),
        transportFromPrevious: 'plane' as TransportType,
      },
      {
        id: 'seed-3',
        name: 'Paris',
        lat: 48.8566,
        lng: 2.3522,
        countryCode: 'FR',
        arrivedAt: new Date('2025-06-05').toISOString(),
        transportFromPrevious: 'train' as TransportType,
      },
    ],
  },
];

export function TripsProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>(SEED_TRIPS);

  const getTrip = useCallback(
    (id: string) => trips.find((t) => t.id === id),
    [trips],
  );

  const createTrip = useCallback((name: string): Trip => {
    const trip: Trip = {
      id: generateId(),
      name: name.trim() || 'Untitled Trip',
      createdAt: new Date().toISOString(),
      stops: [],
    };
    setTrips((prev) => [trip, ...prev]);
    return trip;
  }, []);

  const addStop = useCallback<TripsContextValue['addStop']>(
    (tripId, stopInput) => {
      setTrips((prev) =>
        prev.map((t) => {
          if (t.id !== tripId) return t;
          const stop: Stop = {
            id: generateId(),
            arrivedAt: stopInput.arrivedAt ?? new Date().toISOString(),
            name: stopInput.name,
            lat: stopInput.lat,
            lng: stopInput.lng,
            countryCode: stopInput.countryCode,
            transportFromPrevious: stopInput.transportFromPrevious,
          };
          return { ...t, stops: [...t.stops, stop] };
        }),
      );
    },
    [],
  );

  const updateStop = useCallback<TripsContextValue['updateStop']>(
    (tripId, stopId, updates) => {
      setTrips((prev) =>
        prev.map((t) => {
          if (t.id !== tripId) return t;
          return {
            ...t,
            stops: t.stops.map((s) =>
              s.id === stopId ? { ...s, ...updates } : s,
            ),
          };
        }),
      );
    },
    [],
  );

  const removeStop = useCallback((tripId: string, stopId: string) => {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === tripId
          ? { ...t, stops: t.stops.filter((s) => s.id !== stopId) }
          : t,
      ),
    );
  }, []);

  const value = useMemo<TripsContextValue>(
    () => ({ trips, getTrip, createTrip, addStop, updateStop, removeStop }),
    [trips, getTrip, createTrip, addStop, updateStop, removeStop],
  );

  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>;
}

export function useTrips(): TripsContextValue {
  const ctx = useContext(TripsContext);
  if (!ctx) {
    throw new Error('useTrips must be used inside TripsProvider');
  }
  return ctx;
}
