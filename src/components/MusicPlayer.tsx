import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { Song } from '../data/music';
import './MusicPlayer.css';

interface MusicPlayerProps {
  song: Song;
}

const formatTime = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ song }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Create audio element once and persist it
  useEffect(() => {
    const audio = new Audio(song.file);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    });

    // Autoplay after user selects
    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {
      // Browser blocked autoplay, user can click play
      setIsPlaying(false);
    });

    return () => {
      audio.pause();
      audio.src = '';
      audio.remove();
    };
  }, [song.file]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true));
    }
  }, [isPlaying]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = clickX / rect.width;
    audio.currentTime = pct * audio.duration;
  }, []);

  return (
    <div className="music-player">
      <button className="player-btn" onClick={togglePlay}>
        {isPlaying ? '❚❚' : '▶'}
      </button>

      <div className="player-info">
        <div className="player-song-name">
          {song.title} — {song.artist}
        </div>
        <div className="player-progress-bar" onClick={handleProgressClick}>
          <div
            className="player-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="player-time">
        {formatTime(currentTime)}/{formatTime(duration)}
      </div>
    </div>
  );
};
