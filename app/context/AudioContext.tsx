'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface AudioContextType {
  currentAudio: {
    src: string;
    name: string;
    artist?: string;
    image?: string;
  } | null;
  isPlaying: boolean;
  queue: Array<{ src: string; name: string; artist?: string; image?: string }>;
  currentTime: number;
  duration: number;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setAudioElement: (element: HTMLAudioElement | null) => void;
  seekTo: (time: number) => void;
  playAudio: (src: string, name: string, artist?: string, image?: string) => void;
  stopAudio: () => void;
  addToQueue: (src: string, name: string, artist?: string, image?: string) => void;
  removeFromQueue: (index: number) => void;
  playNext: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentAudio, setCurrentAudio] = useState<{ src: string; name: string; artist?: string; image?: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Array<{ src: string; name: string; artist?: string; image?: string }>>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const seekTo = useCallback((time: number) => {
    if (audioElement) {
      audioElement.currentTime = time;
      setCurrentTime(time);
    }
  }, [audioElement]);

  const playAudio = useCallback((src: string, name: string, artist?: string, image?: string) => {
    // If it's the same audio, just update the state
    if (currentAudio?.src === src) {
      setIsPlaying(!isPlaying);
      return;
    }

    // If it's a different audio, update the current audio and start playing
    setCurrentAudio({ src, name, artist, image });
    setIsPlaying(true);
  }, [currentAudio?.src, isPlaying]);

  const stopAudio = useCallback(() => {
    setIsPlaying(false);
    setCurrentAudio(null);
  }, []);

  const addToQueue = useCallback((src: string, name: string, artist?: string, image?: string) => {
    setQueue(prev => [...prev, { src, name, artist, image }]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  }, []);

  const playNext = useCallback(() => {
    if (queue.length > 0) {
      const [nextTrack, ...remainingQueue] = queue;
      setQueue(remainingQueue);
      setCurrentAudio(nextTrack);
      setIsPlaying(true);
    } else {
      stopAudio();
    }
  }, [queue, stopAudio]);

  return (
    <AudioContext.Provider
      value={{
        currentAudio,
        isPlaying,
        queue,
        currentTime,
        duration,
        setIsPlaying,
        setCurrentTime,
        setDuration,
        setAudioElement,
        seekTo,
        playAudio,
        stopAudio,
        addToQueue,
        removeFromQueue,
        playNext,
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