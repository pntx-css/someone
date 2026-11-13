import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { Song } from '../data/music';
import './MusicPlayer.css';

interface MusicPlayerProps {
  song: Song;
  onSongEnd: () => void;
}

const formatTime = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ song, onSongEnd }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackMessage, setPlaybackMessage] = useState('');

  // Create audio element once and persist it
  useEffect(() => {
    const audio = new Audio(song.file);
    audio.preload = 'metadata';
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setPlaybackMessage('');
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      onSongEnd();
    };

    const handleError = () => {
      const code = audio.error?.code;
      console.error('Music file failed to load', { file: song.file, mediaErrorCode: code });
      setIsPlaying(false);
      setPlaybackMessage(
        code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
          ? 'Format file musik tidak didukung browser.'
          : 'File musik tidak dapat dimuat. Coba muat ulang halaman.'
      );
    };

    const handlePlayFailure = (error: unknown) => {
      setIsPlaying(false);
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setPlaybackMessage('Autoplay diblokir browser. Tekan tombol putar untuk memulai musik.');
        return;
      }

      console.error('Music playback failed', {
        file: song.file,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      setPlaybackMessage('Musik belum dapat diputar. Coba tekan tombol putar lagi.');
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Autoplay after user selects
    audio.play().then(() => {
      setIsPlaying(true);
      setPlaybackMessage('');
    }).catch(handlePlayFailure);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
      audio.remove();
    };
  }, [song.file, onSongEnd]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => {
          setIsPlaying(true);
          setPlaybackMessage('');
        })
        .catch((error: unknown) => {
          setIsPlaying(false);
          if (error instanceof DOMException && error.name === 'NotAllowedError') {
            setPlaybackMessage('Browser memblokir pemutaran. Coba tekan tombol putar lagi.');
            return;
          }
          console.error('Music playback failed', {
            file: song.file,
            errorName: error instanceof Error ? error.name : 'UnknownError',
          });
          setPlaybackMessage('Musik belum dapat diputar. Coba tekan tombol putar lagi.');
        });
    }
  }, [isPlaying, song.file]);

  const handleProgressChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const audio = audioRef.current;
      if (!audio || !audio.duration) return;
      audio.currentTime = (Number(event.currentTarget.value) / 100) * audio.duration;
    },
    []
  );

  return (
    <div className="music-player">
      <button
        className="player-btn"
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Jeda musik' : 'Putar musik'}
      >
        {isPlaying ? '❚❚' : '▶'}
      </button>

      <div className="player-info">
        <div className="player-song-name">
          {song.title} — {song.artist}
        </div>
        <input
          className="player-progress-bar"
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          onChange={handleProgressChange}
          aria-label={`Posisi lagu ${song.title}`}
        />
        {playbackMessage && (
          <p className="player-status" role="status">
            {playbackMessage}
          </p>
        )}
      </div>

      <div className="player-time" aria-live="off">
        {formatTime(currentTime)}/{formatTime(duration)}
      </div>
    </div>
  );
};
