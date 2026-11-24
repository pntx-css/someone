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
  const [isExiting, setIsExiting] = useState(false);

  const [ripple, setRipple] = useState<{
    songId: string;
    x: number;
    y: number;
    size: number;
  } | null>(null);

  const handleSelectSong = (
    song: Song,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (selectingSongId) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onSelectSong(song);
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();

    const clickIsInsideButton =
      event.clientX >= bounds.left &&
      event.clientX <= bounds.right &&
      event.clientY >= bounds.top &&
      event.clientY <= bounds.bottom;

    const x = clickIsInsideButton
      ? event.clientX - bounds.left
      : bounds.width / 2;

    const y = clickIsInsideButton
      ? event.clientY - bounds.top
      : bounds.height / 2;

    const size =
      Math.hypot(
        Math.max(x, bounds.width - x),
        Math.max(y, bounds.height - y)
      ) * 2;

    setRipple({
      songId: song.id,
      x,
      y,
      size,
    });

    setSelectingSongId(song.id);
    setIsExiting(true);

    window.setTimeout(() => {
      onSelectSong(song);
    }, 950);
  };

  return (
    <div
      className={`hb-container${isExiting ? ' hb-container--exiting' : ''}`}
    >
      <h1 className="hb-title">
        <AnimatedText
          text="Happy Birthday"
          effect="burst"
          duration={560}
          interval={18}
        />
      </h1>

      <p className="hb-subtitle">
        <AnimatedText
          text="this one's for you ♡"
          delay={300}
        />
      </p>

      <p className="music-prompt">
        <AnimatedText
          text="pick a song for the journey"
          delay={620}
        />
      </p>

      <div className="music-list">
        {songs.map((song, index) => (
          <div
            className="music-card-reveal"
            key={song.id}
            style={
              {
                '--card-index': index,
              } as React.CSSProperties
            }
          >
            <button
              className={`music-card${
                selectingSongId === song.id ? ' music-card--jelly' : ''
              }`}
              type="button"
              onClick={(event) => handleSelectSong(song, event)}
              disabled={selectingSongId !== null}
            >
              {ripple?.songId === song.id && (
                <span
                  className="music-card-ripple"
                  aria-hidden="true"
                  style={
                    {
                      '--ripple-x': `${ripple.x}px`,
                      '--ripple-y': `${ripple.y}px`,
                      '--ripple-size': `${ripple.size}px`,
                    } as React.CSSProperties
                  }
                />
              )}

              <div className="music-card-icon">
                ♪
              </div>

              <div className="music-card-info">
                <div className="music-card-title">
                  {song.title}
                </div>

                <div className="music-card-artist">
                  {song.artist}
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};