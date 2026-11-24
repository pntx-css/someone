import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { Song } from '../data/music';
import './MusicPlayer.css';

interface MusicPlayerProps {
  song: Song;
  onSongEnd: () => void;
  variant?: 'bottom' | 'side';
}

const formatTime = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError';

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  song,
  onSongEnd,
  variant = 'bottom',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onSongEndRef = useRef(onSongEnd);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSongChanging, setIsSongChanging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackMessage, setPlaybackMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Animate when a new song is selected
    useEffect(() => {
      setIsSongChanging(false);

      const frame = requestAnimationFrame(() => {
        setIsSongChanging(true);
      });

      const timeout = window.setTimeout(() => {
        setIsSongChanging(false);
      }, 750);

      return () => {
        cancelAnimationFrame(frame);
        window.clearTimeout(timeout);
      };
    }, [song.file]);

    // Keep the latest callback without recreating audio
    useEffect(() => {
      onSongEndRef.current = onSongEnd;
    }, [onSongEnd]);
  useEffect(() => {
    let isActive = true;
    const audio = new Audio(song.file);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackMessage('');
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
        onSongEndRef.current();
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
      if (!isActive || isAbortError(error)) return;

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
      if (!isActive) return;
      setIsPlaying(true);
      setPlaybackMessage('');
    }).catch(handlePlayFailure);

    return () => {
      isActive = false;
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
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
      audio.play()
        .then(() => {
          if (audioRef.current !== audio || audio.paused) return;
          setIsPlaying(true);
          setPlaybackMessage('');
        })
        .catch((error: unknown) => {
          if (isAbortError(error)) return;

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
    <div
      className={[
        'music-player',
        `music-player--${variant}`,
        isExpanded ? 'music-player--expanded' : '',
        isSongChanging ? 'music-player--song-changing' : '',
      ].filter(Boolean).join(' ')}>
      {variant === 'side' && !isExpanded ? (
        <button
          className="player-btn player-note-toggle"
          type="button"
          onClick={() => setIsExpanded(true)}
          aria-label="Tampilkan pemutar musik"
          aria-expanded={false}
        >
          ♪
        </button>
      ) : (
        <>
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

          {variant === 'side' && (
            <button
              className="player-btn player-note-toggle"
              type="button"
              onClick={() => setIsExpanded(false)}
              aria-label="Tutup pemutar musik"
              aria-expanded={true}
            >
              ♪
            </button>
          )}
        </>
      )}
    </div>
  );
};
