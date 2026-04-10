import { useEffect, useState } from 'react';

/**
 * Returns a value that lags `source` by `delayMs`. Each new `source` resets
 * the timer. Useful for throttling input → fetch pipelines (e.g. debouncing
 * a search field before hitting Mapbox geocoding).
 */
export function useDebouncedValue<T>(source: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(source);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(source), delayMs);
    return () => clearTimeout(id);
  }, [source, delayMs]);

  return debounced;
}
