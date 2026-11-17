import React from 'react';
import { personalMessage } from '../data/message';
import './PersonalMessage.css';

interface PersonalMessageProps {
  onNext: () => void;
}

const typewriterInterval = 1800 / Math.max(1, Array.from(personalMessage).length);

const renderPersonalMessage = (): React.ReactNode[] => {
  const kaomojiPattern = /\([^()\n]*[^\p{ASCII}][^()\n]*\)/gu;
  const content: React.ReactNode[] = [];
  let lastIndex = 0;
  let characterIndex = 0;

  const renderCharacters = (text: string, key: string): React.ReactNode => (
    <span className="letter-typed-run" key={key}>
      {Array.from(text).map((character) => {
        const delay = characterIndex * typewriterInterval;
        const keyIndex = characterIndex;
        characterIndex += 1;

        return /\s/u.test(character) ? (
          <React.Fragment key={keyIndex}>{character}</React.Fragment>
        ) : (
          <span
            className="letter-typed-character"
            key={keyIndex}
            style={{ animationDelay: `${delay}ms` }}
          >
            {character}
          </span>
        );
      })}
    </span>
  );

  for (const match of personalMessage.matchAll(kaomojiPattern)) {
    const index = match.index;
    if (index > lastIndex) {
      content.push(renderCharacters(personalMessage.slice(lastIndex, index), `message-${index}`));
    }
    content.push(
      <span className="letter-kaomoji" key={index}>
        {renderCharacters(match[0], `kaomoji-${index}`)}
      </span>
    );
    lastIndex = index + match[0].length;
  }

  if (lastIndex < personalMessage.length) {
    content.push(renderCharacters(personalMessage.slice(lastIndex), 'message-end'));
  }

  return content;
};

export const PersonalMessage: React.FC<PersonalMessageProps> = ({ onNext }) => {
  return (
    <div className="letter-container" style={{ position: 'relative' }}>
      <div className="letter-paper">
        <div className="letter-content" lang="id">
          <div className="letter-content-visual" aria-hidden="true">
            {renderPersonalMessage()}
          </div>
          <span className="letter-content-accessible">{personalMessage}</span>
        </div>
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <button 
            className="gate-btn" 
            onClick={onNext}
            style={{ position: 'relative', zIndex: 10 }}
          >
            open memories
          </button>
        </div>
      </div>
    </div>
  );
};
