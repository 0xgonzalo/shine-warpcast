'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface AudioContextType {
  currentAudio: {
    src: string;
    name: string;
    artist?: string;
    image?: string;
    tokenId?: string;
    artistAddress?: string;
  } | null;
  isPlaying: boolean;
  queue: Array<{ src: string; name: string; artist?: string; image?: string; tokenId?: string; artistAddress?: string }>;
  playlist: Array<{ src: string; name: string; artist?: string; image?: string; tokenId?: string; artistAddress?: string }>;
  currentTime: number;
  duration: number;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setAudioElement: (element: HTMLAudioElement | null) => void;
  seekTo: (time: number) => void;
  playAudio: (src: string, name: string, artist?: string, image?: string, tokenId?: string, artistAddress?: string) => void;
  stopAudio: () => void;
  addToQueue: (src: string, name: string, artist?: string, image?: string, tokenId?: string, artistAddress?: string) => void;
  removeFromQueue: (index: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  setPlaylist: (playlist: Array<{ src: string; name: string; artist?: string; image?: string; tokenId?: string; artistAddress?: string }>) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentAudio, setCurrentAudio] = useState<{ src: string; name: string; artist?: string; image?: string; tokenId?: string; artistAddress?: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Array<{ src: string; name: string; artist?: string; image?: string; tokenId?: string; artistAddress?: string }>>([]);
  const [playlist, setPlaylist] = useState<Array<{ src: string; name: string; artist?: string; image?: string; tokenId?: string; artistAddress?: string }>>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const seekTo = useCallback((time: number) => {
    if (audioElement) {
      audioElement.currentTime = time;
      setCurrentTime(time);
    }
  }, [audioElement]);

  const playAudio = useCallback((src: string, name: string, artist?: string, image?: string, tokenId?: string, artistAddress?: string) => {
    // Helper function to extract IPFS hash from URL for comparison
    const getIPFSHash = (url: string): string | null => {
      const match = url.match(/\/ipfs\/([^/?#]+)/);
      return match ? match[1] : null;
    };

    const newHash = getIPFSHash(src);
    const currentHash = currentAudio?.src ? getIPFSHash(currentAudio.src) : null;
    const isSameContent = newHash && currentHash && newHash === currentHash;

    console.log('🎵 [AudioContext] playAudio called:', {
      newSrc: src,
      newName: name,
      currentSrc: currentAudio?.src,
      currentName: currentAudio?.name,
      newHash,
      currentHash,
      isSameContent,
      isPlaying
    });

    // If it's the same IPFS content (same hash)
    if (isSameContent) {
      // Check if metadata is different (different NFT with same audio)
      const isDifferentMetadata = currentAudio?.name !== name || currentAudio?.artist !== artist || currentAudio?.image !== image;

      if (isDifferentMetadata) {
        console.log('🎵 [AudioContext] Same IPFS content but different metadata, updating metadata and continuing playback');
        setCurrentAudio({ src, name, artist, image, tokenId, artistAddress });
        // Keep playing if already playing, otherwise keep paused
        return;
      } else {
        console.log('🎵 [AudioContext] Same IPFS content and metadata, toggling play/pause only');
        setIsPlaying(!isPlaying);
        return;
      }
    }

    // If it's a different audio, update the current audio and start playing
    console.log('🎵 [AudioContext] Different IPFS content detected, switching songs');
    setCurrentAudio({ src, name, artist, image, tokenId, artistAddress });
    setIsPlaying(true);
    setCurrentTime(0); // Reset time for new audio
  }, [currentAudio?.src, isPlaying]);

  const stopAudio = useCallback(() => {
    setIsPlaying(false);
    setCurrentAudio(null);
  }, []);

  const addToQueue = useCallback((src: string, name: string, artist?: string, image?: string, tokenId?: string, artistAddress?: string) => {
    setQueue(prev => [...prev, { src, name, artist, image, tokenId, artistAddress }]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  }, []);

  const playNext = useCallback(() => {
    // Helper function to extract IPFS hash from URL for comparison
    const getIPFSHash = (url: string): string | null => {
      const match = url.match(/\/ipfs\/([^/?#]+)/);
      return match ? match[1] : null;
    };

    // Check if there's a next track in the playlist
    if (currentAudio && playlist.length > 0) {
      const currentHash = getIPFSHash(currentAudio.src);
      const currentIndex = playlist.findIndex(track => {
        const trackHash = getIPFSHash(track.src);
        return trackHash && currentHash && trackHash === currentHash;
      });

      if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
        const nextTrack = playlist[currentIndex + 1];
        setCurrentAudio(nextTrack);
        setIsPlaying(true);
        setCurrentTime(0);
        return;
      }
    }

    // Fallback to queue if no playlist navigation
    if (queue.length > 0) {
      const [nextTrack, ...remainingQueue] = queue;
      setQueue(remainingQueue);
      setCurrentAudio(nextTrack);
      setIsPlaying(true);
    } else {
      stopAudio();
    }
  }, [queue, playlist, currentAudio, stopAudio]);

  const playPrevious = useCallback(() => {
    // Helper function to extract IPFS hash from URL for comparison
    const getIPFSHash = (url: string): string | null => {
      const match = url.match(/\/ipfs\/([^/?#]+)/);
      return match ? match[1] : null;
    };

    if (!currentAudio || playlist.length === 0) return;

    const currentHash = getIPFSHash(currentAudio.src);
    const currentIndex = playlist.findIndex(track => {
      const trackHash = getIPFSHash(track.src);
      return trackHash && currentHash && trackHash === currentHash;
    });

    if (currentIndex > 0) {
      const previousTrack = playlist[currentIndex - 1];
      setCurrentAudio(previousTrack);
      setIsPlaying(true);
      setCurrentTime(0);
    }
  }, [currentAudio, playlist]);

  return (
    <AudioContext.Provider
      value={{
        currentAudio,
        isPlaying,
        queue,
        playlist,
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
        playPrevious,
        setPlaylist,
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