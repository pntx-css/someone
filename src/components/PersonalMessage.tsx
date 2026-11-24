import React, { useState } from 'react';
import { personalMessage } from '../data/message';
import { JourneyCatDecorations } from './JourneyCatDecorations';
import './PersonalMessage.css';

interface PersonalMessageProps {
  onNext: () => void;
}

const WORD_INTERVAL = 40;
const WORD_DURATION = 520;
const SENTENCES_PER_BURST = 3;
const SENTENCE_PATTERN = /[\s\S]*?[.!?]+(?:[)\]"'”’*_]*)?(?=\s|$)|[\s\S]+$/gu;

const splitIntoBurstGroups = (text: string): string[] => {
  const sentences = Array.from(text.matchAll(SENTENCE_PATTERN), (match) => match[0]);
  const groups: string[] = [];

  for (let index = 0; index < sentences.length; index += SENTENCES_PER_BURST) {
    groups.push(sentences.slice(index, index + SENTENCES_PER_BURST).join(''));
  }

  return groups;
};

const personalMessageBursts = splitIntoBurstGroups(personalMessage);

const renderPersonalMessage = (): React.ReactNode[] => {
  let delay = 0;

  return personalMessageBursts.map((text, index) => {
    const words = text.match(/\s+|\S+/gu) ?? [];
    const wordCount = words.filter((word) => !/^\s+$/u.test(word)).length;
    const currentDelay = delay;
    delay += Math.max(0, wordCount - 1) * WORD_INTERVAL + WORD_DURATION + 180;
    let revealIndex = 0;

    return (
      <span className="letter-message-burst" key={`message-burst-${index}`}>
        {words.map((word, wordIndex) => {
          if (/^\s+$/u.test(word)) {
            return <React.Fragment key={`space-${wordIndex}`}>{word}</React.Fragment>;
          }

          const wordDelay = currentDelay + revealIndex * WORD_INTERVAL;
          revealIndex += 1;

          return (
            <span
              className="letter-word-pop"
              key={`word-${wordIndex}`}
              style={{ animationDelay: `${wordDelay}ms` }}
            >
              {word}
            </span>
          );
        })}
      </span>
    );
  });
};

export const PersonalMessage: React.FC<PersonalMessageProps> = ({ onNext }) => {
  const [isOpeningMemories, setIsOpeningMemories] = useState(false);

  const handleOpenMemories = () => {
    if (isOpeningMemories) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onNext();
      return;
    }

    setIsOpeningMemories(true);
    window.setTimeout(onNext, 480);
  };

  return (
    <div className="letter-container" style={{ position: 'relative' }}>
      <div className="letter-paper">
        <JourneyCatDecorations phase={4} />
        <div className="letter-content" lang="id">
          <div className="letter-content-visual" aria-hidden="true">
            {renderPersonalMessage()}
          </div>
          <span className="letter-content-accessible">{personalMessage}</span>
        </div>
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <button
            className="gate-btn"
            onClick={handleOpenMemories}
            disabled={isOpeningMemories}
            style={{ position: 'relative', zIndex: 10 }}
          >
            open memories
          </button>
        </div>
      </div>
    </div>
  );
};
