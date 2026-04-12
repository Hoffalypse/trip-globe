import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useTrips } from '../../../src/hooks/useTrips';
import { useDebouncedValue } from '../../../src/hooks/useDebouncedValue';
import { searchPlaces, type PlaceResult } from '../../../src/lib/geocoding';
import {
  TRANSPORT_EMOJI,
  TRANSPORT_LABELS,
  TRANSPORT_TYPES,
  type TransportType,
} from '../../../src/types';
import { TransportIcon, hasCustomIcon } from '../../../src/components/icons/TransportIcons';

/**
 * Stop form screen — handles BOTH "add new stop" and "edit existing stop".
 *
 * - `?stopId=...` query param switches the screen into edit mode. In edit
 *   mode the location is locked (the user wanted to edit dates and transport,
 *   not change cities — to replace a city, delete the stop and add a new one).
 * - Without `stopId`, the screen behaves as the original Add Stop flow.
 */
export default function AddStopScreen() {
  const { id, stopId } = useLocalSearchParams<{ id: string; stopId?: string }>();
  const router = useRouter();
  const { getTrip, addStop, updateStop } = useTrips();

  const trip = id ? getTrip(id) : undefined;
  const editingStop = stopId && trip ? trip.stops.find((s) => s.id === stopId) : undefined;
  const isEditMode = !!editingStop;
  const editingIndex = editingStop && trip ? trip.stops.indexOf(editingStop) : -1;

  // First-stop logic differs between modes:
  //  - Add: there is no previous stop because the trip is empty
  //  - Edit: the stop being edited is at index 0
  const isFirstStop = isEditMode
    ? editingIndex === 0
    : !trip || trip.stops.length === 0;

  // Smart default for the arrival date (add mode only):
  //  - For the very first stop, default to today.
  //  - For later stops, default to the previous stop's date + 1 day, so that
  //    rapidly adding sequential stops produces sensible day numbers.
  const defaultDate = useMemo(() => {
    if (!trip || trip.stops.length === 0) return new Date();
    const last = trip.stops[trip.stops.length - 1];
    const d = new Date(last.arrivedAt);
    d.setDate(d.getDate() + 1);
    return d;
  }, [trip]);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(
    editingStop
      ? {
          id: editingStop.id,
          name: editingStop.name,
          lat: editingStop.lat,
          lng: editingStop.lng,
          countryCode: editingStop.countryCode,
        }
      : null,
  );
  const [transport, setTransport] = useState<TransportType>(
    editingStop?.transportFromPrevious ?? 'plane',
  );
  const [arrivedAt, setArrivedAt] = useState<Date>(
    editingStop ? new Date(editingStop.arrivedAt) : defaultDate,
  );
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const debouncedQuery = useDebouncedValue(query, 250);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      setResults([]);
      setSearchError(null);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    setSearching(true);
    setSearchError(null);

    searchPlaces(q, controller.signal)
      .then((r) => {
        setResults(r);
        setSearching(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setSearchError(
          err instanceof Error ? err.message : 'Search failed',
        );
        setResults([]);
        setSearching(false);
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.muted}>Trip not found.</Text>
      </SafeAreaView>
    );
  }

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedPlace || saving) return;
    setSaving(true);
    try {
      if (isEditMode && editingStop) {
        await updateStop(trip.id, editingStop.id, {
          arrivedAt: arrivedAt.toISOString(),
          transportFromPrevious: isFirstStop ? undefined : transport,
        });
      } else {
        await addStop(trip.id, {
          name: selectedPlace.name,
          lat: selectedPlace.lat,
          lng: selectedPlace.lng,
          countryCode: selectedPlace.countryCode,
          transportFromPrevious: isFirstStop ? undefined : transport,
          arrivedAt: arrivedAt.toISOString(),
        });
      }
      router.back();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save stop';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    // On Android the picker is a one-shot modal — close it after any event.
    // On iOS the picker is inline, so leave it open.
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (event.type === 'set' && date) {
      setArrivedAt(date);
    }
  };

  const formattedDate = arrivedAt.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <Stack.Screen
        options={{
          title: isEditMode ? 'Edit Stop' : 'Add Stop',
          headerStyle: { backgroundColor: '#0f0d23' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />

      {isEditMode ? (
        <>
          <Text style={styles.label}>Location</Text>
          {selectedPlace && (
            <View style={styles.selectedCard}>
              <Text style={styles.selectedName}>{selectedPlace.name}</Text>
              <Text style={styles.selectedMeta}>
                {selectedPlace.lat.toFixed(3)}, {selectedPlace.lng.toFixed(3)} ·{' '}
                {selectedPlace.countryCode}
              </Text>
              <Text style={styles.lockedHint}>
                To change the city, delete this stop and add a new one.
              </Text>
            </View>
          )}
        </>
      ) : (
        <>
          <Text style={styles.label}>Search location</Text>
          <TextInput
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              setSelectedPlace(null);
            }}
            placeholder="e.g. Paris, Tokyo, Rio..."
            placeholderTextColor="#6b7280"
            style={styles.input}
            autoFocus
          />

          {selectedPlace ? (
            <View style={styles.selectedCard}>
              <Text style={styles.selectedName}>{selectedPlace.name}</Text>
              <Text style={styles.selectedMeta}>
                {selectedPlace.lat.toFixed(3)}, {selectedPlace.lng.toFixed(3)} ·{' '}
                {selectedPlace.countryCode}
              </Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(p) => p.id}
              style={styles.resultsList}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                searching ? (
                  <View style={styles.searchingRow}>
                    <ActivityIndicator size="small" color="#8b8fa3" />
                    <Text style={styles.searchingText}>Searching…</Text>
                  </View>
                ) : null
              }
              ListEmptyComponent={
                searchError ? (
                  <Text style={styles.errorText}>{searchError}</Text>
                ) : query && !searching ? (
                  <Text style={styles.muted}>No matches.</Text>
                ) : !query ? (
                  <Text style={styles.muted}>
                    Type a city name to search.
                  </Text>
                ) : null
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setSelectedPlace(item)}
                  style={({ pressed }) => [
                    styles.resultRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.resultName}>{item.name}</Text>
                  <Text style={styles.resultCountry}>{item.countryCode}</Text>
                </Pressable>
              )}
            />
          )}
        </>
      )}

      <Text style={[styles.label, { marginTop: 12 }]}>Date arrived</Text>
      {Platform.OS === 'android' && (
        <Pressable
          onPress={() => setShowPicker(true)}
          style={({ pressed }) => [
            styles.dateButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.dateButtonText}>{formattedDate}</Text>
        </Pressable>
      )}
      {showPicker && (
        <DateTimePicker
          value={arrivedAt}
          mode="date"
          display={Platform.OS === 'ios' ? 'compact' : 'default'}
          onChange={handleDateChange}
          themeVariant="dark"
        />
      )}

      {!isFirstStop && (
        <>
          <Text style={[styles.label, { marginTop: 12 }]}>
            Transport from previous stop
          </Text>
          <View style={styles.transportRow}>
            {TRANSPORT_TYPES.map((t) => {
              const selected = transport === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTransport(t)}
                  style={[
                    styles.transportChip,
                    selected && styles.transportChipSelected,
                  ]}
                >
                  {hasCustomIcon(t) ? (
                    <View style={styles.iconFlipped}>
                      <TransportIcon type={t} size={20} />
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.transportEmoji,
                        selected && styles.transportTextSelected,
                      ]}
                    >
                      {TRANSPORT_EMOJI[t]}
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.transportLabel,
                      selected && styles.transportTextSelected,
                    ]}
                  >
                    {TRANSPORT_LABELS[t]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      <Pressable
        onPress={handleSave}
        disabled={!selectedPlace || saving}
        style={({ pressed }) => [
          styles.saveButton,
          (!selectedPlace || saving) && styles.saveButtonDisabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving...' : isEditMode ? 'Update Stop' : 'Save Stop'}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0d23', padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#8b8fa3', marginBottom: 6 },
  input: {
    backgroundColor: '#1c1a36',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2d2b50',
    marginBottom: 12,
  },
  resultsList: { maxHeight: 260 },
  resultRow: {
    backgroundColor: '#1c1a36',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2d2b50',
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultName: { fontSize: 15, fontWeight: '500', flex: 1, color: '#fff' },
  resultCountry: { fontSize: 12, color: '#8b8fa3' },
  pressed: { opacity: 0.8 },
  muted: { color: '#6b7280', textAlign: 'center', marginTop: 12, lineHeight: 20 },
  errorText: { color: '#ef4444', textAlign: 'center', marginTop: 12, fontSize: 13 },
  dateButton: {
    backgroundColor: '#1c1a36',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#2d2b50',
  },
  dateButtonText: { fontSize: 15, color: '#fff', fontWeight: '500' },
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  searchingText: { color: '#8b8fa3', fontSize: 13 },
  selectedCard: {
    backgroundColor: '#0d3326',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  selectedName: { fontSize: 16, fontWeight: '600', color: '#10b981' },
  selectedMeta: { fontSize: 12, color: '#34d399', marginTop: 2 },
  lockedHint: { fontSize: 11, color: '#6b7280', marginTop: 8, fontStyle: 'italic' },
  iconFlipped: { transform: [{ scaleX: -1 }] },
  transportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  transportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1c1a36',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2d2b50',
  },
  transportChipSelected: { backgroundColor: '#10b981', borderColor: '#10b981' },
  transportEmoji: { fontSize: 16 },
  transportLabel: { fontSize: 13, color: '#8b8fa3' },
  transportTextSelected: { color: '#fff', fontWeight: '600' },
  saveButton: {
    marginTop: 'auto',
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: { backgroundColor: '#2d2b50' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
