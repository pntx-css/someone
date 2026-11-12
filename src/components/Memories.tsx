import React, { useEffect, useRef, useState } from 'react';
import { memories } from '../data/memories';
import './Memories.css';

export const Memories: React.FC = () => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });
  const [pathD, setPathD] = useState('');

  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const updateSize = () => {
      const width = timeline.clientWidth;
      const height = timeline.clientHeight;
      const center = width / 2;
      const amplitude = Math.min(width * (width <= 600 ? 0.03 : 0.1), 150);
      const startY = Math.min(window.innerHeight / 2, height);
      const segmentCount = Math.max(1, memories.length - 1);
      const segmentHeight = (height - startY) / segmentCount;
      let d = `M ${center} ${startY}`;

      for (let segment = 0; segment < segmentCount; segment += 1) {
        const direction = segment % 2 === 0 ? 1 : -1;
        const nextY = startY + (segment + 1) * segmentHeight;
        const controlY = segmentHeight / 3;
        const controlX = center + direction * amplitude;
        d += ` C ${center} ${startY + segment * segmentHeight + controlY}, ${controlX} ${nextY - controlY}, ${center} ${nextY}`;
      }

      setSvgSize({ width, height });
      setPathD(d);
    };

    updateSize();

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(updateSize);
    resizeObserver?.observe(timeline);
    window.addEventListener('resize', updateSize);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const timeline = timelineRef.current;
      if (!timeline) return;

      const top = window.scrollY + timeline.getBoundingClientRect().top;
      window.scrollTo({ top, behavior: 'auto' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const cards = timeline.querySelectorAll<HTMLElement>('.memory-card');
    if (typeof IntersectionObserver === 'undefined') {
      cards.forEach((card) => card.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const path = pathRef.current;
    const plane = planeRef.current;
    if (!path || !plane || !pathD) return;

    const pathLength = path.getTotalLength();
    if (!pathLength) return;

    let animationFrame = 0;
    const updatePlanePosition = () => {
      animationFrame = 0;
      const timeline = timelineRef.current;
      if (!timeline) return;

      const rect = timeline.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportCenterY = viewportHeight / 2;
      const targetY = viewportCenterY - rect.top;
      const pathStartY = path.getPointAtLength(0).y;
      const pathEndY = path.getPointAtLength(pathLength).y;
      let distance = 0;

      if (targetY >= pathEndY) {
        distance = pathLength;
      } else if (targetY > pathStartY) {
        let start = 0;
        let end = pathLength;

        for (let iteration = 0; iteration < 20; iteration += 1) {
          const middle = (start + end) / 2;
          if (path.getPointAtLength(middle).y < targetY) {
            start = middle;
          } else {
            end = middle;
          }
        }

        distance = (start + end) / 2;
      }

      const point = path.getPointAtLength(distance);
      const sampleDistance = Math.min(3, pathLength / 100);
      const previousPoint = path.getPointAtLength(Math.max(0, distance - sampleDistance));
      const nextPoint = path.getPointAtLength(Math.min(pathLength, distance + sampleDistance));
      const angle =
        (Math.atan2(nextPoint.y - previousPoint.y, nextPoint.x - previousPoint.x) * 180) /
          Math.PI +
        45;

      const isVisible = targetY >= pathStartY && rect.bottom > 0;
      plane.style.opacity = isVisible ? '1' : '0';
      plane.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%) rotate(${angle}deg)`;
    };

    const scheduleUpdate = () => {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(updatePlanePosition);
      }
    };

    scheduleUpdate();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [pathD]);

  return (
    <div className="memories-container" style={{ position: 'relative' }}>
      <img className="memory-footsteps" src="/assets/cats/jejak_kaki.svg" alt="" aria-hidden="true" />

      <h2 className="memories-title" style={{ position: 'relative', zIndex: 10 }}>Our Memories</h2>

      <div className="memories-timeline" ref={timelineRef}>
        <svg
          className="journey-svg"
          width={svgSize.width}
          height={svgSize.height}
          viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
          aria-hidden="true"
        >
          <path
            ref={pathRef}
            d={pathD}
            className="journey-path"
          />
        </svg>

        <div ref={planeRef} className="paper-plane-wrapper" aria-hidden="true">
          <img src="/paper-plane.svg" alt="" />
        </div>

        {memories.map((memory, index) => (
          <div
            className={`memory-row memory-row--${memory.side} memory-row--size-${index % 4}`}
            key={memory.id}
          >
            <div className="memory-card" style={{ '--rot': `${memory.rotation}deg` } as React.CSSProperties}>
              <div className="memory-frame">
                <div className={`tape ${index % 2 !== 0 ? 'tape-alt' : ''}`} aria-hidden="true" />
                <img
                  src={memory.image}
                  alt={memory.caption}
                  className="memory-img"
                  width={memory.width}
                  height={memory.height}
                  loading="lazy"
                />
                <div className="memory-text">
                  <h3 className="memory-caption">{memory.caption}</h3>
                  <p className="memory-detail">{memory.detail}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
