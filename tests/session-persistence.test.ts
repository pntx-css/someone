import assert from 'node:assert/strict';
import test from 'node:test';
import {
  readSpecialChapterState,
  saveSpecialChapterState,
} from '../src/state/specialChapterSession.ts';
import { parseCoordinateInputs } from '../src/data/customPlace.ts';
import {
  FRESH_NAVIGATION_SESSION_KEYS,
  JOURNEY_STORAGE_KEYS,
  resetCandleAndMusicProgress,
  resetJourneyForFreshNavigation,
  resetPageStateAfterConstellation,
  type SessionStorageLike,
} from '../src/state/sessionStorage.ts';
import {
  readWishlistState,
  saveWishlistState,
  WISHLIST_STATE_STORAGE_KEY,
} from '../src/state/wishlistSession.ts';

class MemorySessionStorage implements SessionStorageLike {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

test('wishlist drafts and sent state survive a page reload', () => {
  const storage = new MemorySessionStorage();
  const draft = { draft: 'Harapanku bisa terkabul', hasSent: false };

  saveWishlistState(draft, storage);
  assert.deepEqual(readWishlistState(storage), draft);

  saveWishlistState({ draft: '', hasSent: true }, storage);
  assert.deepEqual(readWishlistState(storage), { draft: '', hasSent: true });
});

test('wishlist restores no more than its supported character limit', () => {
  const storage = new MemorySessionStorage();
  saveWishlistState({ draft: 'a'.repeat(1300), hasSent: false }, storage);

  assert.equal(readWishlistState(storage).draft.length, 1200);
});

test('custom places, planned visits, and saved plan signature survive a reload', () => {
  const storage = new MemorySessionStorage();
  const savedState = {
    places: [{
      id: 'custom-cafe',
      name: 'Cafe',
      description: 'Tempat ngopi',
      mapsUrl: 'https://maps.google.com/?q=-7.5,110.8',
      coordinates: { latitude: -7.5, longitude: 110.8 },
    }],
    plannedVisits: [{ placeId: 'custom-cafe', time: '13:45' }],
    savedPlanSignature: '[{"name":"Cafe","time":"13:45"}]',
  };
  const defaultPlaceIds = new Set(['default-place']);

  saveSpecialChapterState(savedState, storage);

  assert.deepEqual(readSpecialChapterState(defaultPlaceIds, storage), savedState);
});

test('custom place coordinate inputs accept valid pairs and reject incomplete or out-of-range values', () => {
  assert.deepEqual(parseCoordinateInputs('-7.5667', '110.8167'), {
    latitude: -7.5667,
    longitude: 110.8167,
  });
  assert.deepEqual(parseCoordinateInputs('-7.607630566878355, 110.8118047102339', ''), {
    latitude: -7.607630566878355,
    longitude: 110.8118047102339,
  });
  assert.deepEqual(parseCoordinateInputs('-7.607599, 110.811799', ''), {
    latitude: -7.607599,
    longitude: 110.811799,
  });
  assert.equal(parseCoordinateInputs('', ''), null);
  assert.throws(() => parseCoordinateInputs('-7.5667', ''), /Isi latitude dan longitude/);
  assert.throws(() => parseCoordinateInputs('-91', '110.8167'), /Koordinat tidak valid/);
});

test('returning from Constellation clears candles and music but preserves wishlist and places', () => {
  const storage = new MemorySessionStorage();
  const retainedKeys = [
    WISHLIST_STATE_STORAGE_KEY,
    JOURNEY_STORAGE_KEYS.specialChapter,
  ];
  const resetKeys = [
    JOURNEY_STORAGE_KEYS.candles,
    JOURNEY_STORAGE_KEYS.musicPlayerExpanded,
    JOURNEY_STORAGE_KEYS.musicPlayback,
  ];

  [...retainedKeys, ...resetKeys].forEach((key) => storage.setItem(key, 'saved'));
  resetCandleAndMusicProgress(storage);

  retainedKeys.forEach((key) => assert.equal(storage.getItem(key), 'saved'));
  resetKeys.forEach((key) => assert.equal(storage.getItem(key), null));
});

test('returning from Constellation resets the page and song while preserving revealed progress', () => {
  const currentState = {
    phase: 5,
    showConstellation: true,
    songId: 'love',
    showConstellationFootprint: true,
  };

  assert.deepEqual(resetPageStateAfterConstellation(currentState), {
    phase: 1,
    showConstellation: false,
    songId: null,
    showConstellationFootprint: true,
  });
});

test('a fresh link navigation clears all journey progress, including wishlist and places', () => {
  const storage = new MemorySessionStorage();
  FRESH_NAVIGATION_SESSION_KEYS.forEach((key) => storage.setItem(key, 'saved'));

  resetJourneyForFreshNavigation(storage);

  FRESH_NAVIGATION_SESSION_KEYS.forEach((key) => assert.equal(storage.getItem(key), null));
});
