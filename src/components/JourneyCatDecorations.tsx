import React, { useEffect, useMemo, useRef, useState } from 'react';
import './JourneyCatDecorations.css';

interface CatDecorationProps {
  asset: number;
  top: number;
  side: 'left' | 'right';
  offset: string;
}

type JourneyPhase = 2 | 3 | 4 | 5;

const positionLayouts: Record<JourneyPhase, Array<Pick<CatDecorationProps, 'top' | 'side' | 'offset'>>> = {
  2: [
    { top: 5, side: 'left', offset: '2%' },
    { top: 30, side: 'left', offset: '2%' },
    { top: 55, side: 'left', offset: '2%' },
    { top: 80, side: 'left', offset: '2%' },
    { top: 17, side: 'right', offset: '2%' },
    { top: 39, side: 'right', offset: '2%' },
    { top: 61, side: 'right', offset: '2%' },
    { top: 80, side: 'right', offset: '2%' },
  ],
  3: [
    { top: 14, side: 'left', offset: '2%' },
    { top: 39, side: 'left', offset: '2%' },
    { top: 64, side: 'left', offset: '2%' },
    { top: 80, side: 'left', offset: '2%' },
    { top: 5, side: 'right', offset: '2%' },
    { top: 30, side: 'right', offset: '2%' },
    { top: 55, side: 'right', offset: '2%' },
    { top: 80, side: 'right', offset: '2%' },
  ],
  4: [
    { top: 5, side: 'left', offset: '2%' },
    { top: 33, side: 'left', offset: '2%' },
    { top: 61, side: 'left', offset: '2%' },
    { top: 80, side: 'left', offset: '2%' },
    { top: 17, side: 'right', offset: '2%' },
    { top: 39, side: 'right', offset: '2%' },
    { top: 61, side: 'right', offset: '2%' },
    { top: 80, side: 'right', offset: '2%' },
  ],
  5: [
    { top: 17, side: 'left', offset: '2%' },
    { top: 39, side: 'left', offset: '2%' },
    { top: 61, side: 'left', offset: '2%' },
    { top: 80, side: 'left', offset: '2%' },
    { top: 5, side: 'right', offset: '2%' },
    { top: 33, side: 'right', offset: '2%' },
    { top: 61, side: 'right', offset: '2%' },
    { top: 80, side: 'right', offset: '2%' },
  ],
};

const CatDecoration: React.FC<CatDecorationProps> = ({ asset, top, side, offset }) => {
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
        top: `${top}%`,
        [side]: offset,
      }}
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

const createCats = (phase: JourneyPhase) => {
  const count = 6 + Math.floor(Math.random() * 2);
  const shuffledPositions = [...positionLayouts[phase]];
  for (let index = shuffledPositions.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffledPositions[index], shuffledPositions[swapIndex]] = [
      shuffledPositions[swapIndex],
      shuffledPositions[index],
    ];
  }
  const positions = shuffledPositions.slice(0, count);

  return positions.map((position, index) => ({
    id: index,
    asset: 1 + Math.floor(Math.random() * 8),
    ...position,
  }));
};

export const JourneyCatDecorations: React.FC<{ phase: JourneyPhase }> = ({ phase }) => {
  const cats = useMemo(() => createCats(phase), [phase]);

  return (
    <div className="journey-cat-decorations">
      {cats.map((cat) => (
        <CatDecoration key={`${phase}-${cat.id}`} {...cat} />
      ))}
    </div>
  );
};
