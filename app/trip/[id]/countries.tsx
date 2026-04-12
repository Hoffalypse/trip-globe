import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTrips } from '../../../src/hooks/useTrips';
import { getUniqueCountries } from '../../../src/lib/countries';

export default function CountriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTrip } = useTrips();
  const trip = id ? getTrip(id) : undefined;

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.muted}>Trip not found.</Text>
      </SafeAreaView>
    );
  }

  const countries = getUniqueCountries(trip.stops);

  return (
    <>
      <Stack.Screen options={{ title: `Countries — ${trip.name}` }} />
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <Text style={styles.count}>
          {countries.length} {countries.length === 1 ? 'country' : 'countries'} visited
        </Text>

        <FlatList
          data={countries}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.muted}>No countries recorded yet.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.flag}>{item.flag}</Text>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.code}>{item.code}</Text>
              </View>
            </View>
          )}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 16 },
  count: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 12,
  },
  list: { gap: 8, paddingBottom: 24 },
  muted: { color: '#64748b', textAlign: 'center', marginTop: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14,
  },
  flag: { fontSize: 32 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  code: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
});
