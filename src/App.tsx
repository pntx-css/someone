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
import { songs, type Song } from './data/music';

const BirthdayJourney: React.FC = () => {
  const [phase, setPhase] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

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

  return (
    <main className="birthday-journey">
      <div className="journey-chapter" key={phase} aria-live="polite">
        {phase === 1 && <BirthdayGate onUnlock={() => setPhase(2)} />}
        {phase === 2 && <BirthdayCake onComplete={() => setPhase(3)} />}
        {phase === 3 && <HappyBirthday onSelectSong={handleSelectSong} />}
        {phase === 4 && <PersonalMessage onNext={() => setPhase(5)} />}
        {phase === 5 && (
          <>
          <Memories />
          <Wishlist onBack={() => setPhase(1)} />
          </>
        )}
      </div>

      {currentSong && phase >= 4 && <MusicPlayer song={currentSong} onSongEnd={handleSongEnd} />}
      {phase !== 1 && <JourneyCatDecorations phase={phase} />}
    </main>
  );
};

const App: React.FC = () =>
  window.location.pathname.replace(/\/+$/, '') === '/admin' ? <AdminPortal /> : <BirthdayJourney />;

export default App;
