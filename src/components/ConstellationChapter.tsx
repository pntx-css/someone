import React, { useCallback, useEffect, useRef, useState } from 'react';
import './ConstellationChapter.css';
import { GalaxyBackground } from './GalaxyBackground';
import { MiniGalaxy } from './MiniGalaxy';
import { constellationMemories } from '../data/constellationMemories';

interface StarCoordinate {
  id: string;
  x: number;
  y: number;
  magnitude: number;
  isPrimary?: boolean;
}

// Relative positions follow Sagittarius' recognizable bow, teapot, and southern tail.
const SKY_STARS: readonly StarCoordinate[] = [
  { id: 'star-01', x: 360, y: 80, magnitude: 1.8, isPrimary: true },
  { id: 'star-02', x: 395, y: 92, magnitude: 4.5 },
  { id: 'star-03', x: 435, y: 128, magnitude: 2.99, isPrimary: true },
  { id: 'star-04', x: 463, y: 131, magnitude: 4.5 },
  { id: 'star-05', x: 492, y: 111, magnitude: 2.7, isPrimary: true },
  { id: 'star-06', x: 510, y: 190, magnitude: 4.5 },
  { id: 'star-07', x: 555, y: 200, magnitude: 2.81, isPrimary: true },
  { id: 'star-08', x: 625, y: 160, magnitude: 4.5 },
  { id: 'star-09', x: 675, y: 55, magnitude: 3.2, isPrimary: true },
  { id: 'star-10', x: 640, y: 237, magnitude: 4.5 },
  { id: 'star-11', x: 700, y: 242, magnitude: 2, isPrimary: true },
  { id: 'star-12', x: 765, y: 185, magnitude: 4.5 },
  { id: 'star-13', x: 625, y: 305, magnitude: 3.32, isPrimary: true },
  { id: 'star-14', x: 660, y: 355, magnitude: 4.5 },
  { id: 'star-15', x: 500, y: 270, magnitude: 2.6, isPrimary: true },
  { id: 'star-16', x: 470, y: 225, magnitude: 3.11, isPrimary: true },
  { id: 'star-17', x: 355, y: 210, magnitude: 3.86, isPrimary: true },
  { id: 'star-18', x: 285, y: 275, magnitude: 3.93, isPrimary: true },
  { id: 'star-19', x: 270, y: 290, magnitude: 2.89, isPrimary: true },
  { id: 'star-20', x: 345, y: 415, magnitude: 3.77, isPrimary: true },
  { id: 'star-21', x: 385, y: 485, magnitude: 3.51, isPrimary: true },
  { id: 'star-22', x: 485, y: 425, magnitude: 4.5 },
  { id: 'star-23', x: 505, y: 495, magnitude: 4.5 },
] as const;

const CONSTELLATION_EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [5, 6],
  [6, 7], [7, 8], [7, 9], [9, 10], [10, 11], [9, 12],
  [10, 12], [12, 13], [12, 14], [14, 15], [15, 16], [16, 17],
  [17, 18], [18, 19], [19, 20], [20, 21], [20, 22],
  [6, 9], [14, 6],
];

const STAR_COUNT = SKY_STARS.length;
const STAR_START_DELAY_MS = 1200;
const STAR_INTERVAL_MS = 450;
const LINE_START_DELAY_MS = 650;
const LINE_INTERVAL_MS = 140;
const STAR_POINTS = SKY_STARS;

interface ConstellationChapterProps {
  immersiveError: string;
  onRequestImmersiveMode: () => Promise<void>;
  onBack: () => void;
}

