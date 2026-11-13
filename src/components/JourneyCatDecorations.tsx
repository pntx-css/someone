import React, { useEffect, useMemo, useRef, useState } from 'react';
import './JourneyCatDecorations.css';

interface CatDecorationProps {
  asset: number;
  row: number;
  side: 'left' | 'right';
}

type JourneyPhase = 2 | 3 | 4 | 5;

/* Derived from the visible path bounds, not the SVG canvas/viewBox. */
const CAT_VISUAL_SCALE: Record<number, number> = {
  1: 1.02,
  2: 1,
  3: 1.82,
  4: 1,
  5: 1,
  6: 1.07,
  7: 1.07,
  8: 1,
};

/* Fixed slots keep the decoration rhythm intentional across every chapter. */
const positionLayouts: Record<JourneyPhase, CatDecorationProps[]> = {
  2: [
    { asset: 1, row: 0, side: 'left' }, { asset: 3, row: 1, side: 'left' }, { asset: 5, row: 2, side: 'left' },
    { asset: 7, row: 0, side: 'right' }, { asset: 1, row: 1, side: 'right' }, { asset: 3, row: 2, side: 'right' },
  ],
  3: [
    { asset: 5, row: 0, side: 'left' }, { asset: 7, row: 1, side: 'left' }, { asset: 1, row: 2, side: 'left' },
    { asset: 3, row: 0, side: 'right' }, { asset: 5, row: 1, side: 'right' }, { asset: 7, row: 2, side: 'right' },
  ],
  4: [
    { asset: 7, row: 0, side: 'left' }, { asset: 1, row: 1, side: 'left' }, { asset: 3, row: 2, side: 'left' },
    { asset: 5, row: 0, side: 'right' }, { asset: 7, row: 1, side: 'right' }, { asset: 1, row: 2, side: 'right' },
  ],
  5: [
    { asset: 3, row: 0, side: 'left' }, { asset: 5, row: 1, side: 'left' }, { asset: 7, row: 2, side: 'left' },
    { asset: 1, row: 0, side: 'right' }, { asset: 3, row: 1, side: 'right' }, { asset: 5, row: 2, side: 'right' },
  ],
};

const CatDecoration: React.FC<CatDecorationProps> = ({ asset, row, side }) => {
  const [smiling, setSmiling] = useState(false);
  const firstAsset = Math.floor((asset - 1) / 2) * 2 + 1;
  const [smileAsset, setSmileAsset] = useState(firstAsset + 1);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  const handleClick = () => {
    if (timeoutRef.current) return;

    setSmileAsset(firstAsset + 1);
    setSmiling(true);
    timeoutRef.current = setTimeout(() => {
      setSmiling(false);
      timeoutRef.current = null;
    }, 1600);
  };

  return (
    <button
      className={`journey-cat-decoration${smiling ? ' is-smiling' : ''}`}
      type="button"
      onClick={handleClick}
      aria-label="Klik untuk membelai kucing"
      aria-pressed={smiling}
      style={{
        gridColumn: side === 'left' ? 1 : 3,
        gridRow: row + 1,
        '--cat-normal-scale': CAT_VISUAL_SCALE[firstAsset],
        '--cat-smile-scale': CAT_VISUAL_SCALE[smileAsset],
      } as React.CSSProperties}
    >
      <img src={`/assets/cats/kucing${firstAsset}.svg`} alt="" draggable="false" />
      <img
        className="journey-cat-decoration-smile"
        src={`/assets/cats/kucing${smileAsset}.svg`}
        alt=""
        draggable="false"
      />
    </button>
  );
};

export const JourneyCatDecorations: React.FC<{ phase: JourneyPhase }> = ({ phase }) => {
  const cats = useMemo(() => positionLayouts[phase], [phase]);

  return (
    <div className="journey-cat-decorations">
      {cats.map((cat, index) => (
        <CatDecoration key={`${phase}-${cat.side}-${cat.row}-${index}`} {...cat} />
      ))}
    </div>
  );
};
