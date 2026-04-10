import Constants from 'expo-constants';

/**
 * Typed accessor for runtime config from app.config.ts → extra.
 * Keep all `expoConfig.extra` reads in this file so the rest of the app
 * never has to know the shape of the Expo config object.
 */
interface AppExtra {
  mapboxToken: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppExtra>;

export const config = {
  mapboxToken: extra.mapboxToken ?? '',
};

export function requireMapboxToken(): string {
  if (!config.mapboxToken) {
    throw new Error(
      'EXPO_PUBLIC_MAPBOX_TOKEN is not set. Copy .env.example to .env and add your token.',
    );
  }
  return config.mapboxToken;
}
