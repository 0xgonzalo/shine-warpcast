'use client';

import { useAudio } from '../context/AudioContext';
import AudioPlayer, { RHAP_UI } from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { useRef, useEffect, useState } from 'react';

interface AudioPlayerInstance {
  audio: {
    current: HTMLAudioElement;
  };
  progressBar: HTMLDivElement;
  container: HTMLDivElement;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
}

export default function GlobalAudioPlayer() {
  const { currentAudio, isPlaying, setIsPlaying, stopAudio, queue, playNext, removeFromQueue } = useAudio();
  const playerRef = useRef<AudioPlayerInstance>(null);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // Sync the player's state with the context
  useEffect(() => {
    if (!playerRef.current?.audio?.current) return;

    if (isPlaying) {
      playerRef.current.audio.current.play().catch((error: Error) => {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      });
    } else {
      playerRef.current.audio.current.pause();
    }
  }, [isPlaying, setIsPlaying]);

  if (!currentAudio) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-white/10 p-4 z-50">
      <div className="max-w-4xl mx-auto relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium truncate">{currentAudio.name}</span>
            {queue.length > 0 && (
              <button
                onClick={() => setIsQueueOpen(!isQueueOpen)}
                className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <span>({queue.length} in queue)</span>
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
        </div>

        {/* Queue Panel */}
        {isQueueOpen && queue.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-black/90 backdrop-blur-sm rounded-lg border border-white/10 p-4 max-h-60 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
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
            <div className="space-y-2">
              {queue.map((track, index) => (
                <div
                  key={`${track.src}-${index}`}
                  className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors"
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

        <AudioPlayer
          ref={playerRef as any}
          src={currentAudio.src}
          autoPlay={false}
          autoPlayAfterSrcChange={true}
          showJumpControls={false}
          layout="stacked"
          customProgressBarSection={[
            RHAP_UI.PROGRESS_BAR,
            RHAP_UI.CURRENT_TIME,
            RHAP_UI.DURATION,
          ]}
          customControlsSection={[
            RHAP_UI.MAIN_CONTROLS,
            RHAP_UI.VOLUME_CONTROLS,
          ]}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={playNext}
          className="bg-transparent"
          preload="none"
        />
      </div>
    </div>
  );
} 