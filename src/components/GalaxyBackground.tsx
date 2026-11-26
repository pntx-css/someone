import React, { useEffect, useRef } from 'react';
import './GalaxyBackground.css';

interface Particle {
  radius: number;
  radialOffset: number;
  arm: number;
  angleOffset: number;
  size: number;
  phase: number;
  color: number;
  formationDelay: number;
}

interface BackgroundStar {
  x: number;
  y: number;
  size: number;
  phase: number;
}

interface GalaxyStar {
  radius: number;
  arm: number;
  angleOffset: number;
  size: number;
  phase: number;
  formationDelay: number;
}

interface GlowColor {
  red: number;
  green: number;
  blue: number;
}

interface GalaxyBackgroundProps {
  onFormationComplete: () => void;
}

const ARM_COUNT = 3;
const SPIRAL_TWIST = 6.6;
const SPIRAL_ARM_WIDTH = 4;
const GALAXY_TILT = -0.5;
const FORMATION_STAGGER_MS = 1600;
const FORMATION_JITTER_MS = 550;
const FORMATION_TRAVEL_MS = 850;
const FORMATION_COMPLETE_MS = FORMATION_STAGGER_MS + FORMATION_JITTER_MS + FORMATION_TRAVEL_MS;
const GALAXY_ROTATION_SPEED = 0.00006;
const COLORS: readonly GlowColor[] = [
  { red: 255, green: 217, blue: 126 },
  { red: 255, green: 150, blue: 110 },
  { red: 255, green: 106, blue: 186 },
  { red: 220, green: 83, blue: 255 },
  { red: 158, green: 104, blue: 255 },
  { red: 105, green: 117, blue: 255 },
  { red: 76, green: 157, blue: 255 },
];

const createSeededRandom = (initialSeed: number) => {
  let seed = initialSeed;

  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
};

const createGlowSprite = (color: GlowColor): HTMLCanvasElement => {
  const sprite = document.createElement('canvas');
  sprite.width = 64;
  sprite.height = 64;
  const context = sprite.getContext('2d');

  if (!context) {
    throw new Error('Unable to create the galaxy particle glow.');
  }

  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, `rgba(${color.red}, ${color.green}, ${color.blue}, 0.78)`);
  gradient.addColorStop(0.16, `rgba(${color.red}, ${color.green}, ${color.blue}, 0.34)`);
  gradient.addColorStop(0.52, `rgba(${color.red}, ${color.green}, ${color.blue}, 0.06)`);
  gradient.addColorStop(1, `rgba(${color.red}, ${color.green}, ${color.blue}, 0)`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  return sprite;
};

const createGalaxyParticles = (count: number): Particle[] => {
  const random = createSeededRandom(42);

  return Array.from({ length: count }, () => {
    const radius = Math.sqrt(random());
    const colorPosition = Math.max(
      0,
      Math.min(COLORS.length - 1, Math.floor(radius * COLORS.length + (random() - 0.5))),
    );

    return {
      radius,
      radialOffset: (random() - 0.5) * 0.08 * SPIRAL_ARM_WIDTH,
      arm: Math.floor(random() * ARM_COUNT),
      angleOffset: (random() - 0.5) * (0.16 + radius * 0.18) * SPIRAL_ARM_WIDTH,
      size: 0.45 + random() * 0.85,
      phase: random() * Math.PI * 2,
      color: colorPosition,
      formationDelay: radius * FORMATION_STAGGER_MS + random() * FORMATION_JITTER_MS,
    };
  });
};

const createBackgroundStars = (count: number): BackgroundStar[] =>
  Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: 0.35 + Math.random() * 0.8,
    phase: Math.random() * Math.PI * 2,
  }));

const createGalaxyStars = (count: number): GalaxyStar[] => {
  const random = createSeededRandom(84);

  return Array.from({ length: count }, () => {
    const radius = 0.2 + random() * 0.78;

    return {
      radius,
      arm: Math.floor(random() * ARM_COUNT),
      angleOffset: (random() - 0.5) * (0.08 + radius * 0.12) * SPIRAL_ARM_WIDTH,
      size: 1.35 + random() * 0.85,
      phase: random() * Math.PI * 2,
      formationDelay: radius * FORMATION_STAGGER_MS + random() * FORMATION_JITTER_MS,
    };
  });
};

