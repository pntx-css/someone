export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CustomPlaceDraft {
  coordinates: Coordinates | null;
  mapsUrl: string;
  name: string;
  description: string;
}

export const MAX_CUSTOM_PLACES = 4;

export const getProgressiveEmptyCardCount = (registeredPlaces: number): number =>
  registeredPlaces < MAX_CUSTOM_PLACES ? 1 : 0;

const GOOGLE_MAPS_HOST = /^(?:(?:www|maps)\.)?google\.(?:com|[a-z]{2,3}(?:\.[a-z]{2})?)$/i;
const COORDINATE_PAIR = /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/;

const parseCoordinatePair = (value: string): Coordinates | null => {
  const match = value.match(COORDINATE_PAIR);
  if (!match) return null;

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }
  return { latitude, longitude };
};

export const parseGoogleMapsUrl = (value: string): Coordinates | null => {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('Masukkan link Google Maps yang valid dan lengkap.');
  }

  const hostname = url.hostname.toLowerCase();
  const isShortMapsLink = hostname === 'maps.app.goo.gl' ||
    (hostname === 'goo.gl' && url.pathname.startsWith('/maps'));
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    (url.port && url.port !== '443') ||
    (!isShortMapsLink && (
      !GOOGLE_MAPS_HOST.test(hostname) ||
      (!hostname.startsWith('maps.') && !url.pathname.startsWith('/maps'))
    ))
  ) {
    throw new Error('Gunakan link HTTPS dari Google Maps, bukan dari situs lain.');
  }

  const coordinateValues = [
    url.searchParams.get('q'),
    url.searchParams.get('query'),
    url.searchParams.get('ll'),
    url.searchParams.get('center'),
    url.searchParams.get('daddr'),
  ].filter((candidate): candidate is string => candidate !== null);
  for (const candidate of coordinateValues) {
    const coordinates = parseCoordinatePair(candidate);
    if (coordinates) return coordinates;
  }

  const embeddedCoordinates = url.href.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (embeddedCoordinates) {
    const coordinates = parseCoordinatePair(`${embeddedCoordinates[1]},${embeddedCoordinates[2]}`);
    if (coordinates) return coordinates;
  }

  const atCoordinates = url.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atCoordinates) {
    const coordinates = parseCoordinatePair(`${atCoordinates[1]},${atCoordinates[2]}`);
    if (coordinates) return coordinates;
  }

  return null;
};
