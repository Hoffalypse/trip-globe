import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTrips } from '../../../src/hooks/useTrips';
import { totalTripMiles, uniqueCountryCount } from '../../../src/lib/distance';
import { TRANSPORT_EMOJI, TRANSPORT_LABELS } from '../../../src/types';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getTrip, removeStop } = useTrips();

  const trip = id ? getTrip(id) : undefined;

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.muted}>Trip not found.</Text>
      </SafeAreaView>
    );
  }

  const miles = totalTripMiles(trip.stops);
  const countries = uniqueCountryCount(trip.stops);

  const handleRemove = (stopId: string) => {
    Alert.alert('Remove stop?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeStop(trip.id, stopId),
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: trip.name }} />
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <View style={styles.statsRow}>
          <Stat label="Stops" value={`${trip.stops.length}`} />
          <Stat label="Miles" value={`${Math.round(miles).toLocaleString()}`} />
          <Stat
            label={countries === 1 ? 'Country' : 'Countries'}
            value={`${countries}`}
          />
        </View>

        <Pressable
          onPress={() => router.push(`/trip/${trip.id}/globe`)}
          style={({ pressed }) => [
            styles.globePlaceholder,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.globePlaceholderText}>🌍 Play Globe</Text>
        </Pressable>

        <Text style={styles.sectionHeading}>Stops</Text>
        <FlatList
          data={trip.stops}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.muted}>
              No stops yet. Tap “Add Stop” to start your trip.
            </Text>
          }
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() =>
                router.push(`/trip/${trip.id}/add-stop?stopId=${item.id}`)
              }
              onLongPress={() => handleRemove(item.id)}
              style={({ pressed }) => [
                styles.stopCard,
                pressed && styles.buttonPressed,
              ]}
            >
              <View style={styles.stopHeader}>
                <Text style={styles.stopIndex}>{index + 1}</Text>
                <Text style={styles.stopName}>{item.name}</Text>
              </View>
              <Text style={styles.stopDate}>{formatStopDate(item.arrivedAt)}</Text>
              {item.transportFromPrevious && (
                <Text style={styles.stopTransport}>
                  {TRANSPORT_EMOJI[item.transportFromPrevious]}{' '}
                  {TRANSPORT_LABELS[item.transportFromPrevious]} from previous
                </Text>
              )}
              {item.countryCode ? (
                <Text style={styles.stopCountry}>{item.countryCode}</Text>
              ) : null}
            </Pressable>
          )}
        />

        <Pressable
          onPress={() => router.push(`/trip/${trip.id}/add-stop`)}
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.addButtonText}>+ Add Stop</Text>
        </Pressable>
      </SafeAreaView>
    </>
  );
}

function formatStopDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 16 },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  globePlaceholder: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    height: 180,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  globePlaceholderText: { color: '#fff', fontSize: 14 },
  sectionHeading: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  list: { gap: 10, paddingBottom: 100 },
  muted: { color: '#64748b', textAlign: 'center', marginTop: 12 },
  stopCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stopHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stopIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '700',
    fontSize: 12,
  },
  stopName: { fontSize: 16, fontWeight: '600', flex: 1 },
  stopDate: { fontSize: 13, color: '#2563eb', fontWeight: '500', marginTop: 4 },
  stopTransport: { fontSize: 13, color: '#475569', marginTop: 4 },
  stopCountry: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  addButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPressed: { opacity: 0.85 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
