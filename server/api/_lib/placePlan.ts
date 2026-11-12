export interface PlannedPlaceInput {
  name: string;
  time: string;
  mapsUrl: string;
}

const GOOGLE_MAPS_HOST = /^(?:(?:www|maps)\.)?google\.(?:com|[a-z]{2,3}(?:\.[a-z]{2})?)$/i;

const validMapsUrl = (value: string): boolean => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
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
    return false;
  }

  return true;
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
