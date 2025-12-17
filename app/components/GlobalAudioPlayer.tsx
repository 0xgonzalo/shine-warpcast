'use client';

import { useAudio } from '../context/AudioContext';
import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';
import { getAllIPFSGatewayURLs } from '../utils/pinata';

const FOOTER_NAV_HEIGHT_CLASS = 'bottom-[4rem]';
const FOOTER_NAV_BREAKPOINT = 'md';

export default function GlobalAudioPlayer() {
  const { isDarkMode } = useTheme();
  const { currentAudio, isPlaying, setIsPlaying, queue, playNext, playPrevious, removeFromQueue, setCurrentTime, setDuration, setAudioElement } = useAudio();
  const audioRef = useRef<HTMLAudioElement>(null);
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
      setCurrentTime(audio.currentTime);
    };

    const updateDuration = () => {
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
      setCurrentTime(0);
      setDuration(0);
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

  return (
    <div className={`fixed left-0 right-0 backdrop-blur-md border-t z-50 ${FOOTER_NAV_BREAKPOINT}:bottom-0 ${FOOTER_NAV_HEIGHT_CLASS} ${
      isDarkMode
        ? 'bg-[white]/10 border-gray-600'
        : 'bg-[#0066FF]/90 border-blue-400'
    }`}>
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
            <div className="flex items-center gap-2">
              {currentAudio.tokenId ? (
                <Link
                  href={`/token/${currentAudio.tokenId}`}
                  className="text-white font-medium text-sm truncate hover:underline cursor-pointer"
                >
                  {currentAudio.name}
                </Link>
              ) : (
                <div className="text-white font-medium text-sm truncate">
                  {currentAudio.name}
                </div>
              )}
              {isLoadingFallback && (
                <span className="text-xs text-gray-400">
                  (trying gateway {currentGatewayIndex + 1}...)
                </span>
              )}
            </div>
            <div className="text-xs">
              {currentAudio.artistAddress ? (
                <Link
                  href={`/profile/${currentAudio.artistAddress}`}
                  className="text-white hover:underline cursor-pointer"
                >
                  {currentAudio.artist || 'Unknown Artist'}
                </Link>
              ) : (
                <span className="text-white">{currentAudio.artist || 'Unknown Artist'}</span>
              )}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Previous Button */}
            <button
              onClick={playPrevious}
              disabled={isLoadingFallback}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isDarkMode
                  ? 'bg-white/10 text-white hover:bg-white/20 disabled:bg-gray-400'
                  : 'bg-gray-700 text-white hover:bg-gray-600 disabled:bg-gray-400'
              }`}
              aria-label="Previous track"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M15 4v12l-7-6 7-6zM5 4h2v12H5V4z" />
              </svg>
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              disabled={isLoadingFallback}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isDarkMode
                  ? 'bg-white text-black hover:bg-gray-200 disabled:bg-gray-400'
                  : 'bg-foreground text-white hover:bg-blue-600 disabled:bg-gray-400'
              }`}
              aria-label={isPlaying ? "Pause" : "Play"}
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

            {/* Next Button */}
            <button
              onClick={playNext}
              disabled={isLoadingFallback}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isDarkMode
                  ? 'bg-white/10 text-white hover:bg-white/20 disabled:bg-gray-400'
                  : 'bg-gray-700 text-white hover:bg-gray-600 disabled:bg-gray-400'
              }`}
              aria-label="Next track"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4v12l7-6-7-6zM13 4h2v12h-2V4z" />
              </svg>
            </button>
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