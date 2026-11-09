import React, { useRef, useEffect } from 'react';

interface ScrollWheelProps {
  options: (string | number)[];
  value: string | number;
  onChange: (val: string | number) => void;
  label: string;
}

export const ScrollWheel: React.FC<ScrollWheelProps> = ({ options, value, onChange, label }) => {
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const selectedIndex = options.indexOf(value);
    let nextIndex = selectedIndex;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex = Math.min(options.length - 1, selectedIndex + 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex = Math.max(0, selectedIndex - 1);
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = options.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    if (nextIndex === selectedIndex) return;
    containerRef.current?.scrollTo({ top: nextIndex * itemHeight, behavior: 'auto' });
    onChange(options[nextIndex]);
  };

  return (
    <div className="wheel-wrapper">
      <div className="wheel-box">
        <div 
          className="wheel-container" 
          ref={containerRef}
          role="listbox"
          aria-label={label}
          aria-activedescendant={`wheel-${label}-${value}`}
          tabIndex={0}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
        >
          <div style={{ height: `${itemHeight}px`, flexShrink: 0 }} />
          {options.map((opt) => (
            <div 
              key={opt} 
              id={`wheel-${label}-${opt}`}
              className={`wheel-item ${opt === value ? 'selected' : ''}`}
              role="option"
              aria-selected={opt === value}
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
