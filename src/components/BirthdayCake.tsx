import React, { useState } from 'react';
import './BirthdayCake.css';

type CandleState = 'flame' | 'smoke' | 'extinguished';

export const BirthdayCake: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [candles, setCandles] = useState<CandleState[]>(['flame', 'flame', 'flame']);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleCandleClick = (index: number) => {
    if (candles[index] !== 'flame') return;

    const newCandles = [...candles];
    newCandles[index] = 'smoke';
    setCandles(newCandles);

    // Smoke → Extinguished after animation
    setTimeout(() => {
      setCandles(prev => {
        const updated = [...prev];
        updated[index] = 'extinguished';

        // Check if all 3 are now extinguished
        const allOut = updated.every(c => c === 'extinguished');
        if (allOut) {
          setTimeout(() => {
            setIsCompleted(true);
            setTimeout(() => onComplete(), 2000);
          }, 6000);
        }

        return updated;
      });
    }, 1400);
  };

  // Original SVG flame paths — positioned exactly on top of each candle wick
  const flamePaths = [
    // Left candle (x=10.336)
    {
      flame: 'M10.336 6.667c-1.162 0-2.076-.532-2.445-1.423c-.321-.773-.479-2.45 2.058-4.986a.547.547 0 0 1 .774 0c2.537 2.537 2.378 4.213 2.058 4.986c-.369.891-1.283 1.423-2.445 1.423z',
      inner: 'M10.336 6.12c-.71 0-1.19-.37-1.27-.98-.12-.9.48-1.96 1.31-3.07-.03.92.66 1.39.76 2.2.09.77-.26 1.85-.8 1.85z',
      core: 'M10.336 5.84c-.31 0-.53-.17-.56-.45-.04-.38.2-.85.61-1.36-.02.43.28.72.33 1.09.05.4-.14.72-.38.72z',
      smoke: 'M 10.336 4 Q 9 2, 10.8 0.5 T 9.8 -1.5',
    },
    // Center candle (x=18)
    {
      flame: 'M18 9.952c-1.162 0-2.076-.532-2.445-1.423c-.321-.773-.479-2.45 2.058-4.986a.547.547 0 0 1 .774 0c2.537 2.537 2.378 4.213 2.058 4.986c-.369.891-1.283 1.423-2.445 1.423z',
      inner: 'M18 9.405c-.71 0-1.19-.37-1.27-.98-.12-.9.48-1.96 1.31-3.07-.03.92.66 1.39.76 2.2.09.77-.26 1.85-.8 1.85z',
      core: 'M18 9.125c-.31 0-.53-.17-.56-.45-.04-.38.2-.85.61-1.36-.02.43.28.72.33 1.09.05.4-.14.72-.38.72z',
      smoke: 'M 18 7.3 Q 16.5 5.3, 18.8 3.8 T 17.5 1.5',
    },
    // Right candle (x=25.664)
    {
      flame: 'M25.664 6.667c-1.162 0-2.076-.532-2.445-1.423c-.32-.773-.479-2.45 2.058-4.986a.547.547 0 0 1 .774 0c2.537 2.537 2.378 4.213 2.058 4.986c-.369.891-1.283 1.423-2.445 1.423z',
      inner: 'M25.664 6.12c-.71 0-1.19-.37-1.27-.98-.12-.9.48-1.96 1.31-3.07-.03.92.66 1.39.76 2.2.09.77-.26 1.85-.8 1.85z',
      core: 'M25.664 5.84c-.31 0-.53-.17-.56-.45-.04-.38.2-.85.61-1.36-.02.43.28.72.33 1.09.05.4-.14.72-.38.72z',
      smoke: 'M 25.664 4 Q 24 2, 26.5 0.5 T 25.2 -1.5',
    },
  ];

  const renderCandle = (index: number) => {
    const state = candles[index];
    const p = flamePaths[index];

    if (state === 'flame') {
      return (
        <g key={index} className="flame-glow clickable" role="button" tabIndex={0} aria-label={`Matikan lilin ${index + 1}`}
          onClick={() => handleCandleClick(index)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleCandleClick(index);
            }
          }}
        >
          <path d={p.flame} fill="#F33435" pointerEvents="visiblePainted" />
          <path d={p.inner} fill="#FF9638" pointerEvents="none" />
          <path d={p.core} fill="#FFF0B0" pointerEvents="none" />
        </g>
      );
    }

    if (state === 'smoke') {
      return (
        <g className="candle-smoke" key={index}>
          <path d={p.smoke} stroke="#9CA3AF" strokeWidth="0.6" fill="none" strokeLinecap="round" className="smoke-path" />
        </g>
      );
    }

    return null;
  };

  return (
    <div className={`cake-container ${isCompleted ? 'completed-anim' : ''}`}>
      <h2 className="cake-instruction">
        {candles.every(c => c === 'extinguished') ? 'Selamat HBD' : 'Make a wish...'}
      </h2>
         <p className="cake-sub-instruction">
              {candles.every(c => c === 'extinguished')
                  ? 'btw kucingnya bisa kmu klik loh'
                  : 'tiup lilinnya (klik sih maksudku) *anggep aja lagi niup'}
        </p>

      <svg
        className="cake-svg"
        viewBox="0 0 36 36"
        xmlns="http://www.w3.org/2000/svg"
        role="group"
        aria-label="Kue ulang tahun dengan tiga lilin interaktif"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Plate bottom */}
        <ellipse fill="#F8DDE3" cx="18" cy="26" rx="18" ry="10" />
        {/* Plate top */}
        <ellipse fill="#FFF8F0" cx="18" cy="24.25" rx="18" ry="10" />
        {/* Cake base (red ring) */}
        <path fill="#A85D70" d="M32.675 23.685c0 4.26-6.57 7.712-14.675 7.712S3.325 27.945 3.325 23.685c0-4.258 6.57-7.711 14.675-7.711c8.104 0 14.675 3.453 14.675 7.711z" />
        {/* Cake body (pink) */}
        <path fill="#F8DDE3" d="M32.233 22.543c0 9.854-28.466 9.854-28.466 0v-8.759h28.466v8.759z" />
        {/* Frosting drips */}
        <path fill="#D99AA7" d="M17.984 18.166c-8.984 0-14.218-4.132-14.218-4.132s-.016.924-.016 1.685c0 0 .032 4.898 2.572 4.898c2.459 0 2.28 2.348 3.834 2.591c1.541.241 1.712-.938 3.625-.938s2.25 2.106 4.203 2.106c2.289 0 2.477-2.106 4.389-2.106s2.132 1.224 3.386.885c1.507-.408.814-2.537 3.887-2.537c2.54 0 2.603-4.648 2.603-4.648c0-.76-.017-1.935-.017-1.935s-5.263 4.131-14.248 4.131z" />
        {/* Cake top */}
        <path fill="#D99AA7" d="M32.675 12.737c0 4.259-6.57 7.712-14.675 7.712S3.325 16.996 3.325 12.737S9.895 5.025 18 5.025c8.104 0 14.675 3.453 14.675 7.712z" opacity="0.8" />

        {/* Candle sticks (always visible) */}
        {/* Left candle stick */}
        <path fill="#FFF8E8" d="M10.336 13.784c-.605 0-1.095-.49-1.095-1.095V5.025a1.095 1.095 0 1 1 2.19 0v7.664c0 .605-.49 1.095-1.095 1.095z" />
        {/* Center candle stick */}
        <path fill="#FFF8E8" d="M18 17.068c-.605 0-1.095-.49-1.095-1.095V8.31a1.095 1.095 0 1 1 2.19 0v7.664c0 .604-.49 1.094-1.095 1.094z" />
        {/* Right candle stick */}
        <path fill="#FFF8E8" d="M25.664 13.784c-.605 0-1.095-.49-1.095-1.095V5.025a1.095 1.095 0 1 1 2.19 0v7.664c0 .605-.49 1.095-1.095 1.095z" />

        {/* Flames / Smoke / Extinguished */}
        {renderCandle(0)}
        {renderCandle(1)}
        {renderCandle(2)}
      </svg>
    </div>
  );
};
