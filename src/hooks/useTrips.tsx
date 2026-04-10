import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import type { Stop, Trip } from '../types';

interface TripsContextValue {
  trips: Trip[];
  loading: boolean;
  getTrip: (id: string) => Trip | undefined;
  createTrip: (name: string) => Promise<Trip>;
  addStop: (
    tripId: string,
    stop: Omit<Stop, 'id' | 'arrivedAt'> & { arrivedAt?: string },
  ) => Promise<void>;
  updateStop: (
    tripId: string,
    stopId: string,
    updates: Partial<Omit<Stop, 'id'>>,
  ) => Promise<void>;
  removeStop: (tripId: string, stopId: string) => Promise<void>;
}

const TripsContext = createContext<TripsContextValue | null>(null);

function generateId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

function tripsCollection(uid: string) {
  return collection(db, 'users', uid, 'trips');
}

function tripDoc(uid: string, tripId: string) {
  return doc(db, 'users', uid, 'trips', tripId);
}

export function TripsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Real-time listener on user's trips ──────────────────

  useEffect(() => {
    if (!user) {
      setTrips([]);
      setLoading(false);
      return;
    }

    const q = query(tripsCollection(user.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const result: Trip[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name ?? 'Untitled Trip',
          createdAt:
            data.createdAt?.toDate?.()?.toISOString() ??
            new Date().toISOString(),
          stops: (data.stops as Stop[]) ?? [],
        };
      });
      setTrips(result);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // ── CRUD operations ─────────────────────────────────────

  const getTrip = useCallback(
    (id: string) => trips.find((t) => t.id === id),
    [trips],
  );

  const createTrip = useCallback(
    async (name: string): Promise<Trip> => {
      if (!user) throw new Error('Not signed in');

      const tripData = {
        name: name.trim() || 'Untitled Trip',
        createdAt: serverTimestamp(),
        stops: [],
      };

      const docRef = await addDoc(tripsCollection(user.uid), tripData);

      // Return optimistic trip for immediate navigation
      return {
        id: docRef.id,
        name: tripData.name,
        createdAt: new Date().toISOString(),
        stops: [],
      };
    },
    [user],
  );

  const addStop = useCallback(
    async (
      tripId: string,
      stopInput: Omit<Stop, 'id' | 'arrivedAt'> & { arrivedAt?: string },
    ) => {
      if (!user) return;

      const trip = trips.find((t) => t.id === tripId);
      if (!trip) return;

      const stop: Record<string, unknown> = {
        id: generateId(),
        arrivedAt: stopInput.arrivedAt ?? new Date().toISOString(),
        name: stopInput.name,
        lat: stopInput.lat,
        lng: stopInput.lng,
        countryCode: stopInput.countryCode,
      };
      if (stopInput.transportFromPrevious) {
        stop.transportFromPrevious = stopInput.transportFromPrevious;
      }

      await updateDoc(tripDoc(user.uid, tripId), {
        stops: [...trip.stops, stop],
      });
    },
    [user, trips],
  );

  const updateStop = useCallback(
    async (
      tripId: string,
      stopId: string,
      updates: Partial<Omit<Stop, 'id'>>,
    ) => {
      if (!user) return;

      const trip = trips.find((t) => t.id === tripId);
      if (!trip) return;

      // Strip undefined values — Firestore rejects them
      const cleanUpdates: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(updates)) {
        if (val !== undefined) cleanUpdates[key] = val;
      }
      const updatedStops = trip.stops.map((s) =>
        s.id === stopId ? { ...s, ...cleanUpdates } : s,
      );

      await updateDoc(tripDoc(user.uid, tripId), { stops: updatedStops });
    },
    [user, trips],
  );

  const removeStop = useCallback(
    async (tripId: string, stopId: string) => {
      if (!user) return;

      const trip = trips.find((t) => t.id === tripId);
      if (!trip) return;

      const filteredStops = trip.stops.filter((s) => s.id !== stopId);
      await updateDoc(tripDoc(user.uid, tripId), { stops: filteredStops });
    },
    [user, trips],
  );

  const value = useMemo<TripsContextValue>(
    () => ({
      trips,
      loading,
      getTrip,
      createTrip,
      addStop,
      updateStop,
      removeStop,
    }),
    [trips, loading, getTrip, createTrip, addStop, updateStop, removeStop],
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
