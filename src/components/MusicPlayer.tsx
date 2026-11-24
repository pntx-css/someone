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

const PLAYER_EXPANDED_STORAGE_KEY = 'birthday-music-player-expanded';
const PLAYBACK_STATE_STORAGE_KEY = 'birthday-music-playback';

interface SavedPlaybackState {
  songId: string;
  currentTime: number;
  isPlaying: boolean;
}

const readPlaybackState = (songId: string): SavedPlaybackState | null => {
  let storedState: string | null;
  try {
    storedState = window.sessionStorage.getItem(PLAYBACK_STATE_STORAGE_KEY);
  } catch (error) {
    console.warn('Could not read the saved music playback state', error);
    return null;
  }

  if (!storedState) return null;

  let parsedState: unknown;
  try {
    parsedState = JSON.parse(storedState);
  } catch (error) {
    console.warn('Could not parse the saved music playback state', error);
    return null;
  }

  if (typeof parsedState !== 'object' || parsedState === null) {
    console.warn('The saved music playback state has an invalid format');
    return null;
  }

  const savedState = parsedState as Record<string, unknown>;
  if (
    savedState.songId !== songId ||
    typeof savedState.currentTime !== 'number' ||
    !Number.isFinite(savedState.currentTime) ||
    savedState.currentTime < 0 ||
    typeof savedState.isPlaying !== 'boolean'
  ) {
    return null;
  }

  return {
    songId,
    currentTime: savedState.currentTime,
    isPlaying: savedState.isPlaying,
  };
};

const savePlaybackState = (state: SavedPlaybackState): void => {
  try {
    window.sessionStorage.setItem(PLAYBACK_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Could not save the music playback state', error);
  }
};

const readIsExpanded = (): boolean => {
  try {
    const storedState = window.sessionStorage.getItem(PLAYER_EXPANDED_STORAGE_KEY);
    if (storedState === null) return false;
    if (storedState === 'true') return true;
    if (storedState === 'false') return false;

    console.warn('The saved music player state has an invalid value');
    return false;
  } catch (error) {
    console.warn('Could not read the saved music player state', error);
    return false;
  }
};

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
  const [isExpanded, setIsExpanded] = useState(readIsExpanded);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(PLAYER_EXPANDED_STORAGE_KEY, String(isExpanded));
    } catch (error) {
      console.warn('Could not save the music player state', error);
    }
  }, [isExpanded]);

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
    const savedPlayback = readPlaybackState(song.id);
    const audio = new Audio(song.file);
    let lastSavedAt = 0;
    let hasRestoredPosition = false;
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackMessage('');
    setIsPlaying(false);
    audio.preload = 'metadata';
    audioRef.current = audio;

    const persistPlayback = (isPlayingNow: boolean, force = false) => {
      const now = Date.now();
      if (!force && now - lastSavedAt < 1000) return;
      lastSavedAt = now;
      savePlaybackState({
        songId: song.id,
        currentTime: audio.currentTime,
        isPlaying: isPlayingNow,
      });
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setPlaybackMessage('');

      if (hasRestoredPosition || !savedPlayback || !Number.isFinite(audio.duration)) return;
      hasRestoredPosition = true;
      const maxPosition = Math.max(0, audio.duration - 0.25);
      const restoredPosition = Math.min(savedPlayback.currentTime, maxPosition);
      audio.currentTime = restoredPosition;
      setCurrentTime(restoredPosition);
      setProgress(audio.duration > 0 ? (restoredPosition / audio.duration) * 100 : 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
      persistPlayback(!audio.paused);
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        persistPlayback(false, true);
        onSongEndRef.current();
      };

    const handlePageHide = () => persistPlayback(!audio.paused, true);

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
    window.addEventListener('pagehide', handlePageHide);

    if (savedPlayback?.isPlaying ?? true) {
      audio.play().then(() => {
        if (!isActive) return;
        setIsPlaying(true);
        setPlaybackMessage('');
        persistPlayback(true, true);
      }).catch(handlePlayFailure);
    }

    return () => {
      isActive = false;
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      window.removeEventListener('pagehide', handlePageHide);
      audio.pause();
      audio.src = '';
      audio.remove();
    };
  }, [song.file, song.id]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      savePlaybackState({
        songId: song.id,
        currentTime: audio.currentTime,
        isPlaying: false,
      });
    } else {
      audio.play()
        .then(() => {
          if (audioRef.current !== audio || audio.paused) return;
          setIsPlaying(true);
          setPlaybackMessage('');
          savePlaybackState({
            songId: song.id,
            currentTime: audio.currentTime,
            isPlaying: true,
          });
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
  }, [isPlaying, song.file, song.id]);

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
