import { MAX_CUSTOM_PLACES, type Coordinates, type CustomPlaceDraft } from '../data/customPlace.ts';
import { JOURNEY_STORAGE_KEYS, type SessionStorageLike } from './sessionStorage.ts';

export interface CustomPlace extends CustomPlaceDraft {
  id: string;
}

export interface PlannedVisit {
  placeId: string;
  time: string;
}

export interface SavedSpecialChapterState {
  places: CustomPlace[];
  plannedVisits: PlannedVisit[];
  savedPlanSignature: string;
}

export const SPECIAL_CHAPTER_STATE_STORAGE_KEY = JOURNEY_STORAGE_KEYS.specialChapter;
export const DEFAULT_SPECIAL_CHAPTER_STATE: SavedSpecialChapterState = {
  places: [],
  plannedVisits: [],
  savedPlanSignature: '',
};

const isCoordinates = (value: unknown): value is Coordinates => {
  if (typeof value !== 'object' || value === null) return false;
  const coordinates = value as Record<string, unknown>;
  return (
    typeof coordinates.latitude === 'number' &&
    Number.isFinite(coordinates.latitude) &&
    coordinates.latitude >= -90 &&
    coordinates.latitude <= 90 &&
    typeof coordinates.longitude === 'number' &&
    Number.isFinite(coordinates.longitude) &&
    coordinates.longitude >= -180 &&
    coordinates.longitude <= 180
  );
};

const isCustomPlace = (value: unknown): value is CustomPlace => {
  if (typeof value !== 'object' || value === null) return false;
  const place = value as Record<string, unknown>;
  return (
    typeof place.id === 'string' &&
    typeof place.mapsUrl === 'string' &&
    typeof place.name === 'string' &&
    typeof place.description === 'string' &&
    (place.coordinates === null || isCoordinates(place.coordinates))
  );
};

const isPlannedVisit = (value: unknown): value is PlannedVisit => {
  if (typeof value !== 'object' || value === null) return false;
  const visit = value as Record<string, unknown>;
  if (typeof visit.placeId !== 'string' || typeof visit.time !== 'string') return false;

  const [hour, minute] = visit.time.split(':').map(Number);
  return (
    /^\d{2}:\d{2}$/.test(visit.time) &&
    Number.isInteger(hour) &&
    hour >= 0 &&
    hour <= 23 &&
    Number.isInteger(minute) &&
    minute >= 0 &&
    minute <= 59
  );
};

export const saveSpecialChapterState = (
  state: SavedSpecialChapterState,
  storage?: SessionStorageLike
): void => {
  try {
    (storage ?? window.sessionStorage).setItem(
      SPECIAL_CHAPTER_STATE_STORAGE_KEY,
      JSON.stringify(state)
    );
  } catch (error) {
    console.warn('Could not save the special place state', error);
  }
};

export const readSpecialChapterState = (
  defaultPlaceIds: ReadonlySet<string>,
  storage?: SessionStorageLike
): SavedSpecialChapterState => {
  let storedState: string | null;
  try {
    storedState = (storage ?? window.sessionStorage).getItem(SPECIAL_CHAPTER_STATE_STORAGE_KEY);
  } catch (error) {
    console.warn('Could not read the saved special place state', error);
    return DEFAULT_SPECIAL_CHAPTER_STATE;
  }

  if (!storedState) return DEFAULT_SPECIAL_CHAPTER_STATE;

  let parsedState: unknown;
  try {
    parsedState = JSON.parse(storedState);
  } catch (error) {
    console.warn('Could not parse the saved special place state', error);
    return DEFAULT_SPECIAL_CHAPTER_STATE;
  }

  if (typeof parsedState !== 'object' || parsedState === null) {
    console.warn('The saved special place state has an invalid format');
    return DEFAULT_SPECIAL_CHAPTER_STATE;
  }

  const savedState = parsedState as Record<string, unknown>;
  const places = savedState.places;
  const plannedVisits = savedState.plannedVisits;
  const savedPlanSignature = savedState.savedPlanSignature;
  const knownPlaceIds = new Set([
    ...defaultPlaceIds,
    ...(Array.isArray(places) ? places.filter(isCustomPlace).map((place) => place.id) : []),
  ]);

  if (
    !Array.isArray(places) ||
    places.length > MAX_CUSTOM_PLACES ||
    !places.every(isCustomPlace) ||
    !Array.isArray(plannedVisits) ||
    !plannedVisits.every(isPlannedVisit) ||
    plannedVisits.some((visit) => !knownPlaceIds.has(visit.placeId)) ||
    typeof savedPlanSignature !== 'string'
  ) {
    console.warn('The saved special place state has invalid values');
    return DEFAULT_SPECIAL_CHAPTER_STATE;
  }

  return { places, plannedVisits, savedPlanSignature };
};
