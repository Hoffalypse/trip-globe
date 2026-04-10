import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Dynamic Expo config. Reads the static fields from app.json and layers in
 * runtime values from environment variables (e.g. the Mapbox token).
 *
 * Read at runtime via:
 *   import Constants from 'expo-constants';
 *   const token = Constants.expoConfig?.extra?.mapboxToken as string | undefined;
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'trip-globe',
  slug: config.slug ?? 'trip-globe',
  plugins: [
    ...((config.plugins as ExpoConfig['plugins']) ?? []),
    '@react-native-community/datetimepicker',
  ],
  extra: {
    ...config.extra,
    mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '',
  },
});
