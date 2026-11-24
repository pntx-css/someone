import React, { useCallback, useEffect, useState } from 'react';
import { BirthdayGate } from './components/BirthdayGate';
import { BirthdayCake } from './components/BirthdayCake';
import { HappyBirthday } from './components/HappyBirthday';
import { MusicPlayer } from './components/MusicPlayer';
import { PersonalMessage } from './components/PersonalMessage';
import { Memories } from './components/Memories';
import { Wishlist } from './components/Wishlist';
import { AdminPortal } from './components/AdminPortal';
import { JourneyCatDecorations } from './components/JourneyCatDecorations';
import { ConstellationChapter } from './components/ConstellationChapter';
import { songs, type Song } from './data/music';
import {
  JOURNEY_STORAGE_KEYS,
  resetCandleAndMusicProgress,
  resetPageStateAfterConstellation,
} from './state/sessionStorage';

type BirthdayPhase = 1 | 2 | 3 | 4 | 5;

interface BirthdayPageState {
  phase: BirthdayPhase;
  showConstellation: boolean;
  songId: string | null;
  showConstellationFootprint: boolean;
}

const PAGE_STATE_STORAGE_KEY = JOURNEY_STORAGE_KEYS.page;
const DEFAULT_PAGE_STATE: BirthdayPageState = {
  phase: 1,
  showConstellation: false,
  songId: null,
  showConstellationFootprint: false,
};

const readBirthdayPageState = (): BirthdayPageState => {
  let storedState: string | null;

  try {
    storedState = window.sessionStorage.getItem(PAGE_STATE_STORAGE_KEY);
  } catch (error) {
    console.warn('Could not read the saved birthday page state', error);
    return DEFAULT_PAGE_STATE;
  }

  if (!storedState) return DEFAULT_PAGE_STATE;

  let parsedState: unknown;
  try {
    parsedState = JSON.parse(storedState);
  } catch (error) {
    console.warn('Could not parse the saved birthday page state', error);
    return DEFAULT_PAGE_STATE;
  }

  if (typeof parsedState !== 'object' || parsedState === null) {
    console.warn('The saved birthday page state has an invalid format');
    return DEFAULT_PAGE_STATE;
  }

  const savedState = parsedState as Record<string, unknown>;
  const phase = savedState.phase;
  const showConstellation = savedState.showConstellation;
  const songId = savedState.songId ?? null;
  const showConstellationFootprint = savedState.showConstellationFootprint ?? false;

  if (
    (phase !== 1 && phase !== 2 && phase !== 3 && phase !== 4 && phase !== 5) ||
    typeof showConstellation !== 'boolean' ||
    typeof showConstellationFootprint !== 'boolean' ||
    (songId !== null && (typeof songId !== 'string' || !songs.some((song) => song.id === songId)))
  ) {
    console.warn('The saved birthday page state has invalid values');
    return DEFAULT_PAGE_STATE;
  }

  return { phase, showConstellation, songId, showConstellationFootprint };
};

