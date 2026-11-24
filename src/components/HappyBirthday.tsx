import React, { useState } from 'react';
import { songs } from '../data/music';
import type { Song } from '../data/music';
import { AnimatedText } from './AnimatedText';
import './HappyBirthday.css';

interface HappyBirthdayProps {
  onSelectSong: (song: Song) => void;
}

export const HappyBirthday: React.FC<HappyBirthdayProps> = ({ onSelectSong }) => {
  const [selectingSongId, setSelectingSongId] = useState<string | null>(null);

  const handleSelectSong = (song: Song) => {
    if (selectingSongId) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onSelectSong(song);
      return;
    }

    setSelectingSongId(song.id);
    window.setTimeout(() => onSelectSong(song), 480);
  };

  return (
    <div className="hb-container">
      <h1 className="hb-title">
        <AnimatedText text="Happy Birthday" effect="burst" duration={560} interval={18} />
      </h1>
      <p className="hb-subtitle">
        <AnimatedText text="this one's for you ♡" delay={300} />
      </p>

      <p className="music-prompt">
        <AnimatedText text="pick a song for the journey" delay={620} />
      </p>

      <div className="music-list">
        {songs.map((song, index) => (
          <div
            className="music-card-reveal"
            key={song.id}
            style={{ '--card-index': index } as React.CSSProperties}
          >
            <button
              className="music-card"
              type="button"
              onClick={() => handleSelectSong(song)}
              disabled={selectingSongId !== null}
            >
              <div className="music-card-icon">♪</div>
              <div className="music-card-info">
                <div className="music-card-title">{song.title}</div>
                <div className="music-card-artist">{song.artist}</div>
              </div>
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};
