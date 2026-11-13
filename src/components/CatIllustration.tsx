import React, { useCallback, useEffect, useRef, useState } from 'react';
import './CatIllustration.css';

type CatColor = 'black' | 'white' | 'orange';
type CatPose = 'sitting' | 'sleeping' | 'peeking' | 'waving' | 'walking';
type CatPair = readonly [normal: string, smiling: string];

interface CatIllustrationProps {
  pose: CatPose;
  color: CatColor;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
  flipX?: boolean;
}

const CAT_ASSETS: Record<CatPose, CatPair> = {
  sitting: ['/assets/cats/kucing1.svg', '/assets/cats/kucing2.svg'],
  sleeping: ['/assets/cats/kucing3.svg', '/assets/cats/kucing4.svg'],
  peeking: ['/assets/cats/kucing5.svg', '/assets/cats/kucing6.svg'],
  waving: ['/assets/cats/kucing7.svg', '/assets/cats/kucing8.svg'],
  walking: ['/assets/cats/kucing1.svg', '/assets/cats/kucing2.svg'],
};

const CAT_VISUAL_SCALE: Record<string, number> = {
  'kucing1.svg': 1.02,
  'kucing2.svg': 1,
  'kucing3.svg': 1.82,
  'kucing4.svg': 1,
  'kucing5.svg': 1,
  'kucing6.svg': 1.07,
  'kucing7.svg': 1.07,
  'kucing8.svg': 1,
};

export const CatIllustration: React.FC<CatIllustrationProps> = ({
  pose,
  color,
  size = 80,
  style,
  className = '',
  flipX = false,
}) => {
  const [smiling, setSmiling] = useState(false);
  const smileTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [normalImage, smilingImage] = CAT_ASSETS[pose];

  useEffect(
    () => () => {
      if (smileTimeoutRef.current) clearTimeout(smileTimeoutRef.current);
    },
    []
  );

  const handleClick = useCallback(() => {
    if (smiling) return;
    setSmiling(true);
    smileTimeoutRef.current = setTimeout(() => {
      setSmiling(false);
      smileTimeoutRef.current = null;
    }, 1600);
  }, [smiling]);

  return (
    <button
      type="button"
      className={`cat-illustration cat-illustration--${color} ${flipX ? 'cat-flipped' : ''} ${smiling ? 'cat-smiling' : ''} ${className}`}
      onClick={handleClick}
      style={{
        '--cat-size': `${size}px`,
        '--cat-normal-scale': CAT_VISUAL_SCALE[normalImage.split('/').pop() ?? ''] ?? 1,
        '--cat-smile-scale': CAT_VISUAL_SCALE[smilingImage.split('/').pop() ?? ''] ?? 1,
        ...style,
      } as React.CSSProperties}
      aria-label={`Cute ${color} cat — click to pet!`}
      aria-pressed={smiling}
    >
      <img className="cat-asset" src={normalImage} alt="" draggable="false" />
      <img
        className={`cat-asset cat-asset--smile ${smiling ? 'is-visible' : ''}`}
        src={smilingImage}
        alt=""
        draggable="false"
      />
    </button>
  );
};
