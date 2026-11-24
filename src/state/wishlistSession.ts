import { JOURNEY_STORAGE_KEYS, type SessionStorageLike } from './sessionStorage.ts';

export interface SavedWishlistState {
  draft: string;
  hasSent: boolean;
}

export const WISHLIST_STATE_STORAGE_KEY = JOURNEY_STORAGE_KEYS.wishlist;
export const DEFAULT_WISHLIST_STATE: SavedWishlistState = { draft: '', hasSent: false };

export const saveWishlistState = (
  state: SavedWishlistState,
  storage?: SessionStorageLike
): void => {
  try {
    (storage ?? window.sessionStorage).setItem(
      WISHLIST_STATE_STORAGE_KEY,
      JSON.stringify(state)
    );
  } catch (error) {
    console.warn('Could not save the wishlist state', error);
  }
};

export const readWishlistState = (
  storage?: SessionStorageLike
): SavedWishlistState => {
  let storedState: string | null;
  try {
    storedState = (storage ?? window.sessionStorage).getItem(WISHLIST_STATE_STORAGE_KEY);
  } catch (error) {
    console.warn('Could not read the saved wishlist state', error);
    return DEFAULT_WISHLIST_STATE;
  }

  if (!storedState) return DEFAULT_WISHLIST_STATE;

  let parsedState: unknown;
  try {
    parsedState = JSON.parse(storedState);
  } catch (error) {
    console.warn('Could not parse the saved wishlist state', error);
    return DEFAULT_WISHLIST_STATE;
  }

  if (
    typeof parsedState !== 'object' ||
    parsedState === null ||
    typeof (parsedState as Record<string, unknown>).draft !== 'string' ||
    typeof (parsedState as Record<string, unknown>).hasSent !== 'boolean'
  ) {
    console.warn('The saved wishlist state has an invalid format');
    return DEFAULT_WISHLIST_STATE;
  }

  const savedState = parsedState as Record<string, unknown>;
  const hasSent = savedState.hasSent as boolean;
  const draft = savedState.draft as string;
  return { draft: hasSent ? '' : draft.slice(0, 1200), hasSent };
};
