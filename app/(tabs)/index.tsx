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

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Text style={styles.heading}>Your Trips</Text>

      <View style={styles.newTripRow}>
        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder="New trip name"
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={handleCreate}
        />
        <Pressable
          onPress={handleCreate}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={trips}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No trips yet. Create one above.</Text>
        }
        renderItem={({ item }) => {
          const miles = totalTripMiles(item.stops);
          const countries = uniqueCountryCount(item.stops);
          return (
            <Pressable
              onPress={() => router.push(`/trip/${item.id}`)}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
            >
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardStats}>
                {item.stops.length} stops · {Math.round(miles)} mi ·{' '}
                {countries} {countries === 1 ? 'country' : 'countries'}
              </Text>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 16 },
  heading: { fontSize: 28, fontWeight: '700', marginTop: 16, marginBottom: 12 },
  newTripRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  list: { gap: 12, paddingBottom: 24 },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardPressed: { opacity: 0.8 },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  cardStats: { fontSize: 14, color: '#64748b' },
});