export const GalaxyBackground: React.FC<GalaxyBackgroundProps> = ({ onFormationComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!canvas || !context) {
      console.error('Unable to initialize the galaxy background canvas.');
      return;
    }

    const glowSprites = COLORS.map(createGlowSprite);
    const coreGlow = createGlowSprite(COLORS[0]);
    const whiteGlow = createGlowSprite({ red: 255, green: 255, blue: 255 });
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const formationStartedAt = performance.now();
    let particles: Particle[] = [];
    let backgroundStars: BackgroundStar[] = [];
    let galaxyStars: GalaxyStar[] = [];
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let lastTimestamp = 0;
    let animationFrameId: number | null = null;
    let hasNotifiedFormationComplete = false;

    const getFormationProgress = (timestamp: number, delay: number) => {
      if (motionPreference.matches) return 1;

      const progress = Math.min(
        1,
        Math.max(0, (timestamp - formationStartedAt - delay) / FORMATION_TRAVEL_MS),
      );
      return progress * progress * (3 - 2 * progress);
    };

    const draw = (timestamp: number) => {
      const centerX = width * 0.5;
      const centerY = height * 0.5;
      const radiusX = Math.min(width * 0.35, height * 0.56);
      const radiusY = Math.min(height * 0.2, width * 0.18);
      const rotation = Math.max(0, timestamp - formationStartedAt) * GALAXY_ROTATION_SPEED;
      const tiltCos = Math.cos(GALAXY_TILT);
      const tiltSin = Math.sin(GALAXY_TILT);

      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = 'lighter';

      for (const star of backgroundStars) {
        const opacity = 0.32 + (Math.sin(timestamp * 0.001 + star.phase) + 1) * 0.2;
        context.globalAlpha = opacity;
        context.fillStyle = '#e7dcff';
        context.beginPath();
        context.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
        context.fill();
      }

      const pulse = 0.96 + Math.sin(timestamp * 0.0008) * 0.04;
      const glowSize = Math.min(width, height) * 0.48 * pulse;
      context.globalAlpha = 0.76;
      context.drawImage(
        coreGlow,
        centerX - glowSize / 2,
        centerY - glowSize / 2,
        glowSize,
        glowSize,
      );

      const coreRadius = Math.min(width, height) * 0.045 * pulse;
      const core = context.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        coreRadius,
      );
      core.addColorStop(0, 'rgba(255, 247, 198, 0.98)');
      core.addColorStop(0.28, 'rgba(255, 207, 106, 0.74)');
      core.addColorStop(1, 'rgba(255, 153, 94, 0)');
      context.globalAlpha = 1;
      context.fillStyle = core;
      context.beginPath();
      context.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      context.fill();

      for (const particle of particles) {
        const formation = getFormationProgress(timestamp, particle.formationDelay);
        const targetRadius = Math.max(0, Math.min(1, particle.radius + particle.radialOffset));
        const radialPosition = targetRadius * formation;
        const angle = particle.arm * (Math.PI * 2 / ARM_COUNT)
          + radialPosition * SPIRAL_TWIST
          + particle.angleOffset
          + rotation;
        const orbitX = Math.cos(angle) * radiusX * radialPosition;
        const orbitY = Math.sin(angle) * radiusY * radialPosition;
        const x = centerX + orbitX * tiltCos - orbitY * tiltSin;
        const y = centerY + orbitX * tiltSin + orbitY * tiltCos;
        const twinkle = 0.48 + (Math.sin(timestamp * 0.0015 + particle.phase) + 1) * 0.25;
        const glowSize = 4.5 + particle.size * 3.5;

        context.globalAlpha = twinkle * formation;
        context.drawImage(
          glowSprites[particle.color],
          x - glowSize / 2,
          y - glowSize / 2,
          glowSize,
          glowSize,
        );
        context.globalAlpha = Math.min(1, twinkle + 0.2) * formation;
        context.fillStyle = `rgb(${COLORS[particle.color].red}, ${COLORS[particle.color].green}, ${COLORS[particle.color].blue})`;
        context.beginPath();
        context.arc(x, y, particle.size * 0.55, 0, Math.PI * 2);
        context.fill();
      }

      for (const star of galaxyStars) {
        const formation = getFormationProgress(timestamp, star.formationDelay);
        const radialPosition = star.radius * formation;
        const angle = star.arm * (Math.PI * 2 / ARM_COUNT)
          + radialPosition * SPIRAL_TWIST
          + star.angleOffset
          + rotation;
        const orbitX = Math.cos(angle) * radiusX * radialPosition;
        const orbitY = Math.sin(angle) * radiusY * radialPosition;
        const x = centerX + orbitX * tiltCos - orbitY * tiltSin;
        const y = centerY + orbitX * tiltSin + orbitY * tiltCos;
        const glowSize = 13 + star.size * 4;

        context.globalAlpha = formation * (0.76 + Math.sin(timestamp * 0.001 + star.phase) * 0.16);
        context.drawImage(whiteGlow, x - glowSize / 2, y - glowSize / 2, glowSize, glowSize);
        context.fillStyle = '#fff';
        context.beginPath();
        context.arc(x, y, star.size * 0.82, 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 1;
      context.globalCompositeOperation = 'source-over';

      if (
        !hasNotifiedFormationComplete
        && (motionPreference.matches || timestamp - formationStartedAt >= FORMATION_COMPLETE_MS)
      ) {
        hasNotifiedFormationComplete = true;
        onFormationComplete();
      }
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const particleCount = Math.min(
        5000,
        Math.max(width < 600 ? 1500 : 2200, Math.round((width * height) / 210)),
      );
      particles = createGalaxyParticles(particleCount);
      backgroundStars = createBackgroundStars(150);
      galaxyStars = createGalaxyStars(34);
      draw(motionPreference.matches ? 0 : lastTimestamp);
    };

    const animate = (timestamp: number) => {
      lastTimestamp = timestamp;
      draw(timestamp);
      animationFrameId = window.requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (animationFrameId === null) {
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

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(resize);
    resizeObserver?.observe(canvas);
    if (!resizeObserver) window.addEventListener('resize', resize);
    motionPreference.addEventListener('change', updateMotionPreference);
    resize();
    if (!motionPreference.matches) startAnimation();

    return () => {
      resizeObserver?.disconnect();
      if (!resizeObserver) window.removeEventListener('resize', resize);
      motionPreference.removeEventListener('change', updateMotionPreference);
      if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId);
    };
  }, [onFormationComplete]);

  return <canvas ref={canvasRef} className="galaxy-background" aria-hidden="true" />;
};
