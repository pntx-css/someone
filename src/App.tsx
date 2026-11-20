import React, { useCallback, useState } from 'react';
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

const BirthdayJourney: React.FC = () => {
  const [phase, setPhase] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [planeArrived, setPlaneArrived] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [showConstellation, setShowConstellation] = useState(false);
  const [collapseOriginY, setCollapseOriginY] = useState(0);
  const [immersiveError, setImmersiveError] = useState('');

  const handleSelectSong = (song: Song) => {
    setCurrentSong(song);
    setPhase(4); // Move past music selection
  };

  const handleSongEnd = useCallback(() => {
    setCurrentSong((playingSong) => {
      const alternatives = songs.filter((song) => song.id !== playingSong?.id);
      const pool = alternatives.length > 0 ? alternatives : songs;
      return pool[Math.floor(Math.random() * pool.length)];
    });
  }, []);

  const handleWishlistBack = () => {
    setPlaneArrived(false);
    setPhase(1);
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
                />
                <Wishlist
                  onBack={handleWishlistBack}
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
