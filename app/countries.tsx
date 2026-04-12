import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useTrips } from '../src/hooks/useTrips';
import { getUniqueCountries } from '../src/lib/countries';

export default function AllCountriesScreen() {
  const { trips } = useTrips();
  const allStops = trips.flatMap((t) => t.stops);
  const countries = getUniqueCountries(allStops);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Countries',
          headerStyle: { backgroundColor: '#0f0d23' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          headerBackTitle: 'Home',
        }}
      />
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.countNumber}>{countries.length}</Text>
          <Text style={styles.countLabel}>
            {countries.length === 1 ? 'country' : 'countries'} visited
          </Text>
          <Text style={styles.tripName}>Across all trips</Text>
        </View>

        <FlatList
          data={countries}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🌍</Text>
              <Text style={styles.muted}>No countries recorded yet</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
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
  container: { flex: 1, backgroundColor: '#0f0d23', paddingHorizontal: 16 },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 8,
  },
  countNumber: {
    fontSize: 56,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: -2,
  },
  countLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b8fa3',
    marginTop: -4,
  },
  tripName: {
    fontSize: 13,
    color: '#555770',
    marginTop: 8,
  },
  list: { gap: 10, paddingBottom: 32 },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  muted: { color: '#6b7280', textAlign: 'center', fontSize: 15 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1a36',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2d2b50',
    gap: 14,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2d2b50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399',
  },
  flag: { fontSize: 36 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#fff' },
  code: { fontSize: 13, color: '#6b7280', marginTop: 2 },
});
