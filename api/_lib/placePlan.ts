export interface PlannedPlaceInput {
  name: string;
  time: string;
  mapsUrl: string;
}

const GOOGLE_MAPS_HOST = /^(?:(?:www|maps)\.)?google\.(?:com|[a-z]{2,3}(?:\.[a-z]{2})?)$/i;
const COORDINATE_PAIR = /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/;

const validCoordinatePair = (value: string): boolean => {
  const match = value.match(COORDINATE_PAIR);
  if (!match) return false;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  return Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;
};

const validMapsUrl = (value: string): boolean => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  const hostname = url.hostname.toLowerCase();
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    (url.port && url.port !== '443') ||
    hostname === 'goo.gl' ||
    hostname === 'maps.app.goo.gl' ||
    !GOOGLE_MAPS_HOST.test(hostname) ||
    (!hostname.startsWith('maps.') && !url.pathname.startsWith('/maps'))
  ) {
    return false;
  }

  const coordinateValues = [
    url.searchParams.get('q'),
    url.searchParams.get('query'),
    url.searchParams.get('ll'),
    url.searchParams.get('center'),
    url.searchParams.get('daddr'),
  ].filter((candidate): candidate is string => candidate !== null);
  for (const candidate of coordinateValues) {
    if (COORDINATE_PAIR.test(candidate)) return validCoordinatePair(candidate);
  }

  const embeddedCoordinates = url.href.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (embeddedCoordinates && validCoordinatePair(`${embeddedCoordinates[1]},${embeddedCoordinates[2]}`)) {
    return true;
  }

  const atCoordinates = url.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  return Boolean(atCoordinates && validCoordinatePair(`${atCoordinates[1]},${atCoordinates[2]}`));
};

export const validatePlacePlanVisits = (value: unknown): PlannedPlaceInput[] | null => {
  if (!Array.isArray(value) || value.length < 1 || value.length > 6) return null;

  const visits: PlannedPlaceInput[] = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;
    const visit = candidate as Record<string, unknown>;
    if (
      typeof visit.name !== 'string' ||
      !visit.name.trim() ||
      [...visit.name.trim()].length > 80 ||
      typeof visit.time !== 'string' ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(visit.time) ||
      typeof visit.mapsUrl !== 'string' ||
      visit.mapsUrl.length > 2048 ||
      !validMapsUrl(visit.mapsUrl)
    ) {
      return null;
    }

    visits.push({
      name: visit.name.trim(),
      time: visit.time,
      mapsUrl: visit.mapsUrl,
    });
  }
  return visits;
};
