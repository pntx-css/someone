import React from 'react';
import { personalMessage } from '../data/message';
import './PersonalMessage.css';

interface PersonalMessageProps {
  onNext: () => void;
}

const renderPersonalMessage = (): React.ReactNode[] => {
  const kaomojiPattern = /\([^()\n]*[^\p{ASCII}][^()\n]*\)/gu;
  const content: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of personalMessage.matchAll(kaomojiPattern)) {
    const index = match.index;
    if (index > lastIndex) content.push(personalMessage.slice(lastIndex, index));
    content.push(
      <span className="letter-kaomoji" key={index}>
        {match[0]}
      </span>
    );
    lastIndex = index + match[0].length;
  }

  if (lastIndex < personalMessage.length) {
    content.push(personalMessage.slice(lastIndex));
  }

  return content;
};

export const PersonalMessage: React.FC<PersonalMessageProps> = ({ onNext }) => {
  return (
    <div className="letter-container" style={{ position: 'relative' }}>
      <div className="letter-paper">
        <div className="letter-content" lang="id">
          {renderPersonalMessage()}
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
