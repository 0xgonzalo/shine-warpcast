// Using react-canvas-confetti instead of canvas-confetti
// This will be used with the ConfettiCanvas component from react-canvas-confetti

export interface ConfettiOptions {
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

// Brand color palette (primary: #0000FE)
export const brandConfettiColors = ['#0000FE'];

export const defaultConfettiConfig = {
  startVelocity: 30,
  spread: 360,
  ticks: 60,
  zIndex: 0,
  particleCount: 100,
  origin: { x: 0.5, y: 0.5 },
  colors: prideConfettiColors
};

// Configuration for pride confetti animation
export const getPrideConfettiConfig = (options: ConfettiOptions = {}) => {
  const {
    duration = 3000,
    colors = prideConfettiColors,
    particleCount = 100
  } = options;

  return {
    ...defaultConfettiConfig,
    particleCount,
    colors,
    duration
  };
};

// Configuration for celebration confetti (brand color)
export const getCelebrationConfettiConfig = () => {
  return getPrideConfettiConfig({
    duration: 3000,
    colors: brandConfettiColors,
    particleCount: 100
  });
};

// Helper function to create multiple bursts
export const createMultipleBursts = (confettiFunction: any, options: ConfettiOptions = {}) => {
  const { duration = 3000 } = options;
  const animationEnd = Date.now() + duration;
  
  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const currentParticleCount = 50 * (timeLeft / duration);

    // Left side burst
    confettiFunction({
      ...defaultConfettiConfig,
      particleCount: currentParticleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: brandConfettiColors,
    });

    // Right side burst
    confettiFunction({
      ...defaultConfettiConfig,
      particleCount: currentParticleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: brandConfettiColors,
    });
  }, 250);

  // Center burst
  confettiFunction({
    ...defaultConfettiConfig,
    ...getPrideConfettiConfig({ colors: brandConfettiColors, duration }),
  });

  return () => clearInterval(interval);
}; 