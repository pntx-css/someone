import React, { useRef, useLayoutEffect } from 'react';

interface ScrollWheelProps {
  options: (string | number)[];
  value: string | number;
  onChange: (val: string | number) => void;
  label: string;
  initialScroll?: boolean;
  initialScrollDelay?: number;
}

const ITEM_HEIGHT = 50;

export const ScrollWheel: React.FC<ScrollWheelProps> = ({
  options,
  value,
  onChange,
  label,
  initialScroll = false,
  initialScrollDelay = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialIndexRef = useRef(options.indexOf(value));

  useLayoutEffect(() => {
    const container = containerRef.current;
    const index = initialIndexRef.current;
    if (!container || index < 0) return;

    const target = index * ITEM_HEIGHT;
    if (!initialScroll || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      container.scrollTop = target;
      return;
    }

    container.scrollTop = Math.max(0, options.length - 1) * ITEM_HEIGHT;
    let timeoutId = 0;
    const frameId = window.requestAnimationFrame(() => {
      timeoutId = window.setTimeout(() => {
        container.scrollTo({ top: target, behavior: 'smooth' });
      }, initialScrollDelay);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [initialScroll, initialScrollDelay, options]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
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
    containerRef.current?.scrollTo({ top: nextIndex * ITEM_HEIGHT, behavior: 'auto' });
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
          <div style={{ height: `${ITEM_HEIGHT}px`, flexShrink: 0 }} />
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
                    top: options.indexOf(opt) * ITEM_HEIGHT,
                    behavior: 'smooth'
                  });
                }
              }}
            >
              {opt}
            </div>
          ))}
          <div style={{ height: `${ITEM_HEIGHT}px`, flexShrink: 0 }} />
        </div>
      </div>
    </div>
  );
};
