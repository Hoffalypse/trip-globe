import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(enLocale);

/**
 * Convert an ISO 3166-1 alpha-2 country code to its flag emoji.
 * Works by mapping each letter to the corresponding Unicode regional indicator symbol.
 */
export function countryCodeToFlag(code: string): string {
  const upper = code.toUpperCase();
  if (upper.length !== 2) return '';
  const offset = 0x1f1e6 - 65; // 'A' char code = 65
  return String.fromCodePoint(
    upper.charCodeAt(0) + offset,
    upper.charCodeAt(1) + offset,
  );
}

/**
 * Get the English display name for an ISO 3166-1 alpha-2 country code.
 */
export function countryName(code: string): string {
  return countries.getName(code.toUpperCase(), 'en') ?? code.toUpperCase();
}

/**
 * Given an array of stops, return a sorted list of unique countries
 * with their code, name, and flag.
 */
export function getUniqueCountries(
  stops: { countryCode: string }[],
): { code: string; name: string; flag: string }[] {
  const seen = new Set<string>();
  const result: { code: string; name: string; flag: string }[] = [];

  for (const stop of stops) {
    if (!stop.countryCode) continue;
    const code = stop.countryCode.toUpperCase();
    if (seen.has(code)) continue;
    seen.add(code);
    result.push({
      code,
      name: countryName(code),
      flag: countryCodeToFlag(code),
    });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}