const BirthdayJourney: React.FC = () => {
  const [pageState, setPageState] = useState(readBirthdayPageState);
  const phase = pageState.phase;
  const showConstellation = pageState.showConstellation;
  const setPhase = (nextPhase: BirthdayPhase) => {
    setPageState((currentState) => ({ ...currentState, phase: nextPhase }));
  };
  const setShowConstellation = (isShown: boolean) => {
    setPageState((currentState) => ({ ...currentState, showConstellation: isShown }));
  };
  const currentSong = songs.find((song) => song.id === pageState.songId) ?? null;
  const [planeArrived, setPlaneArrived] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [collapseOriginY, setCollapseOriginY] = useState(0);
  const [immersiveError, setImmersiveError] = useState('');

  useEffect(() => {
    try {
      window.sessionStorage.setItem(PAGE_STATE_STORAGE_KEY, JSON.stringify(pageState));
    } catch (error) {
      console.warn('Could not save the birthday page state', error);
    }
  }, [pageState]);

  const handleSelectSong = (song: Song) => {
    setPageState((currentState) => ({
      ...currentState,
      phase: 4,
      songId: song.id,
    }));
  };

  const handleSongEnd = useCallback(() => {
    setPageState((currentState) => {
      const alternatives = songs.filter((song) => song.id !== currentState.songId);
      const pool = alternatives.length > 0 ? alternatives : songs;
      const nextSong = pool[Math.floor(Math.random() * pool.length)];
      return { ...currentState, songId: nextSong.id };
    });
  }, []);

const handleBackToHome = () => {
  setPlaneArrived(false);
  setPageState(resetPageStateAfterConstellation);
  setIsCollapsing(false);
  try {
    resetCandleAndMusicProgress(window.sessionStorage);
  } catch (error) {
    console.warn('Could not reset the candle and music progress', error);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const unlockOrientation = () => {
    const orientation = screen.orientation as (ScreenOrientation & {
      unlock?: () => void;
    }) | undefined;

    try {
      orientation?.unlock?.();
    } catch (error) {
      console.warn('Orientation unlock failed', error);
    }
  };

  unlockOrientation();
  if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
    void document.exitFullscreen().then(unlockOrientation).catch((error: unknown) => {
      console.warn('Fullscreen exit failed', error);
      unlockOrientation();
    });
  }
};

const revealConstellationFootprint = () => {
  setPageState((currentState) => ({
    ...currentState,
    showConstellationFootprint: true,
  }));
};

  const requestImmersiveMode = useCallback(async () => {
    if (!document.fullscreenElement) {
      if (!document.fullscreenEnabled || typeof document.documentElement.requestFullscreen !== 'function') {
        setImmersiveError('Browser ini tidak mendukung layar penuh. Coba buka halaman ini di browser lain.');
        return;
      }

      try {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      } catch (error) {
        console.warn('Fullscreen request failed', error);
        setImmersiveError('Layar penuh belum diizinkan. Tekan tombol mode layar penuh untuk mencoba lagi.');
        return;
      }
    }

    const orientation = screen.orientation as (ScreenOrientation & {
      lock?: (orientation: 'landscape') => Promise<void>;
    }) | undefined;

    if (!orientation) {
      setImmersiveError('Layar penuh aktif, tetapi browser ini tidak mendukung kunci landscape.');
      return;
    }

    if (orientation.type.startsWith('landscape')) {
      setImmersiveError('');
      return;
    }

    if (!orientation.lock) {
      setImmersiveError('Layar penuh aktif, tetapi browser ini tidak mendukung kunci landscape.');
      return;
    }

    try {
      await orientation.lock('landscape');
      setImmersiveError('');
    } catch (error) {
      console.warn('Landscape orientation lock failed', error);
      setImmersiveError('Layar penuh aktif, tetapi orientasi landscape tidak dapat dikunci. Putar perangkat secara manual.');
    }
  }, []);

  const handleOpenRandomChapter = () => {
    void requestImmersiveMode();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      setShowConstellation(true);
      return;
    }

    setCollapseOriginY(window.scrollY + window.innerHeight / 2);
    setIsCollapsing(true);
  };

  return (
    <>
      {showConstellation ? (
            <ConstellationChapter
              immersiveError={immersiveError}
              onRequestImmersiveMode={requestImmersiveMode}
              onBack={handleBackToHome}
            />
          ) : (
        <main
          className={`birthday-journey${isCollapsing ? ' birthday-journey--collapsing' : ''}`}
          style={{ '--journey-collapse-origin-y': `${collapseOriginY}px` } as React.CSSProperties}
          onAnimationEnd={(event) => {
            if (
              event.target === event.currentTarget &&
              event.animationName === 'journey-collapse'
            ) {
              window.scrollTo({ top: 0, behavior: 'auto' });
              setShowConstellation(true);
            }
          }}
        >
          <div className="journey-chapter" key={phase} aria-live="polite">
            {phase === 1 && <BirthdayGate onUnlock={() => setPhase(2)} />}
            {phase === 2 && <BirthdayCake onComplete={() => setPhase(3)} />}
            {phase === 3 && <HappyBirthday onSelectSong={handleSelectSong} />}
            {phase === 4 && <PersonalMessage onNext={() => setPhase(5)} />}
            {phase === 5 && (
              <>
                <Memories
                  onPlaneArrived={setPlaneArrived}
                  onOpenRandomChapter={handleOpenRandomChapter}
                  showConstellationFootprint={pageState.showConstellationFootprint}
                />
                <Wishlist
                  onRevealFootprint={revealConstellationFootprint}
                  planeArrived={planeArrived}
                />
              </>
            )}
          </div>

          {phase === 2 || phase === 3 ? (
            <JourneyCatDecorations phase={phase} />
          ) : null}
        </main>
      )}
      {currentSong && phase >= 4 && (
        <MusicPlayer
          key={currentSong.id}
          song={currentSong}
          onSongEnd={handleSongEnd}
          variant={showConstellation ? 'side' : 'bottom'}
        />
      )}
    </>
  );
};

const App: React.FC = () =>
  window.location.pathname.replace(/\/+$/, '') === '/admin' ? <AdminPortal /> : <BirthdayJourney />;

export default App;
