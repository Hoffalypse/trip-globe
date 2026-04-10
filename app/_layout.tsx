import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TripsProvider } from '../src/hooks/useTrips';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <TripsProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#fff' },
            headerTitleStyle: { fontWeight: '600' },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="trip/[id]/index" options={{ title: 'Trip' }} />
          <Stack.Screen
            name="trip/[id]/add-stop"
            options={{ title: 'Add Stop', presentation: 'modal' }}
          />
          <Stack.Screen
            name="trip/[id]/globe"
            options={{
              presentation: 'fullScreenModal',
              headerShown: false,
              animation: 'fade',
            }}
          />
        </Stack>
      </TripsProvider>
    </SafeAreaProvider>
  );
}
