import { useState } from 'react';
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
import { TransportIcon, hasCustomIcon, needsMenuFlip } from '../../../src/components/icons/TransportIcons';
import { MUSIC_TRACKS } from '../../../src/lib/music';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getTrip, removeStop } = useTrips();

  const trip = id ? getTrip(id) : undefined;
  const [selectedDuration, setSelectedDuration] = useState(20);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

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
      <Stack.Screen
        options={{
          title: trip.name,
          headerStyle: { backgroundColor: '#0f0d23' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <View style={styles.statsRow}>
          <Stat label="Stops" value={`${trip.stops.length}`} small />
          <Stat label="Miles" value={`${Math.round(miles).toLocaleString()}`} wide />
          <Pressable
            onPress={() => router.push(`/trip/${trip.id}/countries`)}
            style={({ pressed }) => pressed && styles.statPressed}
          >
            <Stat
              label={countries === 1 ? 'Country' : 'Countries'}
              value={`${countries}`}
              small
            />
          </Pressable>
        </View>

        <Pressable
          onPress={() =>
            router.push(
              `/trip/${trip.id}/globe?duration=${selectedDuration}${selectedTrackId ? `&track=${selectedTrackId}` : ''}`,
            )
          }
          style={({ pressed }) => [
            styles.globeButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.globeEmoji}>🌍</Text>
          <Text style={styles.globeText}>Play Globe</Text>
        </Pressable>

        <View style={styles.settingsCard}>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Length</Text>
            {[10, 20, 30, 60].map((sec) => {
              const selected = selectedDuration === sec;
              return (
                <Pressable
                  key={sec}
                  onPress={() => setSelectedDuration(sec)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {sec}s
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Music</Text>
            <Pressable
              onPress={() => setSelectedTrackId(null)}
              style={[styles.chip, selectedTrackId === null && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selectedTrackId === null && styles.chipTextSelected]}>
                Off
              </Text>
            </Pressable>
            {MUSIC_TRACKS.map((track) => {
              const selected = selectedTrackId === track.id;
              return (
                <Pressable
                  key={track.id}
                  onPress={() => setSelectedTrackId(track.id)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {track.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionHeading}>Stops</Text>
        <FlatList
          data={trip.stops}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📍</Text>
              <Text style={styles.muted}>No stops yet</Text>
              <Text style={styles.emptyHint}>Tap "Add Stop" to begin</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() =>
                router.push(`/trip/${trip.id}/add-stop?stopId=${item.id}`)
              }
              onLongPress={() => handleRemove(item.id)}
              style={({ pressed }) => [
                styles.stopCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.stopHeader}>
                <View style={styles.stopIndexBadge}>
                  <Text style={styles.stopIndex}>{index + 1}</Text>
                </View>
                <Text style={styles.stopName}>{item.name}</Text>
              </View>
              <Text style={styles.stopDate}>{formatStopDate(item.arrivedAt)}</Text>
              {item.transportFromPrevious && (
                <View style={styles.transportRow}>
                  {hasCustomIcon(item.transportFromPrevious) ? (
                    <View style={needsMenuFlip(item.transportFromPrevious) ? styles.iconFlipped : undefined}>
                      <TransportIcon type={item.transportFromPrevious} size={20} />
                    </View>
                  ) : (
                    <Text style={styles.stopTransport}>
                      {TRANSPORT_EMOJI[item.transportFromPrevious]}
                    </Text>
                  )}
                  <Text style={styles.stopTransport}>
                    {' '}{TRANSPORT_LABELS[item.transportFromPrevious]} from previous
                  </Text>
                </View>
              )}
              {item.countryCode ? (
                <View style={styles.countryBadge}>
                  <Text style={styles.countryText}>{item.countryCode}</Text>
                </View>
              ) : null}
            </Pressable>
          )}
        />

        <Pressable
          onPress={() => router.push(`/trip/${trip.id}/add-stop`)}
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.pressed,
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

function Stat({ label, value, small, wide }: { label: string; value: string; small?: boolean; wide?: boolean }) {
  return (
    <View style={[styles.stat, small && styles.statSmall, wide && styles.statWide]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0d23', paddingHorizontal: 16 },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    backgroundColor: '#1c1a36',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2d2b50',
    alignItems: 'center',
  },
  statSmall: { flex: 0, width: 100 },
  statWide: { flex: 1 },
  statPressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
  statValue: { fontSize: 24, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 12, color: '#8b8fa3', marginTop: 2 },
  globeButton: {
    backgroundColor: '#1c1a36',
    borderRadius: 16,
    height: 56,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: '#2d2b50',
  },
  globeEmoji: { fontSize: 22 },
  globeText: { color: '#34d399', fontSize: 15, fontWeight: '600' },
  settingsCard: {
    backgroundColor: '#1c1a36',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2d2b50',
    gap: 12,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  settingsLabel: {
    color: '#8b8fa3',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2d2b50',
  },
  chipSelected: {
    backgroundColor: '#0d3326',
    borderColor: '#10b981',
  },
  chipText: {
    color: '#8b8fa3',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#10b981',
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#fff',
  },
  list: { gap: 10, paddingBottom: 100 },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  muted: { color: '#6b7280', textAlign: 'center', fontSize: 15 },
  emptyHint: { color: '#555770', fontSize: 13, marginTop: 4 },
  stopCard: {
    backgroundColor: '#1c1a36',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2d2b50',
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  stopHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stopIndexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIndex: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  stopName: { fontSize: 16, fontWeight: '600', flex: 1, color: '#fff' },
  stopDate: { fontSize: 13, color: '#34d399', fontWeight: '500', marginTop: 6 },
  transportRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  iconFlipped: { transform: [{ scaleX: -1 }] },
  stopTransport: { fontSize: 13, color: '#8b8fa3' },
  countryBadge: {
    backgroundColor: '#2d2b50',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  countryText: { fontSize: 11, color: '#6ee7b7', fontWeight: '600' },
  addButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
