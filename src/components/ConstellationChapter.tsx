import React, { useEffect, useRef, useState } from 'react';
import './ConstellationChapter.css';

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
const STAR_INTERVAL_MS = 650;
const LINE_START_DELAY_MS = 650;
const LINE_INTERVAL_MS = 140;
const STAR_POINTS = SKY_STARS;
const LARGE_STAR_INDICES = new Set([0, 6, 8, 10, 18]);

interface ConstellationChapterProps {
  immersiveError: string;
  onRequestImmersiveMode: () => Promise<void>;
}

export const ConstellationChapter: React.FC<ConstellationChapterProps> = ({
  immersiveError,
  onRequestImmersiveMode,
}) => {
  const [litStarCount, setLitStarCount] = useState(0);
  const [visibleLineCount, setVisibleLineCount] = useState(0);
  const [selectedStarIndex, setSelectedStarIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isComplete = visibleLineCount === CONSTELLATION_EDGES.length;

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
  }, []);

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

    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedStarIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStarIndex]);

  return (
    <main className="constellation-page">
      <div className="constellation-nebula" aria-hidden="true" />
      <div className="constellation-starfield" aria-hidden="true" />
      <svg
        className="constellation-horizon"
        viewBox="0 0 1440 300"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          className="constellation-mountain-back"
          d="M0 300V205l96-72 74 40 122-111 105 91 98-59 106 78 98-107 99 84 127-98 120 102 101-64 123 82 71-34 100 68v95H0Z"
        />
        <path
          className="constellation-mountain-front"
          d="M0 300V240l105-58 85 44 108-91 93 86 110-51 88 61 118-99 106 86 115-65 118 63 105-80 95 66 103-45 89 51v92H0Z"
        />
        <path
          className="constellation-tree-line"
          d="M0 300v-47l18-39 18 39h-11l24 33 19-48 21-45 21 45h-12l27 49 18-40 19-37 20 37h-12l23 32 19-54 24-45 24 45h-14l27 54 18-43 20-37 20 37h-12l25 43 20-48 21-43 21 43h-13l26 48 19-44 21-38 21 38h-13l25 44 21-54 22-46 22 46h-14l29 53 18-39 20-35 20 35h-12l26 40 18-47 21-42 21 42h-13l27 47 20-50 23-45 23 45h-14l29 50 19-45 20-37 20 37h-12l25 41 18-47 22-43 22 43h-14l28 47 20-51 22-43 22 43h-13l27 49 20-45 20-38 20 38h-12l26 41 20-48 21-42 21 42h-13l27 47 19-48 21-43 21 43h-13l27 48 18-43 20-37 20 37h-12l24 41 19-47 21-42 21 42h-13l26 47 20-47 20-39 20 39h-12l24 41 19-48 20-42 20 42h-12l25 48v47H0Z"
        />
      </svg>

      <div className="constellation-controls">
        <button
          className="constellation-immersive-button"
          type="button"
          onClick={() => void onRequestImmersiveMode()}
          disabled={isFullscreen && !immersiveError}
        >
          {isFullscreen && !immersiveError ? 'Layar penuh aktif' : 'Layar penuh & landscape'}
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
                  className={`constellation-star${index < litStarCount ? ' is-lit' : ''}${point.isPrimary ? ' is-primary' : ''}${[0, 2, 4, 6, 8, 10, 12, 14, 17, 18].includes(index) ? ' is-prominent' : ''}${LARGE_STAR_INDICES.has(index) ? ' is-large' : ''}${canOpenMemory ? ' is-clickable' : ''}`}
                  style={{ '--twinkle-delay': `${index * 180}ms` } as React.CSSProperties}
                  role={canOpenMemory ? 'button' : undefined}
                  tabIndex={canOpenMemory ? 0 : undefined}
                  aria-label={canOpenMemory ? `Buka kenangan bintang ${index + 1}` : undefined}
                  onClick={canOpenMemory ? () => setSelectedStarIndex(index) : undefined}
                  onKeyDown={canOpenMemory ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedStarIndex(index);
                    }
                  } : undefined}
                >
                  <path
                    className="constellation-star-rays"
                    d="M 0 -22 C 0.45 -7 0.85 -0.8 22 0 C 0.85 0.8 0.45 7 0 22 C -0.45 7 -0.85 0.8 -22 0 C -0.85 -0.8 -0.45 -7 0 -22 Z"
                  />
                  <circle r={1.3 + (4.52 - point.magnitude) * 0.3 + (LARGE_STAR_INDICES.has(index) ? 0.6 : 0)} />
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {selectedStarIndex !== null && (
        <div
          className="constellation-popup-backdrop"
          onClick={() => setSelectedStarIndex(null)}
        >
          <section
            className="constellation-popup"
            role="dialog"
            aria-modal="true"
            aria-labelledby="constellation-popup-title"
            aria-describedby="constellation-popup-caption"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              ref={closeButtonRef}
              className="constellation-popup-close"
              type="button"
              onClick={() => setSelectedStarIndex(null)}
              aria-label="Tutup pop-up"
            >
              ×
            </button>
            <div className="constellation-popup-photo" role="img" aria-label="Placeholder foto">
              <span>Foto sementara</span>
            </div>
            <div className="constellation-popup-copy">
              <p className="constellation-popup-eyebrow">
                BINTANG {String(selectedStarIndex + 1).padStart(2, '0')}
              </p>
              <h2 id="constellation-popup-title">Kenangan di bawah bintang</h2>
              <p id="constellation-popup-caption">
                Judul dan caption kenangan akan ditambahkan di sini.
              </p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};
