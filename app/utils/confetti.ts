import confetti from 'canvas-confetti';

export interface ConfettiOptions {
  canvas?: HTMLCanvasElement;
  duration?: number;
  colors?: string[];
  particleCount?: number;
}

export const prideConfettiColors = [
  '#8B5CF6', // Purple
  '#A855F7', // Purple-500
  '#9333EA', // Violet-600
  '#7C3AED', // Violet-700
  '#6D28D9', // Violet-800
  '#5B21B6', // Violet-900
  '#E879F9', // Fuchsia-400
  '#D946EF', // Fuchsia-500
];

export const triggerPrideConfetti = (options: ConfettiOptions = {}) => {
  const {
    canvas,
    duration = 3000,
    colors = prideConfettiColors,
    particleCount = 100
  } = options;

  if (!canvas) {
    console.warn('Canvas element is required for confetti animation');
    return;
  }

  const myConfetti = confetti.create(canvas, {
    resize: true,
    useWorker: true,
  });

  // Multiple bursts for pride effect
  const animationEnd = Date.now() + duration;
  const defaults = { 
    startVelocity: 30, 
    spread: 360, 
    ticks: 60, 
    zIndex: 0,
    colors: colors
  };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const currentParticleCount = 50 * (timeLeft / duration);

    // Left side burst
    myConfetti({
      ...defaults,
      particleCount: currentParticleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    });

    // Right side burst
    myConfetti({
      ...defaults,
      particleCount: currentParticleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    });
  }, 250);

  // Center burst
  myConfetti({
    ...defaults,
    particleCount,
    origin: { x: 0.5, y: 0.5 }
  });

  // Return cleanup function
  return () => clearInterval(interval);
};

export const triggerCelebrationConfetti = (canvas: HTMLCanvasElement) => {
  return triggerPrideConfetti({
    canvas,
    duration: 3000,
    colors: prideConfettiColors,
    particleCount: 100
  });
}; 