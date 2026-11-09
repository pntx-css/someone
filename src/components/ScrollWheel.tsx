import React, { useRef, useEffect } from 'react';

interface ScrollWheelProps {
  options: (string | number)[];
  value: string | number;
  onChange: (val: string | number) => void;
}

export const ScrollWheel: React.FC<ScrollWheelProps> = ({ options, value, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 50;

  useEffect(() => {
    if (containerRef.current) {
      const index = options.indexOf(value);
      if (index !== -1) {
        containerRef.current.scrollTop = index * itemHeight;
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    if (index >= 0 && index < options.length) {
      if (options[index] !== value) {
        onChange(options[index]);
      }
    }
  };

  return (
    <div className="wheel-wrapper">
      <div className="wheel-box">
        <div 
          className="wheel-container" 
          ref={containerRef}
          onScroll={handleScroll}
        >
          <div style={{ height: `${itemHeight}px`, flexShrink: 0 }} />
          {options.map((opt) => (
            <div 
              key={opt} 
              className={`wheel-item ${opt === value ? 'selected' : ''}`}
              onClick={() => {
                if (containerRef.current) {
                  containerRef.current.scrollTo({
                    top: options.indexOf(opt) * itemHeight,
                    behavior: 'smooth'
                  });
                }
              }}
            >
              {opt}
            </div>
          ))}
          <div style={{ height: `${itemHeight}px`, flexShrink: 0 }} />
        </div>
      </div>
    </div>
  );
};