export const ConstellationChapter: React.FC<ConstellationChapterProps> = ({
  immersiveError,
  onRequestImmersiveMode,
  onBack,
}) => {
  const [isGalaxyFormed, setIsGalaxyFormed] = useState(false);
  const [litStarCount, setLitStarCount] = useState(0);
  const [visibleLineCount, setVisibleLineCount] = useState(0);
  const [selectedStarIndex, setSelectedStarIndex] = useState<number | null>(null);
  const [isMemoryInfoOpen, setIsMemoryInfoOpen] = useState(false);
  const [isTallMemory, setIsTallMemory] = useState(false);
  const [isPopupClosing, setIsPopupClosing] = useState(false);
  const [isInfoClosing, setIsInfoClosing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [clickedStarIds, setClickedStarIds] = useState<Set<string>>(
  () => new Set()
);

const showHomeButton = clickedStarIds.size >= 5;
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const infoCloseButtonRef = useRef<HTMLButtonElement>(null);
  const isComplete = visibleLineCount === CONSTELLATION_EDGES.length;
  const handleGalaxyFormationComplete = useCallback(() => setIsGalaxyFormed(true), []);
  const selectedMemory = selectedStarIndex === null
    ? null
    : constellationMemories[selectedStarIndex];
  const closeMemoryPopup = useCallback(() => {
    if (isPopupClosing) return;

    setIsPopupClosing(true);

    window.setTimeout(() => {
      setIsPopupClosing(false);
      setIsMemoryInfoOpen(false);
      setIsTallMemory(false);
      setSelectedStarIndex(null);
    }, 350);
  }, [isPopupClosing]);
  const closeMemoryInfo = useCallback(() => {
    if (isInfoClosing) return;

    setIsInfoClosing(true);

    window.setTimeout(() => {
      setIsInfoClosing(false);
      setIsMemoryInfoOpen(false);
    }, 250);
  }, [isInfoClosing]);

  useEffect(() => {
    const rootStyle = document.documentElement.style;
    const previousGutter = rootStyle.getPropertyValue('scrollbar-gutter');
    rootStyle.setProperty('scrollbar-gutter', 'auto');

    return () => {
      if (previousGutter) {
        rootStyle.setProperty('scrollbar-gutter', previousGutter);
      } else {
        rootStyle.removeProperty('scrollbar-gutter');
      }
    };
  }, []);

  useEffect(() => {
    const updateFullscreenState = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', updateFullscreenState);
    return () => document.removeEventListener('fullscreenchange', updateFullscreenState);
  }, []);

  useEffect(() => {
    if (!isGalaxyFormed) return;

    let startTimer = 0;
    let nextStarTimer = 0;

    const lightStar = (index: number) => {
      setLitStarCount(index + 1);
      if (index + 1 === STAR_COUNT) return;

      nextStarTimer = window.setTimeout(() => lightStar(index + 1), STAR_INTERVAL_MS);
    };

    startTimer = window.setTimeout(() => lightStar(0), STAR_START_DELAY_MS);
    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(nextStarTimer);
    };
  }, [isGalaxyFormed]);

  useEffect(() => {
    if (litStarCount !== STAR_COUNT) return;

    let lineIndex = 0;
    let lineTimer = window.setTimeout(revealNextLine, LINE_START_DELAY_MS);

    function revealNextLine() {
      setVisibleLineCount(++lineIndex);
      if (lineIndex < CONSTELLATION_EDGES.length) {
        lineTimer = window.setTimeout(revealNextLine, LINE_INTERVAL_MS);
      }
    }

    return () => window.clearTimeout(lineTimer);
  }, [litStarCount]);

  useEffect(() => {
    if (selectedStarIndex === null) return;

    if (isMemoryInfoOpen) {
      infoCloseButtonRef.current?.focus();
    } else {
      closeButtonRef.current?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
  if (isMemoryInfoOpen) {
    closeMemoryInfo();
  } else {
    closeMemoryPopup();
  }
}
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeMemoryInfo, closeMemoryPopup, isMemoryInfoOpen, selectedStarIndex]);

  const openMemoryPopup = (index: number) => {
  const clickedStar = STAR_POINTS[index];

  setClickedStarIds((prev) => {
    const next = new Set(prev);
    next.add(clickedStar.id);
    return next;
  });

  setIsPopupClosing(false);
  setIsInfoClosing(false);
  setIsMemoryInfoOpen(false);
  setIsTallMemory(false);
  setSelectedStarIndex(index);
};
  return (
  <main className="constellation-page">

    {showHomeButton && (
      <button
        className="constellation-home-button"
        type="button"
        onClick={onBack}
        aria-label="Kembali ke halaman awal"
        title="Kembali ke halaman awal"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M9 14L4 9L9 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 9H14C18 9 20 12 20 16V19"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    )}

    <GalaxyBackground onFormationComplete={handleGalaxyFormationComplete} />
    <MiniGalaxy />
      <div className="constellation-nebula" aria-hidden="true" />
      <div className="constellation-starfield" aria-hidden="true" />
      <div className="constellation-controls">
        <button
          className="constellation-immersive-button"
          type="button"
          onClick={() => void onRequestImmersiveMode()}
          disabled={isFullscreen && !immersiveError}
          aria-label={isFullscreen && !immersiveError ? 'Keluar dari mode layar penuh' : 'Aktifkan layar penuh dan landscape'}
          title={isFullscreen && !immersiveError ? 'Keluar dari mode layar penuh' : 'Aktifkan layar penuh dan landscape'}
        >
          ⛶
        </button>
        {immersiveError && (
          <p className="constellation-immersive-message" role="status">
            {immersiveError}
          </p>
        )}
      </div>

      <svg
        className={`constellation-map${isComplete ? ' is-complete' : ''}`}
        viewBox="0 0 1000 560"
        role="img"
        aria-labelledby="sagittarius-title sagittarius-description"
      >
        <title id="sagittarius-title">Rasi bintang Sagittarius</title>
        <desc id="sagittarius-description">
          Dua puluh tiga bintang berkilau lalu terhubung membentuk rasi Sagittarius.
        </desc>

        <g className="constellation-lines">
          {CONSTELLATION_EDGES.map(([fromIndex, toIndex], index) => {
            const from = STAR_POINTS[fromIndex];
            const to = STAR_POINTS[toIndex];
            const isVisible = index < visibleLineCount;
            return (
              <line
                key={`${fromIndex}-${toIndex}`}
                className={isVisible ? 'is-visible' : ''}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                pathLength="1"
              />
            );
          })}
        </g>

        <g className="constellation-stars">
          {STAR_POINTS.map((point, index) => {
            const canOpenMemory = isComplete;
            return (
              <g key={`${point.x}-${point.y}`} transform={`translate(${point.x} ${point.y})`}>
                <g
                  className={`constellation-star${index < litStarCount ? ' is-lit' : ''}${point.isPrimary ? ' is-primary' : ''}${canOpenMemory ? ' is-clickable' : ''}`}
                  style={{ '--twinkle-delay': `${index * 180}ms` } as React.CSSProperties}
                  role={canOpenMemory ? 'button' : undefined}
                  tabIndex={canOpenMemory ? 0 : undefined}
                  aria-label={canOpenMemory ? `Buka kenangan bintang ${index + 1}` : undefined}
                  onClick={canOpenMemory ? () => openMemoryPopup(index) : undefined}
                  onKeyDown={canOpenMemory ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openMemoryPopup(index);
                    }
                  } : undefined}
                >
                  <circle r={2.6} />
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {selectedStarIndex !== null && selectedMemory && (
        <div
          className={`constellation-popup-backdrop${isPopupClosing ? ' is-closing' : ''}`}
          onClick={closeMemoryPopup}
        >
          <section
            className={`constellation-popup${isTallMemory ? ' is-tall-photo' : ''}${isPopupClosing ? ' is-closing' : ''}`}
            role="dialog"
            aria-modal={!isMemoryInfoOpen}
            aria-labelledby="constellation-photo-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="constellation-popup-header">
              <button
                className="constellation-popup-info"
                type="button"
                onClick={() => setIsMemoryInfoOpen(true)}
                aria-label="Lihat caption kenangan"
                aria-haspopup="dialog"
                aria-expanded={isMemoryInfoOpen}
              >
                i
              </button>
              <h2 id="constellation-photo-title">{selectedMemory.title}</h2>
              <button
                ref={closeButtonRef}
                className="constellation-popup-close"
                type="button"
                onClick={closeMemoryPopup}
                aria-label="Tutup pop-up"
              >
                ×
              </button>
            </header>
            <div className="constellation-popup-photo">
              <img
                className="constellation-popup-media"
                src={selectedMemory.src}
                alt={`Kenangan bintang ${selectedStarIndex + 1}`}
                decoding="async"
                onLoad={(event) => {
                  const { naturalWidth, naturalHeight } = event.currentTarget;
                  setIsTallMemory(naturalWidth / naturalHeight <= 0.65);
                }}
              />
            </div>
          </section>
        </div>
      )}

      {isMemoryInfoOpen && selectedStarIndex !== null && selectedMemory && (
        <div
          className={`constellation-info-backdrop${isInfoClosing ? ' is-closing' : ''}`}
          onClick={() => setIsMemoryInfoOpen(false)}
        >
          <section
            className={`constellation-info-popup${isInfoClosing ? ' is-closing' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Caption kenangan"
            aria-describedby="constellation-popup-caption"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              ref={infoCloseButtonRef}
              className="constellation-popup-close"
              type="button"
              onClick={closeMemoryInfo}
              aria-label="Tutup informasi kenangan"
            >
              ×
            </button>
            <div className="constellation-popup-copy">
              <p id="constellation-popup-caption">
                {selectedMemory.caption}
              </p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};
