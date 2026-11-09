import React from 'react';
import { personalMessage } from '../data/message';
import { CatIllustration } from './CatIllustration';
import './PersonalMessage.css';

interface PersonalMessageProps {
  onNext: () => void;
}

export const PersonalMessage: React.FC<PersonalMessageProps> = ({ onNext }) => {
  return (
    <div className="letter-container" style={{ position: 'relative' }}>
      {/* Cat decorations */}
      <div className="cat-deco cat-mobile-visible" style={{ position: 'absolute', bottom: '2rem', right: '5%', opacity: 0.85 }}>
        <CatIllustration pose="sleeping" color="orange" size={90} />
      </div>
      <div className="cat-deco" style={{ position: 'absolute', top: '3rem', left: '3%', opacity: 0.7 }}>
        <CatIllustration pose="sitting" color="white" size={55} />
      </div>

      <div className="letter-paper">
        <div className="letter-content">
          {personalMessage}
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
