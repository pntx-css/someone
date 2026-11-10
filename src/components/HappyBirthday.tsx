import React from 'react';
import { songs } from '../data/music';
import type { Song } from '../data/music';
import './HappyBirthday.css';

interface HappyBirthdayProps {
  onSelectSong: (song: Song) => void;
}

export const HappyBirthday: React.FC<HappyBirthdayProps> = ({ onSelectSong }) => {
  return (
    <div className="hb-container">
      <h1 className="hb-title">HAPPY BIRTHDAY MAYLUVVV</h1>
      <p className="hb-subtitle">this one's for you ♡</p>

      <p className="music-prompt">pick a song for the journey</p>

      <div className="music-list">
        {songs.map((song) => (
          <button
            key={song.id}
            className="music-card"
            onClick={() => onSelectSong(song)}
          >
            <div className="music-card-icon">♪</div>
            <div className="music-card-info">
              <div className="music-card-title">{song.title}</div>
              <div className="music-card-artist">{song.artist}</div>
            </div>
          </button>
        ))}
      </div>

    </div>
  );
};
