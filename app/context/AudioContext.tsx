'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface AudioContextType {
  currentAudio: {
    src: string;
    name: string;
  } | null;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  playAudio: (src: string, name: string) => void;
  stopAudio: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentAudio, setCurrentAudio] = useState<{ src: string; name: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = useCallback((src: string, name: string) => {
    // If it's the same audio, just update the state
    if (currentAudio?.src === src) {
      setIsPlaying(!isPlaying);
      return;
    }

    // If it's a different audio, update the current audio and start playing
    setCurrentAudio({ src, name });
    setIsPlaying(true);
  }, [currentAudio?.src, isPlaying]);

  const stopAudio = useCallback(() => {
    setIsPlaying(false);
    setCurrentAudio(null);
  }, []);

  return (
    <AudioContext.Provider
      value={{
        currentAudio,
        isPlaying,
        setIsPlaying,
        playAudio,
        stopAudio,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
} 