import React, { useState } from 'react';
import { BirthdayGate } from './components/BirthdayGate';
import { BirthdayCake } from './components/BirthdayCake';
import { HappyBirthday } from './components/HappyBirthday';
import { MusicPlayer } from './components/MusicPlayer';
import { PersonalMessage } from './components/PersonalMessage';
import { Memories } from './components/Memories';
import { Wishlist } from './components/Wishlist';
import { AdminPortal } from './components/AdminPortal';
import type { Song } from './data/music';

const BirthdayJourney: React.FC = () => {
  const [phase, setPhase] = useState(1);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

  const handleSelectSong = (song: Song) => {
    setCurrentSong(song);
    setPhase(4); // Move past music selection
  };

  return (
    <>
      {phase === 1 && <BirthdayGate onUnlock={() => setPhase(2)} />}
      {phase === 2 && <BirthdayCake onComplete={() => setPhase(3)} />}
      {phase === 3 && <HappyBirthday onSelectSong={handleSelectSong} />}
      {phase === 4 && <PersonalMessage onNext={() => setPhase(5)} />}
      {phase === 5 && (
        <>
          <Memories />
          <Wishlist />
        </>
      )}

      {/* Persistent music player — visible whenever a song is selected */}
      {currentSong && <MusicPlayer song={currentSong} />}
    </>
  );
};

const App: React.FC = () =>
  window.location.pathname.replace(/\/+$/, '') === '/admin' ? <AdminPortal /> : <BirthdayJourney />;

export default App;
