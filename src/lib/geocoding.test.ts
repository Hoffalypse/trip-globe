import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('./config', () => ({
  requireMapboxToken: () => 'pk.test-token',
  config: { mapboxToken: 'pk.test-token' },
}));

import { searchPlaces } from './geocoding';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => body,
  } as unknown as Response;
}

describe('searchPlaces', () => {
  it('returns [] for empty query without calling fetch', async () => {
    const results = await searchPlaces('   ');
    expect(results).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('builds the Mapbox URL with the right params and encodes the query', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ features: [] }));
    await searchPlaces('San Francisco');
    expect(mockFetch).toHaveBeenCalledOnce();
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/geocoding/v5/mapbox.places/San%20Francisco.json');
    expect(url).toContain('types=place');
    expect(url).not.toContain('locality');
    expect(url).not.toContain('poi');
    expect(url).toContain('autocomplete=true');
    expect(url).toContain('limit=8');
    expect(url).toContain('language=en');
    expect(url).toContain('access_token=pk.test-token');
  });

  it('parses Mapbox features into PlaceResult objects with City, Country labels', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        features: [
          {
            id: 'place.123',
            text: 'Paris',
            place_name: 'Paris, Île-de-France, France',
            center: [2.3522, 48.8566],
            context: [
              { id: 'region.xxx', text: 'Île-de-France' },
              { id: 'country.fr', short_code: 'fr', text: 'France' },
            ],
          },
        ],
      }),
    );
    const results = await searchPlaces('paris');
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      id: 'place.123',
      name: 'Paris, France',
      lat: 48.8566,
      lng: 2.3522,
      countryCode: 'FR',
    });
  });

  it('skips intermediate prefectures/regions in the display label', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        features: [
          {
            id: 'place.tokyo',
            text: 'Tokyo',
            place_name: 'Tokyo, Tokyo Prefecture, Japan',
            center: [139.6917, 35.6895],
            context: [
              { id: 'region.tokyo', text: 'Tokyo Prefecture' },
              { id: 'country.jp', short_code: 'jp', text: 'Japan' },
            ],
          },
        ],
      }),
    );
    const results = await searchPlaces('tokyo');
    expect(results[0].name).toBe('Tokyo, Japan');
  });

  it('returns empty countryCode and bare text when context is missing', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        features: [
          {
            id: 'place.no-ctx',
            text: 'Mystery City',
            place_name: 'Mystery City',
            center: [10, 20],
          },
        ],
      }),
    );
    const results = await searchPlaces('mystery');
    expect(results[0].countryCode).toBe('');
    expect(results[0].name).toBe('Mystery City');
  });

  it('throws when Mapbox returns a non-OK response', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, false, 401));
    await expect(searchPlaces('paris')).rejects.toThrow(/401/);
  });

  it('forwards the AbortSignal to fetch', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ features: [] }));
    const controller = new AbortController();
    await searchPlaces('paris', controller.signal);
    const opts = mockFetch.mock.calls[0][1] as { signal?: AbortSignal };
    expect(opts.signal).toBe(controller.signal);
  });
});
