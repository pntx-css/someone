import React, { useEffect, useRef } from 'react';
import './MiniGalaxy.css';

interface MiniGalaxyConfig {
  x: number;
  y: number;
  size: number;
  rotation: number;
  arms: number;
  particles: number;
  color: string;
}

interface MiniGalaxyProps {
  className?: string;
}

const GALAXIES: MiniGalaxyConfig[] = [
  {
    x: 0.16,
    y: 0.28,
    size: 38,
    rotation: 0.4,
    arms: 3,
    particles: 55,
    color: '#a98aff',
  },
  {
    x: 0.83,
    y: 0.25,
    size: 30,
    rotation: 1.2,
    arms: 3,
    particles: 45,
    color: '#83aaff',
  },
  {
    x: 0.78,
    y: 0.78,
    size: 23,
    rotation: 0.8,
    arms: 2,
    particles: 35,
    color: '#e49bff',
  },
];

const drawMiniGalaxy = (
  ctx: CanvasRenderingContext2D,
  galaxy: MiniGalaxyConfig,
  timestamp: number,
) => {
  const {
    x,
    y,
    size,
    rotation,
    arms,
    particles,
    color,
  } = galaxy;

  ctx.save();

  ctx.translate(x, y);
  ctx.rotate(rotation);

  // Galaxy glow
  const glow = ctx.createRadialGradient(
            0, 0, 0,
            0, 0, size,
        );

        glow.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        glow.addColorStop(0.2, `${color}55`);
        glow.addColorStop(0.55, `${color}18`);
        glow.addColorStop(1, `${color}00`);

        ctx.globalAlpha = 0.85;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();

        // Spiral arms
        for (let arm = 0; arm < arms; arm++) {
            for (let i = 0; i < particles; i++) {
            const progress = i / particles;
        const rotationSpeed = timestamp * 0.0004;
        const angle =
        arm * (Math.PI * 2 / arms) +
        progress * Math.PI * 3.5 -
        rotationSpeed * (1 - progress * 0.7);
        const radius = progress * size * 0.85;

        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius * 0.42;
      const particleSize = 0.45 + (1 - progress) * 0.65;

      const twinkle =
        0.65 +
        Math.sin(timestamp * 0.0015 + i * 0.3 + arm) * 0.25;

      ctx.globalAlpha = twinkle * (1 - progress * 0.55);
      ctx.fillStyle = i % 5 === 0 ? '#ffffff' : color;

      ctx.beginPath();
      ctx.arc(px, py, particleSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Bright core
  const core = ctx.createRadialGradient(
    0, 0, 0,
    0, 0, size * 0.2,
  );

  core.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  core.addColorStop(0.35, `${color}cc`);
  core.addColorStop(1, `${color}00`);

  ctx.globalAlpha = 0.9;
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

export const MiniGalaxy: React.FC<MiniGalaxyProps> = ({
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;

    const motionPreference = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let animationFrameId: number | null = null;

    const draw = (timestamp: number) => {
      ctx.clearRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'lighter';

      for (const galaxy of GALAXIES) {
        drawMiniGalaxy(
          ctx,
          {
            ...galaxy,
            x: galaxy.x * width,
            y: galaxy.y * height,
          },
          timestamp,
        );
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    };

    const animate = (timestamp: number) => {
      draw(timestamp);
      animationFrameId = window.requestAnimationFrame(animate);
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();

      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);

      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);

      ctx.setTransform(
        pixelRatio,
        0,
        0,
        pixelRatio,
        0,
        0,
      );

      draw(0);
    };

    const startAnimation = () => {
      if (
        animationFrameId === null &&
        !motionPreference.matches
      ) {
        animationFrameId = window.requestAnimationFrame(animate);
      }
    };

    const updateMotionPreference = () => {
      if (motionPreference.matches) {
        if (animationFrameId !== null) {
          window.cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }

        draw(0);
      } else {
        startAnimation();
      }
    };

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(resize)
      : null;

    resizeObserver?.observe(canvas);

    if (!resizeObserver) {
      window.addEventListener('resize', resize);
    }

    motionPreference.addEventListener(
      'change',
      updateMotionPreference,
    );

    resize();

    startAnimation();

    return () => {
      resizeObserver?.disconnect();

      if (!resizeObserver) {
        window.removeEventListener('resize', resize);
      }

      motionPreference.removeEventListener(
        'change',
        updateMotionPreference,
      );

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`mini-galaxy-canvas ${className}`}
      aria-hidden="true"
    />
  );
};