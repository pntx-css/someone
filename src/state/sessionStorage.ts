export interface SessionStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface ConstellationBackPageState {
  phase: number;
  showConstellation: boolean;
  songId: string | null;
}

export type BirthdayGatePageState<T extends ConstellationBackPageState> =
  Omit<T, 'phase' | 'showConstellation' | 'songId'> & {
    phase: 1;
    showConstellation: false;
    songId: null;
  };

export const resetPageStateAfterConstellation = <T extends ConstellationBackPageState>(
  currentState: T
): BirthdayGatePageState<T> => ({
  ...currentState,
  phase: 1,
  showConstellation: false,
  songId: null,
});

export const JOURNEY_STORAGE_KEYS = {
  page: 'birthday-journey-page-state',
  candles: 'birthday-cake-candles',
  specialChapter: 'birthday-special-chapter-state',
  wishlist: 'birthday-wishlist-state',
  musicPlayerExpanded: 'birthday-music-player-expanded',
  musicPlayback: 'birthday-music-playback',
} as const;

export const FRESH_NAVIGATION_SESSION_KEYS = Object.values(JOURNEY_STORAGE_KEYS);

export const resetCandleAndMusicProgress = (storage: SessionStorageLike): void => {
  storage.removeItem(JOURNEY_STORAGE_KEYS.candles);
  storage.removeItem(JOURNEY_STORAGE_KEYS.musicPlayerExpanded);
  storage.removeItem(JOURNEY_STORAGE_KEYS.musicPlayback);
};

export const resetJourneyForFreshNavigation = (storage: SessionStorageLike): void => {
  FRESH_NAVIGATION_SESSION_KEYS.forEach((key) => storage.removeItem(key));
};
