'use client';

import { useAudio } from '../context/AudioContext';
import { useRef, useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const FOOTER_NAV_HEIGHT_CLASS = 'bottom-[4rem]';
const FOOTER_NAV_BREAKPOINT = 'md';

export default function GlobalAudioPlayer() {
  const { isDarkMode } = useTheme();
  const { currentAudio, isPlaying, setIsPlaying, queue, playNext, removeFromQueue, setCurrentTime, setDuration, setAudioElement } = useAudio();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTimeState, setCurrentTimeState] = useState(0);
  const [duration, setDurationState] = useState(0);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // Handle play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((error: Error) => {
        console.error('Error playing audio:', error);
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
    if (!audioRef.current || !currentAudio) return;
    
    const audio = audioRef.current;
    setAudioElement(audio);
    
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

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      setAudioElement(null);
    };
  }, [currentAudio?.src, setCurrentTime, setDuration, setAudioElement, setIsPlaying, playNext]);

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
              <img 
                src={currentAudio.image} 
                alt={currentAudio.name}
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
            <div className="text-white font-medium text-sm truncate">{currentAudio.name}</div>
            <div className="text-white text-xs">{currentAudio.artist || 'Unknown Artist'}</div>
          </div>

          {/* Play Button */}
          <button
            onClick={togglePlay}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
              isDarkMode 
                ? 'bg-white text-black hover:bg-gray-200' 
                : 'bg-[#0000FE] text-white hover:bg-blue-600'
            }`}
          >
            {isPlaying ? (
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
          ref={audioRef}
          src={currentAudio.src}
          preload="none"
        />
      </div>
    </div>
  );
} 