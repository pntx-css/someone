import React from 'react';
import './AnimatedText.css';

interface AnimatedTextProps {
  text: string;
  delay?: number;
  interval?: number;
  effect?: 'rise' | 'burst' | 'explode';
  duration?: number;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  delay = 0,
  interval = 24,
  effect = 'rise',
  duration = 460,
}) => {
  let characterIndex = 0;
  const characterCount = Array.from(text).filter((character) => !/\s/u.test(character)).length;

  return (
    <>
      <span className="animated-text" aria-hidden="true">
        {(text.match(/\s+|\S+/gu) ?? []).map((word, wordIndex) => {
          if (/^\s+$/u.test(word)) {
            return <React.Fragment key={`space-${wordIndex}`}>{word}</React.Fragment>;
          }

          return (
            <span className="animated-text__word" key={`word-${wordIndex}`}>
              {Array.from(word).map((character) => {
                const index = characterIndex;
                characterIndex += 1;
                const explodeDistance = index - (characterCount - 1) / 2;
                return (
                  <span
                    className={`animated-text__character${effect === 'rise' ? '' : ` animated-text__character--${effect}`}`}
                    key={index}
                    style={{
                      animationDelay: `${delay + index * interval}ms`,
                      animationDuration: `${duration}ms`,
                      '--burst-x': `${Math.sin(index * 2.4) * 0.22}em`,
                      '--burst-y': `${Math.cos(index * 1.7) * 0.2}em`,
                      '--burst-rotation': `${(index % 2 === 0 ? -1 : 1) * (6 + (index % 3) * 3)}deg`,
                      '--explode-x': `${explodeDistance * 0.12}em`,
                      '--explode-y': `${Math.sin(index * 2.1) * 0.45}em`,
                      '--explode-rotation': `${(index % 2 === 0 ? -1 : 1) * (12 + (index % 3) * 6)}deg`,
                    } as React.CSSProperties}
                  >
                    {character}
                  </span>
                );
              })}
            </span>
          );
        })}
      </span>
      <span className="animated-text__accessible">{text}</span>
    </>
  );
};
