'use client';

import { useAudio } from '../context/AudioContext';
import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { useTheme } from '../context/ThemeContext';
import { getAllIPFSGatewayURLs } from '../utils/pinata';

const FOOTER_NAV_HEIGHT_CLASS = 'bottom-[4rem]';
const FOOTER_NAV_BREAKPOINT = 'md';

export default function GlobalAudioPlayer() {
  const { isDarkMode } = useTheme();
  const { currentAudio, isPlaying, setIsPlaying, queue, playNext, removeFromQueue, setCurrentTime, setDuration, setAudioElement } = useAudio();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTimeState, setCurrentTimeState] = useState(0);
  const [duration, setDurationState] = useState(0);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [currentGatewayIndex, setCurrentGatewayIndex] = useState(0);
  const [isLoadingFallback, setIsLoadingFallback] = useState(false);

  // Function to try loading audio from different gateways
  const tryLoadAudioFromGateways = async (originalSrc: string) => {
    if (!audioRef.current) return;
    
    // Check if this is an IPFS URL that we can try with different gateways
    const isIPFS = originalSrc.includes('/ipfs/');
    if (!isIPFS) {
      console.log('🎵 [GlobalAudioPlayer] Not an IPFS URL, using original source');
      return;
    }

    // Extract the IPFS hash from the URL
    const ipfsHash = originalSrc.split('/ipfs/')[1];
    if (!ipfsHash) {
      console.log('🎵 [GlobalAudioPlayer] Could not extract IPFS hash');
      return;
    }

    const ipfsUri = `ipfs://${ipfsHash}`;
    const gatewayUrls = getAllIPFSGatewayURLs(ipfsUri);
    
    console.log('🎵 [GlobalAudioPlayer] Trying gateways:', gatewayUrls);

    for (let i = 0; i < gatewayUrls.length; i++) {
      const gatewayUrl = gatewayUrls[i];
      console.log(`🎵 [GlobalAudioPlayer] Trying gateway ${i + 1}/${gatewayUrls.length}: ${gatewayUrl}`);
      
      try {
        setIsLoadingFallback(true);
        setCurrentGatewayIndex(i);
        
        // Test if the URL is accessible
        const testResponse = await fetch(gatewayUrl, { 
          method: 'HEAD',
          mode: 'cors'
        });
        
        if (testResponse.ok) {
          console.log('🎵 [GlobalAudioPlayer] Gateway test successful, updating audio source');
          audioRef.current.src = gatewayUrl;
          audioRef.current.load();
          setIsLoadingFallback(false);
          return;
        }
      } catch (error) {
        console.log(`🎵 [GlobalAudioPlayer] Gateway ${i + 1} failed:`, error);
        continue;
      }
    }
    
    console.error('🎵 [GlobalAudioPlayer] All gateways failed');
    setIsLoadingFallback(false);
    setIsPlaying(false);
  };

  // Handle play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((error: Error) => {
        console.error('Error playing audio:', error);
        setIsPlaying(false); // Reset state if play fails
      });
      setIsPlaying(true);
    }
  };

  // Format time display
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTimeState(newTime);
  };

  // Setup audio element and event listeners
  useEffect(() => {
    console.log('🎵 [GlobalAudioPlayer] currentAudio changed:', currentAudio);
    
    if (!audioRef.current || !currentAudio) return;
    
    const audio = audioRef.current;
    setAudioElement(audio);
    
    // Only reload if the audio source actually changed
    const currentSrc = audio.src;
    const newSrc = currentAudio.src;
    
    // Extract IPFS hashes for comparison
    const getIPFSHash = (url: string): string | null => {
      const match = url.match(/\/ipfs\/([^/?#]+)/);
      return match ? match[1] : null;
    };
    
    const currentHash = getIPFSHash(currentSrc);
    const newHash = getIPFSHash(newSrc);
    const isDifferentContent = !currentHash || !newHash || currentHash !== newHash;
    
    if (isDifferentContent) {
      console.log('🎵 [GlobalAudioPlayer] Different audio content, loading new source:', newSrc);
      // Force load the new audio source
      audio.load();
    } else {
      console.log('🎵 [GlobalAudioPlayer] Same audio content, skipping reload. Only metadata changed.');
    }
    
    const updateTime = () => {
      setCurrentTimeState(audio.currentTime);
      setCurrentTime(audio.currentTime);
    };
    
    const updateDuration = () => {
      setDurationState(audio.duration);
      setDuration(audio.duration);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      playNext();
    };

    const handleCanPlay = () => {
      // Auto-play when audio is ready and isPlaying is true
      if (isPlaying) {
        audio.play().catch((error: Error) => {
          console.error('Error auto-playing audio:', error);
          setIsPlaying(false);
        });
      }
    };

    const handleLoadStart = () => {
      // Reset time and duration when loading starts
      setCurrentTimeState(0);
      setDurationState(0);
    };

    const handleError = () => {
      console.error('🎵 [GlobalAudioPlayer] Audio loading failed, trying fallback gateways');
      tryLoadAudioFromGateways(currentAudio.src);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('error', handleError);
      setAudioElement(null);
    };
  }, [currentAudio, setCurrentTime, setDuration, setAudioElement, setIsPlaying, playNext, isPlaying]);

  // Sync isPlaying state with audio element play/pause
  useEffect(() => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    
    if (isPlaying && audio.paused) {
      audio.play().catch((error: Error) => {
        console.error('Error syncing play state:', error);
        setIsPlaying(false);
      });
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [isPlaying, setIsPlaying]);

  if (!currentAudio) return null;

  const progressPercentage = duration ? (currentTimeState / duration) * 100 : 0;

  return (
    <div className={`fixed left-0 right-0 bg-[white]/10 backdrop-blur-md border-t border-gray-600 z-50 ${FOOTER_NAV_BREAKPOINT}:bottom-0 ${FOOTER_NAV_HEIGHT_CLASS}`}>
      <div className="max-w-full mx-auto px-4 py-2">
        {/* Queue Panel */}
        {isQueueOpen && queue.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 bg-[#2a2a2a] border border-gray-600 max-h-60 overflow-y-auto">
            <div className="flex items-center justify-between p-4">
              <h3 className="text-white font-medium">Queue</h3>
              <button
                onClick={() => setIsQueueOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 px-4 pb-4">
              {queue.map((track, index) => (
                <div
                  key={`${track.src}-${index}`}
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-700 transition-colors"
                >
                  <span className="text-white text-sm truncate flex-1">{track.name}</span>
                  <button
                    onClick={() => removeFromQueue(index)}
                    className="text-gray-400 hover:text-red-400 transition-colors p-1"
                    title="Remove from queue"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          {/* Album Art */}
          <div className="w-12 h-12 bg-gray-600 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
            {currentAudio.image ? (
              <Image 
                src={currentAudio.image} 
                alt={currentAudio.name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            )}
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium text-sm truncate flex items-center gap-2">
              {currentAudio.name}
              {isLoadingFallback && (
                <span className="text-xs text-gray-400">
                  (trying gateway {currentGatewayIndex + 1}...)
                </span>
              )}
            </div>
            <div className="text-white text-xs">{currentAudio.artist || 'Unknown Artist'}</div>
          </div>

          {/* Play Button */}
          <button
            onClick={togglePlay}
            disabled={isLoadingFallback}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
              isDarkMode 
                ? 'bg-white text-black hover:bg-gray-200 disabled:bg-gray-400' 
                : 'bg-[#0000FE] text-white hover:bg-blue-600 disabled:bg-gray-400'
            }`}
          >
            {isLoadingFallback ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity="0.25"/>
                <path d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"/>
              </svg>
            ) : isPlaying ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* Progress Bar */}
          <div className="flex-1 max-w-md flex items-center gap-2">
            <span className="text-xs text-gray-400 min-w-[35px]">{formatTime(currentTimeState)}</span>
            <div 
              className="flex-1 h-1 bg-gray-600 rounded-full cursor-pointer relative"
              onClick={handleProgressClick}
            >
              <div 
                className={`h-full rounded-full relative ${
                  isDarkMode ? 'bg-white' : 'bg-[#0000FE]'
                }`}
                style={{ width: `${progressPercentage}%` }}
              >
                <div className={`absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${
                  isDarkMode ? 'bg-white' : 'bg-[#0000FE]'
                }`}></div>
              </div>
            </div>
            <span className="text-xs text-gray-400 min-w-[35px]">{formatTime(duration)}</span>
          </div>

          {/* Queue Button */}
          {queue.length > 0 && (
            <button
              onClick={() => setIsQueueOpen(!isQueueOpen)}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs flex-shrink-0"
            >
              <span>({queue.length})</span>
              <svg
                className={`w-4 h-4 transition-transform ${isQueueOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>
          )}
        </div>

        {/* Hidden Audio Element */}
        <audio
          key={currentAudio.src}
          ref={audioRef}
          src={currentAudio.src}
          preload="metadata"
        />
      </div>
    </div>
  );
} 