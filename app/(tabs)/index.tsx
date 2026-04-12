import { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTrips } from '../../src/hooks/useTrips';
import { totalTripMiles, uniqueCountryCount } from '../../src/lib/distance';

const ACCENT_COLORS = ['#10b981', '#059669', '#f97316', '#06b6d4', '#f59e0b'];

export default function TripsListScreen() {
  const router = useRouter();
  const { trips, createTrip } = useTrips();
  const [newName, setNewName] = useState('');

  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      Alert.alert('Give your trip a name');
      return;
    }
    setCreating(true);
    try {
      const trip = await createTrip(name);
      setNewName('');
      router.push(`/trip/${trip.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create trip';
      Alert.alert('Error', message);
    } finally {
      setCreating(false);
    }
  };

  const allStops = trips.flatMap((t) => t.stops);
  const totalMiles = Math.round(
    trips.reduce((sum, t) => sum + totalTripMiles(t.stops), 0),
  );
  const totalCountries = uniqueCountryCount(allStops);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Text style={styles.heading}>Your Trips</Text>
      <Text style={styles.subheading}>
        {trips.length} {trips.length === 1 ? 'adventure' : 'adventures'} so far
      </Text>

      <View style={styles.totalsRow}>
        <View style={styles.totalStat}>
          <Text style={styles.totalValue}>{totalMiles.toLocaleString()}</Text>
          <Text style={styles.totalLabel}>Miles</Text>
        </View>
        <View style={styles.totalStat}>
          <Text style={styles.totalValue}>{totalCountries}</Text>
          <Text style={styles.totalLabel}>
            {totalCountries === 1 ? 'Country' : 'Countries'}
          </Text>
        </View>
      </View>

      <View style={styles.newTripRow}>
        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder="Name your next adventure"
          placeholderTextColor="#6b7280"
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={handleCreate}
        />
        <Pressable
          onPress={handleCreate}
          disabled={creating}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>+</Text>
        </Pressable>
      </View>

      <FlatList
        data={trips}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✈️</Text>
            <Text style={styles.empty}>No trips yet</Text>
            <Text style={styles.emptyHint}>Create your first adventure above</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const miles = totalTripMiles(item.stops);
          const countries = uniqueCountryCount(item.stops);
          const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
          return (
            <Pressable
              onPress={() => router.push(`/trip/${item.id}`)}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={[styles.cardAccent, { backgroundColor: accent }]} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statBadge}>
                    <Text style={styles.statText}>
                      {item.stops.length} {item.stops.length === 1 ? 'stop' : 'stops'}
                    </Text>
                  </View>
                  {miles > 0 && (
                    <View style={styles.statBadge}>
                      <Text style={styles.statText}>
                        {Math.round(miles).toLocaleString()} mi
                      </Text>
                    </View>
                  )}
                  {countries > 0 && (
                    <View style={[styles.statBadge, styles.countryBadge]}>
                      <Text style={[styles.statText, styles.countryText]}>
                        {countries} {countries === 1 ? 'country' : 'countries'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0d23', paddingHorizontal: 16 },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 4,
    color: '#fff',
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 15,
    color: '#8b8fa3',
    marginBottom: 20,
  },
  totalsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  totalStat: {
    flex: 1,
    backgroundColor: '#1c1a36',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2d2b50',
    alignItems: 'center',
  },
  totalValue: { fontSize: 24, fontWeight: '800', color: '#fff' },
  totalLabel: { fontSize: 12, color: '#8b8fa3', marginTop: 2 },
  newTripRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  input: {
    flex: 1,
    backgroundColor: '#1c1a36',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2d2b50',
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 14,
    width: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 24 },
  list: { gap: 12, paddingBottom: 24 },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  empty: { color: '#fff', fontSize: 18, fontWeight: '600' },
  emptyHint: { color: '#6b7280', fontSize: 14, marginTop: 4 },
  card: {
    backgroundColor: '#1c1a36',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2d2b50',
  },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  cardAccent: {
    width: 5,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBadge: {
    backgroundColor: '#2d2b50',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statText: { fontSize: 13, fontWeight: '600', color: '#34d399' },
  countryBadge: { backgroundColor: '#0d3326' },
  countryText: { color: '#6ee7b7' },
});
